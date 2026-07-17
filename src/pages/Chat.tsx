import { useState, useRef, useEffect } from "react";
import { Send, Image as ImageIcon } from "lucide-react";
import { supabase } from "@/integrations/supabase/client";
import { useTranslation } from "react-i18next";
import { useApp } from "@/lib/theme";

interface Message {
  role: "user" | "assistant";
  content: string;
}

export default function Chat() {
  const { t } = useTranslation();
  const { lang } = useApp();
  const [messages, setMessages] = useState<Message[]>([
    { role: "assistant", content: t("ai_hello") },
  ]);
  const [input, setInput] = useState("");
  const [isLoading, setIsLoading] = useState(false);
  const fileInputRef = useRef<HTMLInputElement>(null);
  const messagesEndRef = useRef<HTMLDivElement>(null);

  useEffect(() => {
    messagesEndRef.current?.scrollIntoView({ behavior: "smooth" });
  }, [messages]);

  async function sendToRouter(message: string, imageBase64?: string) {
    setIsLoading(true);
    try {
      const { data: { session } } = await supabase.auth.getSession();
      const userId = session?.user?.id ?? "anonymous";
      const { data, error } = await supabase.functions.invoke("ai-router", {
        body: { type: imageBase64 ? "vision" : "assistant", userId, text: message, image: imageBase64, language: lang },
      });
      if (error) throw error;
      setMessages((prev) => [...prev, { role: "assistant", content: data.reply ?? data.text }]);
    } catch (err) {
      console.error(err);
      setMessages((prev) => [...prev, { role: "assistant", content: t("ai_error") }]);
    } finally {
      setIsLoading(false);
    }
  }

  function handleSend() {
    if (!input.trim()) return;
    setMessages((prev) => [...prev, { role: "user", content: input }]);
    sendToRouter(input);
    setInput("");
  }

  async function handleFileUpload(e: React.ChangeEvent<HTMLInputElement>) {
    const file = e.target.files?.[0];
    if (!file) return;
    const reader = new FileReader();
    reader.onload = () => {
      const base64 = (reader.result as string).split(",")[1];
      setMessages((prev) => [...prev, { role: "user", content: "📷 Изображение" }]);
      sendToRouter("Распознай текст на изображении", base64);
    };
    reader.readAsDataURL(file);
  }

  return (
    <div className="flex flex-col h-screen bg-gray-50">
      <div className="bg-white border-b p-4 shadow-sm">
        <h1 className="text-xl font-bold text-center">{t("chat_title")}</h1>
      </div>
      <div className="flex-1 overflow-y-auto p-4 space-y-3">
        {messages.map((msg, i) => (
          <div key={i} className={`max-w-[80%] p-3 rounded-2xl ${msg.role === "user" ? "ml-auto bg-blue-600 text-white" : "bg-white text-gray-800 shadow-sm"}`}>
            {msg.content}
          </div>
        ))}
        {isLoading && <div className="bg-white p-3 rounded-2xl shadow-sm text-gray-500">...</div>}
        <div ref={messagesEndRef} />
      </div>
      <div className="bg-white border-t p-3 flex items-center gap-2">
        <button onClick={() => fileInputRef.current?.click()} className="p-2 rounded-full bg-gray-100 hover:bg-gray-200">
          <ImageIcon size={20} />
        </button>
        <input ref={fileInputRef} type="file" accept="image/*" className="hidden" onChange={handleFileUpload} />
        <input value={input} onChange={(e) => setInput(e.target.value)} onKeyPress={(e) => e.key === "Enter" && handleSend()} placeholder={t("chat_ph")} className="flex-1 p-2 border rounded-full px-4 outline-none focus:border-blue-400" />
        <button onClick={handleSend} className="p-2 rounded-full bg-blue-600 text-white hover:bg-blue-700">
          <Send size={20} />
        </button>
      </div>
    </div>
  );
}