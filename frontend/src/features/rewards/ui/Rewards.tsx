"use client";

import { useState } from "react";
import { useWallet } from "@/shared/stellar/useWallet";
import { Skeleton } from "@/shared/ui/Skeleton";
import { Dropdown } from "@/shared/ui/Dropdown";
import {
  LayoutDashboard,
  Wallet,
  Coins,
  Store,
  Calendar,
  Award,
  GraduationCap,
  Receipt,
  Settings,
  ArrowUpDown,
  Info,
  Trophy,
  UserCheck,
  HeartHandshake,
  Utensils,
  BookOpen,
  Printer,
  Dumbbell,
  Gift,
} from "lucide-react";

type RewardsState = "success" | "loading" | "empty";

interface EarningItem {
  id: string;
  title: string;
  date: string;
  amount: string;
  icon: React.ComponentType<React.SVGProps<SVGSVGElement>>;
}

interface RewardItem {
  id: string;
  title: string;
  description: string;
  cost: string;
  icon: React.ComponentType<React.SVGProps<SVGSVGElement>>;
}

const mockEarnings: EarningItem[] = [
  { id: "ern1", title: "Hackathon Winner", date: "Oct 24, 2023", amount: "+1,500 CAMP", icon: Trophy },
  { id: "ern2", title: "Tech Talk Attendance", date: "Oct 20, 2023", amount: "+250 CAMP", icon: UserCheck },
  { id: "ern3", title: "Peer Mentorship", date: "Oct 15, 2023", amount: "+500 CAMP", icon: HeartHandshake },
];

const mockRewards: RewardItem[] = [
  { id: "rwd1", title: "Cafeteria Discount", description: "20% off any meal at the main dining hall.", cost: "500 CAMP", icon: Utensils },
  { id: "rwd2", title: "Bookstore Voucher", description: "$15 credit towards supplies or apparel.", cost: "1,200 CAMP", icon: BookOpen },
  { id: "rwd3", title: "Print Credits", description: "100 pages of black and white printing at library hubs.", cost: "200 CAMP", icon: Printer },
  { id: "rwd4", title: "Gym Guest Pass", description: "One day access for a non-student guest.", cost: "800 CAMP", icon: Dumbbell },
];

