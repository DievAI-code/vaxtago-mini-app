import { Header } from "@/components/Header";
import { BottomNav } from "@/components/BottomNav";
import { Card } from "@/components/ui/card";
import { ChatHistory, useChatSessions } from "@/components/ChatHistory";
import { useNavigate } from "react-router-dom";
import { FadeUp } from "@/components/animations";
import { MessageSquare, Plus, Trash2 } from "lucide-react";

export default function History() {
  const nav = useNavigate();
  const { sessions, activeId, createSession, deleteSession, selectSession } = useChatSessions();

  return (
    <div className="flex flex-col h-[100dvh] bg-[#0F172A] text-white">
      <Header title="История" />
      
      <div className="flex-1 min-h-0 overflow-y-auto px-4 py-4">
        <FadeUp>
          <div className="flex items-center justify-between mb-4">
            <h2 className="text-lg font-bold">Чаты</h2>
            <button onClick={() => { createSession(); nav("/ai"); }} className="p-2 rounded-xl bg-slate-800/50 text-[#06B6D4] hover:bg-slate-700/50 transition" aria-label="New chat">
              <Plus size={18} />
            </button>
          </div>

          {sessions.length === 0 ? (
            <Card variant="default" className="text-center py-12">
              <MessageSquare className="w-12 h-12 text-slate-600 mx-auto mb-3" />
              <p className="text-slate-400">История пуста</p>
              <p className="text-xs text-slate-500 mt-1">Начните новый чат с AI</p>
            </Card>
          ) : (
            <div className="space-y-2">
              {sessions.map((s) => (
                <Card key={s.id} variant="default" className="flex items-center gap-3 py-3 cursor-pointer hover:bg-slate-700/30" onClick={() => { selectSession(s.id); nav("/ai"); }}>
                  <div className="w-10 h-10 rounded-xl bg-slate-700/50 flex items-center justify-center text-[#06B6D4]">
                    <MessageSquare className="w-5 h-5" />
                  </div>
                  <div className="flex-1 min-w-0">
                    <p className="font-medium text-sm truncate">{s.title}</p>
                    <p className="text-xs text-slate-400">{new Date(s.updated_at).toLocaleDateString()}</p>
                  </div>
                  <button onClick={(e) => { e.stopPropagation(); deleteSession(s.id); }} className="p-2 rounded-xl text-red-400 hover:bg-red-500/10 transition" aria-label="Delete">
                    <Trash2 size={16} />
                  </button>
                </Card>
              ))}
            </div>
          )}
        </FadeUp>
      </div>

      <BottomNav />
    </div>
  );
}