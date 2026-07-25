"use client";

import { OCRBlock } from "./ocrService";

export interface TextReplacement {
  original: OCRBlock;
  translated: string;
}

export interface TranslationRequest {
  image: string;
  blocks: OCRBlock[];
  translations: Map<number, string>;
  fontFamily?: string;
}

class ImageTranslator {
  /**
   * Renders translated text directly onto the original image, replacing
   * each source block with the corresponding translation.
   * Returns a JPEG data URL of the new image.
   */
  async createTranslatedImage(request: TranslationRequest): Promise<string> {
    const { image, blocks, translations, fontFamily = "Inter, Arial, sans-serif" } = request;

    console.log(`[IMAGE TRANSLATOR] Processing ${blocks.length} blocks`);

    return new Promise((resolve, reject) => {
      const img = new Image();
      img.crossOrigin = "anonymous";

      img.onload = () => {
        try {
          const canvas = document.createElement("canvas");
          const ctx = canvas.getContext("2d");
          if (!ctx) {
            reject(new Error("Canvas context unavailable"));
            return;
          }

          canvas.width = img.width;
          canvas.height = img.height;

          // Draw the original image as the base
          ctx.drawImage(img, 0, 0);
          console.log(`[IMAGE TRANSLATOR] Base image drawn: ${img.width}x${img.height}`);

          let replacedCount = 0;
          blocks.forEach((block, index) => {
            const translated = translations.get(index);
            if (translated && translated.trim() && translated !== block.text) {
              this.replaceBlock(ctx, img, block, translated, fontFamily);
              replacedCount++;
            }
          });

          console.log(`[IMAGE TRANSLATOR] Replaced ${replacedCount}/${blocks.length} blocks`);

          resolve(canvas.toDataURL("image/jpeg", 0.92));
        } catch (error) {
          console.error("[IMAGE TRANSLATOR] Error:", error);
          reject(error);
        }
      };

      img.onerror = () => {
        console.error("[IMAGE TRANSLATOR] Failed to load image");
        reject(new Error("Failed to load image"));
      };
      img.src = image;
    });
  }

  private replaceBlock(
    ctx: CanvasRenderingContext2D,
    originalImage: HTMLImageElement,
    block: OCRBlock,
    translated: string,
    fontFamily: string
  ) {
    const padding = 6;
    const blockX = Math.max(0, block.x - padding);
    const blockY = Math.max(0, block.y - padding);
    const blockWidth = Math.min(
      originalImage.width - blockX,
      block.width + padding * 2
    );
    const blockHeight = Math.min(
      originalImage.height - blockY,
      block.height + padding * 2
    );

    // 1. Sample the original background color of this area
    const bgColor = this.sampleBackgroundColor(ctx, originalImage, block);

    // 2. Erase the original text by drawing a filled rectangle in bg color
    ctx.fillStyle = bgColor;
    ctx.fillRect(blockX, blockY, blockWidth, blockHeight);

    // 3. Pick a text color that contrasts with the background
    const textColor = this.chooseTextColor(bgColor);

    // 4. Auto-fit font size and wrap text
    let fontSize = Math.max(11, Math.min(blockHeight * 0.7, 24));
    ctx.fillStyle = textColor;
    ctx.font = `600 ${fontSize}px ${fontFamily}`;
    ctx.textBaseline = "middle";
    ctx.textAlign = "center";

    const maxWidth = blockWidth - 6;
    const lines = this.wrapText(ctx, translated, maxWidth);

    // Shrink font if it still doesn't fit
    while (lines.length * fontSize * 1.2 > blockHeight && fontSize > 9) {
      fontSize -= 1;
      ctx.font = `600 ${fontSize}px ${fontFamily}`;
      const rewrapped = this.wrapText(ctx, translated, maxWidth);
      if (rewrapped.length * fontSize * 1.2 <= blockHeight) {
        break;
      }
    }

    // 5. Draw the wrapped translation centered in the block
    const lineHeight = fontSize * 1.15;
    const totalHeight = lines.length * lineHeight;
    const centerX = block.x + block.width / 2;
    const startY = block.y + block.height / 2 - totalHeight / 2 + lineHeight / 2;

    lines.forEach((line, i) => {
      ctx.fillText(line, centerX, startY + i * lineHeight);
    });
  }

  /**
   * Wraps text to fit within maxWidth. Returns array of lines.
   */
  private wrapText(
    ctx: CanvasRenderingContext2D,
    text: string,
    maxWidth: number
  ): string[] {
    const words = text.split(/\s+/);
    const lines: string[] = [];
    let current = "";

    for (const word of words) {
      const candidate = current ? current + " " + word : word;
      if (ctx.measureText(candidate).width <= maxWidth) {
        current = candidate;
      } else {
        if (current) lines.push(current);
        // If a single word is longer than maxWidth, split it by characters
        if (ctx.measureText(word).width > maxWidth) {
          let chunk = "";
          for (const ch of word) {
            if (ctx.measureText(chunk + ch).width <= maxWidth) {
              chunk += ch;
            } else {
              if (chunk) lines.push(chunk);
              chunk = ch;
            }
          }
          current = chunk;
        } else {
          current = word;
        }
      }
    }
    if (current) lines.push(current);
    return lines.length ? lines : [text];
  }

  /**
   * Sample background color by averaging pixels around the text block
   * (above, below, left, right of the block).
   */
  private sampleBackgroundColor(
    ctx: CanvasRenderingContext2D,
    image: HTMLImageElement,
    block: OCRBlock
  ): string {
    try {
      const samples: { x: number; y: number }[] = [];
      const offset = 4;

      // Left of block
      samples.push({ x: Math.max(0, block.x - offset), y: block.y + block.height / 2 });
      // Right of block
      samples.push({
        x: Math.min(image.width - 1, block.x + block.width + offset),
        y: block.y + block.height / 2,
      });
      // Above block
      samples.push({
        x: block.x + block.width / 2,
        y: Math.max(0, block.y - offset),
      });
      // Below block
      samples.push({
        x: block.x + block.width / 2,
        y: Math.min(image.height - 1, block.y + block.height + offset),
      });

      let r = 0, g = 0, b = 0, count = 0;
      samples.forEach((s) => {
        try {
          const pixel = ctx.getImageData(Math.floor(s.x), Math.floor(s.y), 1, 1).data;
          r += pixel[0]; g += pixel[1]; b += pixel[2]; count++;
        } catch {}
      });

      if (count === 0) return "#ffffff";
      return `rgb(${Math.round(r / count)}, ${Math.round(g / count)}, ${Math.round(b / count)})`;
    } catch {
      return "#ffffff";
    }
  }

  private chooseTextColor(bgColor: string): string {
    try {
      const match = bgColor.match(/\d+/g);
      if (!match || match.length < 3) return "#000000";
      const [r, g, b] = match.map(Number);
      const brightness = (r * 299 + g * 587 + b * 114) / 1000;
      return brightness > 140 ? "#1a1a1a" : "#ffffff";
    } catch {
      return "#000000";
    }
  }
}

export const imageTranslator = new ImageTranslator();