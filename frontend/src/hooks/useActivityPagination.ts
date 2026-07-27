"use client";

import { useState, useEffect, useCallback } from "react";
import {
  getRpcServer,
  NEXT_PUBLIC_CAMPUS_SERVICE_CONTRACT_ID,
  NEXT_PUBLIC_CAMPUS_TOKEN_CONTRACT_ID,
} from "@/services/contracts";
import { decodeEvent, DecodedEvent } from "@/services/eventDecoder";

export function useActivityPagination() {
  const [events, setEvents] = useState<DecodedEvent[]>([]);
  const [loading, setLoading] = useState(true);
  const [loadingMore, setLoadingMore] = useState(false);
  const [cursor, setCursor] = useState<string | null>(null);
  const [hasMore, setHasMore] = useState(true);
  const [searchQuery, setSearchQuery] = useState("");
  const [typeFilter, setTypeFilter] = useState("all");

  const fetchEvents = useCallback(async (isLoadMore = false) => {
    if (isLoadMore && loadingMore) return;
    try {
      if (isLoadMore) setLoadingMore(true);
      else setLoading(true);

      const server = getRpcServer();
      const baseFilters = [
        { type: "contract" as const, contractIds: [NEXT_PUBLIC_CAMPUS_SERVICE_CONTRACT_ID] },
        { type: "contract" as const, contractIds: [NEXT_PUBLIC_CAMPUS_TOKEN_CONTRACT_ID] },
      ];

      let res;
      if (isLoadMore && cursor) {
        res = await server.getEvents({ filters: baseFilters, cursor, limit: 40 });
      } else {
        const latestLedger = await server.getLatestLedger();
        res = await server.getEvents({
          startLedger: Math.max(1, latestLedger.sequence - 5000),
          filters: baseFilters,
          limit: 40,
        });
      }

      const decodedEvents = res.events
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

      if (isLoadMore) {
        setEvents((prev) => {
          const existingIds = new Set(prev.map((e) => e.id));
          const newEvents = decodedEvents.filter((e) => !existingIds.has(e.id));
          return [...prev, ...newEvents];
        });
      } else {
        setEvents(decodedEvents);
      }

      setHasMore(res.events.length >= 40);
      setCursor(res.cursor ?? null);
    } catch {
      // silent
    } finally {
      setLoading(false);
      setLoadingMore(false);
    }
  }, [cursor, loadingMore]);

  useEffect(() => {
    fetchEvents(false);
  }, []); // eslint-disable-line react-hooks/exhaustive-deps

  const filteredEvents = events.filter((e) => {
    const query = searchQuery.toLowerCase().trim();
    const matchesSearch = !query ||
      e.message.toLowerCase().includes(query) ||
      e.details.toLowerCase().includes(query) ||
      e.title.toLowerCase().includes(query) ||
      e.txHash.toLowerCase().includes(query) ||
      e.fullTxHash.toLowerCase().includes(query);
    const matchesType = typeFilter === "all" || e.type === typeFilter;
    return matchesSearch && matchesType;
  });

  return {
    events,
    filteredEvents,
    loading,
    loadingMore,
    hasMore,
    searchQuery,
    setSearchQuery,
    typeFilter,
    setTypeFilter,
    loadMore: () => fetchEvents(true),
  };
}
