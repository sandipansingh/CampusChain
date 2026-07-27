"use client";

import { useState, useEffect, useCallback } from "react";
import {
  getRpcServer,
  NEXT_PUBLIC_CAMPUS_SERVICE_CONTRACT_ID,
  NEXT_PUBLIC_CAMPUS_TOKEN_CONTRACT_ID,
} from "@/services/contracts";
import { decodeEvent, DecodedEvent } from "@/services/eventDecoder";
import { logger } from "@/services/logger";

export function useLedgerEvents() {
  const [ledgerEvents, setLedgerEvents] = useState<DecodedEvent[]>([]);
  const [eventsLoading, setEventsLoading] = useState(true);

  const fetchLedgerEvents = useCallback(async () => {
    try {
      const server = getRpcServer();
      const latestLedger = await server.getLatestLedger();
      const startLedger = Math.max(1, latestLedger.sequence - 2000);

      const [sRes, tRes] = await Promise.all([
        server.getEvents({
          startLedger,
          filters: [
            {
              type: "contract",
              contractIds: [NEXT_PUBLIC_CAMPUS_SERVICE_CONTRACT_ID],
            },
          ],
          limit: 50,
        }),
        server.getEvents({
          startLedger,
          filters: [
            {
              type: "contract",
              contractIds: [NEXT_PUBLIC_CAMPUS_TOKEN_CONTRACT_ID],
            },
          ],
          limit: 50,
        }),
      ]);

      const allEvents = [...sRes.events, ...tRes.events]
        .sort((a, b) => b.ledger - a.ledger)
        .slice(0, 50);

      const decoded = allEvents
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
        .filter((e): e is DecodedEvent => e !== null);

      setLedgerEvents(decoded);
    } catch (err) {
      logger.error("Failed to fetch ledger events", err);
    } finally {
      setEventsLoading(false);
    }
  }, []);

  useEffect(() => {
    fetchLedgerEvents();
    const interval = setInterval(fetchLedgerEvents, 15000);
    return () => clearInterval(interval);
  }, [fetchLedgerEvents]);

  return {
    ledgerEvents,
    eventsLoading,
    refetchEvents: fetchLedgerEvents,
  };
}
