"use client";

import { useWallet } from "@/shared/stellar/useWallet";
import { WalletDashboard } from "@/features/wallet/ui/WalletDashboard";
import { Login } from "@/features/wallet/ui/Login";
import { useEffect } from "react";

export default function Home() {
  const {
    isConnected,
    initialize,
  } = useWallet();

  useEffect(() => {
    initialize();
  }, [initialize]);

  if (isConnected) {
    return <WalletDashboard />;
  }

  return <Login />;
}
