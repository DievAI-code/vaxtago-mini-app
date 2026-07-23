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
import { AnimatePresence } from "framer-motion";
import "@/i18n";

// Lazy loading компонентов страниц
const Index = lazy(() => import("./pages/Index"));
const Home = lazy(() => import("./pages/Home"));
const Jobs = lazy(() => import("./pages/Jobs"));
const MapPage = lazy(() => import("./pages/Map"));
const Maps = lazy(() => import("./pages/Maps"));
const AiAssistant = lazy(() => import("./pages/AiAssistant"));
const Profile = lazy(() => import("./pages/Profile"));
const Scanner = lazy(() => import("./pages/Scanner"));
const OcrTranslator = lazy(() => import("./pages/OcrTranslator"));
const Documents = lazy(() => import("./pages/Documents"));
const Translate = lazy(() => import("./pages/Translate"));
const History = lazy(() => import("./pages/History"));
const Settings = lazy(() => import("./pages/Settings"));
const Premium = lazy(() => import("./pages/Premium"));
const About = lazy(() => import("./pages/About"));
const Contacts = lazy(() => import("./pages/Contacts"));
const Privacy = lazy(() => import("./pages/Privacy"));
const Terms = lazy(() => import("./pages/Terms"));
const Login = lazy(() => import("./pages/Login"));
const LanguageSelect = lazy(() => import("./pages/LanguageSelect"));
const Admin = lazy(() => import("./pages/Admin"));
const FounderDashboard = lazy(() => import("./pages/FounderDashboard"));
const MigrationTracker = lazy(() => import("./pages/MigrationTracker"));
const SOSLegal = lazy(() => import("./pages/SOSLegal"));
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
                    <div className="min-h-[100dvh] bg-[#06140F] overflow-x-hidden text-white font-sans">
                      <Routes>
                        <Route path="/login" element={<Login />} />
                        <Route path="/language-select" element={<LanguageSelect />} />
                        <Route path="/admin" element={<Admin />} />
                        <Route path="/" element={<PrivateRoute><Index /></PrivateRoute>} />
                        <Route path="/home" element={<PrivateRoute><Home /></PrivateRoute>} />
                        <Route path="/jobs" element={<PrivateRoute><Jobs /></PrivateRoute>} />
                        <Route path="/map" element={<PrivateRoute><MapPage /></PrivateRoute>} />
                        <Route path="/maps" element={<PrivateRoute><Maps /></PrivateRoute>} />
                        <Route path="/ai" element={<PrivateRoute><AiAssistant /></PrivateRoute>} />
                        <Route path="/profile" element={<PrivateRoute><Profile /></PrivateRoute>} />
                        <Route path="/scanner" element={<PrivateRoute><Scanner /></PrivateRoute>} />
                        <Route path="/ocr" element={<PrivateRoute><OcrTranslator /></PrivateRoute>} />
                        <Route path="/documents" element={<PrivateRoute><Documents /></PrivateRoute>} />
                        <Route path="/translate" element={<PrivateRoute><Translate /></PrivateRoute>} />
                        <Route path="/history" element={<PrivateRoute><History /></PrivateRoute>} />
                        <Route path="/settings" element={<PrivateRoute><Settings /></PrivateRoute>} />
                        <Route path="/premium" element={<PrivateRoute><Premium /></PrivateRoute>} />
                        <Route path="/tracker" element={<PrivateRoute><MigrationTracker /></PrivateRoute>} />
                        <Route path="/sos" element={<PrivateRoute><SOSLegal /></PrivateRoute>} />
                        <Route path="/about" element={<PrivateRoute><About /></PrivateRoute>} />
                        <Route path="/contacts" element={<PrivateRoute><Contacts /></PrivateRoute>} />
                        <Route path="/privacy" element={<PrivateRoute><Privacy /></PrivateRoute>} />
                        <Route path="/terms" element={<PrivateRoute><Terms /></PrivateRoute>} />
                        <Route path="/founder" element={<FounderDashboard />} />
                        <Route path="*" element={<NotFound />} />
                      </Routes>
                    </div>
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