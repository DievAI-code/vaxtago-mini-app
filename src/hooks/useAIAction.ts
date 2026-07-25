"use client";

import { useNavigate } from "react-router-dom";
import { detectIntent } from "@/lib/aiRouter";

export function useAIAction() {
  const navigate = useNavigate();

  const handleAIAction = (intent: ReturnType<typeof detectIntent>) => {
    const q =
      intent.entities.query ||
      intent.entities.profession ||
      intent.entities.location ||
      intent.originalText;

    switch (intent.type) {
      case "MAP_SEARCH":
        navigate(`/maps?search=${encodeURIComponent(q)}`);
        break;
      case "MAP_ROUTE":
        navigate(`/maps?route=${encodeURIComponent(intent.entities.to || q)}`);
        break;
      case "OCR_TRANSLATE":
        navigate("/scanner");
        break;
      case "DOCUMENT_HELP":
        navigate("/contract-audit");
        break;
      case "JOB_SEARCH":
        navigate(`/jobs-test?query=${encodeURIComponent(q)}`);
        break;
      case "EMPLOYER_CHECK":
        navigate(`/jobs-test?query=${encodeURIComponent(q)}`);
        break;
      default:
        break;
    }
  };

  return { handleAIAction };
}