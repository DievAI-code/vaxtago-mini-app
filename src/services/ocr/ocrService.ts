"use client";

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
    try {
      const { data, error } = await supabase.functions.invoke("vision-assistant", {
        body: {
          image: imageBase64,
          request_type: "ocr_detect",
          instruction: "Распознай весь текст на изображении. Верни результат в формате JSON с полями: fullText (string), language (string), blocks (array of {text, x, y, width, height, confidence}). Координаты в пикселях относительно размера изображения."
        }
      });

      if (error) throw error;

      let result: OCRResult;
      try {
        const parsed = typeof data.result === 'string' ? JSON.parse(data.result) : data.result;
        result = {
          text: parsed.fullText || parsed.text || data.ocr_text || "",
          blocks: parsed.blocks || this.estimateBlocks(parsed.fullText || data.ocr_text || ""),
          language: parsed.language || data.language || "ru"
        };
      } catch {
        result = {
          text: data.ocr_text || data.text || "",
          blocks: this.estimateBlocks(data.ocr_text || data.text || ""),
          language: data.language || "ru"
        };
      }

      return result;
    } catch (error) {
      console.error("[OCR] Recognition failed:", error);
      throw error;
    }
  }

  private estimateBlocks(text: string): OCRBlock[] {
    const lines = text.split('\n').filter(l => l.trim());
    const blocks: OCRBlock[] = [];
    let y = 50;
    
    for (const line of lines) {
      const words = line.split(' ');
      let x = 50;
      
      for (const word of words) {
        const width = word.length * 12 + 10;
        blocks.push({
          text: word,
          x,
          y,
          width,
          height: 30,
          confidence: 0.8
        });
        x += width + 5;
      }
      y += 40;
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

    const imageData = ctx.getImageData(0, 0, canvas.width, canvas.height);
    return this.analyzeImageData(imageData);
  }

  private analyzeImageData(imageData: ImageData): OCRBlock[] {
    const { width, height, data } = imageData;
    const regions: OCRBlock[] = [];
    const blockSize = 20;

    for (let y = 0; y < height; y += blockSize) {
      for (let x = 0; x < width; x += blockSize) {
        let variance = 0;
        let avgBrightness = 0;
        let count = 0;

        for (let dy = 0; dy < blockSize && y + dy < height; dy++) {
          for (let dx = 0; dx < blockSize && x + dx < width; dx++) {
            const i = ((y + dy) * width + (x + dx)) * 4;
            const brightness = (data[i] + data[i + 1] + data[i + 2]) / 3;
            avgBrightness += brightness;
            count++;
          }
        }

        avgBrightness /= count;

        if (variance > 30) {
          regions.push({
            text: "",
            x, y,
            width: blockSize,
            height: blockSize,
            confidence: 0.5
          });
        }
      }
    }

    return this.mergeNearbyRegions(regions);
  }

  private mergeNearbyRegions(regions: OCRBlock[]): OCRBlock[] {
    if (regions.length === 0) return [];
    const merged: OCRBlock[] = [];
    const threshold = 30;

    for (const region of regions) {
      let mergedWithExisting = false;
      for (const existing of merged) {
        const dx = Math.abs(region.x - existing.x);
        const dy = Math.abs(region.y - existing.y);
        if (dx < threshold && dy < threshold) {
          existing.x = Math.min(existing.x, region.x);
          existing.y = Math.min(existing.y, region.y);
          existing.width = Math.max(existing.x + existing.width, region.x + region.width) - existing.x;
          existing.height = Math.max(existing.y + existing.height, region.y + region.height) - existing.y;
          mergedWithExisting = true;
          break;
        }
      }
      if (!mergedWithExisting) merged.push({ ...region });
    }
    return merged;
  }
}

import { supabase } from "@/integrations/supabase/client";
export const ocrService = new OCRService();