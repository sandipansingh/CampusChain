"use client";

import React from "react";
import { useActivityPagination } from "@/hooks/useActivityPagination";
import { ICON_COLORS } from "@/services/eventDecoder";
import {
  ArrowRightLeft,
  Lock,
  Ticket,
  UserCheck,
  Building,
  Users,
  Droplets,
  Clock,
  Loader2,
  ChevronDown,
  ExternalLink,
  Search,
} from "lucide-react";

const ICON_MAP = {
  transfer: ArrowRightLeft,
  escrow: Lock,
  ticket: Ticket,
  role: UserCheck,
  university: Building,
  membership: Users,
  faucet: Droplets,
  system: Clock,
} as const;

const TYPE_FILTERS = [
  { value: "all", label: "All Events" },
  { value: "transfer", label: "Token Transfers" },
  { value: "escrow", label: "Escrows" },
  { value: "ticket", label: "Tickets" },
  { value: "role", label: "Roles" },
  { value: "university", label: "Universities" },
  { value: "membership", label: "Memberships" },
  { value: "faucet", label: "Faucet" },
  { value: "system", label: "System" },
];

export default function ActivityFeedPage() {
  const {
    events,
    filteredEvents,
    loading,
    loadingMore,
    hasMore,
    searchQuery,
    setSearchQuery,
    typeFilter,
    setTypeFilter,
    loadMore,
  } = useActivityPagination();

  return (
    <div className="flex flex-col gap-8 w-full max-w-7xl mx-auto">
      <div className="flex flex-col md:flex-row md:items-center justify-between gap-4">
        <div>
          <h1 className="text-3xl font-extrabold tracking-tight text-slate-900 uppercase">Activity Feed</h1>
          <p className="text-slate-500 text-sm mt-1">Real-time ledger audit trail showing transactions, transfers, escrows, and on-chain events.</p>
        </div>
        <div className="flex items-center gap-2 text-xs font-bold text-emerald-600 bg-emerald-50 border border-emerald-100 px-3 py-1.5 rounded-xl">
          <span className="w-2 h-2 rounded-full bg-emerald-500 animate-ping" />
          <span>Streaming Live</span>
        </div>
      </div>

      <div className="bg-white rounded-2xl p-6">
        <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4 border-b border-slate-100 pb-4 mb-6">
          <span className="text-xs font-bold uppercase tracking-wider text-slate-400">
            Ledger Telemetry ({filteredEvents.length} events)
          </span>
          <div className="flex items-center gap-3">
            <div className="relative flex items-center bg-slate-50 rounded-xl px-3 py-1.5 text-xs text-slate-500 font-semibold focus-within:ring-1 focus-within:ring-slate-300 transition-all">
              <Search className="w-3.5 h-3.5 text-slate-400 mr-2 shrink-0" />
              <input
                type="text"
                placeholder="Search address, tx hash, event..."
                value={searchQuery}
                onChange={(e) => setSearchQuery(e.target.value)}
                className="bg-transparent outline-none w-48 md:w-64 placeholder-slate-400 font-medium"
              />
            </div>
            <select
              value={typeFilter}
              onChange={(e) => setTypeFilter(e.target.value)}
              className="bg-slate-50 text-xs font-bold text-slate-600 rounded-xl px-3 py-1.5 outline-none cursor-pointer border-none"
            >
              {TYPE_FILTERS.map((f) => (
                <option key={f.value} value={f.value}>{f.label}</option>
              ))}
            </select>
          </div>
        </div>

        {loading ? (
          <div className="flex flex-col items-center justify-center py-20 gap-4">
            <Loader2 className="w-8 h-8 animate-spin text-accent" />
            <span className="text-xs font-bold uppercase tracking-widest text-slate-400">Connecting to Ledger Stream...</span>
          </div>
        ) : filteredEvents.length === 0 ? (
          <div className="border border-dashed border-slate-200 rounded-2xl p-16 text-center flex flex-col items-center justify-center gap-3">
            <Clock className="w-8 h-8 text-slate-300" />
            <span className="font-bold text-slate-400 text-xs uppercase tracking-widest">No events found</span>
            <p className="text-[10px] text-slate-400 font-medium">
              {events.length === 0 ? "No on-chain activity detected yet." : "Try adjusting search or filter criteria."}
            </p>
          </div>
        ) : (
          <>
            <div className="flex flex-col divide-y divide-slate-100">
              {filteredEvents.map((evt) => {
                const IconComponent = ICON_MAP[evt.icon];
                const colorClass = ICON_COLORS[evt.color];
                return (
                  <div key={evt.id} className="py-5 first:pt-0 last:pb-0 flex flex-col md:flex-row md:items-center justify-between gap-6 hover:bg-slate-50/30 transition-colors duration-200">
                    <div className="flex items-start gap-4">
                      <div className={`w-10 h-10 rounded-xl border flex items-center justify-center shrink-0 ${colorClass}`}>
                        <IconComponent className="w-5 h-5" />
                      </div>
                      <div className="flex flex-col min-w-0">
                        <span className="text-xs font-bold text-slate-900 uppercase">{evt.title}</span>
                        <span className="text-sm text-slate-700 font-semibold mt-0.5">{evt.message}</span>
                        <span className="text-[11px] text-slate-500 font-medium mt-0.5">{evt.details}</span>
                        <div className="flex items-center gap-3 mt-1.5">
                          <a href={`https://stellar.expert/explorer/testnet/tx/${evt.fullTxHash}`} target="_blank" rel="noopener noreferrer" className="text-[10px] font-mono text-slate-400 hover:text-accent transition-colors flex items-center gap-1">
                            <span>{evt.txHash}</span>
                            <ExternalLink className="w-3 h-3" />
                          </a>
                          <span className="text-[10px] font-mono text-slate-300">ledger {evt.ledger}</span>
                        </div>
                      </div>
                    </div>
                    <div className="flex items-center gap-2 shrink-0 md:text-right md:justify-end text-xs font-bold text-slate-400 md:ml-auto">
                      <Clock className="w-3.5 h-3.5" />
                      <span>{evt.timestamp}</span>
                    </div>
                  </div>
                );
              })}
            </div>
            {hasMore && (
              <div className="pt-4 mt-2 border-t border-slate-100 flex justify-center">
                <button onClick={loadMore} disabled={loadingMore} className="h-9 px-6 text-xs font-bold text-slate-600 bg-slate-50 hover:bg-slate-100 rounded-xl flex items-center gap-2 transition-colors disabled:opacity-50">
                  {loadingMore ? <Loader2 className="w-3.5 h-3.5 animate-spin" /> : <ChevronDown className="w-3.5 h-3.5" />}
                  Load More Events
                </button>
              </div>
            )}
          </>
        )}
      </div>
    </div>
  );
}
