export interface EscrowAgreement {
  id: number;
  buyer: string;
  seller: string;
  universityCode?: string;
  amount: number;
  status: number; // 1: Funded, 2: Released, 3: Refunded
}

export interface Listing {
  id: number;
  seller: string;
  universityCode?: string;
  title: string;
  description: string;
  price: number;
  category: number;
  status: number; // 1: Active, 2: Sold, 3: Cancelled
  escrow_enabled: boolean;
}
