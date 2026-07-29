"use client";

/**
 * Минимальный PDF-генератор: одна страница A4 с JPEG-изображением.
 * Не требует внешних библиотек — собирает PDF вручную.
 */

function dataUrlToBytes(dataUrl: string): Uint8Array {
  const base64 = dataUrl.split(",")[1];
  const bin = atob(base64);
  const bytes = new Uint8Array(bin.length);
  for (let i = 0; i < bin.length; i++) bytes[i] = bin.charCodeAt(i);
  return bytes;
}

function textToBytes(s: string): Uint8Array {
  const bytes = new Uint8Array(s.length);
  for (let i = 0; i < s.length; i++) bytes[i] = s.charCodeAt(i) & 0xff;
  return bytes;
}

export async function downloadImageAsPDF(imageDataUrl: string, filename: string = "vaqta-translated"): Promise<void> {
  const img = await new Promise<HTMLImageElement>((resolve, reject) => {
    const i = new Image();
    i.crossOrigin = "anonymous";
    i.onload = () => resolve(i);
    i.onerror = () => reject(new Error("Failed to load image for PDF"));
    i.src = imageDataUrl;
  });

  // Рисуем в JPEG для компактного PDF
  const canvas = document.createElement("canvas");
  canvas.width = img.width;
  canvas.height = img.height;
  const ctx = canvas.getContext("2d");
  if (!ctx) throw new Error("Canvas unavailable");
  ctx.drawImage(img, 0, 0);
  const jpegDataUrl = canvas.toDataURL("image/jpeg", 0.9);
  const jpegBytes = dataUrlToBytes(jpegDataUrl);

  // Размеры A4 в пунктах (1/72 inch)
  const pageW = 595.28;
  const pageH = 841.89;
  const margin = 20;
  const maxW = pageW - margin * 2;
  const maxH = pageH - margin * 2;

  const scale = Math.min(maxW / img.width, maxH / img.height);
  const drawW = img.width * scale;
  const drawH = img.height * scale;
  const offsetX = (pageW - drawW) / 2;
  const offsetY = (pageH - drawH) / 2;

  const imgW = img.width;
  const imgH = img.height;

  const parts: Uint8Array[] = [];
  const offsets: number[] = [];
  let pos = 0;

  const add = (bytes: Uint8Array) => {
    parts.push(bytes);
    pos += bytes.length;
  };
  const addStr = (s: string) => add(textToBytes(s));

  const objOffsets: number[] = [];

  addStr("%PDF-1.4\n");

  // Object 1: Catalog
  objOffsets[1] = pos;
  addStr("1 0 obj\n<< /Type /Catalog /Pages 2 0 R >>\nendobj\n");

  // Object 2: Pages
  objOffsets[2] = pos;
  addStr("2 0 obj\n<< /Type /Pages /Kids [3 0 R] /Count 1 >>\nendobj\n");

  // Object 3: Page
  objOffsets[3] = pos;
  addStr(`3 0 obj\n<< /Type /Page /Parent 2 0 R /MediaBox [0 0 ${pageW.toFixed(2)} ${pageH.toFixed(2)}] /Contents 4 0 R /Resources << /XObject << /Im1 5 0 R >> /ProcSet [/PDF /ImageC] >> >>\nendobj\n`);

  // Object 4: Contents
  const content = `q\n${drawW.toFixed(2)} 0 0 ${drawH.toFixed(2)} ${offsetX.toFixed(2)} ${offsetY.toFixed(2)} cm\n/Im1 Do\nQ\n`;
  objOffsets[4] = pos;
  addStr(`4 0 obj\n<< /Length ${content.length} >>\nstream\n${content}endstream\nendobj\n`);

  // Object 5: Image XObject
  objOffsets[5] = pos;
  addStr(`5 0 obj\n<< /Type /XObject /Subtype /Image /Width ${imgW} /Height ${imgH} /ColorSpace /DeviceRGB /BitsPerComponent 8 /Filter /DCTDecode /Length ${jpegBytes.length} >>\nstream\n`);
  add(jpegBytes);
  addStr("\nendstream\nendobj\n");

  // XRef
  const xrefPos = pos;
  const count = 6;
  let xref = `xref\n0 ${count}\n`;
  xref += "0000000000 65535 f \n";
  for (let i = 1; i < count; i++) {
    xref += String(objOffsets[i]).padStart(10, "0") + " 00000 n \n";
  }
  addStr(xref);

  // Trailer
  addStr(`trailer\n<< /Size ${count} /Root 1 0 R >>\nstartxref\n${xrefPos}\n%%EOF\n`);

  // Собираем
  const total = parts.reduce((s, p) => s + p.length, 0);
  const out = new Uint8Array(total);
  let off = 0;
  for (const p of parts) {
    out.set(p, off);
    off += p.length;
  }

  const blob = new Blob([out], { type: "application/pdf" });
  const url = URL.createObjectURL(blob);
  const link = document.createElement("a");
  link.href = url;
  link.download = `${filename}-${Date.now()}.pdf`;
  document.body.appendChild(link);
  link.click();
  document.body.removeChild(link);
  URL.revokeObjectURL(url);
}