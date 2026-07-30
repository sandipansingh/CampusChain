import { create } from "zustand";
import { DecodedEvent } from "@/shared/stellar/eventDecoder";

const MAX_NOTIFICATION_ITEMS = 100;

export interface NotificationItem extends DecodedEvent {
  read: boolean;
}

interface NotificationState {
  items: NotificationItem[];
  unreadCount: number;

  addItems: (newItems: DecodedEvent[]) => void;
  markAllRead: () => void;
  markRead: (id: string) => void;
  dismiss: (id: string) => void;
  clear: () => void;
}

export const useNotificationStore = create<NotificationState>((set, get) => ({
  items: [],
  unreadCount: 0,

  addItems: (newItems) => {
    if (newItems.length === 0) return;
    const existingIds = new Set(get().items.map((e) => e.id));
    const fresh = newItems
      .filter((e) => !existingIds.has(e.id))
      .map((e) => ({ ...e, read: false }));
    
    if (fresh.length === 0) return;

    set((state) => ({
      // Newest first, capped at MAX_NOTIFICATION_ITEMS
      items: [...fresh, ...state.items].slice(0, MAX_NOTIFICATION_ITEMS),
      unreadCount: Math.min(state.unreadCount + fresh.length, 99),
    }));
  },

  markAllRead: () => {
    set((state) => ({
      items: state.items.map((item) => ({ ...item, read: true })),
      unreadCount: 0,
    }));
  },

  markRead: (id) => {
    set((state) => {
      const isUnread = state.items.find((item) => item.id === id && !item.read);
      return {
        items: state.items.map((item) =>
          item.id === id ? { ...item, read: true } : item
        ),
        unreadCount: isUnread ? Math.max(0, state.unreadCount - 1) : state.unreadCount,
      };
    });
  },

  dismiss: (id) => {
    set((state) => {
      const isUnread = state.items.find((item) => item.id === id && !item.read);
      return {
        items: state.items.filter((item) => item.id !== id),
        unreadCount: isUnread ? Math.max(0, state.unreadCount - 1) : state.unreadCount,
      };
    });
  },

  clear: () => set({ items: [], unreadCount: 0 }),
}));
