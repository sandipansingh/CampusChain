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
  fetchUniversity,
  executeRegisterProfile,
  executeRegisterUniversity,
  type ProfileRegistration,
} from "../service/campusIdentity";

export function useCampusBalance(address: string | null) {
  return useQuery({
    queryKey: ["campus-balance", address],
    queryFn: async () => {
      if (!address) return 0;
      return fetchBalance(address);
    },
    enabled: !!address,
  });
}

export function useCampusUserRole(address: string | null) {
  return useQuery({
    queryKey: ["campus-role", address],
    queryFn: async () => {
      if (!address) return 0;
      const profile = await fetchUserProfile(address);
      return profile?.role ?? null;
    },
    enabled: !!address,
  });
}

export function useCampusTokenMetadata() {
  return useQuery({
    queryKey: ["campus-token-metadata"],
    queryFn: async () => {
      return fetchTokenMetadata();
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

export function useCampusUniversity(code: string | null, address: string | null) {
  return useQuery({
    queryKey: ["campus-university", code],
    queryFn: async () => {
      if (!code) return null;
      return fetchUniversity(code, address ?? undefined);
    },
    enabled: !!code,
  });
}

export function useRegisterProfileMutation() {
  const queryClient = useQueryClient();
  return useMutation({
    mutationFn: async ({
      address,
      fullName,
      universityCode,
      registration,
    }: {
      address: string;
      fullName: string;
      universityCode: string;
      registration: ProfileRegistration;
    }) => {
      return executeRegisterProfile(address, fullName, universityCode, registration);
    },
    onSuccess: (_, variables) => {
      queryClient.invalidateQueries({ queryKey: ["campus-profile", variables.address] });
      queryClient.invalidateQueries({ queryKey: ["campus-role", variables.address] });
    },
  });
}

export function useRegisterUniversityMutation() {
  const queryClient = useQueryClient();
  return useMutation({
    mutationFn: async ({ admin, code, name, address, title }: { admin: string; code: string; name: string; address: string; title: string }) =>
      executeRegisterUniversity(admin, code, name, address, title),
    onSuccess: (_, variables) => {
      queryClient.invalidateQueries({ queryKey: ["campus-profile", variables.admin] });
      queryClient.invalidateQueries({ queryKey: ["universities"] });
    },
  });
}
