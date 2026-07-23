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
                  <Route path="/map" element={<PrivateRoute><MapPage /></PrivateRoute>} />
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