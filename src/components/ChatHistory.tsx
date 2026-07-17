import { useState, useEffect } from "react";
import { Plus, Trash2, MessageSquare } from "lucide-react";

export interface ChatSession {
  id: string;
  title: string;
  created_at: string;
  updated_at: string;
  lastMessage?: string;
}

export function useChatSessions() {
  const [sessions, setSessions] = useState<ChatSession[]>(() => {
    try {
      const cached = localStorage.getItem("vaxtago_sessions");
      if (cached) return JSON.parse(cached);
    } catch {}
    const initial: ChatSession = { id: "default", title: "Новый чат", created_at: new Date().toISOString(), updated_at: new Date().toISOString() };
    return [initial];
  });
  const [activeId, setActiveId] = useState<string>("default");

  useEffect(() => {
    try { localStorage.setItem("vaxtago_sessions", JSON.stringify(sessions)); } catch {}
  }, [sessions]);

  const createSession = () => {
    const id = Math.random().toString(36).slice(2);
    const s: ChatSession = { id, title: "Новый чат", created_at: new Date().toISOString(), updated_at: new Date().toISOString() };
    setSessions((prev) => [s, ...prev]);
    setActiveId(id);
  };

  const deleteSession = (id: string) => {
    setSessions((prev) => {
      const filtered = prev.filter((s) => s.id !== id);
      return filtered.length ? filtered : [{ id: "default", title: "Новый чат", created_at: new Date().toISOString(), updated_at: new Date().toISOString() }];
    });
    if (activeId === id) setActiveId("default");
  };

  const renameSession = (id: string, title: string) => {
    setSessions((prev) => prev.map((s) => s.id === id ? { ...s, title, updated_at: new Date().toISOString() } : s));
  };

  const selectSession = (id: string) => setActiveId(id);

  return { sessions, activeId, createSession, deleteSession, renameSession, selectSession };
}

export function ChatHistory({ sessions, activeId, onSelect, onNew, onDelete }: {
  sessions: ChatSession[];
  activeId: string;
  onSelect: (id: string) => void;
  onNew: () => void;
  onDelete: (id: string) => void;
}) {
  return (
    <div className="flex flex-col h-full">
      <div className="flex items-center justify-between p-4 border-b border-slate-200 dark:border-slate-800">
        <h2 className="font-bold text-slate-800 dark:text-white">Чаты</h2>
        <button onClick={onNew} className="p-2 rounded-full bg-blue-600 text-white hover:scale-105 transition" aria-label="New chat"><Plus size={18} /></button>
      </div>
      <div className="flex-1 overflow-y-auto p-2 space-y-1">
        {sessions.map((s) => (
          <div key={s.id} className={`group flex items-center gap-2 p-3 rounded-xl cursor-pointer ${activeId === s.id ? "bg-blue-50 dark:bg-slate-800" : "hover:bg-slate-100 dark:hover:bg-slate-800"}`} onClick={() => onSelect(s.id)}>
            <MessageSquare size={16} className="text-slate-400 flex-shrink-0" />
            <div className="flex-1 min-w-0">
              <p className="text-sm font-medium text-slate-800 dark:text-white truncate">{s.title}</p>
              <p className="text-xs text-slate-400 truncate">{new Date(s.updated_at).toLocaleDateString()}</p>
            </div>
            <button onClick={(e) => { e.stopPropagation(); onDelete(s.id); }} className="opacity-0 group-hover:opacity-100 text-red-500 p-1" aria-label="Delete"><Trash2 size={14} /></button>
          </div>
        ))}
      </div>
    </div>
  );
}