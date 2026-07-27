import { useQuery, useMutation, useQueryClient } from "@tanstack/react-query";
import {
  fetchUniversities,
  fetchUniversity,
  fetchMembership,
  fetchPendingRequests,
  executeRegisterUniversity,
  executeRequestJoin,
  executeApproveMember,
  executeDenyMember,
  executeInviteMember,
  executeAcceptInvite,
  executeLeaveUniversity,
} from "../service/university";

export function useUniversities(address?: string) {
  return useQuery({
    queryKey: ["universities", address],
    queryFn: async () => {
      try {
        return await fetchUniversities(address);
      } catch (err) {
        console.warn("Failed to fetch universities list", err);
        return [];
      }
    },
  });
}

export function useUniversity(id: number | null, address?: string) {
  return useQuery({
    queryKey: ["university", id, address],
    queryFn: async () => {
      if (id === null) return null;
      try {
        return await fetchUniversity(id, address);
      } catch {
        return null;
      }
    },
    enabled: id !== null,
  });
}

export function useMembership(address: string | null) {
  return useQuery({
    queryKey: ["membership", address],
    queryFn: async () => {
      if (!address) return null;
      try {
        return await fetchMembership(address);
      } catch {
        return null;
      }
    },
    enabled: !!address,
  });
}

export function usePendingRequests(universityId: number | null, address?: string) {
  return useQuery({
    queryKey: ["pending-requests", universityId, address],
    queryFn: async () => {
      if (universityId === null) return [];
      try {
        return await fetchPendingRequests(universityId, address);
      } catch {
        return [];
      }
    },
    enabled: universityId !== null,
  });
}

export function useRegisterUniversityMutation() {
  const queryClient = useQueryClient();
  return useMutation({
    mutationFn: async ({
      admin,
      name,
      location,
      description,
    }: {
      admin: string;
      name: string;
      location: string;
      description: string;
    }) => {
      return executeRegisterUniversity(admin, name, location, description);
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ["universities"] });
    },
  });
}

export function useRequestJoinMutation() {
  const queryClient = useQueryClient();
  return useMutation({
    mutationFn: async ({
      universityId,
      applicant,
    }: {
      universityId: number;
      applicant: string;
    }) => {
      return executeRequestJoin(universityId, applicant);
    },
    onSuccess: (_, variables) => {
      queryClient.invalidateQueries({ queryKey: ["membership", variables.applicant] });
    },
  });
}

export function useApproveMemberMutation() {
  const queryClient = useQueryClient();
  return useMutation({
    mutationFn: async ({
      requestId,
      admin,
    }: {
      requestId: number;
      admin: string;
    }) => {
      return executeApproveMember(requestId, admin);
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ["universities"] });
      queryClient.invalidateQueries({ queryKey: ["membership"] });
    },
  });
}

export function useDenyMemberMutation() {
  const queryClient = useQueryClient();
  return useMutation({
    mutationFn: async ({
      requestId,
      admin,
    }: {
      requestId: number;
      admin: string;
    }) => {
      return executeDenyMember(requestId, admin);
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ["universities"] });
    },
  });
}

export function useInviteMemberMutation() {
  const queryClient = useQueryClient();
  return useMutation({
    mutationFn: async ({
      universityId,
      invitee,
      admin,
    }: {
      universityId: number;
      invitee: string;
      admin: string;
    }) => {
      return executeInviteMember(universityId, invitee, admin);
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ["universities"] });
    },
  });
}

export function useAcceptInviteMutation() {
  const queryClient = useQueryClient();
  return useMutation({
    mutationFn: async ({
      inviteId,
      invitee,
    }: {
      inviteId: number;
      invitee: string;
    }) => {
      return executeAcceptInvite(inviteId, invitee);
    },
    onSuccess: (_, variables) => {
      queryClient.invalidateQueries({ queryKey: ["membership", variables.invitee] });
    },
  });
}

export function useLeaveUniversityMutation() {
  const queryClient = useQueryClient();
  return useMutation({
    mutationFn: async ({ member }: { member: string }) => {
      return executeLeaveUniversity(member);
    },
    onSuccess: (_, variables) => {
      queryClient.invalidateQueries({ queryKey: ["membership", variables.member] });
    },
  });
}
