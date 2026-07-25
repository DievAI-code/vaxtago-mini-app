import { detectIntent, AIIntent } from "./aiRouter";
import { queryKnowledgeBase, KnowledgeEntry } from "./knowledgeBase";
import { ticketService, detectTicketIntent, extractCities, searchTickets } from "@/services/tickets/ticketService";
import { TicketResult } from "@/services/tickets/types";

export type SearchIntentType =
  | "TICKET_SEARCH"
  | "FLIGHT_SEARCH"
  | "JOB_SEARCH"
  | "MAP_ROUTE"
  | "MAP_SEARCH"
  | "OCR_TRANSLATE"
  | "DOCUMENT_HELP"
  | "WEB_SEARCH"
  | "KNOWLEDGE_BASE"
  | "GENERAL_CHAT";

export interface SmartSearchResult {
  intentType: SearchIntentType;
  queryText: string;
  language: string;
  from?: string;
  to?: string;
  profession?: string;
  tickets?: TicketResult;
  knowledge?: KnowledgeEntry;
  webSources?: Array<{ title: string; url: string; snippet: string }>;
  suggestedAction?: {
    label: string;
    route?: string;
    url?: string;
  };
}

export async function processSmartSearch(message: string): Promise<SmartSearchResult> {
  const baseIntent = detectIntent(message);
  const lowerMsg = message.toLowerCase().trim();

  // 1. Check for ticket search intent
  const ticketCheck = detectTicketIntent(message);
  if (ticketCheck.isTicket) {
    const cities = extractCities(message);
    const tickets = await searchTickets({
      type: ticketCheck.type || "train",
      from: cities.from,
      to: cities.to,
    });

    return {
      intentType: ticketCheck.type === "flight" ? "FLIGHT_SEARCH" : "TICKET_SEARCH",
      queryText: message,
      language: baseIntent.detectedLanguage,
      from: cities.from,
      to: cities.to,
      tickets,
      suggestedAction: {
        label: `🎫 Найдены варианты ${cities.from ? cities.from + " → " : ""}${cities.to || "..."}`,
      },
    };
  }

  // 2. Check knowledge base
  const kbMatch = queryKnowledgeBase(message);
  if (kbMatch) {
    return {
      intentType: "KNOWLEDGE_BASE",
      queryText: message,
      language: baseIntent.detectedLanguage,
      knowledge: kbMatch,
      suggestedAction: kbMatch.actionHint && kbMatch.link ? {
        label: kbMatch.actionHint,
        route: kbMatch.link,
      } : undefined,
    };
  }

  // 3. Check for web search fallback
  if (baseIntent.type === "GENERAL_CHAT" && 
      (lowerMsg.includes("как") || lowerMsg.includes("где") || lowerMsg.includes("сколько"))) {
    return {
      intentType: "WEB_SEARCH",
      queryText: message,
      language: baseIntent.detectedLanguage,
      webSources: [
        {
          title: "Справочник миграционных правил РФ 2026",
          url: "https://мвд.рф",
          snippet: "Официальные разъяснения МВД РФ и правила пребывания иностранных граждан.",
        },
      ],
      suggestedAction: {
        label: "🔎 Искать в Интернете",
        url: `https://www.google.com/search?q=${encodeURIComponent(message)}`,
      },
    };
  }

  // 4. Default to base intent
  const intentMap: Record<string, SearchIntentType> = {
    JOB_SEARCH: "JOB_SEARCH",
    MAP_ROUTE: "MAP_ROUTE",
    MAP_SEARCH: "MAP_SEARCH",
    OCR_TRANSLATE: "OCR_TRANSLATE",
    DOCUMENT_HELP: "DOCUMENT_HELP",
    GENERAL_CHAT: "GENERAL_CHAT",
  };

  return {
    intentType: intentMap[baseIntent.type] || "GENERAL_CHAT",
    queryText: message,
    language: baseIntent.detectedLanguage,
    from: baseIntent.entities.from,
    to: baseIntent.entities.to,
    profession: baseIntent.entities.profession,
    suggestedAction: baseIntent.replyHint ? { label: baseIntent.replyHint } : undefined,
  };
}