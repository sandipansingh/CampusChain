"use client";

import React, { useState } from "react";
import Link from "next/link";
import { usePathname } from "next/navigation";
import { useWalletStore } from "@/state/useWalletStore";
import { useCampusUserRole, useCampusBalance } from "@/hooks/useCampusToken";
import {
  LayoutDashboard,
  Activity,
  History,
  Settings,
  User,
  Bell,
  Wallet,
  LogOut,
  HelpCircle,
  Search,
  Menu,
  X,
  TrendingUp,
  ChevronRight,
  Shield,
  Loader2,
  Calendar,
  Lock
} from "lucide-react";

export default function AppShell({ children }: { children: React.ReactNode }) {
  const pathname = usePathname();
  const { address, isConnecting, connectWallet, disconnectWallet } = useWalletStore();
  const { data: role } = useCampusUserRole(address);
  const { data: balance, isLoading: balanceLoading } = useCampusBalance(address);
  const [mobileMenuOpen, setMobileMenuOpen] = useState(false);

  // If we are on the landing page, render children directly without the shell
  if (pathname === "/") {
    return <>{children}</>;
  }

  const getRoleLabel = (roleNum?: number) => {
    if (roleNum === 1) return "Student";
    if (roleNum === 2) return "Merchant";
    if (roleNum === 3) return "Club Organizer";
    if (roleNum === 4) return "Admin";
    return "Member";
  };

  const getRoleColor = (roleNum?: number) => {
    if (roleNum === 1) return "bg-emerald-50 text-emerald-700 border-emerald-200";
    if (roleNum === 2) return "bg-blue-50 text-blue-700 border-blue-200";
    if (roleNum === 3) return "bg-purple-50 text-purple-700 border-purple-200";
    if (roleNum === 4) return "bg-rose-50 text-rose-700 border-rose-200";
    return "bg-slate-50 text-slate-700 border-slate-200";
  };

  const menuItems = [
    {
      group: "Menu",
      items: [
        { name: "Dashboard", href: "/dashboard", icon: LayoutDashboard },
        { name: "Analytics", href: "/analytics", icon: TrendingUp },
        { name: "Activity Feed", href: "/activity", icon: Activity },
        { name: "Transactions", href: "/transactions", icon: History },
      ],
    },
    {
      group: "Account & Wallet",
      items: [
        { name: "My Wallet", href: "/wallet", icon: Wallet },
        { name: "Profile", href: "/profile", icon: User },
        { name: "Notifications", href: "/notifications", icon: Bell, badge: "2" },
      ],
    },
    {
      group: "General",
      items: [
        { name: "Settings", href: "/settings", icon: Settings },
      ],
    },
  ];

  // Generate a deterministic gradient avatar based on wallet address
  const getAvatarGradient = (addr: string | null) => {
    if (!addr) return "from-slate-400 to-slate-600";
    let hash = 0;
    for (let i = 0; i < addr.length; i++) {
      hash = addr.charCodeAt(i) + ((hash << 5) - hash);
    }
    const colors = [
      "from-orange-500 to-rose-500",
      "from-emerald-500 to-teal-500",
      "from-blue-500 to-indigo-500",
      "from-purple-500 to-pink-500",
      "from-amber-500 to-orange-500",
      "from-cyan-500 to-blue-500",
    ];
    const index = Math.abs(hash) % colors.length;
    return colors[index];
  };

  const currentRouteName = () => {
    const matched = menuItems
      .flatMap((g) => g.items)
      .find((item) => pathname === item.href);
    return matched ? matched.name : "App";
  };

  return (
    <div className="min-h-screen bg-background text-foreground flex flex-col font-sans select-none antialiased">
      {/* Top Banner Warning for Sandbox Connection if disconnected */}
      {!address && (
        <div className="fixed inset-0 z-55 flex items-center justify-center bg-background/80 backdrop-blur-md p-6">
          <div className="bg-white border border-border rounded-2xl shadow-xl p-8 max-w-md w-full text-center flex flex-col items-center gap-6">
            <div className="w-16 h-16 rounded-full bg-orange-50 flex items-center justify-center text-accent">
              <Shield className="w-8 h-8" />
            </div>
            <div className="flex flex-col gap-2">
              <h2 className="text-2xl font-bold tracking-tight text-slate-900 uppercase">
                AUTHENTICATION REQUIRED
              </h2>
              <p className="text-slate-500 text-sm">
                Connect your Stellar / Freighter wallet to activate your campus profile, manage escrows, and view transaction history.
              </p>
            </div>
            <button
              onClick={connectWallet}
              disabled={isConnecting}
              className="w-full h-14 bg-accent text-accent-foreground font-bold tracking-tighter rounded-xl uppercase flex items-center justify-center gap-2 hover:opacity-95 active:scale-95 transition-all duration-200 disabled:opacity-50"
            >
              {isConnecting ? (
                <>
                  <Loader2 className="w-5 h-5 animate-spin" />
                  CONNECTING WALLET...
                </>
              ) : (
                "CONNECT WALLET NOW →"
              )}
            </button>
            <Link
              href="/"
              className="text-xs font-bold text-slate-400 hover:text-accent uppercase tracking-wider"
            >
              ← RETURN TO LANDING PAGE
            </Link>
          </div>
        </div>
      )}

      {/* Main Grid Layout */}
      <div className="flex flex-1 relative">
        {/* Left Sidebar - Desktop */}
        <aside className="w-64 bg-white border-r border-border hidden lg:flex flex-col shrink-0 sticky top-0 h-screen z-20">
          {/* Logo Brand Header */}
          <div className="h-20 border-b border-border flex items-center px-8 gap-3">
            <div className="w-10 h-10 rounded-xl bg-accent flex items-center justify-center text-white font-black text-xl shadow-md shadow-accent/20">
              CC
            </div>
            <Link href="/" className="flex flex-col">
              <span className="font-extrabold text-lg tracking-tighter text-slate-900 leading-none">
                CAMPUSCHAIN
              </span>
              <span className="text-[10px] tracking-widest text-slate-400 uppercase font-black mt-1">
                Unified Economy
              </span>
            </Link>
          </div>

          {/* Navigation Links Scroll Container */}
          <nav className="flex-1 overflow-y-auto px-6 py-8 flex flex-col gap-8">
            {menuItems.map((group) => (
              <div key={group.group} className="flex flex-col gap-3">
                <span className="text-[10px] tracking-widest text-slate-400 font-bold uppercase px-3">
                  {group.group}
                </span>
                <div className="flex flex-col gap-1.5">
                  {group.items.map((item) => {
                    const isActive = pathname === item.href;
                    const Icon = item.icon;
                    return (
                      <Link
                        key={item.href}
                        href={item.href}
                        className={`flex items-center justify-between px-4 py-3 rounded-xl font-semibold text-sm transition-all duration-200 group ${
                          isActive
                            ? "bg-accent text-white shadow-md shadow-accent/15"
                            : "text-slate-500 hover:text-slate-900 hover:bg-slate-50"
                        }`}
                      >
                        <div className="flex items-center gap-3.5">
                          <Icon
                            className={`w-5 h-5 shrink-0 ${
                              isActive ? "text-white" : "text-slate-400 group-hover:text-slate-900"
                            }`}
                          />
                          <span>{item.name}</span>
                        </div>
                        {item.badge && (
                          <span
                            className={`text-[10px] font-bold px-2 py-0.5 rounded-full ${
                              isActive ? "bg-white/20 text-white" : "bg-red-50 text-red-600 border border-red-100"
                            }`}
                          >
                            {item.badge}
                          </span>
                        )}
                      </Link>
                    );
                  })}
                </div>
              </div>
            ))}
          </nav>

          {/* Bottom Sidebar Profile / Wallet Summary */}
          <div className="p-6 border-t border-border bg-slate-50/50 flex flex-col gap-4">
            <div className="flex items-center gap-3">
              <div
                className={`w-10 h-10 rounded-xl bg-gradient-to-tr ${getAvatarGradient(
                  address
                )} shadow-md`}
              />
              <div className="flex flex-col overflow-hidden">
                <span className="font-bold text-sm text-slate-800 truncate">
                  {address ? `${address.slice(0, 6)}...${address.slice(-6)}` : "Guest"}
                </span>
                <span className={`text-[10px] font-bold uppercase tracking-wider px-1.5 py-0.5 rounded border self-start mt-0.5 ${getRoleColor(role)}`}>
                  {getRoleLabel(role)}
                </span>
              </div>
            </div>

            <button
              onClick={disconnectWallet}
              className="flex items-center justify-center gap-2 w-full py-2.5 bg-white border border-border text-slate-600 text-xs font-bold uppercase tracking-tight rounded-xl hover:bg-red-50 hover:text-red-600 hover:border-red-100 active:scale-95 transition-all duration-200"
            >
              <LogOut className="w-3.5 h-3.5" />
              Disconnect
            </button>
          </div>
        </aside>

        {/* Mobile Slide-Out Menu Drawer */}
        {mobileMenuOpen && (
          <div className="fixed inset-0 z-40 lg:hidden flex">
            {/* Backdrop */}
            <div
              className="fixed inset-0 bg-slate-900/40 backdrop-blur-sm"
              onClick={() => setMobileMenuOpen(false)}
            />
            {/* Drawer */}
            <aside className="relative w-72 bg-white flex flex-col h-full z-50 p-6 shadow-xl animate-in slide-in-from-left duration-200">
              <div className="flex items-center justify-between mb-8">
                <div className="flex items-center gap-3">
                  <div className="w-10 h-10 rounded-xl bg-accent flex items-center justify-center text-white font-black text-xl">
                    CC
                  </div>
                  <div className="flex flex-col">
                    <span className="font-extrabold text-md tracking-tighter text-slate-900 leading-none">
                      CAMPUSCHAIN
                    </span>
                    <span className="text-[9px] tracking-widest text-slate-400 uppercase font-black mt-1">
                      Unified Economy
                    </span>
                  </div>
                </div>
                <button
                  onClick={() => setMobileMenuOpen(false)}
                  className="w-8 h-8 rounded-lg bg-slate-100 flex items-center justify-center text-slate-500 hover:bg-slate-200 active:scale-95 transition-all"
                >
                  <X className="w-4 h-4" />
                </button>
              </div>

              <nav className="flex-1 overflow-y-auto flex flex-col gap-8">
                {menuItems.map((group) => (
                  <div key={group.group} className="flex flex-col gap-3">
                    <span className="text-[9px] tracking-widest text-slate-400 font-bold uppercase px-3">
                      {group.group}
                    </span>
                    <div className="flex flex-col gap-1">
                      {group.items.map((item) => {
                        const isActive = pathname === item.href;
                        const Icon = item.icon;
                        return (
                          <Link
                            key={item.href}
                            href={item.href}
                            onClick={() => setMobileMenuOpen(false)}
                            className={`flex items-center justify-between px-4 py-2.5 rounded-xl font-semibold text-sm transition-all duration-200 ${
                              isActive
                                ? "bg-accent text-white"
                                : "text-slate-500 hover:text-slate-900 hover:bg-slate-50"
                            }`}
                          >
                            <div className="flex items-center gap-3">
                              <Icon className="w-4 h-4" />
                              <span>{item.name}</span>
                            </div>
                            {item.badge && (
                              <span
                                className={`text-[10px] font-bold px-2 py-0.5 rounded-full ${
                                  isActive ? "bg-white/25 text-white" : "bg-red-50 text-red-600"
                                }`}
                              >
                                {item.badge}
                              </span>
                            )}
                          </Link>
                        );
                      })}
                    </div>
                  </div>
                ))}
              </nav>

              <div className="pt-6 border-t border-border mt-auto flex flex-col gap-4">
                <div className="flex items-center gap-3">
                  <div
                    className={`w-10 h-10 rounded-xl bg-gradient-to-tr ${getAvatarGradient(
                      address
                    )}`}
                  />
                  <div className="flex flex-col overflow-hidden">
                    <span className="font-bold text-sm text-slate-800 truncate">
                      {address ? `${address.slice(0, 6)}...${address.slice(-6)}` : "Guest"}
                    </span>
                    <span className={`text-[10px] font-bold uppercase tracking-wider px-1.5 py-0.5 rounded border self-start mt-0.5 ${getRoleColor(role)}`}>
                      {getRoleLabel(role)}
                    </span>
                  </div>
                </div>
                <button
                  onClick={() => {
                    disconnectWallet();
                    setMobileMenuOpen(false);
                  }}
                  className="flex items-center justify-center gap-2 w-full py-2.5 bg-slate-50 border border-border text-slate-600 text-xs font-bold uppercase tracking-tight rounded-xl hover:bg-red-50 hover:text-red-600 active:scale-95 transition-all duration-200"
                >
                  <LogOut className="w-3.5 h-3.5" />
                  Disconnect
                </button>
              </div>
            </aside>
          </div>
        )}

        {/* Right Dashboard Area (Header + Main Content) */}
        <div className="flex-1 flex flex-col min-w-0 max-h-screen overflow-y-auto bg-background">
          {/* Top Header */}
          <header className="h-20 bg-white border-b border-border flex items-center justify-between px-6 md:px-8 shrink-0 sticky top-0 z-10 shadow-sm shadow-slate-100/50">
            {/* Header Left: Burger / Search & Breadcrumbs */}
            <div className="flex items-center gap-4">
              <button
                onClick={() => setMobileMenuOpen(true)}
                className="w-10 h-10 rounded-xl bg-slate-50 border border-border flex items-center justify-center text-slate-500 lg:hidden hover:bg-slate-100 active:scale-95 transition-all"
              >
                <Menu className="w-5 h-5" />
              </button>

              {/* Breadcrumbs for desktop */}
              <div className="hidden sm:flex items-center gap-2 text-xs font-bold uppercase tracking-wider text-slate-400">
                <Link href="/dashboard" className="hover:text-accent">
                  CAMPUSCHAIN
                </Link>
                <ChevronRight className="w-3.5 h-3.5" />
                <span className="text-slate-800">{currentRouteName()}</span>
              </div>
            </div>

            {/* Header Center/Right: Search bar (Finexy Style) */}
            <div className="hidden md:flex items-center bg-slate-50 border border-border rounded-xl px-3.5 py-2 w-80 max-w-xs focus-within:border-accent/40 focus-within:ring-1 focus-within:ring-accent/15 transition-all">
              <Search className="w-4 h-4 text-slate-400 mr-2.5 shrink-0" />
              <input
                type="text"
                placeholder="Search transactions, escrows..."
                className="bg-transparent text-xs font-semibold text-slate-700 outline-none w-full placeholder-slate-400"
              />
              <span className="text-[10px] font-mono text-slate-400 bg-white border border-slate-200 rounded px-1.5 py-0.5 ml-2 shadow-sm shrink-0">
                ⌘K
              </span>
            </div>

            {/* Header Right Buttons / User info */}
            <div className="flex items-center gap-4">
              {/* Wallet Quick Balance badge */}
              {address && (
                <div className="hidden md:flex flex-col items-end border-r border-border pr-4 mr-2">
                  <span className="text-[9px] tracking-widest text-slate-400 uppercase font-black">
                    LEDGER BALANCE
                  </span>
                  <div className="flex items-center gap-1.5 mt-0.5">
                    <span className="font-extrabold text-sm text-slate-800 font-mono">
                      {balanceLoading ? (
                        <Loader2 className="w-3 h-3 animate-spin text-slate-400" />
                      ) : (
                        balance?.toFixed(2)
                      )}
                    </span>
                    <span className="text-[9px] font-bold text-accent">CAMP</span>
                  </div>
                </div>
              )}

              {/* Action Circle Buttons */}
              <div className="flex items-center gap-2">
                <Link href="/notifications">
                  <button className="relative w-10 h-10 rounded-xl bg-slate-50 border border-border flex items-center justify-center text-slate-500 hover:bg-slate-100 hover:text-slate-800 active:scale-95 transition-all">
                    <Bell className="w-4.5 h-4.5" />
                    <span className="absolute top-2 right-2 w-2 h-2 rounded-full bg-accent" />
                  </button>
                </Link>
                <Link href="/help">
                  <button className="w-10 h-10 rounded-xl bg-slate-50 border border-border flex items-center justify-center text-slate-500 hover:bg-slate-100 hover:text-slate-800 active:scale-95 transition-all">
                    <HelpCircle className="w-4.5 h-4.5" />
                  </button>
                </Link>
              </div>

              {/* User Avatar Circle */}
              <Link href="/profile" className="flex items-center gap-3 border-l border-border pl-4">
                <div
                  className={`w-10 h-10 rounded-xl bg-gradient-to-tr ${getAvatarGradient(
                    address
                  )} shadow-md shrink-0`}
                />
                <div className="hidden sm:flex flex-col overflow-hidden w-28">
                  <span className="font-extrabold text-xs text-slate-900 truncate">
                    {address ? `${address.slice(0, 6)}...${address.slice(-6)}` : "Guest"}
                  </span>
                  <span className="text-[9px] text-slate-400 font-bold uppercase tracking-wider">
                    {getRoleLabel(role)}
                  </span>
                </div>
              </Link>
            </div>
          </header>

          {/* Main Workspace Area with transition */}
          <main className="flex-1 p-6 md:p-8 animate-in fade-in duration-300">
            {children}
          </main>
        </div>
      </div>
    </div>
  );
}
