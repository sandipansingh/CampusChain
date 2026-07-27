"use client";

import { useState } from "react";
import { useWallet } from "@/shared/stellar/useWallet";
import { Skeleton } from "@/shared/ui/Skeleton";
import { User, Lock, ArrowRight, ShieldCheck } from "lucide-react";

interface LoginProps {
  onLoginSuccess?: () => void;
}

export function Login({ onLoginSuccess }: LoginProps) {
  const { connect, isConnecting, error, wrongNetwork } = useWallet();
  const [email, setEmail] = useState("");
  const [password, setPassword] = useState("");
  const [validationError, setValidationError] = useState<string | null>(null);
  const [isSimulatingSSO, setIsSimulatingSSO] = useState(false);

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    setValidationError(null);

    // Simple validation
    if (!email) {
      setValidationError("Please enter your University ID or Email.");
      return;
    }
    if (!password) {
      setValidationError("Please enter your password.");
      return;
    }

    setIsSimulatingSSO(true);
    try {
      // Connect Stellar Wallet as part of the unified authentication
      const addr = await connect();
      if (addr) {
        onLoginSuccess?.();
      }
    } catch {
      // Handled by wallet store state
    } finally {
      setIsSimulatingSSO(false);
    }
  };

  const isLoading = isConnecting || isSimulatingSSO;

  return (
    <main className="min-h-screen w-full flex items-center justify-center bg-background text-foreground p-6">
      <div className="w-full max-w-[440px] bg-card rounded-xl border border-border p-6 md:p-8 shadow-sm flex flex-col items-center">
        {/* Header */}
        <div className="w-full text-center mb-8">
          <h1 className="text-3xl font-extrabold tracking-tight text-foreground mb-2">
            CampusChain
          </h1>
          <p className="text-sm text-muted-foreground">
            Sign in to your university portal
          </p>
        </div>

        {/* Loading skeletons vs actual SSO form */}
        {isLoading ? (
          <div className="w-full space-y-6">
            <div className="space-y-2">
              <Skeleton className="h-4 w-28" />
              <Skeleton className="h-12 w-full" />
            </div>
            <div className="space-y-2">
              <Skeleton className="h-4 w-20" />
              <Skeleton className="h-12 w-full" />
            </div>
            <Skeleton className="h-12 w-full rounded-lg" />
          </div>
        ) : (
          <form onSubmit={handleSubmit} className="w-full flex flex-col gap-5">
            {/* Display errors */}
            {(validationError || error) && (
              <div className={`text-xs p-3 rounded-lg border w-full text-center ${wrongNetwork ? "bg-amber-50 text-amber-800 border-amber-200" : "bg-destructive/10 text-destructive border-destructive/20"}`}>
                {validationError || error}
              </div>
            )}

            {/* Email Input */}
            <div className="flex flex-col gap-2 w-full">
              <label
                className="text-xs font-bold tracking-wider text-muted-foreground uppercase"
                htmlFor="university-id"
              >
                University ID / Email
              </label>
              <div className="relative w-full">
                <User className="absolute left-3 top-1/2 -translate-y-1/2 h-5 w-5 text-muted-foreground/75" />
                <input
                  id="university-id"
                  type="email"
                  value={email}
                  onChange={(e) => setEmail(e.target.value)}
                  placeholder="student@university.edu"
                  className="w-full h-12 pl-10 pr-4 bg-card border border-border rounded-lg text-sm placeholder:text-muted-foreground/60 focus:border-foreground focus:ring-1 focus:ring-foreground focus:outline-none transition-all"
                  required
                />
              </div>
            </div>

            {/* Password Input */}
            <div className="flex flex-col gap-2 w-full">
              <div className="flex justify-between items-center w-full">
                <label
                  className="text-xs font-bold tracking-wider text-muted-foreground uppercase"
                  htmlFor="password"
                >
                  Password
                </label>
                <a
                  href="#"
                  onClick={(e) => e.preventDefault()}
                  className="text-xs text-muted-foreground hover:text-foreground transition-colors"
                >
                  Forgot?
                </a>
              </div>
              <div className="relative w-full">
                <Lock className="absolute left-3 top-1/2 -translate-y-1/2 h-5 w-5 text-muted-foreground/75" />
                <input
                  id="password"
                  type="password"
                  value={password}
                  onChange={(e) => setPassword(e.target.value)}
                  placeholder="••••••••"
                  className="w-full h-12 pl-10 pr-4 bg-card border border-border rounded-lg text-sm placeholder:text-muted-foreground/60 focus:border-foreground focus:ring-1 focus:ring-foreground focus:outline-none transition-all"
                  required
                />
              </div>
            </div>

            {/* Action Button */}
            <button
              type="submit"
              className="w-full h-12 mt-2 bg-primary text-primary-foreground font-semibold rounded-lg flex items-center justify-center gap-2 hover:bg-primary/95 transition-colors active:scale-[0.98] cursor-pointer"
            >
              <span>Login with University SSO</span>
              <ArrowRight className="h-4 w-4" />
            </button>
          </form>
        )}

        {/* Post-login help text */}
        <div className="mt-6 w-full text-center">
          <p className="text-xs text-muted-foreground">
            First time?{" "}
            <a
              href="#"
              onClick={(e) => {
                e.preventDefault();
                connect();
              }}
              className="text-foreground hover:underline font-medium"
            >
              Link your Stellar wallet after login
            </a>
          </p>
        </div>

        {/* Divider */}
        <div className="w-full h-px bg-border my-6"></div>

        {/* Footer */}
        <div className="w-full flex items-center justify-center gap-2 text-muted-foreground">
          <ShieldCheck className="h-4 w-4" />
          <span className="text-xs font-medium">Secured by Stellar Network</span>
        </div>
      </div>
    </main>
  );
}
