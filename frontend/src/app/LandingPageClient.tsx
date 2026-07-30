"use client";

import { useEffect } from "react";
import { useRouter } from "next/navigation";
import { fetchUserProfile } from "@/features/wallet/service/campusIdentity";
import { LandingRoute } from "@/features/landing/ui/LandingRoute";
import { useWallet } from "@/shared/stellar/useWallet";

export function LandingPageClient() {
  const router = useRouter();
  const { connect, isConnected, address } = useWallet();

  useEffect(() => {
    const storedAddress = window.localStorage.getItem("campuschain_wallet_address");
    if (!storedAddress) return;

    let cancelled = false;
    void fetchUserProfile(storedAddress)
      .then((profile) => {
        if (!cancelled && profile) router.replace("/dashboard");
      })
      .catch(() => {
        // A public landing page remains available if the RPC is unavailable.
      });

    return () => {
      cancelled = true;
    };
  }, [router]);

  const handleGetStarted = async () => {
    const activeAddress = isConnected && address ? address : await connect();
    if (!activeAddress) return;

    try {
      const profile = await fetchUserProfile(activeAddress);
      if (profile) {
        router.push("/dashboard");
      } else {
        router.push("/connect");
      }
    } catch (err) {
      console.error("Profile check failed", err);
      router.push("/connect");
    }
  };

  return <LandingRoute onGetStarted={handleGetStarted} />;
}
