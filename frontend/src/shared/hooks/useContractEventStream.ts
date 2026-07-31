/**
 * useContractEventStream
 *
 * Polls the Soroban RPC `getEvents` endpoint using a sliding ledger cursor so
 * only NEW events are fetched each tick (not a full re-scan). When events
 * arrive they are:
 *   1. Decoded via eventDecoder.ts
 *   2. Pushed into the global NotificationStore
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
  getEventsSafe,
} from "@/shared/stellar/client";
import { decodeEvent, shortAddr } from "@/shared/stellar/eventDecoder";
import { useNotificationStore } from "./useNotificationStore";
import { eventMonitor, captureError } from "@/shared/lib/observability";
import { fetchFoodOrder } from "@/features/food-ordering/service";
import { FoodOrderStatus, FoodOrderStatusLabels } from "@/features/food-ordering/types";
import { fetchUserProfile } from "@/features/wallet/service/campusIdentity";

const POLL_INTERVAL_MS = 4000;

function getCacheKeysForEvent(eventName: string): string[][] {
  switch (eventName) {
    case "transfer":
    case "mint_purchase":
    case "burn":
      return [["campus-balance"], ["ledger-events"]];

    case "UniversityRegistered":
    case "UniversityApproved":
    case "UniversityRejected":
    case "UniversitySuspended":
      return [["universities"], ["ledger-events"]];

    case "ProfileSubmittedForVerification":
    case "ProfileVerified":
    case "ProfileRejected":
      return [["university-profiles"], ["campus-profile"], ["campus-role"], ["ledger-events"]];

    case "OrderPlaced":
      return [["food-orders"], ["ledger-events"]];

    case "OrderStatusChanged":
      return [["food-orders"], ["campus-balance"], ["ledger-events"]];

    default:
      return [];
  }
}

import { useCampusProfile } from "@/features/wallet/hooks/useWallet";

export function useContractEventStream(address: string | null | undefined) {
  const queryClient = useQueryClient();
  const addItems = useNotificationStore((s) => s.addItems);
  const { data: profile } = useCampusProfile(address ?? null);

  // Track the highest ledger sequence we have already processed.
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

        const [sRes, tRes, iRes] = (await Promise.all([
          getEventsSafe(server, { startLedger, filters: [baseFilters[0]], limit: 30 }),
          getEventsSafe(server, { startLedger, filters: [baseFilters[1]], limit: 30 }),
          getEventsSafe(server, { startLedger, filters: [baseFilters[2]], limit: 30 }),
        ])) as [
          { events: { id: string; ledger: number; ledgerClosedAt: string; txHash: string; topic: unknown[]; value: unknown }[] },
          { events: { id: string; ledger: number; ledgerClosedAt: string; txHash: string; topic: unknown[]; value: unknown }[] },
          { events: { id: string; ledger: number; ledgerClosedAt: string; txHash: string; topic: unknown[]; value: unknown }[] }
        ];

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

        // Filter events client-side based on user context to yield PERSONAL notifications only
        const isPlatformAdmin = address === NEXT_PUBLIC_CAMPUS_ADMIN_ADDRESS;
        const myUnivCode = profile?.universityCode?.toUpperCase() ?? "";

        const filteredDecoded: typeof decoded = [];
        for (const evt of decoded) {
          // 1. Platform Admin personal notifications (University Claims Queue)
          if (isPlatformAdmin) {
            if (evt.eventName === "UniversityRegistered") {
              evt.title = "University Registration Claim";
              evt.message = `New university registered: ${evt.details}`;
              filteredDecoded.push(evt);
            }
            continue;
          }

          // 2. University Admin personal notifications (New Verification Requests)
          if (profile?.role === 4) {
            if (evt.eventName === "ProfileSubmittedForVerification") {
              const eventCode = evt.details.toUpperCase();
              if (eventCode === myUnivCode) {
                try {
                  const applicantAddress = typeof evt.topicNative?.[1] === "string" ? evt.topicNative[1] : "";
                  const applicantProfile = await fetchUserProfile(applicantAddress);
                  const applicantName = applicantProfile?.fullName || shortAddr(applicantAddress);
                  evt.title = "Verification Request";
                  evt.message = `New verification request from ${applicantName}`;
                  filteredDecoded.push(evt);
                } catch (err) {
                  console.warn("Failed fetching applicant profile for notification", err);
                  evt.title = "Verification Request";
                  evt.message = `New verification request from ${shortAddr(evt.topicNative?.[1] as string)}`;
                  filteredDecoded.push(evt);
                }
              }
            }
            continue;
          }

          // 3. User Identity personal notifications (Student/Merchant/Organizer Profile Verification status)
          if (evt.eventName === "ProfileVerified" || evt.eventName === "ProfileRejected") {
            const eventTarget = evt.details;
            if (eventTarget.toUpperCase() === address.toUpperCase()) {
              evt.title = evt.eventName === "ProfileVerified" ? "Profile Verified" : "Profile Rejected";
              evt.message = evt.eventName === "ProfileVerified"
                ? "Your profile has been verified"
                : "Your profile was rejected";
              filteredDecoded.push(evt);
            }
            continue;
          }

          // 4. Token Transfer personal notifications (CAMP sent/received)
          if (evt.eventName === "transfer" || evt.eventName === "mint_purchase") {
            const from = typeof evt.topicNative?.[1] === "string" ? evt.topicNative[1] : "";
            const to = typeof evt.topicNative?.[2] === "string" ? evt.topicNative[2] : "";

            if (to.toLowerCase() === address.toLowerCase()) {
              evt.title = "CAMP Received";
              evt.message = `You received ${evt.details} from ${shortAddr(from)}`;
              evt.color = "emerald";
              filteredDecoded.push(evt);
            } else if (from.toLowerCase() === address.toLowerCase()) {
              evt.title = "CAMP Sent";
              evt.message = `You successfully sent ${evt.details} to ${shortAddr(to)}`;
              evt.color = "blue";
              filteredDecoded.push(evt);
            }
            continue;
          }

          // 5. Food Ordering personal notifications (Student Order Tracking & Merchant Canteen management)
          if (evt.eventName === "OrderPlaced") {
            try {
              const orderId = Number(evt.topicNative?.[1]);
              if (orderId) {
                const order = await fetchFoodOrder(orderId, address);
                if (order && order.merchant.toLowerCase() === address.toLowerCase()) {
                  evt.title = "New Incoming Order";
                  evt.message = `Order #${orderId} was placed.`;
                  filteredDecoded.push(evt);
                }
              }
            } catch (err) {
              console.warn("Failed filtering OrderPlaced event", err);
            }
            continue;
          }

          if (evt.eventName === "OrderStatusChanged") {
            try {
              const orderId = Number(evt.topicNative?.[1]);
              if (orderId) {
                const order = await fetchFoodOrder(orderId, address);
                if (order) {
                  if (order.student.toLowerCase() === address.toLowerCase()) {
                    if (order.status === FoodOrderStatus.ReadyForPickup) {
                      evt.title = "Order Ready!";
                      evt.message = `Your order #${orderId} is ready for pickup!`;
                      evt.color = "emerald";
                    } else if (order.status === FoodOrderStatus.Preparing) {
                      evt.title = "Preparing Order";
                      evt.message = `Your order #${orderId} is now preparing.`;
                      evt.color = "amber";
                    } else if (order.status === FoodOrderStatus.Cancelled) {
                      evt.title = "Order Cancelled";
                      evt.message = `Your order #${orderId} has been cancelled.`;
                      evt.color = "orange";
                    } else {
                      evt.title = "Order Update";
                      evt.message = `Order #${orderId} status changed to ${FoodOrderStatusLabels[order.status]}.`;
                    }
                    filteredDecoded.push(evt);
                  } else if (order.merchant.toLowerCase() === address.toLowerCase()) {
                    evt.title = "Order Update";
                    evt.message = `Order #${orderId} status changed to ${FoodOrderStatusLabels[order.status]}.`;
                    filteredDecoded.push(evt);
                  }
                }
              }
            } catch (err) {
              console.warn("Failed filtering OrderStatusChanged event", err);
            }
            continue;
          }
        }

        if (filteredDecoded.length > 0) {
          // Push filtered events to personal notification store
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
        // Log poll failures
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
