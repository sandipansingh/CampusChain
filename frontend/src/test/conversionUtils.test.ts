/**
 * conversionUtils.test.ts
 *
 * Unit tests for:
 * 1. XLM ↔ CAMP conversion arithmetic (raw stroop / 10_000_000)
 * 2. mapTransactionError — human-readable error string mapping
 * 3. shortAddr / relativeTime from eventDecoder
 */
import { describe, it, expect, vi, afterEach } from "vitest";
import { mapTransactionError } from "@/shared/hooks/useTransactionStatus";
import { shortAddr, relativeTime } from "@/shared/stellar/eventDecoder";

// XLM ↔ CAMP conversion helpers (same arithmetic used in campusToken.ts)
function xlmToCamp(xlmAmount: number, rate = 100): number {
  return xlmAmount * rate;
}

function campToRawStroops(campAmount: number): bigint {
  return BigInt(Math.round(campAmount * 10_000_000));
}

function rawStroopsToCamp(raw: bigint): number {
  return Number(raw) / 10_000_000;
}

// CAMP conversion tests
describe("XLM ↔ CAMP conversion arithmetic", () => {
  it("converts 1 XLM to 100 CAMP at default rate", () => {
    expect(xlmToCamp(1)).toBe(100);
  });

  it("converts 0.5 XLM to 50 CAMP at default rate", () => {
    expect(xlmToCamp(0.5)).toBe(50);
  });

  it("round-trips CAMP amount through raw stroops correctly", () => {
    const camp = 123.456789;
    const raw = campToRawStroops(camp);
    const back = rawStroopsToCamp(raw);
    // Should match to 7 decimal places (stroop precision)
    expect(Math.abs(back - camp)).toBeLessThan(0.0000001);
  });

  it("handles 0 CAMP → 0 raw stroops → 0 CAMP", () => {
    expect(campToRawStroops(0)).toBe(BigInt(0));
    expect(rawStroopsToCamp(BigInt(0))).toBe(0);
  });

  it("handles large amounts without overflow", () => {
    const camp = 1_000_000;
    const raw = campToRawStroops(camp);
    expect(raw).toBe(BigInt(10_000_000_000_000));
    expect(rawStroopsToCamp(raw)).toBe(camp);
  });
});

// mapTransactionError tests
describe("mapTransactionError", () => {
  it("maps user rejection to a friendly message", () => {
    const msg = mapTransactionError(new Error("User rejected the transaction"));
    expect(msg).toContain("rejected");
  });

  it("maps wallet not installed error", () => {
    const msg = mapTransactionError(new Error("Wallet not installed"));
    expect(msg).toContain("not installed");
  });

  it("maps wrong network error", () => {
    const msg = mapTransactionError(new Error("wrong network detected"));
    expect(msg).toContain("network");
  });

  it("maps underfunded account error", () => {
    const msg = mapTransactionError(new Error("underfunded account balance"));
    expect(msg).toContain("balance");
  });

  it("passes through unknown errors as-is", () => {
    const msg = mapTransactionError(new Error("Something completely novel"));
    expect(msg).toBe("Something completely novel");
  });

  it("handles null/undefined gracefully", () => {
    expect(mapTransactionError(null)).toBe("An unknown error occurred.");
    expect(mapTransactionError(undefined)).toBe("An unknown error occurred.");
  });

  it("handles string errors", () => {
    const msg = mapTransactionError("User closed connection");
    expect(msg).toContain("canceled");
  });
});

// shortAddr / relativeTime tests
describe("shortAddr", () => {
  it("shortens a full Stellar address to 8+8 with ellipsis", () => {
    const full = "GABC1234567890XXXXXXXXXXXXXXXXXXXXXXXXXXXXXXXXXXXXXXXXXXX";
    const short = shortAddr(full);
    expect(short).toBe("GABC1234...XXXXXXXX");
  });

  it("returns short addresses unchanged", () => {
    expect(shortAddr("SHORT")).toBe("SHORT");
  });

  it("handles exactly 10-character strings unchanged", () => {
    expect(shortAddr("1234567890")).toBe("1234567890");
  });
});

describe("relativeTime", () => {
  afterEach(() => {
    vi.useRealTimers();
  });

  it("returns 'just now' for timestamps less than 1 minute ago", () => {
    vi.useFakeTimers();
    vi.setSystemTime(new Date("2024-01-01T12:00:30Z"));
    expect(relativeTime("2024-01-01T12:00:00Z")).toBe("just now");
  });

  it("returns minutes ago for timestamps 1-59 minutes old", () => {
    vi.useFakeTimers();
    vi.setSystemTime(new Date("2024-01-01T12:05:00Z"));
    expect(relativeTime("2024-01-01T12:00:00Z")).toBe("5m ago");
  });

  it("returns hours ago for timestamps 1-23 hours old", () => {
    vi.useFakeTimers();
    vi.setSystemTime(new Date("2024-01-01T14:00:00Z"));
    expect(relativeTime("2024-01-01T12:00:00Z")).toBe("2h ago");
  });

  it("returns days ago for timestamps >= 24 hours old", () => {
    vi.useFakeTimers();
    vi.setSystemTime(new Date("2024-01-03T12:00:00Z"));
    expect(relativeTime("2024-01-01T12:00:00Z")).toBe("2d ago");
  });
});
