import { createContext, useContext, useState, ReactNode, useCallback, useEffect } from "react";
import { useNavigate, useLocation } from "react-router-dom";

interface NavStackContextType {
  push: (path: string) => void;
  pop: () => void;
  canGoBack: boolean;
  history: string[];
}

const NavStackContext = createContext<NavStackContextType | undefined>(undefined);

export function useNavStack() {
  const ctx = useContext(NavStackContext);
  if (!ctx) throw new Error("useNavStack must be used within NavStackProvider");
  return ctx;
}

export function NavStackProvider({ children }: { children: ReactNode }) {
  const navigate = useNavigate();
  const location = useLocation();
  const [history, setHistory] = useState<string[]>([location.pathname]);

  const push = useCallback((path: string) => {
    setHistory((prev) => [...prev, path]);
    navigate(path);
  }, [navigate]);

  const pop = useCallback(() => {
    setHistory((prev) => {
      if (prev.length <= 1) {
        navigate("/");
        return [location.pathname];
      }
      const newHistory = prev.slice(0, -1);
      navigate(newHistory[newHistory.length - 1]);
      return newHistory;
    });
  }, [navigate, location.pathname]);

  useEffect(() => {
    let startX = 0;
    let startY = 0;
    const threshold = 100;

    const onTouchStart = (e: TouchEvent) => {
      startX = e.touches[0].clientX;
      startY = e.touches[0].clientY;
    };

    const onTouchEnd = (e: TouchEvent) => {
      const endX = e.changedTouches[0].clientX;
      const endY = e.changedTouches[0].clientY;
      const diffX = endX - startX;
      const diffY = endY - startY;

      if (Math.abs(diffX) > Math.abs(diffY) && diffX > threshold && startX < 50 && history.length > 1) {
        pop();
      }
    };

    document.addEventListener("touchstart", onTouchStart, { passive: true });
    document.addEventListener("touchend", onTouchEnd, { passive: true });

    return () => {
      document.removeEventListener("touchstart", onTouchStart);
      document.removeEventListener("touchend", onTouchEnd);
    };
  }, [history.length, pop]);

  return (
    <NavStackContext.Provider
      value={{
        push,
        pop,
        canGoBack: history.length > 1,
        history,
      }}
    >
      {children}
    </NavStackContext.Provider>
  );
}
