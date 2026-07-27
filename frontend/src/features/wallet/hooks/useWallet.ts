import { useQuery, useMutation, useQueryClient } from "@tanstack/react-query";
import {
  fetchBalance,
  fetchUserRole,
  fetchTokenMetadata,
  executeTransfer,
  executeApprove,
  executeSetRole,
  executeRequestRoleChange,
  executeApproveRoleChange,
  executeDenyRoleChange,
  fetchPendingRoleRequests,
} from "../service/campusToken";

export function useCampusBalance(address: string | null) {
  return useQuery({
    queryKey: ["campus-balance", address],
    queryFn: async () => {
      if (!address) return 0;
      try {
        return await fetchBalance(address);
      } catch (err) {
        console.warn("Failed to fetch on-chain balance, using default fallback", err);
        return 1000.0;
      }
    },
    enabled: !!address,
  });
}

export function useCampusUserRole(address: string | null) {
  return useQuery({
    queryKey: ["campus-role", address],
    queryFn: async () => {
      if (!address) return 0;
      try {
        return await fetchUserRole(address);
      } catch (err) {
        console.warn("Failed to fetch on-chain user role, using default fallback", err);
        return 1; // Default to Student
      }
    },
    enabled: !!address,
  });
}

export function useCampusTokenMetadata() {
  return useQuery({
    queryKey: ["campus-token-metadata"],
    queryFn: async () => {
      try {
        return await fetchTokenMetadata();
      } catch (err) {
        console.warn("Failed to fetch on-chain token metadata, using default fallback", err);
        return {
          name: "CampusChain Token",
          symbol: "CAMP",
          decimals: 7,
          totalSupply: 1000000,
        };
      }
    },
  });
}

export function useTransferMutation() {
  const queryClient = useQueryClient();
  return useMutation({
    mutationFn: async ({
      from,
      to,
      amount,
    }: {
      from: string;
      to: string;
      amount: number;
    }) => {
      return executeTransfer(from, to, amount);
    },
    onSuccess: (_, variables) => {
      queryClient.invalidateQueries({ queryKey: ["campus-balance", variables.from] });
      queryClient.invalidateQueries({ queryKey: ["campus-balance", variables.to] });
    },
  });
}

export function useApproveMutation() {
  return useMutation({
    mutationFn: async ({
      from,
      spender,
      amount,
      expirationLedger = 1000000,
    }: {
      from: string;
      spender: string;
      amount: number;
      expirationLedger?: number;
    }) => {
      return executeApprove(from, spender, amount, expirationLedger);
    },
  });
}

export function useSetRoleMutation() {
  const queryClient = useQueryClient();
  return useMutation({
    mutationFn: async ({
      admin,
      user,
      role,
    }: {
      admin: string;
      user: string;
      role: number;
    }) => {
      return executeSetRole(admin, user, role);
    },
    onSuccess: (_, variables) => {
      queryClient.invalidateQueries({ queryKey: ["campus-role", variables.user] });
    },
  });
}

export function useRequestRoleChangeMutation() {
  return useMutation({
    mutationFn: async ({
      applicant,
      requestedRole,
    }: {
      applicant: string;
      requestedRole: number;
    }) => {
      return executeRequestRoleChange(applicant, requestedRole);
    },
  });
}

export function useApproveRoleChangeMutation() {
  const queryClient = useQueryClient();
  return useMutation({
    mutationFn: async ({
      requestId,
      admin,
    }: {
      requestId: number;
      admin: string;
    }) => {
      return executeApproveRoleChange(requestId, admin);
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ["campus-role"] });
      queryClient.invalidateQueries({ queryKey: ["role-requests"] });
    },
  });
}

export function useDenyRoleChangeMutation() {
  const queryClient = useQueryClient();
  return useMutation({
    mutationFn: async ({
      requestId,
      admin,
    }: {
      requestId: number;
      admin: string;
    }) => {
      return executeDenyRoleChange(requestId, admin);
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ["campus-role"] });
      queryClient.invalidateQueries({ queryKey: ["role-requests"] });
    },
  });
}

export function usePendingRoleRequests(address?: string) {
  return useQuery({
    queryKey: ["role-requests", address],
    queryFn: async () => {
      return fetchPendingRoleRequests(address);
    },
    refetchInterval: 15000,
  });
}
