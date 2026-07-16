"use client";

import Link from "next/link";
import { useTransactionStore } from "@/state/useTransactionStore";

export default function TransactionsPage() {
  const { transactions, clearTransactions } = useTransactionStore();

  return (
    <div style={{ padding: "2rem", fontFamily: "sans-serif" }}>
      <h1>CampusChain Transaction Center (Skeleton)</h1>
      <p><Link href="/">← Back to Landing</Link></p>
      
      <button onClick={clearTransactions} style={{ marginBottom: "1rem" }}>
        Clear Transactions History
      </button>

      {transactions.length === 0 ? (
        <p>No transactions executed yet.</p>
      ) : (
        <ul>
          {transactions.map((tx) => (
            <li key={tx.hash} style={{ margin: "1rem 0", listStyle: "none", border: "1px solid #ccc", padding: "1rem" }}>
              <strong>Method:</strong> {tx.method} <br />
              <strong>Hash:</strong> {tx.hash} <br />
              <strong>Status:</strong> {tx.status} <br />
              <strong>Time:</strong> {new Date(tx.timestamp).toLocaleString()} <br />
              {tx.explorerUrl && (
                <a href={tx.explorerUrl} target="_blank" rel="noopener noreferrer">
                  View in Explorer
                </a>
              )}
              {tx.errorMessage && (
                <p style={{ color: "red" }}>Error: {tx.errorMessage}</p>
              )}
            </li>
          ))}
        </ul>
      )}
    </div>
  );
}
