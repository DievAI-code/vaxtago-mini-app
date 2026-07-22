"use client";

import { supabase } from "@/integrations/supabase/client";

export const imageTranslationService = {
  /**
   * Загружает изображение и возвращает переведенный текст с координатами
   */
  async translateImage(base64: string, targetLang: string) {
    try {
      const { data, error } = await supabase.functions.invoke("vision-assistant", {
        body: { 
          image: base64, 
          request_type: "translate_on_image",
          language: targetLang 
        }
      });

      if (error) throw error;

      // data содержит: ocr_text, translation, blocks (координаты текста)
      return data;
    } catch (err) {
      console.error("[Vision] Translation failed:", err);
      throw err;
    }
  },

  /**
   * Рендерит переведенный текст поверх оригинального изображения на Canvas
   */
  async generateOverlay(canvas: HTMLCanvasElement, img: HTMLImageElement, blocks: any[]) {
    const ctx = canvas.getContext("2d");
    if (!ctx) return;

    ctx.drawImage(img, 0, 0);
    ctx.fillStyle = "rgba(6, 20, 15, 0.85)"; // Фон под текст в стиле VAQTA
    
    blocks.forEach(block => {
      // Рисуем плашку под текст
      ctx.fillRect(block.x, block.y, block.width, block.height);
      
      // Пишем перевод
      ctx.fillStyle = "#FFFFFF";
      ctx.font = `${block.fontSize}px Inter`;
      ctx.fillText(block.text, block.x + 5, block.y + block.height - 5);
    });
  }
};