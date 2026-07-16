"use client";

import React from "react";
import { useTransactionStore } from "@/state/useTransactionStore";
import {
  History,
  Trash2,
  ArrowUpRight
} from "lucide-react";

export default function TransactionsPage() {
  const { transactions, clearTransactions } = useTransactionStore();

  return (
    <div className="flex flex-col gap-8 w-full max-w-7xl mx-auto">
      {/* Title */}
      <div className="flex flex-col md:flex-row md:items-center justify-between gap-4">
        <div>
          <h1 className="text-3xl font-extrabold tracking-tight text-slate-900 uppercase">
            Transaction Center
          </h1>
          <p className="text-slate-500 text-sm mt-1">
            {"Audit history of your session's execution state transitions, block confirmations, and raw ledger outputs."}
          </p>
        </div>
        {transactions.length > 0 && (
          <button
            onClick={clearTransactions}
            className="h-11 px-4 bg-white border border-border text-xs font-bold text-slate-600 rounded-xl hover:bg-red-50 hover:text-red-600 hover:border-red-100 flex items-center gap-2 active:scale-95 transition-all shadow-sm"
          >
            <Trash2 className="w-4 h-4" />
            Clear Log
          </button>
        )}
      </div>

      {/* Main transactions container */}
      <div className="bg-white border border-border rounded-2xl p-6">
        <div className="flex items-center justify-between border-b border-slate-100 pb-4 mb-6">
          <span className="text-xs font-bold uppercase tracking-wider text-slate-400">
            Session History ({transactions.length})
          </span>
        </div>

        {transactions.length === 0 ? (
          <div className="border border-dashed border-slate-200 rounded-2xl p-16 text-center flex flex-col items-center justify-center gap-3">
            <History className="w-8 h-8 text-slate-300" />
            <span className="font-bold text-slate-400 text-xs uppercase tracking-widest">
              No transactions deployed in this session yet
            </span>
          </div>
        ) : (
          <div className="overflow-x-auto">
            <table className="w-full text-left border-collapse">
              <thead>
                <tr className="border-b border-slate-100 text-[10px] font-black text-slate-400 uppercase tracking-widest">
                  <th className="py-4 px-3 w-12">
                    <input type="checkbox" className="rounded border-slate-300 text-accent focus:ring-accent" />
                  </th>
                  <th className="py-4 px-3">Transaction ID / Hash</th>
                  <th className="py-4 px-3">Method</th>
                  <th className="py-4 px-3">Status</th>
                  <th className="py-4 px-3">Timestamp</th>
                  <th className="py-4 px-3 text-right">Details</th>
                </tr>
              </thead>
              <tbody className="divide-y divide-slate-100 text-xs font-bold text-slate-600">
                {transactions.map((tx) => (
                  <tr key={tx.hash} className="hover:bg-slate-50/50 transition-colors">
                    <td className="py-4 px-3">
                      <input type="checkbox" className="rounded border-slate-300 text-accent focus:ring-accent" />
                    </td>
                    <td className="py-4 px-3 font-mono text-slate-400">
                      {tx.hash.slice(0, 16)}...{tx.hash.slice(-16)}
                    </td>
                    <td className="py-4 px-3 text-slate-800 uppercase tracking-tight">
                      {tx.method}
                    </td>
                    <td className="py-4 px-3">
                      <span
                        className={`inline-flex items-center gap-1.5 px-2.5 py-0.5 rounded-full text-[10px] font-bold uppercase border ${
                          tx.status === "pending"
                            ? "bg-yellow-50 text-yellow-700 border-yellow-200"
                            : tx.status === "processing"
                            ? "bg-blue-50 text-blue-700 border-blue-200"
                            : tx.status === "confirmed"
                            ? "bg-emerald-50 text-emerald-700 border-emerald-200"
                            : "bg-red-50 text-red-700 border-red-200"
                        }`}
                      >
                        <span
                          className={`w-1.5 h-1.5 rounded-full ${
                            tx.status === "pending"
                              ? "bg-yellow-500 animate-pulse"
                              : tx.status === "processing"
                              ? "bg-blue-500"
                              : tx.status === "confirmed"
                              ? "bg-emerald-500"
                              : "bg-red-500"
                          }`}
                        />
                        {tx.status}
                      </span>
                    </td>
                    <td className="py-4 px-3 text-slate-400">
                      {new Date(tx.timestamp).toLocaleTimeString()}
                    </td>
                    <td className="py-4 px-3 text-right">
                      {tx.explorerUrl && tx.status === "confirmed" ? (
                        <a
                          href={tx.explorerUrl}
                          target="_blank"
                          rel="noopener noreferrer"
                          className="inline-flex items-center gap-1 text-accent hover:underline uppercase tracking-wider text-[10px] font-black"
                        >
                          Explorer
                          <ArrowUpRight className="w-3.5 h-3.5" />
                        </a>
                      ) : tx.errorMessage ? (
                        <span className="text-red-500 font-mono text-[10px] break-all block max-w-[200px] text-right ml-auto">
                          {tx.errorMessage}
                        </span>
                      ) : (
                        <span className="text-slate-300">-</span>
                      )}
                    </td>
                  </tr>
                ))}
              </tbody>
            </table>
          </div>
        )}
      </div>
    </div>
  );
}
