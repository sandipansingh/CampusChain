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
  ShieldAlert,
} from "lucide-react";

// Import hooks
import { useCampusBalance, useCampusUserRole } from "@/features/wallet/hooks/useWallet";
import { useLedgerEvents } from "@/features/transactions/hooks/useTransactions";

// Import sub-screens
import { SendReceive } from "./SendReceive";
import { ScanPay } from "./ScanPay";
import { Settings as SettingsView } from "./Settings";
import { MarketplaceGrid } from "@/features/marketplace/ui/MarketplaceGrid";
import { MarketplaceDetail } from "@/features/marketplace/ui/MarketplaceDetail";
import { MarketplaceSell } from "@/features/marketplace/ui/MarketplaceSell";
import { Events } from "@/features/events/ui/Events";
import { Rewards } from "@/features/rewards/ui/Rewards";
import { Scholarships } from "@/features/scholarships/ui/Scholarships";
import { TransactionHistory } from "@/features/transactions/ui/TransactionHistory";
import { MerchantDashboard } from "@/features/transactions/ui/MerchantDashboard";
import { AdminDashboard } from "@/features/transactions/ui/AdminDashboard";

type UIState = "success" | "loading" | "empty";

export function WalletDashboard() {
  const { address, disconnect } = useWallet();
  const [uiState, setUiState] = useState<UIState>("success");
  
  // Navigation active state
  const [activeTab, setActiveTab] = useState<string>("dashboard");
  
  // Marketplace sub-views state
  const [selectedListingId, setSelectedListingId] = useState<number | null>(null);
  const [showSellForm, setShowSellForm] = useState(false);

  // Fetch real on-chain details
  const { data: campBalance, isLoading: isBalanceLoading } = useCampusBalance(address);
  const { data: userRole } = useCampusUserRole(address);
  const { data: ledgerEvents, isLoading: isEventsLoading } = useLedgerEvents();

  // Navigation items for the sidebar (desktop)
  const navItems: { value: string; label: string; icon: React.ComponentType<React.SVGProps<SVGSVGElement>> }[] = [
    { value: "dashboard", label: "Dashboard", icon: LayoutDashboard },
    { value: "wallet", label: "Wallet", icon: Wallet },
    { value: "pay", label: "Pay (QR)", icon: QrCode },
    { value: "marketplace", label: "Marketplace", icon: ShoppingBag },
    { value: "events", label: "Events", icon: Calendar },
    { value: "rewards", label: "Rewards", icon: Award },
    { value: "scholarships", label: "Scholarships", icon: GraduationCap },
    { value: "transactions", label: "Transactions", icon: Receipt },
  ];

  if (userRole === 2 || userRole === 4) {
    navItems.push({ value: "merchant", label: "Merchant Hub", icon: Store });
  }
  if (userRole === 4) {
    navItems.push({ value: "admin", label: "Admin Hub", icon: ShieldAlert });
  }

  const renderContentView = () => {
    switch (activeTab) {
      case "wallet":
        return <SendReceive />;
      case "pay":
        return <ScanPay />;
      case "marketplace":
        if (showSellForm) {
          return <MarketplaceSell onBack={() => setShowSellForm(false)} />;
        }
        if (selectedListingId !== null) {
          return <MarketplaceDetail listingId={selectedListingId} onBack={() => setSelectedListingId(null)} />;
        }
        return (
          <MarketplaceGrid
            onSelectItem={(id) => setSelectedListingId(Number(id))}
            onSellItem={() => setShowSellForm(true)}
          />
        );
      case "events":
        return <Events />;
      case "rewards":
        return <Rewards />;
      case "scholarships":
        return <Scholarships />;
      case "transactions":
        return <TransactionHistory />;
      case "settings":
        return <SettingsView />;
      case "merchant":
        return <MerchantDashboard />;
      case "admin":
        return <AdminDashboard />;
      case "dashboard":
      default:
        return renderHomeDashboard();
    }
  };

  const renderHomeDashboard = () => {
    return (
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
            {isBalanceLoading || uiState === "loading" ? (
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
                    {uiState === "empty" ? "0.00" : (campBalance !== undefined ? campBalance.toLocaleString(undefined, { minimumFractionDigits: 2, maximumFractionDigits: 2 }) : "1,245.50")}
                  </span>
                  <span className="text-lg text-muted-foreground font-medium">CAMP</span>
                </div>

                <div className="mt-4 flex flex-wrap gap-2">
                  <div className="px-3 py-1 rounded-full bg-muted text-xs font-medium border border-border">
                    <span className="font-bold text-foreground">
                      {uiState === "empty" ? "0" : "Stellar Testnet"}
                    </span>{" "}
                    Network Connected
                  </div>
                </div>
              </div>
            )}

            <div className="flex gap-4 mt-8">
              <button
                onClick={() => setActiveTab("wallet")}
                className="flex-1 bg-primary text-primary-foreground font-semibold py-3 rounded-lg flex items-center justify-center gap-2 hover:bg-primary/90 transition-colors shadow-sm cursor-pointer"
              >
                <ArrowUpRight className="h-4 w-4" />
                Send
              </button>
              <button
                onClick={() => setActiveTab("wallet")}
                className="flex-1 bg-card text-foreground border border-border font-semibold py-3 rounded-lg flex items-center justify-center gap-2 hover:bg-accent transition-colors shadow-sm cursor-pointer"
              >
                <ArrowDownLeft className="h-4 w-4" />
                Receive
              </button>
            </div>
          </div>

          {/* Quick Actions */}
          <div className="lg:col-span-4 grid grid-cols-4 lg:grid-cols-2 gap-4">
            {[
              { label: "Scan & Pay", icon: QrCode, target: "pay" },
              { label: "Send Money", icon: Send, target: "wallet" },
              { label: "Rewards Hub", icon: Landmark, target: "rewards" },
              { label: "Marketplace", icon: Store, target: "marketplace" },
            ].map((act) => {
              const Icon = act.icon;
              return (
                <button
                  key={act.label}
                  onClick={() => setActiveTab(act.target)}
                  className="bg-card rounded-xl p-4 border border-border hover:border-foreground hover:shadow-md transition-all flex flex-col items-center justify-center gap-2.5 text-center cursor-pointer group"
                >
                  <div className="w-12 h-12 rounded-full bg-muted group-hover:bg-primary group-hover:text-primary-foreground flex items-center justify-center transition-colors">
                    <Icon className="h-5 w-5" />
                  </div>
                  <span className="text-xs font-semibold text-foreground">
                    {act.label}
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
              label: "Role Permission",
              value: userRole === 4 ? "Administrator" : userRole === 2 ? "Merchant" : "Student / Member",
              emptyVal: "Student",
              icon: TrendingDown,
            },
            {
              label: "CAMP Balance",
              value: `${campBalance || 0} CAMP`,
              emptyVal: "0 CAMP",
              icon: Award,
            },
            {
              label: "On-Chain Activity Logs",
              value: ledgerEvents ? `${ledgerEvents.length} recorded` : "0 logged",
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
                {isBalanceLoading || uiState === "loading" ? (
                  <div className="space-y-2 flex-1">
                    <Skeleton className="h-3 w-28" />
                    <Skeleton className="h-6 w-20" />
                  </div>
                ) : (
                  <div>
                    <p className="text-xs text-muted-foreground mb-1">{stat.label}</p>
                    <p className="text-sm font-bold">
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
            <h3 className="text-base font-bold">Recent Activity Feed</h3>
            <button
              onClick={() => setActiveTab("transactions")}
              className="text-xs font-semibold text-muted-foreground hover:text-foreground transition-colors cursor-pointer"
            >
              View All
            </button>
          </div>

          {isEventsLoading || uiState === "loading" ? (
            <div className="divide-y divide-border">
              {[1, 2, 3].map((i) => (
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
          ) : uiState === "empty" || !ledgerEvents || ledgerEvents.length === 0 ? (
            <div className="p-12 text-center flex flex-col items-center justify-center gap-2">
              <Receipt className="h-10 w-10 text-muted-foreground/50" />
              <p className="text-sm font-semibold text-muted-foreground">
                No ledger activity found
              </p>
              <p className="text-xs text-muted-foreground/75">
                Your activities will appear here once you invoke Soroban transactions.
              </p>
            </div>
          ) : (
            <div className="divide-y divide-border">
              {ledgerEvents.slice(0, 5).map((evt) => (
                <div
                  key={evt.id}
                  className="p-4 flex items-center justify-between hover:bg-muted/40 transition-colors text-xs"
                >
                  <div className="flex items-center gap-4 min-w-0">
                    <div className="w-10 h-10 rounded-full bg-muted flex items-center justify-center text-foreground shrink-0">
                      <Receipt className="h-5 w-5" />
                    </div>
                    <div className="min-w-0">
                      <p className="font-bold text-foreground truncate">{evt.title}</p>
                      <p className="text-muted-foreground truncate">{evt.message}</p>
                    </div>
                  </div>
                  <div className="text-right shrink-0">
                    <p className="font-bold text-foreground">{evt.details}</p>
                    <p className="text-[10px] text-muted-foreground mt-0.5">{evt.timestamp}</p>
                  </div>
                </div>
              ))}
            </div>
          )}
        </div>
      </div>
    );
  };

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
            const isActive = activeTab === item.value;
            return (
              <button
                key={item.value}
                onClick={() => {
                  setActiveTab(item.value);
                  setSelectedListingId(null);
                  setShowSellForm(false);
                }}
                className={`w-full flex items-center gap-3 px-3 py-2.5 rounded-lg text-sm transition-all text-left cursor-pointer ${
                  isActive
                    ? "bg-secondary text-secondary-foreground font-bold border-r-4 border-primary"
                    : "text-muted-foreground hover:text-foreground hover:bg-secondary/40 font-medium"
                }`}
              >
                <Icon className="h-4 w-4" />
                <span>{item.label}</span>
              </button>
            );
          })}
        </div>

        <div className="border-t border-border pt-4 mt-auto">
          <button
            onClick={() => setActiveTab("settings")}
            className={`w-full flex items-center gap-3 px-3 py-2.5 rounded-lg text-sm text-left transition-all cursor-pointer ${
              activeTab === "settings"
                ? "bg-secondary text-secondary-foreground font-bold border-r-4 border-primary"
                : "text-muted-foreground hover:text-foreground hover:bg-secondary/40 font-medium"
            }`}
          >
            <Settings className="h-4 w-4" />
            <span>Settings</span>
          </button>
        </div>
      </nav>

      {/* Main Content Area */}
      <div className="flex-1 md:ml-64 flex flex-col h-full overflow-hidden">
        {/* 2. Desktop Top Navbar */}
        <header className="hidden md:flex justify-between items-center h-16 border-b border-border bg-card px-6 sticky top-0 z-30 shrink-0">
          <h2 className="text-xl font-bold capitalize">{activeTab}</h2>
          
          <div className="flex items-center gap-6">
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
          {renderContentView()}
        </main>
      </div>

      {/* 3. Mobile Bottom Navigation Bar */}
      <nav className="fixed bottom-0 left-0 right-0 h-20 bg-card border-t border-border z-40 md:hidden shadow-lg">
        <div className="flex justify-around items-center h-full px-2">
          {[
            { value: "dashboard", label: "Dashboard", icon: LayoutDashboard },
            { value: "wallet", label: "Wallet", icon: Wallet },
            { value: "pay", label: "Pay", icon: QrCode },
            { value: "marketplace", label: "Market", icon: ShoppingBag },
            { value: "settings", label: "Settings", icon: Settings },
          ].map((item) => {
            const Icon = item.icon;
            const isActive = activeTab === item.value;
            return (
              <button
                key={item.value}
                onClick={() => {
                  setActiveTab(item.value);
                  setSelectedListingId(null);
                  setShowSellForm(false);
                }}
                className={`flex flex-col items-center justify-center w-16 py-2.5 transition-all cursor-pointer ${
                  isActive ? "text-foreground font-bold scale-105" : "text-muted-foreground hover:text-foreground"
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
export default WalletDashboard;
