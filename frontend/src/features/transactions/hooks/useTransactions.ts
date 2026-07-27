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

      const res = await fetchEventsPaginated(isLoadMore ? cursor : null, 40);

      if (isLoadMore) {
        setEvents((prev) => {
          const existingIds = new Set(prev.map((e) => e.id));
          const newEvents = res.events.filter((e) => !existingIds.has(e.id));
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
