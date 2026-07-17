import { Toaster } from "@/components/ui/toaster";
import { Toaster as Sonner } from "@/components/ui/sonner";
import { TooltipProvider } from "@/components/ui/tooltip";
import { QueryClient, QueryClientProvider } from "@tanstack/react-query";
import { BrowserRouter, Routes, Route } from "react-router-dom";
import { useState, useEffect, Suspense, lazy } from "react";
import { AppProvider } from "@/lib/theme";
import { SplashScreen } from "@/components/SplashScreen";
import { AuthScreen } from "@/components/AuthScreen";
import { ErrorBoundary } from "@/components/ErrorBoundary";
import { TelegramProvider } from "@/components/TelegramProvider";
import { motion, AnimatePresence } from "framer-motion";
import Index from "./pages/Index";
import Footer from "./components/Footer";
import "@/i18n";

// Lazy-load all non-home pages for faster first paint
const NotFound = lazy(() => import("./pages/NotFound"));
const About = lazy(() => import("./pages/About"));
const Contacts = lazy(() => import("./pages/Contacts"));
const Privacy = lazy(() => import("./pages/Privacy"));
const Terms = lazy(() => import("./pages/Terms"));
const Scanner = lazy(() => import("./pages/Scanner"));
const Jobs = lazy(() => import("./pages/Jobs"));
const Profile = lazy(() => import("./pages/Profile"));
const Chat = lazy(() => import("./pages/Chat"));

const queryClient = new QueryClient();

const PageFallback = () => (
  <div className="min-h-screen flex items-center justify-center bg-gradient-to-br from-slate-900 via-blue-900 to-purple-900">
    <div className="w-8 h-8 rounded-full border-2 border-white/40 border-t-white animate-spin" />
  </div>
);

const App = () => {
  const [loading, setLoading] = useState(true);
  const [authed, setAuthed] = useState(false);

  useEffect(() => {
    document.title = "VaxtaGo — AI помощник для мигрантов";
    const meta = document.createElement("meta");
    meta.name = "description";
    meta.content = "VaxtaGo: поиск работы, проверка работодателей, перевод документов, юридическая помощь и миграция.";
    document.head.appendChild(meta);

    // Remove boot splash from index.html once React is ready
    const bootSplash = document.getElementById("boot-splash");
    if (bootSplash) bootSplash.remove();

    // Telegram Mini App viewport handling
    const isTelegram = Boolean(window.Telegram?.WebApp?.initData);
    const tg = window.Telegram?.WebApp;
    if (isTelegram && tg) {
      try {
        tg.ready();
        tg.expand();
        document.body.classList.add("telegram-app");
      } catch (e) {
        console.warn("Telegram WebApp init failed:", e);
      }
    }

    const setViewport = () => {
      const height = window.visualViewport?.height || window.innerHeight;
      document.documentElement.style.setProperty("--app-height", `${height}px`);
    };
    setViewport();
    window.visualViewport?.addEventListener("resize", setViewport);

    // Minimal loading delay for smooth transition
    const t = setTimeout(() => setLoading(false), 1200);

    return () => {
      clearTimeout(t);
      window.visualViewport?.removeEventListener("resize", setViewport);
    };
  }, []);

  return (
    <QueryClientProvider client={queryClient}>
      <AppProvider>
        <TelegramProvider>
          <TooltipProvider>
            <ErrorBoundary>
              <Toaster />
              <Sonner />
              <AnimatePresence mode="wait">
                {loading ? (
                  <SplashScreen />
                ) : !authed ? (
                  <AuthScreen onAuth={() => setAuthed(true)} />
                ) : (
                  <motion.div
                    initial={{ opacity: 0 }}
                    animate={{ opacity: 1 }}
                    transition={{ duration: 0.5 }}
                    className="app-container"
                  >
                    <BrowserRouter>
                      <Suspense fallback={<PageFallback />}>
                        <Routes>
                          <Route path="/" element={<Index />} />
                          <Route path="/about" element={<About />} />
                          <Route path="/contacts" element={<Contacts />} />
                          <Route path="/privacy" element={<Privacy />} />
                          <Route path="/terms" element={<Terms />} />
                          <Route path="/scanner" element={<Scanner />} />
                          <Route path="/jobs" element={<Jobs />} />
                          <Route path="/profile" element={<Profile />} />
                          <Route path="/chat" element={<Chat />} />
                          <Route path="*" element={<NotFound />} />
                        </Routes>
                      </Suspense>
                    </BrowserRouter>
                  </motion.div>
                )}
              </AnimatePresence>
            </ErrorBoundary>
          </TooltipProvider>
        </TelegramProvider>
      </AppProvider>
    </QueryClientProvider>
  );
};

export default App;