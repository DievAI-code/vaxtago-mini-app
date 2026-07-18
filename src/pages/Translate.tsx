import { useState } from "react";
import { motion } from "framer-motion";
import { ArrowLeftRight, Copy, Volume2, Globe } from "lucide-react";
import { Header } from "@/components/Header";
import { BottomNav } from "@/components/BottomNav";
import { Card } from "@/components/ui/Card";
import { Button } from "@/components/ui/Button";
import { VGlobal } from "@/components/icons/VaxtaGoIcons";
import { useTranslation } from "react-i18next";
import { FadeUp } from "@/components/animations";

const LANGS = [
  { code: "ru", label: "Русский", flag: "🇷🇺" },
  { code: "uz", label: "O'zbekcha", flag: "🇺🇿" },
  { code: "tg", label: "Тоҷикӣ", flag: "🇹🇯" },
  { code: "ky", label: "Кыргызча", flag: "🇰🇬" },
  { code: "en", label: "English", flag: "🇬🇧" },
];

export default function Translate() {
  const { t } = useTranslation();
  const [from, setFrom] = useState(LANGS[1]);
  const [to, setTo] = useState(LANGS[0]);
  const [text, setText] = useState("");
  const [translated, setTranslated] = useState("");

  const swap = () => {
    setFrom(to);
    setTo(from);
    setText(translated);
    setTranslated(text);
  };

  const translate = () => {
    if (!text.trim()) return;
    setTranslated("Таржима натижаси: " + text + " (переведено на " + to.label + ")");
  };

  return (
    <div className="flex flex-col h-[100dvh] bg-[#0F172A] text-white">
      <Header title="Переводчик" />
      
      <div className="flex-1 min-h-0 overflow-y-auto px-4 py-4">
        <FadeUp>
          <Card variant="gradient" className="mb-4">
            <div className="flex items-center justify-between mb-3">
              <button onClick={() => setFrom(LANGS[(LANGS.indexOf(from) + 1) % LANGS.length])} className="flex items-center gap-2 px-3 py-1.5 rounded-xl bg-slate-800/50">
                <span>{from.flag}</span>
                <span className="text-sm font-medium">{from.label}</span>
              </button>
              <button onClick={swap} className="p-2 rounded-full bg-slate-800/50 text-[#06B6D4] hover:scale-110 transition" aria-label="Swap">
                <ArrowLeftRight size={18} />
              </button>
              <button onClick={() => setTo(LANGS[(LANGS.indexOf(to) + 1) % LANGS.length])} className="flex items-center gap-2 px-3 py-1.5 rounded-xl bg-slate-800/50">
                <span>{to.flag}</span>
                <span className="text-sm font-medium">{to.label}</span>
              </button>
            </div>
            
            <textarea
              value={text}
              onChange={(e) => setText(e.target.value)}
              placeholder="Введите текст для перевода..."
              rows={4}
              className="w-full resize-none bg-slate-800/50 rounded-2xl p-4 text-sm text-white placeholder-slate-400 outline-none border border-slate-700"
            />
            
            <div className="flex items-center gap-2 mt-3">
              <button className="p-2 rounded-xl bg-slate-800/50 text-slate-400 hover:bg-slate-700/50 transition" aria-label="Speak"><Volume2 size={18} /></button>
              <button className="p-2 rounded-xl bg-slate-800/50 text-slate-400 hover:bg-slate-700/50 transition" aria-label="Copy"><Copy size={18} /></button>
              <div className="flex-1" />
              <Button size="sm" variant="primary" onClick={translate} disabled={!text.trim()}>Перевести</Button>
            </div>
          </Card>
        </FadeUp>

        {translated && (
          <FadeUp>
            <Card variant="default" className="mb-4">
              <div className="flex items-center gap-2 mb-2">
                <Globe className="w-5 h-5 text-[#06B6D4]" />
                <span className="text-sm font-medium text-slate-400">{to.label}</span>
              </div>
              <p className="text-sm text-white whitespace-pre-wrap">{translated}</p>
              <div className="flex items-center gap-2 mt-3">
                <button className="p-2 rounded-xl bg-slate-800/50 text-slate-400 hover:bg-slate-700/50 transition" aria-label="Speak"><Volume2 size={18} /></button>
                <button className="p-2 rounded-xl bg-slate-800/50 text-slate-400 hover:bg-slate-700/50 transition" aria-label="Copy"><Copy size={18} /></button>
              </div>
            </Card>
          </FadeUp>
        )}

        <FadeUp>
          <h3 className="text-lg font-bold mb-3 px-1">Популярные фразы</h3>
          <div className="space-y-2">
            {[
              "Где находится МВД?",
              "Помогите с патентом",
              "Сколько стоит аренда?",
              "Где получить регистрацию?",
            ].map((phrase, i) => (
              <Card key={i} variant="default" className="py-3 cursor-pointer hover:bg-slate-700/30" onClick={() => setText(phrase)}>
                <p className="text-sm">{phrase}</p>
              </Card>
            ))}
          </div>
        </FadeUp>
      </div>

      <BottomNav />
    </div>
  );
}