"use client";

import { motion } from "framer-motion";
import { useNavigate } from "react-router-dom";
import { 
  Search, MapPin, Briefcase, Camera, FileText, Globe, 
  Navigation, Hospital, Train, Plane, Scale, ShieldAlert,
  Bot, Sparkles, ArrowRight, TrendingUp, Clock, Languages, Scan
} from "lucide-react";
import { useLanguage } from "@/context/LanguageProvider";
import { BottomNav } from "@/components/BottomNav";
import { VaqtaLogo } from "@/components/VaqtaLogo";
import { Header } from "@/components/Header";
import { memo } from "react";

function getGreetingKey(): string {
  const h = new Date().getHours();
  if (h >= 5 && h < 12) return "home.greeting_morning";
  if (h >= 12 && h < 17) return "home.greeting_day";
  if (h >= 17 && h < 22) return "home.greeting_evening";
  return "home.greeting_night";
}

const QUICK_ACTIONS = [
  { id: "translate", icon: Languages, label: "home.feature_translate", desc: "home.feature_translate_d", path: "/ocr", gradient: "from-[#0AA86E] to-[#14B8A6]" },
  { id: "route", icon: Navigation, label: "home.feature_route", desc: "home.feature_route_d", path: "/maps", gradient: "from-[#2563EB] to-[#7C3AED]" },
  { id: "jobs", icon: Briefcase, label: "home.feature_jobs", desc: "home.feature_jobs_d", path: "/jobs-test", gradient: "from-[#7C3AED] to-[#D4AF37]" },
  { id: "lawyer", icon: Scale, label: "home.feature_lawyer", desc: "home.feature_lawyer_d", path: "/contract-audit", gradient: "from-[#D4AF37] to-[#0AA86E]" },
];

const CATEGORIES = [
  { id: "map", icon: MapPin, label: "home.cat_map", color: "text-blue-400", path: "/maps" },
  { id: "jobs", icon: Briefcase, label: "home.cat_jobs", color: "text-[#0AA86E]", path: "/jobs-test" },
  { id: "photo", icon: Camera, label: "home.cat_photo", color: "text-purple-400", path: "/scanner" },
  { id: "docs", icon: FileText, label: "home.cat_docs", color: "text-amber-400", path: "/contract-audit" },
  { id: "text", icon: Globe, label: "home.cat_text", color: "text-cyan-400", path: "/ai" },
  { id: "route", icon: Navigation, label: "home.cat_route", color: "text-blue-500", path: "/maps" },
  { id: "hospitals", icon: Hospital, label: "home.cat_hospitals", color: "text-red-400", path: "/maps?q=hospital" },
  { id: "stations", icon: Train, label: "home.cat_stations", color: "text-slate-400", path: "/maps?q=station" },
  { id: "airports", icon: Plane, label: "home.cat_airports", color: "text-sky-400", path: "/maps?q=airport" },
  { id: "sos", icon: ShieldAlert, label: "home.cat_sos", color: "text-red-500", path: "/sos" },
];

interface StatCardProps {
  icon: any;
  value: string;
  label: string;
  description: string;
  color: string;
}

const StatCard = memo(function StatCard({ icon: Icon, value, label, description, color }: StatCardProps) {
  return (
    <div className="vaqta-glass p-3 flex flex-col items-center gap-0.5 text-center">
      <Icon className={color} size={16} />
      <p className="text-base font-black text-white leading-none mt-1">{value}</p>
      <p className="text-[9px] font-black uppercase text-white tracking-wider mt-0.5">{label}</p>
      <p className="text-[8px] text-[#5C7A6D] leading-tight tracking-wide">{description}</p>
    </div>
  );
});

interface QuickActionCardProps {
  action: typeof QUICK_ACTIONS[number];
  onClick: () => void;
  index: number;
}

