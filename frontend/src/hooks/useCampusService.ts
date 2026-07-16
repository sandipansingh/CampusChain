import { useQuery, useMutation, useQueryClient } from "@tanstack/react-query";
import {
  readContract,
  invokeContractMethod,
  addressToScVal,
  i128ToScVal,
  u32ToScVal,
  NEXT_PUBLIC_CAMPUS_SERVICE_CONTRACT_ID,
} from "@/services/contracts";

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
      const res = (await readContract(
        NEXT_PUBLIC_CAMPUS_SERVICE_CONTRACT_ID,
        "get_escrow",
        [u32ToScVal(escrowId)]
      )) as { id: bigint; buyer: string; seller: string; amount: bigint; status: number } | null;

      if (!res) return null;
      return {
        id: Number(res.id),
        buyer: String(res.buyer),
        seller: String(res.seller),
        amount: Number(res.amount) / 10_000_000,
        status: Number(res.status),
      };
    },
    enabled: escrowId !== null,
  });
}

export function useEventDetails(eventId: number | null) {
  return useQuery({
    queryKey: ["campus-event", eventId],
    queryFn: async (): Promise<EventDetails | null> => {
      if (eventId === null) return null;
      const res = (await readContract(
        NEXT_PUBLIC_CAMPUS_SERVICE_CONTRACT_ID,
        "get_event",
        [u32ToScVal(eventId)]
      )) as { id: bigint; host: string; price: bigint; capacity: number; tickets_sold: number } | null;

      if (!res) return null;
      return {
        id: Number(res.id),
        host: String(res.host),
        price: Number(res.price) / 10_000_000,
        capacity: Number(res.capacity),
        tickets_sold: Number(res.tickets_sold),
      };
    },
    enabled: eventId !== null,
  });
}

export function useTicketDetails(ticketId: number | null) {
  return useQuery({
    queryKey: ["campus-ticket", ticketId],
    queryFn: async (): Promise<TicketDetails | null> => {
      if (ticketId === null) return null;
      const res = (await readContract(
        NEXT_PUBLIC_CAMPUS_SERVICE_CONTRACT_ID,
        "get_ticket",
        [u32ToScVal(ticketId)]
      )) as { id: bigint; event_id: bigint; owner: string; redeemed: boolean } | null;

      if (!res) return null;
      return {
        id: Number(res.id),
        event_id: Number(res.event_id),
        owner: String(res.owner),
        redeemed: Boolean(res.redeemed),
      };
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
