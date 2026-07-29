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

const INFLATE_X = 4;
const INFLATE_Y = 3;
const MIN_FONT = 8;
const MAX_FONT = 200;

/**
 * Перевод RGB → HSL. h ∈ [0,360), s,l ∈ [0,100].
 */
function rgbToHsl(r: number, g: number, b: number): [number, number, number] {
  r /= 255; g /= 255; b /= 255;
  const max = Math.max(r, g, b), min = Math.min(r, g, b);
  const l = (max + min) / 2;
  let h = 0, s = 0;
  if (max !== min) {
    const d = max - min;
    s = l > 0.5 ? d / (2 - max - min) : d / (max + min);
    switch (max) {
      case r: h = (g - b) / d + (g < b ? 6 : 0); break;
      case g: h = (b - r) / d + 2; break;
      default: h = (r - g) / d + 4;
    }
    h *= 60;
  }
  return [h, s * 100, l * 100];
}

/**
 * Парсит цвет из HEX или rgb(r,g,b) → [r,g,b].
 */
function parseColor(c: string | undefined): [number, number, number] | null {
  if (!c) return null;
  if (c.startsWith("#")) {
    const hex = c.slice(1);
    if (hex.length === 3) {
      return [parseInt(hex[0] + hex[0], 16), parseInt(hex[1] + hex[1], 16), parseInt(hex[2] + hex[2], 16)];
    }
    if (hex.length === 6) {
      return [parseInt(hex.slice(0, 2), 16), parseInt(hex.slice(2, 4), 16), parseInt(hex.slice(4, 6), 16)];
    }
    return null;
  }
  const m = c.match(/rgb\s*\(\s*(\d+)\s*,\s*(\d+)\s*,\s*(\d+)\s*\)/i);
  if (m) return [Number(m[1]), Number(m[2]), Number(m[3])];
  return null;
}

