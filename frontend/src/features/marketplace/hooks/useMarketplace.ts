import { useQuery, useMutation, useQueryClient } from "@tanstack/react-query";
import {
  fetchEscrow,
  fetchEscrows,
  executeCreateEscrow,
  executeReleaseEscrow,
  executeRefundEscrow,
} from "../service/escrow";
import {
  fetchListing,
  fetchListings,
  fetchListingEscrow,
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

export function useEscrows(address?: string) {
  return useQuery({ queryKey: ["campus-escrows", address], queryFn: () => fetchEscrows(0, 50, address) });
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

import { useCampusProfile } from "@/features/wallet/hooks/useWallet";
import { fetchUserProfile } from "@/features/wallet/service/campusIdentity";

export function useMarketplaceListings(address?: string) {
  const { data: profile } = useCampusProfile(address ?? null);
  const myUnivCode = profile?.universityCode?.toUpperCase() ?? "";

  return useQuery({
    queryKey: ["marketplace-listings", address, myUnivCode],
    queryFn: async () => {
      const listings = await fetchListings(0, 50, address);
      if (!address) return listings;
      if (!myUnivCode) return []; // if current user has no approved university profile, show empty listings

      const filtered = [];
      for (const item of listings) {
        try {
          const sellerProfile = await fetchUserProfile(item.seller, address);
          if (sellerProfile && sellerProfile.universityCode?.toUpperCase() === myUnivCode) {
            filtered.push(item);
          }
        } catch {
          // ignore profile fetch issues
        }
      }
      return filtered;
    },
    enabled: address === undefined ? true : !!profile, // if no address provided (anonymous), skip filtering or handle as is
  });
}

export function useListingEscrowId(listingId: number | null, address?: string) {
  return useQuery({
    queryKey: ["marketplace-listing-escrow", listingId, address],
    queryFn: () => listingId === null ? null : fetchListingEscrow(listingId, address),
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
      // Signal the activity feed to refresh immediately
      window.dispatchEvent(new CustomEvent("campuschain:transaction-submitted"));
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
      queryClient.invalidateQueries({ queryKey: ["marketplace-listing-escrow", variables.id] });
      queryClient.invalidateQueries({ queryKey: ["marketplace-listings"] });
      queryClient.invalidateQueries({ queryKey: ["campus-balance", variables.buyer] });
      if (typeof window !== "undefined") window.dispatchEvent(new Event("campuschain:transaction-submitted"));
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
      queryClient.invalidateQueries({ queryKey: ["marketplace-listings"] });
      queryClient.invalidateQueries({ queryKey: ["campus-balance"] });
      if (typeof window !== "undefined") window.dispatchEvent(new Event("campuschain:transaction-submitted"));
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
      queryClient.invalidateQueries({ queryKey: ["marketplace-listings"] });
      queryClient.invalidateQueries({ queryKey: ["campus-balance"] });
      if (typeof window !== "undefined") window.dispatchEvent(new Event("campuschain:transaction-submitted"));
    },
  });
}
