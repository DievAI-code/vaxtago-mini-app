"use client";

import { useState, useCallback, useEffect } from "react";
import { toast } from "sonner";

export function useVoiceAssistant(onCommand: (text: string) => void) {
  const [isListening, setIsListening] = useState(false);
  const [supported, setSupported] = useState(false);

  useEffect(() => {
    if (typeof window !== "undefined" && ("SpeechRecognition" in window || "webkitSpeechRecognition" in window)) {
      setSupported(true);
    }
  }, []);

  const toggleListening = useCallback(() => {
    if (!supported) {
      toast.error("Ваш браузер не поддерживает голосовой ввод");
      return;
    }

    const Recognition = (window as any).SpeechRecognition || (window as any).webkitSpeechRecognition;
    const recognition = new Recognition();
    
    recognition.lang = "ru-RU";
    recognition.continuous = false;
    recognition.interimResults = false;

    recognition.onstart = () => setIsListening(true);
    recognition.onend = () => setIsListening(false);
    
    recognition.onresult = (event: any) => {
      const text = event.results[0][0].transcript;
      if (text) {
        onCommand(text);
        toast.success(`Голосовая команда: "${text}"`);
      }
    };

    if (isListening) {
      recognition.stop();
    } else {
      recognition.start();
    }
  }, [supported, isListening, onCommand]);

  return { isListening, supported, toggleListening };
}