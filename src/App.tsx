import { Toaster } from "@/components/ui/toaster";
import { Toaster as Sonner } from "@/components/ui/sonner";
import { TooltipProvider } from "@/components/ui/tooltip";
import { QueryClient, QueryClientProvider } from "@tanstack/react-query";
import { Routes, Route, Navigate } from "react-router-dom";
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
const Login = lazy(() => import("./pages/Login"));
const AdminAnalytics = lazy(() => import("./pages/AdminAnalytics"));
const NotFound = lazy(() => import("./pages/NotFound"));

const queryClient = new QueryClient({
  defaultOptions: {
    queries: { retry: false },
  },
});

const PrivateRoute = ({ children }: { children: React.ReactNode }) => {
  const isAuthed = localStorage.getItem("vaxtago_auth") === "true";
  return isAuthed ? <>{children}</> : <Navigate to="/login" replace />;
};

const LoadingScreen = () => (
  <div className="min-h-[100dvh] flex flex-col items-center justify-center bg-[#06140F]">
    <div className="w-12 h-12 rounded-full border-4 border-[#00A86B]/20 border-t-[#00A86B] animate-spin" />
    <p className="mt-4 text-[#00A86B] font-bold animate-pulse uppercase tracking-widest text-xs">VAQTA AI</p>
  </div>
);

const App = () => {
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
                        <Route path="/login" element={<Login />} />
                        <Route path="/" element={<PrivateRoute><Index /></PrivateRoute>} />
                        <Route path="/home" element={<PrivateRoute><Home /></PrivateRoute>} />
                        <Route path="/jobs" element={<PrivateRoute><Jobs /></PrivateRoute>} />
                        <Route path="/ai" element={<PrivateRoute><AiAssistant /></PrivateRoute>} />
                        <Route path="/profile" element={<PrivateRoute><Profile /></PrivateRoute>} />
                        <Route path="/scanner" element={<PrivateRoute><Scanner /></PrivateRoute>} />
                        <Route path="/admin" element={<AdminAnalytics />} />
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