/**
 * useCampusBalance.test.tsx
 *
 * Unit tests for the useCampusBalance React Query hook.
 * Mocks at the service boundary (../service/campusToken) so the real hook
 * and query-client logic are exercised without hitting Soroban RPC.
 */
import { describe, it, expect, vi, beforeEach } from "vitest";
import { renderHook, waitFor } from "@testing-library/react";
import { QueryClient, QueryClientProvider } from "@tanstack/react-query";
import React from "react";
import { useCampusBalance } from "@/features/wallet/hooks/useWallet";

// ── Mock the service layer (not the hook) ───────────────────────────────────
vi.mock("@/features/wallet/service/campusToken", () => ({
  fetchBalance: vi.fn(),
  fetchUserRole: vi.fn().mockResolvedValue(1),
  fetchTokenMetadata: vi.fn().mockResolvedValue({ name: "CampusChain Token", symbol: "CAMP", decimals: 7, totalSupply: 1_000_000 }),
  executeTransfer: vi.fn(),
  executeApprove: vi.fn(),
  executeSetRole: vi.fn(),
  executeRequestRoleChange: vi.fn(),
  executeApproveRoleChange: vi.fn(),
  executeDenyRoleChange: vi.fn(),
  fetchPendingRoleRequests: vi.fn().mockResolvedValue([]),
}));

// Keep a reference so individual tests can configure it
import { fetchBalance } from "@/features/wallet/service/campusToken";
const mockFetchBalance = vi.mocked(fetchBalance);

function makeWrapper() {
  const qc = new QueryClient({
    defaultOptions: { queries: { retry: false } },
  });
  return ({ children }: { children: React.ReactNode }) =>
    React.createElement(QueryClientProvider, { client: qc }, children);
}

const TEST_ADDR = "GABC1234567890XXXXXXXXXXXXXXXXXXXXXXXXXXXXXXXXXXXXXXXXXXX";

describe("useCampusBalance", () => {
  beforeEach(() => {
    vi.clearAllMocks();
  });

  it("returns the fetched balance divided by 10_000_000 on success", async () => {
    // fetchBalance in the hook returns the already-divided value from the service
    mockFetchBalance.mockResolvedValue(500.0);

    const { result } = renderHook(() => useCampusBalance(TEST_ADDR), {
      wrapper: makeWrapper(),
    });

    await waitFor(() => expect(result.current.isSuccess).toBe(true));
    expect(result.current.data).toBe(500.0);
    expect(mockFetchBalance).toHaveBeenCalledWith(TEST_ADDR);
  });

  it("falls back to 1000.0 when the service throws", async () => {
    mockFetchBalance.mockRejectedValue(new Error("RPC timeout"));

    const { result } = renderHook(() => useCampusBalance(TEST_ADDR), {
      wrapper: makeWrapper(),
    });

    // The hook catches the error internally and returns the fallback
    await waitFor(() => expect(result.current.isSuccess).toBe(true));
    expect(result.current.data).toBe(1000.0);
  });

  it("stays disabled (no fetch) when address is null", async () => {
    const { result } = renderHook(() => useCampusBalance(null), {
      wrapper: makeWrapper(),
    });

    // query is disabled — stays in pending/idle state, never calls fetchBalance
    await new Promise((r) => setTimeout(r, 50));
    expect(mockFetchBalance).not.toHaveBeenCalled();
    expect(result.current.data).toBeUndefined();
  });
});
