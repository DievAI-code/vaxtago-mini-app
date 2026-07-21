import { Toaster } from "@/components/ui/toaster";
import { Toaster as Sonner } from "@/components/ui/sonner";
import { TooltipProvider } from "@/components/ui/tooltip";
import { QueryClient, QueryClientProvider } from "@tanstack/react-query";
import { Routes, Route } from "react-router-dom";
import { Suspense, lazy } from "react";
import { AppProvider } from "@/lib/theme";
import { LanguageProvider } from "@/context/LanguageProvider";
import { ErrorBoundary } from "@/components/ErrorBoundary";
import { NavStackProvider } from "@/components/NavigationStack";
import { motion, AnimatePresence } from "framer-motion";
import "@/i18n";

// Lazy loading pages
const Index = lazy(() => import("./pages/Index"));
const Home = lazy(() => import("./pages/Home"));
const Jobs = lazy(() => import("./pages/Jobs"));
const AiAssistant = lazy(() => import("./pages/AiAssistant"));
const Profile = lazy(() => import("./pages/Profile"));
const Scanner = lazy(() => import("./pages/Scanner"));
const LanguageSelect = lazy(() => import("./pages/LanguageSelect"));
const NotFound = lazy(() => import("./pages/NotFound"));
const Settings = lazy(() => import("./pages/Settings"));

const queryClient = new QueryClient({
  defaultOptions: {
    queries: {
      refetchOnWindowFocus: false,
      retry: false,
    },
  },
});

const LoadingScreen = () => (
  <div className="min-h-[100dvh] flex flex-col items-center justify-center bg-[#06140F]">
    <div className="w-12 h-12 rounded-full border-4 border-[#00A86B]/20 border-t-[#00A86B] animate-spin" />
    <p className="mt-4 text-[#00A86B] font-bold animate-pulse">VAQTA AI</p>
  </div>
);

const App = () => {
  console.log("VAQTA AI PRODUCTION MODE ACTIVE");
  
  return (
    <QueryClientProvider client={queryClient}>
      <LanguageProvider>
        <AppProvider>
          <TooltipProvider>
            <NavStackProvider>
              <ErrorBoundary>
                <Suspense fallback={<LoadingScreen />}>
                  <AnimatePresence mode="wait">
                    <motion.div 
                      initial={{ opacity: 1 }} 
                      animate={{ opacity: 1 }} 
                      exit={{ opacity: 0 }}
                      className="min-h-[100dvh] bg-[#06140F] overflow-x-hidden"
                    >
                      <Routes>
                        <Route path="/" element={<Index />} />
                        <Route path="/welcome" element={<LanguageSelect />} />
                        <Route path="/home" element={<Home />} />
                        <Route path="/jobs" element={<Jobs />} />
                        <Route path="/ai" element={<AiAssistant />} />
                        <Route path="/profile" element={<Profile />} />
                        <Route path="/scanner" element={<Scanner />} />
                        <Route path="/settings" element={<Settings />} />
                        <Route path="*" element={<NotFound />} />
                      </Routes>
                    </motion.div>
                  </AnimatePresence>
                </Suspense>
              </ErrorBoundary>
              <Toaster />
              <Sonner position="top-center" richColors />
            </NavStackProvider>
          </TooltipProvider>
        </AppProvider>
      </LanguageProvider>
    </QueryClientProvider>
  );
};

export default App;