"use client";

import React, { useState, useEffect, useCallback } from "react";
import {
  getRpcServer,
  NEXT_PUBLIC_CAMPUS_SERVICE_CONTRACT_ID,
  NEXT_PUBLIC_CAMPUS_TOKEN_CONTRACT_ID,
} from "@/services/contracts";
import { scValToNative } from "@stellar/stellar-sdk";
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

interface DecodedEvent {
  id: string;
  eventName: string;
  type: "transfer" | "escrow" | "ticket" | "role" | "university" | "membership" | "faucet" | "system";
  title: string;
  message: string;
  details: string;
  txHash: string;
  fullTxHash: string;
  timestamp: string;
  ledger: number;
  color: "blue" | "purple" | "emerald" | "amber" | "indigo" | "cyan" | "orange" | "gray";
  icon: "transfer" | "escrow" | "ticket" | "role" | "university" | "membership" | "faucet" | "system";
}

function shortAddr(addr: string): string {
  return addr.length > 10 ? `${addr.slice(0, 8)}...${addr.slice(-8)}` : addr;
}

function relativeTime(iso: string | null, ledgerSeq: number): string {
  if (iso) {
    const diff = Date.now() - new Date(iso).getTime();
    const mins = Math.floor(diff / 60_000);
    if (mins < 1) return "just now";
    if (mins < 60) return `${mins}m ago`;
    const hrs = Math.floor(mins / 60);
    if (hrs < 24) return `${hrs}h ago`;
    return `${Math.floor(hrs / 24)}d ago`;
  }
  return `ledger ${ledgerSeq}`;
}

function decodeNative(val: unknown): string | number | bigint | null | undefined {
  if (val === null || val === undefined) return undefined;
  if (typeof val === "bigint") return Number(val);
  if (typeof val === "number") return val;
  if (typeof val === "string") return val;
  if (typeof val === "symbol") return val.toString();
  if (Array.isArray(val)) return decodeNative(val[0]);
  if (typeof val === "object") {
    const v = val as Record<string, unknown>;
    if (v["_value"] !== undefined) return decodeNative(v["_value"]);
    const keys = Object.keys(v);
    if (keys.length === 0) return undefined;
    return decodeNative(v[keys[0]]);
  }
  return String(val);
}

