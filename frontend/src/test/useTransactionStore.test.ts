import { describe, it, expect, beforeEach } from "vitest";
import { useTransactionStore } from "../state/useTransactionStore";

describe("useTransactionStore", () => {
  beforeEach(() => {
    // Reset Zustand store state
    useTransactionStore.setState({
      transactions: [],
    });
  });

  it("should add a new transaction to the log history", () => {
    const store = useTransactionStore.getState();
    store.addTransaction({
      hash: "hash_123",
      status: "pending",
      method: "TRANSFER",
      timestamp: 1625097600000,
    });

    const txs = useTransactionStore.getState().transactions;
    expect(txs).toHaveLength(1);
    expect(txs[0].hash).toBe("hash_123");
    expect(txs[0].status).toBe("pending");
  });

  it("should update an existing transaction status by hash", () => {
    const store = useTransactionStore.getState();
    store.addTransaction({
      hash: "hash_123",
      status: "pending",
      method: "TRANSFER",
      timestamp: 1625097600000,
    });

    store.updateTransaction("hash_123", { status: "confirmed", explorerUrl: "https://stellar.org" });

    const txs = useTransactionStore.getState().transactions;
    expect(txs[0].status).toBe("confirmed");
    expect(txs[0].explorerUrl).toBe("https://stellar.org");
  });

  it("should clear all transaction history", () => {
    const store = useTransactionStore.getState();
    store.addTransaction({
      hash: "hash_123",
      status: "pending",
      method: "TRANSFER",
      timestamp: 1625097600000,
    });

    store.clearTransactions();

    const txs = useTransactionStore.getState().transactions;
    expect(txs).toHaveLength(0);
  });
});
