import { useState } from "react";
import { motion, AnimatePresence } from "framer-motion";
import { Phone, ArrowRight, Check, Shield, Bot, Languages, FileText, MapPin, Sparkles } from "lucide-react";
import { useTranslation } from "react-i18next";
import { useApp } from "@/lib/theme";
import { VCareer, VDocument, VGlobal, VBrain } from "./icons/VaxtaGoIcons";

const COUNTRIES = [
  { code: "+998", flag: "🇺🇿", name: "Узбекистан" },
  { code: "+7", flag: "🇷🇺", name: "Россия" },
  { code: "+996", flag: "🇰🇬", name: "Кыргызстан" },
  { code: "+992", flag: "🇹🇯", name: "Таджикистан" },
  { code: "+374", flag: "🇦🇲", name: "Армения" },
];

const FEATURES = [
  { icon: <VCareer className="w-5 h-5" />, title: "Работа" },
  { icon: <VDocument className="w-5 h-5" />, title: "Документы" },
  { icon: <VGlobal className="w-5 h-5" />, title: "Переводы" },
  { icon: <VBrain className="w-5 h-5" />, title: "AI" },
];

export function AuthScreen({ onAuth }: { onAuth: () => void }) {
  const { t } = useTranslation();
  const { lang } = useApp();
  const [step, setStep] = useState<"phone" | "code">("phone");
  const [country, setCountry] = useState(COUNTRIES[0]);
  const [phone, setPhone] = useState("");
  const [code, setCode] = useState("");
  const [showCountries, setShowCountries] = useState(false);

  const handlePhoneSubmit = () => { if (phone.length < 9) return; setStep("code"); };
  const handleCodeSubmit = () => { if (code.length < 4) return; onAuth(); };

  return (
    <div className="min-h-screen bg-gradient-to-br from-slate-900 via-blue-900 to-purple-900 flex flex-col">
      <div className="flex-1 flex items-center justify-center p-4">
        <motion.div initial={{ opacity: 0, y: 20 }} animate={{ opacity: 1, y: 0 }} transition={{ duration: 0.5 }} className="w-full max-w-md">
          <AnimatePresence mode="wait">
            {step === "phone" ? (
              <motion.div key="phone" initial={{ opacity: 0, x: -20 }} animate={{ opacity: 1, x: 0 }} exit={{ opacity: 0, x: -20 }} className="bg-white/10 backdrop-blur-xl rounded-3xl p-8 border border-white/20 shadow-2xl">
                <div className="text-center mb-8">
                  <div className="w-16 h-16 mx-auto rounded-2xl bg-gradient-to-br from-blue-600 to-purple-500 flex items-center justify-center mb-4">
                    <span className="text-2xl font-black text-white">V</span>
                  </div>
                  <h1 className="text-2xl font-bold text-white mb-2">VaxtaGo 2.0</h1>
                  <p className="text-sm text-white/70">Ваш умный помощник в работе и жизни</p>
                </div>
                <div className="grid grid-cols-4 gap-3 mb-6">
                  {FEATURES.map((f, i) => (
                    <motion.div key={i} initial={{ opacity: 0, y: 10 }} animate={{ opacity: 1, y: 0 }} transition={{ delay: 0.1 * i }} className="flex flex-col items-center gap-1 p-3 rounded-xl bg-white/5 border border-white/10">
                      <div className="text-blue-400">{f.icon}</div>
                      <span className="text-[10px] text-white/80">{f.title}</span>
                    </motion.div>
                  ))}
                </div>
                <div className="space-y-4">
                  <div className="relative">
                    <div className="flex items-center gap-2 bg-white/10 rounded-2xl p-3 border border-white/20">
                      <button onClick={() => setShowCountries(!showCountries)} className="flex items-center gap-2 px-3 py-2 rounded-xl bg-white/10 hover:bg-white/20 transition-colors">
                        <span className="text-lg">{country.flag}</span>
                        <span className="text-white font-medium">{country.code}</span>
                        <ArrowRight className="w-4 h-4 text-white/60 rotate-90" />
                      </button>
                      <input type="tel" value={phone} onChange={(e) => setPhone(e.target.value.replace(/\D/g, ""))} placeholder="Номер телефона" className="flex-1 bg-transparent text-white placeholder-white/50 outline-none text-lg" />
                    </div>
                    {showCountries && (
                      <motion.div initial={{ opacity: 0, y: -10 }} animate={{ opacity: 1, y: 0 }} className="absolute top-full left-0 right-0 mt-2 bg-slate-800 rounded-2xl border border-white/20 shadow-xl z-10">
                        {COUNTRIES.map((c) => (
                          <button key={c.code} onClick={() => { setCountry(c); setShowCountries(false); }} className="w-full flex items-center gap-3 px-4 py-3 text-white hover:bg-white/10 transition-colors first:rounded-t-2xl last:rounded-b-2xl">
                            <span className="text-lg">{c.flag}</span>
                            <span className="font-medium">{c.name}</span>
                            <span className="ml-auto text-white/60">{c.code}</span>
                          </button>
                        ))}
                      </motion.div>
                    )}
                  </div>
                  <motion.button whileHover={{ scale: 1.02 }} whileTap={{ scale: 0.98 }} onClick={handlePhoneSubmit} disabled={phone.length < 9} className="w-full py-4 rounded-2xl bg-gradient-to-r from-blue-600 to-purple-500 text-white font-semibold text-lg disabled:opacity-50 disabled:cursor-not-allowed hover:shadow-lg transition-all">
                    Войти по номеру телефона
                  </motion.button>
                </div>
              </motion.div>
            ) : (
              <motion.div key="code" initial={{ opacity: 0, x: 20 }} animate={{ opacity: 1, x: 0 }} exit={{ opacity: 0, x: 20 }} className="bg-white/10 backdrop-blur-xl rounded-3xl p-8 border border-white/20 shadow-2xl">
                <div className="text-center mb-8">
                  <div className="w-16 h-16 mx-auto rounded-2xl bg-gradient-to-br from-blue-600 to-purple-500 flex items-center justify-center mb-4">
                    <Phone className="w-8 h-8 text-white" />
                  </div>
                  <h1 className="text-2xl font-bold text-white mb-2">Введите код</h1>
                  <p className="text-sm text-white/70">SMS-код на номер {country.code} {phone}</p>
                </div>
                <input type="text" value={code} onChange={(e) => setCode(e.target.value.replace(/\D/g, ""))} placeholder="••••" maxLength={6} className="w-full text-center text-3xl font-bold tracking-widest bg-white/10 rounded-2xl p-4 border border-white/20 text-white placeholder-white/30 outline-none focus:border-blue-400" />
                <motion.button whileHover={{ scale: 1.02 }} whileTap={{ scale: 0.98 }} onClick={handleCodeSubmit} disabled={code.length < 4} className="w-full mt-4 py-4 rounded-2xl bg-gradient-to-r from-blue-600 to-purple-500 text-white font-semibold text-lg disabled:opacity-50 disabled:cursor-not-allowed hover:shadow-lg transition-all">
                  Подтвердить
                </motion.button>
                <button onClick={() => setStep("phone")} className="w-full py-2 text-sm text-white/60 hover:text-white transition-colors">Изменить номер</button>
              </motion.div>
            )}
          </AnimatePresence>
        </motion.div>
      </div>
      <div className="p-4 text-center">
        <p className="text-xs text-white/50">Founder: Диев Дмитрий Сергеевич</p>
      </div>
    </div>
  );
}