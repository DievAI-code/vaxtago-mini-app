"use client";

import { useState, useCallback, useEffect, useRef } from "react";
import { voiceService, VoiceLang, VoiceState, VoiceSettings, DEFAULT_VOICE_SETTINGS } from "@/services/voice/voiceService";
import { detectVoiceCommand, buildCommandAction, CommandAction, VoiceCommand } from "@/services/voice/voiceCommands";
import { toast } from "sonner";
import { useLanguage } from "@/context/LanguageProvider";
import type { Lang } from "@/i18n";

// Re-exports — чтобы VoiceSettings.tsx мог импортировать из этого хука
export { DEFAULT_VOICE_SETTINGS };
export type { VoiceLang, VoiceState, VoiceSettings };

export interface UseVoiceAssistantOptions {
  /** Что сделать с распознанным текстом */
  onCommand?: (text: string, action?: CommandAction) => void;
  /** Что озвучить */
  onSpeak?: (text: string, lang: VoiceLang) => void;
  /** Автоматически отправлять текст в AI */
  autoSendToAI?: boolean;
}

export interface UseVoiceAssistantReturn {
  state: VoiceState;
  isListening: boolean;
  isSpeaking: boolean;
  supported: boolean;
  hasPermission: boolean | null;
  partialText: string;
  finalText: string;
  settings: VoiceSettings;
  updateSettings: (partial: Partial<VoiceSettings>) => void;
  start: () => void;
  stop: () => void;
  toggle: () => void;
  speak: (text: string, lang?: VoiceLang) => void;
  cancelSpeak: () => void;
  continuousMode: boolean;
  setContinuousMode: (v: boolean) => void;
  processText: (text: string) => { command: VoiceCommand | null; action: CommandAction };
}

const STORAGE_KEY = "vaqta_voice_settings_v1";

function loadSettings(): VoiceSettings {
  if (typeof window === "undefined") return DEFAULT_VOICE_SETTINGS;
  try {
    const raw = localStorage.getItem(STORAGE_KEY);
    if (!raw) return DEFAULT_VOICE_SETTINGS;
    return { ...DEFAULT_VOICE_SETTINGS, ...JSON.parse(raw) };
  } catch {
    return DEFAULT_VOICE_SETTINGS;
  }
}

function saveSettings(s: VoiceSettings) {
  if (typeof window === "undefined") return;
  try { localStorage.setItem(STORAGE_KEY, JSON.stringify(s)); } catch { /* ignore */ }
}

