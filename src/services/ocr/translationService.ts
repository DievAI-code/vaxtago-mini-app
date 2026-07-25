"use client";

import { supabase } from "@/integrations/supabase/client";

export type LanguageCode = "ru" | "uz_lat" | "uz_cyr" | "en" | "auto";

export interface TranslationResult {
  translatedText: string;
  sourceLanguage: string;
  targetLanguage: string;
}

class TranslationService {
  private languageNames: Record<string, string> = {
    ru: "Russian",
    uz_lat: "Uzbek (Latin)",
    uz_cyr: "Uzbek (Cyrillic)",
    en: "English",
  };

  detectLanguage(text: string): string {
    if (!text || text.length < 3) return "ru";
    const cyrillicPattern = /[а-яё]/i;
    const latinPattern = /[a-z]/i;

    // Check for Cyrillic specific Uzbek letters
    if (/[ўғқҳ]/i.test(text)) return "uz_cyr";
    // Check for Latin specific Uzbek letters
    if (/[o'g'shch]/i.test(text) || /['ʻ]/.test(text)) return "uz_lat";

    if (cyrillicPattern.test(text) && !latinPattern.test(text)) return "ru";
    if (latinPattern.test(text) && !cyrillicPattern.test(text)) return "en";

    return "ru";
  }

  async translate(
    text: string,
    sourceLang: string,
    targetLang: LanguageCode
  ): Promise<TranslationResult> {
    if (!text.trim()) {
      return { translatedText: "", sourceLanguage: sourceLang, targetLanguage: targetLang };
    }
    if (sourceLang === targetLang) {
      return { translatedText: text, sourceLanguage: sourceLang, targetLanguage: targetLang };
    }

    try {
      const sourceName = this.languageNames[sourceLang] || sourceLang;
      const targetName = this.languageNames[targetLang] || targetLang;

      const prompt = `Translate the following text from ${sourceName} to ${targetName}.

RULES:
1. Translate ONLY the content, no explanations
2. Preserve numbers, proper names, addresses
3. Natural translation, not literal
4. Return ONLY the translated text

SOURCE TEXT (${sourceName}):
"""
${text}
"""

TRANSLATION (${targetName}):`;

      const { data, error } = await supabase.functions.invoke("ai-assistant", {
        body: {
          message: prompt,
          language_code: targetLang.startsWith("uz") ? "uz" : targetLang,
          user_phone: localStorage.getItem("vaxtago_user_phone") || "anonymous",
          intent: "TRANSLATION",
          source_lang: sourceLang,
          target_lang: targetLang,
        },
      });

      if (error) throw error;

      let translated = data?.reply || data?.text || text;
      translated = String(translated).replace(/^(перевод|translation):\s*/i, "").trim();

      return {
        translatedText: translated,
        sourceLanguage: sourceLang,
        targetLanguage: targetLang,
      };
    } catch (error) {
      console.error("[TRANSLATE] Failed:", error);
      return { translatedText: text, sourceLanguage: sourceLang, targetLanguage: targetLang };
    }
  }
}

export const translationService = new TranslationService();