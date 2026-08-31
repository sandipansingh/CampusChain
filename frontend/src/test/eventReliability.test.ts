import { beforeEach, describe, expect, it, vi } from "vitest";
import {
  fetchEventsPaginated,
  fetchLedgerEventsForOperations,
} from "@/features/transactions/service/events";

const { getEventsSafe } = vi.hoisted(() => ({ getEventsSafe: vi.fn() }));

vi.mock("@/shared/stellar/client", () => ({
  getEventsSafe,
  getRpcServer: () => ({ getLatestLedger: vi.fn().mockResolvedValue({ sequence: 20_000 }) }),
  NEXT_PUBLIC_CAMPUS_IDENTITY_CONTRACT_ID: "identity",
  NEXT_PUBLIC_CAMPUS_SERVICE_CONTRACT_ID: "service",
  NEXT_PUBLIC_CAMPUS_TOKEN_CONTRACT_ID: "token",
}));

describe("Soroban event pagination", () => {
  beforeEach(() => getEventsSafe.mockReset());

  it("loads up to 250 events per contract and marks the recent window partial at the cap", async () => {
    let callNumber = 0;
    getEventsSafe.mockImplementation(async () => {
      callNumber += 1;
      const page = callNumber;
      return {
        events: Array.from({ length: 50 }, (_, index) => ({
          id: `event-${page}-${index}`,
          ledger: 20_000 - page * 50 - index,
          ledgerClosedAt: new Date().toISOString(),
          txHash: `tx-${page}-${index}`,
          topic: [],
          value: {},
        })),
        cursor: `cursor-${callNumber}`,
      };
    });

    const result = await fetchLedgerEventsForOperations();

    expect(result).toMatchObject({ partial: true, truncated: true });
    expect(result.error).toContain("250-event-per-contract cap");
    expect(getEventsSafe).toHaveBeenCalledTimes(15);
  });

  it("passes the encoded per-contract cursor to later Activity Feed pages", async () => {
    let callNumber = 0;
    getEventsSafe.mockImplementation(async () => {
      callNumber += 1;
      return {
        events: [],
        ...(callNumber <= 3 ? { cursor: `cursor-${callNumber}` } : {}),
      };
    });

    const first = await fetchEventsPaginated(null, 100);
    expect(first.hasMore).toBe(true);
    expect(first.cursor).toBeTruthy();

    getEventsSafe.mockClear();
    const second = await fetchEventsPaginated(first.cursor, 100);
    expect(second.hasMore).toBe(false);
    expect(callNumber).toBe(6);
  });
});
