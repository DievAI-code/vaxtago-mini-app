"use client";

import { useNavigate } from "react-router-dom";
import { detectIntent } from "@/lib/aiRouter";
import { detectNavigationIntent } from "@/services/aiCommands";

export function useAIAction() {
  const navigate = useNavigate();

  const handleAIAction = (
    intent: ReturnType<typeof detectIntent>,
    message: string
  ) => {
    const navIntent = detectNavigationIntent(message);

    if (navIntent.intent === "route" && navIntent.to) {
      const fromParam = navIntent.from ? encodeURIComponent(navIntent.from) : "";
      const toParam = encodeURIComponent(navIntent.to);
      const modeParam = navIntent.mode || "car";

      navigate(`/maps?from=${fromParam}&to=${toParam}&mode=${modeParam}`);
      return { handled: true, type: "route" };
    }

    const q =
      intent.entities.query ||
      intent.entities.profession ||
      intent.entities.location ||
      intent.originalText;

    switch (intent.type) {
      case "MAP_SEARCH":
        navigate(`/maps?search=${encodeURIComponent(q)}`);
        return { handled: true, type: "map_search" };

      case "JOB_SEARCH":
        navigate(`/jobs-test?query=${encodeURIComponent(q)}`);
        return { handled: true, type: "job_search" };

      case "OCR_TRANSLATE":
        navigate("/scanner");
        return { handled: true, type: "ocr" };

      case "DOCUMENT_HELP":
        navigate("/contract-audit");
        return { handled: true, type: "document" };

      default:
        return { handled: false, type: "chat" };
    }
  };

  return { handleAIAction };
}