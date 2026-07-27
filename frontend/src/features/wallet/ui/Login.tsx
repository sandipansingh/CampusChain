"use client";

import { useState } from "react";
import { useWallet } from "@/shared/stellar/useWallet";
import { useRegisterProfileMutation } from "@/features/wallet/hooks/useWallet";
import { Skeleton } from "@/shared/ui/Skeleton";
import { Wallet, ShieldCheck, UserCheck, AlertTriangle, ArrowRight } from "lucide-react";

interface LoginProps {
  showOnboarding?: boolean;
}

export function Login({ showOnboarding = false }: LoginProps) {
  const { connect, isConnecting, error: walletError, wrongNetwork, address, isConnected } = useWallet();
  const registerProfile = useRegisterProfileMutation();

  // Onboarding Form States
  const [fullName, setFullName] = useState("");
  const [universityId, setUniversityId] = useState("");
  const [department, setDepartment] = useState("");
  const [formError, setFormError] = useState<string | null>(null);

  const handleConnect = async () => {
    try {
      await connect();
    } catch (err) {
      console.error("Wallet connection failed", err);
    }
  };

  const handleOnboardingSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    setFormError(null);

    if (!fullName.trim()) {
      setFormError("Please enter your full name.");
      return;
    }
    const idNum = Number(universityId);
    if (isNaN(idNum) || idNum <= 0) {
      setFormError("Please enter a valid positive University ID number.");
      return;
    }
    if (!department.trim()) {
      setFormError("Please enter your department.");
      return;
    }

    if (!address) {
      setFormError("No wallet connected. Please connect your wallet first.");
      return;
    }

    try {
      await registerProfile.mutateAsync({
        address,
        fullName: fullName.trim(),
        universityId: idNum,
        department: department.trim(),
      });
    } catch (err: unknown) {
      const msg = err instanceof Error ? err.message : String(err);
      setFormError(msg || "Failed to register profile on-chain.");
    }
  };

  const isLoading = isConnecting || registerProfile.isPending;

  // Network Guard: Block access if wrong network (Stitch State C)
  if (isConnected && wrongNetwork) {
    return (
      <main className="min-h-screen w-full flex items-center justify-center bg-background text-foreground p-6">
        <div className="w-full max-w-[480px] bg-card rounded-2xl border border-destructive/30 p-6 md:p-8 shadow-xl flex flex-col items-center text-center">
          <div className="h-16 w-16 rounded-full bg-destructive/10 flex items-center justify-center text-destructive mb-6">
            <AlertTriangle className="h-8 w-8 animate-pulse" />
          </div>
          <h1 className="text-2xl font-extrabold tracking-tight text-foreground mb-3">
            Wrong Network Detected
          </h1>
          <p className="text-sm text-muted-foreground mb-6 leading-relaxed">
            CampusChain runs exclusively on the <strong>Stellar Testnet</strong>. Your connected wallet is currently pointed to a different network.
          </p>
          <div className="w-full bg-destructive/5 border border-destructive/20 rounded-xl p-4 text-xs text-left mb-6 space-y-2">
            <span className="font-bold text-destructive">How to switch:</span>
            <ol className="list-decimal list-inside space-y-1 text-muted-foreground">
              <li>Open your wallet extension (e.g. Freighter, Albedo).</li>
              <li>Go to Settings / Network configuration.</li>
              <li>Switch the active network to <strong>Testnet</strong>.</li>
              <li>Refresh this page or wait for auto-reconnect.</li>
            </ol>
          </div>
          <p className="text-xs text-muted-foreground">
            Current network passphrase must match: <code className="block mt-1 p-1 bg-muted rounded text-[10px] select-all font-mono text-foreground">&quot;Test SDF Network ; September 2015&quot;</code>
          </p>
        </div>
      </main>
    );
  }

  return (
    <main className="min-h-screen w-full flex items-center justify-center bg-gradient-to-br from-background via-card/50 to-background text-foreground p-6">
      <div className="w-full max-w-[450px] bg-card/80 backdrop-blur-md rounded-2xl border border-border/80 p-6 md:p-8 shadow-xl flex flex-col items-center relative overflow-hidden transition-all duration-300">
        
        {/* Subtle glowing ambient spots */}
        <div className="absolute -top-12 -left-12 w-24 h-24 bg-primary/10 rounded-full blur-xl pointer-events-none"></div>
        <div className="absolute -bottom-12 -right-12 w-24 h-24 bg-primary/10 rounded-full blur-xl pointer-events-none"></div>

        {/* ── State B: Onboarding Form ── */}
        {showOnboarding ? (
          <div className="w-full flex flex-col items-center">
            <div className="h-12 w-12 rounded-full bg-primary/10 flex items-center justify-center text-primary mb-6">
              <UserCheck className="h-6 w-6" />
            </div>
            
            <div className="w-full text-center mb-6">
              <h1 className="text-2xl font-extrabold tracking-tight text-foreground mb-2">
                Create On-Chain Profile
              </h1>
              <p className="text-sm text-muted-foreground leading-relaxed">
                No off-chain database exists. Your identity details are registered securely on the blockchain.
              </p>
            </div>

            <form onSubmit={handleOnboardingSubmit} className="w-full flex flex-col gap-4">
              {(formError || walletError) && (
                <div className="text-xs p-3 rounded-lg border border-destructive/20 bg-destructive/10 text-destructive text-center font-medium">
                  {formError || walletError}
                </div>
              )}

              {/* Full Name */}
              <div className="flex flex-col gap-1 w-full">
                <label className="text-[10px] font-bold tracking-wider text-muted-foreground uppercase" htmlFor="full-name">
                  Full Name
                </label>
                <input
                  id="full-name"
                  type="text"
                  value={fullName}
                  onChange={(e) => setFullName(e.target.value)}
                  placeholder="Alice Smith"
                  className="w-full h-11 px-4 bg-muted/50 border border-border rounded-lg text-sm focus:border-primary focus:ring-1 focus:ring-primary focus:outline-none transition-all placeholder:text-muted-foreground/50"
                  disabled={isLoading}
                  required
                />
              </div>

              {/* University ID */}
              <div className="flex flex-col gap-1 w-full">
                <label className="text-[10px] font-bold tracking-wider text-muted-foreground uppercase" htmlFor="university-id">
                  University ID (Numeric)
                </label>
                <input
                  id="university-id"
                  type="number"
                  value={universityId}
                  onChange={(e) => setUniversityId(e.target.value)}
                  placeholder="20260401"
                  className="w-full h-11 px-4 bg-muted/50 border border-border rounded-lg text-sm focus:border-primary focus:ring-1 focus:ring-primary focus:outline-none transition-all placeholder:text-muted-foreground/50"
                  disabled={isLoading}
                  required
                />
              </div>

              {/* Department */}
              <div className="flex flex-col gap-1 w-full">
                <label className="text-[10px] font-bold tracking-wider text-muted-foreground uppercase" htmlFor="department">
                  Department
                </label>
                <input
                  id="department"
                  type="text"
                  value={department}
                  onChange={(e) => setDepartment(e.target.value)}
                  placeholder="Computer Science & Eng"
                  className="w-full h-11 px-4 bg-muted/50 border border-border rounded-lg text-sm focus:border-primary focus:ring-1 focus:ring-primary focus:outline-none transition-all placeholder:text-muted-foreground/50"
                  disabled={isLoading}
                  required
                />
              </div>

              {/* Submit Button */}
              <button
                type="submit"
                className="w-full h-11 bg-primary text-primary-foreground font-semibold rounded-lg flex items-center justify-center gap-2 hover:bg-primary/95 transition-colors active:scale-[0.98] cursor-pointer disabled:opacity-50 disabled:cursor-not-allowed mt-2"
                disabled={isLoading}
              >
                <span>Register & Confirm Profile</span>
                <ArrowRight className="h-4 w-4" />
              </button>
            </form>
          </div>
        ) : (
          /* ── State A: Connect Card ── */
          <div className="w-full flex flex-col items-center">
            {/* Header */}
            <div className="w-full text-center mb-8">
              <h1 className="text-3xl font-extrabold tracking-tight text-foreground mb-2">
                CampusChain
              </h1>
              <p className="text-sm text-muted-foreground">
                Unified Campus Economy on Stellar
              </p>
            </div>

            {isLoading ? (
              <div className="w-full space-y-6">
                <div className="space-y-2">
                  <Skeleton className="h-4 w-28 mx-auto" />
                  <Skeleton className="h-12 w-full rounded-lg" />
                </div>
                <Skeleton className="h-10 w-full rounded-lg" />
              </div>
            ) : (
              <div className="w-full flex flex-col gap-6">
                {walletError && (
                  <div className="text-xs p-3 rounded-lg border border-destructive/20 bg-destructive/10 text-destructive text-center font-medium">
                    {walletError}
                  </div>
                )}

                <div className="w-full bg-muted/40 rounded-xl p-5 border border-border/60 text-center flex flex-col items-center">
                  <Wallet className="h-10 w-10 text-primary mb-3" />
                  <h3 className="text-sm font-bold text-foreground mb-1">Stellar Wallet Authentication</h3>
                  <p className="text-xs text-muted-foreground max-w-[280px] leading-relaxed">
                    Your wallet credentials act as your campus login. Connect using Freighter, Albedo, or RWallet.
                  </p>
                </div>

                <button
                  onClick={handleConnect}
                  className="w-full h-12 bg-primary text-primary-foreground font-semibold rounded-lg flex items-center justify-center gap-2 hover:bg-primary/95 transition-colors active:scale-[0.98] cursor-pointer"
                >
                  <Wallet className="h-4 w-4" />
                  <span>Connect Stellar Wallet</span>
                </button>
              </div>
            )}
          </div>
        )}

        {/* Divider */}
        <div className="w-full h-px bg-border/60 my-6"></div>

        {/* Footer */}
        <div className="w-full flex items-center justify-center gap-2 text-muted-foreground/75">
          <ShieldCheck className="h-4 w-4" />
          <span className="text-[10px] font-semibold tracking-wider uppercase">Secured by Stellar Network</span>
        </div>
      </div>
    </main>
  );
}
