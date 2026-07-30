/**
 * useNotificationStore.test.ts
 *
 * Unit tests for the global Zustand notifications store, covering:
 *   - Adding items with deduplication by event id
 *   - Unread count increment and cap at 99
 *   - markAllRead resets unread to 0 and marks all read: true
 *   - markRead(id) marks single item as read and decrements unreadCount
 *   - dismiss(id) removes item from list and handles unreadCount decrement
 *   - clear() removes all items and resets unread
 *   - 100-item capacity cap (oldest items are dropped)
 */
import { describe, it, expect, beforeEach } from "vitest";
import { useNotificationStore } from "@/shared/hooks/useNotificationStore";
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

describe("useNotificationStore", () => {
  beforeEach(() => {
    useNotificationStore.setState({ items: [], unreadCount: 0 });
  });

  it("adds items to the store with read=false", () => {
    useNotificationStore.getState().addItems([makeEvent("evt-1"), makeEvent("evt-2")]);
    const { items, unreadCount } = useNotificationStore.getState();
    expect(items).toHaveLength(2);
    expect(items[0].read).toBe(false);
    expect(items[1].read).toBe(false);
    expect(unreadCount).toBe(2);
  });

  it("deduplicates items with the same id", () => {
    useNotificationStore.getState().addItems([makeEvent("evt-dup")]);
    useNotificationStore.getState().addItems([makeEvent("evt-dup")]);
    expect(useNotificationStore.getState().items).toHaveLength(1);
    expect(useNotificationStore.getState().unreadCount).toBe(1);
  });

  it("prepends new items so newest appears first", () => {
    useNotificationStore.getState().addItems([makeEvent("evt-old")]);
    useNotificationStore.getState().addItems([makeEvent("evt-new")]);
    const { items } = useNotificationStore.getState();
    expect(items[0].id).toBe("evt-new");
    expect(items[1].id).toBe("evt-old");
  });

  it("caps unreadCount at 99", () => {
    const batch = Array.from({ length: 105 }, (_, i) => makeEvent(`evt-${i}`));
    useNotificationStore.getState().addItems(batch);
    expect(useNotificationStore.getState().unreadCount).toBe(99);
  });

  it("caps stored items at 100", () => {
    const batch = Array.from({ length: 110 }, (_, i) => makeEvent(`evt-${i}`));
    useNotificationStore.getState().addItems(batch);
    expect(useNotificationStore.getState().items).toHaveLength(100);
  });

  it("markAllRead sets unreadCount to 0 and all read flag to true", () => {
    useNotificationStore.getState().addItems([makeEvent("evt-1"), makeEvent("evt-2")]);
    useNotificationStore.getState().markAllRead();
    const { items, unreadCount } = useNotificationStore.getState();
    expect(items).toHaveLength(2);
    expect(items[0].read).toBe(true);
    expect(items[1].read).toBe(true);
    expect(unreadCount).toBe(0);
  });

  it("markRead(id) marks single item as read and decrements unreadCount", () => {
    useNotificationStore.getState().addItems([makeEvent("evt-1"), makeEvent("evt-2")]);
    useNotificationStore.getState().markRead("evt-1");
    const { items, unreadCount } = useNotificationStore.getState();
    expect(items.find(i => i.id === "evt-1")?.read).toBe(true);
    expect(items.find(i => i.id === "evt-2")?.read).toBe(false);
    expect(unreadCount).toBe(1);
  });

  it("dismiss(id) removes item from list and decrements unreadCount if it was unread", () => {
    useNotificationStore.getState().addItems([makeEvent("evt-1"), makeEvent("evt-2")]);
    useNotificationStore.getState().dismiss("evt-1");
    const { items, unreadCount } = useNotificationStore.getState();
    expect(items).toHaveLength(1);
    expect(items.find(i => i.id === "evt-1")).toBeUndefined();
    expect(unreadCount).toBe(1);
  });

  it("clear() removes all items and resets unreadCount", () => {
    useNotificationStore.getState().addItems([makeEvent("evt-1")]);
    useNotificationStore.getState().clear();
    const { items, unreadCount } = useNotificationStore.getState();
    expect(items).toHaveLength(0);
    expect(unreadCount).toBe(0);
  });

  it("addItems with empty array is a no-op", () => {
    useNotificationStore.getState().addItems([makeEvent("evt-1")]);
    const before = useNotificationStore.getState().items.length;
    useNotificationStore.getState().addItems([]);
    expect(useNotificationStore.getState().items.length).toBe(before);
  });
});
