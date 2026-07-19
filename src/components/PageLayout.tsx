import { ReactNode } from "react";
import { Header } from "./Header";
import { BottomNav } from "./BottomNav";
import { FadeUp } from "./animations";

export function PageLayout({ title, children }: { title: string; children: ReactNode }) {
  return (
    <div className="flex flex-col h-[100dvh] bg-[#0F172A] text-white">
      <Header title={title} />
      <div className="flex-1 min-h-0 overflow-y-auto px-4 py-6">
        <FadeUp>
          {children}
        </FadeUp>
      </div>
      <BottomNav />
    </div>
  );
}
