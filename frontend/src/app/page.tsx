"use client";

import Link from "next/link";
import { useWalletStore } from "@/state/useWalletStore";

export default function LandingPage() {
  const { address, isConnecting, connectWallet, disconnectWallet } = useWalletStore();

  return (
    <div style={{ padding: "2rem", fontFamily: "sans-serif" }}>
      <h1>CampusChain Landing Page (Skeleton)</h1>
      <p>A Unified Campus Economy Powered by Stellar.</p>
      
      <div style={{ margin: "1rem 0" }}>
        {address ? (
          <div>
            <p>Connected Wallet: {address}</p>
            <button onClick={disconnectWallet}>Disconnect</button>
            <div style={{ marginTop: "1rem" }}>
              <Link href="/dashboard">
                <button>Go to Dashboard</button>
              </Link>
            </div>
          </div>
        ) : (
          <button onClick={connectWallet} disabled={isConnecting}>
            {isConnecting ? "Connecting..." : "Connect Wallet"}
          </button>
        )}
      </div>

      <nav style={{ marginTop: "2rem" }}>
        <h3>Navigation Skeletons:</h3>
        <ul>
          <li><Link href="/dashboard">Dashboard</Link></li>
          <li><Link href="/activity">Activity Feed</Link></li>
          <li><Link href="/transactions">Transaction Center</Link></li>
          <li><Link href="/settings">Settings</Link></li>
          <li><Link href="/analytics">Analytics</Link></li>
        </ul>
      </nav>
    </div>
  );
}
