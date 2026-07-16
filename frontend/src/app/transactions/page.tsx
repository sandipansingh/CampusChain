"use client";

import React from "react";
import Header from "@/components/Header";
import { useTransactionStore } from "@/state/useTransactionStore";

export default function TransactionsPage() {
  const { transactions, clearTransactions } = useTransactionStore();

  return (
    <div className="min-h-screen bg-background text-foreground flex flex-col font-sans">
      <Header />

      {/* Hero Header */}
      <section className="w-full border-b-2 border-border py-20 bg-background relative overflow-hidden">
        <div className="max-w-[95vw] mx-auto z-10 relative">
          <span className="text-accent text-sm font-bold tracking-widest uppercase mb-4 block">
            {"// TELEMETRY LOGGER"}
          </span>
          <h1 className="text-5xl md:text-8xl font-bold tracking-tighter uppercase leading-none">
            TRANSACTION CENTER
          </h1>
          <p className="text-muted-foreground text-lg md:text-xl font-medium mt-4 max-w-xl">
            {"Audit history of your session's execution state transitions, block confirmations, and raw ledger outputs."}
          </p>
        </div>
      </section>

      {/* Session Logger Section */}
      <main className="max-w-[95vw] w-full mx-auto py-16 flex-1">
        <div className="flex justify-between items-center mb-8 gap-4">
          <span className="text-lg font-bold tracking-wider text-muted-foreground uppercase">
            {"// SESSION TRANSACTIONS ("}{transactions.length}{")"}
          </span>
          {transactions.length > 0 && (
            <button
              onClick={clearTransactions}
              className="h-10 px-4 border-2 border-border text-sm font-bold uppercase tracking-tight hover:bg-foreground hover:text-background transition-colors duration-200"
            >
              CLEAR HISTORIC LOG
            </button>
          )}
        </div>

        {transactions.length === 0 ? (
          <div className="border-2 border-dashed border-border p-16 text-center">
            <span className="font-bold text-muted-foreground uppercase tracking-widest">
              NO TRANSACTIONS DEPLOYED IN THIS SESSION YET
            </span>
          </div>
        ) : (
          <div className="hairline-grid grid-cols-1">
            {transactions.map((tx) => (
              <div
                key={tx.hash}
                className="bg-background p-8 flex flex-col lg:flex-row lg:items-center justify-between gap-6 border-b border-border hover:bg-muted/10 transition-colors duration-200"
              >
                <div className="flex flex-col gap-2">
                  <div className="flex items-center gap-4">
                    <span className="text-xl font-bold tracking-tight text-foreground uppercase">
                      {tx.method}
                    </span>
                    {/* Status Badge */}
                    <span
                      className={`text-xs font-bold tracking-wider uppercase px-2 py-0.5 border ${
                        tx.status === "pending"
                          ? "border-yellow-500 bg-yellow-500/10 text-yellow-400"
                          : tx.status === "processing"
                          ? "border-blue-500 bg-blue-500/10 text-blue-400"
                          : tx.status === "confirmed"
                          ? "border-green-500 bg-green-500/10 text-green-400"
                          : "border-red-500 bg-red-500/10 text-red-400"
                      }`}
                    >
                      {tx.status}
                    </span>
                  </div>
                  <span className="text-xs font-mono text-muted-foreground break-all">
                    TX HASH: {tx.hash}
                  </span>
                </div>

                <div className="flex flex-col lg:items-end gap-2 text-sm font-medium text-muted-foreground">
                  <span>
                    EXECUTED AT: {new Date(tx.timestamp).toLocaleTimeString()}
                  </span>
                  {tx.explorerUrl && tx.status === "confirmed" && (
                    <a
                      href={tx.explorerUrl}
                      target="_blank"
                      rel="noopener noreferrer"
                      className="text-accent hover:underline font-bold uppercase tracking-wider text-xs"
                    >
                      VIEW ON STELLAR.EXPERT ↗
                    </a>
                  )}
                  {tx.errorMessage && (
                    <span className="text-red-400 text-xs font-mono max-w-md lg:text-right">
                      ERROR: {tx.errorMessage}
                    </span>
                  )}
                </div>
              </div>
            ))}
          </div>
        )}
      </main>
    </div>
  );
}
