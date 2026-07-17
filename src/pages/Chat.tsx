import { useState, useRef, useEffect } from "react";
import { Send, Image as ImageIcon, Bot } from "lucide-react";
import { useTranslation } from "react-i18next";
import { useApp } from "@/lib/theme";
import { useTelegramUser } from "@/components/TelegramProvider";
import { useAiChat } from "@/hooks/useAiChat";

interface Message {
  id: string;
  role: "user" | "assistant";
  content: string;
  createdAt: Date;
}

const makeId = () =>
  typeof crypto !== "undefined" && crypto.randomUUID
    ? crypto.randomUUID()
    : Math.random().toString(36).slice(2);

export default function Chat() {
  const { t } = useTranslation();
  const { lang } = useApp();
  const { isInTelegram } = useTelegramUser();
  const { sendMessage, loading } = useAiChat({
    onError: (msg) =>
      setMessages((prev) => [
        ...prev,
        { id: makeId(), role: "assistant", content: msg, createdAt: new Date() },
      ]),
  });
  const [messages, setMessages] = useState<Message[]>([
    { id: makeId(), role: "assistant", content: t("ai_hello"), createdAt: new Date() },
  ]);
  const [input, setInput] = useState("");
  const fileInputRef = useRef<HTMLInputElement>(null);
  const messagesContainerRef = useRef<HTMLDivElement>(null);
  const messagesEndRef = useRef<HTMLDivElement>(null);

  useEffect(() => {
    const container = messagesContainerRef.current;
    if (container) {
      container.scrollTop = container.scrollHeight;
    }
  }, [messages, loading]);

  async function handleSend() {
    if (!input.trim() || loading) return;
    const text = input;
    setMessages((prev) => [
      ...prev,
      { id: makeId(), role: "user", content: text, createdAt: new Date() },
    ]);
    setInput("");
    const reply = await sendMessage(text);
    if (reply) {
      setMessages((prev) => [
        ...prev,
        { id: makeId(), role: "assistant", content: reply, createdAt: new Date() },
      ]);
    }
  }

  async function handleFileUpload(e: React.ChangeEvent<HTMLInputElement>) {
    const file = e.target.files?.[0];
    if (!file || loading) return;
    const reader = new FileReader();
    reader.onload = () => {
      const base64 = (reader.result as string).split(",")[1];
      setMessages((prev) => [
        ...prev,
        { id: makeId(), role: "user", content: "📷 " + t("scanner_title"), createdAt: new Date() },
      ]);
      sendMessage("Распознай текст на изображении", base64).then((reply) => {
        if (reply)
          setMessages((prev) => [
            ...prev,
            { id: makeId(), role: "assistant", content: reply, createdAt: new Date() },
          ]);
      });
    };
    reader.readAsDataURL(file);
  }

  return (
    <div className="page-container">
      <div className="page-header">
        <div className="flex items-center gap-2 justify-center">
          <Bot size={20} className="text-blue-600" />
          <h1 className="text-xl font-bold">{t("chat_title")}</h1>
          <span className="text-xs text-gray-500 uppercase">{lang}</span>
        </div>
      </div>

      <div ref={messagesContainerRef} className="messages-area">
        {messages.map((msg) => (
          <div
            key={msg.id}
            className={`message-bubble ${msg.role}`}
          >
            {msg.content}
          </div>
        ))}
        <div ref={messagesEndRef} />
        {loading && (
          <div className="flex justify-center items-center py-4">
            <div className="animate-spin rounded-full h-8 w-8 border-b-2 border-blue-600"></div>
          </div>
        )}
      </div>

      <div className="page-footer">
        <div className="flex gap-2">
          <button
            onClick={() => fileInputRef.current?.click()}
            className="p-2 rounded-full bg-gray-100 hover:bg-gray-200"
            disabled={loading}
          >
            <ImageIcon size={20} />
          </button>
          <input
            ref={fileInputRef}
            type="file"
            accept="image/*"
            className="hidden"
            onChange={handleFileUpload}
          />
          <input
            value={input}
            onChange={(e) => setInput(e.target.value)}
            onKeyDown={(e) => {
              if (e.key === "Enter" && !e.shiftKey) {
                e.preventDefault();
                handleSend();
              }
            }}
            placeholder={t("chat_ph")}
            className="flex-1 p-2 border rounded-full px-4 outline-none focus:border-blue-400"
            disabled={loading}
          />
          <button
            onClick={handleSend}
            className="p-2 rounded-full bg-blue-600 text-white hover:bg-blue-700 disabled:opacity-50"
            disabled={loading}
          >
            <Send size={20} />
          </button>
        </div>
      </div>
    </div>
  );
}