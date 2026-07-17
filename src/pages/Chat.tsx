import { useState, useRef, useEffect } from "react";
import { Send, Image as ImageIcon, Bot } from "lucide-react";
import { supabase } from "@/integrations/supabase/client";
import { useTranslation } from "react-i18next";
import { useApp } from "@/lib/theme";
import { useTelegramUser } from "@/components/TelegramProvider";

interface Message {
  role: "user" | "assistant";
  content: string;
}

export default function Chat() {
  const { t } = useTranslation();
  const { lang } = useApp();
  const { telegramId, isInTelegram } = useTelegramUser();
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
      const body = {
        message,
        telegram_id: isInTelegram ? telegramId : null,
        language: lang,
        image: imageBase64,
        context: imageBase64 ? "vision" : "chat",
      };
      console.log("AI REQUEST:", JSON.stringify(body));
      const { data, error } = await supabase.functions.invoke("ai-assistant", {
        body,
      });
      console.log("AI STATUS:", error ? "ERROR" : "OK");
      console.log("AI RESPONSE:", JSON.stringify(data));
      if (data?.success === true) {
        setMessages((prev) => [...prev, { role: "assistant", content: data.reply ?? data.text ?? t("ai_error") }]);
      } else if (error) {
        setMessages((prev) => [...prev, { role: "assistant", content: "AI помощник временно занят. Попробуйте ещё раз." }]);
      } else {
        setMessages((prev) => [...prev, { role: "assistant", content: data?.reply ?? "AI помощник временно занят. Попробуйте ещё раз." }]);
      }
    } catch {
      setMessages((prev) => [...prev, { role: "assistant", content: "AI помощник временно занят. Попробуйте ещё раз." }]);
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
      setMessages((prev) => [...prev, { role: "user", content: "📷 " + t("scanner_title") }]);
      sendToRouter("Распознай текст на изображении", base64);
    };
    reader.readAsDataURL(file);
  }

  return (
    <div className="flex flex-col h-screen bg-gray-50">
      <div className="bg-white border-b p-4 shadow-sm">
        <div className="flex items-center gap-2 justify-center">
          <Bot size={20} className="text-blue-600" />
          <h1 className="text-xl font-bold text-center">{t("chat_title")}</h1>
          <span className="text-xs text-gray-500 uppercase">{lang}</span>
        </div>
      </div>
      <div className="flex-1 overflow-y-auto p-4 space-y-3">
        {messages.map((msg, i) => (
          <div key={i} className={`max-w-[80%] p-3 rounded-2xl ${msg.role === "user" ? "ml-auto bg-blue-600 text-white" : "bg-white text-gray-800 shadow-sm"}`}>
            {msg.content}
          </div>
        ))}
        {isLoading && (
          <div className="bg-white p-3 rounded-2xl shadow-sm text-gray-500 flex items-center gap-2">
            <TypingDotsLocal />
          </div>
        )}
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

function TypingDotsLocal() {
  return (
    <div className="flex gap-1">
      {[0, 1, 2].map((i) => (
        <div key={i} className="w-2 h-2 rounded-full bg-blue-500 animate-bounce" style={{ animationDelay: `${i * 0.1}s` }} />
      ))}
    </div>
  );
}