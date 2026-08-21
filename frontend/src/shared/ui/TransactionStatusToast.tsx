"use client";

import { useState } from "react";
import { useTransactionStatus } from "../hooks/useTransactionStatus";
import {
  Loader2,
  CheckCircle2,
  XCircle,
  Copy,
  Check,
  ExternalLink,
  RotateCcw,
  X,
  Wallet,
} from "lucide-react";

export function TransactionStatusToast() {
  const { status, label, txHash, error, elapsedSeconds, retry, reset } =
    useTransactionStatus();
  const [copied, setCopied] = useState(false);

  if (status === "idle") return null;

  const handleCopy = () => {
    if (!txHash) return;
    navigator.clipboard.writeText(txHash);
    setCopied(true);
    setTimeout(() => setCopied(false), 2000);
  };

  const handleOpenExplorer = () => {
    if (!txHash) return;
    window.open(`https://stellar.expert/explorer/testnet/tx/${txHash}`, "_blank");
  };

  return (
    <div className="fixed bottom-4 right-4 z-50 w-full max-w-sm px-4 sm:px-0">
      <div className="bg-card/90 backdrop-blur-md border border-border rounded-xl shadow-2xl overflow-hidden animate-in slide-in-from-bottom-5 duration-200">
        
        {/* Header bar / Title */}
        <div className="p-3 bg-muted/40 border-b border-border/50 flex justify-between items-center text-[10px] uppercase font-bold tracking-wider text-muted-foreground">
          <span>On-Chain Operation</span>
          {status !== "pending" && status !== "processing" && (
            <button
              onClick={reset}
              className="text-muted-foreground hover:text-foreground transition-colors cursor-pointer"
            >
              <X className="h-4 w-4" />
            </button>
          )}
        </div>

        {/* Content body */}
        <div className="p-4 space-y-4">
          <div>
            <h4 className="text-xs font-bold text-foreground leading-snug">{label || "Transaction In Progress"}</h4>
          </div>

          {/* 1. Pending (Signature requested) */}
          {status === "pending" && (
            <div className="flex items-center gap-3 bg-muted/40 p-3 rounded-lg border border-border animate-pulse">
              <Wallet className="h-5 w-5 text-zinc-400 shrink-0" />
              <div>
                <p className="text-xs font-semibold text-foreground">Confirm in your wallet</p>
                <p className="text-[10px] text-muted-foreground mt-0.5">Please approve the transaction signature request.</p>
              </div>
            </div>
          )}

          {/* 2. Processing (Awaiting confirmation) */}
          {status === "processing" && (
            <div className="space-y-3">
              <div className="flex items-center gap-3 bg-muted/40 p-3 rounded-lg border border-border">
                <Loader2 className="h-5 w-5 text-primary animate-spin shrink-0" />
                <div>
                  <p className="text-xs font-semibold text-foreground">Awaiting network confirmation</p>
                  <p className="text-[10px] text-muted-foreground mt-0.5">Submitting to Stellar ledger...</p>
                </div>
              </div>
              <p className="text-[10px] font-mono text-muted-foreground text-right">
                {elapsedSeconds}s elapsed
              </p>
            </div>
          )}

          {/* 3. Confirmed (Success) */}
          {status === "confirmed" && (
            <div className="space-y-4">
              <div className="flex items-center gap-3 bg-emerald-500/10 border border-emerald-500/20 p-3 rounded-lg">
                <CheckCircle2 className="h-5 w-5 text-emerald-600 dark:text-emerald-400 shrink-0" />
                <div>
                  <p className="text-xs font-semibold text-emerald-800 dark:text-emerald-300">Transaction Confirmed</p>
                  <p className="text-[10px] text-emerald-700/80 dark:text-emerald-400/80 mt-0.5">Mined successfully on-chain.</p>
                </div>
              </div>

              {txHash && (
                <div className="space-y-2">
                  <div className="flex items-center gap-2 bg-muted/40 p-2 rounded-lg border border-border text-[10px] font-mono">
                    <span className="flex-1 text-muted-foreground truncate select-all">{txHash}</span>
                    <button
                      onClick={handleCopy}
                      className="p-1 bg-card border border-border rounded text-muted-foreground hover:text-foreground transition-colors cursor-pointer shrink-0"
                      title="Copy Hash"
                    >
                      {copied ? (
                        <Check className="h-3.5 w-3.5 text-emerald-600" />
                      ) : (
                        <Copy className="h-3.5 w-3.5" />
                      )}
                    </button>
                  </div>

                  <div className="flex gap-2">
                    <button
                      onClick={handleOpenExplorer}
                      className="flex-1 h-9 border border-border bg-card hover:bg-accent text-foreground font-semibold rounded-lg text-xs transition-colors flex items-center justify-center gap-1.5 cursor-pointer"
                    >
                      <ExternalLink className="h-3.5 w-3.5" />
                      <span>View on Explorer</span>
                    </button>
                    <button
                      onClick={reset}
                      className="px-4 h-9 bg-primary text-primary-foreground font-semibold rounded-lg text-xs hover:bg-primary/95 transition-all cursor-pointer"
                    >
                      Dismiss
                    </button>
                  </div>
                </div>
              )}
            </div>
          )}

          {/* 4. Failed (Error & Retry) */}
          {status === "failed" && (
            <div className="space-y-4">
              <div className="flex items-start gap-3 bg-destructive/10 border border-destructive/20 p-3 rounded-lg">
                <XCircle className="h-5 w-5 text-destructive shrink-0 mt-0.5" />
                <div className="min-w-0 flex-1">
                  <p className="text-xs font-semibold text-destructive">Transaction Failed</p>
                  <p className="text-[10px] text-destructive/80 mt-1 leading-relaxed break-words whitespace-pre-wrap max-h-40 overflow-y-auto">{error}</p>
                </div>
              </div>

              <div className="flex gap-2">
                {retry && (
                  <button
                    onClick={() => {
                      retry();
                    }}
                    className="flex-1 h-9 bg-primary text-primary-foreground font-semibold rounded-lg text-xs hover:bg-primary/95 transition-all flex items-center justify-center gap-1.5 cursor-pointer"
                  >
                    <RotateCcw className="h-3.5 w-3.5" />
                    <span>Retry Action</span>
                  </button>
                )}
                <button
                  onClick={reset}
                  className="px-4 h-9 border border-border bg-card hover:bg-accent text-foreground font-semibold rounded-lg text-xs transition-colors cursor-pointer"
                >
                  Cancel
                </button>
              </div>
            </div>
          )}

        </div>

      </div>
    </div>
  );
}
export default TransactionStatusToast;
