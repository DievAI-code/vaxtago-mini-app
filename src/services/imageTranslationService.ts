"use client";

import { supabase } from "@/integrations/supabase/client";

export const imageTranslationService = {
  async processImage(file: File, targetLang: string): Promise<{ original: string; translated: string }> {
    const reader = new FileReader();
    return new Promise((resolve, reject) => {
      reader.onload = async (e) => {
        const base64 = e.target?.result as string;
        try {
          const { data, error } = await supabase.functions.invoke("vision-assistant", {
            body: { image: base64, language: targetLang, request_type: "translate_full" }
          });
          if (error) throw error;
          
          // Эмуляция наложения текста (в идеале делает Edge Function, здесь логика отрисовки)
          const translatedImage = await this.generateOverlay(base64, data.translation, data.blocks);
          resolve({ original: base64, translated: translatedImage });
        } catch (err) {
          reject(err);
        }
      };
      reader.readAsDataURL(file);
    });
  },

  async generateOverlay(base64: string, text: string, blocks?: any[]): Promise<string> {
    const canvas = document.createElement("canvas");
    const ctx = canvas.getContext("2d");
    const img = new Image();
    
    return new Promise((resolve) => {
      img.onload = () => {
        canvas.width = img.width;
        canvas.height = img.height;
        ctx?.drawImage(img, 0, 0);
        
        // Рисуем стильный полупрозрачный слой для перевода
        ctx!.fillStyle = "rgba(6, 20, 15, 0.85)";
        ctx!.fillRect(0, canvas.height - 150, canvas.width, 150);
        
        ctx!.fillStyle = "#FFFFFF";
        ctx!.font = "bold 40px Inter";
        ctx!.fillText(text.slice(0, 100), 50, canvas.height - 80);
        
        resolve(canvas.toDataURL("image/jpeg"));
      };
      img.src = base64;
    });
  }
};