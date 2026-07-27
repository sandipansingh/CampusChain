"use client";

import { useState, useEffect } from "react";
import { useWalletStore } from "@/state/useWalletStore";
import { useTransactionStore } from "@/state/useTransactionStore";
import {
  getRpcServer,
  NEXT_PUBLIC_CAMPUS_SERVICE_CONTRACT_ID,
  NEXT_PUBLIC_CAMPUS_TOKEN_CONTRACT_ID,
} from "@/services/contracts";
import { scValToNative } from "@stellar/stellar-sdk";
import { logger } from "@/services/logger";

export interface NotificationItem {
  id: string;
  type: "TRANSFER" | "ESCROW" | "TICKET" | "ROLE" | "SYSTEM";
  title: string;
  description: string;
  timestamp: string;
  read: boolean;
  status: "success" | "warning" | "info";
}

export function useUserNotifications() {
  const address = useWalletStore((state) => state.address);
  const sessionTransactions = useTransactionStore((state) => state.transactions);
  const clearTransactions = useTransactionStore((state) => state.clearTransactions);
  const [notifications, setNotifications] = useState<NotificationItem[]>([]);
  const [loading, setLoading] = useState(true);

  // Filters state
  const [searchQuery, setSearchQuery] = useState("");
  const [typeFilter, setTypeFilter] = useState("all");

  useEffect(() => {
    async function fetchLedgerNotifications() {
      if (!address) {
        setNotifications([]);
        setLoading(false);
        return;
      }

      try {
        const server = getRpcServer();
        const latestLedger = await server.getLatestLedger();
        const startLedger = Math.max(1, latestLedger.sequence - 1000);

        // Fetch events from both contracts
        const [serviceEventsRes, tokenEventsRes] = await Promise.all([
          server.getEvents({
            startLedger,
            filters: [{ type: "contract", contractIds: [NEXT_PUBLIC_CAMPUS_SERVICE_CONTRACT_ID] }],
            limit: 15,
          }),
          server.getEvents({
            startLedger,
            filters: [{ type: "contract", contractIds: [NEXT_PUBLIC_CAMPUS_TOKEN_CONTRACT_ID] }],
            limit: 15,
          }),
        ]);

        const allEvents = [...serviceEventsRes.events, ...tokenEventsRes.events].sort(
          (a, b) => b.ledger - a.ledger
        );

        const realNotifications: NotificationItem[] = [];

        // Helper to check if address exists in scval native representation
        const matchAddress = (val: unknown): boolean => {
          if (typeof val === "string") return val === address;
          if (Array.isArray(val)) return val.some((v) => matchAddress(v));
          if (val && typeof val === "object") {
            return Object.values(val as Record<string, unknown>).some((v) => matchAddress(v));
          }
          return false;
        };

        allEvents.forEach((evt, idx) => {
          try {
            const nativeTopics = evt.topic.map((t) => scValToNative(t));
            const nativeValue = evt.value ? scValToNative(evt.value) : null;

            const involvesUser =
              nativeTopics.some((t) => matchAddress(t)) || matchAddress(nativeValue);

            if (involvesUser) {
              const eventSymbol = String(nativeTopics[0] || "").toLowerCase();
              let type: "TRANSFER" | "ESCROW" | "TICKET" | "ROLE" | "SYSTEM" = "SYSTEM";
              let title = "Ledger Event";
              let description = `On-chain event triggered on ledger sequence ${evt.ledger}.`;

              if (eventSymbol.includes("transfer")) {
                type = "TRANSFER";
                title = "Token Transfer";
                description = `Token transfer detected in ledger sequence ${evt.ledger}.`;
              } else if (
                eventSymbol.includes("escrow") ||
                eventSymbol.includes("create_escrow") ||
                eventSymbol.includes("release") ||
                eventSymbol.includes("refund")
              ) {
                type = "ESCROW";
                title = "Escrow Transition";
                description = `Escrow agreement modified in ledger sequence ${evt.ledger}.`;
              } else if (
                eventSymbol.includes("ticket") ||
                eventSymbol.includes("buy_ticket") ||
                eventSymbol.includes("redeem")
              ) {
                type = "TICKET";
                title = "Event Ticket Pass";
                description = `Ticket pass updated in ledger sequence ${evt.ledger}.`;
              } else if (eventSymbol.includes("role") || eventSymbol.includes("role_updated")) {
                type = "ROLE";
                title = "Role Permission";
                description = `Profile role permissions updated on-chain.`;
              }

              realNotifications.push({
                id: `ledger_${idx}_${evt.ledger}`,
                type,
                title,
                description,
                timestamp: "JUST NOW",
                read: false,
                status: "info",
              });
            }
          } catch {
            // Ignore parse errors
          }
        });

        // Add session transactions as notifications
        sessionTransactions.forEach((tx, idx) => {
          let type: "TRANSFER" | "ESCROW" | "TICKET" | "ROLE" | "SYSTEM" = "SYSTEM";
          if (tx.method.includes("TRANSFER")) type = "TRANSFER";
          else if (tx.method.includes("ESCROW")) type = "ESCROW";
          else if (tx.method.includes("TICKET") || tx.method.includes("EVENT")) type = "TICKET";

          realNotifications.unshift({
            id: `session_${tx.hash}_${idx}`,
            type,
            title: `Session ${tx.method}`,
            description:
              tx.status === "confirmed"
                ? "Transaction executed successfully on-chain."
                : tx.status === "failed"
                ? `Transaction execution failed: ${tx.errorMessage || "Unknown error"}`
                : `Transaction currently ${tx.status}...`,
            timestamp: new Date(tx.timestamp).toLocaleTimeString(),
            read: false,
            status: tx.status === "failed" ? "warning" : "success",
          });
        });

        // Dedup notifications by id
        const seenIds = new Set<string>();
        const uniqueNotifications = realNotifications.filter((n) => {
          if (seenIds.has(n.id)) return false;
          seenIds.add(n.id);
          return true;
        });

        setNotifications(uniqueNotifications);
      } catch (err) {
        logger.error("Failed to fetch on-chain notifications", err);
      } finally {
        setLoading(false);
      }
    }

    fetchLedgerNotifications();
    const interval = setInterval(fetchLedgerNotifications, 10000);
    return () => clearInterval(interval);
  }, [address, sessionTransactions]);

  const clearAllNotifications = () => {
    clearTransactions();
    setNotifications([]);
  };

  const filteredNotifications = notifications.filter((n) => {
    const query = searchQuery.toLowerCase().trim();
    const matchesSearch =
      !query ||
      n.title.toLowerCase().includes(query) ||
      n.description.toLowerCase().includes(query);

    const matchesType = typeFilter === "all" || n.type === typeFilter;

    return matchesSearch && matchesType;
  });

  return {
    notifications,
    filteredNotifications,
    loading,
    searchQuery,
    setSearchQuery,
    typeFilter,
    setTypeFilter,
    clearAllNotifications,
  };
}
