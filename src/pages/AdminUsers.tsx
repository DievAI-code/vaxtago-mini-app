"use client";

import { useState, useEffect } from "react";
import { Search, Crown, ShieldCheck, ChevronRight, User as UserIcon, RefreshCw, Trash2, Zap, Phone } from "lucide-react";
import { Header } from "@/components/Header";
import { BottomNav } from "@/components/BottomNav";
import { supabase } from "@/integrations/supabase/client";
import { toast } from "sonner";
import { motion, AnimatePresence } from "framer-motion";

export default function AdminUsers() {
  const [users, setUsers] = useState<any[]>([]);
  const [query, setQuery] = useState("");
  const [loading, setLoading] = useState(false);
  const [selectedUser, setSelectedUser] = useState<any>(null);

  useEffect(() => { loadUsers(); }, []);

  const loadUsers = async () => {
    setLoading(true);
    try {
      const { data, error } = await supabase
        .from("users")
        .select("*")
        .order("created_at", { ascending: false })
        .limit(50);
      
      if (error) throw error;
      setUsers(data || []);
    } catch (e) {
      toast.error("Ошибка загрузки пользователей");
    } finally {
      setLoading(false);
    }
  };

  const togglePremium = async (user: any) => {
    const isPrem = user.subscription_status === "premium";
    const nextStatus = isPrem ? "free" : "premium";
    const now = new Date().toISOString();
    const expiry = nextStatus === "premium" ? new Date(Date.now() + 30 * 24 * 60 * 60 * 1000).toISOString() : null;

    try {
      const { error } = await supabase
        .from("users")
        .update({ 
          subscription_status: nextStatus,
          premium_started_at: nextStatus === "premium" ? now : null,
          subscription_expires_at: expiry
        })
        .eq("id", user.id);
      
      if (error) throw error;
      
      setUsers(prev => prev.map(u => u.id === user.id ? { 
        ...u, 
        subscription_status: nextStatus,
        subscription_expires_at: expiry 
      } : u));
      
      if (selectedUser?.id === user.id) {
        setSelectedUser({ ...user, subscription_status: nextStatus, subscription_expires_at: expiry });
      }
      
      toast.success(nextStatus === "premium" ? "Premium активирован на 30 дней" : "Premium отозван");
    } catch (e) {
      toast.error("Ошибка обновления статуса");
    }
  };

  const filtered = users.filter(u => 
    u.phone_number.includes(query) || 
    (u.first_name || "").toLowerCase().includes(query.toLowerCase())
  );

  return (
    <div className="flex flex-col min-h-screen bg-[#06140F] text-white pb-32">
      <Header title="Premium Management" showBack />

      <main className="p-6 space-y-6">
        <div className="relative vaqta-glass border-[#1A3D2E] p-1 flex items-center">
          <Search size={18} className="text-[#5C7A6D] ml-4" />
          <input 
            value={query}
            onChange={(e) => setQuery(e.target.value)}
            placeholder="Поиск по телефону..."
            className="flex-1 bg-transparent py-4 px-3 text-sm outline-none font-bold"
          />
          <button onClick={loadUsers} className="p-3 text-[#00A86B]">
            <RefreshCw size={18} className={loading ? "animate-spin" : ""} />
          </button>
        </div>

        <div className="space-y-3">
          <h3 className="text-[10px] font-black uppercase tracking-widest text-[#5C7A6D] ml-1">Найдено: {filtered.length}</h3>
          {filtered.map((u) => (
            <motion.div 
              key={u.id}
              onClick={() => setSelectedUser(u)}
              className={`vaqta-glass p-4 border-[#1A3D2E] flex items-center justify-between cursor-pointer transition-colors ${selectedUser?.id === u.id ? "border-[#00A86B] bg-[#00A86B]/10" : ""}`}
            >
              <div className="flex items-center gap-3">
                <div className={`w-10 h-10 rounded-2xl bg-white/5 flex items-center justify-center font-black text-[10px] ${u.subscription_status === 'premium' ? 'text-[#D4AF37]' : 'text-[#5C7A6D]'}`}>
                  {u.language_code?.toUpperCase() || "RU"}
                </div>
                <div>
                   <div className="flex items-center gap-2">
                     <p className="text-xs font-bold text-white">{u.phone_number}</p>
                     {u.subscription_status === "premium" && <Crown size={12} className="text-[#D4AF37]" />}
                   </div>
                   <p className="text-[10px] text-[#5C7A6D] uppercase font-bold">{u.subscription_status}</p>
                </div>
              </div>
              <ChevronRight size={16} className="text-[#1A3D2E]" />
            </motion.div>
          ))}
        </div>

        <AnimatePresence>
          {selectedUser && (
            <motion.div initial={{ y: 50, opacity: 0 }} animate={{ y: 0, opacity: 1 }} exit={{ y: 50, opacity: 0 }} className="vaqta-glass p-6 border-[#00A86B]/30 space-y-6 shadow-[0_0_50px_rgba(0,168,107,0.1)]">
               <div className="flex justify-between items-start">
                  <div className="flex gap-4 items-center">
                    <div className="w-12 h-12 rounded-3xl vaqta-gradient flex items-center justify-center shadow-lg"><UserIcon size={24} /></div>
                    <div>
                      <h4 className="font-black text-lg">{selectedUser.first_name || "Пользователь"}</h4>
                      <div className="flex items-center gap-1.5 text-xs text-[#5C7A6D] font-bold">
                        <Phone size={12} /> {selectedUser.phone_number}
                      </div>
                    </div>
                  </div>
                  <button onClick={() => setSelectedUser(null)} className="p-2 bg-white/5 rounded-xl text-[#5C7A6D]"><X size={18} /></button>
               </div>

               <div className="grid grid-cols-2 gap-3">
                  <div className="bg-[#06140F] p-4 rounded-2xl border border-[#1A3D2E]">
                    <p className="text-[9px] font-black uppercase text-[#5C7A6D] mb-1">AI Запросы</p>
                    <div className="flex items-center gap-2">
                      <Zap size={14} className="text-[#00A86B]" />
                      <p className="text-lg font-black">{selectedUser.ai_requests_used || 0}</p>
                    </div>
                  </div>
                  <div className="bg-[#06140F] p-4 rounded-2xl border border-[#1A3D2E]">
                    <p className="text-[9px] font-black uppercase text-[#5C7A6D] mb-1">Срок Premium</p>
                    <p className="text-xs font-bold text-white">
                      {selectedUser.subscription_expires_at ? new Date(selectedUser.subscription_expires_at).toLocaleDateString() : '—'}
                    </p>
                  </div>
               </div>

               <button 
                onClick={() => togglePremium(selectedUser)}
                className={`w-full h-14 rounded-2xl font-black text-xs uppercase tracking-widest transition-all shadow-xl ${
                  selectedUser.subscription_status === 'premium' 
                  ? 'bg-red-500/10 text-red-500 border border-red-500/20' 
                  : 'vaqta-gradient text-white vaqta-glow'
                }`}
               >
                 {selectedUser.subscription_status === 'premium' ? 'Отключить Premium' : 'Включить Premium (30 дней)'}
               </button>
            </motion.div>
          )}
        </AnimatePresence>
      </main>

      <BottomNav />
    </div>
  );
}