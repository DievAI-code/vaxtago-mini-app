import { Toaster } from "@/components/ui/toaster";
import { Toaster as Sonner } from "@/components/ui/sonner";
import { TooltipProvider } from "@/components/ui/tooltip";
import { QueryClient, QueryClientProvider } from "@tanstack/react-query";
import { BrowserRouter, Routes, Route, Navigate } from "react-router-dom";
import { Suspense, lazy, memo } from "react";
import { AppProvider } from "@/lib/theme";
import { ErrorBoundary } from "@/components/ErrorBoundary";
import { NavStackProvider } from "@/components/NavigationStack";
import { motion } from "framer-motion";
import "@/i18n";

// Lazy loading pages to prevent white screen and heavy initial bundle
const Home = lazy(() => import("./pages/Home"));
const Jobs = lazy(() => import("./pages/Jobs"));
const AiAssistant = lazy(() => import("./pages/AiAssistant"));
const Profile = lazy(() => import("./pages/Profile"));
const History = lazy(() => import("./pages/History"));
const Scanner = lazy(() => import("./pages/Scanner"));
const Translate = lazy(() => import("./pages/Translate"));
const PhotoTranslator = lazy(() => import("./pages/PhotoTranslator"));
const Documents = lazy(() => import("./pages/Documents"));
const Settings = lazy(() => import("./pages/Settings"));
const Premium = lazy(() => import("./pages/Premium"));
const About = lazy(() => import("./pages/About"));
const Contacts = lazy(() => import("./pages/Contacts"));
const Privacy = lazy(() => import("./pages/Privacy"));
const Terms = lazy(() => import("./pages/Terms"));
const NotFound = lazy(() => import("./pages/NotFound"));

const queryClient = new QueryClient({
  defaultOptions: {
    queries: {
      refetchOnWindowFocus: false,
      retry: false,
    },
  },
});

const LoadingScreen = memo(() => (
  <div className="min-h-screen flex flex-col items-center justify-center bg-[#09090B]">
    <div className="w-10 h-10 rounded-full border-2 border-[#2563EB]/40 border-t-[#2563EB] animate-spin" />
    <p className="mt-4 text-sm text-slate-500 font-medium">Загрузка VaxtaGo...</p>
  </div>
));

const App = () => (
  <QueryClientProvider client={queryClient}>
    <AppProvider>
      <TooltipProvider>
        <ErrorBoundary>
          <NavStackProvider>
            <BrowserRouter>
              <Suspense fallback={<LoadingScreen />}>
                <motion.div 
                  initial={{ opacity: 0 }} 
                  animate={{ opacity: 1 }} 
                  transition={{ duration: 0.3 }}
                >
                  <Routes>
                    <Route path="/" element={<Navigate to="/home" replace />} />
                    <Route path="/home" element={<Home />} />
                    <Route path="/jobs" element={<Jobs />} />
                    <Route path="/ai" element={<AiAssistant />} />
                    <Route path="/profile" element={<Profile />} />
                    <Route path="/history" element={<History />} />
                    <Route path="/scanner" element={<Scanner />} />
                    <Route path="/translate" element={<Translate />} />
                    <Route path="/photo-translator" element={<PhotoTranslator />} />
                    <Route path="/documents" element={<Documents />} />
                    <Route path="/settings" element={<Settings />} />
                    <Route path="/premium" element={<Premium />} />
                    <Route path="/about" element={<About />} />
                    <Route path="/contacts" element={<Contacts />} />
                    <Route path="/privacy" element={<Privacy />} />
                    <Route path="/terms" element={<Terms />} />
                    <Route path="*" element={<NotFound />} />
                  </Routes>
                </motion.div>
              </Suspense>
            </BrowserRouter>
          </NavStackProvider>
          <Toaster />
          <Sonner position="top-center" expand={false} richColors />
        </ErrorBoundary>
      </TooltipProvider>
    </AppProvider>
  </QueryClientProvider>
);

export default App;