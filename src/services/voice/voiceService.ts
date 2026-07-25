"use client";

/**
 * Voice Service — единый шлюз к Web Speech API для VAQTA AI.
 * Без сторонних библиотек, работает на STT (распознавание) и TTS (синтез).
 *
 * Public API:
 *   - isSupported(): проверка поддержки браузером
 *   - hasMicrophonePermission(): запрос доступа к микрофону
 *   - startListening(opts): запуск STT; onResult(text, isFinal), onError, onEnd
 *   - stopListening(): остановить STT
 *   - speak(text, opts): TTS, opts: { lang, rate, pitch, volume, onEnd }
 *   - cancelSpeaking(): остановить TTS
 *   - isSpeaking(): bool
 *   - getVoices(): list of SpeechSynthesisVoice
 */

import type { Lang } from "@/i18n";

export type VoiceLang = "ru-RU" | "uz-UZ" | "en-US" | "tg-TJ" | "ky-KG";
export type VoiceState = "idle" | "recording" | "processing" | "error" | "unsupported";

export interface VoiceSettings {
  lang: VoiceLang;
  rate: number;       // 0.5 .. 2
  pitch: number;     // 0 .. 2
  volume: number;    // 0 .. 1
  autoSpeak: boolean; // автоматически озвучивать ответ AI
  pushToTalk: boolean; // push-to-talk режим (мобильный)
}

export const DEFAULT_VOICE_SETTINGS: VoiceSettings = {
  lang: "ru-RU",
  rate: 1,
  pitch: 1,
  volume: 1,
  autoSpeak: false,
  pushToTalk: true,
};

export interface ListenOptions {
  lang?: VoiceLang;
  /** Использовать язык, выбранный в настройках приложения */
  useAppLang?: boolean;
  /** Применить язык пользователя (если не выбран вручную) */
  fallback?: VoiceLang;
  /** Колбэки */
  onPartial?: (text: string) => void;
  onFinal?: (text: string) => void;
  onError?: (error: string) => void;
  onEnd?: () => void;
  /** Одноразовое распознавание (стоп после первого финала) */
  singleShot?: boolean;
}

export interface SpeakOptions {
  lang?: VoiceLang;
  rate?: number;
  pitch?: number;
  volume?: number;
  onStart?: () => void;
  onEnd?: () => void;
  onError?: (error: string) => void;
}

// Расширение типа для кросс-браузерного доступа
type AnyRecognition = any;

class VoiceService {
  private recognition: AnyRecognition | null = null;
  private synthesis: SpeechSynthesis | null = null;
  private currentVoice: SpeechSynthesisVoice | null = null;
  private voices: SpeechSynthesisVoice[] = [];
  private voicesLoaded = false;
  private currentUtterance: SpeechSynthesisUtterance | null = null;
  private intentionalStop = false;

  constructor() {
    if (typeof window !== "undefined") {
      const SR: any =
        (window as any).SpeechRecognition ||
        (window as any).webkitSpeechRecognition;
      this.synthesis = window.speechSynthesis || null;
      this.loadVoices();
      if (this.synthesis && typeof this.synthesis.onvoiceschanged !== "undefined") {
        this.synthesis.onvoiceschanged = () => this.loadVoices();
      }
    }
  }

  // ===== Поддержка =====

  isSupported(): boolean {
    if (typeof window === "undefined") return false;
    const SR = (window as any).SpeechRecognition || (window as any).webkitSpeechRecognition;
    return Boolean(SR) && Boolean(window.speechSynthesis);
  }

  isSTTSupported(): boolean {
    if (typeof window === "undefined") return false;
    const SR = (window as any).SpeechRecognition || (window as any).webkitSpeechRecognition;
    return Boolean(SR);
  }

  isTTSSupported(): boolean {
    return typeof window !== "undefined" && Boolean(window.speechSynthesis);
  }

  // ===== Микрофон =====

  async hasMicrophonePermission(): Promise<boolean> {
    if (typeof navigator === "undefined" || !navigator.mediaDevices) return false;
    try {
      const result = await navigator.permissions.query({ name: "microphone" as any });
      return result.state === "granted" || result.state === "prompt";
    } catch {
      // Fallback — пытаемся получить доступ
      try {
        const stream = await navigator.mediaDevices.getUserMedia({ audio: true });
        stream.getTracks().forEach((t) => t.stop());
        return true;
      } catch {
        return false;
      }
    }
  }

  // ===== Голоса =====

  private loadVoices() {
    if (!this.synthesis) return;
    this.voices = this.synthesis.getVoices();
    this.voicesLoaded = this.voices.length > 0;
  }

  getVoices(lang?: VoiceLang): SpeechSynthesisVoice[] {
    if (!this.voicesLoaded) this.loadVoices();
    if (!lang) return this.voices;
    const prefix = lang.split("-")[0].toLowerCase();
    return this.voices.filter((v) => v.lang.toLowerCase().startsWith(prefix));
  }

  private pickBestVoice(lang: VoiceLang): SpeechSynthesisVoice | null {
    const candidates = this.getVoices(lang);
    if (candidates.length === 0) return null;
    // Сначала exact match
    const exact = candidates.find((v) => v.lang.toLowerCase() === lang.toLowerCase());
    if (exact) return exact;
    // Затем local
    const local = candidates.find((v) => v.localService);
    if (local) return local;
    return candidates[0];
  }

  // ===== STT (распознавание) =====

