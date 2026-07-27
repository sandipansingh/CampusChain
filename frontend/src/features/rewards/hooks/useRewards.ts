import { useQuery, useMutation, useQueryClient } from "@tanstack/react-query";
import {
  fetchUtilityReward,
  executeCreateUtilityReward,
  executeRedeemReward,
  executeClaimFaucet,
  fetchHasClaimedFaucet,
  executeBuyCampTokens,
} from "../service/rewards";

export function useUtilityReward(id: number | null, address?: string) {
  return useQuery({
    queryKey: ["utility-reward", id, address],
    queryFn: async () => {
      if (id === null) return null;
      try {
        return await fetchUtilityReward(id, address);
      } catch (err) {
        console.warn("Failed to fetch reward details, returning null", err);
        return null;
      }
    },
    enabled: id !== null,
  });
}

export function useCreateUtilityRewardMutation() {
  const queryClient = useQueryClient();
  return useMutation({
    mutationFn: async ({
      admin,
      name,
      costCamp,
      stock,
    }: {
      admin: string;
      name: string;
      costCamp: number;
      stock: number;
    }) => {
      return executeCreateUtilityReward(admin, name, costCamp, stock);
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ["utility-rewards"] });
    },
  });
}

export function useRedeemRewardMutation() {
  const queryClient = useQueryClient();
  return useMutation({
    mutationFn: async ({ student, rewardId }: { student: string; rewardId: number }) => {
      return executeRedeemReward(student, rewardId);
    },
    onSuccess: (_, variables) => {
      queryClient.invalidateQueries({ queryKey: ["utility-reward", variables.rewardId] });
      queryClient.invalidateQueries({ queryKey: ["campus-balance", variables.student] });
    },
  });
}

export function useClaimFaucetMutation() {
  const queryClient = useQueryClient();
  return useMutation({
    mutationFn: async ({ recipient }: { recipient: string }) => {
      return executeClaimFaucet(recipient);
    },
    onSuccess: (_, variables) => {
      queryClient.invalidateQueries({ queryKey: ["campus-balance", variables.recipient] });
      queryClient.invalidateQueries({ queryKey: ["has-claimed-faucet", variables.recipient] });
    },
  });
}

export function useHasClaimedFaucet(address?: string) {
  return useQuery({
    queryKey: ["has-claimed-faucet", address],
    queryFn: async () => {
      if (!address) return false;
      try {
        return await fetchHasClaimedFaucet(address);
      } catch {
        return false;
      }
    },
    enabled: !!address,
    refetchInterval: 30000,
  });
}

export function useBuyCampTokensMutation() {
  const queryClient = useQueryClient();
  return useMutation({
    mutationFn: async ({ recipient, xlmAmount }: { recipient: string; xlmAmount: string }) => {
      return executeBuyCampTokens(recipient, xlmAmount);
    },
    onSuccess: (_, variables) => {
      queryClient.invalidateQueries({ queryKey: ["campus-balance", variables.recipient] });
    },
  });
}
