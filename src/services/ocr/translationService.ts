"use client";

export type LanguageCode = "ru" | "uz" | "tj" | "en" | "ky" | "auto";

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
    en: "English",
    ky: "Кыргызча"
  };

  detectLanguage(text: string): string {
    if (!text || text.length < 3) return "ru";
    
    const cyrillicPattern = /[а-яё]/i;
    const latinPattern = /[a-z]/i;
    
    if (/[ўғқҳ]/i.test(text)) return "uz";
    if (/[ҷҳқғ]/i.test(text)) return "tj";
    if (/[ңүө]/i.test(text)) return "ky";
    if (cyrillicPattern.test(text) && !latinPattern.test(text)) return "ru";
    if (latinPattern.test(text) && !cyrillicPattern.test(text)) return "en";
    
    if (/[a-z]/i.test(text)) {
      const words = text.toLowerCase().split(/\s+/);
      const uzbekWords = ["va", "bu", "uchun", "bilan", "qayerda", "qanday", "men", "siz"];
      const englishWords = ["the", "is", "and", "with", "for", "this", "that", "have"];
      const uzbekCount = words.filter(w => uzbekWords.includes(w)).length;
      const englishCount = words.filter(w => englishWords.includes(w)).length;
      if (uzbekCount > englishCount) return "uz";
      if (englishCount > 0) return "en";
    }
    
    return "ru";
  }

  async translate(
    text: string,
    sourceLang: string,
    targetLang: string
  ): Promise<TranslationResult> {
    if (!text.trim()) {
      return { translatedText: "", sourceLanguage: sourceLang, targetLanguage: targetLang };
    }

    if (sourceLang === targetLang) {
      return { translatedText: text, sourceLanguage: sourceLang, targetLanguage: targetLang };
    }

    try {
      const protectedParts: string[] = [];
      let processedText = text;

      processedText = processedText.replace(/\d{1,2}[./]\d{1,2}[./]\d{2,4}/g, (match) => {
        protectedParts.push(match);
        return `__DATE_${protectedParts.length - 1}__`;
      });

      processedText = processedText.replace(/[+\d\s()-]{10,20}/g, (match) => {
        if (match.replace(/\D/g, '').length >= 10) {
          protectedParts.push(match);
          return `__PHONE_${protectedParts.length - 1}__`;
        }
        return match;
      });

      processedText = processedText.replace(/[^\s@]+@[^\s@]+\.[^\s@]+/g, (match) => {
        protectedParts.push(match);
        return `__EMAIL_${protectedParts.length - 1}__`;
      });

      const sourceName = this.languageNames[sourceLang] || sourceLang;
      const targetName = this.languageNames[targetLang] || targetLang;

      const { data, error } = await supabase.functions.invoke("ai-assistant", {
        body: {
          message: `Переведи следующий текст с ${sourceName} на ${targetName}. Сохрани форматирование, даты, номера и адреса без изменений. Переведи естественно, с учетом контекста:\n\n${processedText}`,
          language_code: targetLang,
          user_phone: localStorage.getItem("vaxtago_user_phone") || "anonymous",
          intent: "TRANSLATION"
        }
      });

      if (error) throw error;

      let translated = data?.reply || data?.text || text;
      translated = translated.replace(/^["']|["']$/g, '').trim();

      for (let i = protectedParts.length - 1; i >= 0; i--) {
        translated = translated.replace(
          new RegExp(`__DATE_${i}__|__PHONE_${i}__|__EMAIL_${i}__`, 'g'),
          protectedParts[i]
        );
      }

      return { translatedText: translated, sourceLanguage: sourceLang, targetLanguage: targetLang };
    } catch (error) {
      console.error("[Translation] Failed:", error);
      return { translatedText: text, sourceLanguage: sourceLang, targetLanguage: targetLang };
    }
  }
}

import { supabase } from "@/integrations/supabase/client";
export const translationService = new TranslationService();