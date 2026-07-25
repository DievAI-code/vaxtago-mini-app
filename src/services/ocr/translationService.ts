"use client";

import { supabase } from "@/integrations/supabase/client";

export type LanguageCode = "ru" | "uz" | "tj" | "en" | "ky" | "auto";

export interface TranslationResult {
  translatedText: string;
  sourceLanguage: string;
  targetLanguage: string;
}

class TranslationService {
  private languageNames: Record<string, string> = {
    ru: "Русский",
    uz: "Узбекский",
    tj: "Таджикский",
    en: "Английский",
    ky: "Кыргызский"
  };

  detectLanguage(text: string): string {
    if (!text || text.length < 3) return "ru";
    
    const cyrillicPattern = /[а-яё]/i;
    const latinPattern = /[a-z]/i;
    
    // Uzbek specific characters: ў, ғ, қ, ҳ
    if (/[ўғқҳ]/i.test(text)) return "uz";
    // Tajik specific characters: ҷ, ҳ, қ, ғ
    if (/[ҷ]/i.test(text) && cyrillicPattern.test(text)) return "tj";
    // Kyrgyz specific characters: ң, ү, ө
    if (/[ңүө]/i.test(text)) return "ky";
    
    if (cyrillicPattern.test(text) && !latinPattern.test(text)) return "ru";
    if (latinPattern.test(text) && !cyrillicPattern.test(text)) return "en";
    
    if (/[a-z]/i.test(text)) {
      const words = text.toLowerCase().split(/\s+/);
      const uzbekWords = ["va", "bu", "uchun", "bilan", "qayerda", "qanday", "men", "siz", "qilish", "yashash", "manzili"];
      const englishWords = ["the", "is", "and", "with", "for", "this", "that", "have", "address"];
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
    console.log(`[TRANSLATE] ${sourceLang} → ${targetLang}: "${text.substring(0, 80)}..."`);
    
    if (!text.trim()) {
      return { translatedText: "", sourceLanguage: sourceLang, targetLanguage: targetLang };
    }

    if (sourceLang === targetLang) {
      console.log("[TRANSLATE] Same language, skipping");
      return { translatedText: text, sourceLanguage: sourceLang, targetLanguage: targetLang };
    }

    try {
      const sourceName = this.languageNames[sourceLang] || sourceLang;
      const targetName = this.languageNames[targetLang] || targetLang;

      // Build strong translation prompt
      const prompt = `Переведи текст с ${sourceName} на ${targetName}.

ПРАВИЛА:
1. Переведи ТОЛЬКО содержание, без пояснений
2. Сохрани числа, имена собственные, адреса
3. Естественный перевод, не дословный
4. Верни ТОЛЬКО переведённый текст

ИСХОДНЫЙ ТЕКСТ (${sourceName}):
"""
${text}
"""

ПЕРЕВОД (${targetName}):`;

      const { data, error } = await supabase.functions.invoke("ai-assistant", {
        body: {
          message: prompt,
          language_code: targetLang,
          user_phone: localStorage.getItem("vaxtago_user_phone") || "anonymous",
          intent: "TRANSLATION",
          source_lang: sourceLang,
          target_lang: targetLang
        }
      });

      if (error) {
        console.error("[TRANSLATE] API error:", error);
        throw error;
      }

      let translated = data?.reply || data?.text || data?.message || text;
      
      // Clean up AI response - remove common prefixes
      translated = translated
        .replace(/^(перевод|translation|переведено|перевод:|translation:)\s*/i, "")
        .replace(/^["'`]|["'`]$/g, "")
        .replace(/^[^:]+:\s*/, "") // Remove "Translation:" prefix
        .trim();

      // Remove quotes that AI sometimes adds
      if (translated.startsWith('"') && translated.endsWith('"')) {
        translated = translated.slice(1, -1);
      }

      console.log(`[TRANSLATE] Result: "${translated.substring(0, 80)}..."`);

      return {
        translatedText: translated,
        sourceLanguage: sourceLang,
        targetLanguage: targetLang
      };
    } catch (error) {
      console.error("[TRANSLATE] Failed:", error);
      // Fallback: return original text
      return { translatedText: text, sourceLanguage: sourceLang, targetLanguage: targetLang };
    }
  }
}

export const translationService = new TranslationService();