  startListening(opts: ListenOptions = {}): boolean {
    if (typeof window === "undefined") return false;
    const SR: any =
      (window as any).SpeechRecognition || (window as any).webkitSpeechRecognition;
    if (!SR) {
      opts.onError?.("UNSUPPORTED");
      return false;
    }

    // Уже идёт запись — не запускаем второй раз
    if (this.recognition) {
      try { this.recognition.stop(); } catch { /* ignore */ }
      this.recognition = null;
    }

    const lang = opts.lang || opts.fallback || "ru-RU";
    const recognition = new SR();
    recognition.lang = lang;
    recognition.continuous = !opts.singleShot;
    recognition.interimResults = true;
    recognition.maxAlternatives = 1;

    let finalTranscript = "";

    recognition.onresult = (event: any) => {
      let interim = "";
      for (let i = event.resultIndex; i < event.results.length; ++i) {
        const result = event.results[i];
        if (result.isFinal) {
          finalTranscript += result[0].transcript;
        } else {
          interim += result[0].transcript;
        }
      }
      if (interim) opts.onPartial?.(interim);
      if (finalTranscript) {
        opts.onFinal?.(finalTranscript.trim());
        finalTranscript = "";
        if (opts.singleShot) {
          this.intentionalStop = true;
          try { recognition.stop(); } catch { /* ignore */ }
        }
      }
    };

    recognition.onerror = (event: any) => {
      const err = event?.error || "UNKNOWN";
      // 'no-speech' / 'aborted' не считаем ошибкой UI
      if (err !== "no-speech" && err !== "aborted") {
        opts.onError?.(err);
      } else {
        opts.onEnd?.();
      }
    };

    recognition.onend = () => {
      this.recognition = null;
      if (!this.intentionalStop) opts.onEnd?.();
      this.intentionalStop = false;
    };

    try {
      recognition.start();
      this.recognition = recognition;
      return true;
    } catch (e) {
      opts.onError?.("START_FAILED");
      return false;
    }
  }

  stopListening() {
    this.intentionalStop = true;
    if (this.recognition) {
      try { this.recognition.stop(); } catch { /* ignore */ }
      this.recognition = null;
    }
  }

  isListening(): boolean {
    return this.recognition !== null;
  }

  // ===== TTS (синтез) =====

  speak(text: string, opts: SpeakOptions = {}) {
    if (!this.synthesis || !text?.trim()) return false;
    // Прерываем предыдущее
    this.synthesis.cancel();

    const utterance = new SpeechSynthesisUtterance(text);
    const lang = opts.lang || "ru-RU";
    utterance.lang = lang;
    utterance.rate = opts.rate ?? 1;
    utterance.pitch = opts.pitch ?? 1;
    utterance.volume = opts.volume ?? 1;

    const voice = this.pickBestVoice(lang);
    if (voice) utterance.voice = voice;

    utterance.onstart = () => {
      opts.onStart?.();
    };
    utterance.onend = () => {
      this.currentUtterance = null;
      opts.onEnd?.();
    };
    utterance.onerror = (event: any) => {
      this.currentUtterance = null;
      if (event?.error !== "interrupted" && event?.error !== "canceled") {
        opts.onError?.(event?.error || "UNKNOWN");
      } else {
        opts.onEnd?.();
      }
    };

    this.currentUtterance = utterance;
    try {
      this.synthesis.speak(utterance);
      return true;
    } catch {
      this.currentUtterance = null;
      opts.onError?.("SPEAK_FAILED");
      return false;
    }
  }

  cancelSpeaking() {
    if (!this.synthesis) return;
    try {
      this.synthesis.cancel();
    } catch { /* ignore */ }
    this.currentUtterance = null;
  }

  isSpeaking(): boolean {
    return Boolean(this.synthesis?.speaking);
  }

  // ===== Утилиты =====

  /**
   * Преобразует код языка приложения (ru/uz/en) в BCP-47 (ru-RU/uz-UZ/en-US).
   */
  static appLangToBCP47(lang: Lang): VoiceLang {
    switch (lang) {
      case "uz": return "uz-UZ";
      case "en": return "en-US";
      case "ru": return "ru-RU";
      case "tj": return "tg-TJ";
      case "ky": return "ky-KG";
      default: return "ru-RU";
    }
  }

  /**
   * Грубая детекция языка распознанного текста.
   * Используется как fallback, если Web Speech сам не определил язык.
   */
  static detectTextLanguage(text: string): VoiceLang {
    if (!text || text.length < 2) return "ru-RU";
    const low = text.toLowerCase();
    // Узбекский кириллица: ў, қ, ғ, ҳ
    if (/[ўғқҳ]/i.test(text)) return "uz-UZ";
    // Узбекский латиница: специфические сочетания
    if (/\b(salom|rahmat|hayr|men|va|yoki|uchun)\b/i.test(low)) return "uz-UZ";
    // Только кириллица — скорее RU
    if (/[а-яё]/i.test(text) && !/[a-z]/i.test(text)) return "ru-RU";
    // Только латиница — скорее EN
    if (/[a-z]/i.test(text) && !/[а-яё]/i.test(text)) return "en-US";
    return "ru-RU";
  }
}

let _instance: VoiceService | null = null;

export function getVoiceService(): VoiceService {
  if (typeof window === "undefined") {
    // SSR-safe: возвращаем заглушку, которая ничего не делает
    return new VoiceService();
  }
  if (!_instance) _instance = new VoiceService();
  return _instance;
}

export const voiceService = typeof window !== "undefined" ? getVoiceService() : null;