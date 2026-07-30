"use client";

import { useState } from "react";
import { useWallet } from "@/shared/stellar/useWallet";
import { useRegisterProfileMutation } from "@/features/wallet/hooks/useWallet";
import { Skeleton } from "@/shared/ui/Skeleton";
import {
  Wallet,
  Lock,
  Copy,
  Check,
  ArrowRight,
  AlertCircle,
} from "lucide-react";

interface LoginProps {
  showOnboarding?: boolean;
}

export function Login({ showOnboarding = false }: LoginProps) {
  const {
    connect,
    isConnecting,
    error: walletError,
    wrongNetwork,
    address,
    isConnected,
  } = useWallet();

  const registerProfile = useRegisterProfileMutation();

  // Form States
  const [fullName, setFullName] = useState("");
  const [universityId, setUniversityId] = useState("");
  const [department, setDepartment] = useState("");
  const [acceptTerms, setAcceptTerms] = useState(false);
  const [copied, setCopied] = useState(false);
  const [formError, setFormError] = useState<string | null>(null);

  const handleCopyAddress = () => {
    if (!address) return;
    navigator.clipboard.writeText(address);
    setCopied(true);
    setTimeout(() => setCopied(false), 2000);
  };

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
    if (!universityId.trim()) {
      setFormError("Please enter your University ID.");
      return;
    }
    if (!department.trim()) {
      setFormError("Please enter your department.");
      return;
    }
    if (!acceptTerms) {
      setFormError("You must accept the Campus Terms of Use to proceed.");
      return;
    }

    if (!address) {
      setFormError("No connected wallet found. Please connect your wallet first.");
      return;
    }

    try {
      await registerProfile.mutateAsync({
        address,
        fullName: fullName.trim(),
        universityId: universityId.trim(),
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
      <main className="min-h-screen w-full flex items-center justify-center bg-[#F7F7F5] text-zinc-950 p-6">
        <div className="w-full max-w-[480px] bg-white rounded-2xl border border-red-200 p-8 shadow-xl flex flex-col items-center text-center">
          <div className="h-16 w-16 rounded-full bg-red-50 border border-red-200 flex items-center justify-center text-red-600 mb-6">
            <AlertCircle className="h-8 w-8 animate-pulse" />
          </div>
          <h1 className="text-2xl font-extrabold tracking-tight text-zinc-950 mb-3">
            Wrong Network Detected
          </h1>
          <p className="text-sm text-zinc-500 mb-6 leading-relaxed">
            CampusChain runs exclusively on the <strong>Stellar Testnet</strong>. Your connected wallet is currently pointed to a different network.
          </p>
          <div className="w-full bg-red-50/50 border border-red-100 rounded-xl p-4 text-xs text-left mb-6 space-y-2">
            <span className="font-bold text-red-800">How to switch:</span>
            <ol className="list-decimal list-inside space-y-1 text-zinc-600">
              <li>Open your wallet extension (e.g. Freighter, Albedo).</li>
              <li>Go to Settings / Network configuration.</li>
              <li>Switch the active network to <strong>Testnet</strong>.</li>
              <li>Refresh this page or wait for auto-reconnect.</li>
            </ol>
          </div>
          <p className="text-xs text-zinc-400">
            Current network passphrase must match: <code className="block mt-1 p-1 bg-zinc-100 border border-zinc-200 rounded text-[10px] select-all font-mono text-zinc-800">&quot;Test SDF Network ; September 2015&quot;</code>
          </p>
        </div>
      </main>
    );
  }

  return (
    <div className="min-h-screen w-full bg-[#F7F7F5] text-zinc-950 font-sans flex flex-col items-center justify-center p-6 relative">
      {/* Main Container */}
      <main className="w-full max-w-md bg-white border border-zinc-200 rounded-xl p-8 shadow-[0px_4px_20px_rgba(0,0,0,0.02)] relative z-10 flex flex-col items-center">
        
        {/* ─── STATE A: CONNECT WALLET VIEW ─── */}
        {!showOnboarding ? (
          <div className="w-full flex flex-col items-center">
            {/* Header / Wordmark */}
            <div className="text-center mb-8">
              <h1 className="text-4xl font-bold tracking-tight text-zinc-950 mb-3">CampusChain</h1>
              <p className="text-sm leading-relaxed text-zinc-500 max-w-[280px] mx-auto">
                Your campus wallet for payments, marketplace, events and rewards
              </p>
            </div>

            {/* Error notifications */}
            {(walletError || formError) && (
              <div className="w-full text-xs p-3 rounded-lg border border-red-200 bg-red-50 text-red-700 text-center font-medium mb-4">
                {walletError || formError}
              </div>
            )}

            {/* Content states */}
            {isLoading ? (
              <div className="w-full flex flex-col gap-3">
                <Skeleton className="h-[56px] w-full rounded-lg" />
              </div>
            ) : (
              <div className="w-full flex flex-col gap-3">
                <button
                  onClick={handleConnect}
                  className="w-full bg-zinc-950 hover:bg-zinc-800 text-white font-semibold rounded-lg py-4 px-6 flex items-center justify-center gap-2 transition-colors cursor-pointer"
                >
                  <span>Connect Stellar Wallet</span>
                  <ArrowRight className="h-4.5 w-4.5" />
                </button>
              </div>
            )}
          </div>
        ) : (
          /* ─── STATE B: ONBOARDING VIEW ─── */
          <div className="w-full flex flex-col gap-6">
            
            {/* Header Section */}
            <div className="flex flex-col gap-1 items-center text-center">
              <h1 className="text-2xl font-semibold text-zinc-950">Complete your profile</h1>
              <p className="text-sm text-zinc-500">Setup your academic identity for the network.</p>
            </div>

            {/* Error notifications */}
            {(formError || walletError) && (
              <div className="w-full text-xs p-3 rounded-lg border border-red-200 bg-red-50 text-red-700 text-center font-medium">
                {formError || walletError}
              </div>
            )}

            {isLoading ? (
              <div className="w-full flex flex-col gap-4">
                <Skeleton className="h-[38px] w-full rounded-full" />
                <div className="space-y-1">
                  <Skeleton className="h-4 w-20" />
                  <Skeleton className="h-[48px] w-full rounded-lg" />
                </div>
                <div className="space-y-1">
                  <Skeleton className="h-4 w-24" />
                  <Skeleton className="h-[48px] w-full rounded-lg" />
                </div>
                <div className="space-y-1">
                  <Skeleton className="h-4 w-20" />
                  <Skeleton className="h-[48px] w-full rounded-lg" />
                </div>
                <Skeleton className="h-[48px] w-full rounded-lg mt-4" />
              </div>
            ) : (
              <div className="w-full flex flex-col gap-5">
                {/* Wallet Address Pill */}
                {address && (
                  <div className="bg-zinc-50 rounded-full py-2 px-4 flex items-center justify-between border border-zinc-200">
                    <div className="flex items-center gap-2">
                      <Wallet className="h-4 w-4 text-zinc-500" />
                      <span className="text-xs text-zinc-500 font-mono tracking-wider">
                        {address.slice(0, 6)}...{address.slice(-6)}
                      </span>
                    </div>
                    <button
                      type="button"
                      onClick={handleCopyAddress}
                      aria-label="Copy wallet address"
                      className="text-zinc-500 hover:text-zinc-950 transition-colors flex items-center cursor-pointer p-0.5"
                    >
                      {copied ? <Check className="h-4 w-4 text-emerald-600" /> : <Copy className="h-4 w-4" />}
                    </button>
                  </div>
                )}

                {/* Form Fields */}
                <form onSubmit={handleOnboardingSubmit} className="flex flex-col gap-4 w-full">
                  {/* Full Name */}
                  <div className="flex flex-col gap-1.5">
                    <label className="text-sm font-semibold text-zinc-950" htmlFor="fullName">
                      Full Name
                    </label>
                    <input
                      id="fullName"
                      type="text"
                      required
                      value={fullName}
                      onChange={(e) => setFullName(e.target.value)}
                      placeholder="Jane Doe"
                      className="w-full bg-white border border-zinc-200 rounded-lg px-4 py-3 text-body-md text-zinc-950 focus:outline-none focus:border-zinc-950 focus:ring-1 focus:ring-zinc-950 transition-colors placeholder:text-zinc-400"
                    />
                  </div>

                  {/* University ID */}
                  <div className="flex flex-col gap-1.5">
                    <label className="text-sm font-semibold text-zinc-950" htmlFor="universityId">
                      University ID
                    </label>
                    <input
                      id="universityId"
                      type="text"
                      required
                      value={universityId}
                      onChange={(e) => setUniversityId(e.target.value)}
                      placeholder="e.g. 12345678"
                      className="w-full bg-white border border-zinc-200 rounded-lg px-4 py-3 text-body-md text-zinc-950 focus:outline-none focus:border-zinc-950 focus:ring-1 focus:ring-zinc-950 transition-colors placeholder:text-zinc-400"
                    />
                  </div>

                  {/* Department Input (Typing is supported directly) */}
                  <div className="flex flex-col gap-1.5">
                    <label className="text-sm font-semibold text-zinc-950" htmlFor="department">
                      Department
                    </label>
                    <input
                      id="department"
                      type="text"
                      required
                      value={department}
                      onChange={(e) => setDepartment(e.target.value)}
                      placeholder="e.g. Computer Science"
                      className="w-full bg-white border border-zinc-200 rounded-lg px-4 py-3 text-body-md text-zinc-950 focus:outline-none focus:border-zinc-950 focus:ring-1 focus:ring-zinc-950 transition-colors placeholder:text-zinc-400"
                    />
                  </div>

                  {/* Accessible Checkbox for Terms */}
                  <div className="flex items-center gap-3 mt-2">
                    <input
                      id="acceptTerms"
                      type="checkbox"
                      checked={acceptTerms}
                      onChange={(e) => setAcceptTerms(e.target.checked)}
                      className="h-4 w-4 rounded border-zinc-300 text-zinc-950 focus:ring-zinc-950 accent-zinc-950 cursor-pointer"
                    />
                    <label htmlFor="acceptTerms" className="text-sm text-zinc-600 select-none cursor-pointer">
                      Accept Campus Terms of Use
                    </label>
                  </div>

                  {/* Submit Button */}
                  <button
                    type="submit"
                    disabled={!acceptTerms || registerProfile.isPending}
                    className="w-full bg-zinc-950 text-white font-semibold rounded-lg py-4 px-6 flex items-center justify-center gap-2 hover:bg-zinc-800 transition-colors focus:outline-none focus:ring-2 focus:ring-offset-2 focus:ring-zinc-950 disabled:opacity-50 disabled:cursor-not-allowed cursor-pointer mt-4"
                  >
                    <span>Continue</span>
                    <ArrowRight className="h-4.5 w-4.5" />
                  </button>
                </form>

                {/* Progress Indicator */}
                <div className="flex justify-center gap-2 mt-2">
                  <div className="w-8 h-1 rounded-full bg-zinc-950"></div>
                  <div className="w-2 h-1 rounded-full bg-zinc-200"></div>
                  <div className="w-2 h-1 rounded-full bg-zinc-200"></div>
                </div>
              </div>
            )}
          </div>
        )}
      </main>

      {/* Footer fixed at bottom */}
      <footer className="fixed bottom-0 left-0 w-full p-6 flex flex-col sm:flex-row items-center justify-center gap-4 z-0 text-zinc-400">
        <div className="flex items-center gap-2 text-xs font-semibold select-none">
          <Lock className="h-4 w-4" />
          <span>Secured by the Stellar Network</span>
        </div>
        <div className="bg-zinc-100 text-zinc-600 px-3 py-1 rounded-full text-xs font-semibold border border-zinc-200 select-none">
          Testnet
        </div>
      </footer>
    </div>
  );
}
export default Login;
