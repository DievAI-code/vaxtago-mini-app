"use client";

import { motion } from "framer-motion";
import { TicketResult } from "@/services/tickets/types";
import { KnowledgeEntry } from "@/lib/knowledgeBase";
import { Ticket, ExternalLink, Compass, BookOpen, Globe, ArrowRight, Train, Plane } from "lucide-react";
import { useNavigate } from "react-router-dom";
import { TicketCard } from "./assistant/TicketCard";

interface AIActionCardProps {
  tickets?: TicketResult;
  knowledge?: KnowledgeEntry;
  webSources?: Array<{ title: string; url: string; snippet: string }>;
  actionLabel?: string;
  actionRoute?: string;
  actionUrl?: string;
}

export function AIActionCard({
  tickets,
  knowledge,
  webSources,
  actionLabel,
  actionRoute,
  actionUrl,
}: AIActionCardProps) {
  const nav = useNavigate();

  // Render ticket card if tickets are present
  if (tickets) {
    return <TicketCard result={tickets} />;
  }

  if (knowledge) {
    return (
      <motion.div
        initial={{ opacity: 0, y: 10 }}
        animate={{ opacity: 1, y: 0 }}
        className="w-full vaqta-glass border-[#D4AF37]/30 p-5 space-y-3 shadow-xl my-2"
      >
        <div className="flex items-center gap-2 text-[#D4AF37]">
          <BookOpen size={18} />
          <span className="text-xs font-black uppercase tracking-wider">
            База знаний VAQTA
          </span>
        </div>

        <div className="space-y-1">
          <h4 className="text-sm font-bold text-white">{knowledge.title}</h4>
          <p className="text-xs text-slate-300 leading-relaxed">{knowledge.content}</p>
        </div>

        {knowledge.link && (
          <button
            onClick={() => nav(knowledge.link!)}
            className="w-full h-10 bg-white/10 border border-white/15 text-white rounded-xl text-[10px] font-black uppercase tracking-widest flex items-center justify-center gap-2 hover:bg-white/20 transition-all"
          >
            <span>{knowledge.actionHint || "Открыть раздел"}</span>
            <ArrowRight size={14} />
          </button>
        )}
      </motion.div>
    );
  }

  if (webSources && webSources.length > 0) {
    return (
      <motion.div
        initial={{ opacity: 0, y: 10 }}
        animate={{ opacity: 1, y: 0 }}
        className="w-full vaqta-glass border-blue-500/30 p-5 space-y-3 shadow-xl my-2"
      >
        <div className="flex items-center gap-2 text-blue-400">
          <Globe size={18} />
          <span className="text-xs font-black uppercase tracking-wider">
            Результаты из Интернета
          </span>
        </div>

        <div className="space-y-2">
          {webSources.map((s, i) => (
            <a
              key={i}
              href={s.url}
              target="_blank"
              rel="noreferrer"
              className="block p-3 bg-white/5 border border-white/10 rounded-2xl hover:bg-white/10 transition-colors space-y-1"
            >
              <div className="flex items-center justify-between text-xs font-bold text-blue-300">
                <span className="truncate">{s.title}</span>
                <ExternalLink size={12} className="flex-shrink-0" />
              </div>
              <p className="text-[10px] text-slate-400 line-clamp-2">{s.snippet}</p>
            </a>
          ))}
        </div>
      </motion.div>
    );
  }

  if (actionLabel) {
    return (
      <motion.div
        initial={{ opacity: 0, y: 10 }}
        animate={{ opacity: 1, y: 0 }}
        className="my-2"
      >
        {actionUrl ? (
          <a
            href={actionUrl}
            target="_blank"
            rel="noreferrer"
            className="w-full h-12 vaqta-gradient rounded-2xl text-white text-xs font-black uppercase tracking-wider flex items-center justify-center gap-2 shadow-lg vaqta-glow"
          >
            <Compass size={16} />
            <span>{actionLabel}</span>
            <ExternalLink size={14} />
          </a>
        ) : actionRoute ? (
          <button
            onClick={() => nav(actionRoute)}
            className="w-full h-12 vaqta-gradient rounded-2xl text-white text-xs font-black uppercase tracking-wider flex items-center justify-center gap-2 shadow-lg vaqta-glow"
          >
            <Compass size={16} />
            <span>{actionLabel}</span>
            <ArrowRight size={14} />
          </button>
        ) : null}
      </motion.div>
    );
  }

  return null;
}