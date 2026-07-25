"use client";

import { supabase } from "@/integrations/supabase/client";

export interface OCRBlock {
  text: string;
  x: number;
  y: number;
  width: number;
  height: number;
  confidence: number;
}

export interface OCRResult {
  text: string;
  blocks: OCRBlock[];
  language: string;
}

class OCRService {
  async recognizeText(imageBase64: string): Promise<OCRResult> {
    console.log("[OCR TEXT] Starting recognition...");
    
    try {
      const { data, error } = await supabase.functions.invoke("vision-assistant", {
        body: {
          image: imageBase64,
          request_type: "ocr_detect",
          instruction: `Распознай ВСЕ текстовые блоки на изображении.

Верни строго JSON:
{
  "fullText": "полный распознанный текст со всеми переносами строк",
  "language": "ru" | "uz" | "tj" | "en" | "ky",
  "blocks": [
    { "text": "текст блока", "x": число, "y": число, "width": число, "height": число, "confidence": число_от_0_до_1 }
  ]
}

ВАЖНО:
- Координаты x, y, width, height — в пикселях от верхнего левого угла
- Сохраняй порядок блоков сверху вниз
- Объединяй слова одной строки в один блок`
        }
      });

      console.log("[OCR TEXT] Vision API response:", data);

      if (error) {
        console.error("[OCR TEXT] Vision error:", error);
        throw error;
      }

      let result: OCRResult;
      
      // Try to parse the result
      const rawResult = data?.result;
      if (rawResult) {
        try {
          const parsed = typeof rawResult === 'string' ? JSON.parse(rawResult) : rawResult;
          result = {
            text: parsed.fullText || parsed.text || "",
            blocks: Array.isArray(parsed.blocks) && parsed.blocks.length > 0 
              ? parsed.blocks 
              : this.estimateBlocks(parsed.fullText || ""),
            language: parsed.language || "ru"
          };
        } catch (e) {
          console.warn("[OCR TEXT] Failed to parse structured result, using fallback");
          result = {
            text: data.ocr_text || data.text || (typeof rawResult === 'string' ? rawResult : ""),
            blocks: this.estimateBlocks(data.ocr_text || ""),
            language: data.language || "ru"
          };
        }
      } else {
        result = {
          text: data.ocr_text || data.text || data.explanation || "",
          blocks: this.estimateBlocks(data.ocr_text || data.text || ""),
          language: data.language || "ru"
        };
      }

      console.log(`[OCR TEXT] Recognized ${result.blocks.length} blocks, language: ${result.language}`);
      console.log(`[OCR TEXT] Full text:`, result.text);
      console.log(`[OCR TEXT] Blocks:`, result.blocks);

      return result;
    } catch (error) {
      console.error("[OCR TEXT] Recognition failed:", error);
      throw error;
    }
  }

  /**
   * Heuristic block estimation when AI doesn't return coordinates
   * Groups text by lines and estimates positions on a 1000x1400 canvas
   */
  private estimateBlocks(text: string): OCRBlock[] {
    if (!text) return [];
    
    const lines = text.split('\n').filter(l => l.trim());
    const blocks: OCRBlock[] = [];
    const canvasWidth = 1000;
    const canvasHeight = 1400;
    const startY = 100;
    const lineHeight = 60;
    const charWidth = 14;
    const padding = 40;

    let y = startY;
    for (const line of lines) {
      if (!line.trim()) continue;
      const width = Math.min(line.length * charWidth + 20, canvasWidth - padding * 2);
      const x = padding;
      const height = lineHeight * 0.8;

      blocks.push({
        text: line.trim(),
        x,
        y,
        width,
        height,
        confidence: 0.7
      });
      
      y += lineHeight;
      if (y > canvasHeight - 100) break;
    }

    return blocks;
  }

  async detectTextRegions(image: HTMLImageElement): Promise<OCRBlock[]> {
    const canvas = document.createElement('canvas');
    const ctx = canvas.getContext('2d');
    if (!ctx) return [];

    canvas.width = image.width;
    canvas.height = image.height;
    ctx.drawImage(image, 0, 0);

    return [];
  }
}

export const ocrService = new OCRService();