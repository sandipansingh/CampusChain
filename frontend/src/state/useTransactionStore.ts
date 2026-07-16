import { create } from "zustand";

export interface Transaction {
  hash: string;
  status: "pending" | "processing" | "confirmed" | "failed";
  method: string;
  timestamp: number;
  explorerUrl?: string;
  errorMessage?: string;
  retryAction?: () => Promise<void>;
}

interface TransactionState {
  transactions: Transaction[];
  addTransaction: (tx: Transaction) => void;
  updateTransaction: (hash: string, updates: Partial<Transaction>) => void;
  clearTransactions: () => void;
}

export const useTransactionStore = create<TransactionState>((set) => ({
  transactions: [],
  addTransaction: (tx) =>
    set((state) => ({
      transactions: [tx, ...state.transactions],
    })),
  updateTransaction: (hash, updates) =>
    set((state) => ({
      transactions: state.transactions.map((tx) =>
        tx.hash === hash ? { ...tx, ...updates } : tx
      ),
    })),
  clearTransactions: () => set({ transactions: [] }),
}));
