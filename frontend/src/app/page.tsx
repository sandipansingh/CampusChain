"use client";

import { useWallet } from "@/shared/stellar/useWallet";
import { WalletDashboard } from "@/features/wallet/ui/WalletDashboard";
import { Login } from "@/features/wallet/ui/Login";
import { useCampusProfile } from "@/features/wallet/hooks/useWallet";
import { useEffect } from "react";

export default function Home() {
  const {
    isConnected,
    address,
    initialize,
  } = useWallet();

  const { data: profile, isLoading: isLoadingProfile } = useCampusProfile(address);

  useEffect(() => {
    initialize();
  }, [initialize]);

  if (!isConnected) {
    return <Login />;
  }

  if (isLoadingProfile) {
    return (
      <div className="min-h-screen flex items-center justify-center bg-background text-foreground">
        <div className="flex flex-col items-center gap-3">
          <div className="animate-spin rounded-full h-12 w-12 border-t-2 border-b-2 border-primary"></div>
          <p className="text-sm font-medium text-muted-foreground">Fetching your on-chain identity...</p>
        </div>
      </div>
    );
  }

  if (!profile) {
    return <Login showOnboarding={true} />;
  }

  return <WalletDashboard />;
}