export function useVoiceAssistant(opts: UseVoiceAssistantOptions = {}): UseVoiceAssistantReturn {
  const { language: appLang } = useLanguage();
  const [state, setState] = useState<VoiceState>("idle");
  const [isListening, setIsListening] = useState(false);
  const [isSpeaking, setIsSpeaking] = useState(false);
  const [supported, setSupported] = useState(false);
  const [hasPermission, setHasPermission] = useState<boolean | null>(null);
  const [partialText, setPartialText] = useState("");
  const [finalText, setFinalText] = useState("");
  const [settings, setSettings] = useState<VoiceSettings>(loadSettings);
  const [continuousMode, setContinuousMode] = useState(false);

  const onCommandRef = useRef(opts.onCommand);
  const onSpeakRef = useRef(opts.onSpeak);
  const autoSendRef = useRef(opts.autoSendToAI);
  const finalTextRef = useRef(finalText);
  const continuousModeRef = useRef(continuousMode);
  const appLangRef = useRef(appLang);

  useEffect(() => { onCommandRef.current = opts.onCommand; }, [opts.onCommand]);
  useEffect(() => { onSpeakRef.current = opts.onSpeak; }, [opts.onSpeak]);
  useEffect(() => { autoSendRef.current = opts.autoSendToAI; }, [opts.autoSendToAI]);
  useEffect(() => { finalTextRef.current = finalText; }, [finalText]);
  useEffect(() => { continuousModeRef.current = continuousMode; }, [continuousMode]);
  useEffect(() => { appLangRef.current = appLang; }, [appLang]);

  useEffect(() => {
    if (!voiceService) {
      setSupported(false);
      return;
    }
    setSupported(voiceService.isSupported());
    if (voiceService.isSTTSupported()) {
      voiceService.hasMicrophonePermission().then(setHasPermission).catch(() => setHasPermission(false));
    }
  }, []);

  useEffect(() => { saveSettings(settings); }, [settings]);

  const updateSettings = useCallback((partial: Partial<VoiceSettings>) => {
    setSettings((s) => ({ ...s, ...partial }));
  }, []);

  // Прерывание озвучки при начале речи
  useEffect(() => {
    if (!isListening) return;
    if (voiceService?.isSpeaking()) {
      voiceService.cancelSpeaking();
    }
  }, [isListening]);

  useEffect(() => {
    return () => {
      try { voiceService?.cancelSpeaking(); voiceService?.stopListening(); } catch { /* ignore */ }
    };
  }, []);

  const processText = useCallback((text: string) => {
    const command = detectVoiceCommand(text, appLangRef.current);
    if (command) {
      const action = buildCommandAction(command);
      return { command, action };
    }
    return { command: null, action: { type: "none" } as CommandAction };
  }, []);

  const start = useCallback(() => {
    if (!voiceService) {
      setState("unsupported");
      toast.error("Голос не поддерживается в этом браузере");
      return;
    }
    if (!voiceService.isSTTSupported()) {
      setState("unsupported");
      toast.error("Распознавание речи не поддерживается");
      return;
    }
    setPartialText("");
    setFinalText("");
    setState("recording");
    setIsListening(true);

    if (voiceService.isSpeaking()) voiceService.cancelSpeaking();

    voiceService.startListening({
      lang: settings.lang,
      useAppLang: true,
      singleShot: !continuousModeRef.current,
      onPartial: (text) => setPartialText(text),
      onFinal: (text) => {
        setFinalText(text);
        setState("processing");
        const { command, action } = processText(text);

        if (command && action.type !== "none") {
          onCommandRef.current?.(text, action);
        } else if (autoSendRef.current) {
          onCommandRef.current?.(text);
        }
        setState("idle");
        setIsListening(false);

        if (continuousModeRef.current) {
          setTimeout(() => start(), 600);
        }
      },
      onError: (err) => {
        setState("error");
        setIsListening(false);
        if (err !== "no-speech" && err !== "aborted") {
          if (err === "not-allowed" || err === "service-not-allowed") {
            toast.error("Доступ к микрофону запрещён");
            setHasPermission(false);
          } else {
            toast.error(`Ошибка распознавания: ${err}`);
          }
        }
      },
      onEnd: () => {
        setIsListening(false);
        if (state !== "processing") setState("idle");
      },
    });
  }, [settings.lang, processText]);

  const stop = useCallback(() => {
    voiceService?.stopListening();
    setIsListening(false);
    setState("idle");
  }, []);

  const toggle = useCallback(() => {
    if (isListening) stop();
    else start();
  }, [isListening, start, stop]);

  const speak = useCallback((text: string, lang?: VoiceLang) => {
    if (!voiceService) return;
    const useLang = lang || settings.lang;
    voiceService.speak(text, {
      lang: useLang,
      rate: settings.rate,
      pitch: settings.pitch,
      volume: settings.volume,
      onStart: () => setIsSpeaking(true),
      onEnd: () => setIsSpeaking(false),
      onError: () => setIsSpeaking(false),
    });
  }, [settings.lang, settings.rate, settings.pitch, settings.volume]);

  const cancelSpeak = useCallback(() => {
    voiceService?.cancelSpeaking();
    setIsSpeaking(false);
  }, []);

  return {
    state,
    isListening,
    isSpeaking,
    supported,
    hasPermission,
    partialText,
    finalText,
    settings,
    updateSettings,
    start,
    stop,
    toggle,
    speak,
    cancelSpeak,
    continuousMode,
    setContinuousMode,
    processText,
  };
}