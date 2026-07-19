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
import { TelegramProvider, useTelegramUser } from "@/components/TelegramProvider";
import { NavStackProvider } from "@/components/NavigationStack";
import { motion, AnimatePresence } from "framer-motion";
import Index from "./pages/Index";
import "@/i18n";

const NotFound = lazy(() => import("./pages/NotFound"));
const About = lazy(() => import("./pages/About"));
const Contacts = lazy(() => import("./pages/Contacts"));
const Privacy = lazy(() => import("./pages/Privacy"));
const Terms = lazy(() => import("./pages/Terms"));
const Scanner = lazy(() => import("./pages/Scanner"));
const Jobs = lazy(() => import("./pages/Jobs"));
const AiAssistant = lazy(() => import("./pages/AiAssistant"));
const Documents = lazy(() => import("./pages/Documents"));
const Translate = lazy(() => import("./pages/Translate"));
const Profile = lazy(() => import("./pages/Profile"));
const History = lazy(() => import("./pages/History"));
const Premium = lazy(() => import("./pages/Premium"));
const Settings = lazy(() => import("./pages/Settings"));

const queryClient = new QueryClient();

const PageFallback = () => (
  <div className="min-h-screen flex items-center justify-center bg-[#080B14]">
    <div className="w-8 h-8 rounded-full border-2 border-[#7C3AED]/40 border-t-[#7C3AED] animate-spin" />
  </div>
);

const AppContent = () => {
  const [loading, setLoading] = useState(true);
  const { isInTelegram: inTg, isAuthed, authLoading } = useTelegramUser();

  useEffect(() => {
    document.title = "VaxtaGo 2.0 — AI Super App";
    const bootSplash = document.getElementById("boot-splash");
    if (bootSplash) bootSplash.remove();
    const isTelegram = Boolean(window.Telegram?.WebApp?.initData);
    const tg = window.Telegram?.WebApp;
    if (isTelegram && tg) {
      try { tg.ready(); tg.expand(); document.body.classList.add("telegram-app"); } catch (e) { console.warn("Telegram WebApp init failed:", e); }
    }
    const setViewport = () => { const h = window.visualViewport?.height || window.innerHeight; document.documentElement.style.setProperty("--app-height", `${h}px`); };
    setViewport();
    window.visualViewport?.addEventListener("resize", setViewport);
    const t = setTimeout(() => setLoading(false), 1200);
    return () => { clearTimeout(t); window.visualViewport?.removeEventListener("resize", setViewport); };
  }, []);

  // Inside Telegram: skip AuthScreen entirely, go straight to app when authed
  // Outside Telegram: show AuthScreen (which shows the "open in Telegram" page)
  const showAuth = !inTg || (inTg && !isAuthed && !authLoading);

  return (
    <AnimatePresence mode="wait">
      {loading ? (
        <SplashScreen />
      ) : showAuth ? (
        <AuthScreen onAuth={() => {}} />
      ) : (
        <motion.div initial={{ opacity: 0 }} animate={{ opacity: 1 }} transition={{ duration: 0.5 }} className="app-container">
          <BrowserRouter>
            <NavStackProvider>
              <Suspense fallback={<PageFallback />}>
                <Routes>
                  <Route path="/" element={<Index />} />
                  <Route path="/ai" element={<AiAssistant />} />
                  <Route path="/jobs" element={<Jobs />} />
                  <Route path="/documents" element={<Documents />} />
                  <Route path="/translate" element={<Translate />} />
                  <Route path="/profile" element={<Profile />} />
                  <Route path="/history" element={<History />} />
                  <Route path="/premium" element={<Premium />} />
                  <Route path="/settings" element={<Settings />} />
                  <Route path="/about" element={<About />} />
                  <Route path="/contacts" element={<Contacts />} />
                  <Route path="/privacy" element={<Privacy />} />
                  <Route path="/terms" element={<Terms />} />
                  <Route path="/scanner" element={<Scanner />} />
                  <Route path="*" element={<NotFound />} />
                </Routes>
              </Suspense>
            </NavStackProvider>
          </BrowserRouter>
        </motion.div>
      )}
    </AnimatePresence>
  );
};

const App = () => {
  return (
    <QueryClientProvider client={queryClient}>
      <AppProvider>
        <TelegramProvider>
          <TooltipProvider>
            <ErrorBoundary>
              <Toaster />
              <Sonner />
              <AppContent />
            </ErrorBoundary>
          </TooltipProvider>
        </TelegramProvider>
      </AppProvider>
    </QueryClientProvider>
  );
};

export default App;