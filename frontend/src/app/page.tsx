"use client";

import { useWalletStore } from "@/features/wallet/state/useWalletStore";
import { useEffect } from "react";

export default function Home() {
  const initialize = useWalletStore((state) => state.initialize);
  const address = useWalletStore((state) => state.address);
  const connectWallet = useWalletStore((state) => state.connectWallet);
  const disconnectWallet = useWalletStore((state) => state.disconnectWallet);

  useEffect(() => {
    initialize();
  }, [initialize]);

  return (
    <main className="flex min-h-screen flex-col items-center justify-center p-24 bg-background text-foreground">
      <div className="z-10 max-w-5xl w-full items-center justify-between font-mono text-sm flex flex-col gap-6">
        <h1 className="text-4xl font-extrabold tracking-tight lg:text-5xl">
          CampusChain
        </h1>
        <p className="text-xl text-muted-foreground text-center max-w-[600px]">
          An advanced university decentralized operating system powered by the Stellar Network and Soroban smart contracts.
        </p>

        <div className="flex flex-col items-center gap-4 mt-8 p-6 border rounded-lg bg-card text-card-foreground shadow-sm max-w-md w-full">
          <h2 className="text-xl font-bold">Wallet Connection</h2>
          {address ? (
            <div className="flex flex-col items-center gap-2 w-full">
              <span className="text-xs bg-muted px-2 py-1 rounded select-all break-all text-center w-full">
                {address}
              </span>
              <button
                onClick={disconnectWallet}
                className="w-full mt-2 bg-destructive/90 text-destructive-foreground hover:bg-destructive px-4 py-2 rounded-lg font-medium transition-colors"
              >
                Disconnect Wallet
              </button>
            </div>
          ) : (
            <button
              onClick={connectWallet}
              className="w-full bg-primary text-primary-foreground hover:bg-primary/90 px-4 py-2 rounded-lg font-medium transition-colors"
            >
              Connect Wallet
            </button>
          )}
        </div>
      </div>
    </main>
  );
}
