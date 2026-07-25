import { TicketProvider } from "./types";

export const TICKET_PROVIDERS: TicketProvider[] = [
  // Train providers
  {
    id: "tutu",
    name: "Tutu.ru",
    type: ["train", "bus"],
    url: "https://www.tutu.ru",
    icon: "🚂",
    description: "Расписание поездов и автобусов",
  },
  {
    id: "rzd",
    name: "РЖД",
    type: ["train"],
    url: "https://rzd.ru",
    icon: "🚆",
    description: "Официальный сайт РЖД",
  },
  {
    id: "yandex_travel",
    name: "Яндекс Путешествия",
    type: ["train", "flight", "bus"],
    url: "https://travel.yandex.ru",
    icon: "🎯",
    description: "Билеты на поезда, самолеты и автобусы",
  },
  {
    id: "kupibilet",
    name: "Купибилет",
    type: ["train", "flight", "bus"],
    url: "https://kupibilet.ru",
    icon: "🎫",
    description: "Сравнение цен на билеты",
  },
  // Flight providers
  {
    id: "aviasales",
    name: "Aviasales",
    type: ["flight"],
    url: "https://www.aviasales.ru",
    icon: "✈️",
    description: "Поиск дешевых авиабилетов",
  },
  {
    id: "skyscanner",
    name: "Skyscanner",
    type: ["flight"],
    url: "https://www.skyscanner.ru",
    icon: "🌍",
    description: "Международный поиск авиабилетов",
  },
];

export function getProvidersByType(type: "train" | "flight" | "bus"): TicketProvider[] {
  return TICKET_PROVIDERS.filter(p => p.type.includes(type));
}

export function buildDeepLink(providerId: string, params: { from?: string; to?: string; date?: string }): string {
  const { from, to, date } = params;
  
  switch (providerId) {
    case "tutu":
      return `https://www.tutu.ru/poezda/search/?st1=${encodeURIComponent(from || "")}&st2=${encodeURIComponent(to || "")}`;
    case "rzd":
      return `https://pass.rzd.ru/tickets/public/ru?fromName=${encodeURIComponent(from || "")}&toName=${encodeURIComponent(to || "")}`;
    case "yandex_travel":
      if (from && to) {
        return `https://travel.yandex.ru/trains/search/?fromName=${encodeURIComponent(from)}&toName=${encodeURIComponent(to)}`;
      }
      return "https://travel.yandex.ru";
    case "aviasales":
      return `https://www.aviasales.ru/search?origin=${encodeURIComponent(from || "MOW")}&destination=${encodeURIComponent(to || "TAS")}&one_way=true`;
    case "skyscanner":
      return `https://www.skyscanner.ru/transport/flights/${encodeURIComponent(from || "mow")}/${encodeURIComponent(to || "tas")}/`;
    case "kupibilet":
      return `https://kupibilet.ru/search?from=${encodeURIComponent(from || "")}&to=${encodeURIComponent(to || "")}`;
    default:
      return TICKET_PROVIDERS.find(p => p.id === providerId)?.url || "https://travel.yandex.ru";
  }
}