function decodeEvent(evt: {
  id: string;
  ledger: number;
  ledgerClosedAt: string | null;
  txHash: string;
  topic: unknown[];
  value: unknown;
}): DecodedEvent {
  const rawTopic = evt.topic;
  const rawValue = evt.value;

  const topicNative = rawTopic.map((t) => scValToNative(t));
  const valueNative = rawValue ? scValToNative(rawValue) : null;

  const eventName = typeof topicNative[0] === "string" ? topicNative[0] : String(topicNative[0] || "");

  const ts = relativeTime(evt.ledgerClosedAt, evt.ledger);
  const baseEvent = {
    id: evt.id,
    eventName,
    txHash: shortAddr(evt.txHash),
    fullTxHash: evt.txHash,
    timestamp: ts,
    ledger: evt.ledger,
  };

  // --- Transfer events (CampusToken) ---
  if (eventName === "transfer") {
    const from = typeof topicNative[1] === "string" ? topicNative[1] : "";
    const to = typeof topicNative[2] === "string" ? topicNative[2] : "";
    const amountI128 = decodeNative(valueNative) ?? 0;
    const amount = Number(amountI128) / 10_000_000; // 7 decimals
    return {
      ...baseEvent,
      type: "transfer",
      title: "Token Transfer",
      message: `${shortAddr(from)} → ${shortAddr(to)}`,
      details: `${amount.toFixed(2)} CAMP`,
      color: "blue",
      icon: "transfer",
    };
  }

  // --- Approve event (CampusToken) ---
  if (eventName === "approve") {
    const from = typeof topicNative[1] === "string" ? topicNative[1] : "";
    const spender = typeof topicNative[2] === "string" ? topicNative[2] : "";
    return {
      ...baseEvent,
      type: "transfer",
      title: "Token Approval",
      message: `${shortAddr(from)} approved ${shortAddr(spender)}`,
      details: "allowance granted",
      color: "blue",
      icon: "transfer",
    };
  }

  // --- Mint / Burn ---
  if (eventName === "mint" || eventName === "burn") {
    const from = typeof topicNative[1] === "string" ? topicNative[1] : "";
    const to = typeof topicNative[2] === "string" ? topicNative[2] : "";
    const amountI128 = decodeNative(valueNative) ?? 0;
    const amount = Number(amountI128) / 10_000_000;
    return {
      ...baseEvent,
      type: "transfer",
      title: eventName === "mint" ? "Tokens Minted" : "Tokens Burned",
      message: eventName === "mint" ? `to ${shortAddr(to)}` : `by ${shortAddr(from)}`,
      details: `${amount.toFixed(2)} CAMP`,
      color: "blue",
      icon: "transfer",
    };
  }

  // --- Role updated ---
  if (eventName === "role_updated") {
    const addr = typeof topicNative[1] === "string" ? topicNative[1] : "";
    const roleNum = decodeNative(valueNative);
    const roleName = (() => {
      switch (Number(roleNum)) {
        case 0: return "Guest";
        case 1: return "Student";
        case 2: return "Merchant";
        case 3: return "Club Organizer";
        case 4: return "University Admin";
        default: return `Role ${roleNum}`;
      }
    })();
    return {
      ...baseEvent,
      type: "role",
      title: "Role Changed",
      message: `${shortAddr(addr)} is now ${roleName}`,
      details: `role #${roleNum}`,
      color: "purple",
      icon: "role",
    };
  }

  // --- Faucet ---
  if (eventName === "faucet") {
    const to = typeof topicNative[1] === "string" ? topicNative[1] : "";
    const amountI128 = decodeNative(valueNative) ?? 0;
    const amount = Number(amountI128) / 10_000_000;
    return {
      ...baseEvent,
      type: "faucet",
      title: "Faucet Claim",
      message: `${shortAddr(to)} claimed tokens`,
      details: `${amount.toFixed(2)} CAMP`,
      color: "cyan",
      icon: "faucet",
    };
  }
  if (eventName === "faucet_claimed") {
    const recipient = typeof topicNative[1] === "string" ? topicNative[1] : "";
    return {
      ...baseEvent,
      type: "faucet",
      title: "Faucet Claim",
      message: `${shortAddr(recipient)} claimed tokens`,
      details: "100 CAMP",
      color: "cyan",
      icon: "faucet",
    };
  }

  // --- Escrow events ---
  if (eventName === "escrow_created") {
    const counter = decodeNative(topicNative[1]);
    const buyer = typeof topicNative[2] === "string" ? topicNative[2] : "";
    const seller = typeof topicNative[3] === "string" ? topicNative[3] : "";
    const amountI128 = decodeNative(valueNative) ?? 0;
    const amount = Number(amountI128) / 10_000_000;
    return {
      ...baseEvent,
      type: "escrow",
      title: "Escrow Created",
      message: `#${counter} — ${shortAddr(buyer)} → ${shortAddr(seller)}`,
      details: `${amount.toFixed(2)} CAMP`,
      color: "orange",
      icon: "escrow",
    };
  }
  if (eventName === "escrow_released") {
    const id = decodeNative(topicNative[1]);
    const buyer = typeof topicNative[2] === "string" ? topicNative[2] : "";
    const seller = typeof topicNative[3] === "string" ? topicNative[3] : "";
    const amountI128 = decodeNative(valueNative) ?? 0;
    const amount = Number(amountI128) / 10_000_000;
    return {
      ...baseEvent,
      type: "escrow",
      title: "Escrow Released",
      message: `#${id} — paid ${shortAddr(seller)}`,
      details: `${amount.toFixed(2)} CAMP`,
      color: "emerald",
      icon: "escrow",
    };
  }
  if (eventName === "escrow_refunded") {
    const id = decodeNative(topicNative[1]);
    const buyer = typeof topicNative[2] === "string" ? topicNative[2] : "";
    const amountI128 = decodeNative(valueNative) ?? 0;
    const amount = Number(amountI128) / 10_000_000;
    return {
      ...baseEvent,
      type: "escrow",
      title: "Escrow Refunded",
      message: `#${id} — refunded to ${shortAddr(buyer)}`,
      details: `${amount.toFixed(2)} CAMP`,
      color: "orange",
      icon: "escrow",
    };
  }

  // --- Ticket events ---
  if (eventName === "event_created") {
    const counter = decodeNative(topicNative[1]);
    const host = typeof topicNative[2] === "string" ? topicNative[2] : "";
    return {
      ...baseEvent,
      type: "ticket",
      title: "Event Created",
      message: `Event #${counter} by ${shortAddr(host)}`,
      details: "new event published",
      color: "emerald",
      icon: "ticket",
    };
  }
  if (eventName === "ticket_bought") {
    const ticketId = decodeNative(topicNative[1]);
    const eventId = decodeNative(topicNative[2]);
    const buyer = typeof topicNative[3] === "string" ? topicNative[3] : "";
    const amountI128 = decodeNative(valueNative) ?? 0;
    const amount = Number(amountI128) / 10_000_000;
    return {
      ...baseEvent,
      type: "ticket",
      title: "Ticket Purchased",
      message: `Ticket #${ticketId} for Event #${eventId}`,
      details: `${shortAddr(buyer)} paid ${amount.toFixed(2)} CAMP`,
      color: "emerald",
      icon: "ticket",
    };
  }
  if (eventName === "ticket_redeemed") {
    const ticketId = decodeNative(topicNative[1]);
    const eventId = decodeNative(topicNative[2]);
    const host = typeof topicNative[3] === "string" ? topicNative[3] : "";
    return {
      ...baseEvent,
      type: "ticket",
      title: "Ticket Redeemed",
      message: `Ticket #${ticketId} for Event #${eventId}`,
      details: `redeemed by ${shortAddr(host)}`,
      color: "emerald",
      icon: "ticket",
    };
  }

  // --- University / Membership ---
  if (eventName === "university_registered") {
    const counter = decodeNative(topicNative[1]);
    const admin = typeof topicNative[2] === "string" ? topicNative[2] : "";
    return {
      ...baseEvent,
      type: "university",
      title: "University Registered",
      message: `University #${counter} by ${shortAddr(admin)}`,
      details: "on-chain registry updated",
      color: "indigo",
      icon: "university",
    };
  }
  if (eventName === "join_requested") {
    const counter = decodeNative(topicNative[1]);
    const applicant = typeof topicNative[3] === "string" ? topicNative[3] : "";
    return {
      ...baseEvent,
      type: "membership",
      title: "Join Requested",
      message: `${shortAddr(applicant)} requests to join`,
      details: `request #${counter}`,
      color: "gray",
      icon: "membership",
    };
  }
  if (eventName === "member_approved") {
    const requestId = decodeNative(topicNative[1]);
    const applicant = typeof topicNative[2] === "string" ? topicNative[2] : "";
    return {
      ...baseEvent,
      type: "membership",
      title: "Member Approved",
      message: `${shortAddr(applicant)} was approved`,
      details: `request #${requestId}`,
      color: "indigo",
      icon: "membership",
    };
  }
  if (eventName === "member_invited") {
    const counter = decodeNative(topicNative[1]);
    const invitee = typeof topicNative[3] === "string" ? topicNative[3] : "";
    return {
      ...baseEvent,
      type: "membership",
      title: "Member Invited",
      message: `${shortAddr(invitee)} was invited`,
      details: `invite #${counter}`,
      color: "gray",
      icon: "membership",
    };
  }
  if (eventName === "invite_accepted") {
    const inviteId = decodeNative(topicNative[1]);
    const invitee = typeof topicNative[2] === "string" ? topicNative[2] : "";
    return {
      ...baseEvent,
      type: "membership",
      title: "Invite Accepted",
      message: `${shortAddr(invitee)} accepted invite`,
      details: `invite #${inviteId}`,
      color: "indigo",
      icon: "membership",
    };
  }
  if (eventName === "member_left") {
    const member = typeof topicNative[1] === "string" ? topicNative[1] : "";
    return {
      ...baseEvent,
      type: "membership",
      title: "Member Left",
      message: `${shortAddr(member)} left university`,
      details: "membership removed",
      color: "gray",
      icon: "membership",
    };
  }

  // --- Fallback ---
  return {
    ...baseEvent,
    type: "system",
    title: eventName || "Contract Event",
    message: `Ledger ${evt.ledger}`,
    details: evt.txHash.slice(0, 8),
    color: "gray",
    icon: "system",
  };
}

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

