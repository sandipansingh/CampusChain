"use client";

import Link from "next/link";
import { usePathname } from "next/navigation";
import { useWalletStore } from "@/state/useWalletStore";
import { useCampusUserRole } from "@/hooks/useCampusToken";

export default function Header() {
  const pathname = usePathname();
  const { address, isConnecting, connectWallet, disconnectWallet } = useWalletStore();
  const { data: role } = useCampusUserRole(address);

  const getRoleLabel = (roleNum?: number) => {
    if (roleNum === 1) return "STUDENT";
    if (roleNum === 2) return "MERCHANT";
    if (roleNum === 3) return "CLUB ORGANIZER";
    if (roleNum === 4) return "ADMIN";
    return "MEMBER";
  };

  const navItems = [
    { name: "DASHBOARD", href: "/dashboard" },
    { name: "ACTIVITY", href: "/activity" },
    { name: "TRANSACTIONS", href: "/transactions" },
    { name: "SETTINGS", href: "/settings" },
    { name: "ANALYTICS", href: "/analytics" },
  ];

  return (
    <header className="w-full border-b-2 border-border bg-background sticky top-0 z-50">
      <div className="max-w-[95vw] mx-auto flex flex-col md:flex-row items-center justify-between py-6 gap-6">
        {/* Logo */}
        <Link href="/" className="group">
          <div className="text-3xl font-bold tracking-tighter text-foreground group-hover:text-accent transition-colors duration-300">
            CAMPUSCHAIN
          </div>
        </Link>

        {/* Navigation links */}
        <nav className="flex flex-wrap items-center justify-center gap-4 md:gap-8">
          {navItems.map((item) => {
            const isActive = pathname === item.href;
            return (
              <Link
                key={item.href}
                href={item.href}
                className={`text-sm md:text-base font-bold uppercase tracking-wider px-3 py-1.5 border-2 transition-all duration-300 ${
                  isActive
                    ? "border-accent bg-accent text-accent-foreground"
                    : "border-transparent text-muted-foreground hover:text-foreground hover:border-border"
                }`}
              >
                {item.name}
              </Link>
            );
          })}
        </nav>

        {/* Connect Button or Wallet Badge */}
        <div className="flex items-center gap-4">
          {address ? (
            <div className="flex items-center gap-2">
              <div className="hidden lg:flex flex-col items-end">
                <span className="text-[10px] tracking-widest text-muted-foreground uppercase">
                  {getRoleLabel(role)}
                </span>
                <span className="text-xs font-mono text-foreground font-bold">
                  {address.slice(0, 6)}...{address.slice(-6)}
                </span>
              </div>
              <button
                onClick={disconnectWallet}
                className="h-12 px-6 border-2 border-border bg-transparent text-foreground uppercase tracking-tighter font-bold transition-all duration-200 hover:bg-foreground hover:text-background"
              >
                DISCONNECT
              </button>
            </div>
          ) : (
            <button
              onClick={connectWallet}
              disabled={isConnecting}
              className="h-12 px-6 bg-accent text-accent-foreground uppercase tracking-tighter font-bold transition-all duration-300 hover:scale-105 active:scale-95 disabled:opacity-50 disabled:pointer-events-none"
            >
              {isConnecting ? "CONNECTING..." : "CONNECT WALLET"}
            </button>
          )}
        </div>
      </div>
    </header>
  );
}
