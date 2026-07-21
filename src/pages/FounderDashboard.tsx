"use client";

import { useState } from "react";
import { motion } from "framer-motion";
import { Users, Zap, Scan, Languages, ShieldCheck, TrendingUp, AlertCircle, Clock, Search } from "lucide-react";
import { Header } from "@/components/Header";
import { Card } from "@/components/ui/card";
import { VaqtaLogo } from "@/components/VaqtaLogo";

export default function FounderDashboard() {
  const [pass, setPass] = useState("");
  const [authed, setAuthed] = useState(false);

  if (!authed) {
    return (
      <div className="min-h-screen bg-[#06140F] flex flex-col items-center justify-center p-6">
        <VaqtaLogo size={80} animated glow className="mb-8" />
        <h1 className="text-2xl font-black mb-8 tracking-tighter">FOUNDER LOGIN</h1>
        <div className="w-full max-w-sm space-y-4">
          <input 
            type="password" 
            value={pass}
            onChange={(e) => setPass(e.target.value)}
            placeholder="••••••"
            className="w-full h-16 bg-[#0C1F1A] border border-[#1A3D2E] rounded-2xl px-6 text-center text-xl tracking-[0.5em] focus:border-[#00A86B] outline-none transition-all"
          />
          <button 
            onClick={() => pass === "31975" && setAuthed(true)}
            className="w-full h-16 vaqta-gradient rounded-2xl font-black text-lg shadow-xl"
          >
            ENTER DASHBOARD
          </button>
        </div>
      </div>
    );
  }

  return (
    <div className="min-h-screen bg-[#06140F] pb-20">
      <Header title="FOUNDER DASHBOARD" showBack />
      
      <main className="p-6 space-y-8">
        <div className="grid grid-cols-2 gap-4">
          <Card className="vaqta-glass p-6 border-[#1A3D2E] flex flex-col items-center gap-3">
             <Users className="text-[#00A86B]" />
             <div className="text-center">
                <p className="text-2xl font-black">1,248</p>
                <p className="text-[10px] font-black uppercase text-[#5C7A6D]">Users</p>
             </div>
          </Card>
          <Card className="vaqta-glass p-6 border-[#1A3D2E] flex flex-col items-center gap-3">
             <Zap className="text-[#D4AF37]" />
             <div className="text-center">
                <p className="text-2xl font-black">8,902</p>
                <p className="text-[10px] font-black uppercase text-[#5C7A6D]">AI Requests</p>
             </div>
          </Card>
        </div>

        <section className="space-y-4">
          <h3 className="text-[10px] font-black uppercase tracking-widest text-[#5C7A6D] ml-2">Real-time Activity</h3>
          <div className="space-y-2">
            {[1,2,3,4,5].map(i => (
              <div key={i} className="vaqta-glass p-4 border-[#1A3D2E] flex items-center justify-between">
                <div className="flex items-center gap-3">
                   <div className="w-8 h-8 rounded-lg bg-white/5 flex items-center justify-center text-[#00A86B]"><Scan size={14}/></div>
                   <div>
                      <p className="text-xs font-bold text-white">OCR Document Scan</p>
                      <p className="text-[9px] text-[#5C7A6D]">User #892 • 2m ago</p>
                   </div>
                </div>
                <span className="text-[10px] font-black text-[#00A86B]">COMPLETED</span>
              </div>
            ))}
          </div>
        </section>
      </main>
    </div>
  );
}