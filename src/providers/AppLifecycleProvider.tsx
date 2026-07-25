"use client";

import React, { createContext, useContext, useEffect, ReactNode } from "react";
import { useLocation, useNavigate } from "react-router-dom";
import { useAppLifecycle, LifecycleState } from "@/hooks/useAppLifecycle";
import { saveLastRoute, loadLastRoute } from "@/lib/appStorage";

interface AppLifecycleContextType extends LifecycleState {
  restoreAppState: () => void;
}

const AppLifecycleContext = createContext<AppLifecycleContextType | undefined>(undefined);

export function AppLifecycleProvider({ children }: { children: ReactNode }) {
  const lifecycle = useAppLifecycle();
  const location = useLocation();
  const navigate = useNavigate();

  // Save route on every change
  useEffect(() => {
    if (location.pathname && location.pathname !== "/") {
      saveLastRoute(location.pathname);
    }
  }, [location.pathname]);

  // Restore route on cold boot
  useEffect(() => {
    const lastRoute = loadLastRoute();
    if (location.pathname === "/" && lastRoute && lastRoute !== "/") {
      console.log(`[VAQTA LIFECYCLE] Restoring route: ${lastRoute}`);
      navigate(lastRoute, { replace: true });
    }
  }, []);

  return (
    <AppLifecycleContext.Provider value={lifecycle}>
      {children}
    </AppLifecycleContext.Provider>
  );
}

export function useLifecycle() {
  const ctx = useContext(AppLifecycleContext);
  if (!ctx) {
    throw new Error("useLifecycle must be used within AppLifecycleProvider");
  }
  return ctx;
}