import { create } from "zustand";

export type TransactionStatus = "idle" | "pending" | "processing" | "confirmed" | "failed";

export interface TransactionState {
  status: TransactionStatus;
  label: string;
  txHash: string | null;
  error: string | null;
  elapsedSeconds: number;
  retryAction: (() => Promise<unknown>) | null;

  setPending: (label: string, retry: () => Promise<unknown>) => void;
  setProcessing: () => void;
  setConfirmed: (hash: string) => void;
  setFailed: (error: string) => void;
  reset: () => void;
}

let timer: ReturnType<typeof setInterval> | null = null;

export const useTransactionStatusStore = create<TransactionState>((set) => ({
  status: "idle",
  label: "",
  txHash: null,
  error: null,
  elapsedSeconds: 0,
  retryAction: null,

  setPending: (label, retry) => {
    if (timer) clearInterval(timer);
    set({
      status: "pending",
      label,
      txHash: null,
      error: null,
      elapsedSeconds: 0,
      retryAction: retry,
    });
  },

  setProcessing: () => {
    if (timer) clearInterval(timer);
    set({ status: "processing", elapsedSeconds: 0 });
    timer = setInterval(() => {
      set((state) => ({ elapsedSeconds: state.elapsedSeconds + 1 }));
    }, 1000);
  },

  setConfirmed: (hash) => {
    if (timer) {
      clearInterval(timer);
      timer = null;
    }
    set({ status: "confirmed", txHash: hash });
  },

  setFailed: (error) => {
    if (timer) {
      clearInterval(timer);
      timer = null;
    }
    set({ status: "failed", error });
  },

  reset: () => {
    if (timer) {
      clearInterval(timer);
      timer = null;
    }
    set({
      status: "idle",
      label: "",
      txHash: null,
      error: null,
      elapsedSeconds: 0,
      retryAction: null,
    });
  },
}));

export function useTransactionStatus() {
  const status = useTransactionStatusStore((state) => state.status);
  const label = useTransactionStatusStore((state) => state.label);
  const txHash = useTransactionStatusStore((state) => state.txHash);
  const error = useTransactionStatusStore((state) => state.error);
  const elapsedSeconds = useTransactionStatusStore((state) => state.elapsedSeconds);
  const retry = useTransactionStatusStore((state) => state.retryAction);
  const reset = useTransactionStatusStore((state) => state.reset);

  return {
    status,
    label,
    txHash,
    error,
    elapsedSeconds,
    retry,
    reset,
  };
}

export function mapTransactionError(err: unknown): string {
  if (!err) return "An unknown error occurred.";
  const errMsg = err instanceof Error ? err.message : String(err);

  if (errMsg.includes("User closed connection") || errMsg.includes("closed connection") || errMsg.includes("Modal closed")) {
    return "Wallet connection was canceled by user.";
  }
  if (errMsg.includes("User rejected") || errMsg.includes("rejected signature") || errMsg.includes("declined")) {
    return "Transaction signature was rejected by user.";
  }
  if (errMsg.includes("not installed") || errMsg.includes("missing extension") || errMsg.includes("install")) {
    return "The selected wallet extension is not installed. Please install it and try again.";
  }
  if (errMsg.includes("wrong network") || errMsg.includes("Network mismatch")) {
    return "Wallet is connected to the wrong network. Please switch to Stellar Testnet.";
  }
  if (errMsg.includes("insufficient balance") || errMsg.includes("underfunded")) {
    return "Insufficient XLM balance to cover transaction fees. Please fund your account.";
  }
  if (errMsg.includes("Simulation error") || errMsg.includes("Host function failed")) {
    return "Transaction simulation failed. Check contract constraints or parameters.";
  }
  return errMsg;
}

