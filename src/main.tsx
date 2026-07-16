/*
VaxtaGo
Created by Dmitry Diev
AI Development Assistant: ChatGPT (OpenAI)
Copyright © 2026
*/

import { createRoot } from "react-dom/client";
import App from "./App.tsx";
import "./globals.css";
import { AuthProvider } from "./context/AuthContext";

// Initialize Telegram WebApp SDK safely (won't break if not in Telegram)
function initTelegramWebApp() {
  try {
    const script = document.createElement("script");
    script.src = "https://telegram.org/js/telegram-web-app.js";
    script.async = true;
    document.head.appendChild(script);

    script.onload = () => {
      const tg = (window as any).Telegram?.WebApp;
      if (tg) {
        tg.ready();
        tg.expand();
      }
    };
  } catch (e) {
    console.log("Telegram SDK not available, continuing as web app");
  }
}

initTelegramWebApp();

const rootElement = document.getElementById("root");
if (!rootElement) {
  throw new Error("Root element not found");
}

createRoot(rootElement).render(
  <AuthProvider>
    <App />
  </AuthProvider>
);