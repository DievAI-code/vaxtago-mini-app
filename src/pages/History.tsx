import { Navbar } from "@/components/Navbar";
import { Footer } from "@/components/Footer";
import { BottomNav } from "@/components/BottomNav";
import { ChatHistory, useChatSessions } from "@/components/ChatHistory";
import { useNavigate } from "react-router-dom";
import { FadeUp } from "@/components/animations";

export default function History() {
  const nav = useNavigate();
  const { sessions, activeId, createSession, deleteSession, selectSession } = useChatSessions();

  return (
    <div className="flex flex-col h-[100dvh] bg-[#F8FAFC] dark:bg-[#0F172A] text-slate-800 dark:text-white">
      <div className="flex-shrink-0"><Navbar /></div>
      <div className="flex-1 min-h-0 overflow-y-auto">
        <div className="max-w-2xl mx-auto px-4 py-6">
          <FadeUp>
            <h1 className="text-2xl font-bold mb-4 bg-gradient-to-r from-[#2563EB] to-[#14B8A6] bg-clip-text text-transparent">История чатов</h1>
            <div className="rounded-[20px] bg-white/70 dark:bg-slate-800/50 backdrop-blur-xl border border-slate-200/60 dark:border-slate-700/60 shadow-lg overflow-hidden">
              <ChatHistory
                sessions={sessions}
                activeId={activeId}
                onSelect={(id) => { selectSession(id); nav("/"); }}
                onNew={() => { createSession(); nav("/"); }}
                onDelete={deleteSession}
              />
            </div>
          </FadeUp>
          <div className="mt-8"><Footer /></div>
        </div>
      </div>
      <BottomNav />
    </div>
  );
}