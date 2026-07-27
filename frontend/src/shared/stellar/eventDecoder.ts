import { scValToNative, xdr } from "@stellar/stellar-sdk";

export interface DecodedEvent {
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
  ledgerClosedAt: string;
}

export function shortAddr(addr: string): string {
  return addr.length > 10 ? `${addr.slice(0, 8)}...${addr.slice(-8)}` : addr;
}

export function relativeTime(iso: string): string {
  const diff = Date.now() - new Date(iso).getTime();
  const mins = Math.floor(diff / 60_000);
  if (mins < 1) return "just now";
  if (mins < 60) return `${mins}m ago`;
  const hrs = Math.floor(mins / 60);
  if (hrs < 24) return `${hrs}h ago`;
  return `${Math.floor(hrs / 24)}d ago`;
}

function decodeNative(val: unknown): string | number | null | undefined {
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

export function decodeEvent(evt: {
  id: string;
  ledger: number;
  ledgerClosedAt: string;
  txHash: string;
  topic: unknown[];
  value: unknown;
}): DecodedEvent {
  const rawTopic = evt.topic as unknown as xdr.ScVal[];
  const rawValue = evt.value as unknown as xdr.ScVal | null;

  const topicNative = rawTopic.map((t) => scValToNative(t));
  const valueNative = rawValue ? scValToNative(rawValue) : null;

  const eventName = typeof topicNative[0] === "string" ? topicNative[0] : String(topicNative[0] || "");

  const ts = relativeTime(evt.ledgerClosedAt);
  const baseEvent = {
    id: evt.id,
    eventName,
    txHash: shortAddr(evt.txHash),
    fullTxHash: evt.txHash,
    timestamp: ts,
    ledger: evt.ledger,
    ledgerClosedAt: evt.ledgerClosedAt,
  };

  if (eventName === "transfer" || eventName === "mint_purchase") {
    const from = typeof topicNative[1] === "string" ? topicNative[1] : "";
    const to = typeof topicNative[2] === "string" ? topicNative[2] : "";
    const amountI128 = decodeNative(valueNative) ?? 0;
    const amount = Number(amountI128) / 10_000_000;
    return { ...baseEvent, type: "transfer", title: "Token Transfer", message: `${shortAddr(from)} → ${shortAddr(to)}`, details: `${amount.toFixed(2)} CAMP`, color: "blue", icon: "transfer" };
  }

  if (eventName === "approve") {
    const from = typeof topicNative[1] === "string" ? topicNative[1] : "";
    const spender = typeof topicNative[2] === "string" ? topicNative[2] : "";
    return { ...baseEvent, type: "transfer", title: "Token Approval", message: `${shortAddr(from)} → ${shortAddr(spender)}`, details: "allowance granted", color: "blue", icon: "transfer" };
  }

  if (eventName === "mint" || eventName === "burn") {
    const from = typeof topicNative[1] === "string" ? topicNative[1] : "";
    const to = typeof topicNative[2] === "string" ? topicNative[2] : "";
    const amountI128 = decodeNative(valueNative) ?? 0;
    const amount = Number(amountI128) / 10_000_000;
    return { ...baseEvent, type: "transfer", title: eventName === "mint" ? "Tokens Minted" : "Tokens Burned", message: eventName === "mint" ? `to ${shortAddr(to)}` : `by ${shortAddr(from)}`, details: `${amount.toFixed(2)} CAMP`, color: "blue", icon: "transfer" };
  }

  if (eventName === "role_updated") {
    const addr = typeof topicNative[1] === "string" ? topicNative[1] : "";
    const roleNum = decodeNative(valueNative);
    const roleName = (() => { switch (Number(roleNum)) { case 0: return "Guest"; case 1: return "Student"; case 2: return "Merchant"; case 3: return "Club Organizer"; case 4: return "University Admin"; default: return `Role ${roleNum}`; } })();
    return { ...baseEvent, type: "role", title: "Role Changed", message: `${shortAddr(addr)} is now ${roleName}`, details: `role #${roleNum}`, color: "purple", icon: "role" };
  }

  if (eventName === "faucet" || eventName === "faucet_claimed") {
    const to = typeof topicNative[1] === "string" ? topicNative[1] : "";
    return { ...baseEvent, type: "faucet", title: "Faucet Claim", message: `${shortAddr(to)} claimed tokens`, details: "100 CAMP", color: "cyan", icon: "faucet" };
  }

  if (eventName === "purchase_camp") {
    const buyer = typeof topicNative[1] === "string" ? topicNative[1] : "";
    const vals = valueNative as unknown as [number, number] | null;
    const campAmt = vals ? Number(vals[1] ?? 0) / 10_000_000 : 0;
    return { ...baseEvent, type: "faucet", title: "Token Purchase", message: `${shortAddr(buyer)} bought CAMP with XLM`, details: `${campAmt.toFixed(2)} CAMP`, color: "cyan", icon: "faucet" };
  }

  if (eventName === "escrow_created") {
    const counter = decodeNative(topicNative[1]);
    const buyer = typeof topicNative[2] === "string" ? topicNative[2] : "";
    const seller = typeof topicNative[3] === "string" ? topicNative[3] : "";
    const amountI128 = decodeNative(valueNative) ?? 0;
    const amount = Number(amountI128) / 10_000_000;
    return { ...baseEvent, type: "escrow", title: "Escrow Created", message: `#${counter} — ${shortAddr(buyer)} → ${shortAddr(seller)}`, details: `${amount.toFixed(2)} CAMP`, color: "orange", icon: "escrow" };
  }

  if (eventName === "escrow_released") {
    const id = decodeNative(topicNative[1]);
    const seller = typeof topicNative[3] === "string" ? topicNative[3] : "";
    const amountI128 = decodeNative(valueNative) ?? 0;
    const amount = Number(amountI128) / 10_000_000;
    return { ...baseEvent, type: "escrow", title: "Escrow Released", message: `#${id} — paid ${shortAddr(seller)}`, details: `${amount.toFixed(2)} CAMP`, color: "emerald", icon: "escrow" };
  }

  if (eventName === "escrow_refunded") {
    const id = decodeNative(topicNative[1]);
    const buyer = typeof topicNative[2] === "string" ? topicNative[2] : "";
    const amountI128 = decodeNative(valueNative) ?? 0;
    const amount = Number(amountI128) / 10_000_000;
    return { ...baseEvent, type: "escrow", title: "Escrow Refunded", message: `#${id} — refunded to ${shortAddr(buyer)}`, details: `${amount.toFixed(2)} CAMP`, color: "orange", icon: "escrow" };
  }

  if (eventName === "event_created") {
    const counter = decodeNative(topicNative[1]);
    const host = typeof topicNative[2] === "string" ? topicNative[2] : "";
    return { ...baseEvent, type: "ticket", title: "Event Created", message: `Event #${counter} by ${shortAddr(host)}`, details: "new event published", color: "emerald", icon: "ticket" };
  }

  if (eventName === "ticket_bought") {
    const ticketId = decodeNative(topicNative[1]);
    const eventId = decodeNative(topicNative[2]);
    const buyer = typeof topicNative[3] === "string" ? topicNative[3] : "";
    const amountI128 = decodeNative(valueNative) ?? 0;
    const amount = Number(amountI128) / 10_000_000;
    return { ...baseEvent, type: "ticket", title: "Ticket Purchased", message: `Ticket #${ticketId} for Event #${eventId}`, details: `${shortAddr(buyer)} paid ${amount.toFixed(2)} CAMP`, color: "emerald", icon: "ticket" };
  }

  if (eventName === "ticket_redeemed") {
    const ticketId = decodeNative(topicNative[1]);
    const eventId = decodeNative(topicNative[2]);
    const host = typeof topicNative[3] === "string" ? topicNative[3] : "";
    return { ...baseEvent, type: "ticket", title: "Ticket Redeemed", message: `Ticket #${ticketId} for Event #${eventId}`, details: `by ${shortAddr(host)}`, color: "emerald", icon: "ticket" };
  }

  if (eventName === "university_registered") {
    const counter = decodeNative(topicNative[1]);
    const admin = typeof topicNative[2] === "string" ? topicNative[2] : "";
    return { ...baseEvent, type: "university", title: "University Registered", message: `#${counter} by ${shortAddr(admin)}`, details: "on-chain registry updated", color: "indigo", icon: "university" };
  }

  if (eventName === "join_requested") {
    const counter = decodeNative(topicNative[1]);
    const applicant = typeof topicNative[3] === "string" ? topicNative[3] : "";
    return { ...baseEvent, type: "membership", title: "Join Requested", message: `${shortAddr(applicant)} requests to join`, details: `request #${counter}`, color: "gray", icon: "membership" };
  }

  if (eventName === "member_approved") {
    const requestId = decodeNative(topicNative[1]);
    const applicant = typeof topicNative[2] === "string" ? topicNative[2] : "";
    return { ...baseEvent, type: "membership", title: "Member Approved", message: `${shortAddr(applicant)} was approved`, details: `request #${requestId}`, color: "indigo", icon: "membership" };
  }

  if (eventName === "member_invited") {
    const counter = decodeNative(topicNative[1]);
    const invitee = typeof topicNative[3] === "string" ? topicNative[3] : "";
    return { ...baseEvent, type: "membership", title: "Member Invited", message: `${shortAddr(invitee)} was invited`, details: `invite #${counter}`, color: "gray", icon: "membership" };
  }

  if (eventName === "invite_accepted") {
    const inviteId = decodeNative(topicNative[1]);
    const invitee = typeof topicNative[2] === "string" ? topicNative[2] : "";
    return { ...baseEvent, type: "membership", title: "Invite Accepted", message: `${shortAddr(invitee)} accepted`, details: `invite #${inviteId}`, color: "indigo", icon: "membership" };
  }

  if (eventName === "member_left") {
    const member = typeof topicNative[1] === "string" ? topicNative[1] : "";
    return { ...baseEvent, type: "membership", title: "Member Left", message: `${shortAddr(member)} left university`, details: "membership removed", color: "gray", icon: "membership" };
  }

  return { ...baseEvent, type: "system", title: eventName || "Contract Event", message: `Ledger ${evt.ledger}`, details: evt.txHash.slice(0, 8), color: "gray", icon: "system" };
}

export const ICON_COLORS: Record<DecodedEvent["color"], string> = {
  blue: "bg-blue-50 text-blue-600 border-blue-100",
  purple: "bg-purple-50 text-purple-600 border-purple-100",
  emerald: "bg-emerald-50 text-emerald-600 border-emerald-100",
  amber: "bg-amber-50 text-amber-600 border-amber-100",
  indigo: "bg-indigo-50 text-indigo-600 border-indigo-100",
  cyan: "bg-cyan-50 text-cyan-600 border-cyan-100",
  orange: "bg-orange-50 text-orange-600 border-orange-100",
  gray: "bg-slate-50 text-slate-500 border-slate-200",
};
