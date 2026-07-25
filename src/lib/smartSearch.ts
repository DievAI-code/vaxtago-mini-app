import { detectIntent, AIIntent } from "./aiRouter";
import { queryKnowledgeBase, KnowledgeEntry } from "./knowledgeBase";
import { ticketService } from "@/services/tickets/ticketService";
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
  tickets?: TicketResult[];
  knowledge?: KnowledgeEntry;
  webSources?: Array<{ title: string; url: string; snippet: string }>;
  suggestedAction?: {
    label: string;
    route?: string;
    url?: string;
  };
}

const TICKET_REGEX = /билет|поезд|жд|поездка|рейс|самолет|авиа|билетлар|чипта|poyezd|samolyot|bilet/i;
const FLIGHT_REGEX = /самолет|авиа|авиабилет|самолёт|рейс|fly|flight|samolyot/i;

export async function processSmartSearch(message: string): Promise<SmartSearchResult> {
  const baseIntent = detectIntent(message);
  const low = message.toLowerCase().trim();

  const isTicket = TICKET_REGEX.test(low);
  const isFlight = FLIGHT_REGEX.test(low);

  if (isTicket) {
    const type = isFlight ? "flight" : "train";
    const from = baseIntent.entities.from || extractCityFromText(low, "from") || "Москва";
    const to = baseIntent.entities.to || extractCityFromText(low, "to") || "Ташкент";

    const tickets = await ticketService.searchTickets({ type, from, to });

    return {
      intentType: isFlight ? "FLIGHT_SEARCH" : "TICKET_SEARCH",
      queryText: message,
      language: baseIntent.detectedLanguage,
      from,
      to,
      tickets,
      suggestedAction: {
        label: `🎫 Искать ${type === "flight" ? "авиабилеты" : "ЖД билеты"} ${from} → ${to}`,
        url: tickets[0]?.deepLink,
      },
    };
  }

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

  if (baseIntent.type === "GENERAL_CHAT" && (low.includes("как") || low.includes("где") || low.includes("сколько") || low.includes("почему"))) {
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
        {
          title: "VAQTA AI — База знаний и поддержка",
          url: "https://vaxtago.app",
          snippet: "Информационная поддержка трудовых мигрантов в России.",
        },
      ],
      suggestedAction: {
        label: "🔎 Искать в Интернете",
        url: `https://www.google.com/search?q=${encodeURIComponent(message)}`,
      },
    };
  }

  return {
    intentType: baseIntent.type as SearchIntentType,
    queryText: message,
    language: baseIntent.detectedLanguage,
    from: baseIntent.entities.from,
    to: baseIntent.entities.to,
    profession: baseIntent.entities.profession,
    suggestedAction: baseIntent.replyHint ? { label: baseIntent.replyHint } : undefined,
  };
}

function extractCityFromText(text: string, direction: "from" | "to"): string | undefined {
  const cities = ["москва", "ташкент", "тюмень", "спб", "питер", "казань", "екатеринбург", "самарканд", "самарканд", "сургут", "нижневартовск"];
  for (const c of cities) {
    if (text.includes(c)) return c.charAt(0).toUpperCase() + c.slice(1);
  }
  return undefined;
}