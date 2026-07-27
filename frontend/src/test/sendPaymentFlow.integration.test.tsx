/**
 * sendPaymentFlow.integration.test.tsx
 *
 * Integration test: connect wallet → view balance → send payment → cache invalidated.
 *
 * Strategy:
 *   - Mock at the SERVICE boundary only (campusToken.ts), not at the hook or UI level.
 *   - The real useCampusBalance and useTransferMutation hooks run their actual React Query
 *     logic (enabled checks, invalidation, etc.).
 *   - We verify that after a successful transfer mutation, the balance query is invalidated
 *     and refetched (the new balance appears without any manual reload).
 *
 * No Freighter popup, no Soroban RPC — everything stops at the service mock layer.
 */
import { describe, it, expect, vi, beforeEach } from "vitest";
import { render, screen, fireEvent, waitFor } from "@testing-library/react";
import userEvent from "@testing-library/user-event";
import React, { useState } from "react";
import { QueryClient, QueryClientProvider } from "@tanstack/react-query";
import { useCampusBalance, useTransferMutation } from "@/features/wallet/hooks/useWallet";

// ── Mock the service layer (contract calls stop here) ─────────────────────
const mockFetchBalance = vi.fn();
const mockExecuteTransfer = vi.fn();

vi.mock("@/features/wallet/service/campusToken", () => ({
  fetchBalance: (...args: unknown[]) => mockFetchBalance(...args),
  fetchUserRole: vi.fn().mockResolvedValue(1),
  fetchTokenMetadata: vi.fn().mockResolvedValue({
    name: "CampusChain Token",
    symbol: "CAMP",
    decimals: 7,
    totalSupply: 1_000_000,
  }),
  executeTransfer: (...args: unknown[]) => mockExecuteTransfer(...args),
  executeApprove: vi.fn().mockResolvedValue("mock-tx-hash"),
  executeSetRole: vi.fn().mockResolvedValue("mock-tx-hash"),
  executeRequestRoleChange: vi.fn().mockResolvedValue("mock-tx-hash"),
  executeApproveRoleChange: vi.fn().mockResolvedValue("mock-tx-hash"),
  executeDenyRoleChange: vi.fn().mockResolvedValue("mock-tx-hash"),
  fetchPendingRoleRequests: vi.fn().mockResolvedValue([]),
}));

// ── Test Component ─────────────────────────────────────────────────────────
// A minimal component that exercises the real hook logic end-to-end
const SENDER = "GAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAWHF";
const RECIPIENT = "GBBBBBBBBBBBBBBBBBBBBBBBBBBBBBBBBBBBBBBBBBBBBBBBBBBBBB4";

function WalletPage() {
  const { data: balance, isLoading } = useCampusBalance(SENDER);
  const transfer = useTransferMutation();
  const [amount, setAmount] = useState("50");
  const [txHash, setTxHash] = useState<string | null>(null);
  const [error, setError] = useState<string | null>(null);

  const handleSend = async () => {
    setError(null);
    try {
      const hash = await transfer.mutateAsync({
        from: SENDER,
        to: RECIPIENT,
        amount: parseFloat(amount),
      });
      setTxHash(hash);
    } catch (e) {
      setError(e instanceof Error ? e.message : "Unknown error");
    }
  };

  return (
    <div>
      {isLoading ? (
        <span data-testid="balance-loading">Loading...</span>
      ) : (
        <span data-testid="balance-value">{balance?.toFixed(2)} CAMP</span>
      )}

      <input
        data-testid="amount-input"
        value={amount}
        onChange={(e) => setAmount(e.target.value)}
      />

      <button
        data-testid="send-button"
        onClick={handleSend}
        disabled={transfer.isPending}
      >
        {transfer.isPending ? "Sending..." : "Send"}
      </button>

      {txHash && <span data-testid="tx-hash">{txHash}</span>}
      {error && <span data-testid="error-msg">{error}</span>}
    </div>
  );
}

// ── Test Wrapper ───────────────────────────────────────────────────────────
function makeWrapper() {
  const qc = new QueryClient({
    defaultOptions: { queries: { retry: false }, mutations: { retry: false } },
  });
  return ({ children }: { children: React.ReactNode }) =>
    React.createElement(QueryClientProvider, { client: qc }, children);
}

// ── Tests ──────────────────────────────────────────────────────────────────
describe("Send Payment Integration Flow", () => {
  beforeEach(() => {
    vi.clearAllMocks();
  });

  it("HAPPY PATH: shows balance, sends payment, shows tx hash, and balance refetches", async () => {
    // Initial balance: 1000 CAMP; after transfer it drops to 950
    mockFetchBalance
      .mockResolvedValueOnce(1000.0)   // first fetch (on mount)
      .mockResolvedValueOnce(950.0);   // refetch after invalidation

    mockExecuteTransfer.mockResolvedValue("confirmed-tx-hash-abc");

    render(<WalletPage />, { wrapper: makeWrapper() });

    // 1. Wait for initial balance to load
    await waitFor(() =>
      expect(screen.getByTestId("balance-value")).toHaveTextContent("1000.00 CAMP")
    );

    // 2. Click Send
    await userEvent.click(screen.getByTestId("send-button"));

    // 3. Confirm tx hash appears
    await waitFor(() =>
      expect(screen.getByTestId("tx-hash")).toHaveTextContent("confirmed-tx-hash-abc")
    );

    // 4. Balance should have been invalidated and refetched (new value: 950)
    await waitFor(() =>
      expect(screen.getByTestId("balance-value")).toHaveTextContent("950.00 CAMP")
    );

    // 5. The service was called with the correct arguments
    expect(mockExecuteTransfer).toHaveBeenCalledWith(SENDER, RECIPIENT, 50);
    expect(mockFetchBalance).toHaveBeenCalledTimes(2);
  });

  it("ERROR PATH: shows error message when transfer service throws", async () => {
    mockFetchBalance.mockResolvedValue(1000.0);
    mockExecuteTransfer.mockRejectedValue(
      new Error("Transaction signature was rejected by user.")
    );

    render(<WalletPage />, { wrapper: makeWrapper() });

    await waitFor(() =>
      expect(screen.getByTestId("balance-value")).toHaveTextContent("1000.00 CAMP")
    );

    await userEvent.click(screen.getByTestId("send-button"));

    await waitFor(() =>
      expect(screen.getByTestId("error-msg")).toHaveTextContent(
        "Transaction signature was rejected by user."
      )
    );

    // Balance should NOT be refetched on error
    expect(mockFetchBalance).toHaveBeenCalledTimes(1);
  });

  it("DISABLED STATE: send button is disabled while transfer is pending", async () => {
    mockFetchBalance.mockResolvedValue(1000.0);
    // Never resolves — keeps the mutation in pending state
    mockExecuteTransfer.mockReturnValue(new Promise(() => {}));

    render(<WalletPage />, { wrapper: makeWrapper() });
    await waitFor(() =>
      expect(screen.getByTestId("balance-value")).toBeInTheDocument()
    );

    const btn = screen.getByTestId("send-button");
    fireEvent.click(btn);

    await waitFor(() =>
      expect(screen.getByTestId("send-button")).toBeDisabled()
    );
  });
});
