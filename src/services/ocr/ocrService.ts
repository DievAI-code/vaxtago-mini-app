"use client";

import { supabase } from "@/integrations/supabase/client";

export interface OCRBlock {
  text: string;
  x: number;
  y: number;
  width: number;
  height: number;
  confidence: number;
  color?: string;
  backgroundColor?: string;
  fontSize?: number;
  textAlign?: "left" | "center" | "right";
}

export interface OCRResult {
  text: string;
  blocks: OCRBlock[];
  language: string;
}

class OCRService {
  async recognizeText(
    imageBase64: string,
    targetLang: string = "ru"
  ): Promise<OCRResult> {
    console.log("[OCR TEXT] Starting recognition, target lang:", targetLang);

    try {
      const systemPrompt = `Ты — продвинутый OCR и анализатор документов для VAQTA AI.
Твоя задача — распознать ВСЕ текстовые блоки на изображении, точно определить их координаты, стили и вернуть результат строго в формате JSON.

Формат ответа (только JSON, без markdown):
{
  "source_language": "ru" | "uz" | "tj" | "en" | "ky",
  "blocks": [
    {
      "text": "оригинальный текст блока",
      "x": 0, "y": 0, "width": 100, "height": 30,
      "confidence": 0.95,
      "color": "#000000",
      "backgroundColor": "#FFFFFF",
      "fontSize": 16,
      "textAlign": "left" | "center" | "right"
    }
  ]
}

ВАЖНО:
- Координаты x, y, width, height — пиксели от верхнего левого угла
- color и backgroundColor — в формате HEX (#RRGGBB)
- fontSize — примерный размер шрифта в пикселях
- textAlign — выравнивание текста в блоке
- Сохраняй порядок блоков сверху вниз, слева направо
- Объединяй слова одной строки в один блок`;

      const { data, error } = await supabase.functions.invoke("vision-assistant", {
        body: {
          image: imageBase64,
          language: targetLang,
          request_type: "ocr_translate_full",
          instruction: systemPrompt,
        },
      });

      if (error) {
        console.error("[OCR TEXT] Vision error:", error);
        throw error;
      }

      let sourceLanguage = "ru";
      let blocks: OCRBlock[] = [];

      const rawResult = data?.result;
      const structured = typeof rawResult === "string" ? safeParseJson(rawResult) : rawResult;
      const ocr = structured || data;

      if (ocr?.blocks && Array.isArray(ocr.blocks)) {
        sourceLanguage = ocr.source_language || ocr.sourceLanguage || "ru";
        blocks = ocr.blocks.map((b: any, i: number) => ({
          text: b.text || "",
          x: Number(b.x) || 0,
          y: Number(b.y) || 0,
          width: Number(b.width) || 100,
          height: Number(b.height) || 30,
          confidence: Number(b.confidence) || 0.9,
          color: b.color || "#000000",
          backgroundColor: b.backgroundColor || "#FFFFFF",
          fontSize: Number(b.fontSize) || Math.max(11, Math.min(b.height * 0.7, 24)),
          textAlign: b.textAlign || "left",
        }));
      } else {
        const flatText: string =
          ocr?.fullText || ocr?.text || ocr?.ocr_text ||
          (typeof rawResult === "string" ? rawResult : "") ||
          data?.ocr_text || data?.text || data?.explanation || "";

        if (!flatText.trim()) {
          throw new Error("EMPTY_OCR_RESULT");
        }

        sourceLanguage = ocr?.source_language || ocr?.language || "ru";
        blocks = this.estimateBlocks(flatText);
      }

      const fullText = blocks.map((b) => b.text).join("\n");

      console.log(`[OCR TEXT] Recognized ${blocks.length} blocks, src=${sourceLanguage}`);
      return {
        text: fullText,
        blocks,
        language: sourceLanguage,
      };
    } catch (error) {
      console.error("[OCR TEXT] Recognition failed:", error);
      throw error;
    }
  }

  private estimateBlocks(text: string): OCRBlock[] {
    if (!text) return [];
    const lines = text.split("\n").filter((l) => l.trim());
    const blocks: OCRBlock[] = [];
    const canvasWidth = 1000;
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
        confidence: 0.7,
        color: "#000000",
        backgroundColor: "#FFFFFF",
        fontSize: 16,
        textAlign: "left",
      });
      y += lineHeight;
      if (y > 1300) break;
    }
    return blocks;
  }
}

function safeParseJson(s: string): any {
  try {
    return JSON.parse(s);
  } catch {
    const m = s.match(/\{[\s\S]*\}/);
    if (m) {
      try { return JSON.parse(m[0]); } catch { return null; }
    }
    return null;
  }
}

export const ocrService = new OCRService();