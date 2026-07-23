"use client";

import { useState } from "react";
import { Header } from "@/components/Header";
import { BottomNav } from "@/components/BottomNav";
import { Zap, Scan, Map as MapIcon, Database, Save, Loader2 } from "lucide-center";
import { toast } from "sonner";

export default function AdminSettings() {
  const [saving, setSaving] = useState(false);
  const [config, setConfig] = useState({
    aiModel: "google/gemini-2.0-flash-exp:free",
    limits: { ai: 10, ocr: 5, maps: 5 },
    toggles: { ai: true, ocr: true, maps: true }
  });

  const handleSave = async () => {
    setSaving(true);
    // В реальности: вызов Edge Function для обновления конфига в БД
    await new Promise(r => setTimeout(r, 1000));
    setSaving(false);
    toast.success("Settings updated successfully");
  };

  return (
    <div className="flex flex-col min-h-screen bg-[#06140F] text-white pb-32">
      <Header title="Project Settings" showBack />

      <main className="p-6 space-y-8">
        <section className="space-y-4">
          <h3 className="text-[10px] font-black uppercase text-[#5C7A6D] tracking-widest ml-1">AI Engine Configuration</h3>
          <div className="vaqta-glass p-5 border-[#1A3D2E] space-y-4">
            <div className="space-y-2">
              <label className="text-[10px] font-bold text-[#5C7A6D] uppercase">Active OpenRouter Model</label>
              <input 
                value={config.aiModel}
                onChange={(e) => setConfig({...config, aiModel: e.target.value})}
                className="w-full h-14 bg-[#06140F] border border-[#1A3D2E] rounded-2xl px-4 text-xs font-bold focus:border-[#00A86B] outline-none"
              />
            </div>
          </div>
        </section>

        <section className="space-y-4">
          <h3 className="text-[10px] font-black uppercase text-[#5C7A6D] tracking-widest ml-1">Global Free Limits (Per Day)</h3>
          <div className="grid grid-cols-3 gap-3">
            <div className="vaqta-glass p-4 border-[#1A3D2E] flex flex-col items-center gap-2">
              <Zap size={16} className="text-[#00A86B]" />
              <input type="number" value={config.limits.ai} className="w-10 bg-transparent text-center font-black" />
              <span className="text-[8px] uppercase font-bold text-[#5C7A6D]">AI</span>
            </div>
            <div className="vaqta-glass p-4 border-[#1A3D2E] flex flex-col items-center gap-2">
              <Scan size={16} className="text-purple-400" />
              <input type="number" value={config.limits.ocr} className="w-10 bg-transparent text-center font-black" />
              <span className="text-[8px] uppercase font-bold text-[#5C7A6D]">OCR</span>
            </div>
            <div className="vaqta-glass p-4 border-[#1A3D2E] flex flex-col items-center gap-2">
              <MapIcon size={16} className="text-cyan-400" />
              <input type="number" value={config.limits.maps} className="w-10 bg-transparent text-center font-black" />
              <span className="text-[8px] uppercase font-bold text-[#5C7A6D]">Maps</span>
            </div>
          </div>
        </section>

        <section className="space-y-4">
          <h3 className="text-[10px] font-black uppercase text-[#5C7A6D] tracking-widest ml-1">System Features Control</h3>
          <div className="vaqta-glass p-4 border-[#1A3D2E] divide-y divide-white/5">
             {Object.entries(config.toggles).map(([key, val]) => (
               <div key={key} className="flex items-center justify-between py-3">
                  <span className="text-xs font-bold uppercase tracking-wider">{key} Assistant Status</span>
                  <div className={`w-10 h-5 rounded-full relative transition-colors ${val ? 'bg-[#00A86B]' : 'bg-[#1A3D2E]'}`}>
                    <div className={`absolute top-1 w-3 h-3 bg-white rounded-full transition-all ${val ? 'right-1' : 'left-1'}`} />
                  </div>
               </div>
             ))}
          </div>
        </section>

        <button 
          onClick={handleSave}
          disabled={saving}
          className="w-full h-16 rounded-[2rem] vaqta-gradient font-black text-white shadow-xl vaqta-glow flex items-center justify-center gap-3 uppercase tracking-widest"
        >
          {saving ? <Loader2 className="animate-spin" /> : <><Save size={18} /> Sync Cloud Config</>}
        </button>
      </main>

      <BottomNav />
    </div>
  );
}