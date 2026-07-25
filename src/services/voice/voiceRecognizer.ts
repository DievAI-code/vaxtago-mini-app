"use client";

import { voiceDebug } from "./voiceDebug";

export type RecognizerLang = "ru-RU" | "uz-UZ" | "en-US";
export type RecognizerState = "idle" | "listening" | "processing" | "error" | "unsupported";

export interface RecognizerOptions {
  lang?: RecognizerLang;
  onPartial?: (text: string) => void;
  onFinal?: (text: string) => void;
  onError?: (error: string) => void;
  onEnd?: () => void;
  continuous?: boolean;
}

export class VoiceRecognizer {
  private recognition: any = null;
  private state: RecognizerState = "idle";

  isSupported(): boolean {
    if (typeof window === "undefined") return false;
    const SR = (window as any).SpeechRecognition || (window as any).webkitSpeechRecognition;
    return Boolean(SR);
  }

  async hasPermission(): Promise<boolean> {
    if (typeof navigator === "undefined" || !navigator.mediaDevices) return false;
    try {
      const result = await navigator.permissions.query({ name: "microphone" as any });
      return result.state === "granted" || result.state === "prompt";
    } catch {
      try {
        const stream = await navigator.mediaDevices.getUserMedia({ audio: true });
        stream.getTracks().forEach((t) => t.stop());
        return true;
      } catch {
        return false;
      }
    }
  }

  start(opts: RecognizerOptions = {}): boolean {
    if (!this.isSupported()) {
      voiceDebug.log("Error", { message: "SpeechRecognition not supported" });
      opts.onError?.("UNSUPPORTED");
      return false;
    }

    if (this.recognition) {
      try { this.recognition.stop(); } catch {}
      this.recognition = null;
    }

    const SR = (window as any).SpeechRecognition || (window as any).webkitSpeechRecognition;
    const recognition = new SR();
    recognition.lang = opts.lang || "ru-RU";
    recognition.continuous = opts.continuous ?? false;
    recognition.interimResults = true;
    recognition.maxAlternatives = 1;

    let finalTranscript = "";

    recognition.onresult = (event: any) => {
      let interim = "";
      for (let i = event.resultIndex; i < event.results.length; i++) {
        const result = event.results[i];
        if (result.isFinal) {
          finalTranscript += result[0].transcript;
        } else {
          interim += result[0].transcript;
        }
      }
      if (interim) {
        opts.onPartial?.(interim);
        voiceDebug.log("Partial", { text: interim });
      }
      if (finalTranscript) {
        opts.onFinal?.(finalTranscript.trim());
        voiceDebug.log("Final", { text: finalTranscript.trim() });
        finalTranscript = "";
      }
    };

    recognition.onerror = (event: any) => {
      const err = event?.error || "UNKNOWN";
      this.state = "error";
      voiceDebug.log("Error", { error: err });
      if (err !== "no-speech" && err !== "aborted") {
        opts.onError?.(err);
      } else {
        opts.onEnd?.();
      }
    };

    recognition.onend = () => {
      this.recognition = null;
      this.state = "idle";
      opts.onEnd?.();
      voiceDebug.log("Recording", { started: false, reason: "onend" });
    };

    try {
      recognition.start();
      this.recognition = recognition;
      this.state = "listening";
      voiceDebug.log("Recording", { started: true, lang: recognition.lang });
      return true;
    } catch {
      opts.onError?.("START_FAILED");
      return false;
    }
  }

  stop() {
    if (this.recognition) {
      try { this.recognition.stop(); } catch {}
      this.recognition = null;
      this.state = "idle";
      voiceDebug.log("Recording", { started: false, reason: "manual" });
    }
  }

  getState(): RecognizerState {
    return this.state;
  }

  isListening(): boolean {
    return this.recognition !== null;
  }
}

let _instance: VoiceRecognizer | null = null;

export function getVoiceRecognizer(): VoiceRecognizer {
  if (!_instance) {
    _instance = new VoiceRecognizer();
  }
  return _instance;
}