const QuickActionCard = memo(function QuickActionCard({ action, onClick, index }: QuickActionCardProps) {
  const { t } = useLanguage();
  const label = t(action.label);
  const desc = t(action.desc);
  return (
    <motion.button
      initial={{ opacity: 0, y: 12 }}
      animate={{ opacity: 1, y: 0 }}
      transition={{ delay: 0.05 * index, duration: 0.4 }}
      whileTap={{ scale: 0.97 }}
      onClick={onClick}
      className="group vaqta-glass p-4 text-left relative overflow-hidden hover:border-[#0AA86E]/40 hover:bg-white/[0.06] active:scale-[0.98] transition-all duration-200"
    >
      <div className={`w-10 h-10 rounded-2xl bg-gradient-to-br ${action.gradient} flex items-center justify-center mb-2.5 shadow-lg group-hover:scale-110 group-hover:shadow-[0_0_20px_rgba(10,168,110,0.3)] transition-all duration-200`}>
        <action.icon className="text-white" size={20} />
      </div>
      <p className="text-xs font-black text-white leading-tight mb-1">{label}</p>
      <p className="text-[10px] text-[#94A3B8] leading-snug line-clamp-2">{desc}</p>
      <ArrowRight size={14} className="absolute top-3 right-3 text-[#5C7A6D] opacity-0 group-hover:opacity-100 group-hover:translate-x-0.5 transition-all duration-200" />
    </motion.button>
  );
});

interface CategoryTileProps {
  cat: typeof CATEGORIES[number];
  onClick: () => void;
  index: number;
}

const CategoryTile = memo(function CategoryTile({ cat, onClick, index }: CategoryTileProps) {
  const { t } = useLanguage();
  return (
    <motion.button
      initial={{ opacity: 0, scale: 0.9 }}
      animate={{ opacity: 1, scale: 1 }}
      transition={{ delay: 0.02 * index, duration: 0.3 }}
      whileTap={{ scale: 0.95 }}
      onClick={onClick}
      className="vaqta-glass p-3.5 flex flex-col items-center justify-center text-center gap-1.5 hover:border-[#0AA86E]/30 active:scale-[0.97] transition-all duration-200"
    >
      <div className={`p-2 rounded-xl bg-white/5 ${cat.color}`}>
        <cat.icon size={18} />
      </div>
      <span className="text-[9px] font-black uppercase tracking-wider text-white leading-tight">{t(cat.label)}</span>
    </motion.button>
  );
});

const RecentItem = memo(function RecentItem({ item, onClick }: { item: { id: string; label: string; path: string; icon: any; time: string }; onClick: () => void }) {
  return (
    <button
      onClick={onClick}
      className="vaqta-glass p-3 w-full flex items-center gap-3 active:scale-[0.99] transition-transform hover:border-[#0AA86E]/30"
    >
      <div className="w-9 h-9 rounded-xl bg-white/5 flex items-center justify-center text-[#0AA86E]">
        <item.icon size={16} />
      </div>
      <div className="flex-1 text-left">
        <p className="text-xs font-bold text-white">{item.label}</p>
        <p className="text-[10px] text-[#5C7A6D]">{item.time}</p>
      </div>
      <ArrowRight size={14} className="text-[#5C7A6D]" />
    </button>
  );
});

