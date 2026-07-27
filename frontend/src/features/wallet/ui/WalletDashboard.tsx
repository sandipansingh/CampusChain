"use client";

import { useState } from "react";
import { useWallet } from "@/shared/stellar/useWallet";
import { Skeleton } from "@/shared/ui/Skeleton";
import { Dropdown } from "@/shared/ui/Dropdown";
import {
  LayoutDashboard,
  Wallet,
  QrCode,
  ShoppingBag,
  Calendar,
  Award,
  GraduationCap,
  Receipt,
  Settings,
  Bell,
  ArrowUpRight,
  ArrowDownLeft,
  Send,
  Landmark,
  Store,
  TrendingDown,
  CalendarCheck,
  Coffee,
} from "lucide-react";

type UIState = "success" | "loading" | "empty";

export function WalletDashboard() {
  const { address, disconnect } = useWallet();
  const [uiState, setUiState] = useState<UIState>("success");

  // Navigation items for the sidebar (desktop)
  const navItems = [
    { label: "Dashboard", icon: LayoutDashboard, href: "#", active: false },
    { label: "Wallet", icon: Wallet, href: "#", active: true },
    { label: "Pay (QR)", icon: QrCode, href: "#", active: false },
    { label: "Marketplace", icon: ShoppingBag, href: "#", active: false },
    { label: "Events", icon: Calendar, href: "#", active: false },
    { label: "Rewards", icon: Award, href: "#", active: false },
    { label: "Scholarships", icon: GraduationCap, href: "#", active: false },
    { label: "Transactions", icon: Receipt, href: "#", active: false },
  ];

  // Mock data for transactions
  const mockTransactions = [
    {
      id: "tx1",
      title: "Campus Bookstore",
      date: "Today, 2:30 PM",
      amount: "-45.50 XLM",
      icon: Store,
    },
    {
      id: "tx2",
      title: "Transfer from Sarah",
      date: "Yesterday, 11:15 AM",
      amount: "+20.00 XLM",
      icon: ArrowDownLeft,
      incoming: true,
    },
    {
      id: "tx3",
      title: "Library Cafe",
      date: "Oct 12, 9:00 AM",
      amount: "-4.20 XLM",
      icon: Coffee,
    },
    {
      id: "tx4",
      title: "Tech Talk Ticket",
      date: "Oct 10, 4:45 PM",
      amount: "-15.00 XLM",
      icon: Calendar,
    },
  ];

  return (
    <div className="flex h-screen w-full bg-background text-foreground overflow-hidden">
      {/* 1. Desktop Sidebar Navigation */}
      <nav className="hidden md:flex flex-col w-64 bg-card border-r border-border h-full fixed left-0 top-0 py-6 px-4 z-40">
        <div className="flex items-center gap-3 mb-8 px-2">
          <div className="w-10 h-10 rounded-full bg-muted flex items-center justify-center font-semibold text-foreground">
            CC
          </div>
          <div>
            <h1 className="text-lg font-bold leading-tight">CampusChain</h1>
            <p className="text-xs text-muted-foreground">Radical Utility</p>
          </div>
        </div>

        <div className="flex-1 space-y-1">
          {navItems.map((item) => {
            const Icon = item.icon;
            return (
              <a
                key={item.label}
                href={item.href}
                className={`flex items-center gap-3 px-3 py-2.5 rounded-lg text-sm transition-all ${
                  item.active
                    ? "bg-secondary text-secondary-foreground font-bold border-r-4 border-primary"
                    : "text-muted-foreground hover:text-foreground hover:bg-secondary/40 font-medium"
                }`}
              >
                <Icon className="h-4 w-4" />
                <span>{item.label}</span>
              </a>
            );
          })}
        </div>

        <div className="border-t border-border pt-4 mt-auto">
          <a
            href="#"
            className="flex items-center gap-3 px-3 py-2.5 rounded-lg text-sm text-muted-foreground hover:text-foreground hover:bg-secondary/40 font-medium transition-all"
          >
            <Settings className="h-4 w-4" />
            <span>Settings</span>
          </a>
        </div>
      </nav>

      {/* Main Content Area */}
      <div className="flex-1 md:ml-64 flex flex-col h-full overflow-hidden">
        {/* 2. Desktop Top Navbar */}
        <header className="hidden md:flex justify-between items-center h-16 border-b border-border bg-card px-6 sticky top-0 z-30 shrink-0">
          <h2 className="text-xl font-bold">Dashboard</h2>
          
          <div className="flex items-center gap-6">
            {/* UI State Control Dropdown */}
            <div className="w-40">
              <Dropdown<UIState>
                options={[
                  { value: "success", label: "State: Success" },
                  { value: "loading", label: "State: Loading" },
                  { value: "empty", label: "State: Empty" },
                ]}
                value={uiState}
                onChange={(val) => setUiState(val)}
              />
            </div>

            <button className="text-muted-foreground hover:text-foreground p-2 rounded-full hover:bg-muted transition-colors relative cursor-pointer">
              <Bell className="h-5 w-5" />
              <span className="absolute top-1.5 right-1.5 w-2 h-2 rounded-full bg-primary" />
            </button>

            <div className="flex items-center gap-3">
              <div className="w-8 h-8 rounded-full bg-muted flex items-center justify-center text-xs font-bold select-none cursor-pointer">
                JD
              </div>
              <button
                onClick={disconnect}
                className="text-xs text-muted-foreground hover:text-destructive transition-colors font-medium cursor-pointer"
              >
                Logout
              </button>
            </div>
          </div>
        </header>

        {/* Responsive Content Container */}
        <main className="flex-1 overflow-y-auto p-4 md:p-6 pb-24 md:pb-6">
          <div className="max-w-5xl mx-auto space-y-6">
            
            {/* MOBILE ONLY: Top Header Bar */}
            <div className="flex md:hidden justify-between items-center py-2 shrink-0">
              <div>
                <h1 className="text-2xl font-bold">Wallet</h1>
                {address && (
                  <p className="text-[10px] text-muted-foreground font-mono mt-0.5 break-all max-w-[200px] select-all">
                    {address}
                  </p>
                )}
              </div>
              <div className="flex items-center gap-2">
                <div className="w-28">
                  <Dropdown<UIState>
                    options={[
                      { value: "success", label: "Success" },
                      { value: "loading", label: "Loading" },
                      { value: "empty", label: "Empty" },
                    ]}
                    value={uiState}
                    onChange={(val) => setUiState(val)}
                  />
                </div>
                <button className="p-2 text-foreground relative">
                  <Bell className="h-5 w-5" />
                  <span className="absolute top-1.5 right-1.5 w-2 h-2 rounded-full bg-primary" />
                </button>
                <div className="w-8 h-8 rounded-full bg-muted flex items-center justify-center text-xs font-bold">
                  JD
                </div>
              </div>
            </div>

            {/* Grid Row: Balance Card & Quick Actions */}
            <div className="grid grid-cols-1 lg:grid-cols-12 gap-6">
              
              {/* Wallet Balance Card */}
              <div className="lg:col-span-8 bg-card border border-border rounded-xl p-6 shadow-sm flex flex-col justify-between min-h-[260px]">
                {uiState === "loading" ? (
                  <div className="space-y-4 w-full">
                    <Skeleton className="h-4 w-28" />
                    <Skeleton className="h-10 w-48" />
                    <Skeleton className="h-6 w-36" />
                  </div>
                ) : (
                  <div>
                    <p className="text-xs font-bold tracking-wider text-muted-foreground uppercase mb-2">
                      Total Balance
                    </p>
                    <div className="flex items-baseline gap-2">
                      <span className="text-3xl md:text-4xl font-bold tracking-tight">
                        {uiState === "empty" ? "0.00" : "1,245.50"}
                      </span>
                      <span className="text-lg text-muted-foreground font-medium">XLM</span>
                    </div>

                    <div className="mt-4 flex flex-wrap gap-2">
                      <div className="px-3 py-1 rounded-full bg-muted text-xs font-medium border border-border">
                        <span className="font-bold text-foreground">
                          {uiState === "empty" ? "0" : "350"}
                        </span>{" "}
                        CAMP Available
                      </div>
                    </div>
                  </div>
                )}

                <div className="flex gap-4 mt-8">
                  <button className="flex-1 bg-primary text-primary-foreground font-semibold py-3 rounded-lg flex items-center justify-center gap-2 hover:bg-primary/90 transition-colors shadow-sm cursor-pointer">
                    <ArrowUpRight className="h-4 w-4" />
                    Send
                  </button>
                  <button className="flex-1 bg-card text-foreground border border-border font-semibold py-3 rounded-lg flex items-center justify-center gap-2 hover:bg-accent transition-colors shadow-sm cursor-pointer">
                    <ArrowDownLeft className="h-4 w-4" />
                    Receive
                  </button>
                </div>
              </div>

              {/* Quick Actions (Responsive Layout adaptions) */}
              <div className="lg:col-span-4 grid grid-cols-4 lg:grid-cols-2 gap-4">
                {[
                  { label: "Scan & Pay", icon: QrCode, subLabel: "Pay" },
                  { label: "Send Money", icon: Send, subLabel: "Swap" },
                  { label: "Buy CAMP", icon: Landmark, subLabel: "History" },
                  { label: "Marketplace", icon: Store, subLabel: "More" },
                ].map((act) => {
                  const Icon = act.icon;
                  return (
                    <button
                      key={act.label}
                      className="bg-card rounded-xl p-4 border border-border hover:border-foreground hover:shadow-md transition-all flex flex-col items-center justify-center gap-2.5 text-center cursor-pointer group"
                    >
                      <div className="w-12 h-12 rounded-full bg-muted group-hover:bg-primary group-hover:text-primary-foreground flex items-center justify-center transition-colors">
                        <Icon className="h-5 w-5" />
                      </div>
                      {/* Desktop labels vs mobile short labels */}
                      <span className="hidden md:inline text-xs font-semibold text-foreground">
                        {act.label}
                      </span>
                      <span className="inline md:hidden text-xs font-medium text-muted-foreground">
                        {act.subLabel}
                      </span>
                    </button>
                  );
                })}
              </div>
            </div>

            {/* Stats Cards Row */}
            <div className="grid grid-cols-1 md:grid-cols-3 gap-6">
              {[
                {
                  label: "Total spent this month",
                  value: "450.00 XLM",
                  emptyVal: "0.00 XLM",
                  icon: TrendingDown,
                },
                {
                  label: "CAMP Earned",
                  value: "+120 CAMP",
                  emptyVal: "+0 CAMP",
                  icon: Award,
                },
                {
                  label: "Events Attended",
                  value: "4",
                  emptyVal: "0",
                  icon: CalendarCheck,
                },
              ].map((stat) => {
                const Icon = stat.icon;
                return (
                  <div
                    key={stat.label}
                    className="bg-card rounded-xl p-4 border border-border shadow-sm flex items-center justify-between"
                  >
                    {uiState === "loading" ? (
                      <div className="space-y-2 flex-1">
                        <Skeleton className="h-3 w-28" />
                        <Skeleton className="h-6 w-20" />
                      </div>
                    ) : (
                      <div>
                        <p className="text-xs text-muted-foreground mb-1">{stat.label}</p>
                        <p className="text-lg font-bold">
                          {uiState === "empty" ? stat.emptyVal : stat.value}
                        </p>
                      </div>
                    )}
                    <div className="w-10 h-10 rounded-full bg-muted flex items-center justify-center text-muted-foreground shrink-0">
                      <Icon className="h-5 w-5" />
                    </div>
                  </div>
                );
              })}
            </div>

            {/* Recent Transactions Section */}
            <div className="bg-card rounded-xl border border-border shadow-sm overflow-hidden">
              <div className="p-4 md:p-6 border-b border-border flex justify-between items-center">
                <h3 className="text-lg font-bold">Recent Transactions</h3>
                <button className="text-xs font-semibold text-muted-foreground hover:text-foreground transition-colors cursor-pointer">
                  View All
                </button>
              </div>

              {uiState === "loading" ? (
                <div className="divide-y divide-border">
                  {[1, 2, 3, 4].map((i) => (
                    <div key={i} className="p-4 flex items-center justify-between">
                      <div className="flex items-center gap-4">
                        <Skeleton className="w-10 h-10 rounded-full" />
                        <div className="space-y-2">
                          <Skeleton className="h-4 w-32" />
                          <Skeleton className="h-3 w-20" />
                        </div>
                      </div>
                      <Skeleton className="h-4 w-16" />
                    </div>
                  ))}
                </div>
              ) : uiState === "empty" ? (
                <div className="p-12 text-center flex flex-col items-center justify-center gap-2">
                  <Receipt className="h-10 w-10 text-muted-foreground/50" />
                  <p className="text-sm font-semibold text-muted-foreground">
                    No transactions found
                  </p>
                  <p className="text-xs text-muted-foreground/75">
                    Your transactions will appear here once you perform activity.
                  </p>
                </div>
              ) : (
                <div className="divide-y divide-border">
                  {mockTransactions.map((tx) => {
                    const TxIcon = tx.icon;
                    return (
                      <div
                        key={tx.id}
                        className="p-4 flex items-center justify-between hover:bg-muted/40 transition-colors"
                      >
                        <div className="flex items-center gap-4">
                          <div className="w-10 h-10 rounded-full bg-muted flex items-center justify-center text-foreground shrink-0">
                            <TxIcon className="h-5 w-5" />
                          </div>
                          <div>
                            <p className="text-sm font-bold text-foreground">{tx.title}</p>
                            <p className="text-xs text-muted-foreground">{tx.date}</p>
                          </div>
                        </div>
                        <div className="text-right">
                          <p
                            className={`text-sm font-bold ${
                              tx.incoming ? "text-muted-foreground" : "text-foreground"
                            }`}
                          >
                            {tx.amount}
                          </p>
                        </div>
                      </div>
                    );
                  })}
                </div>
              )}
            </div>

          </div>
        </main>
      </div>

      {/* 3. Mobile Bottom Navigation Bar */}
      <nav className="fixed bottom-0 left-0 right-0 h-20 bg-card border-t border-border z-40 md:hidden shadow-lg">
        <div className="flex justify-around items-center h-full px-2">
          {[
            { label: "Dashboard", icon: LayoutDashboard, active: false },
            { label: "Wallet", icon: Wallet, active: true },
            { label: "Pay", icon: QrCode, active: false },
            { label: "Market", icon: ShoppingBag, active: false },
            { label: "Settings", icon: Settings, active: false },
          ].map((item) => {
            const Icon = item.icon;
            return (
              <button
                key={item.label}
                className={`flex flex-col items-center justify-center w-16 py-2.5 transition-all cursor-pointer ${
                  item.active ? "text-foreground font-bold scale-105" : "text-muted-foreground hover:text-foreground"
                }`}
              >
                <Icon className="h-5 w-5 mb-0.5" />
                <span className="text-[10px] tracking-wide">{item.label}</span>
              </button>
            );
          })}
        </div>
      </nav>
    </div>
  );
}
