import { useQuery, useMutation, useQueryClient } from "@tanstack/react-query";
import {
  readContract,
  invokeContractMethod,
  addressToScVal,
  i128ToScVal,
  u32ToScVal,
  stringToScVal,
  NEXT_PUBLIC_CAMPUS_SERVICE_CONTRACT_ID,
} from "@/services/contracts";
import { useWalletStore } from "@/state/useWalletStore";

export interface EscrowAgreement {
  id: number;
  buyer: string;
  seller: string;
  amount: number;
  status: number; // 1: Funded, 2: Completed, 3: Refunded
}

export interface EventDetails {
  id: number;
  host: string;
  price: number;
  capacity: number;
  tickets_sold: number;
}

export interface TicketDetails {
  id: number;
  event_id: number;
  owner: string;
  redeemed: boolean;
}

export function useEscrowAgreement(escrowId: number | null) {
  return useQuery({
    queryKey: ["campus-escrow", escrowId],
    queryFn: async (): Promise<EscrowAgreement | null> => {
      if (escrowId === null) return null;
      try {
        const address = useWalletStore.getState().address || undefined;
        const res = (await readContract(
          NEXT_PUBLIC_CAMPUS_SERVICE_CONTRACT_ID,
          "get_escrow",
          [u32ToScVal(escrowId)],
          address
        )) as { id: bigint; buyer: string; seller: string; amount: bigint; status: number } | null;

        if (!res) return null;
        return {
          id: Number(res.id),
          buyer: String(res.buyer),
          seller: String(res.seller),
          amount: Number(res.amount) / 10_000_000,
          status: Number(res.status),
        };
      } catch (err) {
        console.warn("Failed to fetch on-chain escrow agreement, returning null", err);
        return null;
      }
    },
    enabled: escrowId !== null,
  });
}

export function useEventDetails(eventId: number | null) {
  return useQuery({
    queryKey: ["campus-event", eventId],
    queryFn: async (): Promise<EventDetails | null> => {
      if (eventId === null) return null;
      try {
        const address = useWalletStore.getState().address || undefined;
        const res = (await readContract(
          NEXT_PUBLIC_CAMPUS_SERVICE_CONTRACT_ID,
          "get_event",
          [u32ToScVal(eventId)],
          address
        )) as { id: bigint; host: string; price: bigint; capacity: number; tickets_sold: number } | null;

        if (!res) return null;
        return {
          id: Number(res.id),
          host: String(res.host),
          price: Number(res.price) / 10_000_000,
          capacity: Number(res.capacity),
          tickets_sold: Number(res.tickets_sold),
        };
      } catch (err) {
        console.warn("Failed to fetch on-chain event details, returning null", err);
        return null;
      }
    },
    enabled: eventId !== null,
  });
}

export function useTicketDetails(ticketId: number | null) {
  return useQuery({
    queryKey: ["campus-ticket", ticketId],
    queryFn: async (): Promise<TicketDetails | null> => {
      if (ticketId === null) return null;
      try {
        const address = useWalletStore.getState().address || undefined;
        const res = (await readContract(
          NEXT_PUBLIC_CAMPUS_SERVICE_CONTRACT_ID,
          "get_ticket",
          [u32ToScVal(ticketId)],
          address
        )) as { id: bigint; event_id: bigint; owner: string; redeemed: boolean } | null;

        if (!res) return null;
        return {
          id: Number(res.id),
          event_id: Number(res.event_id),
          owner: String(res.owner),
          redeemed: Boolean(res.redeemed),
        };
      } catch (err) {
        console.warn("Failed to fetch on-chain ticket details, returning null", err);
        return null;
      }
    },
    enabled: ticketId !== null,
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
      const rawAmount = BigInt(Math.round(amount * 10_000_000));
      const hash = await invokeContractMethod(
        NEXT_PUBLIC_CAMPUS_SERVICE_CONTRACT_ID,
        "create_escrow",
        [addressToScVal(buyer), addressToScVal(seller), i128ToScVal(rawAmount)],
        buyer
      );
      return hash;
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ["campus-balance"] });
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
      const hash = await invokeContractMethod(
        NEXT_PUBLIC_CAMPUS_SERVICE_CONTRACT_ID,
        "release_escrow",
        [u32ToScVal(escrowId), addressToScVal(caller)],
        caller
      );
      return hash;
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
      const hash = await invokeContractMethod(
        NEXT_PUBLIC_CAMPUS_SERVICE_CONTRACT_ID,
        "refund_escrow",
        [u32ToScVal(escrowId), addressToScVal(caller)],
        caller
      );
      return hash;
    },
    onSuccess: (_, variables) => {
      queryClient.invalidateQueries({ queryKey: ["campus-escrow", variables.escrowId] });
      queryClient.invalidateQueries({ queryKey: ["campus-balance"] });
    },
  });
}

