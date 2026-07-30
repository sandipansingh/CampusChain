export enum FoodOrderStatus {
  Placed = 1,
  Preparing = 2,
  ReadyForPickup = 3,
  Completed = 4,
  Cancelled = 5,
}

export const FoodOrderStatusLabels: Record<FoodOrderStatus, string> = {
  [FoodOrderStatus.Placed]: "Placed",
  [FoodOrderStatus.Preparing]: "Preparing",
  [FoodOrderStatus.ReadyForPickup]: "Ready for Pickup",
  [FoodOrderStatus.Completed]: "Completed",
  [FoodOrderStatus.Cancelled]: "Cancelled",
};

export interface MenuItem {
  id: number;
  merchant: string;
  universityCode: string;
  name: string;
  description: string;
  priceCamp: number;
  available: boolean;
  createdAt: number;
  updatedAt: number;
}

export interface FoodOrder {
  id: number;
  merchant: string;
  student: string;
  universityCode: string;
  menuItemId: number;
  quantity: number;
  unitPriceCamp: number;
  totalCamp: number;
  status: FoodOrderStatus;
  placedAt: number;
  updatedAt: number;
  // Populated client-side
  menuItemName?: string;
}
