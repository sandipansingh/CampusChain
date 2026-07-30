"use client";

import { useState } from "react";
import { useWallet } from "@/shared/stellar/useWallet";
import { Skeleton } from "@/shared/ui/Skeleton";
import { ActivityFeedPanel } from "@/shared/ui/ActivityFeedPanel";
import { useActivityFeedStore } from "@/shared/hooks/useActivityFeedStore";
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
  User,
  CalendarCheck,
  ShieldAlert,
  Coffee,
  ClipboardList,
} from "lucide-react";

// Import hooks
import { useCampusBalance, useCampusProfile, useCampusUserRole } from "@/features/wallet/hooks/useWallet";
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
import { MenuManagement } from "@/features/food-ordering/ui/MenuManagement";
import { StudentOrdering } from "@/features/food-ordering/ui/StudentOrdering";
import { OrderTracking } from "@/features/food-ordering/ui/OrderTracking";

export function WalletDashboard() {
  const { address, disconnect } = useWallet();

  // Navigation active state
  const [activeTab, setActiveTab] = useState<string>("dashboard");

  // Activity Feed panel state
  const [isFeedOpen, setIsFeedOpen] = useState(false);
  const unreadCount = useActivityFeedStore((s) => s.unreadCount);

  // Marketplace sub-views state
  const [selectedListingId, setSelectedListingId] = useState<number | null>(null);
  const [showSellForm, setShowSellForm] = useState(false);

  // Fetch real on-chain details
  const { data: campBalance, isLoading: isBalanceLoading } = useCampusBalance(address);
  const { data: userRole } = useCampusUserRole(address);
  const { data: profile } = useCampusProfile(address);
  const { data: ledgerEvents, isLoading: isEventsLoading } = useLedgerEvents();

  // isLocked is true if profile verification is not Approved (status 2).
  // Updates live via on-chain ProfileVerified / ProfileRejected events invalidating the 'campus-profile' query cache.
  const isLocked = profile ? profile.verificationStatus !== 2 : false;

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

  const isFoodMerchant = profile?.role === 2 && (
    profile.details?.category === "FoodCanteen" ||
    profile.details?.category === 2 ||
    String(profile.details?.category).toLowerCase() === "foodcanteen"
  );

  if (userRole === 1) {
    navItems.push({ value: "canteen", label: "Campus Canteen", icon: Coffee });
    navItems.push({ value: "my-orders", label: "My Orders", icon: ClipboardList });
  }

  if (userRole === 2) {
    navItems.push({ value: "merchant", label: "Merchant Hub", icon: Store });
    if (isFoodMerchant) {
      navItems.push({ value: "menu-management", label: "Menu Management", icon: Settings });
      navItems.push({ value: "incoming-orders", label: "Incoming Orders", icon: ClipboardList });
    }
  }

  const navItemsToShow = isLocked ? [] : navItems;

  const LockedStateView = () => {
    const isRejected = profile?.verificationStatus === 3;
    return (
      <div className="flex flex-col items-center justify-center min-h-[50vh] text-center p-6 bg-card border border-border rounded-xl space-y-4 max-w-md mx-auto mt-12 shadow-sm">
        <div className="w-12 h-12 rounded-full bg-red-50 border border-red-200 flex items-center justify-center text-red-600">
          <ShieldAlert className="h-6 w-6 animate-pulse" />
        </div>
        <h3 className="text-xl font-bold text-foreground">
          {isRejected ? "Verification Rejected" : "Verification Pending"}
        </h3>
        <p className="text-sm text-muted-foreground leading-relaxed font-normal">
          {isRejected
            ? "Your identity profile verification was rejected by your University Administrator. All transactions and wallet services are locked."
            : "Your identity profile is currently pending verification by your University Administrator. Wallet and campus features will unlock automatically once approved."}
        </p>
      </div>
    );
  };

  const renderContentView = () => {
    if (isLocked && activeTab !== "settings") {
      return <LockedStateView />;
    }
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
      case "merchant":
        return <MerchantDashboard />;
      case "canteen":
        return <StudentOrdering />;
      case "my-orders":
        return <OrderTracking isMerchant={false} />;
      case "menu-management":
        return <MenuManagement />;
      case "incoming-orders":
        return <OrderTracking isMerchant={true} />;
      case "settings":
        return <SettingsView />;
      case "dashboard":
      default:
        return (
          <div className="space-y-6">
            {/* Header section with Balance and Quick Actions */}
            <div className="grid grid-cols-1 lg:grid-cols-12 gap-6 items-stretch">
              {/* Balance card */}
              <div className="lg:col-span-8 bg-card rounded-xl p-6 border border-border shadow-sm flex flex-col justify-between relative overflow-hidden">
                <div className="absolute top-0 right-0 w-32 h-32 bg-primary/5 rounded-full blur-2xl -mr-16 -mt-16"></div>
                <div>
                  <span className="text-xs font-bold uppercase tracking-wider text-muted-foreground">
                    Wallet Balance
                  </span>
                  {isBalanceLoading ? (
                    <Skeleton className="h-10 w-44 mt-2" />
                  ) : (
                    <h3 className="text-3xl font-extrabold text-foreground mt-2 tracking-tight">
                      {campBalance?.toLocaleString() || 0} <span className="text-lg font-medium text-muted-foreground">CAMP</span>
                    </h3>
                  )}
                </div>
                <div className="flex gap-3 mt-8">
                  <button
                    onClick={() => setActiveTab("wallet")}
                    className="flex-1 bg-zinc-950 hover:bg-zinc-800 text-white font-semibold rounded-lg py-2.5 px-4 text-xs flex items-center justify-center gap-1.5 transition-colors cursor-pointer"
                  >
                    <ArrowUpRight className="h-4 w-4" />
                    Send
                  </button>
                  <button
                    onClick={() => setActiveTab("wallet")}
                    className="flex-1 bg-muted hover:bg-muted/80 text-foreground font-semibold rounded-lg py-2.5 px-4 text-xs flex items-center justify-center gap-1.5 transition-all border border-border cursor-pointer"
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
                  icon: User,
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
                    {isBalanceLoading ? (
                      <div className="space-y-2 flex-1">
                        <Skeleton className="h-3 w-28" />
                        <Skeleton className="h-6 w-20" />
                      </div>
                    ) : (
                      <div>
                        <p className="text-xs text-muted-foreground mb-1">{stat.label}</p>
                        <p className="text-sm font-bold">{stat.value}</p>
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

              {isEventsLoading ? (
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
              ) : !ledgerEvents || ledgerEvents.length === 0 ? (
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
    }
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
          {navItemsToShow.map((item) => {
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
                    ? "text-foreground font-bold border-l-2 border-foreground rounded-none"
                    : "text-muted-foreground hover:text-foreground font-medium"
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
                ? "text-foreground font-bold border-l-2 border-foreground rounded-none"
                : "text-muted-foreground hover:text-foreground font-medium"
            }`}
          >
            <Settings className="h-4 w-4" />
            <span>Settings</span>
          </button>
        </div>
      </nav>

      {/* Main Content Area */}
      <div className="flex-1 md:ml-64 flex flex-col h-full overflow-hidden">
        {/* 2. Top Navbar (Responsive) */}
        <header className="flex justify-between items-center h-16 border-b border-border bg-card px-4 md:px-6 sticky top-0 z-30 shrink-0">
          <h2 className="text-lg md:text-xl font-bold capitalize">{activeTab}</h2>
          
          <div className="flex items-center gap-3 md:gap-6">
            <button
              onClick={() => setIsFeedOpen(true)}
              className="text-muted-foreground hover:text-foreground p-2 rounded-full hover:bg-muted transition-colors relative cursor-pointer"
              aria-label="Open activity feed"
            >
              <Bell className="h-5 w-5" />
              {unreadCount > 0 && (
                <span className="absolute -top-0.5 -right-0.5 min-w-[18px] h-[18px] rounded-full bg-primary text-primary-foreground text-[9px] font-bold flex items-center justify-center px-1">
                  {unreadCount > 99 ? "99" : unreadCount}
                </span>
              )}
            </button>

            <div className="flex items-center gap-2 md:gap-3">
              <ProfileAvatar profileName={profile?.fullName} address={address} />
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

      {/* Activity Feed Panel */}
      <ActivityFeedPanel isOpen={isFeedOpen} onClose={() => setIsFeedOpen(false)} />

      {/* 3. Mobile Bottom Navigation Bar */}
      <nav className="fixed bottom-0 left-0 right-0 h-20 bg-card border-t border-border z-40 md:hidden shadow-lg">
        <div className="flex justify-around items-center h-full px-2">
          {(isLocked
            ? [{ value: "settings", label: "Settings", icon: Settings }]
            : [
                { value: "dashboard", label: "Dashboard", icon: LayoutDashboard },
                { value: "wallet", label: "Wallet", icon: Wallet },
                { value: "pay", label: "Pay", icon: QrCode },
                { value: "marketplace", label: "Market", icon: ShoppingBag },
                { value: "settings", label: "Settings", icon: Settings },
              ]
          ).map((item) => {
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
                  isActive ? "text-foreground font-bold" : "text-muted-foreground hover:text-foreground"
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

function ProfileAvatar({ profileName, address }: { profileName?: string; address: string | null }) {
  const initials = profileName?.trim().split(/\s+/).filter(Boolean).slice(0, 2).map((name) => name[0]).join("").toUpperCase()
    || (address ? `${address.slice(0, 2)}${address.slice(-2)}` : "?");
  const title = profileName || address || "Wallet not connected";
  return <div className="w-8 h-8 rounded-full bg-muted flex items-center justify-center text-xs font-bold select-none shrink-0" title={title} aria-label={title}>{initials}</div>;
}
