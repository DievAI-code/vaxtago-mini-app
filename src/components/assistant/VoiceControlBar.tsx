"use client";

import { motion, AnimatePresence } from "framer-motion";
import { Mic, MicOff, Volume2, VolumeX, Waves, Loader2, AlertCircle, Check, Square, Radio } from "lucide-react";
import { useLanguage } from "@/context/LanguageProvider";
import { useState, useEffect } from "react";
import { useVoiceAssistant } from "@/hooks/useVoiceAssistant";
import { voiceService } from "@/services/voice/voiceService";
import { voiceDebug } from "@/services/voice/voiceDebug";
import { toast } from "sonner";
import { VoiceOfflineNotice } from "./VoiceOfflineNotice";

interface VoiceControlBarProps {
  /** Куда отправлять распознанный текст */
  onTranscript?: (text: string) => void;
  /** Что делать, если текст — это голосовая команда (например, "открой карту") */
  onCommand?: (action: { type: string; path?: string; url?: string; message?: string }) => void;
  /** Куда писать перевод ответа AI */
  onSpeak?: (text: string, lang: any) => void;
  /** Автоматически отправлять в AI (по умолчанию true) */
  autoSend?: boolean;
  /** Дополнительный CSS-класс */
  className?: string;
}

export function VoiceControlBar({ onTranscript, onCommand, onSpeak, autoSend = true, className = "" }: VoiceControlBarProps) {
  const { t } = useLanguage();
  const voice = useVoiceAssistant({
    onCommand: (text: string, action?: any) => {
      voiceDebug.log("Command Callback", { text, hasAction: !!action });

      // ALWAYS send the transcript to onTranscript (which calls handleSend)
      // This sends voice through the SAME pipeline as text input
      if (onTranscript) {
        onTranscript(text);
      }

      // Also call onCommand for action-based navigation (backward compat)
      if (onCommand && action && action.type !== "none") {
        onCommand(action);
      }
    },
    onSpeak: onSpeak,
    autoSendToAI: autoSend,
  });

  const { state, isListening, isSpeaking, supported, partialText, finalText, settings, toggle, continuousMode, setContinuousMode, speak, cancelSpeak } = voice;

  if (!supported) {
    return (
      <div className={`flex items-center gap-2 text-[10px] text-slate-500 ${className}`}>
        <MicOff size={14} className="text-slate-500" />
        <span>Голос не поддерживается</span>
      </div>
    );
  }

  return (
    <div className={`flex flex-col gap-1 ${className}`}>
      <div className="flex items-center gap-2">
        {/* Кнопка микрофона */}
        <motion.button
          type="button"
          whileTap={{ scale: 0.92 }}
          onClick={toggle}
          className="relative p-2.5 rounded-full transition-colors"
          style={{
            background: isListening
              ? "rgba(239,68,68,0.15)"
              : "rgba(255,255,255,0.05)",
            color: isListening ? "#f87171" : "#94A3B8",
            border: `1px solid ${isListening ? "rgba(239,68,68,0.4)" : "rgba(255,255,255,0.1)"}`,
          }}
          aria-label={isListening ? "Стоп" : "Говорить"}
          title={isListening ? "Остановить запись" : "Нажмите и говорите"}
        >
          {isListening && (
            <>
              <motion.span
                className="absolute inset-0 rounded-full border-2 border-red-400"
                animate={{ scale: [1, 1.8], opacity: [0.6, 0] }}
                transition={{ duration: 1.4, repeat: Infinity }}
              />
              <motion.span
                className="absolute inset-0 rounded-full border-2 border-red-400"
                animate={{ scale: [1, 1.4], opacity: [0.8, 0] }}
                transition={{ duration: 1.4, repeat: Infinity, delay: 0.5 }}
              />
            </>
          )}
          {state === "processing" ? (
            <Loader2 size={18} className="animate-spin" />
          ) : isListening ? (
            <Square size={16} className="fill-current" />
          ) : (
            <Mic size={18} />
          )}
        </motion.button>

        {/* Live partial / status */}
        <AnimatePresence mode="wait">
          {isListening && partialText ? (
            <motion.div
              key="partial"
              initial={{ opacity: 0, x: -6 }}
              animate={{ opacity: 1, x: 0 }}
              exit={{ opacity: 0, x: 6 }}
              className="flex-1 min-w-0 px-3 py-1.5 rounded-2xl bg-red-500/10 border border-red-500/20"
            >
              <div className="flex items-center gap-1.5 text-[10px] text-red-300 font-black uppercase tracking-widest">
                <Waves size={10} className="animate-pulse" />
                <span>Слышу</span>
              </div>
              <p className="text-xs text-white truncate">{partialText}</p>
            </motion.div>
          ) : isSpeaking ? (
            <motion.div
              key="speaking"
              initial={{ opacity: 0 }}
              animate={{ opacity: 1 }}
              exit={{ opacity: 0 }}
              className="flex-1 flex items-center gap-2 text-[10px] text-[#0AA86E] font-black uppercase tracking-widest"
            >
              <Volume2 size={14} className="animate-pulse" />
              <span>Озвучиваю…</span>
            </motion.div>
          ) : finalText ? (
            <motion.div
              key="final"
              initial={{ opacity: 0 }}
              animate={{ opacity: 1 }}
              exit={{ opacity: 0 }}
              className="flex-1 min-w-0 px-3 py-1.5 rounded-2xl bg-[#0AA86E]/10 border border-[#0AA86E]/20"
            >
              <div className="flex items-center gap-1.5 text-[10px] text-[#0AA86E] font-black uppercase tracking-widest">
                <Check size={10} />
                <span>Распознано</span>
              </div>
              <p className="text-xs text-white truncate">{finalText}</p>
            </motion.div>
          ) : (
            <motion.div
              key="idle"
              initial={{ opacity: 0 }}
              animate={{ opacity: 1 }}
              className="flex-1 text-[10px] text-slate-500 font-black uppercase tracking-widest"
            >
              {state === "error" ? (
                <span className="flex items-center gap-1.5 text-red-400">
                  <AlertCircle size={12} /> Ошибка микрофона
                </span>
              ) : (
                <span>Нажмите для голоса</span>
              )}
            </motion.div>
          )}
        </AnimatePresence>

        {/* Кнопка непрерывного диалога */}
        <motion.button
          type="button"
          whileTap={{ scale: 0.92 }}
          onClick={() => setContinuousMode(!continuousMode)}
          className="p-2 rounded-full transition-colors"
          style={{
            background: continuousMode ? "rgba(10,168,110,0.15)" : "rgba(255,255,255,0.03)",
            color: continuousMode ? "#0AA86E" : "#5C7A6D",
          }}
          title={continuousMode ? "Непрерывный диалог ВКЛ" : "Включить непрерывный диалог"}
          aria-label="Непрерывный диалог"
        >
          <Radio size={14} />
        </motion.button>

        {/* Кнопка озвучки */}
        {finalText && (
          <motion.button
            type="button"
            whileTap={{ scale: 0.92 }}
            onClick={() => isSpeaking ? cancelSpeak() : speak(finalText)}
            className="p-2 rounded-full transition-colors"
            style={{
              background: isSpeaking ? "rgba(10,168,110,0.15)" : "rgba(255,255,255,0.03)",
              color: isSpeaking ? "#0AA86E" : "#94A3B8",
            }}
            title={isSpeaking ? "Стоп" : "Озвучить"}
            aria-label="Озвучить"
          >
            {isSpeaking ? <VolumeX size={14} /> : <Volume2 size={14} />}
          </motion.button>
        )}
      </div>
      <VoiceOfflineNotice />
    </div>
  );
}