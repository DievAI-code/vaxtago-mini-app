"use client";

import { useState, useEffect } from "react";
import { Header } from "@/components/Header";
import { BottomNav } from "@/components/BottomNav";
import { Link2, Unlink, RefreshCw, CheckCircle2, AlertCircle, ShieldCheck } from "lucide-react";
import { supabase } from "@/integrations/supabase/client";
import { toast } from "sonner";

export default function AdminIntegrations() {
  const [status, setStats] = useState({ hh: false, trudvsem: false });
  const [loading, setLoading] = useState(true);

  const checkConnections = async () => {
    setLoading(true);
    try {
      const { data } = await supabase.functions.invoke("jobs-proxy", {
        body: { action: "check_status" }
      });
      if (data) setStats(data);
    } catch (e) {
      toast.error("Ошибка проверки интеграций");
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => { checkConnections(); }, []);

  const INTEGRATIONS = [
    { 
      id: "hh", 
      name: "HeadHunter API", 
      active: status.hh, 
      desc: "Доступ к базе вакансий HH.ru через OAuth 2.0" 
    },
    { 
      id: "trudvsem", 
      name: "Работа России", 
      active: status.trudvsem, 
      desc: "Государственная база вакансий (Trudvsem.ru)" 
    }
  ];

  return (
    <div className="flex flex-col min-h-screen bg-[#06140F] text-white pb-32">
      <Header title="API Integrations" showBack />

      <main className="p-6 space-y-6">
        <div className="flex items-center justify-between">
           <div>
              <h2 className="text-xl font-black">Службы данных</h2>
              <p className="text-[10px] text-[#5C7A6D] uppercase font-bold tracking-widest">Внешние агрегаторы вакансий</p>
           </div>
           <button onClick={checkConnections} className="p-3 bg-[#0C1F1A] border border-[#1A3D2E] rounded-2xl text-[#00A86B]">
             <RefreshCw size={18} className={loading ? "animate-spin" : ""} />
           </button>
        </div>

        <div className="space-y-4">
          {INTEGRATIONS.map((integ) => (
            <div key={integ.id} className="vaqta-glass p-6 border-[#1A3D2E] relative overflow-hidden">
               <div className="flex justify-between items-start mb-4">
                  <div className="flex items-center gap-4">
                     <div className={`p-3 rounded-2xl ${integ.active ? 'bg-[#00A86B]/10 text-[#00A86B]' : 'bg-red-500/10 text-red-500'}`}>
                        {integ.active ? <Link2 size={24} /> : <Unlink size={24} />}
                     </div>
                     <div>
                        <h3 className="font-black text-lg">{integ.name}</h3>
                        <p className="text-xs text-[#5C7A6D] font-medium">{integ.desc}</p>
                     </div>
                  </div>
                  <div className={`flex items-center gap-1.5 px-3 py-1 rounded-full text-[9px] font-black uppercase border ${integ.active ? 'border-[#00A86B]/30 text-[#00A86B]' : 'border-red-500/30 text-red-500'}`}>
                     {integ.active ? <><CheckCircle2 size={10} /> Connected</> : <><AlertCircle size={10} /> Not connected</>}
                  </div>
               </div>

               {!integ.active && (
                 <div className="bg-red-500/5 border border-red-500/10 p-3 rounded-xl mt-4">
                   <p className="text-[10px] text-red-400 font-bold leading-relaxed">
                     ⚠️ Источник вакансий не подключен. Добавьте API ключ {integ.id.toUpperCase()} в настройки Supabase Vault (Edge Function Secrets).
                   </p>
                 </div>
               )}
            </div>
          ))}
        </div>

        <div className="vaqta-glass p-6 border-[#1A3D2E] space-y-4">
           <div className="flex items-center gap-2 text-[#00A86B]">
              <ShieldCheck size={18} />
              <span className="text-xs font-black uppercase">Безопасность данных</span>
           </div>
           <p className="text-[10px] text-[#5C7A6D] font-bold leading-relaxed">
             Все API-ключи хранятся в зашифрованном виде на стороне сервера (Supabase Edge Secrets). 
             Приложение никогда не передает секретные данные в браузер пользователя.
           </p>
        </div>
      </main>
      <BottomNav />
    </div>
  );
}