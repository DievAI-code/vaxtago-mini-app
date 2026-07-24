"use client";

import { motion } from "framer-motion";
import { useLocation, useNavigate } from "react-router-dom";
import { LayoutGrid, Scan, Sparkles, MapPin, Key } from "lucide-react";
import { useLanguage } from "@/context/LanguageProvider";

export function BottomNav() {
  const loc = useLocation();
  const nav = useNavigate();
  const { t } = useLanguage();

  const ITEMS = [
    { path: "/home", icon: LayoutGrid, label: t("nav.home") },
    { path: "/ai", icon: Sparkles, label: t("nav.ai") },
    { path: "/scanner", icon: Scan, label: t("nav.scanner") },
    { path: "/maps", icon: MapPin, label: t("nav.map") },
    { path: "/admin/login", icon: Key, label: t("nav.admin") },
  ];

  return (
    <div className="fixed bottom-0 left-0 right-0 p-4 z-[100] pointer-events-none pb-[calc(1rem+env(safe-area-inset-bottom))]">
      <nav className="mx-auto flex items-center justify-around px-1 py-2.5 bg-[#0C1F1A]/95 backdrop-blur-3xl border border-[#1A3D2E] rounded-[2rem] w-full max-w-lg pointer-events-auto shadow-[0_-10px_40px_rgba(0,0,0,0.6)]">
        {ITEMS.map((item) => {
          const active = loc.pathname === item.path || (item.path === "/home" && loc.pathname === "/");
          const Icon = item.icon;

          return (
            <button
              key={item.path}
              type="button"
              onClick={() => nav(item.path)}
              className="relative flex flex-col items-center gap-1 transition-all duration-300 min-w-[56px] outline-none active:scale-90"
            >
              {active && (
                <motion.div
                  layoutId="nav-glow-active"
                  className="absolute -inset-1.5 bg-[#00A86B]/20 rounded-2xl blur-md"
                />
              )}
              <motion.div
                animate={{
                  scale: active ? 1.15 : 1,
                  color: active ? "#00A86B" : "#5C7A6D",
                }}
                className="relative z-10"
              >
                <Icon size={20} strokeWidth={active ? 2.8 : 2} />
              </motion.div>
              <span
                className={`text-[9px] font-black uppercase tracking-tight transition-colors relative z-10 ${
                  active ? "text-[#00A86B]" : "text-[#5C7A6D]"
                }`}
              >
                {item.label}
              </span>
            </button>
          );
        })}
      </nav>
    </div>
  );
}
</dyad-file>

<dyad-write path="src/App.tsx" description="Update routes ensuring /maps is routed properly with hybrid map system">
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
import "@/i18n";

// Lazy loading компонентов страниц
const Index = lazy(() => import("./pages/Index"));
const Home = lazy(() => import("./pages/Home"));
const Jobs = lazy(() => import("./pages/Jobs"));
const JobsTest = lazy(() => import("./pages/JobsTest"));
const Maps = lazy(() => import("./pages/Maps"));
const AiAssistant = lazy(() => import("./pages/AiAssistant"));
const MyCabinet = lazy(() => import("./pages/MyCabinet"));
const Scanner = lazy(() => import("./pages/Scanner"));
const OcrTranslator = lazy(() => import("./pages/OcrTranslator"));
const History = lazy(() => import("./pages/History"));
const Settings = lazy(() => import("./pages/Settings"));
const Premium = lazy(() => import("./pages/Premium"));
const MigrationTracker = lazy(() => import("./pages/MigrationTracker"));
const SOSLegal = lazy(() => import("./pages/SOSLegal"));
const Login = lazy(() => import("./pages/Login"));
const NotFound = lazy(() => import("./pages/NotFound"));
const AdminLogin = lazy(() => import("./pages/AdminLogin"));
const AdminDashboard = lazy(() => import("./pages/AdminDashboard"));
const AdminUsers = lazy(() => import("./pages/AdminUsers"));
const AdminIntegrations = lazy(() => import("./pages/AdminIntegrations"));

const queryClient = new QueryClient();

const PrivateRoute = ({ children }: { children: React.ReactNode }) => {
  const isAuthed = localStorage.getItem("vaxtago_auth") === "true";
  return isAuthed ? <>{children}</> : <Navigate to="/login" replace />;
};

const AdminRoute = ({ children }: { children: React.ReactNode }) => {
  const session = localStorage.getItem("vaqta_admin_session");
  const isAdmin = session ? JSON.parse(session).role === "founder" : false;
  return isAdmin ? <>{children}</> : <Navigate to="/admin/login" replace />;
};

const App = () => (
  <QueryClientProvider client={queryClient}>
    <LanguageProvider>
      <AppProvider>
        <TooltipProvider>
          <NavStackProvider>
            <ErrorBoundary>
              <Suspense fallback={<div className="min-h-screen bg-[#06140F]" />}>
                <Routes>
                  <Route path="/login" element={<Login />} />
                  <Route path="/admin/login" element={<AdminLogin />} />
                  <Route path="/admin" element={<AdminRoute><AdminDashboard /></AdminRoute>} />
                  <Route path="/admin/users" element={<AdminRoute><AdminUsers /></AdminRoute>} />
                  <Route path="/admin/integrations" element={<AdminRoute><AdminIntegrations /></AdminRoute>} />

                  <Route path="/" element={<PrivateRoute><Index /></PrivateRoute>} />
                  <Route path="/home" element={<PrivateRoute><Home /></PrivateRoute>} />
                  <Route path="/jobs" element={<PrivateRoute><Jobs /></PrivateRoute>} />
                  <Route path="/jobs-test" element={<PrivateRoute><JobsTest /></PrivateRoute>} />
                  <Route path="/map" element={<PrivateRoute><Maps /></PrivateRoute>} />
                  <Route path="/maps" element={<PrivateRoute><Maps /></PrivateRoute>} />
                  <Route path="/ai" element={<PrivateRoute><AiAssistant /></PrivateRoute>} />
                  <Route path="/cabinet" element={<PrivateRoute><MyCabinet /></PrivateRoute>} />
                  <Route path="/scanner" element={<PrivateRoute><Scanner /></PrivateRoute>} />
                  <Route path="/ocr" element={<PrivateRoute><OcrTranslator /></PrivateRoute>} />
                  <Route path="/history" element={<PrivateRoute><History /></PrivateRoute>} />
                  <Route path="/settings" element={<PrivateRoute><Settings /></PrivateRoute>} />
                  <Route path="/premium" element={<PrivateRoute><Premium /></PrivateRoute>} />
                  <Route path="/tracker" element={<PrivateRoute><MigrationTracker /></PrivateRoute>} />
                  <Route path="/sos" element={<PrivateRoute><SOSLegal /></PrivateRoute>} />
                  <Route path="*" element={<NotFound />} />
                </Routes>
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

export default App;