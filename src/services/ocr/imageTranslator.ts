"use client";

import { OCRBlock } from "./ocrService";

export type TranslationMode = "preserve_design" | "clean_translation";

export interface TranslationRequest {
  image: string;
  blocks: OCRBlock[];
  translations: Map<number, string>;
  fontFamily?: string;
  mode: TranslationMode;
}

class ImageTranslator {
  async createTranslatedImage(request: TranslationRequest): Promise<string> {
    const { image, blocks, translations, fontFamily = "Inter, Arial, sans-serif", mode } = request;

    console.log(`[IMAGE TRANSLATOR] Processing ${blocks.length} blocks in ${mode} mode`);

    return new Promise((resolve, reject) => {
      const img = new Image();
      img.crossOrigin = "anonymous";

      img.onload = () => {
        try {
          if (mode === "clean_translation") {
            resolve(this.createCleanDocument(img, blocks, translations, fontFamily));
          } else {
            resolve(this.createPreserveDesignImage(img, blocks, translations, fontFamily));
          }
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

  private createPreserveDesignImage(
    img: HTMLImageElement,
    blocks: OCRBlock[],
    translations: Map<number, string>,
    fontFamily: string
  ): string {
    const canvas = document.createElement("canvas");
    const ctx = canvas.getContext("2d");
    if (!ctx) throw new Error("Canvas context unavailable");

    canvas.width = img.width;
    canvas.height = img.height;

    // Draw original image
    ctx.drawImage(img, 0, 0);

    blocks.forEach((block, index) => {
      const translated = translations.get(index);
      if (!translated || !translated.trim()) return;

      // 1. Erase original text
      ctx.fillStyle = block.backgroundColor || this.sampleBackgroundColor(ctx, img, block);
      ctx.fillRect(block.x, block.y, block.width, block.height);

      // 2. Setup text style
      const textColor = block.color || this.chooseTextColor(block.backgroundColor || "#FFFFFF");
      ctx.fillStyle = textColor;
      ctx.textBaseline = "middle";
      
      // 3. Auto-fit font size
      let fontSize = block.fontSize || Math.max(11, Math.min(block.height * 0.7, 24));
      ctx.font = `600 ${fontSize}px ${fontFamily}`;
      
      const maxWidth = block.width - 8;
      let lines = this.wrapText(ctx, translated, maxWidth);

      // Shrink font if text doesn't fit vertically
      while (lines.length * fontSize * 1.2 > block.height && fontSize > 9) {
        fontSize -= 1;
        ctx.font = `600 ${fontSize}px ${fontFamily}`;
        lines = this.wrapText(ctx, translated, maxWidth);
      }

      // 4. Draw translated text
      const lineHeight = fontSize * 1.15;
      const totalHeight = lines.length * lineHeight;
      
      // Alignment
      if (block.textAlign === "center") {
        ctx.textAlign = "center";
      } else if (block.textAlign === "right") {
        ctx.textAlign = "right";
      } else {
        ctx.textAlign = "left";
      }

      const startX = block.textAlign === "center" ? block.x + block.width / 2 
                   : block.textAlign === "right" ? block.x + block.width - 4 
                   : block.x + 4;
                   
      const startY = block.y + block.height / 2 - totalHeight / 2 + lineHeight / 2;

      lines.forEach((line, i) => {
        ctx.fillText(line, startX, startY + i * lineHeight);
      });
    });

    return canvas.toDataURL("image/jpeg", 0.92);
  }

  private createCleanDocument(
    img: HTMLImageElement,
    blocks: OCRBlock[],
    translations: Map<number, string>,
    fontFamily: string
  ): string {
    const canvas = document.createElement("canvas");
    const ctx = canvas.getContext("2d");
    if (!ctx) throw new Error("Canvas context unavailable");

    // A4-ish ratio
    canvas.width = 800;
    canvas.height = 1200;

    // White background
    ctx.fillStyle = "#FFFFFF";
    ctx.fillRect(0, 0, canvas.width, canvas.height);

    // Draw original image at top
    const imgRatio = img.width / img.height;
    const maxImgWidth = canvas.width - 80;
    const imgDrawWidth = maxImgWidth;
    const imgDrawHeight = imgDrawWidth / imgRatio;
    
    ctx.drawImage(img, 40, 40, imgDrawWidth, imgDrawHeight);

    // Separator
    const sepY = 40 + imgDrawHeight + 20;
    ctx.strokeStyle = "#E5E7EB";
    ctx.lineWidth = 2;
    ctx.beginPath();
    ctx.moveTo(40, sepY);
    ctx.lineTo(canvas.width - 40, sepY);
    ctx.stroke();

    // Draw text blocks
    let currentY = sepY + 30;
    ctx.textAlign = "left";
    ctx.textBaseline = "top";

    blocks.forEach((block, index) => {
      const translated = translations.get(index);
      if (!translated || !translated.trim()) return;

      // Original text (gray, small)
      ctx.fillStyle = "#9CA3AF";
      ctx.font = `400 14px ${fontFamily}`;
      const origLines = this.wrapText(ctx, block.text, canvas.width - 80);
      origLines.forEach(line => {
        if (currentY < canvas.height - 40) {
          ctx.fillText(line, 40, currentY);
          currentY += 18;
        }
      });

      // Translated text (black, bold, larger)
      ctx.fillStyle = "#111827";
      ctx.font = `600 18px ${fontFamily}`;
      const transLines = this.wrapText(ctx, translated, canvas.width - 80);
      transLines.forEach(line => {
        if (currentY < canvas.height - 40) {
          ctx.fillText(line, 40, currentY);
          currentY += 24;
        }
      });

      currentY += 10; // Space between blocks
    });

    return canvas.toDataURL("image/jpeg", 0.92);
  }

  private wrapText(ctx: CanvasRenderingContext2D, text: string, maxWidth: number): string[] {
    const words = text.split(/\s+/);
    const lines: string[] = [];
    let current = "";

    for (const word of words) {
      const candidate = current ? current + " " + word : word;
      if (ctx.measureText(candidate).width <= maxWidth) {
        current = candidate;
      } else {
        if (current) lines.push(current);
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

  private sampleBackgroundColor(
    ctx: CanvasRenderingContext2D,
    image: HTMLImageElement,
    block: OCRBlock
  ): string {
    try {
      const samples: { x: number; y: number }[] = [];
      const offset = 4;

      samples.push({ x: Math.max(0, block.x - offset), y: block.y + block.height / 2 });
      samples.push({ x: Math.min(image.width - 1, block.x + block.width + offset), y: block.y + block.height / 2 });
      samples.push({ x: block.x + block.width / 2, y: Math.max(0, block.y - offset) });
      samples.push({ x: block.x + block.width / 2, y: Math.min(image.height - 1, block.y + block.height + offset) });

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