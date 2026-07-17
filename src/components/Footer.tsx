export function Footer() {
  return (
    <footer className="border-t border-slate-200/60 dark:border-slate-700/60 bg-white/80 dark:bg-slate-900/80 backdrop-blur-xl">
      <div className="max-w-6xl mx-auto px-4 py-12">
        <div className="flex flex-col md:flex-row justify-between items-center gap-6">
          <div className="flex items-center gap-3">
            <div className="w-10 h-10 rounded-xl bg-gradient-to-br from-blue-600 to-cyan-400 flex items-center justify-center text-white font-bold">
              V
            </div>
            <div>
              <div className="font-bold text-lg text-slate-800 dark:text-white">VaxtaGo</div>
              <div className="text-sm text-slate-500 dark:text-slate-400">AI-помощник для мигрантов</div>
            </div>
          </div>
          
          <div className="text-center md:text-right">
            <p className="text-sm text-slate-500 dark:text-slate-400">
              © 2026 VaxtaGo • Made by Dmitry Diev • Powered by ChatGPT
            </p>
            <p className="text-xs text-slate-400 dark:text-slate-500 mt-1">
              Premium AI platform for migrant workers
            </p>
          </div>
        </div>
      </div>
    </footer>
  );
}