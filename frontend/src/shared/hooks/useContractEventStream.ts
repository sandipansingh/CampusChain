/**
 * useContractEventStream
 *
 * Polls the Soroban RPC `getEvents` endpoint using a sliding ledger cursor so
 * only NEW events are fetched each tick (not a full re-scan). When events
 * arrive they are:
 *   1. Decoded via eventDecoder.ts
 *   2. Pushed into the global ActivityFeedStore
 *   3. Mapped to React Query cache keys that are surgically invalidated
 *
 * Soroban RPC has no WebSocket event stream — cursor-based polling at 4-second
 * intervals is the production-standard approach used by Stellar Explorer.
 */
"use client";

import { useEffect, useRef } from "react";
import { useQueryClient } from "@tanstack/react-query";
import {
  getRpcServer,
  NEXT_PUBLIC_CAMPUS_SERVICE_CONTRACT_ID,
  NEXT_PUBLIC_CAMPUS_TOKEN_CONTRACT_ID,
  NEXT_PUBLIC_CAMPUS_IDENTITY_CONTRACT_ID,
  NEXT_PUBLIC_CAMPUS_ADMIN_ADDRESS,
} from "@/shared/stellar/client";
import { decodeEvent } from "@/shared/stellar/eventDecoder";
import { useActivityFeedStore } from "./useActivityFeedStore";
import { eventMonitor, captureError } from "@/shared/lib/observability";

const POLL_INTERVAL_MS = 4000;

/** Maps a decoded event name to the React Query keys that should be invalidated. */
function getCacheKeysForEvent(eventName: string): string[][] {
  switch (eventName) {
    case "transfer":
    case "mint":
    case "burn":
    case "mint_purchase":
    case "faucet":
    case "faucet_claimed":
    case "purchase_camp":
      return [["campus-balance"]];

    case "escrow_created":
    case "escrow_released":
    case "escrow_refunded":
      return [["campus-escrow"], ["marketplace-listings"]];

    case "item_listed":
    case "item_updated":
    case "item_sold":
      return [["marketplace-listings"], ["marketplace-listing"]];

    case "ticket_bought":
    case "ticket_redeemed":
    case "event_created":
      return [["campus-events"]];

    case "scholarship_applied":
    case "scholarship_reviewed":
    case "scholarship_disbursed":
      return [["campus-scholarships"], ["campus-balance"]];

    case "reward_redeemed":
    case "redemption_fulfilled":
    case "reward_created":
      return [["campus-balance"]];

    case "role_updated":
    case "role_change_approved":
    case "role_change_denied":
      return [["campus-user-role"]];

    case "UniversityRegistered":
    case "UniversityApproved":
    case "UniversityRejected":
      return [["universities"], ["campus-university"]];

    case "ProfileSubmittedForVerification":
    case "ProfileVerified":
    case "ProfileRejected":
      return [["university-profiles"], ["campus-profile"], ["campus-role"]];

    default:
      return [];
  }
}

import { useCampusProfile } from "@/features/wallet/hooks/useWallet";

