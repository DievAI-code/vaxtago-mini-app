"use client";

export type LanguagePair = "ru-uz" | "uz-ru" | "ru-tj" | "tj-ru" | "ru-en" | "en-ru";

export interface TranslationResult {
  translatedText: string;
  sourceLanguage: string;
  targetLanguage: string;
}

class TranslationService {
  private languageNames: Record<string, string> = {
    ru: "Русский",
    uz: "O'zbek",
    tj: "Тоҷикӣ",
    en: "English"
  };

  async translate(
    text: string, 
    sourceLang: string, 
    targetLang: string
  ): Promise<TranslationResult> {
    if (!text.trim()) {
      return {
        translatedText: "",
        sourceLanguage: sourceLang,
        targetLanguage: targetLang
      };
    }

    try {
      // Use AI assistant for translation
      const { data, error } = await supabase.functions.invoke("ai-assistant", {
        body: {
          message: `Переведи следующий текст с ${this.languageNames[sourceLang] || sourceLang} на ${this.languageNames[targetLang] || targetLang}. Сохрани форматирование, даты, номера и адреса без изменений. Переведи естественно, с учетом контекста документа:\n\n${text}`,
          language_code: targetLang,
          user_phone: localStorage.getItem("vaxtago_user_phone") || "unknown",
          intent: "TRANSLATION"
        }
      });

      if (error) throw error;

      // Clean up the translation (remove quotes if AI added them)
      let translated = data?.reply || data?.text || text;
      translated = translated.replace(/^["']|["']$/g, '').trim();

      return {
        translatedText: translated,
        sourceLanguage: sourceLang,
        targetLanguage: targetLang
      };
    } catch (error) {
      console.error("[Translation] Failed:", error);
      // Fallback: return original with note
      return {
        translatedText: `[Перевод недоступен] ${text}`,
        sourceLanguage: sourceLang,
        targetLanguage: targetLang
      };
    }
  }

  // Translate with preservation of special formats
  async translateDocument(
    text: string,
    sourceLang: string,
    targetLang: string
  ): Promise<TranslationResult> {
    // Pre-process: protect dates, numbers, codes
    const protectedParts: string[] = [];
    let processedText = text;

    // Protect dates (DD.MM.YYYY, DD/MM/YYYY, etc.)
    processedText = processedText.replace(/\d{1,2}[./]\d{1,2}[./]\d{2,4}/g, (match) => {
      protectedParts.push(match);
      return `__DATE_${protectedParts.length - 1}__`;
    });

    // Protect phone numbers
    processedText = processedText.replace(/[+\d\s()-]{10,20}/g, (match) => {
      if (match.replace(/\D/g, '').length >= 10) {
        protectedParts.push(match);
        return `__PHONE_${protectedParts.length - 1}__`;
      }
      return match;
    });

    // Protect email addresses
    processedText = processedText.replace(/[^\s@]+@[^\s@]+\.[^\s@]+/g, (match) => {
      protectedParts.push(match);
      return `__EMAIL_${protectedParts.length - 1}__`;
    });

    // Translate
    const result = await this.translate(processedText, sourceLang, targetLang);

    // Restore protected parts
    let restoredText = result.translatedText;
    for (let i = protectedParts.length - 1; i >= 0; i--) {
      restoredText = restoredText.replace(
        new RegExp(`__DATE_${i}__|__PHONE_${i}__|__EMAIL_${i}__`, 'g'),
        protectedParts[i]
      );
    }

    return {
      ...result,
      translatedText: restoredText
    };
  }

  detectLanguage(text: string): string {
    // Simple detection based on character ranges
    if (/[ўғқҳ]/i.test(text)) return "uz";
    if (/[ҷҳқғ]/i.test(text)) return "tj";
    if (/[а-яё]/i.test(text)) return "ru";
    return "en";
  }
}

import { supabase } from "@/integrations/supabase/client";
export const translationService = new TranslationService();