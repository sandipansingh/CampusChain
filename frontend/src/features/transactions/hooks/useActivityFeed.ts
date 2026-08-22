import { useQuery } from "@tanstack/react-query";
import { useState, useEffect, useCallback } from "react";
import { fetchLedgerEventsRaw, fetchEventsPaginated } from "../service/events";
import { DecodedEvent } from "@/shared/stellar/eventDecoder";

/** Notification panel — last ~50 events across all contracts, auto-refreshes every 15s. */
export function useLedgerEvents() {
  return useQuery({
    queryKey: ["ledger-events"],
    queryFn: () => fetchLedgerEventsRaw(),
    refetchInterval: 15_000,
  });
}

interface ActivityFeedOptions {
  /** Own-wallet address — filters to events involving this address (students, merchants, sub-roles). */
  address?: string;
  /** Campus university code — filters to all events from this campus (university admins). */
  universityCode?: string;
}

/**
 * Activity feed hook used on the Activity page.
 *
 * Behaviour:
 * - `universityCode` provided → campus-scoped feed (all members' events for that campus)
 * - `address` only → own-wallet feed (own transactions only)
 * - neither → global feed (platform admin; all events)
 */
export function useActivityFeed({ address, universityCode }: ActivityFeedOptions = {}) {
  const [events, setEvents] = useState<DecodedEvent[]>([]);
  const [loading, setLoading] = useState(true);
  const [loadingMore, setLoadingMore] = useState(false);
  const [cursor, setCursor] = useState<string | null>(null);
  const [hasMore, setHasMore] = useState(true);
  const [searchQuery, setSearchQuery] = useState("");
  const [typeFilter, setTypeFilter] = useState("all");
  const [sortBy, setSortBy] = useState<"newest" | "oldest">("newest");

  const fetchEvents = useCallback(
    async (nextCursor: string | null, isLoadMore = false) => {
      try {
        if (isLoadMore) setLoadingMore(true);
        else setLoading(true);

        const res = await fetchEventsPaginated(nextCursor, 100, address, universityCode);

        if (isLoadMore) {
          setEvents((prev) => {
            const existingIds = new Set(prev.map((e) => e.id));
            return [...prev, ...res.events.filter((e) => !existingIds.has(e.id))];
          });
        } else {
          setEvents(res.events);
        }

        setHasMore(res.hasMore);
        setCursor(res.cursor);
      } catch {
        // fail silently — stale data is fine
      } finally {
        setLoading(false);
        setLoadingMore(false);
      }
    },
    [address, universityCode]
  );

  // Initial load + re-fetch when filters change
  useEffect(() => {
    void fetchEvents(null);
  }, [fetchEvents]);

  // Auto-refresh every 30 seconds for real-time feel
  useEffect(() => {
    const interval = setInterval(() => void fetchEvents(null), 30_000);
    return () => clearInterval(interval);
  }, [fetchEvents]);

  // Instant refresh after any on-chain transaction in this session
  useEffect(() => {
    const refresh = () => void fetchEvents(null);
    window.addEventListener("campuschain:transaction-submitted", refresh);
    return () => window.removeEventListener("campuschain:transaction-submitted", refresh);
  }, [fetchEvents]);

  const filteredEvents = events.filter((e) => {
    const query = searchQuery.toLowerCase().trim();
    const matchesSearch =
      !query ||
      e.message.toLowerCase().includes(query) ||
      e.details.toLowerCase().includes(query) ||
      e.title.toLowerCase().includes(query) ||
      e.eventName.toLowerCase().includes(query) ||
      e.txHash.toLowerCase().includes(query) ||
      e.fullTxHash.toLowerCase().includes(query) ||
      (e.topicNative && e.topicNative.some((t) => String(t).toLowerCase().includes(query)));

    const matchesType = (() => {
      if (typeFilter === "all") return true;
      if (typeFilter === "role") {
        return e.type === "role" || e.type === "membership";
      }
      if (typeFilter === "order") {
        return e.type === "order";
      }
      if (typeFilter === "scholarship") {
        return e.type === "scholarship";
      }
      return e.type === typeFilter;
    })();

    return matchesSearch && matchesType;
  });

  const sortedEvents = [...filteredEvents].sort((a, b) =>
    sortBy === "newest" ? b.ledger - a.ledger : a.ledger - b.ledger
  );

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
    refresh: () => void fetchEvents(null),
    loadMore: () => {
      if (!loadingMore && hasMore) void fetchEvents(cursor, true);
    },
  };
}
