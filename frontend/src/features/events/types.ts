export interface EventDetails {
  id: number;
  host: string;
  university_code?: string;
  price: number;
  capacity: number;
  tickets_sold: number;
}

export interface TicketDetails {
  id: number;
  event_id: number;
  owner: string;
  redeemed: boolean;
}
