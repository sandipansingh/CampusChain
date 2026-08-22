import {
  getRpcServer,
  NEXT_PUBLIC_CAMPUS_SERVICE_CONTRACT_ID,
  NEXT_PUBLIC_CAMPUS_TOKEN_CONTRACT_ID,
  NEXT_PUBLIC_CAMPUS_IDENTITY_CONTRACT_ID,
  getEventsSafe,
} from "@/shared/stellar/client";
import { decodeEvent, DecodedEvent } from "@/shared/stellar/eventDecoder";
import { scValToNative } from "@stellar/stellar-sdk";

type RawEvent = {
  id: string;
  ledger: number;
  ledgerClosedAt: string;
  txHash: string;
  topic: unknown[];
  value: unknown;
};

// ── Helpers ────────────────────────────────────────────────────────────────────

/**
 * Safely converts any native ScVal topic value (String, Symbol, Number, BigInt, or Stellar SDK Address object)
 * into a clean JavaScript string representation (e.g. base32 Stellar address "GDPJB...").
 */
export function extractString(val: unknown): string {
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
    return JSON.stringify(record);
  }
  return String(val);
}

/** Returns true if the given address appears anywhere in the event's topic list or value. */
export function eventInvolvesAddress(event: { topic: unknown[]; value?: unknown }, address?: string): boolean {
  if (!address) return true;
  try {
    const target = address.toLowerCase();
    const topics = (event.topic as never[]).map((t) => extractString(scValToNative(t as never)));
    const topicsStr = topics.join(" ").toLowerCase();
    if (topicsStr.includes(target)) return true;
    if (event.value) {
      const valNative = scValToNative(event.value as never);
      const valStr = extractString(valNative).toLowerCase();
      if (valStr.includes(target)) return true;
      if (typeof valNative === "object" && valNative !== null) {
        if (JSON.stringify(valNative).toLowerCase().includes(target)) return true;
      }
    }
  } catch {
    return false;
  }
  return false;
}

export function eventBelongsToCampus(event: { topic: unknown[]; value: unknown }, universityCode: string): boolean {
  if (!universityCode) return false;
  try {
    const targetCode = universityCode.trim().toUpperCase();
    const topics = (event.topic as never[]).map((t) => extractString(scValToNative(t as never)));
    
    // Check if universityCode matches any topic
    if (topics.some((t) => t.trim().toUpperCase() === targetCode)) {
      return true;
    }
    
    // Check if universityCode is in event.value (e.g. string code, struct, or array)
    if (event.value) {
      const valNative = scValToNative(event.value as never);
      const valStr = extractString(valNative).trim().toUpperCase();
      if (valStr === targetCode) {
        return true;
      }
      if (typeof valNative === "object" && valNative !== null) {
        const jsonStr = JSON.stringify(valNative).toUpperCase();
        if (jsonStr.includes(`"${targetCode}"`) || jsonStr.includes(targetCode)) {
          return true;
        }
      }
    }
  } catch {
    return false;
  }
  return false;
}

function decodeOrNull(evt: RawEvent): DecodedEvent | null {
  try {
    return decodeEvent({
      id: evt.id,
      ledger: evt.ledger,
      ledgerClosedAt: evt.ledgerClosedAt,
      txHash: evt.txHash,
      topic: evt.topic,
      value: evt.value,
    });
  } catch {
    return null;
  }
}

async function getStartLedger(lookbackBlocks = 100_000): Promise<number> {
  const server = getRpcServer();
  const latest = await server.getLatestLedger();
  return Math.max(1, latest.sequence - lookbackBlocks);
}

// ── Public API ────────────────────────────────────────────────────────────────

/** Fetch the last ~50 events across all contracts — used in the notification panel. */
export async function fetchLedgerEventsRaw(): Promise<DecodedEvent[]> {
  const server = getRpcServer();
  const startLedger = await getStartLedger(10_000);

  const [sRes, tRes, iRes] = (await Promise.all([
    getEventsSafe(server, {
      startLedger,
      filters: [{ type: "contract", contractIds: [NEXT_PUBLIC_CAMPUS_SERVICE_CONTRACT_ID] }],
      limit: 50,
    }),
    getEventsSafe(server, {
      startLedger,
      filters: [{ type: "contract", contractIds: [NEXT_PUBLIC_CAMPUS_TOKEN_CONTRACT_ID] }],
      limit: 50,
    }),
    getEventsSafe(server, {
      startLedger,
      filters: [{ type: "contract", contractIds: [NEXT_PUBLIC_CAMPUS_IDENTITY_CONTRACT_ID] }],
      limit: 50,
    }),
  ])) as [{ events: RawEvent[] }, { events: RawEvent[] }, { events: RawEvent[] }];

  return [...sRes.events, ...tRes.events, ...iRes.events]
    .sort((a, b) => b.ledger - a.ledger)
    .slice(0, 50)
    .map(decodeOrNull)
    .filter((e): e is DecodedEvent => e !== null);
}

/**
 * Event fetch for the Activity page.
 *
 * - `address` → own-wallet filter (students, merchants, sub-roles)
 * - `universityCode` → campus-scoped filter (university admins)
 * - neither → global filter (platform admins)
 */
export async function fetchEventsPaginated(
  _cursor: string | null,
  limit = 100,
  address?: string,
  universityCode?: string
) {
  const server = getRpcServer();
  const startLedger = await getStartLedger(100_000);

  const [sRes, tRes, iRes] = (await Promise.all([
    getEventsSafe(server, {
      startLedger,
      filters: [{ type: "contract", contractIds: [NEXT_PUBLIC_CAMPUS_SERVICE_CONTRACT_ID] }],
      limit,
    }),
    getEventsSafe(server, {
      startLedger,
      filters: [{ type: "contract", contractIds: [NEXT_PUBLIC_CAMPUS_TOKEN_CONTRACT_ID] }],
      limit,
    }),
    getEventsSafe(server, {
      startLedger,
      filters: [{ type: "contract", contractIds: [NEXT_PUBLIC_CAMPUS_IDENTITY_CONTRACT_ID] }],
      limit,
    }),
  ])) as [{ events: RawEvent[] }, { events: RawEvent[] }, { events: RawEvent[] }];

  const combined = [...sRes.events, ...tRes.events, ...iRes.events].sort(
    (a, b) => b.ledger - a.ledger
  );

  const events = combined.filter((event) => {
    if (universityCode) {
      // University admin: events matching campus code OR involving admin address
      return eventBelongsToCampus(event, universityCode) || eventInvolvesAddress(event, address);
    }
    // Own-wallet filter or global (no filter)
    return eventInvolvesAddress(event, address);
  });

  const decodedEvents = events.map(decodeOrNull).filter((e): e is DecodedEvent => e !== null);

  return {
    events: decodedEvents,
    cursor: null,
    hasMore: false,
  };
}
