import { useQuery, useMutation, useQueryClient } from "@tanstack/react-query";
import {
  fetchMenuItems,
  fetchFoodOrders,
  executePublishMenuItem,
  executeUpdateMenuItem,
  executePlaceOrder,
  executeUpdateOrderStatus,
  executeCancelOrder,
} from "./service";
import { useCampusProfile } from "@/features/wallet/hooks/useWallet";
import { FoodOrderStatus } from "./types";

export function useMenuItems(address?: string) {
  const { data: profile } = useCampusProfile(address ?? null);
  const myUnivCode = profile?.universityCode?.toUpperCase() ?? "";

  return useQuery({
    queryKey: ["food-menu-items", address, myUnivCode],
    queryFn: async () => {
      const items = await fetchMenuItems(address);
      if (!address) return items;
      if (!myUnivCode) return [];
      return items.filter((item) => item.universityCode.toUpperCase() === myUnivCode);
    },
    enabled: address === undefined ? true : !!profile,
  });
}

export function useFoodOrders(address?: string) {
  return useQuery({
    queryKey: ["food-orders", address],
    queryFn: () => fetchFoodOrders(address),
    enabled: !!address,
  });
}

export function usePublishMenuItemMutation() {
  const queryClient = useQueryClient();
  return useMutation({
    mutationFn: async ({
      merchant,
      name,
      description,
      priceCamp,
      available,
    }: {
      merchant: string;
      name: string;
      description: string;
      priceCamp: number;
      available: boolean;
    }) => {
      return executePublishMenuItem(merchant, name, description, priceCamp, available);
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ["food-menu-items"] });
    },
  });
}

export function useUpdateMenuItemMutation() {
  const queryClient = useQueryClient();
  return useMutation({
    mutationFn: async ({
      merchant,
      itemId,
      name,
      description,
      priceCamp,
      available,
    }: {
      merchant: string;
      itemId: number;
      name: string;
      description: string;
      priceCamp: number;
      available: boolean;
    }) => {
      return executeUpdateMenuItem(merchant, itemId, name, description, priceCamp, available);
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ["food-menu-items"] });
    },
  });
}

export function usePlaceOrderMutation() {
  const queryClient = useQueryClient();
  return useMutation({
    mutationFn: async ({
      student,
      itemId,
      quantity,
    }: {
      student: string;
      itemId: number;
      quantity: number;
    }) => {
      return executePlaceOrder(student, itemId, quantity);
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ["food-orders"] });
      queryClient.invalidateQueries({ queryKey: ["campus-balance"] });
    },
  });
}

export function useUpdateOrderStatusMutation() {
  const queryClient = useQueryClient();
  return useMutation({
    mutationFn: async ({
      merchant,
      orderId,
      newStatus,
    }: {
      merchant: string;
      orderId: number;
      newStatus: FoodOrderStatus;
    }) => {
      return executeUpdateOrderStatus(merchant, orderId, newStatus);
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ["food-orders"] });
      queryClient.invalidateQueries({ queryKey: ["campus-balance"] });
    },
  });
}

export function useCancelOrderMutation() {
  const queryClient = useQueryClient();
  return useMutation({
    mutationFn: async ({
      caller,
      orderId,
    }: {
      caller: string;
      orderId: number;
    }) => {
      return executeCancelOrder(caller, orderId);
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ["food-orders"] });
      queryClient.invalidateQueries({ queryKey: ["campus-balance"] });
    },
  });
}
