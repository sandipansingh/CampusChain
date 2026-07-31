import {
  getRpcServer,
  NEXT_PUBLIC_CAMPUS_SERVICE_CONTRACT_ID,
  NEXT_PUBLIC_CAMPUS_TOKEN_CONTRACT_ID,
  NEXT_PUBLIC_CAMPUS_IDENTITY_CONTRACT_ID,
  getEventsSafe,
} from "@/shared/stellar/client";
import { decodeEvent, DecodedEvent } from "@/shared/stellar/eventDecoder";
import { scValToNative } from "@stellar/stellar-sdk";

function eventInvolvesAddress(event: { topic: unknown[] }, address?: string) {
  if (!address) return true;
  try {
    return JSON.stringify((event.topic as never[]).map((topic) => scValToNative(topic as never))).includes(address);
  } catch {
    return false;
  }
}

export async function fetchLedgerEventsRaw(): Promise<DecodedEvent[]> {
  const server = getRpcServer();
  const latestLedger = await server.getLatestLedger();
  const startLedger = Math.max(1, latestLedger.sequence - 2000);

  const [sRes, tRes, iRes] = (await Promise.all([
    getEventsSafe(server, {
      startLedger,
      filters: [
        {
          type: "contract",
          contractIds: [NEXT_PUBLIC_CAMPUS_SERVICE_CONTRACT_ID],
        },
      ],
      limit: 50,
    }),
    getEventsSafe(server, {
      startLedger,
      filters: [
        {
          type: "contract",
          contractIds: [NEXT_PUBLIC_CAMPUS_TOKEN_CONTRACT_ID],
        },
      ],
      limit: 50,
    }),
    getEventsSafe(server, {
      startLedger,
      filters: [
        {
          type: "contract",
          contractIds: [NEXT_PUBLIC_CAMPUS_IDENTITY_CONTRACT_ID],
        },
      ],
      limit: 50,
    }),
  ])) as [
    { events: { id: string; ledger: number; ledgerClosedAt: string; txHash: string; topic: unknown[]; value: unknown }[] },
    { events: { id: string; ledger: number; ledgerClosedAt: string; txHash: string; topic: unknown[]; value: unknown }[] },
    { events: { id: string; ledger: number; ledgerClosedAt: string; txHash: string; topic: unknown[]; value: unknown }[] }
  ];

  const allEvents = [...sRes.events, ...tRes.events, ...iRes.events]
    .sort((a, b) => b.ledger - a.ledger)
    .slice(0, 50);

  return allEvents
    .map((evt) => {
      try {
        return decodeEvent({
          id: evt.id,
          ledger: evt.ledger,
          ledgerClosedAt: evt.ledgerClosedAt,
          txHash: evt.txHash,
          topic: evt.topic as unknown[],
          value: evt.value as unknown,
        });
      } catch {
        return null;
      }
    })
    .filter((e): e is DecodedEvent => e !== null);
}

export async function fetchEventsPaginated(cursor: string | null, limit = 40, address?: string) {
  const server = getRpcServer();
  const baseFilters = [
    { type: "contract" as const, contractIds: [NEXT_PUBLIC_CAMPUS_SERVICE_CONTRACT_ID] },
    { type: "contract" as const, contractIds: [NEXT_PUBLIC_CAMPUS_TOKEN_CONTRACT_ID] },
    { type: "contract" as const, contractIds: [NEXT_PUBLIC_CAMPUS_IDENTITY_CONTRACT_ID] },
  ];

  let res: {
    events: { id: string; ledger: number; ledgerClosedAt: string; txHash: string; topic: unknown[]; value: unknown }[];
    cursor?: string | null;
  };
  if (cursor) {
    res = (await getEventsSafe(server, { filters: baseFilters, cursor, limit })) as never;
  } else {
    const latestLedger = await server.getLatestLedger();
    res = (await getEventsSafe(server, {
      startLedger: Math.max(1, latestLedger.sequence - 5000),
      filters: baseFilters,
      limit,
    })) as never;
  }

  const decodedEvents = res.events
    .filter((event: unknown) => eventInvolvesAddress(event as { topic: unknown[] }, address))
    .map((evt: unknown) => {
      const e = evt as { id: string; ledger: number; ledgerClosedAt: string; txHash: string; topic: unknown[]; value: unknown };
      try {
        return decodeEvent({
          id: e.id,
          ledger: e.ledger,
          ledgerClosedAt: e.ledgerClosedAt,
          txHash: e.txHash,
          topic: e.topic,
          value: e.value,
        });
      } catch {
        return null;
      }
    })
    .filter((e: unknown): e is DecodedEvent => e !== null);

  return {
    events: decodedEvents,
    cursor: res.cursor ?? null,
    hasMore: res.events.length >= limit,
  };
}