export function Rewards() {
  const { disconnect } = useWallet();
  const [rewardsState, setRewardsState] = useState<RewardsState>("success");
  const [showConverter, setShowConverter] = useState(false);
  const [xlmAmount, setXlmAmount] = useState("");

  // Rate: 1 XLM = 100 CAMP
  const campCalculated = xlmAmount ? Math.floor(parseFloat(xlmAmount) * 100).toString() : "0";

  // Navigation items for the sidebar (desktop)
  const navItems = [
    { label: "Dashboard", icon: LayoutDashboard, href: "#", active: false },
    { label: "Wallet", icon: Wallet, href: "#", active: false },
    { label: "Pay (QR)", icon: Coins, href: "#", active: false },
    { label: "Marketplace", icon: Store, href: "#", active: false },
    { label: "Events", icon: Calendar, href: "#", active: false },
    { label: "Rewards", icon: Award, href: "#", active: true },
    { label: "Scholarships", icon: GraduationCap, href: "#", active: false },
    { label: "Transactions", icon: Receipt, href: "#", active: false },
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
        {/* 2. Top Navbar */}
        <header className="hidden md:flex justify-between items-center h-16 border-b border-border bg-card px-6 sticky top-0 z-30 shrink-0">
          <h2 className="text-xl font-bold">Rewards</h2>

          <div className="flex items-center gap-6">
            {/* UI State Control Dropdown */}
            <div className="w-40">
              <Dropdown<RewardsState>
                options={[
                  { value: "success", label: "State: Success" },
                  { value: "loading", label: "State: Loading" },
                  { value: "empty", label: "State: Empty" },
                ]}
                value={rewardsState}
                onChange={(val) => setRewardsState(val)}
              />
            </div>

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

        {/* Content Viewport */}
        <main className="flex-grow overflow-y-auto p-4 md:p-6 pb-24 md:pb-6 relative h-full">
          <div className="max-w-6xl mx-auto space-y-6">

            {/* MOBILE ONLY: Top Header */}
            <div className="flex md:hidden justify-between items-center py-2 shrink-0">
              <div>
                <h1 className="text-2xl font-bold">Rewards</h1>
              </div>
              <div className="flex items-center gap-2">
                <div className="w-28">
                  <Dropdown<RewardsState>
                    options={[
                      { value: "success", label: "Success" },
                      { value: "loading", label: "Loading" },
                      { value: "empty", label: "Empty" },
                    ]}
                    value={rewardsState}
                    onChange={(val) => setRewardsState(val)}
                  />
                </div>
                <div className="w-8 h-8 rounded-full bg-muted flex items-center justify-center text-xs font-bold">
                  JD
                </div>
              </div>
            </div>

            {/* Main split grid */}
            <div className="grid grid-cols-1 lg:grid-cols-12 gap-6 items-start">
              
              {/* Left Column: Balance & Convert */}
              <div className="lg:col-span-5 flex flex-col gap-6">
                
                {/* Balance Card */}
                {rewardsState === "loading" ? (
                  <div className="bg-card border border-border p-6 rounded-2xl space-y-4">
                    <Skeleton className="h-4 w-28" />
                    <Skeleton className="h-10 w-44" />
                    <Skeleton className="h-4 w-24" />
                  </div>
                ) : (
                  <div className="bg-card border border-border p-6 rounded-2xl shadow-sm">
                    <h3 className="text-xs font-bold text-muted-foreground uppercase tracking-wider mb-2">
                      Available Balance
                    </h3>
                    <div className="flex items-baseline gap-2 mb-1">
                      <span className="text-3xl font-black tracking-tight">4,250</span>
                      <span className="text-sm font-bold text-muted-foreground">CAMP</span>
                    </div>
                    <p className="text-xs text-muted-foreground mb-6">≈ 42.50 XLM</p>

                    <div className="bg-muted/50 border border-border rounded-lg p-3 flex justify-between items-center mb-4 text-xs">
                      <span className="text-muted-foreground flex items-center gap-1">
                        <Info className="h-4 w-4" />
                        <span>Swap Rate</span>
                      </span>
                      <span className="font-bold text-foreground">1 XLM = 100 CAMP</span>
                    </div>

                    <button
                      onClick={() => setShowConverter(!showConverter)}
                      className={`w-full h-11 bg-primary text-primary-foreground font-semibold rounded-lg flex items-center justify-center gap-2 hover:bg-primary/95 transition-all cursor-pointer ${
                        showConverter ? "opacity-75" : ""
                      }`}
                    >
                      <ArrowUpDown className="h-4 w-4" />
                      <span>Convert Tokens</span>
                    </button>

                    {/* Converter Panel */}
                    {showConverter && (
                      <div className="mt-4 pt-4 border-t border-border space-y-4 animate-in slide-in-from-top-2 duration-200">
                        <div className="space-y-3">
                          <div>
                            <label className="block text-[10px] uppercase font-bold tracking-wider text-muted-foreground mb-1">
                              From XLM
                            </label>
                            <div className="relative">
                              <input
                                type="number"
                                value={xlmAmount}
                                onChange={(e) => setXlmAmount(e.target.value)}
                                placeholder="0.00"
                                className="w-full h-10 px-3 bg-card border border-border rounded-lg text-sm placeholder:text-muted-foreground/60 focus:border-foreground focus:ring-1 focus:ring-foreground focus:outline-none"
                              />
                              <span className="absolute right-3 top-1/2 -translate-y-1/2 text-xs font-bold text-muted-foreground">
                                XLM
                              </span>
                            </div>
                          </div>

                          <div className="flex justify-center -my-2.5 z-10 relative">
                            <div className="bg-card border border-border rounded-full p-1.5 text-muted-foreground shadow-sm">
                              <ArrowUpDown className="h-4 w-4" />
                            </div>
                          </div>

                          <div>
                            <label className="block text-[10px] uppercase font-bold tracking-wider text-muted-foreground mb-1">
                              To CAMP
                            </label>
                            <div className="relative font-mono">
                              <input
                                type="text"
                                value={campCalculated}
                                readOnly
                                className="w-full h-10 px-3 bg-muted/65 border border-border rounded-lg text-sm focus:outline-none select-none text-muted-foreground font-semibold"
                              />
                              <span className="absolute right-3 top-1/2 -translate-y-1/2 text-xs font-bold text-muted-foreground">
                                CAMP
                              </span>
                            </div>
                          </div>

                          <button className="w-full h-10 border border-border bg-card hover:bg-accent text-foreground font-semibold rounded-lg text-xs transition-colors mt-2 cursor-pointer">
                            Confirm Swap
                          </button>
                        </div>
                      </div>
                    )}
                  </div>
                )}

                {/* Earn History */}
                <div className="bg-card border border-border p-6 rounded-2xl shadow-sm">
                  <div className="flex justify-between items-center mb-5">
                    <h3 className="text-sm font-bold text-foreground">Recent Earnings</h3>
                    <button className="text-[10px] font-bold uppercase tracking-wider text-muted-foreground hover:text-foreground cursor-pointer">
                      View All
                    </button>
                  </div>

                  {rewardsState === "loading" ? (
                    <div className="space-y-4">
                      {[1, 2].map((i) => (
                        <div key={i} className="flex gap-3">
                          <Skeleton className="w-9 h-9 rounded-full" />
                          <div className="space-y-1.5 flex-1">
                            <Skeleton className="h-4 w-28" />
                            <Skeleton className="h-3 w-16" />
                          </div>
                        </div>
                      ))}
                    </div>
                  ) : (
                    <div className="divide-y divide-border">
                      {mockEarnings.map((item) => {
                        const Icon = item.icon;
                        return (
                          <div key={item.id} className="flex justify-between items-center py-3 first:pt-0 last:pb-0">
                            <div className="flex items-center gap-3">
                              <div className="w-9 h-9 bg-muted rounded-full flex items-center justify-center text-foreground shrink-0 select-none">
                                <Icon className="h-4.5 w-4.5" />
                              </div>
                              <div>
                                <p className="text-xs font-bold text-foreground leading-snug">{item.title}</p>
                                <p className="text-[10px] text-muted-foreground mt-0.5">{item.date}</p>
                              </div>
                            </div>
                            <span className="text-xs font-bold text-foreground">{item.amount}</span>
                          </div>
                        );
                      })}
                    </div>
                  )}
                </div>

              </div>

              {/* Right Column: Redeem Rewards grid */}
              <div className="lg:col-span-7 flex flex-col gap-4">
                <div>
                  <h3 className="text-base font-bold text-foreground">Redeem Rewards</h3>
                  <p className="text-xs text-muted-foreground mt-0.5">
                    Exchange your CAMP tokens for various campus utilities.
                  </p>
                </div>

                {rewardsState === "loading" ? (
                  <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
                    {[1, 2].map((i) => (
                      <div key={i} className="bg-card border border-border p-5 rounded-2xl space-y-3">
                        <Skeleton className="w-10 h-10 rounded-lg" />
                        <Skeleton className="h-4 w-28" />
                        <Skeleton className="h-10 w-full" />
                      </div>
                    ))}
                  </div>
                ) : rewardsState === "empty" ? (
                  <div className="p-16 border border-border rounded-2xl bg-card text-center flex flex-col items-center justify-center gap-3 shadow-sm">
                    <Gift className="h-12 w-12 text-muted-foreground/50" />
                    <h3 className="text-md font-bold">No Rewards Offered</h3>
                    <p className="text-xs text-muted-foreground max-w-[260px] mx-auto leading-relaxed">
                      There are no available redeemable rewards offered by campus merchants at this time.
                    </p>
                  </div>
                ) : (
                  <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
                    {mockRewards.map((item) => {
                      const Icon = item.icon;
                      return (
                        <div
                          key={item.id}
                          className="bg-card border border-border p-5 rounded-2xl flex flex-col h-full hover:border-foreground/35 transition-all duration-200 cursor-pointer group shadow-sm"
                        >
                          <div className="h-10 w-10 bg-muted rounded-lg flex items-center justify-center text-foreground mb-4 group-hover:bg-primary group-hover:text-primary-foreground transition-colors shrink-0 select-none">
                            <Icon className="h-5 w-5" />
                          </div>
                          <h4 className="text-xs font-bold text-foreground mb-1 leading-snug group-hover:text-primary transition-colors">
                            {item.title}
                          </h4>
                          <p className="text-[10px] text-muted-foreground flex-grow mb-4 leading-relaxed">
                            {item.description}
                          </p>
                          <div className="flex justify-between items-center mt-auto pt-2 border-t border-border/60">
                            <span className="text-xs font-black text-foreground">{item.cost}</span>
                            <button className="border border-border text-foreground font-bold px-3 py-1.5 rounded-lg text-[10px] uppercase tracking-wider hover:bg-accent transition-colors cursor-pointer">
                              Redeem
                            </button>
                          </div>
                        </div>
                      );
                    })}
                  </div>
                )}
              </div>

            </div>

          </div>
        </main>
      </div>

      {/* 3. Mobile Bottom Navigation Bar */}
      <nav className="lg:hidden fixed bottom-0 left-0 right-0 h-20 bg-card border-t border-border z-45 flex justify-around items-center px-2 shadow-lg">
        {[
          { label: "Dashboard", icon: LayoutDashboard, active: false },
          { label: "Wallet", icon: Wallet, active: false },
          { label: "Pay", icon: Coins, active: false },
          { label: "Market", icon: Store, active: false },
          { label: "Rewards", icon: Award, active: true },
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
      </nav>
    </div>
  );
}
export default Rewards;
