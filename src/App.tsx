import { Toaster } from "@/components/ui/toaster";
import { Toaster as Sonner } from "@/components/ui/sonner";
import { TooltipProvider } from "@/components/ui/tooltip";
import { QueryClient, QueryClientProvider } from "@tanstack/react-query";
import { Routes, Route, Navigate, useLocation } from "react-router-dom";
import { Suspense, lazy } from "react";
import { AppProvider } from "@/lib/theme";
import { LanguageProvider } from "@/context/LanguageProvider";
import { ErrorBoundary } from "@/components/ErrorBoundary";
import { NavStackProvider } from "@/components/NavigationStack";
import { PageTransition } from "@/components/PageTransition";
import "@/i18n";

const Index = lazy(() => import("./pages/Index"));
const Home = lazy(() => import("./pages/Home"));
const Jobs = lazy(() => import("./pages/Jobs"));
const JobsTest = lazy(() => import("./pages/JobsTest"));
const MapPage = lazy(() => import("./pages/Map"));
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

const AdminRoute = ({ children }: { children: React.ReactNode }) => {
  const session = localStorage.getItem("vaqta_admin_session");
  const isAdmin = session ? JSON.parse(session).role === "founder" : false;
  return isAdmin ? <>{children}</> : <Navigate to="/admin/login" replace />;
};

const AnimatedRoutes = () => {
  const location = useLocation();
  return (
    <PageTransition>
      <Suspense fallback={<div className="min-h-screen-dynamic bg-[#06140F] flex items-center justify-center"><div className="w-10 h-10 border-4 border-[#00A86B]/20 border-t-[#00A86B] animate-spin rounded-full" /></div>}>
        <Routes location={location} key={location.pathname}>
          <Route path="/login" element={<Login />} />
          <Route path="/admin/login" element={<AdminLogin />} />
          <Route path="/admin" element={<AdminRoute><AdminDashboard /></AdminRoute>} />
          <Route path="/admin/users" element={<AdminRoute><AdminUsers /></AdminRoute>} />
          <Route path="/admin/integrations" element={<AdminRoute><AdminIntegrations /></AdminRoute>} />

          {/* Main App Routes - accessible immediately */}
          <Route path="/" element={<Home />} />
          <Route path="/home" element={<Home />} />
          <Route path="/ai" element={<AiAssistant />} />
          <Route path="/jobs" element={<JobsTest />} />
          <Route path="/jobs-test" element={<JobsTest />} />
          <Route path="/scanner" element={<Scanner />} />
          <Route path="/ocr" element={<OcrTranslator />} />
          <Route path="/premium" element={<Premium />} />
          <Route path="/settings" element={<Settings />} />

          {/* Sub pages */}
          <Route path="/map" element={<MapPage />} />
          <Route path="/maps" element={<Maps />} />
          <Route path="/cabinet" element={<MyCabinet />} />
          <Route path="/history" element={<History />} />
          <Route path="/tracker" element={<MigrationTracker />} />
          <Route path="/sos" element={<SOSLegal />} />
          <Route path="*" element={<NotFound />} />
        </Routes>
      </Suspense>
    </PageTransition>
  );
};

const App = () => (
  <QueryClientProvider client={queryClient}>
    <LanguageProvider>
      <AppProvider>
        <TooltipProvider>
          <NavStackProvider>
            <ErrorBoundary>
              <AnimatedRoutes />
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