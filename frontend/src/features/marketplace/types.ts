export interface EscrowAgreement {
  id: number;
  buyer: string;
  seller: string;
  amount: number;
  status: number; // 1: Funded, 2: Released, 3: Refunded
}

export interface Listing {
  id: number;
  seller: string;
  title: string;
  description: string;
  price: number;
  category: number;
  status: number; // 0: Available, 1: Sold, 2: Inactive
  escrow_enabled: boolean;
}
