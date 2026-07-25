import { createRoot } from "react-dom/client";
import { BrowserRouter } from "react-router-dom";
import App from "./App.tsx";
import { AppLifecycleProvider } from "@/providers/AppLifecycleProvider.tsx";
import "./globals.css";

const rootElement = document.getElementById("root");
if (!rootElement) throw new Error("Failed to find the root element");

const root = createRoot(rootElement);
root.render(
  <BrowserRouter>
    <AppLifecycleProvider>
      <App />
    </AppLifecycleProvider>
  </BrowserRouter>
);