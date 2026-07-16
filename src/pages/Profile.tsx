/*
VaxtaGo
Created by Dmitry Diev
AI Development Assistant: ChatGPT (OpenAI)
Copyright © 2026
*/

import { useState, useEffect } from "react";
import { User, CreditCard, History } from "lucide-react";
import { supabase } from "@/integrations/supabase/client";

export default function Profile() {
  const [profile, setProfile] = useState<any>(null);
  const [documents, setDocuments] = useState<any[]>([]);
  const [isLoading, setIsLoading] = useState(true);

  useEffect(() => {
    loadProfile();
  }, []);

  async function loadProfile() {
    try {
      const { data: { session } } = await supabase.auth.getSession();
      if (!session) {
        setIsLoading(false);
        return;
      }

      const { data: userData } = await supabase
        .from("telegram_users")
        .select("*")
        .eq("user_id", session.user.id)
        .maybeSingle();

      setProfile(userData);

      const { data: docs } = await supabase
        .from("document_analysis")
        .select("*")
        .eq("user_id", session.user.id)
        .order("created_at", { ascending: false })
        .limit(5);

      setDocuments(docs || []);
    } catch (err) {
      console.error(err);
    } finally {
      setIsLoading(false);
    }
  }

  return (
    <div className="min-h-screen bg-gradient-to-br from-orange-50 to-amber-50 p-4">
      <div className="max-w-md mx-auto">
        <h1 className="text-2xl font-bold text-center mb-6 text-orange-800">
          👤 Профиль
        </h1>

        {isLoading ? (
          <div className="text-center py-8">Загрузка...</div>
        ) : (
          <>
            {profile && (
              <div className="bg-white rounded-2xl p-4 shadow-lg mb-4">
                <div className="flex items-center gap-3 mb-3">
                  <User size={24} className="text-orange-600" />
                  <span className="font-semibold">{profile.full_name || "Пользователь"}</span>
                </div>
                <div className="space-y-1 text-sm text-gray-600">
                  <p>Telegram ID: {profile.telegram_id}</p>
                  <p>Язык: {profile.language}</p>
                  <p className="flex items-center gap-1">
                    <CreditCard size={14} /> Статус: {profile.subscription_status || "FREE"}
                  </p>
                </div>
              </div>
            )}

            <div className="bg-white rounded-2xl p-4 shadow-lg">
              <h3 className="font-semibold mb-3 flex items-center gap-2">
                <History size={18} /> История документов
              </h3>
              {documents.length === 0 ? (
                <p className="text-sm text-gray-500">Пока нет документов</p>
              ) : (
                <div className="space-y-2">
                  {documents.map((doc) => (
                    <div key={doc.id} className="text-sm border-b pb-2">
                      <p className="font-medium">{doc.document_type}</p>
                      <p className="text-gray-500 text-xs">
                        {new Date(doc.created_at).toLocaleDateString()}
                      </p>
                    </div>
                  ))}
                </div>
              )}
            </div>
          </>
        )}
      </div>
    </div>
  );
}