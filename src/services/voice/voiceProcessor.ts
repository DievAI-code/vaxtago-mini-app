"use client";

import { voiceDebug } from "./voiceDebug";
import { detectIntent } from "@/lib/aiRouter";

export interface VoiceProcessResult {
  transcript: string;
  detectedLanguage: string;
  intent: string;
  confidence: number;
  action: string;
  entities: any;
}

/**
 * Processes a voice transcript through the AI Intent Router.
 * This is the SAME pipeline as text input - no separate voice logic.
 */
export function processVoiceTranscript(transcript: string): VoiceProcessResult {
  voiceDebug.log("Transcript", { text: transcript, length: transcript.length });

  if (!transcript || transcript.trim().length < 2) {
    voiceDebug.log("Error", { message: "Empty or too short transcript" });
    return {
      transcript: "",
      detectedLanguage: "unknown",
      intent: "unknown",
      confidence: 0,
      action: "none",
      entities: {},
    };
  }

  const cleanText = transcript.trim();
  voiceDebug.log("Cleaned Transcript", { text: cleanText });

  // Use existing AI Intent Router (same as text input)
  const intent = detectIntent(cleanText);

  voiceDebug.log("Detected language", { language: intent.detectedLanguage });
  voiceDebug.log("Intent", {
    type: intent.type,
    confidence: intent.confidence,
    entities: intent.entities,
  });

  // Map intent to action
  const actionMap: Record<string, string> = {
    MAP_ROUTE: "route",
    MAP_SEARCH: "map_search",
    JOB_SEARCH: "job_search",
    OCR_TRANSLATE: "translate_photo",
    DOCUMENT_HELP: "document",
    LEGAL_HELP: "legal",
    MIGRATION_HELP: "migration",
    EMPLOYER_CHECK: "employer_check",
    GENERAL_CHAT: "chat",
  };

  const action = actionMap[intent.type] || "chat";

  voiceDebug.log("Action", { action });
  voiceDebug.printPipeline();

  return {
    transcript: cleanText,
    detectedLanguage: intent.detectedLanguage,
    intent: intent.type,
    confidence: intent.confidence,
    action,
    entities: intent.entities,
  };
}