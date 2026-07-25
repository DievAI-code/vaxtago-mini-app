"use client";

import { supabase } from "@/integrations/supabase/client";

export interface OCRAnalysis {
  text: string;
  translatedText: string;
  explanation: string;
  docType: string;
  language: string;
  blocks: Array<{
    text: string;
    translation: string;
    box: { x: number; y: number; w: number; h: number };
  }>;
}

export const imageTranslationService = {
  async processDocument(file: File, targetLang: string): Promise<{ original: string; translated: string; analysis: OCRAnalysis }> {
    const base64 = await this.fileToBase64(file);
    
    try {
      // 1. Call AI Vision for OCR + Layout + Translation
      const { data, error } = await supabase.functions.invoke("vision-assistant", {
        body: { 
          image: base64, 
          language: targetLang, 
          request_type: "document_ocr_full" 
        }
      });
      
      if (error) throw error;

      const analysis: OCRAnalysis = {
        text: data.ocr_text || "",
        translatedText: data.translation || "",
        explanation: data.explanation || "Документ успешно распознан.",
        docType: data.document_type || "unknown",
        language: data.language || "ru",
        blocks: data.blocks || []
      };

      // 2. Generate visually translated image via Canvas
      const translatedImg = await this.generateTranslatedOverlay(base64, analysis.blocks);

      return {
        original: base64,
        translated: translatedImg,
        analysis
      };
    } catch (err) {
      console.error("[OCR Service] Processing failed:", err);
      throw err;
    }
  },

  async fileToBase64(file: File): Promise<string> {
    return new Promise((resolve, reject) => {
      const reader = new FileReader();
      reader.onload = () => resolve(reader.result as string);
      reader.onerror = reject;
      reader.readAsDataURL(file);
    });
  },

  async generateTranslatedOverlay(originalBase64: string, blocks: any[]): Promise<string> {
    return new Promise((resolve) => {
      const img = new Image();
      img.onload = () => {
        const canvas = document.createElement("canvas");
        const ctx = canvas.getContext("2d");
        if (!ctx) return resolve(originalBase64);

        canvas.width = img.width;
        canvas.height = img.height;
        
        // Draw original with slight dimming
        ctx.drawImage(img, 0, 0);
        ctx.fillStyle = "rgba(0, 0, 0, 0.1)";
        ctx.fillRect(0, 0, canvas.width, canvas.height);

        // Draw translated blocks
        blocks.forEach(block => {
          if (!block.box) return;
          
          const { x, y, w, h } = block.box;
          
          // Background patch to cover original text
          ctx.fillStyle = "rgba(255, 255, 255, 0.9)";
          ctx.fillRect(x, y, w, h);
          ctx.strokeStyle = "rgba(0, 168, 110, 0.3)";
          ctx.lineWidth = 2;
          ctx.strokeRect(x, y, w, h);

          // Text rendering
          ctx.fillStyle = "#000000";
          const fontSize = Math.max(12, h * 0.7);
          ctx.font = `bold ${fontSize}px Inter, sans-serif`;
          ctx.textBaseline = "middle";
          
          // Simple wrap/fit logic
          const text = block.translation || block.text;
          ctx.fillText(text, x + 5, y + h / 2, w - 10);
        });

        resolve(canvas.toDataURL("image/jpeg", 0.9));
      };
      img.src = originalBase64;
    });
  }
};