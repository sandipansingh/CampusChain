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
  executeClaimFaucet,
  fetchHasClaimedFaucet,
  executeBuyCampTokens,
} from "../service/campusToken";
import {
  fetchUserProfile,
  fetchUniversity,
  executeRegisterProfile,
  executeRegisterUniversity,
  executeVerifyProfile,
  executeRejectProfile,
  fetchUniversityProfiles,
  executeSuspendUniversity,
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
      const profile = await fetchUserProfile(address, address);
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
      expirationLedger,
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
      return fetchUserProfile(address, address);
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

export function useUniversityProfiles(universityCode: string | null, callerAddress?: string | null) {
  return useQuery({
    queryKey: ["university-profiles", universityCode, callerAddress],
    queryFn: async () => {
      if (!universityCode) return [];
      return fetchUniversityProfiles(universityCode, callerAddress || undefined);
    },
    enabled: !!universityCode,
    refetchInterval: 15000,
  });
}

export function useVerifyProfileMutation() {
  const queryClient = useQueryClient();
  return useMutation({
    mutationFn: async ({ caller, targetAddress }: { caller: string; targetAddress: string }) =>
      executeVerifyProfile(caller, targetAddress),
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ["university-profiles"] });
    },
  });
}

export function useRejectProfileMutation() {
  const queryClient = useQueryClient();
  return useMutation({
    mutationFn: async ({ caller, targetAddress }: { caller: string; targetAddress: string }) =>
      executeRejectProfile(caller, targetAddress),
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ["university-profiles"] });
    },
  });
}

export function useSuspendUniversityMutation() {
  const queryClient = useQueryClient();
  return useMutation({
    mutationFn: async ({ caller, code }: { caller: string; code: string }) =>
      executeSuspendUniversity(caller, code),
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ["universities"] });
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
      if (typeof window !== "undefined") window.dispatchEvent(new Event("campuschain:transaction-submitted"));
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
      if (typeof window !== "undefined") window.dispatchEvent(new Event("campuschain:transaction-submitted"));
    },
  });
}

