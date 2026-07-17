import { createRoot } from "react-dom/client";
import App from "./App.tsx";
import "./globals.css";

// Initialize Telegram WebApp for mobile (guarded — safe outside Telegram)
if (typeof window !== "undefined" && window.Telegram?.WebApp) {
  try {
    window.Telegram.WebApp.ready();
    window.Telegram.WebApp.expand();
  } catch (e) {
    console.warn("Telegram WebApp init failed:", e);
  }
}

const rootElement = document.getElementById("root");
if (!rootElement) throw new Error("Root element not found");

createRoot(rootElement).render(<App />);