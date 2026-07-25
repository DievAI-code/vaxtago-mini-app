"use client";

import { motion } from "framer-motion";
import { Briefcase, MapPin, ExternalLink, CheckCircle2, DollarSign } from "lucide-react";
import { Card } from "@/components/ui/card";

interface JobCardProps {
  query?: string;
  data?: {
    title: string;
    company: string;
    salary: string;
    city: string;
    url: string;
  };
}

export function JobCard({ query, data }: JobCardProps) {
  // Fallback demo data if real data isn't provided yet
  const job = data || {
    title: query || "Специалист (Вахта)",
    company: "Группа компаний 'Энерго'",
    salary: "от 120 000 ₽",
    city: "Тюмень",
    url: "https://hh.ru"
  };

  return (
    <motion.div
      initial={{ opacity: 0, scale: 0.95 }}
      animate={{ opacity: 1, scale: 1 }}
      className="w-full vaqta-glass border-[#0AA86E]/30 overflow-hidden shadow-2xl my-3"
    >
      <div className="p-5 space-y-4">
        <div className="flex justify-between items-start gap-3">
          <div className="space-y-1">
            <div className="flex items-center gap-1.5">
              <span className="text-[10px] font-black uppercase tracking-widest text-[#5C7A6D]">
                {job.company}
              </span>
              <CheckCircle2 size={12} className="text-[#0AA86E]" />
            </div>
            <h3 className="text-base font-black text-white leading-tight">
              {job.title}
            </h3>
          </div>
          <div className="bg-[#0AA86E]/10 px-3 py-1.5 rounded-xl border border-[#0AA86E]/20">
            <span className="text-sm font-black text-[#0AA86E]">{job.salary}</span>
          </div>
        </div>

        <div className="flex flex-wrap gap-4 text-[10px] font-bold text-slate-400 uppercase tracking-wider">
          <div className="flex items-center gap-1.5">
            <MapPin size={14} className="text-[#0AA86E]" />
            <span>{job.city}</span>
          </div>
          <div className="flex items-center gap-1.5">
            <Briefcase size={14} className="text-slate-500" />
            <span>Вахта 30/30</span>
          </div>
        </div>

        <div className="grid grid-cols-2 gap-3 pt-2">
          <button 
            onClick={() => window.open(job.url, "_blank")}
            className="h-11 bg-white text-black rounded-2xl font-black text-[10px] uppercase tracking-widest flex items-center justify-center gap-2 shadow-lg active:scale-95 transition-all"
          >
            <ExternalLink size={14} />
            Оригинал
          </button>
          
          <button 
            className="h-11 vaqta-gradient text-white rounded-2xl font-black text-[10px] uppercase tracking-widest flex items-center justify-center gap-2 shadow-lg vaqta-glow active:scale-95 transition-all"
          >
            Откликнуться
          </button>
        </div>
      </div>
    </motion.div>
  );
}