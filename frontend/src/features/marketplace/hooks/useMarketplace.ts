import { useQuery, useMutation, useQueryClient } from "@tanstack/react-query";
import {
  fetchEscrow,
  executeCreateEscrow,
  executeReleaseEscrow,
  executeRefundEscrow,
} from "../service/escrow";
import {
  fetchListing,
  executeCreateListing,
  executeUpdateListing,
  executeBuyListing,
} from "../service/marketplace";

export function useEscrowAgreement(escrowId: number | null, address?: string) {
  return useQuery({
    queryKey: ["campus-escrow", escrowId, address],
    queryFn: async () => {
      if (escrowId === null) return null;
      try {
        return await fetchEscrow(escrowId, address);
      } catch (err) {
        console.warn("Failed to fetch on-chain escrow, returning null", err);
        return null;
      }
    },
    enabled: escrowId !== null,
  });
}

export function useMarketplaceListing(listingId: number | null, address?: string) {
  return useQuery({
    queryKey: ["marketplace-listing", listingId, address],
    queryFn: async () => {
      if (listingId === null) return null;
      try {
        return await fetchListing(listingId, address);
      } catch (err) {
        console.warn("Failed to fetch on-chain listing, returning null", err);
        return null;
      }
    },
    enabled: listingId !== null,
  });
}

export function useCreateListingMutation() {
  const queryClient = useQueryClient();
  return useMutation({
    mutationFn: async ({
      seller,
      title,
      description,
      price,
      category,
      escrowEnabled,
    }: {
      seller: string;
      title: string;
      description: string;
      price: number;
      category: number;
      escrowEnabled: boolean;
    }) => {
      return executeCreateListing(seller, title, description, price, category, escrowEnabled);
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ["marketplace-listings"] });
    },
  });
}

export function useUpdateListingMutation() {
  const queryClient = useQueryClient();
  return useMutation({
    mutationFn: async ({
      id,
      seller,
      newPrice,
      newStatus,
    }: {
      id: number;
      seller: string;
      newPrice: number;
      newStatus: number;
    }) => {
      return executeUpdateListing(id, seller, newPrice, newStatus);
    },
    onSuccess: (_, variables) => {
      queryClient.invalidateQueries({ queryKey: ["marketplace-listing", variables.id] });
      queryClient.invalidateQueries({ queryKey: ["marketplace-listings"] });
    },
  });
}

export function useBuyListingMutation() {
  const queryClient = useQueryClient();
  return useMutation({
    mutationFn: async ({ id, buyer }: { id: number; buyer: string }) => {
      return executeBuyListing(id, buyer);
    },
    onSuccess: (_, variables) => {
      queryClient.invalidateQueries({ queryKey: ["marketplace-listing", variables.id] });
      queryClient.invalidateQueries({ queryKey: ["campus-balance", variables.buyer] });
    },
  });
}

export function useCreateEscrowMutation() {
  const queryClient = useQueryClient();
  return useMutation({
    mutationFn: async ({
      buyer,
      seller,
      amount,
    }: {
      buyer: string;
      seller: string;
      amount: number;
    }) => {
      return executeCreateEscrow(buyer, seller, amount);
    },
    onSuccess: (_, variables) => {
      queryClient.invalidateQueries({ queryKey: ["campus-balance", variables.buyer] });
    },
  });
}

export function useReleaseEscrowMutation() {
  const queryClient = useQueryClient();
  return useMutation({
    mutationFn: async ({
      escrowId,
      caller,
    }: {
      escrowId: number;
      caller: string;
    }) => {
      return executeReleaseEscrow(escrowId, caller);
    },
    onSuccess: (_, variables) => {
      queryClient.invalidateQueries({ queryKey: ["campus-escrow", variables.escrowId] });
      queryClient.invalidateQueries({ queryKey: ["campus-balance"] });
    },
  });
}

export function useRefundEscrowMutation() {
  const queryClient = useQueryClient();
  return useMutation({
    mutationFn: async ({
      escrowId,
      caller,
    }: {
      escrowId: number;
      caller: string;
    }) => {
      return executeRefundEscrow(escrowId, caller);
    },
    onSuccess: (_, variables) => {
      queryClient.invalidateQueries({ queryKey: ["campus-escrow", variables.escrowId] });
      queryClient.invalidateQueries({ queryKey: ["campus-balance"] });
    },
  });
}
