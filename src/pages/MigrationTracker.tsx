"use client";

import { useState } from "react";
import { Header } from "@/components/Header";
import { BottomNav } from "@/components/BottomNav";
import { Calendar, ShieldAlert, CheckCircle, Clock, DollarSign, Calculator } from "lucide-react";
import { useLanguage } from "@/context/LanguageProvider";
import { motion } from "framer-motion";
import { toast } from "sonner";

const REGIONAL_TAXES = [
  { city: "Москва и Подмосковье", cost: "7 500 ₽" },
  { city: "Санкт-Петербург и ЛО", cost: "4 600 ₽" },
  { city: "Екатеринбург (Свердловская обл)", cost: "6 900 ₽" },
  { city: "Новосибирск", cost: "5 200 ₽" },
  { city: "Казань (Татарстан)", cost: "5 400 ₽" },
];

export default function MigrationTracker() {
  const { t } = useLanguage();
  const [lastPaymentDate, setLastPaidDate] = useState<string>("");
  const [entryDate, setEntryDate] = useState<string>("");
  const [selectedRegion, setSelectedRegion] = useState(REGIONAL_TAXES[0]);

  // Расчет дней до оплаты
  const getDaysUntilPayment = () => {
    if (!lastPaymentDate) return null;
    const paid = new Date(lastPaymentDate);
    const nextDue = new Date(paid);
    nextDue.setDate(paid.getDate() + 30);
    
    const diff = Math.ceil((nextDue.getTime() - new Date().getTime()) / (1000 * 3600 * 24));
    return diff;
  };

  // Расчет оставшихся дней 90/180
  const getDaysRemaining90 = () => {
    if (!entryDate) return null;
    const entry = new Date(entryDate);
    const deadline = new Date(entry);
    deadline.setDate(entry.getDate() + 90);

    const diff = Math.ceil((deadline.getTime() - new Date().getTime()) / (1000 * 3600 * 24));
    return diff;
  };

  const daysLeft = getDaysUntilPayment();
  const stayLeft = getDaysRemaining90();

  return (
    <div className="flex flex-col min-h-screen bg-[#06140F] text-white pb-36">
      <Header title="tracker.title" showBack />

      <main className="p-6 space-y-6">
        {/* Заголовок модуля */}
        <div className="text-center space-y-2">
          <div className="w-16 h-16 rounded-3xl vaqta-gradient flex items-center justify-center mx-auto shadow-xl vaqta-glow">
            <Calendar size={32} />
          </div>
          <h2 className="text-xl font-black text-white">{t("tracker.title")}</h2>
          <p className="text-xs text-[#5C7A6D] font-medium">{t("tracker.subtitle")}</p>
        </div>

        {/* Индикатор статуса патента */}
        <div className="vaqta-glass p-6 border-[#1A3D2E] space-y-4">
          <h3 className="text-xs font-black uppercase tracking-widest text-[#00A86B] flex items-center gap-2">
            <Clock size={16} /> {t("tracker.last_paid")}
          </h3>

          <input
            type="date"
            value={lastPaymentDate}
            onChange={(e) => setLastPaidDate(e.target.value)}
            className="w-full h-14 bg-[#06140F] border border-[#1A3D2E] rounded-2xl px-4 text-sm font-bold text-white outline-none focus:border-[#00A86B]"
          />

          {daysLeft !== null && (
            <motion.div initial={{ opacity: 0, scale: 0.9 }} animate={{ opacity: 1, scale: 1 }} className={`p-4 rounded-2xl border flex items-center gap-4 ${
              daysLeft <= 3 ? "bg-red-500/10 border-red-500/30 text-red-400" : "bg-[#00A86B]/10 border-[#00A86B]/30 text-[#00A86B]"
            }`}>
              {daysLeft <= 3 ? <ShieldAlert size={28} /> : <CheckCircle size={28} />}
              <div>
                <p className="text-2xl font-black">{daysLeft} дней</p>
                <p className="text-[10px] uppercase tracking-wider font-bold">
                  {daysLeft <= 3 ? t("tracker.warning_status") : t("tracker.safe_status")}
                </p>
              </div>
            </motion.div>
          )}
        </div>

        {/* Калькулятор 90/180 */}
        <div className="vaqta-glass p-6 border-[#1A3D2E] space-y-4">
          <h3 className="text-xs font-black uppercase tracking-widest text-[#D4AF37] flex items-center gap-2">
            <Calculator size={16} /> {t("tracker.calculate_90")}
          </h3>

          <div className="space-y-2">
            <label className="text-[10px] uppercase font-bold text-[#5C7A6D]">{t("tracker.entry_date")}</label>
            <input
              type="date"
              value={entryDate}
              onChange={(e) => setEntryDate(e.target.value)}
              className="w-full h-14 bg-[#06140F] border border-[#1A3D2E] rounded-2xl px-4 text-sm font-bold text-white outline-none focus:border-[#D4AF37]"
            />
          </div>

          {stayLeft !== null && (
            <div className="p-4 bg-white/5 border border-white/10 rounded-2xl flex items-center justify-between">
              <span className="text-xs font-bold text-slate-300">{t("tracker.legal_days")}:</span>
              <span className={`text-lg font-black ${stayLeft <= 10 ? "text-red-400" : "text-[#D4AF37]"}`}>
                {stayLeft} дней
              </span>
            </div>
          )}
        </div>

        {/* Стоимость патента по регионам */}
        <div className="vaqta-glass p-6 border-[#1A3D2E] space-y-3">
          <h3 className="text-xs font-black uppercase tracking-widest text-slate-400 flex items-center gap-2">
            <DollarSign size={16} className="text-[#00A86B]" /> {t("tracker.monthly_tax")}
          </h3>

          <div className="space-y-2">
            {REGIONAL_TAXES.map((reg, i) => (
              <div key={i} className="p-3 bg-white/5 border border-white/5 rounded-2xl flex items-center justify-between">
                <span className="text-xs font-bold text-white">{reg.city}</span>
                <span className="text-xs font-black text-[#00A86B]">{reg.cost}</span>
              </div>
            ))}
          </div>
        </div>
      </main>

      <BottomNav />
    </div>
  );
}