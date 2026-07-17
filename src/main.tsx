import { createRoot } from "react-dom/client";
import App from "./App.tsx";
import "./globals.css";

// Initialize Telegram WebApp for mobile
if (typeof window !== "undefined" && window.Telegram?.WebApp) {
  window.Telegram.WebApp.ready();
  window.Telegram.WebApp.expand();
}

const rootElement = document.getElementById("root");
if (!rootElement) throw new Error("Root element not found");

createRoot(rootElement).render(<App />);