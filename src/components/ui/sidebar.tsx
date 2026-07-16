import { useIsMobile } from "@/hooks/use-mobile";
import { cn } from "@/lib/utils";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Separator } from "@/components/ui/separator";
import { Sheet, SheetContent } from "@/components/ui/sheet";
import { Skeleton } from "@/components/ui/skeleton";
import { TooltipTrigger } from "@/components/ui/tooltip";
import { useEffect, useState } from "react";

const SIDEBAR_COOKIE_NAME = "sidebar:state";
const SIDEBAR_COOKIE_MAX_AGE = 60 * 60 * 24 * 7;
const SIDEBAR_KEYBOARD_SHORTCUT = "b";

export default function Sidebar() {
  const isMobile = useIsMobile();
  const [open, setOpen] = useState(false);
  const [openMobile, setOpenMobile] = useState(false);

  const toggleSidebar = () => {
    if (isMobile) {
      setOpenMobile(!openMobile);
    } else {
      setOpen(!open);
    }
  };

  useEffect(() => {
    const handleKeyDown = (event: KeyboardEvent) => {
      if (event.key === SIDEBAR_KEYBOARD_SHORTCUT && (event.metaKey || event.ctrlKey)) {
        event.preventDefault();
        toggleSidebar();
      }
    };
    window.addEventListener("keydown", handleKeyDown);
    return () => window.removeEventListener("keydown", handleKeyDown);
  }, [toggleSidebar]);

  return (
    <div className="group hidden md:flex md:w-64 md:flex-col md:fixed md:inset-y-0">
      <div className="flex h-16 shrink-0 items-center gap-2 border-b p-4">
        <span className="font-semibold">VaxtaGo</span>
      </div>
      <div className="flex flex-1 flex-col overflow-y-auto p-4">
        <nav className="flex flex-1 flex-col gap-1">
          <a href="/" className="flex items-center gap-2 rounded-lg px-3 py-2 text-sm font-medium transition-colors hover:bg-accent hover:text-accent-foreground">
            <span>Dashboard</span>
          </a>
          <a href="/ai-assistant" className="flex items-center gap-2 rounded-lg px-3 py-2 text-sm font-medium transition-colors hover:bg-accent hover:text-accent-foreground">
            <span>AI Assistant</span>
          </a>
          <a href="/telegram-bot" className="flex items-center gap-2 rounded-lg px-3 py-2 text-sm font-medium transition-colors hover:bg-accent hover:text-accent-foreground">
            <span>Telegram Bot</span>
          </a>
        </nav>
      </div>
    </div>
  );
}