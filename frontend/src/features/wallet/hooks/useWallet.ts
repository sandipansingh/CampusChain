import { useQuery, useMutation, useQueryClient } from "@tanstack/react-query";
import {
  fetchBalance,
  fetchTokenMetadata,
  executeTransfer,
  executeApprove,
  executeSetRole,
  executeRequestRoleChange,
  executeApproveRoleChange,
  executeDenyRoleChange,
  fetchPendingRoleRequests,
} from "../service/campusToken";
import {
  fetchUserProfile,
  executeRegisterProfile,
  executeSetRole as executeSetIdentityRole,
  executeSetVerified,
} from "../service/campusIdentity";

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
        const profile = await fetchUserProfile(address);
        return profile ? profile.role : 1; // Default to Student (1) if no profile
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

export function useCampusProfile(address: string | null) {
  return useQuery({
    queryKey: ["campus-profile", address],
    queryFn: async () => {
      if (!address) return null;
      return fetchUserProfile(address);
    },
    enabled: !!address,
  });
}

export function useRegisterProfileMutation() {
  const queryClient = useQueryClient();
  return useMutation({
    mutationFn: async ({
      address,
      fullName,
      universityId,
      department,
    }: {
      address: string;
      fullName: string;
      universityId: string;
      department: string;
    }) => {
      return executeRegisterProfile(address, fullName, universityId, department);
    },
    onSuccess: (_, variables) => {
      queryClient.invalidateQueries({ queryKey: ["campus-profile", variables.address] });
      queryClient.invalidateQueries({ queryKey: ["campus-role", variables.address] });
    },
  });
}

export function useSetIdentityRoleMutation() {
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
      return executeSetIdentityRole(admin, user, role);
    },
    onSuccess: (_, variables) => {
      queryClient.invalidateQueries({ queryKey: ["campus-profile", variables.user] });
      queryClient.invalidateQueries({ queryKey: ["campus-role", variables.user] });
    },
  });
}

export function useSetVerifiedMutation() {
  const queryClient = useQueryClient();
  return useMutation({
    mutationFn: async ({
      admin,
      user,
      verified,
    }: {
      admin: string;
      user: string;
      verified: boolean;
    }) => {
      return executeSetVerified(admin, user, verified);
    },
    onSuccess: (_, variables) => {
      queryClient.invalidateQueries({ queryKey: ["campus-profile", variables.user] });
    },
  });
}
