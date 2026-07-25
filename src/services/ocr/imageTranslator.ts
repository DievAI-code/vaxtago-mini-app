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
  backgroundColor?: string;
}

class ImageTranslator {
  async createTranslatedImage(request: TranslationRequest): Promise<string> {
    const { image, blocks, translations, fontFamily = "Inter, sans-serif" } = request;

    console.log(`[IMAGE TRANSLATOR] Processing ${blocks.length} blocks`);

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
          
          // Draw original image
          ctx.drawImage(img, 0, 0);
          
          console.log(`[IMAGE TRANSLATOR] Image dimensions: ${img.width}x${img.height}`);

          let replacedCount = 0;
          blocks.forEach((block, index) => {
            const translated = translations.get(index);
            if (translated && translated.trim() && translated !== block.text) {
              this.replaceBlock(ctx, img, block, translated, fontFamily);
              replacedCount++;
            }
          });
          
          console.log(`[IMAGE TRANSLATOR] Replaced ${replacedCount}/${blocks.length} blocks`);

          // Convert to data URL with high quality
          resolve(canvas.toDataURL('image/jpeg', 0.92));
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
    const blockWidth = Math.min(originalImage.width - blockX, block.width + padding * 2);
    const blockHeight = Math.min(originalImage.height - blockY, block.height + padding * 2);

    // Calculate adaptive font size
    let fontSize = Math.max(11, Math.min(block.height * 0.65, 22));
    ctx.font = `bold ${fontSize}px ${fontFamily}`;
    
    // Measure text and wrap if needed
    let displayText = translated;
    const maxWidth = blockWidth - 4;
    
    if (ctx.measureText(translated).width > maxWidth) {
      // Try to wrap text
      const words = translated.split(' ');
      const lines: string[] = [];
      let currentLine = '';
      
      for (const word of words) {
        const testLine = currentLine ? `${currentLine} ${word}` : word;
        if (ctx.measureText(testLine).width <= maxWidth) {
          currentLine = testLine;
        } else {
          if (currentLine) lines.push(currentLine);
          currentLine = word;
        }
      }
      if (currentLine) lines.push(currentLine);
      displayText = lines.join('\n');
      
      // Adjust font size for multi-line text
      if (lines.length > 1) {
        fontSize = Math.max(10, fontSize * 0.85);
        ctx.font = `bold ${fontSize}px ${fontFamily}`;
      }
    }

    // Sample background color from surrounding area
    const bgColor = this.sampleBackgroundColor(ctx, originalImage, block);
    
    // Clear the area with background color
    ctx.fillStyle = bgColor;
    ctx.fillRect(blockX, blockY, blockWidth, blockHeight);
    
    // Add subtle border for better readability
    ctx.strokeStyle = bgColor;
    ctx.lineWidth = 1;
    ctx.strokeRect(blockX, blockY, blockWidth, blockHeight);

    // Choose text color based on background brightness
    const textColor = this.chooseTextColor(bgColor);
    ctx.fillStyle = textColor;
    ctx.font = `bold ${fontSize}px ${fontFamily}`;
    ctx.textBaseline = "middle";
    ctx.textAlign = "center";

    // Draw text lines centered
    const lines = displayText.split('\n');
    const lineHeight = fontSize * 1.2;
    const totalHeight = lines.length * lineHeight;
    const centerX = block.x + block.width / 2;
    const startY = block.y + block.height / 2 - totalHeight / 2 + lineHeight / 2;

    lines.forEach((line, i) => {
      const y = startY + i * lineHeight;
      ctx.fillText(line, centerX, y);
    });
  }

  private sampleBackgroundColor(
    ctx: CanvasRenderingContext2D,
    image: HTMLImageElement,
    block: OCRBlock
  ): string {
    try {
      // Sample pixels from above and below the text block
      const samples: { x: number; y: number }[] = [];
      const offset = 5;
      
      // Left and right of block at center height
      for (let dx = 1; dx <= 3; dx++) {
        samples.push({
          x: Math.max(0, block.x - dx * offset),
          y: block.y + block.height / 2
        });
        samples.push({
          x: Math.min(image.width, block.x + block.width + dx * offset),
          y: block.y + block.height / 2
        });
      }
      
      // Above and below block at center width
      samples.push({
        x: block.x + block.width / 2,
        y: Math.max(0, block.y - offset)
      });
      samples.push({
        x: block.x + block.width / 2,
        y: Math.min(image.height, block.y + block.height + offset)
      });

      let r = 0, g = 0, b = 0, count = 0;
      samples.forEach(s => {
        try {
          const pixel = ctx.getImageData(Math.floor(s.x), Math.floor(s.y), 1, 1).data;
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
      if (!match || match.length < 3) return "#000000";
      const [r, g, b] = match.map(Number);
      // Calculate perceived brightness
      const brightness = (r * 299 + g * 587 + b * 114) / 1000;
      return brightness > 140 ? "#1a1a1a" : "#ffffff";
    } catch {
      return "#000000";
    }
  }
}

export const imageTranslator = new ImageTranslator();