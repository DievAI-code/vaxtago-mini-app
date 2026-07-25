"use client";

import { useState, useEffect } from "react";
import { motion } from "framer-motion";
import { 
  Mic, Volume2, Settings as SettingsIcon, Save, 
  TestTube2, Check, MicOff, Languages, Gauge, Music, Sparkles
} from "lucide-react";
import { Header } from "@/components/Header";
import { BottomNav } from "@/components/BottomNav";
import { useLanguage } from "@/context/LanguageProvider";
import { useVoiceAssistant, DEFAULT_VOICE_SETTINGS, VoiceLang } from "@/hooks/useVoiceAssistant";
import { voiceService } from "@/services/voice/voiceService";
import { toast } from "sonner";

const LANGS: { code: VoiceLang; label: string; flag: string }[] = [
  { code: "ru-RU", label: "Русский", flag: "🇷🇺" },
  { code: "uz-UZ", label: "O'zbekcha", flag: "🇺🇿" },
  { code: "en-US", label: "English", flag: "🇬🇧" },
  { code: "tg-TJ", label: "Тоҷикӣ", flag: "🇹🇯" },
  { code: "ky-KG", label: "Кыргызча", flag: "🇰🇬" },
];

export default function VoiceSettings() {
  const { t } = useLanguage();
  const voice = useVoiceAssistant();
  const supported = voiceService?.isSupported() ?? false;

  // Локальное состояние — сразу из voice.settings (источник истины — useVoiceAssistant + localStorage)
  const [lang, setLang] = useState<VoiceLang>(voice.settings.lang);
  const [rate, setRate] = useState<number>(voice.settings.rate);
  const [pitch, setPitch] = useState<number>(voice.settings.pitch);
  const [autoSpeak, setAutoSpeak] = useState<boolean>(voice.settings.autoSpeak);
  const [pushToTalk, setPushToTalk] = useState<boolean>(voice.settings.pushToTalk);

  // Синхронизация при изменении voice.settings (например, извне)
  useEffect(() => {
    setLang(voice.settings.lang);
    setRate(voice.settings.rate);
    setPitch(voice.settings.pitch);
    setAutoSpeak(voice.settings.autoSpeak);
    setPushToTalk(voice.settings.pushToTalk);
  }, [voice.settings.lang, voice.settings.rate, voice.settings.pitch, voice.settings.autoSpeak, voice.settings.pushToTalk]);

  const handleSave = () => {
    voice.updateSettings({ lang, rate, pitch, autoSpeak, pushToTalk });
    toast.success("Настройки голоса сохранены");
  };

  const testSpeak = () => {
    const samples: Record<VoiceLang, string> = {
      "ru-RU": "Привет! Я VAQTA AI. Голосовой помощник работает.",
      "uz-UZ": "Salom! Men VAQTA AI yordamchisiman. Ovoz ishlayapti.",
      "en-US": "Hello! I'm VAQTA AI. Voice assistant is working.",
      "tg-TJ": "Салом! Ман VAQTA AI ҳастам.",
      "ky-KG": "Салам! Мен VAQTA AI жардамчысымын.",
    };
    voice.speak(samples[lang], lang);
  };

  if (!supported) {
    return (
      <div className="flex flex-col min-h-screen bg-[#06140F] text-white pb-32">
        <Header title="settings.voice" showBack />
        <main className="p-6 space-y-4">
          <div className="vaqta-glass p-6 border-amber-500/30 bg-amber-500/5 text-center space-y-3">
            <MicOff className="mx-auto text-amber-400" size={48} />
            <h2 className="text-base font-black">Голосовые функции недоступны</h2>
            <p className="text-xs text-slate-400 leading-relaxed">
              Ваш браузер не поддерживает Web Speech API. Попробуйте Chrome, Safari или Edge.
            </p>
          </div>
        </main>
        <BottomNav />
      </div>
    );
  }

  return (
    <div className="flex flex-col min-h-screen bg-[#06140F] text-white pb-32">
      <Header title="settings.voice" showBack />

      <main className="p-5 space-y-5">
        {/* Status */}
        <section className="vaqta-glass p-5 border-[#0AA86E]/30 flex items-center gap-3">
          <div className="p-2.5 rounded-2xl bg-[#0AA86E]/15 text-[#0AA86E]">
            <Mic size={20} />
          </div>
          <div className="flex-1">
            <p className="text-xs font-black text-[#0AA86E] uppercase tracking-widest">Голос активен</p>
            <p className="text-[10px] text-[#5C7A6D] mt-0.5">Web Speech API поддерживается</p>
          </div>
          <Check className="text-[#0AA86E]" size={20} />
        </section>

        {/* Language */}
        <section className="space-y-3">
          <h3 className="text-[10px] font-black uppercase tracking-widest text-[#5C7A6D] ml-2 flex items-center gap-1.5">
            <Languages size={12} /> Язык распознавания и озвучки
          </h3>
          <div className="grid grid-cols-2 gap-2">
            {LANGS.map((l) => {
              const active = lang === l.code;
              return (
                <motion.button
                  key={l.code}
                  whileTap={{ scale: 0.97 }}
                  onClick={() => setLang(l.code)}
                  className={`vaqta-glass p-3 flex items-center gap-2 transition-all ${
                    active ? "border-[#0AA86E] bg-[#0AA86E]/10" : "border-[#1A3D2E]"
                  }`}
                >
                  <span className="text-xl">{l.flag}</span>
                  <span className="text-xs font-bold flex-1 text-left">{l.label}</span>
                  {active && <Check size={14} className="text-[#0AA86E]" />}
                </motion.button>
              );
            })}
          </div>
        </section>

        {/* Rate */}
        <section className="space-y-3">
          <h3 className="text-[10px] font-black uppercase tracking-widest text-[#5C7A6D] ml-2 flex items-center gap-1.5">
            <Gauge size={12} /> Скорость речи
          </h3>
          <div className="vaqta-glass p-5 border-[#1A3D2E] space-y-3">
            <div className="flex items-center justify-between">
              <span className="text-xs text-slate-400">0.5×</span>
              <span className="text-2xl font-black text-white">{rate.toFixed(1)}×</span>
              <span className="text-xs text-slate-400">2.0×</span>
            </div>
            <input
              type="range"
              min="0.5"
              max="2"
              step="0.1"
              value={rate}
              onChange={(e) => setRate(parseFloat(e.target.value))}
              className="w-full h-2 bg-[#1A3D2E] rounded-full appearance-none cursor-pointer accent-[#0AA86E]"
            />
          </div>
        </section>

        {/* Pitch */}
        <section className="space-y-3">
          <h3 className="text-[10px] font-black uppercase tracking-widest text-[#5C7A6D] ml-2 flex items-center gap-1.5">
            <Music size={12} /> Высота голоса
          </h3>
          <div className="vaqta-glass p-5 border-[#1A3D2E] space-y-3">
            <div className="flex items-center justify-between">
              <span className="text-xs text-slate-400">Низкий</span>
              <span className="text-2xl font-black text-white">{pitch.toFixed(1)}</span>
              <span className="text-xs text-slate-400">Высокий</span>
            </div>
            <input
              type="range"
              min="0"
              max="2"
              step="0.1"
              value={pitch}
              onChange={(e) => setPitch(parseFloat(e.target.value))}
              className="w-full h-2 bg-[#1A3D2E] rounded-full appearance-none cursor-pointer accent-[#0AA86E]"
            />
          </div>
        </section>

        {/* Toggles */}
        <section className="space-y-3">
          <h3 className="text-[10px] font-black uppercase tracking-widest text-[#5C7A6D] ml-2 flex items-center gap-1.5">
            <Sparkles size={12} /> Поведение
          </h3>

          <Toggle
            icon={<Volume2 size={18} />}
            color="text-[#0AA86E]"
            title="Авто-озвучка ответов AI"
            description="Каждый ответ ассистента проговаривается вслух"
            checked={autoSpeak}
            onChange={setAutoSpeak}
          />
          <Toggle
            icon={<Mic size={18} />}
            color="text-[#2563EB]"
            title="Push-to-talk"
            description="Один тап — запись, второй — отправка (удобно на мобильных)"
            checked={pushToTalk}
            onChange={setPushToTalk}
          />
        </section>

        {/* Test */}
        <button
          onClick={testSpeak}
          className="w-full h-14 vaqta-glass border-[#0AA86E]/30 flex items-center justify-center gap-2 text-sm font-black uppercase tracking-wider active:scale-95 transition-transform"
        >
          <TestTube2 size={18} className="text-[#0AA86E]" />
          <span>Тест озвучки</span>
        </button>

        {/* Save */}
        <button
          onClick={handleSave}
          className="w-full h-14 vaqta-gradient rounded-2xl font-black text-white text-sm uppercase tracking-wider flex items-center justify-center gap-2 shadow-xl vaqta-glow active:scale-95 transition-transform"
        >
          <Save size={18} />
          <span>Сохранить</span>
        </button>

        <p className="text-center text-[9px] text-[#5C7A6D] uppercase font-black tracking-widest">
          {t("copyright")}
        </p>
      </main>

      <BottomNav />
    </div>
  );
}

function Toggle({ icon, color, title, description, checked, onChange }: {
  icon: React.ReactNode;
  color: string;
  title: string;
  description: string;
  checked: boolean;
  onChange: (v: boolean) => void;
}) {
  return (
    <button
      onClick={() => onChange(!checked)}
      className="w-full vaqta-glass p-4 border-[#1A3D2E] flex items-center gap-3 active:scale-[0.99] transition-transform text-left"
    >
      <div className={`p-2.5 rounded-2xl bg-white/5 ${color}`}>{icon}</div>
      <div className="flex-1 min-w-0">
        <p className="text-xs font-black text-white">{title}</p>
        <p className="text-[10px] text-[#5C7A6D] mt-0.5 leading-snug">{description}</p>
      </div>
      <div
        className={`w-11 h-6 rounded-full p-0.5 transition-colors ${
          checked ? "bg-[#0AA86E]" : "bg-[#1A3D2E]"
        }`}
      >
        <motion.div
          animate={{ x: checked ? 20 : 0 }}
          transition={{ type: "spring", stiffness: 500, damping: 30 }}
          className="w-5 h-5 rounded-full bg-white shadow"
        />
      </div>
    </button>
  );
}