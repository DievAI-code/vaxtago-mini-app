import { useState, useEffect } from "react";
import { MapPin, Wallet } from "lucide-react";
import { supabase } from "@/integrations/supabase/client";
import { useTranslation } from "react-i18next";

interface Vacancy {
  id: string;
  title: string;
  company: string;
  city: string;
  salary: string;
  description: string;
  url: string;
}

export default function Jobs() {
  const { t } = useTranslation();
  const [vacancies, setVacancies] = useState<Vacancy[]>([]);
  const [isLoading, setIsLoading] = useState(true);

  useEffect(() => {
    loadVacancies();
  }, []);

  async function loadVacancies() {
    try {
      const { data, error } = await supabase.from("vacancies").select("*, employers(name)").limit(10);
      if (error) throw error;
      setVacancies((data || []).map((v: any) => ({
        id: v.id,
        title: v.title,
        company: v.employers?.name || "Компания",
        city: v.city,
        salary: `${v.salary_from}–${v.salary_to} ₽`,
        description: v.description,
        url: v.url,
      })));
    } catch (err) {
      console.error(err);
    } finally {
      setIsLoading(false);
    }
  }

  return (
    <div className="min-h-screen bg-gradient-to-br from-green-50 to-emerald-50 p-4">
      <div className="max-w-md mx-auto">
        <h1 className="text-2xl font-bold text-center mb-6 text-green-800">{t("jobs_title")}</h1>
        {isLoading ? (
          <div className="text-center py-8">{t("loading")}</div>
        ) : (
          <div className="space-y-4">
            {vacancies.map((v) => (
              <div key={v.id} className="bg-white rounded-2xl p-4 shadow-lg">
                <h3 className="font-bold text-lg">{v.title}</h3>
                <p className="text-gray-600 text-sm mt-1">{v.company}</p>
                <div className="flex items-center gap-4 mt-2 text-sm text-gray-500">
                  <span className="flex items-center gap-1"><MapPin size={14} /> {v.city}</span>
                  <span className="flex items-center gap-1"><Wallet size={14} /> {v.salary}</span>
                </div>
                <p className="text-sm text-gray-700 mt-2 line-clamp-3">{v.description}</p>
                <a href={v.url} target="_blank" rel="noreferrer" className="mt-3 inline-block bg-green-600 text-white px-4 py-2 rounded-xl text-sm font-semibold hover:bg-green-700">
                  {t("jobs_apply")}
                </a>
              </div>
            ))}
          </div>
        )}
      </div>
    </div>
  );
}