export function useCreateEventMutation() {
  return useMutation({
    mutationFn: async ({
      host,
      price,
      capacity,
    }: {
      host: string;
      price: number;
      capacity: number;
    }) => {
      const rawPrice = BigInt(Math.round(price * 10_000_000));
      const hash = await invokeContractMethod(
        NEXT_PUBLIC_CAMPUS_SERVICE_CONTRACT_ID,
        "create_event",
        [addressToScVal(host), i128ToScVal(rawPrice), u32ToScVal(capacity)],
        host
      );
      return hash;
    },
  });
}

export function useBuyTicketMutation() {
  const queryClient = useQueryClient();
  return useMutation({
    mutationFn: async ({
      eventId,
      buyer,
    }: {
      eventId: number;
      buyer: string;
    }) => {
      const hash = await invokeContractMethod(
        NEXT_PUBLIC_CAMPUS_SERVICE_CONTRACT_ID,
        "buy_ticket",
        [u32ToScVal(eventId), addressToScVal(buyer)],
        buyer
      );
      return hash;
    },
    onSuccess: (_, variables) => {
      queryClient.invalidateQueries({ queryKey: ["campus-event", variables.eventId] });
      queryClient.invalidateQueries({ queryKey: ["campus-balance"] });
    },
  });
}

export function useRedeemTicketMutation() {
  const queryClient = useQueryClient();
  return useMutation({
    mutationFn: async ({
      ticketId,
      host,
    }: {
      ticketId: number;
      host: string;
    }) => {
      const hash = await invokeContractMethod(
        NEXT_PUBLIC_CAMPUS_SERVICE_CONTRACT_ID,
        "redeem_ticket",
        [u32ToScVal(ticketId), addressToScVal(host)],
        host
      );
      return hash;
    },
    onSuccess: (_, variables) => {
      queryClient.invalidateQueries({ queryKey: ["campus-ticket", variables.ticketId] });
    },
  });
}

// --- UNIVERSITY & MEMBERSHIP HOOKS ---

export interface University {
  id: number;
  name: string;
  location: string;
  description: string;
  admin: string;
  member_count: number;
}

export interface JoinRequest {
  id: number;
  university_id: number;
  applicant: string;
  status: number;
}

export interface Invite {
  id: number;
  university_id: number;
  invitee: string;
  status: number;
}

export function useUniversities() {
  return useQuery({
    queryKey: ["universities"],
    queryFn: async (): Promise<University[]> => {
      try {
        const address = useWalletStore.getState().address || undefined;
        const res = await readContract(
          NEXT_PUBLIC_CAMPUS_SERVICE_CONTRACT_ID,
          "list_universities",
          [],
          address
        );
        return (res as University[]).map((u) => ({
          id: Number(u.id),
          name: String(u.name),
          location: String(u.location),
          description: String(u.description),
          admin: String(u.admin),
          member_count: Number(u.member_count),
        }));
      } catch (err) {
        console.warn("Failed to fetch universities", err);
        return [];
      }
    },
  });
}

