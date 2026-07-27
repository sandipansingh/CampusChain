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
  ArrowLeft,
  BookOpen,
  ArrowUpDown,
  CheckCircle2,
  Lock,
  Info,
  Check,
  Truck,
  FileCheck2,
  PackageX,
} from "lucide-react";

type DetailState = "success" | "loading" | "empty";

export function MarketplaceDetail() {
  const { disconnect } = useWallet();
  const [detailState, setDetailState] = useState<DetailState>("success");
  const [currentStep, setCurrentStep] = useState<number>(1);

  // Navigation items for the sidebar (desktop)
  const navItems = [
    { label: "Dashboard", icon: LayoutDashboard, href: "#", active: false },
    { label: "Wallet", icon: Wallet, href: "#", active: false },
    { label: "Pay (QR)", icon: Coins, href: "#", active: false },
    { label: "Marketplace", icon: Store, href: "#", active: true },
    { label: "Events", icon: Calendar, href: "#", active: false },
    { label: "Rewards", icon: Award, href: "#", active: false },
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
            <p className="text-xs text-muted-foreground">University Infrastructure</p>
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
        <header className="flex justify-between items-center h-16 border-b border-border bg-card px-6 sticky top-0 z-30 shrink-0">
          <div className="flex items-center gap-2">
            <a
              href="#"
              className="inline-flex items-center gap-2 text-muted-foreground hover:text-foreground text-sm font-semibold transition-colors group"
            >
              <ArrowLeft className="h-4 w-4 group-hover:-translate-x-0.5 transition-transform" />
              <span>Back to Marketplace</span>
            </a>
          </div>

          <div className="flex items-center gap-4">
            {/* Detail State Switcher */}
            <div className="w-40">
              <Dropdown<DetailState>
                options={[
                  { value: "success", label: "State: Success" },
                  { value: "loading", label: "State: Loading" },
                  { value: "empty", label: "State: Empty" },
                ]}
                value={detailState}
                onChange={(val) => setDetailState(val)}
              />
            </div>
            
            <div className="hidden md:flex items-center gap-3">
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

        {/* Content Canvas */}
        <main className="flex-grow overflow-y-auto p-4 md:p-8 bg-muted/20 pb-20 md:pb-8">
          <div className="max-w-4xl mx-auto">
            {detailState === "loading" ? (
              <article className="bg-card rounded-2xl border border-border p-6 md:p-10 space-y-8">
                <div className="grid grid-cols-1 md:grid-cols-12 gap-8 md:gap-12">
                  <div className="md:col-span-5">
                    <Skeleton className="w-full aspect-square rounded-2xl" />
                  </div>
                  <div className="md:col-span-7 space-y-4">
                    <Skeleton className="h-8 w-4/5" />
                    <Skeleton className="h-10 w-1/3" />
                    <Skeleton className="h-4 w-1/4" />
                    <div className="border-y border-border py-4 my-2">
                      <div className="flex items-center gap-3">
                        <Skeleton className="w-10 h-10 rounded-full" />
                        <div className="space-y-1.5 flex-1">
                          <Skeleton className="h-4 w-24" />
                          <Skeleton className="h-3 w-16" />
                        </div>
                      </div>
                    </div>
                    <Skeleton className="h-16 w-full" />
                    <Skeleton className="h-12 w-full rounded-xl" />
                  </div>
                </div>
              </article>
            ) : detailState === "empty" ? (
              <div className="p-16 border border-border rounded-2xl bg-card text-center flex flex-col items-center justify-center gap-3 shadow-sm">
                <PackageX className="h-12 w-12 text-muted-foreground/50" />
                <h3 className="text-md font-bold">Item Not Found</h3>
                <p className="text-xs text-muted-foreground max-w-[260px] mx-auto leading-relaxed">
                  The listing you are trying to view does not exist or has already been purchased.
                </p>
              </div>
            ) : (
              <article className="bg-card rounded-2xl border border-border p-6 md:p-10 shadow-sm">
                <div className="grid grid-cols-1 md:grid-cols-12 gap-8 md:gap-12">
                  
                  {/* Visual Asset Container */}
                  <div className="md:col-span-5">
                    <div className="w-full aspect-square bg-muted rounded-2xl border border-border flex items-center justify-center relative overflow-hidden group">
                      <BookOpen className="h-32 w-32 text-muted-foreground/80 group-hover:scale-105 transition-transform duration-500" />
                      <div className="absolute top-4 left-4 bg-card px-3 py-1.5 rounded-full border border-border shadow-sm flex items-center gap-1.5">
                        <span className="w-2 h-2 rounded-full bg-primary animate-pulse"></span>
                        <span className="text-[10px] uppercase font-black tracking-wider text-foreground">
                          Textbook
                        </span>
                      </div>
                    </div>
                  </div>

                  {/* Description Info Area */}
                  <div className="md:col-span-7 flex flex-col justify-between">
                    <div>
                      <h2 className="text-xl md:text-2xl font-bold leading-tight">
                        Introduction to Algorithms, 3rd Edition
                      </h2>
                      
                      <div className="mt-4 mb-6">
                        <div className="text-3xl font-black tracking-tight">120 CAMP</div>
                        <div className="text-xs text-muted-foreground mt-2 flex items-center gap-1">
                          <ArrowUpDown className="h-3.5 w-3.5" />
                          <span>≈ 45 XLM</span>
                        </div>
                      </div>

                      {/* Seller Profile Block */}
                      <div className="flex items-center gap-3 py-3 px-4 rounded-xl bg-muted/40 border border-border/60 mb-6">
                        <div className="w-10 h-10 rounded-full bg-secondary flex items-center justify-center text-secondary-foreground font-bold text-sm select-none">
                          JD
                        </div>
                        <div className="flex-grow">
                          <div className="text-xs font-bold">John Doe</div>
                          <div className="flex items-center gap-1 text-[10px] text-muted-foreground mt-0.5">
                            <CheckCircle2 className="h-3.5 w-3.5 text-emerald-600 fill-emerald-50" />
                            <span>Verified Student</span>
                          </div>
                        </div>
                        <div className="text-right text-[10px] text-muted-foreground">
                          <div>Member since</div>
                          <div className="font-bold text-foreground mt-0.5">Aug 2023</div>
                        </div>
                      </div>

                      <p className="text-sm text-muted-foreground leading-relaxed text-justify mb-8">
                        Hardcover edition in excellent condition. No highlighting, dog-ears, or torn pages.
                        Essential text for CS 301. Barely used during the previous semester. Includes original
                        digital access code (unused).
                      </p>
                    </div>

                    {/* Escrow Buy Button */}
                    <div className="space-y-4">
                      <button className="w-full h-12 bg-primary text-primary-foreground font-bold rounded-xl hover:bg-primary/95 flex items-center justify-center gap-2 cursor-pointer shadow-sm transition-all active:scale-[0.99]">
                        <Lock className="h-4 w-4" />
                        <span>Buy with Escrow</span>
                      </button>
                      <div className="flex items-start justify-center gap-2 text-center text-[10px] text-muted-foreground px-4">
                        <Info className="h-3.5 w-3.5 text-muted-foreground/75 shrink-0 mt-0.5" />
                        <p className="leading-relaxed">
                          Funds held in smart contract escrow until item is confirmed received by buyer.
                        </p>
                      </div>
                    </div>

                  </div>

                </div>

                {/* Tracker stepper */}
                <div className="mt-12 pt-8 border-t border-border">
                  <div className="flex justify-between items-center mb-6">
                    <h3 className="text-xs font-bold uppercase tracking-wider text-muted-foreground">
                      Escrow Process Tracker
                    </h3>
                    
                    {/* Simulated stepper controller */}
                    <div className="flex items-center gap-1.5">
                      <span className="text-[10px] text-muted-foreground">Simulate Step:</span>
                      {[1, 2, 3, 4].map((step) => (
                        <button
                          key={step}
                          onClick={() => setCurrentStep(step)}
                          className={`w-6 h-6 rounded-md text-[10px] font-bold border transition-all cursor-pointer ${
                            currentStep === step
                              ? "bg-primary text-primary-foreground border-primary"
                              : "bg-card text-muted-foreground border-border hover:bg-muted"
                          }`}
                        >
                          {step}
                        </button>
                      ))}
                    </div>
                  </div>

                  <div className="relative w-full max-w-2xl mx-auto py-4">
                    {/* Progress Connecting Line */}
                    <div className="absolute top-[21px] left-[60px] right-[60px] h-0.5 bg-border z-0"></div>
                    <div
                      className="absolute top-[21px] left-[60px] h-0.5 bg-primary z-0 transition-all duration-300"
                      style={{
                        width: `${((currentStep - 1) / 3) * 100}%`,
                      }}
                    ></div>

                    {/* Stepper items */}
                    <div className="flex justify-between relative z-10">
                      {[
                        { label: "Ordered", icon: Check },
                        { label: "Locked", icon: Lock },
                        { label: "Delivered", icon: Truck },
                        { label: "Released", icon: FileCheck2 },
                      ].map((item, index) => {
                        const stepNum = index + 1;
                        const StepIcon = item.icon;
                        const isCompleted = stepNum < currentStep;
                        const isActive = stepNum === currentStep;
                        
                        return (
                          <div key={item.label} className="flex flex-col items-center w-28 gap-2">
                            <div
                              className={`w-10 h-10 rounded-full border-4 border-card flex items-center justify-center transition-all ${
                                isCompleted
                                  ? "bg-primary text-primary-foreground"
                                  : isActive
                                  ? "bg-primary text-primary-foreground ring-4 ring-primary/20"
                                  : "bg-muted text-muted-foreground border-2 border-border"
                              }`}
                            >
                              <StepIcon className="h-4 w-4" />
                            </div>
                            <span
                              className={`text-[10px] font-bold tracking-wide uppercase text-center ${
                                isActive || isCompleted ? "text-foreground" : "text-muted-foreground"
                              }`}
                            >
                              {item.label}
                            </span>
                          </div>
                        );
                      })}
                    </div>
                  </div>

                </div>

              </article>
            )}
          </div>
        </main>
      </div>

      {/* 3. Mobile Bottom Navigation Bar */}
      <nav className="lg:hidden fixed bottom-0 left-0 right-0 h-20 bg-card border-t border-border z-40 flex justify-around items-center px-2 shadow-lg">
        {[
          { label: "Dashboard", icon: LayoutDashboard, active: false },
          { label: "Wallet", icon: Wallet, active: false },
          { label: "Pay", icon: Coins, active: false },
          { label: "Market", icon: Store, active: true },
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
      </nav>
    </div>
  );
}
export default MarketplaceDetail;
