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

// Lazy loading pages
const Home = lazy(() => import("./pages/Home"));
const Jobs = lazy(() => import("./pages/Jobs"));
const AiAssistant = lazy(() => import("./pages/AiAssistant"));
const Profile = lazy(() => import("./pages/Profile"));
const Scanner = lazy(() => import("./pages/Scanner"));
const LanguageSelect = lazy(() => import("./pages/LanguageSelect"));
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
  <div className="min-h-screen flex flex-col items-center justify-center bg-[#06140F]">
    <div className="w-10 h-10 rounded-full border-2 border-[#00A86B]/40 border-t-[#00A86B] animate-spin" />
  </div>
));

const ProtectedRoute = ({ children }: { children: React.ReactNode }) => {
  const isFirstRun = localStorage.getItem("vaxtago_first_run") !== "false";
  if (isFirstRun) return <Navigate to="/welcome" replace />;
  return <>{children}</>;
};

const App = () => (
  <QueryClientProvider client={queryClient}>
    <AppProvider>
      <TooltipProvider>
        <ErrorBoundary>
          <BrowserRouter>
            <NavStackProvider>
              <Suspense fallback={<LoadingScreen />}>
                <motion.div 
                  initial={{ opacity: 0 }} 
                  animate={{ opacity: 1 }} 
                  transition={{ duration: 0.3 }}
                >
                  <Routes>
                    <Route path="/welcome" element={<LanguageSelect />} />
                    <Route path="/" element={<Navigate to="/home" replace />} />
                    <Route path="/home" element={<ProtectedRoute><Home /></ProtectedRoute>} />
                    <Route path="/jobs" element={<ProtectedRoute><Jobs /></ProtectedRoute>} />
                    <Route path="/ai" element={<ProtectedRoute><AiAssistant /></ProtectedRoute>} />
                    <Route path="/profile" element={<ProtectedRoute><Profile /></ProtectedRoute>} />
                    <Route path="/scanner" element={<ProtectedRoute><Scanner /></ProtectedRoute>} />
                    <Route path="*" element={<NotFound />} />
                  </Routes>
                </motion.div>
              </Suspense>
            </NavStackProvider>
          </BrowserRouter>
          <Toaster />
          <Sonner position="top-center" expand={false} richColors />
        </ErrorBoundary>
      </TooltipProvider>
    </AppProvider>
  </QueryClientProvider>
);

export default App;