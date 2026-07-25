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
    ru: "Russian",
    uz: "Uzbek",
    tj: "Tajik",
    en: "English",
    ky: "Kyrgyz",
  };

  detectLanguage(text: string): string {
    if (!text || text.length < 3) return "ru";
    const cyrillicPattern = /[а-яё]/i;
    const latinPattern = /[a-z]/i;

    if (/[ўғқҳ]/i.test(text)) return "uz";
    if (/[ҷ]/i.test(text) && cyrillicPattern.test(text)) return "tj";
    if (/[ңүө]/i.test(text)) return "ky";

    if (cyrillicPattern.test(text) && !latinPattern.test(text)) return "ru";
    if (latinPattern.test(text) && !cyrillicPattern.test(text)) return "en";

    if (/[a-z]/i.test(text)) {
      const words = text.toLowerCase().split(/\s+/);
      const uzbekWords = ["va", "bu", "uchun", "bilan", "qayerda", "qanday", "men", "siz", "qilish", "yashash", "manzili", "kerak"];
      const englishWords = ["the", "is", "and", "with", "for", "this", "that", "have", "address"];
      const uz = words.filter((w) => uzbekWords.includes(w)).length;
      const en = words.filter((w) => englishWords.includes(w)).length;
      if (uz > en) return "uz";
      if (en > 0) return "en";
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
          language_code: targetLang,
          user_phone: localStorage.getItem("vaxtago_user_phone") || "anonymous",
          intent: "TRANSLATION",
          source_lang: sourceLang,
          target_lang: targetLang,
        },
      });

      if (error) {
        console.error("[TRANSLATE] API error:", error);
        throw error;
      }

      let translated =
        data?.reply || data?.text || data?.message || data?.choices?.[0]?.message?.content || text;

      // Strip common AI response prefixes
      translated = String(translated)
        .replace(/^(перевод|translation|переведено|перевод:|translation:|tarjima|ترجمه):\s*/i, "")
        .replace(/^["'`«»'"]|["'`«»'"]$/g, "")
        .trim();

      if (translated.startsWith('"') && translated.endsWith('"')) {
        translated = translated.slice(1, -1);
      }

      console.log(`[TRANSLATE] Result: "${translated.substring(0, 80)}..."`);

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