export function useContractEventStream(address: string | null | undefined) {
  const queryClient = useQueryClient();
  const addItems = useActivityFeedStore((s) => s.addItems);
  const { data: profile } = useCampusProfile(address ?? undefined);

  // Track the highest ledger sequence we have already processed.
  // Initialized to 0 — first fetch will anchor to (latestLedger - 60) so we
  // don't flood the feed with stale history on connect.
  const lastLedgerRef = useRef<number>(0);
  const isRunningRef = useRef<boolean>(false);

  useEffect(() => {
    if (!address) {
      lastLedgerRef.current = 0;
      return;
    }

    let intervalId: ReturnType<typeof setInterval> | null = null;
    let destroyed = false;

    const poll = async () => {
      if (isRunningRef.current) return; // skip if previous poll is still in flight
      isRunningRef.current = true;
      try {
        const server = getRpcServer();

        // On the very first poll, anchor to (latestLedger - 60) so we show
        // roughly the last ~5 minutes of activity without blasting old history.
        if (lastLedgerRef.current === 0) {
          const latest = await server.getLatestLedger();
          lastLedgerRef.current = Math.max(1, latest.sequence - 60);
        }

        const startLedger = lastLedgerRef.current + 1;
        const baseFilters = [
          {
            type: "contract" as const,
            contractIds: [NEXT_PUBLIC_CAMPUS_SERVICE_CONTRACT_ID],
          },
          {
            type: "contract" as const,
            contractIds: [NEXT_PUBLIC_CAMPUS_TOKEN_CONTRACT_ID],
          },
          {
            type: "contract" as const,
            contractIds: [NEXT_PUBLIC_CAMPUS_IDENTITY_CONTRACT_ID],
          },
        ];

        const [sRes, tRes, iRes] = await Promise.all([
          server.getEvents({ startLedger, filters: [baseFilters[0]], limit: 30 }),
          server.getEvents({ startLedger, filters: [baseFilters[1]], limit: 30 }),
          server.getEvents({ startLedger, filters: [baseFilters[2]], limit: 30 }),
        ]);

        if (destroyed) return;

        const rawEvents = [...sRes.events, ...tRes.events, ...iRes.events].sort(
          (a, b) => a.ledger - b.ledger
        );

        if (rawEvents.length === 0) return;

        // Advance cursor to the highest ledger we saw
        const maxLedger = rawEvents[rawEvents.length - 1].ledger;
        lastLedgerRef.current = Math.max(lastLedgerRef.current, maxLedger);

        // Decode events
        const decoded = rawEvents
          .map((evt) => {
            try {
              return decodeEvent({
                id: evt.id,
                ledger: evt.ledger,
                ledgerClosedAt: evt.ledgerClosedAt,
                txHash: evt.txHash,
                topic: evt.topic as unknown[],
                value: evt.value as unknown,
              });
            } catch {
              return null;
            }
          })
          .filter((e): e is NonNullable<typeof e> => e !== null);

        if (decoded.length === 0) return;

        // Filter events client-side based on user context before pushing to notifications bell
        const isPlatformAdmin = address === NEXT_PUBLIC_CAMPUS_ADMIN_ADDRESS;
        const myUnivCode = profile?.universityCode?.toUpperCase() ?? "";

        const filteredDecoded = decoded.filter((evt) => {
          if (
            evt.eventName === "UniversityRegistered" ||
            evt.eventName === "UniversityApproved" ||
            evt.eventName === "UniversityRejected" ||
            evt.eventName === "ProfileSubmittedForVerification" ||
            evt.eventName === "ProfileVerified" ||
            evt.eventName === "ProfileRejected"
          ) {
            if (isPlatformAdmin) {
              return (
                evt.eventName === "UniversityRegistered" ||
                evt.eventName === "UniversityApproved" ||
                evt.eventName === "UniversityRejected"
              );
            }

            if (profile?.role === 4) {
              // University Admin:
              // - See approval/rejection for their own university code
              // - See new profiles submitted under their university code
              // - See verification completions for their university code
              const eventCode = evt.details.toUpperCase();
              return eventCode === myUnivCode;
            }

            // Student/Merchant/Organizer:
            // - See profile approval or rejection matching their own wallet address
            if (evt.eventName === "ProfileVerified" || evt.eventName === "ProfileRejected") {
              const eventTarget = evt.details;
              return eventTarget.toUpperCase() === address.toUpperCase();
            }

            return false;
          }
          return true; // keep standard transactions / escrows
        });

        if (filteredDecoded.length > 0) {
          // Push filtered events to feed
          addItems(filteredDecoded);
        }

        // Emit a structured batch log entry + per-event entries through the monitor
        eventMonitor.recordBatch(
          decoded.map((evt) => ({
            eventName: evt.eventName,
            type: evt.type,
            ledger: evt.ledger,
            txHash: evt.fullTxHash,
            details: evt.details,
            ledgerClosedAt: evt.ledgerClosedAt,
          })),
          address ?? undefined
        );

        // Collect unique cache keys to invalidate (deduplicate)
        const keysToInvalidate = new Set<string>();
        for (const evt of decoded) {
          for (const key of getCacheKeysForEvent(evt.eventName)) {
            keysToInvalidate.add(JSON.stringify(key));
          }
        }

        for (const keyJson of keysToInvalidate) {
          const queryKey = JSON.parse(keyJson) as string[];
          queryClient.invalidateQueries({ queryKey });
        }
      } catch (err: unknown) {
        // Log poll failures — network blips, rate limits, etc.
        // Do not re-throw: the next interval tick will retry automatically.
        captureError(err, { action: "event_stream_poll", contract: "soroban-rpc", walletAddress: address ?? undefined });
      } finally {
        isRunningRef.current = false;
      }
    };

    // Kick off immediately, then on interval
    poll();
    intervalId = setInterval(poll, POLL_INTERVAL_MS);

    return () => {
      destroyed = true;
      if (intervalId) clearInterval(intervalId);
    };
  }, [address, profile, addItems, queryClient]);
}
