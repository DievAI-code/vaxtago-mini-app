import { ITicketProvider, TicketSearchParams, TicketResult } from "./types";

class YandexTravelProvider implements ITicketProvider {
  name = "Яндекс Путешествия";
  id = "yandex_travel";
  supports: TicketSearchParams["type"][] = ["train", "flight", "bus"];

  async searchTickets(params: TicketSearchParams): Promise<TicketResult[]> {
    const fromQuery = params.from ? encodeURIComponent(params.from) : "";
    const toQuery = params.to ? encodeURIComponent(params.to) : "";
    
    let link = "https://travel.yandex.ru/";
    if (params.type === "train") {
      link = `https://travel.yandex.ru/trains/search/?fromName=${fromQuery}&toName=${toQuery}`;
    } else if (params.type === "flight") {
      link = `https://travel.yandex.ru/avia/search/?fromName=${fromQuery}&toName=${toQuery}`;
    } else if (params.type === "bus") {
      link = `https://travel.yandex.ru/buses/search/?fromName=${fromQuery}&toName=${toQuery}`;
    }

    return [
      {
        provider: "Яндекс Путешествия",
        type: params.type,
        title: `${params.type === "train" ? "🚆 ЖД Билеты" : params.type === "flight" ? "✈️ Авиабилеты" : "🚌 Автобус"}: ${params.from || "Откуда"} → ${params.to || "Куда"}`,
        description: "Официальный поиск билетов, сравнение цен и расписание онлайн",
        deepLink: link,
      },
    ];
  }
}

class TutuRuProvider implements ITicketProvider {
  name = "Tutu.ru";
  id = "tutu";
  supports: TicketSearchParams["type"][] = ["train", "bus"];

  async searchTickets(params: TicketSearchParams): Promise<TicketResult[]> {
    const fromQ = params.from ? encodeURIComponent(params.from) : "";
    const toQ = params.to ? encodeURIComponent(params.to) : "";
    const link = `https://www.tutu.ru/poezda/search/?st1=${fromQ}&st2=${toQ}`;

    return [
      {
        provider: "Tutu.ru",
        type: params.type,
        title: `🎫 Билеты Tutu: ${params.from || "Откуда"} — ${params.to || "Куда"}`,
        description: "Расписание поездов, наличие мест и бронирование",
        deepLink: link,
      },
    ];
  }
}

class AviasalesProvider implements ITicketProvider {
  name = "Aviasales / Travelpayouts";
  id = "aviasales";
  supports: TicketSearchParams["type"][] = ["flight"];

  async searchTickets(params: TicketSearchParams): Promise<TicketResult[]> {
    const link = `https://www.aviasales.ru/search?origin=${encodeURIComponent(params.from || "MOW")}&destination=${encodeURIComponent(params.to || "TAS")}`;

    return [
      {
        provider: "Aviasales",
        type: "flight",
        title: `✈️ Авиабилеты Aviasales: ${params.from || "Москва"} → ${params.to || "Ташкент"}`,
        description: "Поиск дешёвых авиабилетов по всем авиакомпаниям",
        deepLink: link,
      },
    ];
  }
}

export const ticketService = {
  providers: [
    new YandexTravelProvider(),
    new TutuRuProvider(),
    new AviasalesProvider(),
  ] as ITicketProvider[],

  async searchTickets(params: TicketSearchParams): Promise<TicketResult[]> {
    const matchingProviders = this.providers.filter((p) =>
      p.supports.includes(params.type)
    );

    const results = await Promise.all(
      matchingProviders.map((p) => p.searchTickets(params))
    );

    return results.flat();
  },
};