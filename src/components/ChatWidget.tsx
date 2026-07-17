import { useState, useRef, useEffect } from "react";
import { motion, AnimatePresence } from "framer-motion";
import { Send, Image as ImageIcon, Paperclip, Mic } from "lucide-react";
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
    <div className="rounded-3xl bg-white/70 dark:bg-slate-800/70 backdrop-blur-xl border border-slate-200/60 dark:border-slate-700/60 shadow-xl overflow-hidden">
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
                  : "bg-slate-100 dark:bg-slate-700 text-slate-800 dark:text-white"
              }`}
            >
              {m.content}
            </motion.div>
          ))}
        </AnimatePresence>
        {loading && (
          <div className="bg-slate-100 dark:bg-slate-700 p-3 rounded-2xl w-fit">
            <TypingDots />
          </div>
        )}
        <div ref={endRef} />
      </div>

      <div className="border-t border-slate-200/60 dark:border-slate-700/60 p-3 flex items-end gap-2">
        <button onClick={() => fileRef.current?.click()} className="p-2 rounded-xl text-slate-500 hover:bg-slate-100 dark:hover:bg-slate-700" aria-label="Attach">
          <Paperclip size={18} />
        </button>
        <button onClick={() => fileRef.current?.click()} className="p-2 rounded-xl text-slate-500 hover:bg-slate-100 dark:hover:bg-slate-700" aria-label="Photo">
          <ImageIcon size={18} />
        </button>
        <button className="p-2 rounded-xl text-slate-500 hover:bg-slate-100 dark:hover:bg-slate-700" aria-label="Voice">
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
          className="flex-1 resize-none max-h-24 px-3 py-2 rounded-xl bg-slate-50 dark:bg-slate-900 border border-slate-200 dark:border-slate-700 outline-none text-sm text-slate-800 dark:text-white"
        />
        <button
          onClick={() => { send(input); setInput(""); }}
          className="p-2.5 rounded-xl bg-gradient-to-br from-blue-600 to-cyan-400 text-white hover:opacity-90"
          aria-label="Send"
        >
          <Send size={18} />
        </button>
      </div>
    </div>
  );
}