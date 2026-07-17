import type { Lang } from "./types.ts";
import { createAIRequest } from "../_shared/ai-router.ts";

const MAX_IMAGE_SIZE = 10 * 1024 * 1024;

export function detectImageType(instruction: string): string {
  const low = instruction.toLowerCase();
  if (["договор", "contract", "ҳуҷҷат"].some((w) => low.includes(w))) return "contract";
  if (["переписк", "chat", "сообщен"].some((w) => low.includes(w))) return "chat";
  if (["жиль", "housing"].some((w) => low.includes(w))) return "housing";
  if (["объявлен", "ваканс", "vacancy"].some((w) => low.includes(w))) return "ad";
  if (["скрин", "screenshot"].some((w) => low.includes(w))) return "screenshot";
  if (["документ", "паспорт", "patent", "миграц", "document"].some((w) => low.includes(w))) return "document";
  return "photo";
}

export function selectLargestPhoto(photos: any[]): any {
  return photos.reduce((prev, curr) => (curr.file_size > prev.file_size ? curr : prev), photos[0]);
}

async function getTelegramFilePath(botToken: string, fileId: string): Promise<string> {
  const res = await fetch(`https://api.telegram.org/bot${botToken}/getFile?file_id=${fileId}`);
  const data = await res.json();
  if (!data.ok) throw new Error("getFile failed");
  return data.result.file_path as string;
}

function arrayBufferToBase64(buffer: ArrayBuffer): string {
  const bytes = new Uint8Array(buffer);
  let binary = "";
  const chunkSize = 0x8000;
  for (let i = 0; i < bytes.length; i += chunkSize) {
    binary += String.fromCharCode.apply(null, Array.from(bytes.subarray(i, i + chunkSize)));
  }
  return btoa(binary);
}

async function downloadTelegramFile(botToken: string, fileId: string): Promise<string> {
  const filePath = await getTelegramFilePath(botToken, fileId);
  const url = `https://api.telegram.org/file/bot${botToken}/${filePath}`;
  const response = await fetch(url);
  if (!response.ok) throw new Error(`Download failed: ${response.status}`);
  const arrayBuffer = await response.arrayBuffer();
  if (arrayBuffer.byteLength > MAX_IMAGE_SIZE) throw new Error("File too large (max 10MB)");
  const mime = filePath.endsWith(".png") ? "image/png" : filePath.endsWith(".webp") ? "image/webp" : "image/jpeg";
  return `data:${mime};base64,${arrayBufferToBase64(arrayBuffer)}`;
}

export async function analyzeDocument(
  botToken: string,
  fileId: string,
  instruction: string,
  lang: Lang,
  userId: number,
): Promise<{ result: string; imageType: string; provider: string; model: string }> {
  const imageUrl = await downloadTelegramFile(botToken, fileId);
  const imageType = detectImageType(instruction);
  // Step 1: OCR — recognize text only using Gemini Vision
  try {
    const aiResult = await createAIRequest({ type: "vision", image: imageUrl, text: "Распознай текст", language: lang, userId });
    return { result: aiResult.text, imageType, provider: aiResult.provider, model: aiResult.model };
  } catch {
    return { result: "⚠️ AI временно переключается на резервный сервер. Попробуйте позже.", imageType, provider: "none", model: "none" };
  }
}