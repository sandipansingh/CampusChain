"use client";

import { useEffect } from "react";
import { useRouter } from "next/navigation";
import { useCampusProfile, useCampusUniversity } from "@/features/wallet/hooks/useWallet";
import { useWallet } from "@/shared/stellar/useWallet";
import { Login, PendingState } from "./Login";
import { Skeleton } from "@/shared/ui/Skeleton";
import { NEXT_PUBLIC_CAMPUS_ADMIN_ADDRESS } from "@/shared/stellar/client";

export interface WalletAccessProps {
  allowedRoles?: number[];
  children?: React.ReactNode;
  redirectExistingProfile?: boolean;
}

export function WalletAccess({
  allowedRoles,
  children,
  redirectExistingProfile = false,
}: WalletAccessProps) {
  const router = useRouter();
  const { isConnected, address, initialize } = useWallet();
  const { data: profile, isLoading: isLoadingProfile } = useCampusProfile(address);
  const isPlatformAdmin = address === NEXT_PUBLIC_CAMPUS_ADMIN_ADDRESS;

  // University Admin: check their university's on-chain approval status
  const universityCode = profile?.role === 4 ? profile.universityCode : null;
  const { data: university, isLoading: isLoadingUniv } = useCampusUniversity(universityCode, address);

  useEffect(() => { initialize(); }, [initialize]);
  
  useEffect(() => {
    if (isLoadingProfile || (profile?.role === 4 && isLoadingUniv)) return;

    if (isConnected) {
      // Determine correct path based on role
      let targetPath = "";
      if (isPlatformAdmin) {
        targetPath = "/platform";
      } else if (profile) {
        if (profile.role === 4) {
          targetPath = "/university";
        } else if (profile.role === 1 || profile.role === 2 || profile.role === 3) {
          targetPath = "/dashboard";
        }
      }

      // If redirectExistingProfile is true, or if current path is not allowed, redirect them!
      if (targetPath) {
        const isPathAllowed = allowedRoles?.includes(isPlatformAdmin ? 5 : profile?.role ?? 0);
        if (redirectExistingProfile || !isPathAllowed) {
          router.replace(targetPath);
        }
      }
    }
  }, [profile, isPlatformAdmin, isConnected, isLoadingProfile, isLoadingUniv, redirectExistingProfile, allowedRoles, router]);

  if (!isConnected) return <Login />;
  
  if (
    isLoadingProfile ||
    (profile?.role === 4 && isLoadingUniv) ||
    (redirectExistingProfile && (profile || isPlatformAdmin))
  ) {
    return <LoadingProfile />;
  }

  // If a profile exists, check if their role matches the allowed roles of this route
  const currentRole = isPlatformAdmin ? 5 : profile?.role ?? 0;
  if (allowedRoles && !allowedRoles.includes(currentRole)) {
    return <LoadingProfile />; // Will be redirected by useEffect anyway
  }

  if (isPlatformAdmin) return <>{children}</>;
  if (!profile) return <Login showOnboarding />;

  // University Admin route guard: check if university is approved (status 2)
  if (profile.role === 4) {
    if (!university || university.approvalStatus !== 2) {
      return <PendingState university />;
    }
  }

  return <>{children}</>;
}

function LoadingProfile() { return <div className="min-h-screen bg-background p-6 lg:p-10"><div className="mx-auto max-w-7xl space-y-8"><div className="flex items-center justify-between border-b border-border pb-5"><Skeleton className="h-8 w-40" /><div className="flex items-center gap-3"><Skeleton className="h-9 w-28" /><Skeleton className="size-9 rounded-full" /></div></div><div className="grid gap-4 md:grid-cols-3"><Skeleton className="h-28" /><Skeleton className="h-28" /><Skeleton className="h-28" /></div><Skeleton className="h-72 w-full" /></div></div>; }
