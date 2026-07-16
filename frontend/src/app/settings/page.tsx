"use client";

import Link from "next/link";
import { useWalletStore } from "@/state/useWalletStore";

export default function SettingsPage() {
  const { network, switchNetwork } = useWalletStore();

  return (
    <div style={{ padding: "2rem", fontFamily: "sans-serif" }}>
      <h1>CampusChain Settings (Skeleton)</h1>
      <p><Link href="/">← Back to Landing</Link></p>
      
      <h3>Network Settings</h3>
      <p>Current Network: <strong>{network}</strong></p>
      <div>
        <button onClick={() => switchNetwork("testnet")} style={{ marginRight: "0.5rem" }}>
          Switch to Testnet
        </button>
        <button onClick={() => switchNetwork("standalone")} style={{ marginRight: "0.5rem" }}>
          Switch to Standalone
        </button>
        <button onClick={() => switchNetwork("public")}>
          Switch to Mainnet (Public)
        </button>
      </div>
    </div>
  );
}
