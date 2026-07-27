import { useQuery, useMutation, useQueryClient } from "@tanstack/react-query";
import {
  fetchEvent,
  fetchTicket,
  executeCreateEvent,
  executeBuyTicket,
  executeRedeemTicket,
} from "../service/events";

export function useEventDetails(eventId: number | null, address?: string) {
  return useQuery({
    queryKey: ["campus-event", eventId, address],
    queryFn: async () => {
      if (eventId === null) return null;
      try {
        return await fetchEvent(eventId, address);
      } catch (err) {
        console.warn("Failed to fetch on-chain event details, returning null", err);
        return null;
      }
    },
    enabled: eventId !== null,
  });
}

export function useTicketDetails(ticketId: number | null, address?: string) {
  return useQuery({
    queryKey: ["campus-ticket", ticketId, address],
    queryFn: async () => {
      if (ticketId === null) return null;
      try {
        return await fetchTicket(ticketId, address);
      } catch (err) {
        console.warn("Failed to fetch on-chain ticket details, returning null", err);
        return null;
      }
    },
    enabled: ticketId !== null,
  });
}

export function useCreateEventMutation() {
  const queryClient = useQueryClient();
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
      return executeCreateEvent(host, price, capacity);
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ["campus-events"] });
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
      return executeBuyTicket(eventId, buyer);
    },
    onSuccess: (_, variables) => {
      queryClient.invalidateQueries({ queryKey: ["campus-event", variables.eventId] });
      queryClient.invalidateQueries({ queryKey: ["campus-balance", variables.buyer] });
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
      return executeRedeemTicket(ticketId, host);
    },
    onSuccess: (_, variables) => {
      queryClient.invalidateQueries({ queryKey: ["campus-ticket", variables.ticketId] });
    },
  });
}
