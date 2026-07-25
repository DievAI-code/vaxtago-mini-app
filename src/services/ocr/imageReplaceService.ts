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

class ImageReplaceService {
  private defaultOptions: ReplacementOptions = {
    fontFamily: "Inter, -apple-system, sans-serif",
    fontSize: 16,
    textColor: "#000000",
    backgroundColor: "#ffffff",
    padding: 4
  };

  async replaceTextOnImage(
    imageBase64: string,
    replacements: TextReplacement[],
    options: ReplacementOptions = {}
  ): Promise<string> {
    const opts = { ...this.defaultOptions, ...options };

    return new Promise((resolve, reject) => {
      const img = new Image();
      img.crossOrigin = "anonymous";
      
      img.onload = () => {
        try {
          const canvas = document.createElement('canvas');
          const ctx = canvas.getContext('2d');
          if (!ctx) {
            reject(new Error("Could not get canvas context"));
            return;
          }

          // Set canvas size to match image
          canvas.width = img.width;
          canvas.height = img.height;

          // Draw original image
          ctx.drawImage(img, 0, 0);

          // Process each replacement
          for (const replacement of replacements) {
            this.replaceBlock(ctx, replacement, opts, canvas);
          }

          // Return new image as base64
          resolve(canvas.toDataURL('image/png', 0.95));
        } catch (error) {
          reject(error);
        }
      };

      img.onerror = () => reject(new Error("Failed to load image"));
      img.src = imageBase64;
    });
  }

  private replaceBlock(
    ctx: CanvasRenderingContext2D,
    replacement: TextReplacement,
    options: ReplacementOptions,
    canvas: HTMLCanvasElement
  ) {
    const { original, translated } = replacement;
    const { fontFamily, fontSize, textColor, padding } = options;

    // Calculate adaptive font size based on block height
    const adaptiveFontSize = Math.max(10, Math.min(original.height * 0.6, fontSize || 16));

    // Measure text
    ctx.font = `${adaptiveFontSize}px ${fontFamily}`;
    const metrics = ctx.measureText(translated);
    const textWidth = metrics.width;
    const textHeight = adaptiveFontSize;

    // Calculate position to center text in block
    const x = original.x + (original.width - textWidth) / 2;
    const y = original.y + (original.height + textHeight) / 2 - metrics.actualBoundingBoxDescent;

    // Clear original text area with inpainting-like effect
    this.clearTextArea(ctx, original, canvas);

    // Draw background for text
    ctx.fillStyle = this.sampleBackgroundColor(ctx, original) || "#ffffff";
    ctx.fillRect(
      original.x - padding!,
      original.y - padding!,
      original.width + padding! * 2,
      original.height + padding! * 2
    );

    // Draw translated text
    ctx.fillStyle = textColor!;
    ctx.font = `${adaptiveFontSize}px ${fontFamily}`;
    ctx.textBaseline = "alphabetic";
    
    // Handle text wrapping if too long
    if (textWidth > original.width * 1.2) {
      this.drawWrappedText(ctx, translated, original, adaptiveFontSize, textColor!);
    } else {
      ctx.fillText(translated, Math.max(0, x), y);
    }
  }

  private clearTextArea(
    ctx: CanvasRenderingContext2D,
    block: OCRBlock,
    canvas: HTMLCanvasElement
  ) {
    // Get surrounding pixels for background reconstruction
    const imageData = ctx.getImageData(
      Math.max(0, block.x - 5),
      Math.max(0, block.y - 5),
      Math.min(canvas.width - block.x + 10, block.width + 10),
      Math.min(canvas.height - block.y + 10, block.height + 10)
    );

    // Simple inpainting: blur the area
    ctx.filter = 'blur(2px)';
    ctx.drawImage(
      canvas,
      block.x,
      block.y,
      block.width,
      block.height,
      block.x,
      block.y,
      block.width,
      block.height
    );
    ctx.filter = 'none';
  }

  private sampleBackgroundColor(
    ctx: CanvasRenderingContext2D,
    block: OCRBlock
  ): string | null {
    try {
      // Sample pixels around the text block
      const samples = [
        { x: Math.max(0, block.x - 2), y: block.y + block.height / 2 },
        { x: block.x + block.width + 2, y: block.y + block.height / 2 },
        { x: block.x + block.width / 2, y: Math.max(0, block.y - 2) },
        { x: block.x + block.width / 2, y: block.y + block.height + 2 }
      ];

      let r = 0, g = 0, b = 0, count = 0;

      for (const sample of samples) {
        const pixel = ctx.getImageData(sample.x, sample.y, 1, 1).data;
        r += pixel[0];
        g += pixel[1];
        b += pixel[2];
        count++;
      }

      return `rgb(${Math.round(r / count)}, ${Math.round(g / count)}, ${Math.round(b / count)})`;
    } catch {
      return null;
    }
  }

  private drawWrappedText(
    ctx: CanvasRenderingContext2D,
    text: string,
    block: OCRBlock,
    fontSize: number,
    color: string
  ) {
    const words = text.split(' ');
    const lineHeight = fontSize * 1.2;
    const maxWidth = block.width * 1.1;
    
    let line = '';
    let y = block.y + fontSize;

    ctx.fillStyle = color;

    for (const word of words) {
      const testLine = line + word + ' ';
      const metrics = ctx.measureText(testLine);
      
      if (metrics.width > maxWidth && line !== '') {
        ctx.fillText(line.trim(), block.x, y);
        line = word + ' ';
        y += lineHeight;
        
        // Stop if we're exceeding block height
        if (y > block.y + block.height) break;
      } else {
        line = testLine;
      }
    }
    
    ctx.fillText(line.trim(), block.x, y);
  }

  // Preprocess image for better OCR
  async preprocessImage(imageBase64: string): Promise<string> {
    return new Promise((resolve, reject) => {
      const img = new Image();
      img.onload = () => {
        const canvas = document.createElement('canvas');
        const ctx = canvas.getContext('2d');
        if (!ctx) {
          resolve(imageBase64);
          return;
        }

        canvas.width = img.width;
        canvas.height = img.height;

        // Enhance contrast
        ctx.filter = 'contrast(1.1)';
        ctx.drawImage(img, 0, 0);
        ctx.filter = 'none';

        resolve(canvas.toDataURL('image/jpeg', 0.9));
      };
      img.onerror = () => resolve(imageBase64);
      img.src = imageBase64;
    });
  }
}

export const imageReplaceService = new ImageReplaceService();