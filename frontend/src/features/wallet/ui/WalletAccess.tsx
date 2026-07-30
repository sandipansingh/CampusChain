"use client";

import { useEffect } from "react";
import { useRouter } from "next/navigation";
import { useCampusProfile } from "@/features/wallet/hooks/useWallet";
import { useWallet } from "@/shared/stellar/useWallet";
import { Login } from "./Login";
import { WalletDashboard } from "./WalletDashboard";

export function WalletAccess({ redirectExistingProfile = false }: { redirectExistingProfile?: boolean }) {
  const router = useRouter();
  const { isConnected, address, initialize } = useWallet();
  const { data: profile, isLoading: isLoadingProfile } = useCampusProfile(address);

  useEffect(() => { initialize(); }, [initialize]);
  useEffect(() => { if (redirectExistingProfile && profile) router.replace("/dashboard"); }, [profile, redirectExistingProfile, router]);

  if (!isConnected) return <Login />;
  if (isLoadingProfile || (redirectExistingProfile && profile)) return <LoadingProfile />;
  if (!profile) return <Login showOnboarding />;
  return <WalletDashboard />;
}

function LoadingProfile() { return <div className="flex min-h-screen items-center justify-center bg-background text-foreground"><div className="flex flex-col items-center gap-3"><div className="size-12 animate-spin rounded-full border-y-2 border-primary" /><p className="text-sm font-medium text-muted-foreground">Fetching your on-chain identity...</p></div></div>; }