export function useUniversity(id: number | null) {
  return useQuery({
    queryKey: ["university", id],
    queryFn: async (): Promise<University | null> => {
      if (id === null) return null;
      try {
        const address = useWalletStore.getState().address || undefined;
        const res = await readContract(
          NEXT_PUBLIC_CAMPUS_SERVICE_CONTRACT_ID,
          "get_university",
          [u32ToScVal(id)],
          address
        );
        const u = res as University;
        return {
          id: Number(u.id),
          name: String(u.name),
          location: String(u.location),
          description: String(u.description),
          admin: String(u.admin),
          member_count: Number(u.member_count),
        };
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
    queryFn: async (): Promise<number | null> => {
      if (!address) return null;
      try {
        const res = await readContract(
          NEXT_PUBLIC_CAMPUS_SERVICE_CONTRACT_ID,
          "get_membership",
          [addressToScVal(address)],
          address
        );
        return Number(res);
      } catch {
        return null;
      }
    },
    enabled: !!address,
  });
}

export function usePendingRequests(universityId: number | null) {
  return useQuery({
    queryKey: ["pending-requests", universityId],
    queryFn: async (): Promise<JoinRequest[]> => {
      if (universityId === null) return [];
      try {
        const address = useWalletStore.getState().address || undefined;
        const res = await readContract(
          NEXT_PUBLIC_CAMPUS_SERVICE_CONTRACT_ID,
          "list_pending_requests",
          [u32ToScVal(universityId)],
          address
        );
        return (res as JoinRequest[]).map((r) => ({
          id: Number(r.id),
          university_id: Number(r.university_id),
          applicant: String(r.applicant),
          status: Number(r.status),
        }));
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
      return invokeContractMethod(
        NEXT_PUBLIC_CAMPUS_SERVICE_CONTRACT_ID,
        "register_university",
        [addressToScVal(admin), stringToScVal(name), stringToScVal(location), stringToScVal(description)],
        admin
      );
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
      return invokeContractMethod(
        NEXT_PUBLIC_CAMPUS_SERVICE_CONTRACT_ID,
        "request_join",
        [u32ToScVal(universityId), addressToScVal(applicant)],
        applicant
      );
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
      return invokeContractMethod(
        NEXT_PUBLIC_CAMPUS_SERVICE_CONTRACT_ID,
        "approve_member",
        [u32ToScVal(requestId), addressToScVal(admin)],
        admin
      );
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
      return invokeContractMethod(
        NEXT_PUBLIC_CAMPUS_SERVICE_CONTRACT_ID,
        "deny_member",
        [u32ToScVal(requestId), addressToScVal(admin)],
        admin
      );
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
      return invokeContractMethod(
        NEXT_PUBLIC_CAMPUS_SERVICE_CONTRACT_ID,
        "invite_member",
        [u32ToScVal(universityId), addressToScVal(invitee), addressToScVal(admin)],
        admin
      );
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
      return invokeContractMethod(
        NEXT_PUBLIC_CAMPUS_SERVICE_CONTRACT_ID,
        "accept_invite",
        [u32ToScVal(inviteId), addressToScVal(invitee)],
        invitee
      );
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
      return invokeContractMethod(
        NEXT_PUBLIC_CAMPUS_SERVICE_CONTRACT_ID,
        "leave_university",
        [addressToScVal(member)],
        member
      );
    },
    onSuccess: (_, variables) => {
      queryClient.invalidateQueries({ queryKey: ["membership", variables.member] });
    },
  });
}

export function useClaimFaucetMutation() {
  const queryClient = useQueryClient();
  return useMutation({
    mutationFn: async ({ recipient }: { recipient: string }) => {
      return invokeContractMethod(
        NEXT_PUBLIC_CAMPUS_SERVICE_CONTRACT_ID,
        "claim_faucet",
        [addressToScVal(recipient)],
        recipient
      );
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
    queryFn: () =>
      readContract(
        NEXT_PUBLIC_CAMPUS_SERVICE_CONTRACT_ID,
        "has_claimed_faucet",
        [addressToScVal(address!)]
      ),
    enabled: !!address,
    refetchInterval: 30000,
  });
}
