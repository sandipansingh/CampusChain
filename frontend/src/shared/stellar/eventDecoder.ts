import { scValToNative, xdr } from "@stellar/stellar-sdk";

export interface DecodedEvent {
  id: string;
  eventName: string;
  type: "transfer" | "escrow" | "ticket" | "role" | "university" | "membership" | "faucet" | "marketplace" | "system" | "scholarship" | "order";
  title: string;
  message: string;
  details: string;
  txHash: string;
  fullTxHash: string;
  timestamp: string;
  ledger: number;
  color: "blue" | "purple" | "emerald" | "amber" | "indigo" | "cyan" | "orange" | "gray" | "rose";
  icon: "transfer" | "escrow" | "ticket" | "role" | "university" | "membership" | "faucet" | "marketplace" | "system" | "scholarship" | "order";
  ledgerClosedAt: string;
  topicNative?: unknown[];
}

export function shortAddr(addr: string): string {
  if (!addr) return "";
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

export function extractAddress(val: unknown): string {
  if (!val) return "";
  if (typeof val === "string") return val;
  if (typeof val === "object") {
    if ("toString" in val && typeof (val as { toString: () => string }).toString === "function") {
      const str = (val as { toString: () => string }).toString();
      if (str && str !== "[object Object]") return str;
    }
    const record = val as Record<string, unknown>;
    if (typeof record._value === "string") return record._value;
    if (typeof record.address === "string") return record.address;
    if (typeof record.id === "string") return record.id;
  }
  return String(val);
}

export function extractStr(val: unknown): string {
  if (val === null || val === undefined) return "";
  if (typeof val === "string") return val;
  if (typeof val === "number" || typeof val === "bigint") return String(val);
  if (typeof val === "object") {
    if ("toString" in val && typeof (val as { toString: () => string }).toString === "function") {
      const str = (val as { toString: () => string }).toString();
      if (str && str !== "[object Object]") return str;
    }
    const record = val as Record<string, unknown>;
    if (typeof record._value === "string") return record._value;
  }
  return String(val);
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
    topicNative,
  };

  if (eventName === "transfer" || eventName === "mint_purchase") {
    const from = extractAddress(topicNative[1]);
    const to = extractAddress(topicNative[2]);
    const amountI128 = decodeNative(valueNative) ?? 0;
    const amount = Number(amountI128) / 10_000_000;
    return { ...baseEvent, type: "transfer", title: "Token Transfer", message: `${shortAddr(from)} → ${shortAddr(to)}`, details: `${amount.toFixed(2)} CAMP`, color: "blue", icon: "transfer" };
  }

  if (eventName === "approve") {
    const from = extractAddress(topicNative[1]);
    const spender = extractAddress(topicNative[2]);
    return { ...baseEvent, type: "transfer", title: "Token Approval", message: `${shortAddr(from)} → ${shortAddr(spender)}`, details: "allowance granted", color: "blue", icon: "transfer" };
  }

  if (eventName === "mint" || eventName === "burn") {
    const from = extractAddress(topicNative[1]);
    const to = extractAddress(topicNative[2]);
    const amountI128 = decodeNative(valueNative) ?? 0;
    const amount = Number(amountI128) / 10_000_000;
    return { ...baseEvent, type: "transfer", title: eventName === "mint" ? "Tokens Minted" : "Tokens Burned", message: eventName === "mint" ? `to ${shortAddr(to)}` : `by ${shortAddr(from)}`, details: `${amount.toFixed(2)} CAMP`, color: "blue", icon: "transfer" };
  }

  if (eventName === "role_updated") {
    const addr = extractAddress(topicNative[1]);
    const roleNum = decodeNative(valueNative);
    const roleName = (() => { switch (Number(roleNum)) { case 0: return "Guest"; case 1: return "Student"; case 2: return "Merchant"; case 3: return "Club Organizer"; case 4: return "University Admin"; default: return `Role ${roleNum}`; } })();
    return { ...baseEvent, type: "role", title: "Role Changed", message: `${shortAddr(addr)} is now ${roleName}`, details: `role #${roleNum}`, color: "purple", icon: "role" };
  }

  if (eventName === "faucet" || eventName === "faucet_claimed") {
    const to = extractAddress(topicNative[1]);
    return { ...baseEvent, type: "faucet", title: "Faucet Claim", message: `${shortAddr(to)} claimed tokens`, details: "100 CAMP", color: "cyan", icon: "faucet" };
  }

  if (eventName === "purchase_camp") {
    const buyer = extractAddress(topicNative[1]);
    const vals = valueNative as unknown as [number, number] | null;
    const campAmt = vals ? Number(vals[1] ?? 0) / 10_000_000 : 0;
    return { ...baseEvent, type: "faucet", title: "Token Purchase", message: `${shortAddr(buyer)} bought CAMP with XLM`, details: `${campAmt.toFixed(2)} CAMP`, color: "cyan", icon: "faucet" };
  }

  if (eventName === "escrow_created") {
    const counter = decodeNative(topicNative[1]);
    const buyer = extractAddress(topicNative[2]);
    const seller = extractAddress(topicNative[3]);
    const amountI128 = decodeNative(valueNative) ?? 0;
    const amount = Number(amountI128) / 10_000_000;
    return { ...baseEvent, type: "escrow", title: "Escrow Created", message: `#${counter} — ${shortAddr(buyer)} → ${shortAddr(seller)}`, details: `${amount.toFixed(2)} CAMP`, color: "orange", icon: "escrow" };
  }

  if (eventName === "escrow_released") {
    const id = decodeNative(topicNative[1]);
    const seller = extractAddress(topicNative[3]);
    const amountI128 = decodeNative(valueNative) ?? 0;
    const amount = Number(amountI128) / 10_000_000;
    return { ...baseEvent, type: "escrow", title: "Escrow Released", message: `#${id} — paid ${shortAddr(seller)}`, details: `${amount.toFixed(2)} CAMP`, color: "emerald", icon: "escrow" };
  }

  if (eventName === "escrow_refunded") {
    const id = decodeNative(topicNative[1]);
    const buyer = extractAddress(topicNative[2]);
    const amountI128 = decodeNative(valueNative) ?? 0;
    const amount = Number(amountI128) / 10_000_000;
    return { ...baseEvent, type: "escrow", title: "Escrow Refunded", message: `#${id} — refunded to ${shortAddr(buyer)}`, details: `${amount.toFixed(2)} CAMP`, color: "orange", icon: "escrow" };
  }

  if (eventName === "event_created") {
    const counter = decodeNative(topicNative[1]);
    const host = extractAddress(topicNative[2]);
    return { ...baseEvent, type: "ticket", title: "Event Created", message: `Event #${counter} by ${shortAddr(host)}`, details: "new event published", color: "emerald", icon: "ticket" };
  }

  if (eventName === "ticket_bought") {
    const ticketId = decodeNative(topicNative[1]);
    const eventId = decodeNative(topicNative[2]);
    const buyer = extractAddress(topicNative[3]);
    const amountI128 = decodeNative(valueNative) ?? 0;
    const amount = Number(amountI128) / 10_000_000;
    return { ...baseEvent, type: "ticket", title: "Ticket Purchased", message: `Ticket #${ticketId} for Event #${eventId}`, details: `${shortAddr(buyer)} paid ${amount.toFixed(2)} CAMP`, color: "emerald", icon: "ticket" };
  }

  if (eventName === "ticket_redeemed") {
    const ticketId = decodeNative(topicNative[1]);
    const eventId = decodeNative(topicNative[2]);
    const host = extractAddress(topicNative[3]);
    return { ...baseEvent, type: "ticket", title: "Ticket Redeemed", message: `Ticket #${ticketId} for Event #${eventId}`, details: `by ${shortAddr(host)}`, color: "emerald", icon: "ticket" };
  }

  if (eventName === "university_registered") {
    const counter = decodeNative(topicNative[1]);
    const admin = extractAddress(topicNative[2]);
    return { ...baseEvent, type: "university", title: "University Registered", message: `#${counter} by ${shortAddr(admin)}`, details: "on-chain registry updated", color: "indigo", icon: "university" };
  }

  if (eventName === "join_requested") {
    const counter = decodeNative(topicNative[1]);
    const applicant = extractAddress(topicNative[3]);
    return { ...baseEvent, type: "role", title: "Join Requested", message: `${shortAddr(applicant)} requests to join university`, details: `request #${counter}`, color: "purple", icon: "role" };
  }

  if (eventName === "member_approved") {
    const requestId = decodeNative(topicNative[1]);
    const applicant = extractAddress(topicNative[2]);
    return { ...baseEvent, type: "role", title: "Member Approved", message: `${shortAddr(applicant)} was approved`, details: `request #${requestId}`, color: "emerald", icon: "role" };
  }

  if (eventName === "member_invited") {
    const counter = decodeNative(topicNative[1]);
    const invitee = extractAddress(topicNative[3]);
    return { ...baseEvent, type: "role", title: "Member Invited", message: `${shortAddr(invitee)} was invited`, details: `invite #${counter}`, color: "purple", icon: "role" };
  }

  if (eventName === "invite_accepted") {
    const inviteId = decodeNative(topicNative[1]);
    const invitee = extractAddress(topicNative[2]);
    return { ...baseEvent, type: "role", title: "Invite Accepted", message: `${shortAddr(invitee)} accepted invite`, details: `invite #${inviteId}`, color: "emerald", icon: "role" };
  }

  if (eventName === "member_left") {
    const member = extractAddress(topicNative[1]);
    return { ...baseEvent, type: "role", title: "Member Left", message: `${shortAddr(member)} left university`, details: "membership removed", color: "gray", icon: "role" };
  }

  if (eventName === "UniversityRegistered") {
    const admin = extractAddress(topicNative[1]);
    const name = valueNative && typeof valueNative === "object" && "name" in valueNative ? String((valueNative as { name: unknown }).name) : "";
    return { ...baseEvent, type: "university", title: "University Registered", message: `New claim: ${name || "Unknown University"}`, details: shortAddr(admin), color: "indigo", icon: "university" };
  }

  if (eventName === "UniversityApproved") {
    const code = extractStr(valueNative);
    return { ...baseEvent, type: "university", title: "University Approved", message: `University Approved: ${code}`, details: code, color: "emerald", icon: "university" };
  }

  if (eventName === "UniversityRejected") {
    const code = extractStr(valueNative);
    return { ...baseEvent, type: "university", title: "University Rejected", message: `University Rejected: ${code}`, details: code, color: "orange", icon: "university" };
  }

  if (eventName === "ProfileSubmittedForVerification") {
    const applicant = extractAddress(topicNative[1]);
    const code = extractStr(valueNative);
    return {
      ...baseEvent,
      type: "role",
      title: "Verification Request",
      message: `Applicant ${shortAddr(applicant)} requested verification`,
      details: code || "Pending Verification",
      color: "purple",
      icon: "role",
    };
  }

  if (eventName === "ProfileVerified") {
    const verifier = extractAddress(topicNative[1]);
    const target = extractAddress(topicNative[2]);
    const code = extractStr(valueNative);
    return {
      ...baseEvent,
      type: "role",
      title: "Profile Verified",
      message: `Profile ${shortAddr(target)} verified for ${code || "campus"}`,
      details: `Approved by ${shortAddr(verifier)}`,
      color: "emerald",
      icon: "role",
    };
  }

  if (eventName === "ProfileRejected") {
    const rejector = extractAddress(topicNative[1]);
    const target = extractAddress(topicNative[2]);
    const code = extractStr(valueNative);
    return {
      ...baseEvent,
      type: "role",
      title: "Profile Rejected",
      message: `Profile ${shortAddr(target)} rejected for ${code || "campus"}`,
      details: `Rejected by ${shortAddr(rejector)}`,
      color: "orange",
      icon: "role",
    };
  }

  if (eventName === "OrderPlaced") {
    const id = decodeNative(topicNative[1]) ?? 0;
    const student = extractAddress(topicNative[2]);
    const uniCode = extractStr(topicNative[3]);
    const amountI128 = decodeNative(valueNative) ?? 0;
    const amount = Number(amountI128) / 10_000_000;
    return {
      ...baseEvent,
      type: "order",
      title: "New Order Placed",
      message: `Order #${id} placed by ${shortAddr(student)}`,
      details: `${uniCode ? `${uniCode} · ` : ""}${amount.toFixed(2)} CAMP`,
      color: "blue",
      icon: "order",
    };
  }

  if (eventName === "OrderStatusChanged") {
    const id = decodeNative(topicNative[1]) ?? 0;
    let statusText = "Updated";
    if (valueNative && typeof valueNative === "object" && "name" in valueNative) {
      statusText = String((valueNative as { name: unknown }).name);
    } else if (typeof valueNative === "number") {
      statusText = ["Placed", "Preparing", "ReadyForPickup", "Completed", "Cancelled"][valueNative - 1] ?? "Updated";
    } else if (typeof valueNative === "string") {
      statusText = valueNative;
    }
    const label = statusText === "ReadyForPickup" ? "Ready for Pickup" : statusText;

    return {
      ...baseEvent,
      type: "order",
      title: "Order Status Update",
      message: `Order #${id} is now ${label}`,
      details: statusText,
      color: label === "Completed" ? "emerald" : label === "Cancelled" ? "orange" : "amber",
      icon: "order",
    };
  }

  if (eventName === "MenuItemPublished") {
    const id = decodeNative(topicNative[1]) ?? 0;
    const merchant = extractAddress(topicNative[2]);
    const uniCode = extractStr(topicNative[3]);
    const priceI128 = decodeNative(valueNative) ?? 0;
    const price = Number(priceI128) / 10_000_000;
    return {
      ...baseEvent,
      type: "order",
      title: "Menu Item Published",
      message: `Item #${id} listed by ${shortAddr(merchant)}`,
      details: `${uniCode ? `${uniCode} · ` : ""}${price.toFixed(2)} CAMP`,
      color: "emerald",
      icon: "order",
    };
  }

  if (eventName === "item_listed") {
    const id = decodeNative(topicNative[1]) ?? 0;
    const seller = extractAddress(topicNative[2]);
    const uniCode = extractStr(topicNative[3]);
    const vals = valueNative as unknown as [number, string] | null;
    const price = vals ? Number(vals[0] ?? 0) / 10_000_000 : 0;
    return {
      ...baseEvent,
      type: "marketplace",
      title: "Item Listed",
      message: `${shortAddr(seller)} listed item #${id} for sale`,
      details: `${uniCode ? `${uniCode} · ` : ""}${price.toFixed(2)} CAMP`,
      color: "emerald",
      icon: "marketplace",
      topicNative: [...topicNative, uniCode],
    };
  }

  if (eventName === "ScholarshipCreated") {
    const id = decodeNative(topicNative[1]) ?? 0;
    const university = extractAddress(topicNative[2]);
    const uniCode = extractStr(topicNative[3]);
    const amountI128 = decodeNative(valueNative) ?? 0;
    const amount = Number(amountI128) / 10_000_000;
    return { ...baseEvent, type: "scholarship", title: "Scholarship Created", message: `#${id} submitted by ${shortAddr(university)}`, details: `${uniCode} · ${amount.toFixed(2)} CAMP`, color: "amber", icon: "scholarship" };
  }

  if (eventName === "ScholarshipApproved") {
    const id = decodeNative(topicNative[1]) ?? 0;
    const admin = extractAddress(topicNative[2]);
    const uniCode = extractStr(topicNative[3]);
    return {
      ...baseEvent, type: "scholarship", title: "Scholarship Approved",
      message: `Scholarship #${id} (${uniCode || "university"}) approved by ${shortAddr(admin)}`,
      details: shortAddr(admin), color: "emerald", icon: "scholarship",
    };
  }

  if (eventName === "ScholarshipRejected") {
    const id = decodeNative(topicNative[1]) ?? 0;
    const admin = extractAddress(topicNative[2]);
    const uniCode = extractStr(topicNative[3]);
    return {
      ...baseEvent, type: "scholarship", title: "Scholarship Rejected",
      message: `Scholarship #${id} (${uniCode || "university"}) rejected by ${shortAddr(admin)}`,
      details: shortAddr(admin), color: "orange", icon: "scholarship",
    };
  }

  if (eventName === "ScholarshipSuspended") {
    const id = decodeNative(topicNative[1]) ?? 0;
    const admin = extractAddress(topicNative[2]);
    const uniCode = extractStr(topicNative[3]);
    return {
      ...baseEvent, type: "scholarship", title: "Scholarship Suspended",
      message: `Scholarship #${id} (${uniCode || "university"}) suspended by ${shortAddr(admin)}`,
      details: shortAddr(admin), color: "orange", icon: "scholarship",
    };
  }

  if (eventName === "ScholarshipApplied") {
    const appId = decodeNative(topicNative[1]) ?? 0;
    const student = extractAddress(topicNative[2]);
    const uniCode = extractStr(topicNative[3]);
    const vals = valueNative as unknown as [number, number, string] | null;
    const scholarshipId = vals ? Number(vals[0] ?? 0) : 0;
    const amount = vals ? Number(vals[1] ?? 0) / 10_000_000 : 0;
    const title = vals ? String(vals[2] ?? "") : "";
    return {
      ...baseEvent,
      type: "scholarship",
      title: "Scholarship Application Submitted",
      message: `App #${appId}: Student ${shortAddr(student)} applied for ${title || `Scholarship #${scholarshipId}`}`,
      details: `${uniCode ? `${uniCode} · ` : ""}${amount.toFixed(2)} CAMP`,
      color: "amber",
      icon: "scholarship",
    };
  }

  if (eventName === "ScholarshipAppApproved") {
    const appId = decodeNative(topicNative[1]) ?? 0;
    const student = extractAddress(topicNative[2]);
    const uniCode = extractStr(topicNative[3]);
    const vals = valueNative as unknown as [number, number, string] | null;
    const scholarshipId = vals ? Number(vals[0] ?? 0) : 0;
    const amount = vals ? Number(vals[1] ?? 0) / 10_000_000 : 0;
    const university = vals ? String(vals[2] ?? "") : "";
    return {
      ...baseEvent,
      type: "scholarship",
      title: "Scholarship Application Approved",
      message: `App #${appId} (Scholarship #${scholarshipId}) for ${shortAddr(student)} approved by ${shortAddr(university)}`,
      details: `${uniCode ? `${uniCode} · ` : ""}+${amount.toFixed(2)} CAMP`,
      color: "emerald",
      icon: "scholarship",
    };
  }

  if (eventName === "ScholarshipAppRejected") {
    const appId = decodeNative(topicNative[1]) ?? 0;
    const student = extractAddress(topicNative[2]);
    const uniCode = extractStr(topicNative[3]);
    const vals = valueNative as unknown as [number, string] | null;
    const scholarshipId = vals ? Number(vals[0] ?? 0) : 0;
    const university = vals ? String(vals[1] ?? "") : "";
    return {
      ...baseEvent,
      type: "scholarship",
      title: "Scholarship Application Rejected",
      message: `App #${appId} (Scholarship #${scholarshipId}) for ${shortAddr(student)} rejected by ${shortAddr(university)}`,
      details: `${uniCode ? `${uniCode} · ` : ""}Rejected`,
      color: "orange",
      icon: "scholarship",
    };
  }

  if (eventName === "camp_withdrawn") {
    const student = extractAddress(topicNative[1]);
    const uniCode = extractStr(topicNative[2]);
    const vals = valueNative as unknown as [number, number] | null;
    const campAmt = vals ? Number(vals[0] ?? 0) / 10_000_000 : 0;
    const xlmAmt = vals ? Number(vals[1] ?? 0) / 10_000_000 : 0;
    return {
      ...baseEvent,
      type: "faucet",
      title: "CAMP Withdrawn to XLM",
      message: `${shortAddr(student)} withdrawn ${campAmt.toFixed(2)} CAMP to ${xlmAmt.toFixed(2)} XLM`,
      details: `${uniCode ? `${uniCode} · ` : ""}-${campAmt.toFixed(2)} CAMP`,
      color: "amber",
      icon: "faucet",
    };
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
  rose: "bg-rose-50 text-rose-600 border-rose-100",
};
