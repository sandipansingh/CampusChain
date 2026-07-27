"use client";

import { useWallet } from "@/shared/stellar/useWallet";
import { WalletDashboard } from "@/features/wallet/ui/WalletDashboard";
import { useEffect } from "react";
import { Wallet } from "lucide-react";

export default function Home() {
  const {
    isConnected,
    isConnecting,
    wrongNetwork,
    error,
    connect,
    initialize,
  } = useWallet();

  useEffect(() => {
    initialize();
  }, [initialize]);

  if (isConnected) {
    return <WalletDashboard />;
  }

  return (
    <main className="flex min-h-screen flex-col items-center justify-center p-6 bg-background text-foreground">
      <div className="z-10 max-w-md w-full items-center justify-center flex flex-col gap-6 text-center">
        <div className="flex items-center gap-3">
          <div className="w-12 h-12 rounded-full bg-primary text-primary-foreground flex items-center justify-center">
            <Wallet className="h-6 w-6" />
          </div>
          <div className="text-left">
            <h1 className="text-2xl font-bold tracking-tight">CampusChain</h1>
            <p className="text-xs text-muted-foreground">Radical Utility Dashboard</p>
          </div>
        </div>

        <div className="flex flex-col items-center gap-4 p-6 border border-border rounded-xl bg-card text-card-foreground shadow-sm w-full">
          <h2 className="text-lg font-bold">Connect Your Wallet</h2>
          <p className="text-sm text-muted-foreground">
            Sign in using Freighter, xBull, Albedo, or WalletConnect to access your student profile, marketplace, events, and rewards.
          </p>
          
          {error && (
            <div className={`text-xs p-3 rounded-lg border w-full text-center ${wrongNetwork ? "bg-amber-50 text-amber-800 border-amber-200" : "bg-destructive/10 text-destructive border-destructive/20"}`}>
              {error}
            </div>
          )}

          <button
            onClick={connect}
            disabled={isConnecting}
            className="w-full bg-primary text-primary-foreground hover:bg-primary/95 disabled:opacity-50 px-4 py-2.5 rounded-lg font-semibold transition-colors cursor-pointer"
          >
            {isConnecting ? "Connecting Wallet..." : "Connect Wallet"}
          </button>
        </div>
      </div>
    </main>
  );
}
