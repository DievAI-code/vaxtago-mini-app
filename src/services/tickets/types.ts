export type TicketType = "train" | "flight" | "bus";

export interface TicketSearchParams {
  type: TicketType;
  from?: string;
  to?: string;
  date?: string;
  passengers?: number;
}

export interface TicketResult {
  provider: string;
  providerLogo?: string;
  type: TicketType;
  title: string;
  description: string;
  priceEstimate?: string;
  deepLink: string;
}

export interface ITicketProvider {
  name: string;
  id: string;
  supports: TicketType[];
  searchTickets(params: TicketSearchParams): Promise<TicketResult[]>;
}