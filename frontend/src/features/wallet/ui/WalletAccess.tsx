"use client";

import { useEffect } from "react";
import { useRouter } from "next/navigation";
import { useCampusProfile } from "@/features/wallet/hooks/useWallet";
import { useWallet } from "@/shared/stellar/useWallet";
import { Login } from "./Login";
import { WalletDashboard } from "./WalletDashboard";
import { Skeleton } from "@/shared/ui/Skeleton";

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

function LoadingProfile() { return <div className="min-h-screen bg-background p-6 lg:p-10"><div className="mx-auto max-w-7xl space-y-8"><div className="flex items-center justify-between border-b border-border pb-5"><Skeleton className="h-8 w-40" /><div className="flex items-center gap-3"><Skeleton className="h-9 w-28" /><Skeleton className="size-9 rounded-full" /></div></div><div className="grid gap-4 md:grid-cols-3"><Skeleton className="h-28" /><Skeleton className="h-28" /><Skeleton className="h-28" /></div><Skeleton className="h-72 w-full" /></div></div>; }
