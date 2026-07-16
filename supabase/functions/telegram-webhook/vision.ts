import type { Lang } from "./types.ts";
import { createAIRequest } from "../_shared/ai-router.ts";

const MAX_IMAGE_SIZE = 10 * 1024 * 1024; // 10MB

export function detectImageType(instruction: string): ImageType {
  const low = instruction.toLowerCase();
  if (["договор", "contract", "ҳуҷҷат", "куҷҷат"].some((w) => low.includes(w))) return "contract";
  if (["переписк", "chat", "сообщен", "messag"].some((w) => low.includes(w))) return "chat";
  if (["жиль", "housing", "квартир", "комнат"].some((w) => low.includes(w))) return "housing";
  if (["объявлен", "ваканс", "ad", "vacancy"].some((w) => low.includes(w))) return "ad";
  if (["скрин", "screenshot", "экран"].some((w) => low.includes(w))) return "screenshot";
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
    const chunk = bytes.subarray(i, i + chunkSize);
    binary += String.fromCharCode.apply(null, chunk as unknown as number[]);
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
  const mime = filePath.endsWith(".png") ? "image/png"
    : filePath.endsWith(".webp") ? "image/webp"
    : filePath.endsWith(".jpg") || filePath.endsWith(".jpeg") ? "image/jpeg"
    : "application/octet-stream";
  const base64 = arrayBufferToBase64(arrayBuffer);
  return `data:${mime};base64,${base64}`;
}

export async function analyzeDocument(
  botToken: string,
  fileId: string,
  instruction: string,
  lang: Lang,
): Promise<{ result: string; imageType: ImageType; provider: string; model: string }> {
  const imageUrl = await downloadTelegramFile(botToken, fileId);
  const imageType = detectImageType(instruction);

  console.log("VISION START - Routing through AI Router");
  const aiResult = await createAIRequest({
    type: "vision",
    image: imageUrl,
    text: instruction,
    language: lang,
  });

  console.log("VISION RESPONSE:", JSON.stringify(aiResult));

  return {
    result: aiResult.text,
    imageType,
    provider: aiResult.provider,
    model: aiResult.model,
  };
}