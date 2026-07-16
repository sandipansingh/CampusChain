"use client";

import React, { useState, useEffect } from "react";
import { useWalletStore } from "@/state/useWalletStore";
import { useTransactionStore } from "@/state/useTransactionStore";
import { getRpcServer, NEXT_PUBLIC_CAMPUS_SERVICE_CONTRACT_ID, NEXT_PUBLIC_CAMPUS_TOKEN_CONTRACT_ID } from "@/services/contracts";
import { scValToNative } from "@stellar/stellar-sdk";
import { logger } from "@/services/logger";
import {
  Bell,
  Clock,
  Trash2,
  Loader2,
  Search,
  SlidersHorizontal
} from "lucide-react";

interface NotificationItem {
  id: string;
  type: "TRANSFER" | "ESCROW" | "TICKET" | "ROLE" | "SYSTEM";
  title: string;
  description: string;
  timestamp: string;
  read: boolean;
  status: "success" | "warning" | "info";
}

export default function NotificationsPage() {
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

        const allEvents = [...serviceEventsRes.events, ...tokenEventsRes.events]
          .sort((a, b) => b.ledger - a.ledger);

        const realNotifications: NotificationItem[] = [];

        // Helper to check if address exists in scval native representation
        const matchAddress = (val: unknown): boolean => {
          if (typeof val === "string") return val === address;
          if (Array.isArray(val)) return val.some(v => matchAddress(v));
          if (val && typeof val === "object") {
            return Object.values(val as Record<string, unknown>).some(v => matchAddress(v));
          }
          return false;
        };

        allEvents.forEach((evt, idx) => {
          try {
            const nativeTopics = evt.topic.map((t) => scValToNative(t));
            const nativeValue = evt.value ? scValToNative(evt.value) : null;

            const involvesUser = nativeTopics.some((t) => matchAddress(t)) || matchAddress(nativeValue);

            if (involvesUser) {
              const eventSymbol = String(nativeTopics[0] || "").toLowerCase();
              let type: "TRANSFER" | "ESCROW" | "TICKET" | "ROLE" | "SYSTEM" = "SYSTEM";
              let title = "Ledger Event";
              let description = `On-chain event triggered on ledger sequence ${evt.ledger}.`;

              if (eventSymbol.includes("transfer")) {
                type = "TRANSFER";
                title = "Token Transfer";
                description = `Token transfer detected in ledger sequence ${evt.ledger}.`;
              } else if (eventSymbol.includes("escrow") || eventSymbol.includes("create_escrow") || eventSymbol.includes("release") || eventSymbol.includes("refund")) {
                type = "ESCROW";
                title = "Escrow Transition";
                description = `Escrow agreement modified in ledger sequence ${evt.ledger}.`;
              } else if (eventSymbol.includes("ticket") || eventSymbol.includes("buy_ticket") || eventSymbol.includes("redeem")) {
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
            description: tx.status === "confirmed" 
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

  // Filter notifications
  const filteredNotifications = notifications.filter((n) => {
    const query = searchQuery.toLowerCase().trim();
    const matchesSearch = !query ||
      n.title.toLowerCase().includes(query) ||
      n.description.toLowerCase().includes(query);

    const matchesType = typeFilter === "all" || n.type === typeFilter;

    return matchesSearch && matchesType;
  });

  return (
    <div className="flex flex-col gap-8 w-full max-w-7xl mx-auto">
      {/* Title */}
      <div className="flex flex-col md:flex-row md:items-center justify-between gap-4">
        <div>
          <h1 className="text-3xl font-extrabold tracking-tight text-slate-900 uppercase">
            Notifications
          </h1>
          <p className="text-slate-500 text-sm mt-1">
            Real-time on-chain notifications and transactions registered to your address.
          </p>
        </div>
        {notifications.length > 0 && (
          <button
            onClick={clearAllNotifications}
            className="h-11 px-4 bg-white text-xs font-bold text-slate-600 rounded-xl hover:bg-slate-50 flex items-center gap-2 active:scale-95 transition-all"
          >
            <Trash2 className="w-4 h-4" />
            Clear Log
          </button>
        )}
      </div>

      {/* Notifications Card - Flat design */}
      <div className="bg-white rounded-2xl p-6">
        <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4 border-b border-slate-100 pb-4 mb-6">
          <span className="text-xs font-bold uppercase tracking-wider text-slate-400">
            Ledger & Session Feed ({filteredNotifications.length})
          </span>
          <div className="flex items-center gap-3">
            {/* Search Input */}
            <div className="relative flex items-center bg-slate-50 rounded-xl px-3 py-1.5 text-xs text-slate-500 font-semibold focus-within:border-slate-300 transition-all">
              <Search className="w-3.5 h-3.5 text-slate-400 mr-2 shrink-0" />
              <input
                type="text"
                placeholder="Search..."
                value={searchQuery}
                onChange={(e) => setSearchQuery(e.target.value)}
                className="bg-transparent outline-none w-36 placeholder-slate-400 font-medium"
              />
            </div>
            {/* Filter Selector */}
            <div className="flex items-center gap-1.5 bg-slate-50 px-3 py-1.5 rounded-xl text-xs font-bold text-slate-600">
              <SlidersHorizontal className="w-3.5 h-3.5 text-slate-400" />
              <select
                value={typeFilter}
                onChange={(e) => setTypeFilter(e.target.value)}
                className="bg-transparent outline-none cursor-pointer pr-1"
              >
                <option value="all">All Events</option>
                <option value="TRANSFER">Transfers</option>
                <option value="ESCROW">Escrows</option>
                <option value="TICKET">Tickets</option>
                <option value="ROLE">Roles</option>
                <option value="SYSTEM">System</option>
              </select>
            </div>
          </div>
        </div>

        {loading ? (
          <div className="flex flex-col items-center justify-center py-20 gap-4">
            <Loader2 className="w-8 h-8 animate-spin text-accent" />
            <span className="text-xs font-bold uppercase tracking-widest text-slate-400">
              Querying Ledger Telemetry...
            </span>
          </div>
        ) : filteredNotifications.length === 0 ? (
          <div className="border border-dashed border-slate-200 rounded-2xl p-16 text-center flex flex-col items-center justify-center gap-3">
            <Bell className="w-8 h-8 text-slate-300" />
            <span className="font-bold text-slate-400 text-xs uppercase tracking-widest">
              {notifications.length === 0
                ? "No on-chain activity detected yet"
                : "No matching notifications found"}
            </span>
            {notifications.length === 0 && (
              <p className="text-[10px] text-slate-400 font-medium">
                Transactions and events concerning your address will appear here once executed.
              </p>
            )}
          </div>
        ) : (
          <div className="flex flex-col divide-y divide-slate-100">
            {filteredNotifications.map((item) => (
              <div
                key={item.id}
                className="py-5 first:pt-0 last:pb-0 flex items-start justify-between gap-4"
              >
                <div className="flex items-start gap-4">
                  <div className="flex flex-col">
                    <div className="flex items-center gap-2">
                      <span className="text-xs font-extrabold uppercase text-slate-900">
                        {item.title}
                      </span>
                      {item.status === "warning" && (
                        <span className="text-[9px] font-bold text-red-600 bg-red-50 border border-red-100 px-1.5 py-0.5 rounded">
                          Failed
                        </span>
                      )}
                      {item.status === "success" && (
                        <span className="text-[9px] font-bold text-emerald-600 bg-emerald-50 border border-emerald-100 px-1.5 py-0.5 rounded">
                          Confirmed
                        </span>
                      )}
                    </div>
                    <p className="text-xs text-slate-500 font-medium leading-relaxed mt-1">
                      {item.description}
                    </p>
                    <div className="flex items-center gap-1.5 text-[10px] font-bold text-slate-400 mt-2 uppercase">
                      <Clock className="w-3 h-3" />
                      <span>{item.timestamp}</span>
                    </div>
                  </div>
                </div>
              </div>
            ))}
          </div>
        )}
      </div>
    </div>
  );
}
