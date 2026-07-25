"use client";

import { supabase } from "@/integrations/supabase/client";
import { ocrService, OCRBlock, OCRResult } from "./ocr/ocrService";
import { translationService } from "./ocr/translationService";
import { imageTranslator } from "./ocr/imageTranslator";

export interface OCRAnalysis {
  text: string;
  translatedText: string;
  explanation: string;
  docType: string;
  language: string;
  sourceLanguage: string;
  targetLanguage: string;
  blocks: Array<{
    text: string;
    translation: string;
    box: { x: number; y: number; w: number; h: number };
  }>;
}

export interface ProcessResult {
  original: string;
  translated: string; // data URL of the photo with translation rendered in-place
  analysis: OCRAnalysis;
}

const MAX_RETRIES = 2;
const MAX_FILE_SIZE_MB = 10;

export const imageTranslationService = {
  /**
   * Full OCR + translate + render pipeline.
   * Returns the original image, the image with the translation rendered over it,
   * and the analysis (recognized text, translated text, doc type, blocks).
   */
  async processDocument(
    file: File,
    targetLang: string = "ru"
  ): Promise<ProcessResult> {
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

  /**
   * Pipeline:
   *  1. OCR: extract text + coordinates
   *  2. Detect source language (or use provided)
   *  3. Translate each block into target language
   *  4. Render translated text on top of the original image
   */
  async processWithAI(
    base64: string,
    targetLang: string
  ): Promise<ProcessResult> {
    // 1. OCR
    const ocrResult: OCRResult = await ocrService.recognizeText(base64, targetLang);
    if (!ocrResult.text.trim()) {
      throw new Error("EMPTY_OCR_RESULT");
    }

    const sourceLanguage = ocrResult.language || "ru";
    const effectiveSource = sourceLanguage === targetLang ? "ru" : sourceLanguage;

    // 2. Translate each block
    const translations = new Map<number, string>();
    for (let i = 0; i < ocrResult.blocks.length; i++) {
      const block = ocrResult.blocks[i];
      if (block.text.trim()) {
        const result = await translationService.translate(
          block.text,
          effectiveSource,
          targetLang
        );
        translations.set(i, result.translatedText);
      }
    }

    // 3. Render the photo with translations baked in
    const translatedImage = await imageTranslator.createTranslatedImage({
      image: base64,
      blocks: ocrResult.blocks,
      translations,
      fontFamily: "Inter, Arial, sans-serif",
    });

    // 4. Compose analysis
    const translatedFullText = Array.from(translations.values()).join("\n");
    const analysis: OCRAnalysis = {
      text: ocrResult.text,
      translatedText: translatedFullText,
      explanation: translatedFullText
        ? `Документ распознан (${ocrResult.blocks.length} блоков). Язык оригинала: ${effectiveSource}. Переведено на ${targetLang}.`
        : ocrResult.text,
      docType: this.guessDocType(ocrResult.text),
      language: effectiveSource,
      sourceLanguage: effectiveSource,
      targetLanguage: targetLang,
      blocks: ocrResult.blocks.map((b, i) => ({
        text: b.text,
        translation: translations.get(i) || "",
        box: { x: b.x, y: b.y, w: b.width, h: b.height },
      })),
    };

    return {
      original: base64,
      translated: translatedImage,
      analysis,
    };
  },

  guessDocType(text: string): string {
    const low = text.toLowerCase();
    if (/вакансия|job|vacancy|зарплат|работ/i.test(low)) return "job_ad";
    if (/договор|контракт|contract|трудов/i.test(low)) return "contract";
    if (/паспорт|passport|серия|номер/i.test(low)) return "passport";
    if (/патент|patent|мвд|миграц/i.test(low)) return "patent";
    return "unknown";
  },

  async fileToBase64(file: File): Promise<string> {
    return new Promise((resolve, reject) => {
      const reader = new FileReader();
      reader.onload = () => resolve(reader.result as string);
      reader.onerror = reject;
      reader.readAsDataURL(file);
    });
  },
};