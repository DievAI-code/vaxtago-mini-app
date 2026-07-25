"use client";

import { OCRBlock } from "./ocrService";

export interface TextReplacement {
  original: OCRBlock;
  translated: string;
}

export interface ReplacementOptions {
  fontFamily?: string;
  fontSize?: number;
  textColor?: string;
  backgroundColor?: string;
  padding?: number;
}

export const imageReplaceService = {
  async replaceTextOnImage(
    imageBase64: string,
    replacements: TextReplacement[],
    options: ReplacementOptions = {}
  ): Promise<string> {
    const { imageTranslator } = await import("./imageTranslator");
    const blocks = replacements.map((r) => r.original);
    const translations = new Map<number, string>();
    replacements.forEach((r, i) => translations.set(i, r.translated));
    return imageTranslator.createTranslatedImage({
      image: imageBase64,
      blocks,
      translations,
      fontFamily: options.fontFamily,
    });
  },

  async preprocessImage(imageBase64: string): Promise<string> {
    return imageBase64;
  },
};