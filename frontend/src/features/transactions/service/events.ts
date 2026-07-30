import {
  getRpcServer,
  NEXT_PUBLIC_CAMPUS_SERVICE_CONTRACT_ID,
  NEXT_PUBLIC_CAMPUS_TOKEN_CONTRACT_ID,
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

  const [sRes, tRes] = await Promise.all([
    server.getEvents({
      startLedger,
      filters: [
        {
          type: "contract",
          contractIds: [NEXT_PUBLIC_CAMPUS_SERVICE_CONTRACT_ID],
        },
      ],
      limit: 50,
    }),
    server.getEvents({
      startLedger,
      filters: [
        {
          type: "contract",
          contractIds: [NEXT_PUBLIC_CAMPUS_TOKEN_CONTRACT_ID],
        },
      ],
      limit: 50,
    }),
  ]);

  const allEvents = [...sRes.events, ...tRes.events]
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
  ];

  let res;
  if (cursor) {
    res = await server.getEvents({ filters: baseFilters, cursor, limit });
  } else {
    const latestLedger = await server.getLatestLedger();
    res = await server.getEvents({
      startLedger: Math.max(1, latestLedger.sequence - 5000),
      filters: baseFilters,
      limit,
    });
  }

  const decodedEvents = res.events
    .filter((event) => eventInvolvesAddress(event, address))
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

  return {
    events: decodedEvents,
    cursor: res.cursor ?? null,
    hasMore: res.events.length >= limit,
  };
}
