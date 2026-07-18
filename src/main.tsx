/*
 VaxtaGo AI

 Founder:
 Диев Дмитрий Сергеевич

 Copyright © 2026 VaxtaGo

 All rights reserved.
*/

import { createRoot } from "react-dom/client";
import App from "./App.tsx";
import "./globals.css";

if (typeof window !== "undefined" && window.Telegram?.WebApp) {
  try {
    window.Telegram.WebApp.ready();
    window.Telegram.WebApp.expand();
    if (typeof window.Telegram.WebApp.disableVerticalSwipes === "function") {
      window.Telegram.WebApp.disableVerticalSwipes();
    }
  } catch (e) {
    console.warn("Telegram WebApp init failed:", e);
  }
}

const rootElement = document.getElementById("root");
if (!rootElement) throw new Error("Root element not found");

createRoot(rootElement).render(<App />);