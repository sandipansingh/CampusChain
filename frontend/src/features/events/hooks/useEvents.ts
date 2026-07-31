import { useQuery, useMutation, useQueryClient } from "@tanstack/react-query";
import {
  fetchEvent,
  fetchEvents,
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

import { useCampusProfile } from "@/features/wallet/hooks/useWallet";
import { fetchUserProfile } from "@/features/wallet/service/campusIdentity";

export function useEvents(address?: string) {
  const { data: profile } = useCampusProfile(address ?? null);
  const myUnivCode = profile?.universityCode?.toUpperCase() ?? "";

  return useQuery({
    queryKey: ["campus-events", address, myUnivCode],
    queryFn: async () => {
      const events = await fetchEvents(0, 50, address);
      if (!address) return events;
      if (!myUnivCode) return []; // if current user has no approved university profile, show empty events

      const filtered = [];
      for (const item of events) {
        try {
          const hostProfile = await fetchUserProfile(item.host, address);
          if (hostProfile && hostProfile.universityCode?.toUpperCase() === myUnivCode) {
            filtered.push(item);
          }
        } catch {
          // ignore profile fetch issues
        }
      }
      return filtered;
    },
    enabled: address === undefined ? true : !!profile,
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
      queryClient.invalidateQueries({ queryKey: ["campus-events"] });
      queryClient.invalidateQueries({ queryKey: ["campus-balance", variables.buyer] });
      if (typeof window !== "undefined") window.dispatchEvent(new Event("campuschain:transaction-submitted"));
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
