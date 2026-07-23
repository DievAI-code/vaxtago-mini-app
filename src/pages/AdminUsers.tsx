"use client";

import { useState, useEffect } from "react";
import { Search, Crown, ShieldCheck, ChevronRight, User as UserIcon, RefreshCw, Calendar, Trash2, Mail } from "lucide-react";
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
    const { data } = await supabase.from("users").select("*").order("created_at", { ascending: false });
    setUsers(data || []);
    setLoading(false);
  };

  const togglePremium = async (user: any) => {
    const isPrem = user.subscription_status === "premium";
    const nextStatus = isPrem ? "free" : "premium";
    const nextExpiry = nextStatus === "premium" ? new Date(Date.now() + 30 * 24 * 60 * 60 * 1000).toISOString() : null;

    try {
      await supabase.from("users").update({ 
        subscription_status: nextStatus,
        subscription_expires: nextExpiry
      }).eq("id", user.id);
      
      setUsers(prev => prev.map(u => u.id === user.id ? { ...u, subscription_status: nextStatus } : u));
      if (selectedUser?.id === user.id) setSelectedUser({ ...user, subscription_status: nextStatus });
      
      toast.success(nextStatus === "premium" ? "Premium granted" : "Premium revoked");
    } catch (e) {
      toast.error("Operation failed");
    }
  };

  const filtered = users.filter(u => u.phone_number.includes(query) || (u.first_name || "").toLowerCase().includes(query.toLowerCase()));

  return (
    <div className="flex flex-col min-h-screen bg-[#06140F] text-white pb-32">
      <Header title="User Management" showBack />

      <main className="p-6 space-y-6">
        <div className="relative vaqta-glass border-[#1A3D2E] p-1 flex items-center">
          <Search size={18} className="text-[#5C7A6D] ml-4" />
          <input 
            value={query}
            onChange={(e) => setQuery(e.target.value)}
            placeholder="Search phone or name..."
            className="flex-1 bg-transparent py-4 px-3 text-sm outline-none font-bold"
          />
          <button onClick={loadUsers} className="p-3 text-[#00A86B]"><RefreshCw size={18} className={loading ? "animate-spin" : ""} /></button>
        </div>

        <div className="space-y-3">
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
                   <p className="text-[10px] text-[#5C7A6D]">{u.first_name || "Unknown"} • Joined {new Date(u.created_at).toLocaleDateString()}</p>
                </div>
              </div>
              <ChevronRight size={16} className="text-[#1A3D2E]" />
            </motion.div>
          ))}
        </div>

        {/* User Detailed Panel */}
        <AnimatePresence>
          {selectedUser && (
            <motion.div initial={{ y: 50, opacity: 0 }} animate={{ y: 0, opacity: 1 }} className="vaqta-glass p-6 border-[#00A86B]/30 space-y-6">
               <div className="flex justify-between items-start">
                  <div className="flex gap-4 items-center">
                    <div className="w-12 h-12 rounded-full vaqta-gradient flex items-center justify-center"><UserIcon size={24} /></div>
                    <div>
                      <h4 className="font-black text-lg">{selectedUser.first_name || "User Profile"}</h4>
                      <p className="text-xs text-[#5C7A6D]">{selectedUser.phone_number}</p>
                    </div>
                  </div>
                  <button onClick={() => setSelectedUser(null)} className="text-[#5C7A6D]"><Trash2 size={18} /></button>
               </div>

               <div className="grid grid-cols-2 gap-3">
                  <div className="bg-white/5 p-4 rounded-2xl">
                    <p className="text-[9px] font-black uppercase text-[#5C7A6D] mb-1">AI Requests</p>
                    <p className="text-lg font-bold">{selectedUser.ai_requests_used || 0}</p>
                  </div>
                  <div className="bg-white/5 p-4 rounded-2xl">
                    <p className="text-[9px] font-black uppercase text-[#5C7A6D] mb-1">Status</p>
                    <p className={`text-sm font-black uppercase ${selectedUser.subscription_status === 'premium' ? 'text-[#D4AF37]' : 'text-white'}`}>
                      {selectedUser.subscription_status}
                    </p>
                  </div>
               </div>

               <button 
                onClick={() => togglePremium(selectedUser)}
                className={`w-full h-14 rounded-2xl font-black text-xs uppercase tracking-widest transition-all ${
                  selectedUser.subscription_status === 'premium' 
                  ? 'bg-red-500/10 text-red-500 border border-red-500/20' 
                  : 'vaqta-gradient text-white shadow-lg'
                }`}
               >
                 {selectedUser.subscription_status === 'premium' ? 'Revoke Premium' : 'Grant Premium Access'}
               </button>
            </motion.div>
          )}
        </AnimatePresence>
      </main>

      <BottomNav />
    </div>
  );
}