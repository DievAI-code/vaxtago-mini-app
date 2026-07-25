import { TicketSearchParams, TicketResult } from "./types";
import { getProvidersByType, buildDeepLink } from "./ticketProviders";

// Multi-language ticket keywords
const TICKET_KEYWORDS = {
  ru: ["билет", "поезд", "авиабилет", "купить билет", "жд билет", "самолет", "рейс", "доехать", "уехать", "домой", "билетлар", "чипта"],
  uz: ["chipta", "bilet", "poyezd", "samolyot", "uchish", "bilet sotib olish", "uyga"],
  uz_cyr: ["чипта", "билет", "поезд", "самолёт", "учиш", "билет сотиб олиш", "уйга"],
  tj: ["чипта", "билет", "поезд", "самолёт", "харидани", "бозгашт"],
  en: ["ticket", "train ticket", "flight", "air ticket", "buy ticket", "go home", "travel"],
};

export function detectTicketIntent(message: string): { isTicket: boolean; type: "train" | "flight" | "bus" | null } {
  const lowerMsg = message.toLowerCase();
  
  // Check all language keywords
  const allKeywords = Object.values(TICKET_KEYWORDS).flat();
  const isTicket = allKeywords.some(kw => lowerMsg.includes(kw.toLowerCase()));
  
  if (!isTicket) return { isTicket: false, type: null };
  
  // Determine transport type
  const trainKeywords = ["поезд", "жд", "train", "poyezd", "поезд", "темир йўл", "темир йул"];
  const flightKeywords = ["самолет", "авиа", "flight", "air", "samolyot", "самолёт", "airplane", "plane"];
  const busKeywords = ["автобус", "bus", "avtobus", "автобус"];
  
  if (flightKeywords.some(kw => lowerMsg.includes(kw))) return { isTicket: true, type: "flight" };
  if (busKeywords.some(kw => lowerMsg.includes(kw))) return { isTicket: true, type: "bus" };
  if (trainKeywords.some(kw => lowerMsg.includes(kw))) return { isTicket: true, type: "train" };
  
  // Default to train if ambiguous
  return { isTicket: true, type: "train" };
}

export function extractCities(message: string): { from?: string; to?: string } {
  const lowerMsg = message.toLowerCase();
  
  // Common city patterns
  const cityPatterns = [
    /(?:от|с|из)\s+([а-яa-z\s]+?)\s+(?:до|в|на)\s+([а-яa-z\s]+)/i,
    /([а-яa-z\s]+?)\s*[-–—>→]\s*([а-яa-z\s]+)/i,
  ];
  
  for (const pattern of cityPatterns) {
    const match = message.match(pattern);
    if (match) {
      return {
        from: match[1].trim(),
        to: match[2].trim(),
      };
    }
  }
  
  // Try to find city names in message
  const cities = ["москва", "ташкент", "самарканд", "бухара", "казань", "спб", "питер", "тюмень", "сургут", "екатеринбург"];
  const foundCities: string[] = [];
  
  for (const city of cities) {
    if (lowerMsg.includes(city)) {
      foundCities.push(city.charAt(0).toUpperCase() + city.slice(1));
    }
  }
  
  if (foundCities.length >= 2) {
    return { from: foundCities[0], to: foundCities[1] };
  } else if (foundCities.length === 1) {
    return { to: foundCities[0] };
  }
  
  return {};
}

export async function searchTickets(params: TicketSearchParams): Promise<TicketResult> {
  const { type = "train", from, to } = params;
  
  const providers = getProvidersByType(type);
  
  const deepLinks = providers.map(provider => ({
    provider: provider.name,
    url: buildDeepLink(provider.id, { from, to }),
  }));
  
  return {
    type,
    from,
    to,
    providers,
    deepLinks,
  };
}

export const ticketService = {
  detectTicketIntent,
  extractCities,
  searchTickets,
};