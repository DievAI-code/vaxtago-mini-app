"use client";

import { useEffect, useState, useCallback, useRef } from "react";

export interface LifecycleState {
  isActive: boolean;
  isOnline: boolean;
  wasRestored: boolean;
  lastActiveTime: number;
}

export interface RestorationState {
  // Map state
  mapCenter?: [number, number];
  mapZoom?: number;
  lastRoute?: { from: string; to: string; mode: string };
  
  // AI Assistant state
  chatMessages?: Array<{ role: "user" | "assistant"; content: string; timestamp: string }>;
  
  // OCR state
  ocrImage?: string;
  ocrSourceLang?: string;
  ocrTargetLang?: string;
  
  // Navigation state
  currentPage?: string;
  scrollPosition?: number;
}

const LIFECYCLE_KEY = "vaqta_lifecycle_state";

function loadRestorationState(): RestorationState | null {
  try {
    const raw = localStorage.getItem(LIFECYCLE_KEY);
    if (!raw) return null;
    return JSON.parse(raw);
  } catch {
    return null;
  }
}

function saveRestorationState(state: RestorationState) {
  try {
    localStorage.setItem(LIFECYCLE_KEY, JSON.stringify(state));
  } catch (e) {
    console.warn("[VAQTA LIFECYCLE] Failed to save restoration state:", e);
  }
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
  const restorationStateRef = useRef<RestorationState | null>(loadRestorationState());

  const updateAppHeight = useCallback(() => {
    if (typeof window === "undefined") return;
    const height = window.visualViewport ? window.visualViewport.height : window.innerHeight;
    document.documentElement.style.setProperty("--app-height", `${height}px`);
  }, []);

  const saveAppState = useCallback(() => {
    if (typeof window === "undefined") return;

    const state: RestorationState = {
      currentPage: window.location.pathname,
      scrollPosition: window.scrollY,
    };

    // Save map state
    try {
      const mapRaw = localStorage.getItem("vaqta_map_state");
      if (mapRaw) {
        const mapData = JSON.parse(mapRaw);
        state.mapCenter = mapData.center;
        state.mapZoom = mapData.zoom;
        state.lastRoute = mapData.lastRoute;
      }
    } catch {}

    // Save AI Assistant state
    try {
      const chatRaw = localStorage.getItem("vaqta_assistant_session");
      if (chatRaw) {
        const chatData = JSON.parse(chatRaw);
        state.chatMessages = chatData.messages;
      }
    } catch {}

    // Save OCR state
    try {
      const ocrImage = localStorage.getItem("vaqta_ocr_image");
      if (ocrImage) state.ocrImage = ocrImage;
      
      const ocrSource = localStorage.getItem("vaqta_ocr_source_lang");
      if (ocrSource) state.ocrSourceLang = ocrSource;
      
      const ocrTarget = localStorage.getItem("vaqta_ocr_target_lang");
      if (ocrTarget) state.ocrTargetLang = ocrTarget;
    } catch {}

    saveRestorationState(state);
  }, []);

  const restoreAppState = useCallback(() => {
    console.log("[VAQTA LIFECYCLE] Executing soft UI state restoration...");
    
    const state = restorationStateRef.current;
    if (!state) {
      console.log("[VAQTA LIFECYCLE] No restoration state found");
      return;
    }

    console.log("[VAQTA LIFECYCLE] Restoring state:", state);

    // Restore map state to localStorage for Map component to pick up
    if (state.mapCenter || state.mapZoom || state.lastRoute) {
      try {
        const mapData = {
          center: state.mapCenter || [55.7558, 37.6173],
          zoom: state.mapZoom || 12,
          lastRoute: state.lastRoute,
          timestamp: Date.now(),
        };
        localStorage.setItem("vaqta_map_state", JSON.stringify(mapData));
        console.log("[VAQTA LIFECYCLE] ✓ Map state restored");
      } catch (e) {
        console.warn("[VAQTA LIFECYCLE] Failed to restore map state:", e);
      }
    }

    // Restore AI Assistant chat session
    if (state.chatMessages && state.chatMessages.length > 0) {
      try {
        const session = {
          messages: state.chatMessages,
          language: localStorage.getItem("vaxtago_language") || "ru",
          updatedAt: Date.now(),
        };
        localStorage.setItem("vaqta_assistant_session", JSON.stringify(session));
        console.log(`[VAQTA LIFECYCLE] ✓ Chat session restored (${state.chatMessages.length} messages)`);
      } catch (e) {
        console.warn("[VAQTA LIFECYCLE] Failed to restore chat session:", e);
      }
    }

    // Restore OCR state
    if (state.ocrImage) {
      try {
        localStorage.setItem("vaqta_ocr_image", state.ocrImage);
        console.log("[VAQTA LIFECYCLE] ✓ OCR image restored");
      } catch (e) {
        console.warn("[VAQTA LIFECYCLE] Failed to restore OCR image:", e);
      }
    }

    if (state.ocrSourceLang) {
      localStorage.setItem("vaqta_ocr_source_lang", state.ocrSourceLang);
    }

    if (state.ocrTargetLang) {
      localStorage.setItem("vaqta_ocr_target_lang", state.ocrTargetLang);
    }

    // Restore scroll position
    if (state.scrollPosition && typeof window !== "undefined") {
      requestAnimationFrame(() => {
        window.scrollTo({ top: state.scrollPosition || 0, behavior: "instant" });
        console.log(`[VAQTA LIFECYCLE] ✓ Scroll position restored: ${state.scrollPosition}px`);
      });
    }

    // Dispatch event so React components can react to restoration
    if (typeof window !== "undefined") {
      window.dispatchEvent(new CustomEvent("vaqta:state-restored", { 
        detail: { state, timestamp: Date.now() } 
      }));
      window.dispatchEvent(new CustomEvent("vaqta:app-restore", { 
        detail: { timestamp: Date.now() } 
      }));
    }

    updateAppHeight();

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
        saveAppState();
      }
    };

    const handleBeforeUnload = () => {
      saveAppState();
    };

    const handleFocus = () => {
      setIsActive(true);
      updateAppHeight();
    };

    const handleBlur = () => {
      setIsActive(false);
      lastActiveTimeRef.current = Date.now();
      saveAppState();
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

    document.addEventListener("visibilitychange", handleVisibilityChange);
    window.addEventListener("focus", handleFocus);
    window.addEventListener("blur", handleBlur);
    window.addEventListener("pagehide", saveAppState);
    window.addEventListener("beforeunload", handleBeforeUnload);
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
      document.removeEventListener("visibilitychange", handleVisibilityChange);
      window.removeEventListener("focus", handleFocus);
      window.removeEventListener("blur", handleBlur);
      window.removeEventListener("pagehide", saveAppState);
      window.removeEventListener("beforeunload", handleBeforeUnload);
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
  }, [restoreAppState, updateAppHeight, saveAppState]);

  return {
    isActive,
    isOnline,
    wasRestored,
    lastActiveTime: lastActiveTimeRef.current,
    restoreAppState,
    saveAppState,
  };
}