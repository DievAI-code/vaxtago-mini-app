"use client";

/**
 * Types of intents supported by the navigation system
 */
export type TravelIntent =
  | "route"
  | "search"
  | "unknown";

/**
 * Available travel modes for routing
 */
export type TravelMode =
  | "walking"
  | "car"
  | "transport";

/**
 * Structure of the parsed AI command result
 */
export interface AICommandResult {
  intent: TravelIntent;
  from?: string;
  to?: string;
  mode?: TravelMode;
}

/**
 * Analyzes user message to detect navigation intents like building a route or searching for a location.
 * @param message The raw user input string.
 */
export function detectNavigationIntent(message: string): AICommandResult {
  const text = message.toLowerCase().trim();

  // Keywords indicating a routing request
  const routeWords = [
    "маршрут",
    "добраться",
    "доехать",
    "путь",
    "как попасть",
    "отвези",
    "довези"
  ];

  const isRoute = routeWords.some(word => text.includes(word)) || text.includes("от ") && text.includes("до ");

  if (isRoute) {
    // Detect travel mode
    let mode: TravelMode = "walking"; // Default mode
    if (text.includes("машин") || text.includes("авто") || text.includes("такси")) {
      mode = "car";
    } else if (text.includes("автобус") || text.includes("метро") || text.includes("транспорт") || text.includes("маршрутк")) {
      mode = "transport";
    }

    // Try to extract from/to pattern "от [место] до [место]"
    const fromToMatch = text.match(/(?:от|с|из)\s+(.+?)\s+(?:до|в|на)\s+(.+)/i);
    
    if (fromToMatch) {
      return {
        intent: "route",
        from: fromToMatch[1].trim(),
        to: fromToMatch[2].trim(),
        mode
      };
    }

    // Fallback: clean the message to get the destination
    const destination = text
      .replace(/построй маршрут до|маршрут до|как доехать до|как добраться до|путь до|довези до|отвези до/gi, "")
      .trim();

    return {
      intent: "route",
      to: destination || message,
      mode
    };
  }

  // Keywords for simple search
  const searchWords = ["найди", "где", "покажи", "адрес"];
  const isSearch = searchWords.some(word => text.includes(word));

  if (isSearch) {
    const query = text
      .replace(/найди|где находится|покажи на карте|адрес/gi, "")
      .trim();
    
    return {
      intent: "search",
      to: query || text
    };
  }

  return {
    intent: "unknown"
  };
}