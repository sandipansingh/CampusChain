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
  CameraOff,
  Keyboard,
  ArrowLeft,
  Zap,
  CheckCircle,
  AlertCircle,
  Store,
  ArrowRight,
} from "lucide-react";

type ScanState = "waiting" | "scanned" | "loading" | "empty";

export function ScanPay() {
  const { disconnect } = useWallet();
  const [scanState, setScanState] = useState<ScanState>("scanned");

  // Navigation items for the sidebar (desktop)
  const navItems = [
    { label: "Dashboard", icon: LayoutDashboard, href: "#", active: false },
    { label: "Wallet", icon: Wallet, href: "#", active: false },
    { label: "Pay (QR)", icon: QrCode, href: "#", active: true },
    { label: "Marketplace", icon: ShoppingBag, href: "#", active: false },
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
          <h2 className="text-xl font-bold">Pay (QR)</h2>
          
          <div className="flex items-center gap-6">
            {/* Scan State Control Dropdown */}
            <div className="w-40">
              <Dropdown<ScanState>
                options={[
                  { value: "scanned", label: "State: Scanned" },
                  { value: "waiting", label: "State: Waiting" },
                  { value: "loading", label: "State: Loading" },
                  { value: "empty", label: "State: Empty" },
                ]}
                value={scanState}
                onChange={(val) => setScanState(val)}
              />
            </div>

            <button className="text-muted-foreground hover:text-foreground p-2 rounded-full hover:bg-muted transition-colors relative cursor-pointer">
              <Bell className="h-5 w-5" />
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

        {/* Content Container (Adapts between Desktop split view and Mobile viewfinder full bleed) */}
        <main className="flex-grow flex items-center justify-center p-0 md:p-6 bg-muted/20 overflow-y-auto relative h-full">
          
          {/* DESKTOP SCAN CARD LAYOUT */}
          <div className="hidden md:flex w-full max-w-4xl bg-card rounded-xl border border-border shadow-sm overflow-hidden min-h-[500px]">
            {/* Desktop Left Side: Camera Scan View */}
            <div className="flex-1 p-8 flex flex-col justify-center items-center border-r border-border bg-card/60">
              <div className="w-full max-w-sm text-center">
                <h3 className="text-lg font-bold mb-4">Scan Customer QR</h3>
                
                {/* Viewfinder simulation */}
                <div className="relative w-full aspect-square bg-zinc-900 rounded-xl flex flex-col items-center justify-center overflow-hidden border border-border shadow-inner">
                  {/* Outer scan brackets */}
                  <div className="absolute inset-6 border-2 border-dashed border-zinc-700 rounded-lg"></div>
                  
                  {/* Scanning brackets corner accents */}
                  <div className="absolute top-6 left-6 w-8 h-8 border-t-4 border-l-4 border-card rounded-tl"></div>
                  <div className="absolute top-6 right-6 w-8 h-8 border-t-4 border-r-4 border-card rounded-tr"></div>
                  <div className="absolute bottom-6 left-6 w-8 h-8 border-b-4 border-l-4 border-card rounded-bl"></div>
                  <div className="absolute bottom-6 right-6 w-8 h-8 border-b-4 border-r-4 border-card rounded-br"></div>
                  
                  {/* Laser line animation */}
                  <div className="absolute w-[80%] h-0.5 bg-primary/60 shadow-[0_0_8px_var(--primary)] left-10 animate-pulse top-1/2 -translate-y-1/2"></div>
                  
                  <div className="flex flex-col items-center justify-center text-zinc-500 gap-2 z-10">
                    <CameraOff className="h-10 w-10 text-zinc-600" />
                    <span className="text-xs font-semibold uppercase tracking-wider text-zinc-500">Camera Active</span>
                  </div>
                </div>
              </div>
            </div>

            {/* Desktop Right Side: Info Panel & State rendering */}
            <div className="w-80 p-8 flex flex-col justify-between bg-muted/30">
              <div className="space-y-6">
                <div>
                  <span className="inline-flex items-center gap-1.5 px-2.5 py-1 rounded-full bg-secondary text-secondary-foreground text-[10px] font-bold uppercase tracking-wider mb-3">
                    <Store className="h-3.5 w-3.5" />
                    Kiosk Mode
                  </span>
                  <h4 className="text-md font-bold text-foreground">CampusChain Kiosk #04</h4>
                  <p className="text-xs text-muted-foreground mt-1">Ready for next transaction</p>
                </div>

                {/* State rendering */}
                {scanState === "loading" ? (
                  <div className="p-4 bg-card rounded-lg border border-border space-y-3">
                    <Skeleton className="h-4 w-28" />
                    <Skeleton className="h-6 w-full" />
                  </div>
                ) : scanState === "empty" ? (
                  <div className="p-4 bg-card rounded-lg border border-border flex items-start gap-3">
                    <AlertCircle className="h-5 w-5 text-muted-foreground shrink-0 mt-0.5" />
                    <div>
                      <h5 className="text-xs font-bold text-foreground">No Request</h5>
                      <p className="text-[11px] text-muted-foreground mt-0.5 leading-relaxed">
                        There is no active payment request on this kiosk.
                      </p>
                    </div>
                  </div>
                ) : scanState === "waiting" ? (
                  <div className="p-4 bg-card rounded-lg border border-border flex items-center gap-3">
                    <div className="w-2.5 h-2.5 rounded-full bg-primary animate-ping shrink-0"></div>
                    <span className="text-xs font-bold text-foreground">Waiting for scan...</span>
                  </div>
                ) : (
                  <div className="p-4 bg-card rounded-lg border border-border space-y-4 shadow-sm">
                    <div className="flex items-center gap-2 text-xs font-bold text-emerald-600 bg-emerald-50 border border-emerald-100 px-2 py-1 rounded-md w-fit">
                      <CheckCircle className="h-3.5 w-3.5" />
                      QR Scanned
                    </div>
                    
                    <div className="space-y-2">
                      <div className="text-[10px] uppercase font-bold tracking-wider text-muted-foreground">Merchant</div>
                      <div className="text-sm font-bold">University Bookstore</div>
                    </div>

                    <div className="space-y-1 pt-1 border-t border-border">
                      <div className="text-[10px] uppercase font-bold tracking-wider text-muted-foreground">Amount</div>
                      <div className="text-base font-extrabold">45.00 XLM</div>
                      <div className="text-xs text-muted-foreground">≈ 120 CAMP</div>
                    </div>
                  </div>
                )}
              </div>

              <div className="mt-8">
                {scanState === "scanned" ? (
                  <button className="w-full h-11 bg-primary text-primary-foreground font-semibold rounded-lg hover:bg-primary/95 flex items-center justify-center gap-2 cursor-pointer transition-all active:scale-[0.98]">
                    <span>Confirm Payment</span>
                    <ArrowRight className="h-4 w-4" />
                  </button>
                ) : (
                  <button className="w-full h-11 bg-card border border-border text-foreground font-semibold rounded-lg hover:bg-accent flex items-center justify-center gap-2 cursor-pointer transition-colors">
                    <Keyboard className="h-4 w-4" />
                    <span>Enter Manual ID</span>
                  </button>
                )}
              </div>
            </div>
          </div>

          {/* MOBILE SCAN VIEWPORT (Full bleed black camera simulation with Bottom Sheet overlay) */}
          <div className="flex md:hidden flex-col h-full w-full bg-zinc-950 relative overflow-hidden">
            
            {/* Viewfinder Header */}
            <header className="absolute top-0 left-0 w-full z-20 flex justify-between items-center h-16 px-6 bg-transparent text-white">
              <button className="w-10 h-10 flex items-center justify-center rounded-full bg-zinc-900/60 border border-zinc-800 text-white cursor-pointer">
                <ArrowLeft className="h-5 w-5" />
              </button>
              <div className="w-24">
                <Dropdown<ScanState>
                  options={[
                    { value: "scanned", label: "Scanned" },
                    { value: "waiting", label: "Waiting" },
                    { value: "loading", label: "Loading" },
                    { value: "empty", label: "Empty" },
                  ]}
                  value={scanState}
                  onChange={(val) => setScanState(val)}
                  className="!text-xs text-white"
                />
              </div>
              <button className="w-10 h-10 flex items-center justify-center rounded-full bg-zinc-900/60 border border-zinc-800 text-white">
                <Zap className="h-5 w-5" />
              </button>
            </header>

            {/* Simulated Live Viewfinder Canvas */}
            <div className="flex-1 w-full flex items-center justify-center bg-zinc-900/70 py-16">
              {/* Scan box frame */}
              <div className="relative w-56 h-56">
                <div className="absolute inset-0 border border-zinc-800 rounded-lg bg-transparent"></div>
                {/* Corner highlights */}
                <div className="absolute top-0 left-0 w-6 h-6 border-t-4 border-l-4 border-primary rounded-tl-sm"></div>
                <div className="absolute top-0 right-0 w-6 h-6 border-t-4 border-r-4 border-primary rounded-tr-sm"></div>
                <div className="absolute bottom-0 left-0 w-6 h-6 border-b-4 border-l-4 border-primary rounded-bl-sm"></div>
                <div className="absolute bottom-0 right-0 w-6 h-6 border-b-4 border-r-4 border-primary rounded-br-sm"></div>
                
                {/* Laser animation */}
                <div className="absolute w-[80%] h-0.5 bg-primary shadow-[0_0_8px_var(--primary)] left-6 animate-pulse top-1/2 -translate-y-1/2"></div>
              </div>
            </div>

            {/* Bottom Sheet overlay */}
            <div className="absolute bottom-20 left-0 right-0 bg-card rounded-t-3xl border-t border-border shadow-xl z-20 transition-all duration-300">
              <div className="w-full flex justify-center py-3 shrink-0">
                <div className="w-12 h-1 bg-border rounded-full"></div>
              </div>

              <div className="px-6 pb-6 pt-2 flex flex-col gap-6">
                
                {/* Render States inside bottom sheet */}
                {scanState === "loading" ? (
                  <div className="space-y-4 py-4">
                    <div className="flex flex-col items-center gap-3">
                      <Skeleton className="w-16 h-16 rounded-full" />
                      <Skeleton className="h-6 w-44" />
                      <Skeleton className="h-4 w-28" />
                    </div>
                    <Skeleton className="h-16 w-full rounded-lg" />
                    <Skeleton className="h-12 w-full rounded-lg" />
                  </div>
                ) : scanState === "empty" ? (
                  <div className="py-8 flex flex-col items-center justify-center text-center gap-3">
                    <AlertCircle className="h-10 w-10 text-muted-foreground" />
                    <div>
                      <h3 className="text-base font-bold text-foreground">No Request Scanned</h3>
                      <p className="text-xs text-muted-foreground mt-1 max-w-[240px] mx-auto leading-relaxed">
                        Point your camera at a merchant or student QR code to initiate checkout.
                      </p>
                    </div>
                    <button className="mt-4 px-4 py-2 border border-border rounded-lg text-xs font-semibold text-foreground hover:bg-accent transition-colors flex items-center gap-2">
                      <Keyboard className="h-4 w-4" />
                      Enter Code Manually
                    </button>
                  </div>
                ) : scanState === "waiting" ? (
                  <div className="py-12 flex flex-col items-center justify-center text-center gap-4">
                    <div className="w-10 h-10 rounded-full border-4 border-primary border-t-transparent animate-spin"></div>
                    <div>
                      <h3 className="text-base font-bold text-foreground">Align QR Code</h3>
                      <p className="text-xs text-muted-foreground mt-1 max-w-[220px] mx-auto leading-relaxed">
                        Waiting for code check validation...
                      </p>
                    </div>
                  </div>
                ) : (
                  <>
                    {/* Merchant metadata */}
                    <div className="flex flex-col items-center text-center gap-2">
                      <div className="w-16 h-16 rounded-full bg-muted flex items-center justify-center mb-1 text-lg font-bold text-muted-foreground">
                        UB
                      </div>
                      <h2 className="text-lg font-bold text-foreground">University Bookstore</h2>
                      <p className="text-xs text-muted-foreground">Payment Request</p>
                    </div>

                    {/* Numeric Request Panel */}
                    <div className="flex flex-col items-center text-center gap-1 bg-muted/50 py-4 rounded-xl border border-border">
                      <span className="text-2xl font-black">45.00 XLM</span>
                      <span className="text-xs text-muted-foreground">≈ 120 CAMP</span>
                    </div>

                    {/* Transaction Control Actions */}
                    <div className="flex flex-col gap-3">
                      <button className="w-full h-12 bg-primary text-primary-foreground font-bold rounded-lg flex items-center justify-center hover:bg-primary/95 transition-opacity active:scale-[0.98] cursor-pointer">
                        Confirm Payment
                      </button>
                      <button className="w-full h-11 text-muted-foreground font-semibold rounded-lg hover:text-foreground transition-colors flex items-center justify-center cursor-pointer">
                        Cancel
                      </button>
                    </div>
                  </>
                )}

              </div>
            </div>

            {/* Mobile Bottom Tab navigation */}
            <nav className="fixed bottom-0 left-0 right-0 h-20 bg-card border-t border-border z-40 flex justify-around items-center px-2 shadow-lg">
              {[
                { label: "Dashboard", icon: LayoutDashboard, active: false },
                { label: "Wallet", icon: Wallet, active: false },
                { label: "Pay", icon: QrCode, active: true },
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
            </nav>
          </div>

        </main>
      </div>
    </div>
  );
}
export default ScanPay;
