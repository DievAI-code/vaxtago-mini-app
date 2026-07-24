"use client";

import { useState, useEffect } from "react";
import { Header } from "@/components/Header";
import { BottomNav } from "@/components/BottomNav";
import { 
  MapPin, Plus, Trash2, Edit2, Search, 
  Save, X, Loader2, Globe, Compass 
} from "lucide-react";
import { mapAliasService, MapAlias } from "@/services/mapAliasService";
import { supabase } from "@/integrations/supabase/client";
import { toast } from "sonner";

export default function AdminMap() {
  const [aliases, setAliases] = useState<MapAlias[]>([]);
  const [loading, setLoading] = useState(true);
  const [searchQuery, setSearchQuery] = useState("");
  
  // Edit state
  const [editingId, setEditingId] = useState<string | null>(null);
  const [form, setForm] = useState<Partial<MapAlias>>({});
  const [isAdding, setIsAdding] = useState(false);

  useEffect(() => {
    loadAliases();
  }, []);

  const loadAliases = async () => {
    setLoading(true);
    try {
      const { data } = await supabase
        .from("map_aliases")
        .select("*")
        .order("created_at", { ascending: false });
      setAliases(data || []);
    } catch (e) {
      toast.error("Ошибка загрузки базы");
    } finally {
      setLoading(false);
    }
  };

  const handleSave = async () => {
    try {
      if (editingId) {
        await mapAliasService.updateAlias(editingId, form);
        toast.success("Объект обновлен");
      } else {
        await mapAliasService.addAlias(form);
        toast.success("Объект добавлен");
      }
      setIsAdding(false);
      setEditingId(null);
      setForm({});
      loadAliases();
    } catch (e) {
      toast.error("Ошибка сохранения");
    }
  };

  const handleDelete = async (id: string) => {
    if (!confirm("Удалить этот объект?")) return;
    try {
      await mapAliasService.deleteAlias(id);
      toast.success("Удалено");
      loadAliases();
    } catch (e) {
      toast.error("Ошибка удаления");
    }
  };

  const startEdit = (a: MapAlias) => {
    setEditingId(a.id);
    setForm(a);
    setIsAdding(true);
  };

  const filtered = aliases.filter(a => 
    a.alias.toLowerCase().includes(searchQuery.toLowerCase()) ||
    a.title.toLowerCase().includes(searchQuery.toLowerCase()) ||
    a.city?.toLowerCase().includes(searchQuery.toLowerCase())
  );

  return (
    <div className="flex flex-col min-h-screen bg-[#06140F] text-white pb-36">
      <Header title="Управление Картой" showBack />

      <main className="p-5 space-y-6">
        <div className="flex items-center justify-between">
           <h2 className="text-xl font-black">Smart Aliases</h2>
           <button 
             onClick={() => { setIsAdding(true); setEditingId(null); setForm({ category: 'organization' }); }}
             className="p-3 bg-[#00A86B] text-white rounded-2xl shadow-lg active:scale-95 transition-transform"
           >
             <Plus size={20} />
           </button>
        </div>

        {!isAdding ? (
          <>
            <div className="vaqta-glass p-2 border-[#1A3D2E] flex items-center gap-2">
              <Search size={18} className="ml-3 text-[#5C7A6D]" />
              <input 
                value={searchQuery}
                onChange={(e) => setSearchQuery(e.target.value)}
                placeholder="Поиск по сокращению или названию..."
                className="w-full bg-transparent py-3 text-xs outline-none font-bold"
              />
            </div>

            {loading ? (
              <div className="py-12 flex justify-center"><Loader2 className="animate-spin text-[#00A86B]" /></div>
            ) : (
              <div className="space-y-3">
                {filtered.map((a) => (
                  <div key={a.id} className="vaqta-glass p-5 border-[#1A3D2E] relative overflow-hidden group">
                    <div className="flex justify-between items-start mb-3">
                       <div className="flex items-center gap-3">
                          <div className="p-2.5 rounded-xl bg-[#00A86B]/10 text-[#00A86B]"><Globe size={18} /></div>
                          <div>
                             <p className="text-[10px] font-black uppercase text-[#00A86B] tracking-widest">{a.alias}</p>
                             <h4 className="font-bold text-sm leading-snug">{a.title}</h4>
                             <p className="text-[10px] text-[#5C7A6D] font-bold mt-0.5">{a.city || "Все города"}</p>
                          </div>
                       </div>
                       <div className="flex gap-2">
                          <button onClick={() => startEdit(a)} className="p-2 bg-white/5 rounded-lg text-slate-400 hover:text-white"><Edit2 size={14} /></button>
                          <button onClick={() => handleDelete(a.id)} className="p-2 bg-red-500/10 rounded-lg text-red-500 hover:bg-red-500/20"><Trash2 size={14} /></button>
                       </div>
                    </div>
                    <div className="flex items-center gap-4 text-[9px] font-black uppercase text-slate-500">
                       <span className="flex items-center gap-1"><MapPin size={10} /> {a.latitude}, {a.longitude}</span>
                       <span className="flex items-center gap-1"><Compass size={10} /> {a.category}</span>
                    </div>
                  </div>
                ))}
              </div>
            )}
          </>
        ) : (
          <div className="vaqta-glass p-6 border-[#00A86B]/30 space-y-4 animate-in fade-in slide-in-from-bottom-4">
            <div className="flex justify-between items-center mb-2">
              <h3 className="font-black text-white uppercase tracking-wider">{editingId ? 'Изменить' : 'Добавить'} объект</h3>
              <button onClick={() => setIsAdding(false)} className="text-[#5C7A6D]"><X size={20} /></button>
            </div>

            <div className="space-y-4">
               <div>
                  <label className="text-[9px] font-black uppercase text-[#5C7A6D] ml-1">Сокращение (alias)</label>
                  <input value={form.alias || ''} onChange={e => setForm({...form, alias: e.target.value})} className="w-full h-12 bg-[#06140F] border border-[#1A3D2E] rounded-xl px-4 text-xs font-bold focus:border-[#00A86B] outline-none" placeholder="напр: епрс" />
               </div>
               <div>
                  <label className="text-[9px] font-black uppercase text-[#5C7A6D] ml-1">Полное название</label>
                  <input value={form.title || ''} onChange={e => setForm({...form, title: e.target.value})} className="w-full h-12 bg-[#06140F] border border-[#1A3D2E] rounded-xl px-4 text-xs font-bold focus:border-[#00A86B] outline-none" placeholder="напр: Ермаковское предприятие..." />
               </div>
               <div className="grid grid-cols-2 gap-3">
                  <div>
                    <label className="text-[9px] font-black uppercase text-[#5C7A6D] ml-1">Город</label>
                    <input value={form.city || ''} onChange={e => setForm({...form, city: e.target.value})} className="w-full h-12 bg-[#06140F] border border-[#1A3D2E] rounded-xl px-4 text-xs font-bold focus:border-[#00A86B] outline-none" placeholder="Нижневартовск" />
                  </div>
                  <div>
                    <label className="text-[9px] font-black uppercase text-[#5C7A6D] ml-1">Категория</label>
                    <select value={form.category || ''} onChange={e => setForm({...form, category: e.target.value})} className="w-full h-12 bg-[#06140F] border border-[#1A3D2E] rounded-xl px-4 text-xs font-bold focus:border-[#00A86B] outline-none">
                       <option value="organization">Организация</option>
                       <option value="railway_station">Вокзал</option>
                       <option value="airport">Аэропорт</option>
                       <option value="hospital">Больница</option>
                       <option value="migration">МВД / МФЦ</option>
                    </select>
                  </div>
               </div>
               <div className="grid grid-cols-2 gap-3">
                  <div>
                    <label className="text-[9px] font-black uppercase text-[#5C7A6D] ml-1">Широта (Lat)</label>
                    <input type="number" value={form.latitude || ''} onChange={e => setForm({...form, latitude: parseFloat(e.target.value)})} className="w-full h-12 bg-[#06140F] border border-[#1A3D2E] rounded-xl px-4 text-xs font-bold focus:border-[#00A86B] outline-none" />
                  </div>
                  <div>
                    <label className="text-[9px] font-black uppercase text-[#5C7A6D] ml-1">Долгота (Lon)</label>
                    <input type="number" value={form.longitude || ''} onChange={e => setForm({...form, longitude: parseFloat(e.target.value)})} className="w-full h-12 bg-[#06140F] border border-[#1A3D2E] rounded-xl px-4 text-xs font-bold focus:border-[#00A86B] outline-none" />
                  </div>
               </div>

               <button 
                 onClick={handleSave}
                 className="w-full h-14 vaqta-gradient rounded-2xl font-black uppercase text-xs tracking-widest shadow-xl flex items-center justify-center gap-2"
               >
                 <Save size={18} /> Сохранить объект
               </button>
            </div>
          </div>
        )}
      </main>

      <BottomNav />
    </div>
  );
}