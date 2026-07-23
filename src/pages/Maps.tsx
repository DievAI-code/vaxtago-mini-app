"use client";

import { useState, useEffect } from "react";
import { useSearchParams } from "react-router-dom";
import { Header } from "@/components/Header";
import { BottomNav } from "@/components/BottomNav";
import { VaqtaMap } from "@/components/maps/VaqtaMap";
import { yandexMapsService } from "@/services/yandexMaps";
import { useLanguage } from "@/context/LanguageProvider";

export default function MapsPage() {
  const { t } = useLanguage();
  const [searchParams] = useSearchParams();
  const [searchQuery, setSearchQuery] = useState<string>("");
  const [coordinates, setCoordinates] = useState<[number, number] | undefined>();

  useEffect(() => {
    const search = searchParams.get("search");
    const route = searchParams.get("route");
    
    if (search) {
      setSearchQuery(search);
    } else if (route) {
      setSearchQuery(route);
    }
  }, [searchParams]);

  const handleLocationSelect = async (result: any) => {
    // Можно сохранить выбранное местоположение
    console.log("Selected location:", result);
  };

  return (
    <div className="flex flex-col min-h-screen bg-[#06140F] text-white pb-32">
      <Header title="Карты" showBack />
      
      <main className="flex-1 p-6">
        <div className="mb-6">
          <h1 className="text-2xl font-black mb-2">VaxtaGo Карты</h1>
          <p className="text-[#5C7A6D] text-sm">
            {searchQuery ? `Поиск: ${searchQuery}` : "Найдите место на карте"}
          </p>
        </div>

        <VaqtaMap
          searchQuery={searchQuery}
          coordinates={coordinates}
          onLocationSelect={handleLocationSelect}
        />

        <div className="mt-6 vaqta-glass p-6 border-[#1A3D2E]">
          <h3 className="font-bold mb-3">Как использовать:</h3>
          <ul className="text-sm text-[#5C7A6D] space-y-2">
            <li>• Напишите AI: "Покажи вокзал в Тюмени"</li>
            <li>• AI найдёт адрес и откроет карту</li>
            <li>• Используйте кнопки для навигации</li>
          </ul>
        </div>
      </main>

      <BottomNav />
    </div>
  );
}