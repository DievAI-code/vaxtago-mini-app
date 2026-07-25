"use client";

import { useEffect, useState, useCallback, useRef } from "react";

export interface LifecycleState {
  isActive: boolean;
  isOnline: boolean;
  wasRestored: boolean;
  lastActiveTime: number;
}

export function useAppLifecycle() {
  const [isActive, setIsActive] = useState<boolean>(
    typeof document !== "undefined" ? document.visibilityState === "visible" : true
  );
  const [isOnline, setIsOnline] = useState<boolean>(
    typeof navigator !== "undefined" ? navigator.onLine : true
  );
  const [wasRestored, setWasRestored] = useState<boolean>(false);
  const lastActiveTimeRef = useRef<number>(Date.now());

  const updateAppHeight = useCallback(() => {
    if (typeof window === "undefined") return;

    // Use visualViewport if available (Safari / Chrome mobile)
    const height = window.visualViewport ? window.visualViewport.height : window.innerHeight;
    document.documentElement.style.setProperty("--app-height", `${height}px`);
  }, []);

  const restoreAppState = useCallback(() => {
    console.log("[VAQTA LIFECYCLE] Executing soft UI state restoration...");
    updateAppHeight();
    
    // Dispatch custom event for components (e.g., 2GIS Map, Leaflet, AI Chat)
    if (typeof window !== "undefined") {
      window.dispatchEvent(new CustomEvent("vaqta:app-restore", { detail: { timestamp: Date.now() } }));
    }

    requestAnimationFrame(() => {
      updateAppHeight();
    });
  }, [updateAppHeight]);

  useEffect(() => {
    if (typeof window === "undefined") return;

    updateAppHeight();

    const handleVisibilityChange = () => {
      const visible = document.visibilityState === "visible";
      setIsActive(visible);

      if (visible) {
        const inactiveDuration = Date.now() - lastActiveTimeRef.current;
        console.log(`[VAQTA LIFECYCLE] App restored after ${inactiveDuration}ms inactive`);

        if (inactiveDuration > 5000) {
          setWasRestored(true);
          restoreAppState();
        } else {
          updateAppHeight();
        }
        lastActiveTimeRef.current = Date.now();
      } else {
        lastActiveTimeRef.current = Date.now();
        console.log("[VAQTA LIFECYCLE] App backgrounded");
      }
    };

    const handleFocus = () => {
      setIsActive(true);
      updateAppHeight();
    };

    const handleBlur = () => {
      setIsActive(false);
      lastActiveTimeRef.current = Date.now();
    };

    const handlePageShow = (e: PageTransitionEvent) => {
      if (e.persisted) {
        console.log("[VAQTA LIFECYCLE] Restored from BFCache (pageshow)");
        setWasRestored(true);
        restoreAppState();
      }
    };

    const handleOnline = () => setIsOnline(true);
    const handleOffline = () => setIsOnline(false);

    const handleResize = () => {
      updateAppHeight();
    };

    window.addEventListener("visibilitychange", handleVisibilityChange);
    window.addEventListener("focus", handleFocus);
    window.addEventListener("blur", handleBlur);
    window.addEventListener("pageshow", handlePageShow as EventListener);
    window.addEventListener("online", handleOnline);
    window.addEventListener("offline", handleOffline);
    window.addEventListener("resize", handleResize);
    window.addEventListener("orientationchange", handleResize);

    if (window.visualViewport) {
      window.visualViewport.addEventListener("resize", handleResize);
      window.visualViewport.addEventListener("scroll", handleResize);
    }

    return () => {
      window.removeEventListener("visibilitychange", handleVisibilityChange);
      window.removeEventListener("focus", handleFocus);
      window.removeEventListener("blur", handleBlur);
      window.removeEventListener("pageshow", handlePageShow as EventListener);
      window.removeEventListener("online", handleOnline);
      window.removeEventListener("offline", handleOffline);
      window.removeEventListener("resize", handleResize);
      window.removeEventListener("orientationchange", handleResize);

      if (window.visualViewport) {
        window.visualViewport.removeEventListener("resize", handleResize);
        window.visualViewport.removeEventListener("scroll", handleResize);
      }
    };
  }, [restoreAppState, updateAppHeight]);

  return {
    isActive,
    isOnline,
    wasRestored,
    lastActiveTime: lastActiveTimeRef.current,
    restoreAppState,
  };
}