class ImageTranslator {
  async createTranslatedImage(request: TranslationRequest): Promise<string> {
    const { image, blocks, translations, fontFamily = "Inter, Arial, sans-serif", mode } = request;

    console.log(`[IMAGE TRANSLATOR v2] ${blocks.length} blocks, mode=${mode}`);

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
        } catch (e) {
          console.error("[IMAGE TRANSLATOR v2] Error:", e);
          reject(e);
        }
      };
      img.onerror = () => reject(new Error("Failed to load image"));
      img.src = image;
    });
  }

  // ──────────────────────────────────────────────────────────────────
  // Режим "Дизайн": полная замена текста на месте оригинала
  // ──────────────────────────────────────────────────────────────────
  private createPreserveDesignImage(
    img: HTMLImageElement,
    blocks: OCRBlock[],
    translations: Map<number, string>,
    fontFamily: string
  ): string {
    const canvas = document.createElement("canvas");
    const ctx = canvas.getContext("2d", { willReadFrequently: true });
    if (!ctx) throw new Error("Canvas context unavailable");

    // Высокое разрешение — рисуем в нативном размере оригинала
    canvas.width = img.width;
    canvas.height = img.height;
    ctx.drawImage(img, 0, 0);

    const w = img.width;
    const h = img.height;

    // ── ЭТАП 1–2: для каждого блока анализируем цвета и стираем оригинал ──
    const prepared = blocks.map((block, index) => {
      const translated = translations.get(index);
      if (!translated || !translated.trim()) return null;

      const bx = Math.max(0, Math.round(block.x - INFLATE_X));
      const by = Math.max(0, Math.round(block.y - INFLATE_Y));
      const bw = Math.min(w - bx, Math.round(block.width + INFLATE_X * 2));
      const bh = Math.min(h - by, Math.round(block.height + INFLATE_Y * 2));
      if (bw < 4 || bh < 4) return null;

      let imageData: ImageData | null = null;
      try {
        imageData = ctx.getImageData(bx, by, bw, bh);
      } catch {
        imageData = null;
      }

      // Определяем цвета фона и текста из пикселей блока (с фолбэком на OCR)
      const { bg, fg } = this.analyzeBlockColors(imageData, block);

      return {
        translated,
        block,
        bx, by, bw, bh,
        bg,
        fg,
        angle: block.angle || 0,
        textAlign: block.textAlign || "left",
        baseFont: block.fontSize || Math.max(10, Math.min(block.height * 0.72, 60)),
      };
    }).filter(Boolean) as Array<{
      translated: string; block: OCRBlock;
      bx: number; by: number; bw: number; bh: number;
      bg: [number, number, number]; fg: [number, number, number];
      angle: number; textAlign: "left" | "center" | "right"; baseFont: number;
    }>;

    // ── ЭТАП 3: inpainting (удаление оригинального текста) ──
    for (const p of prepared) {
      this.inpaintBlock(ctx, p.bx, p.by, p.bw, p.bh, p.bg, p.fg, w, h);
    }

    // ── ЭТАП 4: отрисовка перевода с автоподбором шрифта ──
    for (const p of prepared) {
      this.renderTranslatedBlock(ctx, p, fontFamily);
    }

    return canvas.toDataURL("image/jpeg", 0.95);
  }

  /**
   * Анализирует пиксели блока и определяет цвет фона и текста.
   * Логика: разбиваем на две группы по яркости; та, что занимает
   * большую площадь, — фон, меньшая — текст.
   */
  private analyzeBlockColors(
    imageData: ImageData | null,
    block: OCRBlock
  ): { bg: [number, number, number]; fg: [number, number, number] } {
    const fallbackBg = parseColor(block.backgroundColor) || [255, 255, 255] as [number, number, number];
    const fallbackFg = parseColor(block.color) || [20, 20, 20] as [number, number, number];

    if (!imageData) return { bg: fallbackBg, fg: fallbackFg };

    const d = imageData.data;
    const luminances: number[] = [];
    const n = d.length / 4;
    for (let i = 0; i < n; i++) {
      const r = d[i * 4], g = d[i * 4 + 1], b = d[i * 4 + 2];
      luminances.push((r * 299 + g * 587 + b * 114) / 1000);
    }
    luminances.sort((a, b) => a - b);
    const median = luminances[Math.floor(n / 2)];

    let bgR = 0, bgG = 0, bgB = 0, bgN = 0;
    let fgR = 0, fgG = 0, fgB = 0, fgN = 0;
    for (let i = 0; i < n; i++) {
      const r = d[i * 4], g = d[i * 4 + 1], b = d[i * 4 + 2];
      const lum = (r * 299 + g * 587 + b * 114) / 1000;
      if (lum >= median) {
        bgR += r; bgG += g; bgB += b; bgN++;
      } else {
        fgR += r; fgG += g; fgB += b; fgN++;
      }
    }
    if (bgN === 0 || fgN === 0) return { bg: fallbackBg, fg: fallbackFg };

    // Большая группа = фон
    const light = [
      Math.round(bgR / bgN), Math.round(bgG / bgN), Math.round(bgB / bgN),
    ] as [number, number, number];
    const dark = [
      Math.round(fgR / fgN), Math.round(fgG / fgN), Math.round(fgB / fgN),
    ] as [number, number, number];

    if (bgN >= fgN) {
      return { bg: light, fg: dark };
    }
    return { bg: dark, fg: light };
  }

  /**
   * Простое inpainting: заменяем пиксели, похожие на цвет текста,
   * цветом фона. Пиксели фона не трогаем — так текстура сохраняется.
   */
  private inpaintBlock(
    ctx: CanvasRenderingContext2D,
    bx: number, by: number, bw: number, bh: number,
    bg: [number, number, number],
    fg: [number, number, number],
    imgW: number, imgH: number
  ): void {
    let imageData: ImageData;
    try {
      imageData = ctx.getImageData(bx, by, bw, bh);
    } catch {
      // Если пиксельный доступ недоступен — просто заливаем блок цветом фона
      ctx.fillStyle = `rgb(${bg[0]},${bg[1]},${bg[2]})`;
      ctx.fillRect(bx, by, bw, bh);
      return;
    }

    const d = imageData.data;
    const n = d.length / 4;

    // Порог близости к цвету текста (евклидово расстояние)
    const fgDist = (r: number, g: number, b: number) =>
      Math.sqrt((r - fg[0]) ** 2 + (g - fg[1]) ** 2 + (b - fg[2]) ** 2);
    const bgDist = (r: number, g: number, b: number) =>
      Math.sqrt((r - bg[0]) ** 2 + (g - bg[1]) ** 2 + (b - bg[2]) ** 2);

    const THRESHOLD = 120;

    for (let i = 0; i < n; i++) {
      const r = d[i * 4], g = d[i * 4 + 1], b = d[i * 4 + 2];
      const dFg = fgDist(r, g, b);
      const dBg = bgDist(r, g, b);
      // Пиксель "текстовый" — заменяем на фон
      if (dFg < dBg && dFg < THRESHOLD) {
        d[i * 4] = bg[0];
        d[i * 4 + 1] = bg[1];
        d[i * 4 + 2] = bg[2];
        d[i * 4 + 3] = 255;
      }
    }

    ctx.putImageData(imageData, bx, by);
  }

  /**
   * Отрисовка перевода: автоподбор шрифта, перенос строк, выравнивание, угол.
   */
  private renderTranslatedBlock(
    ctx: CanvasRenderingContext2D,
    p: {
      translated: string; block: OCRBlock;
      bx: number; by: number; bw: number; bh: number;
      bg: [number, number, number]; fg: [number, number, number];
      angle: number; textAlign: "left" | "center" | "right"; baseFont: number;
    },
    fontFamily: string
  ): void {
    ctx.save();

    // Угол наклона (в радианах), вращаем вокруг центра блока
    if (p.angle) {
      const cx = p.block.x + p.block.width / 2;
      const cy = p.block.y + p.block.height / 2;
      ctx.translate(cx, cy);
      ctx.rotate((p.angle * Math.PI) / 180);
      ctx.translate(-cx, -cy);
    }

    ctx.fillStyle = `rgb(${p.fg[0]},${p.fg[1]},${p.fg[2]})`;
    ctx.textBaseline = "middle";

    const padX = 5;
    const maxWidth = p.block.width - padX * 2;
    const maxHeight = p.block.height - 2;

    // Автоподбор шрифта: уменьшаем, пока текст не влезет в блок
    let fontSize = Math.max(MIN_FONT, Math.min(p.baseFont, MAX_FONT));
    let lines: string[] = [];
    let lineHeight = 0;

    for (; fontSize >= MIN_FONT; fontSize--) {
      ctx.font = `600 ${fontSize}px ${fontFamily}`;
      lines = this.wrapText(ctx, p.translated, maxWidth);
      lineHeight = fontSize * 1.18;
      const total = lines.length * lineHeight;
      if (total <= maxHeight) break;
    }

    // Выравнивание
    if (p.textAlign === "center") {
      ctx.textAlign = "center";
    } else if (p.textAlign === "right") {
      ctx.textAlign = "right";
    } else {
      ctx.textAlign = "left";
    }

    const totalHeight = lines.length * lineHeight;
    let startY = p.block.y + p.block.height / 2 - totalHeight / 2 + lineHeight / 2;
    // Не даём тексту выйти за верхний край блока
    const minY = p.block.y + lineHeight / 2;
    if (startY < minY) startY = minY;

    let x: number;
    if (p.textAlign === "center") {
      x = p.block.x + p.block.width / 2;
    } else if (p.textAlign === "right") {
      x = p.block.x + p.block.width - padX;
    } else {
      x = p.block.x + padX;
    }

    lines.forEach((line, i) => {
      ctx.fillText(line, x, startY + i * lineHeight, maxWidth);
    });

    ctx.restore();
  }

  // ──────────────────────────────────────────────────────────────────
  // Режим "Документ": чистая страница с оригиналом сверху и переводом снизу
  // ──────────────────────────────────────────────────────────────────
  private createCleanDocument(
    img: HTMLImageElement,
    blocks: OCRBlock[],
    translations: Map<number, string>,
    fontFamily: string
  ): string {
    const canvas = document.createElement("canvas");
    const ctx = canvas.getContext("2d");
    if (!ctx) throw new Error("Canvas context unavailable");

    canvas.width = 900;
    canvas.height = 1270;

    ctx.fillStyle = "#FFFFFF";
    ctx.fillRect(0, 0, canvas.width, canvas.height);

    const margin = 40;
    const imgRatio = img.width / img.height;
    const maxImgWidth = canvas.width - margin * 2;
    const imgDrawWidth = maxImgWidth;
    const imgDrawHeight = Math.min(imgDrawWidth / imgRatio, canvas.height * 0.45);
    ctx.drawImage(img, margin, margin, imgDrawWidth, imgDrawHeight);

    const sepY = margin + imgDrawHeight + 24;
    ctx.strokeStyle = "#E5E7EB";
    ctx.lineWidth = 2;
    ctx.beginPath();
    ctx.moveTo(margin, sepY);
    ctx.lineTo(canvas.width - margin, sepY);
    ctx.stroke();

    let currentY = sepY + 30;
    ctx.textAlign = "left";
    ctx.textBaseline = "top";

    blocks.forEach((block, index) => {
      const translated = translations.get(index);
      if (!translated || !translated.trim()) return;

      ctx.fillStyle = "#9CA3AF";
      ctx.font = `400 13px ${fontFamily}`;
      const origLines = this.wrapText(ctx, block.text, canvas.width - margin * 2);
      origLines.forEach((line) => {
        if (currentY < canvas.height - 40) {
          ctx.fillText(line, margin, currentY);
          currentY += 17;
        }
      });

      ctx.fillStyle = "#111827";
      ctx.font = `600 17px ${fontFamily}`;
      const transLines = this.wrapText(ctx, translated, canvas.width - margin * 2);
      transLines.forEach((line) => {
        if (currentY < canvas.height - 40) {
          ctx.fillText(line, margin, currentY);
          currentY += 23;
        }
      });

      currentY += 12;
    });

    return canvas.toDataURL("image/jpeg", 0.95);
  }

  private wrapText(ctx: CanvasRenderingContext2D, text: string, maxWidth: number): string[] {
    const words = text.split(/\s+/).filter(Boolean);
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
}

export const imageTranslator = new ImageTranslator();