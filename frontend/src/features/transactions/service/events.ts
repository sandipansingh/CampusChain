import {
  getRpcServer,
  NEXT_PUBLIC_CAMPUS_SERVICE_CONTRACT_ID,
  NEXT_PUBLIC_CAMPUS_TOKEN_CONTRACT_ID,
  NEXT_PUBLIC_CAMPUS_IDENTITY_CONTRACT_ID,
  getEventsSafe,
} from "@/shared/stellar/client";
import { decodeEvent, DecodedEvent } from "@/shared/stellar/eventDecoder";
import { scValToNative } from "@stellar/stellar-sdk";

export type RawEvent = {
  id: string;
  ledger: number;
  ledgerClosedAt: string;
  txHash: string;
  topic: unknown[];
  value: unknown;
};

export interface OperationsEventReadResult {
  events: DecodedEvent[];
  partial: boolean;
  truncated: boolean;
  error?: string;
  failedContracts?: string[];
}

const EVENT_PAGE_SIZE = 50;
const OPERATIONS_EVENT_LIMIT_PER_CONTRACT = 250;

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

async function getStartLedger(server: ReturnType<typeof getRpcServer>, lookbackBlocks = 100_000): Promise<number> {
  const latest = await server.getLatestLedger();
  return Math.max(1, latest.sequence - lookbackBlocks);
}

type EventPageResponse = { events?: RawEvent[]; cursor?: string };

async function getEventPage(
  server: ReturnType<typeof getRpcServer>,
  startLedger: number,
  contractId: string,
  cursor?: string,
  limit = EVENT_PAGE_SIZE
): Promise<EventPageResponse> {
  return (await getEventsSafe(server, {
    startLedger,
    ...(cursor ? { cursor } : {}),
    filters: [{ type: "contract", contractIds: [contractId] }],
    limit: Math.min(EVENT_PAGE_SIZE, limit),
  })) as EventPageResponse;
}

interface ContractWindowResult {
  events: RawEvent[];
  truncated: boolean;
}

async function readContractEventWindow(
  server: ReturnType<typeof getRpcServer>,
  startLedger: number,
  contractId: string,
  maxEvents: number
): Promise<ContractWindowResult> {
  const events: RawEvent[] = [];
  let cursor: string | undefined;

  while (events.length < maxEvents) {
    const limit = Math.min(EVENT_PAGE_SIZE, maxEvents - events.length);
    const response = await getEventPage(server, startLedger, contractId, cursor, limit);
    const page = Array.isArray(response.events) ? response.events : [];
    events.push(...page.slice(0, limit));

    if (events.length >= maxEvents) {
      return { events, truncated: true };
    }
    const nextCursor = response.cursor ? String(response.cursor) : undefined;
    if (cursor !== undefined && nextCursor === cursor) {
      throw new Error(`Event cursor did not advance for contract ${contractId}`);
    }
    if (page.length === 0 || page.length < limit || !nextCursor) {
      return { events, truncated: false };
    }
    cursor = nextCursor;
  }

  return { events, truncated: true };
}

const EVENT_CONTRACTS = [
  NEXT_PUBLIC_CAMPUS_SERVICE_CONTRACT_ID,
  NEXT_PUBLIC_CAMPUS_TOKEN_CONTRACT_ID,
  NEXT_PUBLIC_CAMPUS_IDENTITY_CONTRACT_ID,
];

