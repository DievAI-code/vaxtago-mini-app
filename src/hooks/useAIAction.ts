"use client";

import { useNavigate } from "react-router-dom";
import { AIActionResponse } from "@/services/aiActions";

export function useAIAction() {
  const navigate = useNavigate();

  const handleAIAction = (action: AIActionResponse) => {
    switch (action.action) {
      case "MAP_SEARCH":
        navigate(`/maps?search=${encodeURIComponent(action.query || "")}`);
        break;

      case "BUILD_ROUTE":
        navigate(`/maps?route=${encodeURIComponent(action.query || "")}`);
        break;

      case "TRANSLATE":
        navigate(`/translate?text=${encodeURIComponent(action.query || "")}`);
        break;

      case "DOCUMENT_SCAN":
        navigate("/scanner");
        break;

      case "JOB_SEARCH":
        navigate(`/jobs?query=${encodeURIComponent(action.query || "")}`);
        break;

      case "EMPLOYER_CHECK":
        navigate(`/jobs?query=${encodeURIComponent(action.query || "")}`);
        break;

      default:
        break;
    }
  };

  return {
    handleAIAction
  };
}