import { useQuery } from "@tanstack/react-query";
import { useState, useEffect, useCallback } from "react";
import { fetchLedgerEventsRaw, fetchEventsPaginated } from "../service/events";
import { DecodedEvent } from "@/shared/stellar/eventDecoder";

export function useLedgerEvents() {
  return useQuery({
    queryKey: ["ledger-events"],
    queryFn: async () => {
      return fetchLedgerEventsRaw();
    },
    refetchInterval: 15000,
  });
}

export function useActivityFeed(address?: string) {
  const [events, setEvents] = useState<DecodedEvent[]>([]);
  const [loading, setLoading] = useState(true);
  const [loadingMore, setLoadingMore] = useState(false);
  const [cursor, setCursor] = useState<string | null>(null);
  const [hasMore, setHasMore] = useState(true);
  const [searchQuery, setSearchQuery] = useState("");
  const [typeFilter, setTypeFilter] = useState("all");
  const [sortBy, setSortBy] = useState<"newest" | "oldest">("newest");

  const fetchEvents = useCallback(async (nextCursor: string | null, isLoadMore = false) => {
    try {
      if (isLoadMore) setLoadingMore(true);
      else setLoading(true);

      const res = await fetchEventsPaginated(nextCursor, 40, address);

      if (isLoadMore) {
        setEvents((prev) => {
          const existingIds = new Set(prev.map((e: DecodedEvent) => e.id));
          const newEvents = res.events.filter((e: DecodedEvent) => !existingIds.has(e.id));
          return [...prev, ...newEvents];
        });
      } else {
        setEvents(res.events);
      }

      setHasMore(res.hasMore);
      setCursor(res.cursor);
    } catch {
      // silent
    } finally {
      setLoading(false);
      setLoadingMore(false);
    }
  }, [address]);

  useEffect(() => {
    void fetchEvents(null);
  }, [address, fetchEvents]);

  useEffect(() => {
    const refresh = () => void fetchEvents(null);
    window.addEventListener("campuschain:transaction-submitted", refresh);
    return () => window.removeEventListener("campuschain:transaction-submitted", refresh);
  }, [fetchEvents]);

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

  const sortedEvents = [...filteredEvents].sort((a, b) => {
    if (sortBy === "newest") {
      return b.ledger - a.ledger;
    } else {
      return a.ledger - b.ledger;
    }
  });

  return {
    events,
    filteredEvents: sortedEvents,
    loading,
    loadingMore,
    hasMore,
    searchQuery,
    setSearchQuery,
    typeFilter,
    setTypeFilter,
    sortBy,
    setSortBy,
    loadMore: () => {
      if (!loadingMore && hasMore) void fetchEvents(cursor, true);
    },
  };
}
