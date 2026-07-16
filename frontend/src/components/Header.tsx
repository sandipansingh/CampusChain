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
    { name: "Dashboard", href: "/dashboard" },
    { name: "Activity", href: "/activity" },
    { name: "Transactions", href: "/transactions" },
    { name: "Settings", href: "/settings" },
    { name: "Analytics", href: "/analytics" },
  ];

  return (
    <header className="max-w-[95vw] w-full mx-auto mt-6 rounded-[24px] border border-border bg-white/95 backdrop-blur-md sticky top-6 z-50 px-6 py-4 flex flex-col md:flex-row items-center justify-between gap-4 shadow-sm">
      {/* Logo */}
      <Link href="/" className="group">
        <div className="text-xl font-bold tracking-tight text-slate-900 group-hover:text-accent transition-colors duration-300">
          CAMPUSCHAIN
        </div>
      </Link>

      {/* Navigation links */}
      <nav className="flex flex-wrap items-center justify-center gap-2 md:gap-4">
        {navItems.map((item) => {
          const isActive = pathname === item.href;
          return (
            <Link
              key={item.href}
              href={item.href}
              className={`text-xs font-semibold px-4 py-2 rounded-xl transition-all duration-300 ${
                isActive
                  ? "bg-accent text-white"
                  : "text-slate-500 hover:text-slate-900 hover:bg-slate-50"
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
          <div className="flex items-center gap-3">
            <div className="hidden lg:flex flex-col items-end">
              <span className="text-[9px] tracking-wider text-slate-400 font-bold uppercase">
                {getRoleLabel(role)}
              </span>
              <span className="text-xs font-mono text-slate-800 font-semibold">
                {address.slice(0, 6)}...{address.slice(-6)}
              </span>
            </div>
            <button
              onClick={disconnectWallet}
              className="h-10 px-4 border border-border text-slate-600 font-semibold text-xs rounded-xl hover:bg-red-50 hover:text-red-600 hover:border-red-100 transition-all duration-200"
            >
              Disconnect
            </button>
          </div>
        ) : (
          <button
            onClick={connectWallet}
            disabled={isConnecting}
            className="h-10 px-5 bg-accent text-white font-semibold text-xs rounded-xl hover:opacity-95 active:scale-95 transition-all duration-300 disabled:opacity-50 disabled:pointer-events-none"
          >
            {isConnecting ? "CONNECTING..." : "CONNECT WALLET"}
          </button>
        )}
      </div>
    </header>
  );
}