/** Operations Center event window: recent 10,000 ledgers, at most 250 events per contract. */
export async function fetchLedgerEventsForOperations(): Promise<OperationsEventReadResult> {
  const server = getRpcServer();
  const startLedger = await getStartLedger(server, 10_000);
  const results = await Promise.allSettled(
    EVENT_CONTRACTS.map((contractId) => readContractEventWindow(
      server,
      startLedger,
      contractId,
      OPERATIONS_EVENT_LIMIT_PER_CONTRACT
    ))
  );
  const rawEvents: RawEvent[] = [];
  const failedContracts: string[] = [];
  const errors: string[] = [];
  let truncated = false;

  results.forEach((result, index) => {
    if (result.status === "fulfilled") {
      rawEvents.push(...result.value.events);
      truncated ||= result.value.truncated;
    } else {
      failedContracts.push(EVENT_CONTRACTS[index]);
      errors.push(`${EVENT_CONTRACTS[index]}: ${result.reason instanceof Error ? result.reason.message : String(result.reason)}`);
    }
  });

  if (failedContracts.length === EVENT_CONTRACTS.length) {
    throw new Error(errors.join("; ") || "All Soroban event sources failed");
  }

  const events = rawEvents
    .sort((a, b) => b.ledger - a.ledger)
    .map(decodeOrNull)
    .filter((event): event is DecodedEvent => event !== null);
  const partial = failedContracts.length > 0 || truncated;
  const notices = [...errors];
  if (truncated) notices.push("Recent 10,000-ledger activity window reached the 250-event-per-contract cap");

  return {
    events,
    partial,
    truncated,
    ...(notices.length > 0 ? { error: notices.join("; ") } : {}),
    ...(failedContracts.length > 0 ? { failedContracts } : {}),
  };
}

// ── Public API ────────────────────────────────────────────────────────────────

/** Fetch the last ~50 events across all contracts — used in the notification panel. */
export async function fetchLedgerEventsRaw(): Promise<DecodedEvent[]> {
  const result = await fetchLedgerEventsForOperations();
  return result.events.slice(0, 50);
}

/**
 * Event fetch for the Activity page.
 *
 * - `address` → own-wallet filter (students, merchants, sub-roles)
 * - `universityCode` → campus-scoped filter (university admins)
 * - neither → global filter (platform admins)
 */
export async function fetchEventsPaginated(
  cursor: string | null,
  limit = 100,
  address?: string,
  universityCode?: string
) {
  const server = getRpcServer();
  const startLedger = await getStartLedger(server, 100_000);
  const cursorState: Record<string, string | null> = {};
  if (cursor) {
    try {
      const parsed = JSON.parse(decodeURIComponent(cursor)) as Record<string, unknown>;
      EVENT_CONTRACTS.forEach((contractId) => {
        if (typeof parsed[contractId] === "string") cursorState[contractId] = parsed[contractId] as string;
        else if (parsed[contractId] === null) cursorState[contractId] = null;
      });
    } catch {
      // A malformed cursor is treated as an initial page so the feed remains usable.
    }
  }

  const pageLimit = Math.min(EVENT_PAGE_SIZE, Math.max(1, Math.floor(limit)));
  const results = await Promise.all(EVENT_CONTRACTS.map(async (contractId) => ({
    contractId,
    response: cursor && cursorState[contractId] === null
      ? { events: [] }
      : await getEventPage(server, startLedger, contractId, cursorState[contractId] ?? undefined, pageLimit),
  })));
  const combined = results.flatMap(({ response }) => Array.isArray(response.events) ? response.events : [])
    .sort((a, b) => b.ledger - a.ledger);
  const nextCursorState: Record<string, string | null> = {};
  results.forEach(({ contractId, response }) => {
    if (response.cursor && String(response.cursor) !== cursorState[contractId]) {
      nextCursorState[contractId] = String(response.cursor);
    } else {
      nextCursorState[contractId] = null;
    }
  });

  const events = combined.filter((event) => {
    if (universityCode) {
      // University admin: events matching campus code OR involving admin address
      return eventBelongsToCampus(event, universityCode) || eventInvolvesAddress(event, address);
    }
    // Own-wallet filter or global (no filter)
    return eventInvolvesAddress(event, address);
  });

  const decodedEvents = events.map(decodeOrNull).filter((e): e is DecodedEvent => e !== null);
  const hasMore = Object.values(nextCursorState).some((next) => next !== null);

  return {
    events: decodedEvents,
    cursor: hasMore ? encodeURIComponent(JSON.stringify(nextCursorState)) : null,
    hasMore,
  };
}
