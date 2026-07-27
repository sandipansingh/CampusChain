/**
 * useActivityFeedStore.test.ts
 *
 * Unit tests for the global Zustand activity feed store, covering:
 *   - Adding items with deduplication by event id
 *   - Unread count increment and cap at 99
 *   - markAllRead resets unread to 0 without removing items
 *   - clear() removes all items and resets unread
 *   - 100-item capacity cap (oldest items are dropped)
 */
import { describe, it, expect, beforeEach } from "vitest";
import { useActivityFeedStore } from "@/shared/hooks/useActivityFeedStore";
import type { DecodedEvent } from "@/shared/stellar/eventDecoder";

function makeEvent(id: string, overrides: Partial<DecodedEvent> = {}): DecodedEvent {
  return {
    id,
    eventName: "transfer",
    type: "transfer",
    title: "Token Transfer",
    message: "A → B",
    details: "10.00 CAMP",
    txHash: "abc...def",
    fullTxHash: "abc123def456",
    timestamp: "just now",
    ledger: 5_000_000,
    color: "blue",
    icon: "transfer",
    ledgerClosedAt: new Date().toISOString(),
    ...overrides,
  };
}

describe("useActivityFeedStore", () => {
  beforeEach(() => {
    useActivityFeedStore.setState({ items: [], unreadCount: 0 });
  });

  it("adds items to the store", () => {
    useActivityFeedStore.getState().addItems([makeEvent("evt-1"), makeEvent("evt-2")]);
    const { items, unreadCount } = useActivityFeedStore.getState();
    expect(items).toHaveLength(2);
    expect(unreadCount).toBe(2);
  });

  it("deduplicates items with the same id", () => {
    useActivityFeedStore.getState().addItems([makeEvent("evt-dup")]);
    useActivityFeedStore.getState().addItems([makeEvent("evt-dup")]);
    expect(useActivityFeedStore.getState().items).toHaveLength(1);
    expect(useActivityFeedStore.getState().unreadCount).toBe(1);
  });

  it("prepends new items so newest appears first", () => {
    useActivityFeedStore.getState().addItems([makeEvent("evt-old")]);
    useActivityFeedStore.getState().addItems([makeEvent("evt-new")]);
    const { items } = useActivityFeedStore.getState();
    expect(items[0].id).toBe("evt-new");
    expect(items[1].id).toBe("evt-old");
  });

  it("caps unreadCount at 99", () => {
    const batch = Array.from({ length: 105 }, (_, i) => makeEvent(`evt-${i}`));
    useActivityFeedStore.getState().addItems(batch);
    expect(useActivityFeedStore.getState().unreadCount).toBe(99);
  });

  it("caps stored items at 100", () => {
    const batch = Array.from({ length: 110 }, (_, i) => makeEvent(`evt-${i}`));
    useActivityFeedStore.getState().addItems(batch);
    expect(useActivityFeedStore.getState().items).toHaveLength(100);
  });

  it("markAllRead sets unreadCount to 0 but keeps items", () => {
    useActivityFeedStore.getState().addItems([makeEvent("evt-1"), makeEvent("evt-2")]);
    useActivityFeedStore.getState().markAllRead();
    const { items, unreadCount } = useActivityFeedStore.getState();
    expect(items).toHaveLength(2);
    expect(unreadCount).toBe(0);
  });

  it("clear() removes all items and resets unreadCount", () => {
    useActivityFeedStore.getState().addItems([makeEvent("evt-1")]);
    useActivityFeedStore.getState().clear();
    const { items, unreadCount } = useActivityFeedStore.getState();
    expect(items).toHaveLength(0);
    expect(unreadCount).toBe(0);
  });

  it("addItems with empty array is a no-op", () => {
    useActivityFeedStore.getState().addItems([makeEvent("evt-1")]);
    const before = useActivityFeedStore.getState().items.length;
    useActivityFeedStore.getState().addItems([]);
    expect(useActivityFeedStore.getState().items.length).toBe(before);
  });
});
