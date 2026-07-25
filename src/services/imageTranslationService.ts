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

export interface ProcessResult {
  original: string;
  translated: string;
  analysis: OCRAnalysis;
}

const MAX_RETRIES = 2;
const MAX_FILE_SIZE_MB = 10;

export const imageTranslationService = {
  async processDocument(file: File, targetLang: string): Promise<ProcessResult> {
    if (!file.type.startsWith("image/")) {
      throw new Error("INVALID_FILE_TYPE");
    }
    if (file.size > MAX_FILE_SIZE_MB * 1024 * 1024) {
      throw new Error("FILE_TOO_LARGE");
    }

    const base64 = await this.fileToBase64(file);
    let lastError: any;

    for (let attempt = 0; attempt <= MAX_RETRIES; attempt++) {
      try {
        return await this.processWithAI(base64, targetLang);
      } catch (err) {
        lastError = err;
        if (attempt < MAX_RETRIES) {
          await new Promise((r) => setTimeout(r, 1500 * (attempt + 1)));
        }
      }
    }

    throw lastError;
  },

  async processWithAI(base64: string, targetLang: string): Promise<ProcessResult> {
    if (!supabase) throw new Error("SUPABASE_NOT_INITIALIZED");

    const { data, error } = await supabase.functions.invoke("vision-assistant", {
      body: {
        image: base64,
        language: targetLang,
        request_type: "document_ocr_full",
      },
    });

    if (error) throw error;
    if (!data) throw new Error("EMPTY_RESPONSE");

    const analysis: OCRAnalysis = {
      text: data.ocr_text || "",
      translatedText: data.translation || "",
      explanation: data.explanation || "Документ успешно распознан.",
      docType: data.document_type || "unknown",
      language: data.language || "ru",
      blocks: Array.isArray(data.blocks) ? data.blocks : [],
    };

    const translatedImg = await this.generateTranslatedOverlay(base64, analysis.blocks);

    return {
      original: base64,
      translated: translatedImg,
      analysis,
    };
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

        ctx.drawImage(img, 0, 0);
        ctx.fillStyle = "rgba(0, 0, 0, 0.1)";
        ctx.fillRect(0, 0, canvas.width, canvas.height);

        blocks.forEach((block) => {
          if (!block.box) return;
          const { x, y, w, h } = block.box;

          ctx.fillStyle = "rgba(255, 255, 255, 0.9)";
          ctx.fillRect(x, y, w, h);
          ctx.strokeStyle = "rgba(0, 168, 110, 0.3)";
          ctx.lineWidth = 2;
          ctx.strokeRect(x, y, w, h);

          ctx.fillStyle = "#000000";
          const fontSize = Math.max(12, h * 0.7);
          ctx.font = `bold ${fontSize}px Inter, sans-serif`;
          ctx.textBaseline = "middle";

          const text = block.translation || block.text || "";
          ctx.fillText(text, x + 5, y + h / 2, w - 10);
        });

        resolve(canvas.toDataURL("image/jpeg", 0.9));
      };
      img.onerror = () => resolve(originalBase64);
      img.src = originalBase64;
    });
  },
};