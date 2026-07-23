"use client";

import { useState } from "react";
import { useNavigate } from "react-router-dom";
import { Lock, ShieldCheck, ArrowLeft, Loader2 } from "lucide-react";
import { VaqtaLogo } from "@/components/VaqtaLogo";
import { useLanguage } from "@/context/LanguageProvider";
import { supabase } from "@/integrations/supabase/client";
import { toast } from "sonner";
import { motion } from "framer-motion";

export default function AdminLogin() {
  const { t } = useLanguage();
  const nav = useNavigate();
  const [code, setCode] = useState("");
  const [loading, setLoading] = useState(false);

  const handleLogin = async (e: React.FormEvent) => {
    e.preventDefault();
    const phone = localStorage.getItem("vaxtago_user_phone");
    
    if (!phone) {
      toast.error("Сначала войдите как обычный пользователь");
      return;
    }

    setLoading(true);
    try {
      const { data, error } = await supabase.functions.invoke("admin-auth", {
        body: { code, user_phone: phone }
      });

      if (error || !data?.success) {
        toast.error(t("admin.invalid_pass") || "Неверный код доступа");
        return;
      }

      localStorage.setItem("vaqta_admin_token", data.admin_token);
      localStorage.setItem("vaqta_admin_role", data.role);
      toast.success("Доступ подтвержден. Добро пожаловать, Founder!");
      nav("/admin");
    } catch (err) {
      toast.error("Ошибка сервера");
    } finally {
      setLoading(false);
    }
  };

  return (
    <div className="min-h-screen bg-[#06140F] flex flex-col items-center justify-center p-6 text-white relative">
      <button onClick={() => nav("/home")} className="absolute top-8 left-6 p-3 bg-white/5 rounded-2xl text-slate-500">
        <ArrowLeft size={20} />
      </button>

      <motion.div initial={{ opacity: 0, scale: 0.9 }} animate={{ opacity: 1, scale: 1 }} className="w-full max-w-sm space-y-8 text-center">
        <div className="space-y-4">
          <VaqtaLogo size={80} animated glow />
          <h1 className="text-3xl font-black tracking-tight uppercase">Founder <span className="text-[#00A86B]">Access</span></h1>
          <p className="text-xs text-[#5C7A6D] font-bold uppercase tracking-[0.3em]">System Control Unit</p>
        </div>

        <form onSubmit={handleLogin} className="space-y-4">
          <div className="relative">
            <Lock className="absolute left-5 top-1/2 -translate-y-1/2 text-[#00A86B]" size={20} />
            <input 
              type="password" 
              value={code}
              onChange={(e) => setCode(e.target.value)}
              placeholder="•••••"
              className="w-full h-16 bg-[#0C1F1A] border border-[#1A3D2E] rounded-[2rem] text-center text-2xl tracking-[0.6em] font-mono focus:border-[#00A86B] outline-none transition-all"
            />
          </div>

          <button 
            disabled={loading}
            className="w-full h-16 vaqta-gradient rounded-[2rem] font-black text-white shadow-xl vaqta-glow flex items-center justify-center gap-3 uppercase tracking-widest"
          >
            {loading ? <Loader2 className="animate-spin" /> : <><ShieldCheck size={20} /> Verify & Enter</>}
          </button>
        </form>

        <p className="text-[10px] text-[#5C7A6D] uppercase font-bold tracking-widest">Authorized personnel only</p>
      </motion.div>
    </div>
  );
}