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
  textColor?: string;
}

class ImageTranslator {
  async createTranslatedImage(request: TranslationRequest): Promise<string> {
    const { image, blocks, translations, fontFamily = "Inter, sans-serif" } = request;

    return new Promise((resolve, reject) => {
      const img = new Image();
      img.crossOrigin = "anonymous";
      
      img.onload = () => {
        try {
          const canvas = document.createElement('canvas');
          const ctx = canvas.getContext('2d');
          if (!ctx) {
            reject(new Error("Canvas context unavailable"));
            return;
          }

          canvas.width = img.width;
          canvas.height = img.height;
          ctx.drawImage(img, 0, 0);

          blocks.forEach((block, index) => {
            const translated = translations.get(index) || block.text;
            if (translated && translated !== block.text) {
              this.replaceBlock(ctx, img, block, translated, fontFamily);
            }
          });

          resolve(canvas.toDataURL('image/jpeg', 0.92));
        } catch (error) {
          reject(error);
        }
      };

      img.onerror = () => reject(new Error("Failed to load image"));
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
    const padding = 4;
    const blockWidth = block.width + padding * 2;
    const blockHeight = block.height + padding * 2;

    const fontSize = Math.max(11, Math.min(block.height * 0.7, 18));
    ctx.font = `bold ${fontSize}px ${fontFamily}`;
    
    const metrics = ctx.measureText(translated);
    let displayText = translated;
    let textWidth = metrics.width;

    if (textWidth > blockWidth) {
      const words = translated.split(' ');
      const lines: string[] = [];
      let currentLine = '';
      
      for (const word of words) {
        const testLine = currentLine ? `${currentLine} ${word}` : word;
        if (ctx.measureText(testLine).width <= blockWidth) {
          currentLine = testLine;
        } else {
          if (currentLine) lines.push(currentLine);
          currentLine = word;
        }
      }
      if (currentLine) lines.push(currentLine);
      displayText = lines.join('\n');
      textWidth = Math.max(...lines.map(l => ctx.measureText(l).width));
    }

    this.clearArea(ctx, block);

    const bgColor = this.sampleBackgroundColor(ctx, originalImage, block);
    ctx.fillStyle = bgColor;
    ctx.fillRect(
      Math.max(0, block.x - padding),
      Math.max(0, block.y - padding),
      blockWidth,
      blockHeight
    );

    ctx.fillStyle = this.chooseTextColor(bgColor);
    ctx.font = `bold ${fontSize}px ${fontFamily}`;
    ctx.textBaseline = "top";
    
    const lines = displayText.split('\n');
    const lineHeight = fontSize * 1.15;
    const totalHeight = lines.length * lineHeight;
    const startY = block.y + (block.height - totalHeight) / 2;

    lines.forEach((line, i) => {
      const lineMetrics = ctx.measureText(line);
      const x = block.x + (block.width - lineMetrics.width) / 2;
      ctx.fillText(line, x, startY + i * lineHeight);
    });
  }

  private clearArea(ctx: CanvasRenderingContext2D, block: OCRBlock) {
    const tempCanvas = document.createElement('canvas');
    const tempCtx = tempCanvas.getContext('2d');
    if (!tempCtx) return;

    tempCanvas.width = ctx.canvas.width;
    tempCanvas.height = ctx.canvas.height;
    tempCtx.drawImage(ctx.canvas, 0, 0);

    const padding = 8;
    const sx = Math.max(0, block.x - padding);
    const sy = Math.max(0, block.y - padding);
    const sw = block.width + padding * 2;
    const sh = block.height + padding * 2;

    const samples = [
      { x: sx, y: sy },
      { x: sx + sw, y: sy },
      { x: sx, y: sy + sh },
      { x: sx + sw, y: sy + sh }
    ];

    let r = 0, g = 0, b = 0;
    samples.forEach(s => {
      try {
        const pixel = ctx.getImageData(s.x, s.y, 1, 1).data;
        r += pixel[0];
        g += pixel[1];
        b += pixel[2];
      } catch {}
    });
    r = Math.round(r / samples.length);
    g = Math.round(g / samples.length);
    b = Math.round(b / samples.length);

    ctx.fillStyle = `rgb(${r}, ${g}, ${b})`;
    ctx.fillRect(sx, sy, sw, sh);
  }

  private sampleBackgroundColor(
    ctx: CanvasRenderingContext2D,
    image: HTMLImageElement,
    block: OCRBlock
  ): string {
    try {
      const samples: { x: number; y: number }[] = [];
      const padding = 3;
      
      for (let i = 0; i < 5; i++) {
        samples.push({
          x: Math.max(0, block.x - padding * (i + 1)),
          y: block.y + block.height / 2
        });
        samples.push({
          x: Math.min(image.width, block.x + block.width + padding * (i + 1)),
          y: block.y + block.height / 2
        });
      }

      let r = 0, g = 0, b = 0, count = 0;
      samples.forEach(s => {
        try {
          const pixel = ctx.getImageData(s.x, s.y, 1, 1).data;
          r += pixel[0];
          g += pixel[1];
          b += pixel[2];
          count++;
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
      if (!match) return "#000000";
      const [r, g, b] = match.map(Number);
      const brightness = (r * 299 + g * 587 + b * 114) / 1000;
      return brightness > 128 ? "#1a1a1a" : "#ffffff";
    } catch {
      return "#000000";
    }
  }
}

export const imageTranslator = new ImageTranslator();