export default function Home() {
  const nav = useNavigate();
  const { t, language } = useLanguage();

  // Recent actions (плейсхолдер, читается из localStorage при необходимости)
  const recentActions: Array<{ id: string; label: string; path: string; icon: any; time: string }> = [];

  return (
    <div className="flex flex-col min-h-screen overflow-hidden bg-[#06140F]">
      <Header title="VAQTA AI" />

      <main className="flex-1 overflow-y-auto px-4 sm:px-5 pt-3 pb-32 no-scrollbar">
        {/* Hero greeting */}
        <motion.section
          initial={{ opacity: 0, y: 8 }}
          animate={{ opacity: 1, y: 0 }}
          transition={{ duration: 0.4 }}
          className="mb-4"
        >
          <div className="flex items-center gap-3 mb-1.5">
            <VaqtaLogo size={40} animated glow />
            <div className="flex-1 min-w-0">
              <p className="text-[10px] font-black uppercase tracking-widest text-[#5C7A6D]">
                {t(getGreetingKey())}
              </p>
              <h1 className="text-lg sm:text-xl font-black text-white tracking-tight leading-tight">
                {t("home.ready_to_help")}
              </h1>
            </div>
          </div>

          {/* Search bar */}
          <div
            onClick={() => nav("/ai")}
            className="liquid-glass mt-2 p-2.5 rounded-2xl flex items-center gap-3 cursor-pointer hover:bg-white/10 transition-all group"
            role="button"
            tabIndex={0}
            onKeyDown={(e) => e.key === "Enter" && nav("/ai")}
          >
            <div className="w-8 h-8 rounded-xl bg-[#0AA86E] flex items-center justify-center text-white shadow-lg shadow-[#0AA86E]/20 group-hover:scale-105 transition-transform">
              <Search size={16} />
            </div>
            <span className="text-[#94A3B8] font-medium text-sm flex-1 truncate">{t("home.search_placeholder")}</span>
            <Sparkles size={14} className="text-[#5C7A6D] group-hover:text-[#0AA86E] transition-colors" />
          </div>
        </motion.section>

        {/* Quick stats */}
        <motion.section
          initial={{ opacity: 0, y: 8 }}
          animate={{ opacity: 1, y: 0 }}
          transition={{ delay: 0.1, duration: 0.4 }}
          className="grid grid-cols-4 gap-2 mb-4"
        >
          <StatCard
            icon={Bot}
            value="0"
            label={t("home.stats_queries")}
            description={t("home.stats_queries_d")}
            color="text-[#0AA86E]"
          />
          <StatCard
            icon={Scan}
            value="0"
            label={t("home.stats_scans")}
            description={t("home.stats_scans_d")}
            color="text-purple-400"
          />
          <StatCard
            icon={MapPin}
            value="0"
            label={t("home.stats_routes")}
            description={t("home.stats_routes_d")}
            color="text-blue-400"
          />
          <StatCard
            icon={Sparkles}
            value={t("home.premium_status_free")}
            label={t("home.stats_premium")}
            description={t("home.stats_premium_d")}
            color="text-[#D4AF37]"
          />
        </motion.section>

        {/* Quick actions */}
        <motion.section
          initial={{ opacity: 0, y: 8 }}
          animate={{ opacity: 1, y: 0 }}
          transition={{ delay: 0.15, duration: 0.4 }}
          className="mb-4"
        >
          <div className="flex items-center justify-between mb-2.5">
            <h2 className="text-sm font-black text-white uppercase tracking-wider">
              {t("home.quick_title")}
            </h2>
            <p className="text-[10px] text-[#5C7A6D] font-medium">{t("home.quick_subtitle")}</p>
          </div>
          <div className="grid grid-cols-2 gap-2.5">
            {QUICK_ACTIONS.map((a, i) => (
              <QuickActionCard key={a.id} action={a} onClick={() => nav(a.path)} index={i} />
            ))}
          </div>
        </motion.section>

        {/* Recent activity */}
        <motion.section
          initial={{ opacity: 0, y: 8 }}
          animate={{ opacity: 1, y: 0 }}
          transition={{ delay: 0.2, duration: 0.4 }}
          className="mb-4"
        >
          <div className="flex items-center justify-between mb-2.5">
            <h2 className="text-sm font-black text-white uppercase tracking-wider flex items-center gap-2">
              <Clock size={14} className="text-[#0AA86E]" />
              {t("home.recent_title")}
            </h2>
          </div>
          {recentActions.length === 0 ? (
            <div className="vaqta-glass p-4 text-center border-dashed">
              <p className="text-xs text-[#5C7A6D] leading-relaxed">{t("home.recent_empty")}</p>
            </div>
          ) : (
            <div className="space-y-2">{recentActions.map((r) => <RecentItem key={r.id} item={r} onClick={() => nav(r.path)} />)}</div>
          )}
        </motion.section>

        {/* Popular categories */}
        <motion.section
          initial={{ opacity: 0, y: 8 }}
          animate={{ opacity: 1, y: 0 }}
          transition={{ delay: 0.25, duration: 0.4 }}
          className="mb-4"
        >
          <div className="flex items-center justify-between mb-2.5">
            <h2 className="text-sm font-black text-white uppercase tracking-wider flex items-center gap-2">
              <TrendingUp size={14} className="text-[#D4AF37]" />
              {t("home.popular_title")}
            </h2>
          </div>
          <div className="grid grid-cols-3 gap-2">
            {CATEGORIES.map((cat, idx) => (
              <CategoryTile key={cat.id} cat={cat} onClick={() => nav(cat.path)} index={idx} />
            ))}
          </div>
        </motion.section>

        {/* Copyright */}
        <p className="text-center text-[9px] text-[#5C7A6D] uppercase font-black tracking-widest pt-1">
          {t("copyright")}
        </p>
      </main>

      <BottomNav />
    </div>
  );
}