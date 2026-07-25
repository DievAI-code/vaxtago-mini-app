export type TicketType = "train" | "flight" | "bus";

export interface TicketSearchParams {
  type: TicketType;
  from?: string;
  to?: string;
  date?: string;
  passengers?: number;
}

export interface TicketProvider {
  id: string;
  name: string;
  type: TicketType[];
  url: string;
  icon?: string;
  description: string;
}

export interface TicketResult {
  type: TicketType;
  from?: string;
  to?: string;
  providers: TicketProvider[];
  deepLinks: {
    provider: string;
    url: string;
  }[];
}