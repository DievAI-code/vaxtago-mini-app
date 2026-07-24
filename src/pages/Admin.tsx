"use client";

import { useState, useEffect } from "react";
import { motion } from "framer-motion";
import {
  Users, Crown, Search, Lock, ShieldCheck,
  RefreshCw, Key, ToggleLeft, ToggleRight
} from "lucide-react";
import { Header } from "@/components/Header";
import { VaqtaLogo } from "@/components/VaqtaLogo";
import { useLanguage } from "@/context/LanguageProvider";
import { supabase } from "@/integrations/supabase/client";
import { updateUserSubscription, User } from "@/services/userService";
import { toast } from "sonner";

interface DBUser {
  id: string;
  phone_number: string;
  first_name?: string;
  last_name?: string;
  language_code?: string;
  is_premium?: boolean;
  premium_until?: string;
  role?: string;
  subscription_status?: string;
  subscription_expires_at?: string;
  ai_requests_limit?: number;
  created_at?: string;
  last_login?: string;
}

export default function Admin() {
  const { t } = useLanguage();
  const [pass, setPass] = useState("");
  const [isAuthed, setIsAuthed] = useState(() => localStorage.getItem("vaqta_admin_auth") === "true");
  const [error, setError] = useState(false);

  const [users, setUsers] = useState<DBUser[]>([]);
  const [loadingUsers, setLoadingUsers] = useState(false);
  const [searchQuery, setSearchQuery] = useState("");
  const [selectedUser, setSelectedUser] = useState<DBUser | null>(null);

  const ADMIN_PASSWORD = import.meta.env.VITE_ADMIN_PASSWORD || "31975";

  useEffect(() => {
    if (isAuthed) {
      loadUsers();
    }
  }, [isAuthed]);

  const handleAdminLogin = (e: React.FormEvent) => {
    e.preventDefault();
    if (pass === ADMIN_PASSWORD) {
      setIsAuthed(true);
      setError(false);
      localStorage.setItem("vaqta_admin_auth", "true");
      toast.success("Доступ администратора подтвержден");
    } else {
      setError(true);
      toast.error(t("admin.invalid_pass"));
    }
  };

  const loadUsers = async () => {
    setLoadingUsers(true);
    try {
      if (!supabase) throw new Error("Supabase unavailable");
      const { data, error } = await supabase
        .from("users")
        .select("*")
        .order("created_at", { ascending: false })
        .limit(50);

      if (error) throw error;
      setUsers(data as DBUser[] || []);
    } catch (err) {
      console.warn("[Admin] Supabase user load error", err);
      setUsers([]);
    } finally {
      setLoadingUsers(false);
    }
  };

  const togglePremium = async (user: DBUser) => {
    const nextStatus = user.subscription_status === "premium" ? "free" : "premium";
    const premiumUntil = nextStatus === "premium"
      ? new Date(Date.now() + 30 * 24 * 60 * 60 * 1000).toISOString()
      : null;

    const success = await updateUserSubscription(user.id, {
      subscription_status: nextStatus as "free" | "premium",
      subscription_expires_at: premiumUntil,
      premium_started_at: nextStatus === "premium" ? new Date().toISOString() : null,
    });

    if (success) {
      setUsers(prev => prev.map(u => u.id === user.id ? {
        ...u,
        subscription_status: nextStatus,
        subscription_expires_at: premiumUntil || undefined,
      } : u));

      if (selectedUser?.id === user.id) {
        setSelectedUser(prev => prev ? { ...prev, subscription_status: nextStatus, subscription_expires_at: premiumUntil || undefined } : null);
      }

      toast.success(nextStatus === "premium" ? "Premium активирован" : "Premium отключен");
    } else {
      toast.error("Ошибка при обновлении статуса");
    }
  };

  const filteredUsers = users.filter(u =>
    u.phone_number.includes(searchQuery) ||
    (u.first_name && u.first_name.toLowerCase().includes(searchQuery.toLowerCase()))
  );

  if (!isAuthed) {
    return (
      <div className="min-h-screen bg-[#06140F] flex flex-col items-center justify-center p-6 text-white">
        <VaqtaLogo size={80} animated glow className="mb-6" />
        <h1 className="text-2xl font-black mb-1 uppercase tracking-tight">{t("admin.login_title")}</h1>
        <p className="text-xs text-[#5C7A6D] uppercase tracking-widest mb-8">{t("admin.enter_pass")}</p>

        <form onSubmit={handleAdminLogin} className="w-full max-w-sm space-y-4">
          <div className="relative">
            <Lock className="absolute left-5 top-1/2 -translate-y-1/2 text-[#00A86B]" size={20} />
            <input
              type="password"
              value={pass}
              onChange={(e) => setPass(e.target.value)}
              placeholder="••••••"
              className="w-full h-16 bg-[#0C1F1A] border border-[#1A3D2E] rounded-2xl pl-14 pr-6 text-center text-xl tracking-[0.5em] focus:border-[#00A86B] outline-none transition-all font-mono"
            />
          </div>

          {error && <p className="text-xs text-red-400 text-center font-bold">{t("admin.invalid_pass")}</p>}

          <button
            type="submit"
            className="w-full h-16 vaqta-gradient rounded-2xl font-black text-lg shadow-xl uppercase tracking-wider"
          >
            Войти в систему
          </button>
        </form>
      </div>
    );
  }

  return (
    <div className="min-h-screen bg-[#06140F] text-white pb-32">
      <Header title="admin.title" showBack />

      <main className="p-6 space-y-6">
        <div className="flex items-center justify-between">
          <div className="flex items-center gap-3">
            <ShieldCheck size={28} className="text-[#00A86B]" />
            <div>
              <h2 className="font-extrabold text-lg text-white">Администрирование VAQTA</h2>
              <p className="text-[10px] text-[#5C7A6D] uppercase font-black tracking-widest">Управление Premium и доступами</p>
            </div>
          </div>
          <button
            onClick={loadUsers}
            className="p-3 bg-[#0C1F1A] border border-[#1A3D2E] rounded-2xl text-[#00A86B] active:scale-95"
          >
            <RefreshCw size={18} className={loadingUsers ? "animate-spin" : ""} />
          </button>
        </div>

        <div className="relative vaqta-glass p-2 border-[#1A3D2E]">
          <div className="flex items-center gap-3 px-3">
            <Search size={18} className="text-[#5C7A6D]" />
            <input
              type="text"
              value={searchQuery}
              onChange={(e) => setSearchQuery(e.target.value)}
              placeholder={t("admin.search_user")}
              className="w-full bg-transparent py-3 text-xs outline-none text-white font-bold"
            />
          </div>
        </div>

        <div className="space-y-3">
          <h3 className="text-[10px] font-black uppercase text-[#5C7A6D] tracking-widest ml-1">
            Пользователи ({filteredUsers.length})
          </h3>

          <div className="space-y-2">
            {filteredUsers.map((u) => (
              <div
                key={u.id}
                onClick={() => setSelectedUser(u)}
                className={`vaqta-glass p-4 border-[#1A3D2E] flex items-center justify-between cursor-pointer transition-colors ${
                  selectedUser?.id === u.id ? "border-[#00A86B] bg-[#00A86B]/10" : ""
                }`}
              >
                <div className="flex items-center gap-3">
                  <div className="w-10 h-10 rounded-2xl bg-white/5 flex items-center justify-center text-xs font-black uppercase text-[#00A86B]">
                    {u.language_code || "RU"}
                  </div>
                  <div>
                    <div className="flex items-center gap-2">
                      <p className="text-xs font-bold text-white">{u.phone_number}</p>
                      {u.subscription_status === "premium" && (
                        <span className="bg-[#D4AF37]/20 text-[#D4AF37] px-2 py-0.5 rounded-full text-[9px] font-black uppercase flex items-center gap-1">
                          <Crown size={10} /> Premium
                        </span>
                      )}
                    </div>
                    <p className="text-[10px] text-[#5C7A6D]">{u.first_name || "Без имени"}</p>
                  </div>
                </div>

                <button
                  onClick={(e) => { e.stopPropagation(); togglePremium(u); }}
                  className={`px-3 py-1.5 rounded-xl text-[10px] font-black uppercase tracking-wider transition-all ${
                    u.subscription_status === "premium"
                      ? "bg-red-500/10 text-red-400 border border-red-500/20"
                      : "vaqta-gradient text-white shadow-lg"
                  }`}
                >
                  {u.subscription_status === "premium" ? t("admin.deactivate_premium") : t("admin.activate_premium")}
                </button>
              </div>
            ))}
          </div>
        </div>

        {selectedUser && (
          <motion.div initial={{ opacity: 0, y: 10 }} animate={{ opacity: 1, y: 0 }} className="vaqta-glass p-6 border-[#00A86B]/40 space-y-4">
            <div className="flex justify-between items-start">
              <div>
                <p className="text-[10px] font-black uppercase text-[#00A86B]">Детали пользователя</p>
                <h4 className="text-base font-bold text-white">{selectedUser.phone_number}</h4>
                <p className="text-[10px] text-[#5C7A6D] mt-1">
                  Статус: {selectedUser.subscription_status || "free"}
                </p>
                {selectedUser.subscription_expires_at && (
                  <p className="text-[10px] text-[#5C7A6D]">
                    Истекает: {new Date(selectedUser.subscription_expires_at).toLocaleDateString()}
                  </p>
                )}
                <p className="text-[10px] text-[#5C7A6D]">
                  AI лимит: {selectedUser.ai_requests_limit || "по умолчанию"}
                </p>
              </div>
              <button onClick={() => setSelectedUser(null)} className="text-xs text-[#5C7A6D] font-bold">Закрыть</button>
            </div>

            <div className="flex gap-2">
              <button
                onClick={() => togglePremium(selectedUser)}
                className={`flex-1 h-12 rounded-2xl font-black text-xs uppercase tracking-wider transition-all ${
                  selectedUser.subscription_status === "premium"
                    ? "bg-red-500/10 text-red-400 border border-red-500/20"
                    : "vaqta-gradient text-white shadow-lg"
                }`}
              >
                {selectedUser.subscription_status === "premium" ? "Отключить Premium" : "Включить Premium"}
              </button>
            </div>
          </motion.div>
        )}
      </main>
    </div>
  );
}