"use client";

import React, { useState } from "react";
import Link from "next/link";
import { usePathname } from "next/navigation";
import { useWalletStore } from "@/state/useWalletStore";
import { useCampusUserRole, useCampusBalance } from "@/hooks/useCampusToken";
import ProfileAvatar from "@/components/ProfileAvatar";
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
  Loader2
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
    if (roleNum === 1) return "bg-emerald-50 text-emerald-600 border-emerald-100";
    if (roleNum === 2) return "bg-blue-50 text-blue-600 border-blue-100";
    if (roleNum === 3) return "bg-purple-50 text-purple-600 border-purple-100";
    if (roleNum === 4) return "bg-rose-50 text-rose-600 border-rose-100";
    return "bg-slate-50 text-slate-500 border-slate-100";
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
        { name: "Notifications", href: "/notifications", icon: Bell },
      ],
    },
    {
      group: "General",
      items: [
        { name: "Settings", href: "/settings", icon: Settings },
      ],
    },
  ];

  const currentRouteName = () => {
    const matched = menuItems
      .flatMap((g) => g.items)
      .find((item) => pathname === item.href);
    return matched ? matched.name : "App";
  };

  return (
    <div className="h-screen bg-[#f4f6f8] text-slate-800 flex p-6 gap-6 font-sans select-none antialiased overflow-hidden">
      
      {/* Top Banner Warning for Sandbox Connection if disconnected */}
      {!address && (
        <div className="fixed inset-0 z-50 flex items-center justify-center bg-slate-900/10 backdrop-blur-sm p-6">
          <div className="bg-white border border-border rounded-[24px] p-8 max-w-md w-full text-center flex flex-col items-center gap-6">
            <div className="w-14 h-14 rounded-full bg-orange-50 flex items-center justify-center text-accent">
              <Wallet className="w-7 h-7" />
            </div>
            <div className="flex flex-col gap-1.5">
              <h2 className="text-xl font-semibold tracking-tight text-slate-900">
                Authentication Required
              </h2>
              <p className="text-slate-500 text-xs leading-relaxed">
                Connect your Stellar / Freighter wallet to activate your campus profile, manage escrows, and view transaction history.
              </p>
            </div>
            <button
              onClick={connectWallet}
              disabled={isConnecting}
              className="w-full h-12 bg-accent text-white font-semibold text-sm rounded-2xl flex items-center justify-center gap-2 hover:opacity-95 active:scale-95 transition-all duration-200"
            >
              {isConnecting ? (
                <>
                  <Loader2 className="w-4 h-4 animate-spin" />
                  Connecting wallet...
                </>
              ) : (
                "Connect wallet now"
              )}
            </button>
            <Link
              href="/"
              className="text-xs font-semibold text-slate-400 hover:text-accent tracking-tight"
            >
              ← Return to landing page
            </Link>
          </div>
        </div>
      )}

      {/* Left Sidebar - Desktop - Floating style */}
      <aside className="w-64 bg-white border border-border rounded-[24px] hidden lg:flex flex-col shrink-0 h-full">
        {/* Logo Brand Header */}
        <div className="h-20 border-b border-slate-100 flex items-center px-6 gap-3">
          <div className="w-8 h-8 rounded-xl bg-accent flex items-center justify-center text-white font-extrabold text-base">
            C
          </div>
          <Link href="/" className="flex flex-col">
            <span className="font-bold text-base tracking-tight text-slate-900">
              CampusChain
            </span>
          </Link>
        </div>

        {/* Navigation Links Scroll Container */}
        <nav className="flex-1 overflow-y-auto px-4 py-6 flex flex-col gap-6">
          {menuItems.map((group) => (
            <div key={group.group} className="flex flex-col gap-2">
              <span className="text-[10px] tracking-wider text-slate-400 font-bold uppercase px-3">
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
                      className={`flex items-center justify-between px-4 py-2.5 rounded-2xl font-semibold text-sm transition-all duration-200 group ${
                        isActive
                          ? "bg-accent text-white"
                          : "text-slate-500 hover:text-slate-900 hover:bg-slate-50"
                      }`}
                    >
                      <div className="flex items-center gap-3">
                        <Icon
                          className={`w-4 h-4 shrink-0 ${
                            isActive ? "text-white" : "text-slate-400 group-hover:text-slate-900"
                          }`}
                        />
                        <span>{item.name}</span>
                      </div>
                    </Link>
                  );
                })}
              </div>
            </div>
          ))}
        </nav>

        {/* Bottom Sidebar Profile / Wallet Summary */}
        <div className="p-4 border-t border-slate-100 bg-slate-50/50 flex flex-col gap-3 rounded-b-[24px]">
          <div className="flex items-center gap-3 px-2">
            <ProfileAvatar address={address} size={36} />
            <div className="flex flex-col overflow-hidden">
              <span className="font-semibold text-xs text-slate-800 truncate">
                {address ? `${address.slice(0, 6)}...${address.slice(-4)}` : "Guest"}
              </span>
              <span className={`text-[9px] font-bold uppercase tracking-wider px-1.5 py-0.5 rounded border self-start mt-0.5 ${getRoleColor(role)}`}>
                {getRoleLabel(role)}
              </span>
            </div>
          </div>

          <button
            onClick={disconnectWallet}
            className="flex items-center justify-center gap-2 w-full py-2.5 bg-white border border-border text-slate-600 text-xs font-semibold rounded-xl hover:bg-red-50 hover:text-red-600 hover:border-red-100 transition-all duration-200"
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
            className="fixed inset-0 bg-slate-900/20 backdrop-blur-sm"
            onClick={() => setMobileMenuOpen(false)}
          />
          {/* Drawer */}
          <aside className="relative w-72 bg-white flex flex-col h-full z-50 p-6 border-r border-border animate-in slide-in-from-left duration-200">
            <div className="flex items-center justify-between mb-6">
              <div className="flex items-center gap-3">
                <div className="w-8 h-8 rounded-xl bg-accent flex items-center justify-center text-white font-extrabold text-base">
                  C
                </div>
                <span className="font-bold text-base tracking-tight text-slate-900">
                  CampusChain
                </span>
              </div>
              <button
                onClick={() => setMobileMenuOpen(false)}
                className="w-8 h-8 rounded-lg bg-slate-100 flex items-center justify-center text-slate-500 hover:bg-slate-200 transition-all"
              >
                <X className="w-4 h-4" />
              </button>
            </div>

            <nav className="flex-1 overflow-y-auto flex flex-col gap-6">
              {menuItems.map((group) => (
                <div key={group.group} className="flex flex-col gap-2">
                  <span className="text-[10px] tracking-wider text-slate-400 font-bold uppercase px-3">
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
                          className={`flex items-center justify-between px-4 py-2.5 rounded-2xl font-semibold text-sm transition-all duration-200 ${
                            isActive
                              ? "bg-accent text-white"
                              : "text-slate-500 hover:text-slate-900 hover:bg-slate-50"
                          }`}
                        >
                          <div className="flex items-center gap-3">
                            <Icon className="w-4 h-4" />
                            <span>{item.name}</span>
                          </div>
                        </Link>
                      );
                    })}
                  </div>
                </div>
              ))}
            </nav>

            <div className="pt-6 border-t border-slate-100 mt-auto flex flex-col gap-4">
              <div className="flex items-center gap-3 px-2">
                <ProfileAvatar address={address} size={36} />
                <div className="flex flex-col overflow-hidden">
                  <span className="font-semibold text-xs text-slate-800 truncate">
                    {address ? `${address.slice(0, 6)}...${address.slice(-4)}` : "Guest"}
                  </span>
                  <span className={`text-[9px] font-bold uppercase tracking-wider px-1.5 py-0.5 rounded border self-start mt-0.5 ${getRoleColor(role)}`}>
                    {getRoleLabel(role)}
                  </span>
                </div>
              </div>
              <button
                onClick={() => {
                  disconnectWallet();
                  setMobileMenuOpen(false);
                }}
                className="flex items-center justify-center gap-2 w-full py-2.5 bg-slate-50 border border-border text-slate-600 text-xs font-semibold rounded-xl hover:bg-red-50 hover:text-red-600 transition-all duration-200"
              >
                <LogOut className="w-3.5 h-3.5" />
                Disconnect
              </button>
            </div>
          </aside>
        </div>
      )}

      {/* Right Dashboard Area (Header + Main Content) - Floating Layout */}
      <div className="flex-1 flex flex-col gap-6 min-w-0 h-full">
        {/* Top Header - Floating Card */}
        <header className="h-20 bg-white border border-border rounded-[24px] flex items-center justify-between px-6 md:px-8 shrink-0">
          {/* Header Left: Burger / Search & Breadcrumbs */}
          <div className="flex items-center gap-4">
            <button
              onClick={() => setMobileMenuOpen(true)}
              className="w-10 h-10 rounded-xl bg-slate-50 border border-border flex items-center justify-center text-slate-500 lg:hidden hover:bg-slate-100 transition-all"
            >
              <Menu className="w-5 h-5" />
            </button>

            {/* Breadcrumbs for desktop */}
            <div className="hidden sm:flex items-center gap-1.5 text-xs font-semibold text-slate-400">
              <Link href="/dashboard" className="hover:text-accent">
                CampusChain
              </Link>
              <ChevronRight className="w-3.5 h-3.5" />
              <span className="text-slate-800">{currentRouteName()}</span>
            </div>
          </div>

          {/* Header Center/Right: Search bar (Finexy Style) */}
          <div className="hidden md:flex items-center bg-slate-50 border border-border rounded-2xl px-4 py-2.5 w-80 focus-within:border-accent/40 transition-all">
            <Search className="w-4 h-4 text-slate-400 mr-2.5 shrink-0" />
            <input
              type="text"
              placeholder="Search product..."
              className="bg-transparent text-xs font-medium text-slate-700 outline-none w-full placeholder-slate-400"
            />
            <span className="text-[9px] font-semibold text-slate-400 bg-white border border-slate-200 rounded px-1.5 py-0.5 ml-2 shrink-0">
              K ⌘
            </span>
          </div>

          {/* Header Right Buttons / User info */}
          <div className="flex items-center gap-4">
            {/* Wallet Quick Balance badge */}
            {address && (
              <div className="hidden md:flex flex-col items-end border-r border-slate-100 pr-4 mr-2">
                <span className="text-[9px] tracking-wider text-slate-400 font-bold uppercase">
                  Balance
                </span>
                <div className="flex items-center gap-1 mt-0.5">
                  <span className="font-semibold text-sm text-slate-800 font-mono">
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
                <button className="relative w-9 h-9 rounded-full bg-white border border-border flex items-center justify-center text-slate-500 hover:bg-slate-50 transition-all">
                  <Bell className="w-4 h-4" />
                </button>
              </Link>
              <Link href="/help">
                <button className="w-9 h-9 rounded-full bg-white border border-border flex items-center justify-center text-slate-500 hover:bg-slate-50 transition-all">
                  <HelpCircle className="w-4 h-4" />
                </button>
              </Link>
            </div>

            {/* User Avatar Circle */}
            <Link href="/profile" className="flex items-center gap-3 border-l border-slate-100 pl-4">
              <ProfileAvatar address={address} size={36} />
              <div className="hidden sm:flex flex-col overflow-hidden w-24">
                <span className="font-semibold text-xs text-slate-900 truncate leading-none">
                  {address ? `${address.slice(0, 6)}...${address.slice(-4)}` : "Guest"}
                </span>
                <span className="text-[9px] text-slate-400 font-medium mt-0.5 leading-none">
                  {getRoleLabel(role)}
                </span>
              </div>
            </Link>
          </div>
        </header>

        {/* Main Workspace Area with transition - Scrollable container */}
        <main className="flex-1 overflow-y-auto pr-1 animate-in fade-in duration-300">
          {children}
        </main>
      </div>
    </div>
  );
}
