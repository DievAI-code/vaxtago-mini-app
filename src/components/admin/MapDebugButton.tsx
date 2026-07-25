"use client";

import { useState, useEffect } from "react";
import { Bug, X, Terminal } from "lucide-react";
import { mapDebug } from "@/services/maps/debug/mapDebug";
import { mapDebugStore } from "@/services/maps/debug/mapDebugStore";
import { motion, AnimatePresence } from "framer-motion";

export function MapDebugButton() {
  const [isAdmin, setIsAdmin] = useState(false);
  const [isEnabled, setIsEnabled] = useState(false);
  const [isOpen, setIsOpen] = useState(false);
  const [logs, setLogs] = useState(mapDebugStore.getLogs());

  useEffect(() => {
    const checkAdmin = () => {
      const session = localStorage.getItem("vaqta_admin_session");
      setIsAdmin(session ? JSON.parse(session).role === "founder" : false);
      setIsEnabled(mapDebug.isEnabled());
    };

    checkAdmin();

    const interval = setInterval(() => {
      setLogs([...mapDebugStore.getLogs()]);
      setIsEnabled(mapDebug.isEnabled());
    }, 1000);

    return () => clearInterval(interval);
  }, []);

  if (!isAdmin || !isEnabled) return null;

  return (
    <>
      <button
        onClick={() => setIsOpen(true)}
        className="fixed bottom-24 left-4 z-[200] p-3 bg-red-500/20 border border-red-500/40 rounded-full text-red-400 shadow-lg backdrop-blur-md active:scale-90 transition-transform"
        aria-label="Map Debug"
      >
        <Bug size={20} />
      </button>

      <AnimatePresence>
        {isOpen && (
          <motion.div
            initial={{ opacity: 0 }}
            animate={{ opacity: 1 }}
            exit={{ opacity: 0 }}
            className="fixed inset-0 z-[300] bg-black/80 backdrop-blur-md flex items-center justify-center p-4"
            onClick={() => setIsOpen(false)}
          >
            <motion.div
              initial={{ scale: 0.9, y: 20 }}
              animate={{ scale: 1, y: 0 }}
              exit={{ scale: 0.9, y: 20 }}
              className="bg-[#06140F] border border-[#1A3D2E] rounded-3xl w-full max-w-lg max-h-[80vh] flex flex-col"
              onClick={(e) => e.stopPropagation()}
            >
              <div className="flex items-center justify-between p-4 border-b border-[#1A3D2E]">
                <div className="flex items-center gap-2 text-red-400">
                  <Terminal size={20} />
                  <h3 className="font-black uppercase">Maps Debug Logs</h3>
                </div>
                <button onClick={() => setIsOpen(false)} className="p-2 text-[#5C7A6D] hover:text-white">
                  <X size={20} />
                </button>
              </div>

              <div className="flex-1 overflow-y-auto p-4 space-y-3 no-scrollbar">
                {logs.length === 0 && (
                  <p className="text-center text-[#5C7A6D] text-sm py-8">
                    No logs yet. Try a map query like "как проехать от цирка до жд вокзала тюмень"!
                  </p>
                )}
                {logs.map((log) => (
                  <div key={log.id} className="vaqta-glass p-3 border-[#1A3D2E]">
                    <div className="flex justify-between items-center mb-2">
                      <span className="text-xs font-bold text-white truncate">{log.query}</span>
                      <span className="text-[9px] text-[#5C7A6D]">{new Date(log.timestamp).toLocaleTimeString()}</span>
                    </div>
                    <div className="space-y-1.5">
                      {log.steps.map((step, i) => (
                        <div key={i} className="text-[10px] font-mono bg-black/30 rounded-lg p-2 border border-white/5">
                          <span className="text-[#0AA86E] font-bold">[{step.name}]</span>
                          <pre className="text-slate-300 whitespace-pre-wrap mt-1">
                            {typeof step.data === "string" ? step.data : JSON.stringify(step.data, null, 2)}
                          </pre>
                        </div>
                      ))}
                      {log.error && (
                        <div className="text-[10px] font-mono bg-red-500/10 rounded-lg p-2 border border-red-500/20 text-red-400">
                          [ERROR] {log.error}
                        </div>
                      )}
                    </div>
                  </div>
                ))}
              </div>

              <div className="p-4 border-t border-[#1A3D2E]">
                <button
                  onClick={() => {
                    mapDebugStore.clearLogs();
                    setLogs([]);
                  }}
                  className="w-full h-12 bg-white/5 border border-white/10 rounded-xl text-red-400 text-xs font-black uppercase tracking-wider"
                >
                  Clear Logs
                </button>
              </div>
            </motion.div>
          </motion.div>
        )}
      </AnimatePresence>
    </>
  );
}