const COLOR_MAP = {
  blue: "bg-blue-50 text-blue-600 border-blue-100",
  purple: "bg-purple-50 text-purple-600 border-purple-100",
  emerald: "bg-emerald-50 text-emerald-600 border-emerald-100",
  amber: "bg-amber-50 text-amber-600 border-amber-100",
  indigo: "bg-indigo-50 text-indigo-600 border-indigo-100",
  cyan: "bg-cyan-50 text-cyan-600 border-cyan-100",
  orange: "bg-orange-50 text-orange-600 border-orange-100",
  gray: "bg-slate-50 text-slate-500 border-slate-200",
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

      const server = getRpcServer();
      const latestLedger = await server.getLatestLedger();

      const res = await server.getEvents({
        startLedger: Math.max(1, latestLedger.sequence - 5000),
        filters: [
          { type: "contract", contractIds: [NEXT_PUBLIC_CAMPUS_SERVICE_CONTRACT_ID] },
          { type: "contract", contractIds: [NEXT_PUBLIC_CAMPUS_TOKEN_CONTRACT_ID] },
        ],
        limit: 40,
        ...(isLoadMore && cursor ? { cursor } : {}),
      });

      const decodedEvents = res.events
        .map((evt) => {
          try {
            return decodeEvent({
              id: evt.id,
              ledger: evt.ledger,
              ledgerClosedAt: (evt as Record<string, unknown>).ledgerClosedAt as string | null ?? null,
              txHash: evt.txHash,
              topic: evt.topic as unknown[],
              value: evt.value as unknown,
            });
          } catch {
            return null;
          }
        })
        .filter((e): e is DecodedEvent => e !== null);

      if (isLoadMore) {
        setEvents((prev) => {
          const existingIds = new Set(prev.map((e) => e.id));
          const newEvents = decodedEvents.filter((e) => !existingIds.has(e.id));
          return [...prev, ...newEvents];
        });
      } else {
        setEvents(decodedEvents);
      }

      setHasMore(res.events.length >= 40);
      // Use the last event's ledger as cursor for next page
      if (res.events.length > 0) {
        const lastEvent = res.events[res.events.length - 1];
        setCursor((lastEvent as Record<string, unknown>).pagingToken as string ?? null);
      }
    } catch {
      // silent fail on RPC errors
    } finally {
      setLoading(false);
      setLoadingMore(false);
    }
  }, [cursor, loadingMore]);

  useEffect(() => {
    fetchEvents(false);
  }, []); // eslint-disable-line react-hooks/exhaustive-deps

  const filtered = events.filter((e) => {
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

  return (
    <div className="flex flex-col gap-8 w-full max-w-7xl mx-auto">
      {/* Title */}
      <div className="flex flex-col md:flex-row md:items-center justify-between gap-4">
        <div>
          <h1 className="text-3xl font-extrabold tracking-tight text-slate-900 uppercase">
            Activity Feed
          </h1>
          <p className="text-slate-500 text-sm mt-1">
            Real-time ledger audit trail showing transactions, token transfers, escrows, and on-chain events.
          </p>
        </div>
        <div className="flex items-center gap-2 text-xs font-bold text-emerald-600 bg-emerald-50 border border-emerald-100 px-3 py-1.5 rounded-xl">
          <span className="w-2 h-2 rounded-full bg-emerald-500 animate-ping" />
          <span>Streaming Live</span>
        </div>
      </div>

      {/* Filters */}
      <div className="bg-white rounded-2xl p-6">
        <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4 border-b border-slate-100 pb-4 mb-6">
          <span className="text-xs font-bold uppercase tracking-wider text-slate-400">
            Ledger Telemetry ({filtered.length} events)
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
              {searchQuery && (
                <kbd className="text-[10px] font-mono text-slate-400 bg-slate-100 px-1.5 py-0.5 rounded-md ml-2 hidden md:block">
                  esc
                </kbd>
              )}
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

        {/* Loading / Empty / Event List */}
        {loading ? (
          <div className="flex flex-col items-center justify-center py-20 gap-4">
            <Loader2 className="w-8 h-8 animate-spin text-accent" />
            <span className="text-xs font-bold uppercase tracking-widest text-slate-400">
              Connecting to Ledger Stream...
            </span>
          </div>
        ) : filtered.length === 0 ? (
          <div className="border border-dashed border-slate-200 rounded-2xl p-16 text-center flex flex-col items-center justify-center gap-3">
            <Clock className="w-8 h-8 text-slate-300" />
            <span className="font-bold text-slate-400 text-xs uppercase tracking-widest">
              No events found
            </span>
            <p className="text-[10px] text-slate-400 font-medium">
              {events.length === 0
                ? "No on-chain activity detected yet. Execute a transaction to see it here."
                : "Try adjusting search or filter criteria."}
            </p>
          </div>
        ) : (
          <>
            <div className="flex flex-col divide-y divide-slate-100">
              {filtered.map((evt) => {
                const IconComponent = ICON_MAP[evt.icon];
                const colorClass = COLOR_MAP[evt.color];
                return (
                  <div
                    key={evt.id}
                    className="py-5 first:pt-0 last:pb-0 flex flex-col md:flex-row md:items-center justify-between gap-6 hover:bg-slate-50/30 transition-colors duration-200"
                  >
                    <div className="flex items-start gap-4">
                      <div className={`w-10 h-10 rounded-xl border flex items-center justify-center shrink-0 ${colorClass}`}>
                        <IconComponent className="w-5 h-5" />
                      </div>
                      <div className="flex flex-col min-w-0">
                        <span className="text-xs font-bold text-slate-900 uppercase">
                          {evt.title}
                        </span>
                        <span className="text-sm text-slate-700 font-semibold mt-0.5">
                          {evt.message}
                        </span>
                        <span className="text-[11px] text-slate-500 font-medium mt-0.5">
                          {evt.details}
                        </span>
                        <div className="flex items-center gap-3 mt-1.5">
                          <a
                            href={`https://stellar.expert/explorer/testnet/tx/${evt.fullTxHash}`}
                            target="_blank"
                            rel="noopener noreferrer"
                            className="text-[10px] font-mono text-slate-400 hover:text-accent transition-colors flex items-center gap-1"
                          >
                            <span>{evt.txHash}</span>
                            <ExternalLink className="w-3 h-3" />
                          </a>
                          <span className="text-[10px] font-mono text-slate-300">
                            ledger {evt.ledger}
                          </span>
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

            {/* Load More */}
            {hasMore && (
              <div className="pt-4 mt-2 border-t border-slate-100 flex justify-center">
                <button
                  onClick={() => fetchEvents(true)}
                  disabled={loadingMore}
                  className="h-9 px-6 text-xs font-bold text-slate-600 bg-slate-50 hover:bg-slate-100 rounded-xl flex items-center gap-2 transition-colors disabled:opacity-50"
                >
                  {loadingMore ? (
                    <Loader2 className="w-3.5 h-3.5 animate-spin" />
                  ) : (
                    <ChevronDown className="w-3.5 h-3.5" />
                  )}
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
