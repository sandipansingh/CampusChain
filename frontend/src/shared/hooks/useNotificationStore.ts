import { create } from "zustand";
import { DecodedEvent } from "@/shared/stellar/eventDecoder";

const MAX_FEED_ITEMS = 100;

interface ActivityFeedState {
  items: DecodedEvent[];
  unreadCount: number;

  addItems: (newItems: DecodedEvent[]) => void;
  markAllRead: () => void;
  clear: () => void;
}

export const useActivityFeedStore = create<ActivityFeedState>((set, get) => ({
  items: [],
  unreadCount: 0,

  addItems: (newItems) => {
    if (newItems.length === 0) return;
    const existingIds = new Set(get().items.map((e) => e.id));
    const fresh = newItems.filter((e) => !existingIds.has(e.id));
    if (fresh.length === 0) return;

    set((state) => ({
      // Newest first, capped at MAX_FEED_ITEMS
      items: [...fresh, ...state.items].slice(0, MAX_FEED_ITEMS),
      unreadCount: Math.min(state.unreadCount + fresh.length, 99),
    }));
  },

  markAllRead: () => set({ unreadCount: 0 }),

  clear: () => set({ items: [], unreadCount: 0 }),
}));
