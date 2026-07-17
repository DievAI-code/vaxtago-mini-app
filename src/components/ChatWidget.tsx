import { useState, useRef, useEffect } from "react";
import { motion, AnimatePresence } from "framer-motion";
import { Send, Image as ImageIcon, Paperclip, Mic, X } from "lucide-react";
import { supabase } from "@/integrations/supabase/client";
import { TypingDots } from "./animations";
import { useStrings } from "@/lib/theme";

interface Msg {
  role: "user" | "assistant";
  content: string;
}

export function ChatWidget() {
  const s = useStrings();
  const [messages, setMessages] = useState<Msg[]>([
    { role: "assistant", content: "Привет! Я VaxtaGo AI. Напишите вопрос — я сам пойму, чем помочь." },
  ]);
  const [input, setInput] = useState("");
  const [loading, setLoading] = useState(false);
  const fileRef = useRef<HTMLInputElement>(null);
  const endRef = useRef<HTMLDivElement>(null);

  useEffect(() => {
    endRef.current?.scrollIntoView({ behavior: "smooth" });
  }, [messages, loading]);

  async function send(text: string, image?: string) {
    if (!text.trim() && !image) return;
    setMessages((m) => [...m, { role: "user", content: image ? "📷 Изображение" : text }]);
    setLoading(true);
    try {
      const { data: { session } } = await supabase.auth.getSession();
      const userId = session?.user?.id ?? "anonymous";
      const { data, error } = await supabase.functions.invoke("ai-router", {
        body: { type: image ? "vision" : "assistant", userId, text, image },
      });
      if (error) throw error;
      setMessages((m) => [...m, { role: "assistant", content: data.reply ?? data.text }]);
    } catch {
      setMessages((m) => [...m, { role: "assistant", content: "Ошибка связи с AI." }]);
    } finally {
      setLoading(false);
    }
  }

  function onKey(e: React.KeyboardEvent<HTMLTextAreaElement>) {
    if (e.key === "Enter" && !e.shiftKey) {
      e.preventDefault();
      send(input);
      setInput("");
    }
  }

  return (
    <div className="rounded-3xl bg-white/90 dark:bg-slate-900/90 backdrop-blur-xl border border-slate-200/60 dark:border-slate-700/60 shadow-2xl overflow-hidden">
      <div className="bg-gradient-to-r from-blue-600/10 to-cyan-400/10 p-4 border-b border-slate-200/60 dark:border-slate-700/60">
        <div className="flex items-center justify-between">
          <div className="flex items-center gap-3">
            <div className="w-8 h-8 rounded-full bg-gradient-to-br from-blue-600 to-cyan-400 flex items-center justify-center">
              <Bot className="w-4 h-4 text-white" />
            </div>
            <span className="font-semibold">VaxtaGo AI</span>
          </div>
          <button className="p-1 rounded-lg hover:bg-slate-200 dark:hover:bg-slate-700">
            <X className="w-4 h-4" />
          </button>
        </div>
      </div>
      
      <div className="h-[420px] overflow-y-auto p-4 space-y-3">
        <AnimatePresence>
          {messages.map((m, i) => (
            <motion.div
              key={i}
              initial={{ opacity: 0, y: 10 }}
              animate={{ opacity: 1, y: 0 }}
              className={`max-w-[85%] p-3 rounded-2xl ${
                m.role === "user"
                  ? "ml-auto bg-gradient-to-br from-blue-600 to-blue-500 text-white"
                  : "bg-slate-100 dark:bg-slate-800 text-slate-800 dark:text-white"
              }`}
            >
              {m.content}
            </motion.div>
          ))}
        </AnimatePresence>
        {loading && (
          <div className="bg-slate-100 dark:bg-slate-800 p-3 rounded-2xl w-fit">
            <TypingDots />
          </div>
        )}
        <div ref={endRef} />
      </div>

      <div className="border-t border-slate-200/60 dark:border-slate-700/60 p-4 bg-slate-50/50 dark:bg-slate-800/50">
        <div className="flex items-end gap-2">
          <button onClick={() => fileRef.current?.click()} className="p-2 rounded-xl text-slate-500 hover:bg-slate-200 dark:hover:bg-slate-700 transition-colors" aria-label="Attach">
            <Paperclip size={18} />
          </button>
          <button onClick={() => fileRef.current?.click()} className="p-2 rounded-xl text-slate-500 hover:bg-slate-200 dark:hover:bg-slate-700 transition-colors" aria-label="Photo">
            <ImageIcon size={18} />
          </button>
          <button className="p-2 rounded-xl text-slate-500 hover:bg-slate-200 dark:hover:bg-slate-700 transition-colors" aria-label="Voice">
            <Mic size={18} />
          </button>
          <input ref={fileRef} type="file" accept="image/*" className="hidden" onChange={(e) => {
            const f = e.target.files?.[0];
            if (!f) return;
            const r = new FileReader();
            r.onload = () => send("Распознай текст", (r.result as string).split(",")[1]);
            r.readAsDataURL(f);
          }} />
          <textarea
            value={input}
            onChange={(e) => setInput(e.target.value)}
            onKeyDown={onKey}
            rows={1}
            placeholder={s.chat_ph}
            className="flex-1 resize-none max-h-24 px-4 py-3 rounded-xl bg-white dark:bg-slate-700 border border-slate-200 dark:border-slate-600 outline-none text-sm text-slate-800 dark:text-white"
          />
          <button
            onClick={() => { send(input); setInput(""); }}
            className="p-3 rounded-xl bg-gradient-to-br from-blue-600 to-cyan-400 text-white hover:scale-105 transition-all duration-200 shadow-lg"
            aria-label="Send"
          >
            <Send size={18} />
          </button>
        </div>
      </div>
    </div>
  );
}