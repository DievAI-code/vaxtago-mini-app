import { VaqtaLogo } from "./VaqtaLogo";

export function Footer() {
  return (
    <footer className="border-t border-slate-200/60 dark:border-slate-800 bg-white/80 dark:bg-[#0F172A]/80 backdrop-blur-xl">
      <div className="max-w-6xl mx-auto px-4 py-12">
        <div className="flex flex-col md:flex-row justify-between items-center gap-6">
          <div className="flex items-center gap-3">
            <VaqtaLogo size={40} />
            <div>
              <div className="font-bold text-lg text-slate-800 dark:text-white">VAQTA AI</div>
              <div className="text-sm text-slate-500 dark:text-slate-400">AI-помощник для мигрантов</div>
            </div>
          </div>
          
          <div className="text-center md:text-right">
            <p className="text-sm text-slate-500 dark:text-slate-400">
              © 2026 VAQTA AI. All rights reserved.
            </p>
            <p className="text-xs text-slate-400 dark:text-slate-500 mt-1">
              Premium AI platform
            </p>
          </div>
        </div>
      </div>
    </footer>
  );
}