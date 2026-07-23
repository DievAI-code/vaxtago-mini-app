"use client";

import { useState, useEffect } from "react";
import { Header } from "@/components/Header";
import { BottomNav } from "@/components/BottomNav";
import { 
  Zap, Scan, Map as MapIcon, Briefcase, Save, 
  Loader2, ShieldAlert, Sparkles, CheckCircle2,
  ToggleLeft, ToggleRight, Radio, ShieldCheck, History
} from "lucide-react";
import { subscription, AppSettings, PremiumMode } from "@/services/subscription";
import { supabase } from "@/integrations/supabase/client";
import { toast } from "sonner";
import { motion } from "framer-motion";

export default function AdminSettings() {
  const [loading, setLoading] = useState(true);
  const [saving, setSaving] = useState(false);
  const [settings, setSettings] = useState<AppSettings | null>(null);
  const [logs, setLogs] = useState<any[]>([]);

  useEffect(() => {
    loadSettings();
    loadLogs();
  }, []);

  const loadSettings = async () => {
    setLoading(true);
    const data = await subscription.getSettings(true);
    setSettings(data);
    setLoading(false);
  };

  const loadLogs = async () => {
    try {
      const { data } = await supabase
        .from("admin_logs")
        .select("*")
        .order("created_at", { ascending: false })
        .limit(10);

      setLogs(data || []);
    } catch (e) {
      console.error(e);
    }
  };

  const handleSave = async () => {
    if (!settings) return;
    setSaving(true);

    const success = await subscription.updateSettings(
      {
        premium_mode: settings.premium_mode,
        ai_limit_free: Number(settings.ai_limit_free),
        ocr_limit_free: Number(settings.ocr_limit_free),
        map_limit_free: Number(settings.map_limit_free),
        jobs_limit_free: Number(settings.jobs_limit_free),
      },
      `Founder changed limits & mode (${settings.premium_mode.toUpperCase()})`
    );

    setSaving(false);
    if (success) {
      toast.success("Настройки успешно сохранены!");
      loadLogs();
    } else {
      toast.error("Ошибка сохранения настроек");
    }
  };

  const toggleGlobalPremium = async (enable: boolean) => {
    const targetMode: PremiumMode = enable ? "all" : "off";
    setSaving(true);

    const success = await subscription.updateSettings(
      { premium_mode: targetMode },
      enable ? "Founder enabled global premium" : "Founder disabled global premium"
    );

    setSaving(false);
    if (success) {
      setSettings((prev) => prev ? { ...prev, premium_mode: targetMode } : null);
      toast.success(enable ? "🚀 Premium включен ДЛЯ ВСЕХ!" : "Premium переведен в стандартный режим");
      loadLogs();
    } else {
      toast.error("Ошибка изменения режима");
    }
  };

  if (loading || !settings) {
    return (
      <div className="min-h-screen bg-[#06140F] flex flex-col items-center justify-center text-white">
        <Loader2 className="animate-spin text-[#00A86B] mb-2" size={36} />
        <p className="text-xs font-black uppercase tracking-widest text-[#5C7A6D]">Loading Settings...</p>
      </div>
    );
  }

  return (
    <div className="flex flex-col min-h-screen bg-[#06140F] text-white pb-36">
      <Header title="Premium Settings" showBack />

      <main className="p-6 space-y-8">
        {/* Quick Test Controls */}
        <section className="vaqta-glass p-6 border-[#00A86B]/30 bg-gradient-to-br from-[#00A86B]/10 to-transparent space-y-4">
          <div className="flex items-center gap-2">
            <Sparkles className="text-[#00A86B]" size={20} />
            <h2 className="text-base font-black uppercase tracking-wider">🚀 Test Premium Mode</h2>
          </div>
          <p className="text-xs text-slate-300 font-medium">Быстрый переключатель доступа для тестирования приложения</p>

          <div className="grid grid-cols-2 gap-3 pt-2">
            <button
              onClick={() => toggleGlobalPremium(true)}
              className={`h-14 rounded-2xl font-black text-[11px] uppercase tracking-wider flex items-center justify-center gap-2 transition-all shadow-lg ${
                settings.premium_mode === "all"
                  ? "bg-[#00A86B] text-white vaqta-glow"
                  : "bg-white/5 border border-white/10 text-slate-300 hover:bg-white/10"
              }`}
            >
              <CheckCircle2 size={16} /> Enable For Everyone
            </button>

            <button
              onClick={() => toggleGlobalPremium(false)}
              className={`h-14 rounded-2xl font-black text-[11px] uppercase tracking-wider flex items-center justify-center gap-2 transition-all ${
                settings.premium_mode === "off"
                  ? "bg-red-500/20 border border-red-500/40 text-red-400"
                  : "bg-white/5 border border-white/10 text-slate-300 hover:bg-white/10"
              }`}
            >
              Disable For Everyone
            </button>
          </div>
        </section>

        {/* Premium Mode Radio Selection */}
        <section className="space-y-3">
          <h3 className="text-[10px] font-black uppercase tracking-widest text-[#5C7A6D] ml-2">
            Режим функционирования Premium
          </h3>

          <div className="space-y-2">
            <label
              onClick={() => setSettings({ ...settings, premium_mode: "off" })}
              className={`vaqta-glass p-4 border flex items-center justify-between cursor-pointer transition-all ${
                settings.premium_mode === "off"
                  ? "border-[#00A86B] bg-[#00A86B]/10"
                  : "border-[#1A3D2E] hover:bg-white/5"
              }`}
            >
              <div className="flex items-center gap-3">
                <Radio className={settings.premium_mode === "off" ? "text-[#00A86B]" : "text-slate-600"} size={20} />
                <div>
                  <p className="text-sm font-bold text-white">OFF (Стандартный)</p>
                  <p className="text-[10px] text-[#5C7A6D]">FREE пользователи зажаты лимитами. Premium — безлимит.</p>
                </div>
              </div>
            </label>

            <label
              onClick={() => setSettings({ ...settings, premium_mode: "selected" })}
              className={`vaqta-glass p-4 border flex items-center justify-between cursor-pointer transition-all ${
                settings.premium_mode === "selected"
                  ? "border-[#D4AF37] bg-[#D4AF37]/10"
                  : "border-[#1A3D2E] hover:bg-white/5"
              }`}
            >
              <div className="flex items-center gap-3">
                <Radio className={settings.premium_mode === "selected" ? "text-[#D4AF37]" : "text-slate-600"} size={20} />
                <div>
                  <p className="text-sm font-bold text-white">SELECTED USERS</p>
                  <p className="text-[10px] text-[#5C7A6D]">Премиум функции доступны только выбранным из базы админкой.</p>
                </div>
              </div>
            </label>

            <label
              onClick={() => setSettings({ ...settings, premium_mode: "all" })}
              className={`vaqta-glass p-4 border flex items-center justify-between cursor-pointer transition-all ${
                settings.premium_mode === "all"
                  ? "border-emerald-400 bg-emerald-500/10"
                  : "border-[#1A3D2E] hover:bg-white/5"
              }`}
            >
              <div className="flex items-center gap-3">
                <Radio className={settings.premium_mode === "all" ? "text-emerald-400" : "text-slate-600"} size={20} />
                <div>
                  <p className="text-sm font-bold text-white">ALL USERS (Полный безлимит)</p>
                  <p className="text-[10px] text-[#5C7A6D]">Абсолютно все пользователи получают все функции без ограничений.</p>
                </div>
              </div>
            </label>
          </div>
        </section>

        {/* Configurable Free Daily Limits */}
        <section className="space-y-3">
          <h3 className="text-[10px] font-black uppercase tracking-widest text-[#5C7A6D] ml-2">
            Дневные лимиты для Бесплатного тарифа (FREE)
          </h3>

          <div className="grid grid-cols-2 gap-3">
            <div className="vaqta-glass p-4 border-[#1A3D2E] space-y-2">
              <div className="flex items-center gap-2 text-[#00A86B]">
                <Zap size={16} />
                <span className="text-xs font-bold uppercase">AI Запросы</span>
              </div>
              <input
                type="number"
                value={settings.ai_limit_free}
                onChange={(e) => setSettings({ ...settings, ai_limit_free: parseInt(e.target.value) || 0 })}
                className="w-full h-12 bg-[#06140F] border border-[#1A3D2E] rounded-xl text-center font-black text-lg focus:border-[#00A86B] outline-none"
              />
            </div>

            <div className="vaqta-glass p-4 border-[#1A3D2E] space-y-2">
              <div className="flex items-center gap-2 text-purple-400">
                <Scan size={16} />
                <span className="text-xs font-bold uppercase">OCR Скан</span>
              </div>
              <input
                type="number"
                value={settings.ocr_limit_free}
                onChange={(e) => setSettings({ ...settings, ocr_limit_free: parseInt(e.target.value) || 0 })}
                className="w-full h-12 bg-[#06140F] border border-[#1A3D2E] rounded-xl text-center font-black text-lg focus:border-[#00A86B] outline-none"
              />
            </div>

            <div className="vaqta-glass p-4 border-[#1A3D2E] space-y-2">
              <div className="flex items-center gap-2 text-cyan-400">
                <MapIcon size={16} />
                <span className="text-xs font-bold uppercase">Карты / Маршруты</span>
              </div>
              <input
                type="number"
                value={settings.map_limit_free}
                onChange={(e) => setSettings({ ...settings, map_limit_free: parseInt(e.target.value) || 0 })}
                className="w-full h-12 bg-[#06140F] border border-[#1A3D2E] rounded-xl text-center font-black text-lg focus:border-[#00A86B] outline-none"
              />
            </div>

            <div className="vaqta-glass p-4 border-[#1A3D2E] space-y-2">
              <div className="flex items-center gap-2 text-amber-400">
                <Briefcase size={16} />
                <span className="text-xs font-bold uppercase">Поиск вакансий</span>
              </div>
              <input
                type="number"
                value={settings.jobs_limit_free}
                onChange={(e) => setSettings({ ...settings, jobs_limit_free: parseInt(e.target.value) || 0 })}
                className="w-full h-12 bg-[#06140F] border border-[#1A3D2E] rounded-xl text-center font-black text-lg focus:border-[#00A86B] outline-none"
              />
            </div>
          </div>
        </section>

        {/* Save Button */}
        <button
          onClick={handleSave}
          disabled={saving}
          className="w-full h-16 rounded-[2rem] vaqta-gradient font-black text-white text-sm shadow-xl vaqta-glow flex items-center justify-center gap-3 uppercase tracking-widest active:scale-95 transition-transform disabled:opacity-50"
        >
          {saving ? <Loader2 className="animate-spin" size={20} /> : <><Save size={18} /> Save Settings</>}
        </button>

        {/* Action Logs */}
        {logs.length > 0 && (
          <section className="space-y-3 pt-2">
            <div className="flex items-center gap-2 text-[#5C7A6D] ml-2">
              <History size={14} />
              <h3 className="text-[10px] font-black uppercase tracking-widest">Журнал изменений (admin_logs)</h3>
            </div>

            <div className="vaqta-glass p-4 border-[#1A3D2E] space-y-2 max-h-48 overflow-y-auto font-mono text-[10px] text-slate-400">
              {logs.map((log) => (
                <div key={log.id} className="border-b border-white/5 pb-2">
                  <span className="text-[#00A86B] font-bold">[{new Date(log.created_at).toLocaleTimeString()}]</span>{" "}
                  <span className="text-white font-bold">{log.action}</span>
                </div>
              ))}
            </div>
          </section>
        )}
      </main>

      <BottomNav />
    </div>
  );
}