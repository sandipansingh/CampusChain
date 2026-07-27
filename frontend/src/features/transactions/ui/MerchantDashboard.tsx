"use client";

import { useState } from "react";
import { useWallet } from "@/shared/stellar/useWallet";
import { Skeleton } from "@/shared/ui/Skeleton";
import { Dropdown } from "@/shared/ui/Dropdown";
import {
  TrendingUp,
  Receipt,
  Package,
  Settings,
  HelpCircle,
  Bell,
  QrCode,
  Landmark,
  X,
} from "lucide-react";

type DashboardState = "success" | "loading" | "empty";

interface SaleTransaction {
  id: string;
  studentName: string;
  studentInitials: string;
  amountXlm: string;
  amountCamp: string;
  time: string;
  status: "Confirmed" | "Pending";
}

const mockSales: SaleTransaction[] = [
  { id: "sale1", studentName: "John D.", studentInitials: "JD", amountXlm: "14.50 XLM", amountCamp: "1,450 CAMP", time: "12:42 PM", status: "Confirmed" },
  { id: "sale2", studentName: "Alice S.", studentInitials: "AS", amountXlm: "8.25 XLM", amountCamp: "825 CAMP", time: "12:15 PM", status: "Confirmed" },
  { id: "sale3", studentName: "Mark K.", studentInitials: "MK", amountXlm: "45.00 XLM", amountCamp: "4,500 CAMP", time: "11:30 AM", status: "Confirmed" },
  { id: "sale4", studentName: "Emma J.", studentInitials: "EJ", amountXlm: "12.40 XLM", amountCamp: "1,240 CAMP", time: "11:28 AM", status: "Pending" },
];

export function MerchantDashboard() {
  const { disconnect } = useWallet();
  const [dbState, setDbState] = useState<DashboardState>("success");
  const [payAmount, setPayAmount] = useState("");
  const [showQrModal, setShowQrModal] = useState(false);

  const handleGenerateQr = (e: React.FormEvent) => {
    e.preventDefault();
    if (!payAmount || parseFloat(payAmount) <= 0) return;
    setShowQrModal(true);
  };

  return (
    <div className="flex h-screen w-full bg-background text-foreground overflow-hidden">
      {/* 1. Desktop Sidebar Navigation */}
      <nav className="hidden md:flex flex-col w-64 bg-card border-r border-border h-full fixed left-0 top-0 py-6 px-4 z-40">
        <div className="flex items-center gap-3 mb-8 px-2">
          <div className="w-10 h-10 rounded-full bg-muted flex items-center justify-center font-bold text-foreground">
            CV
          </div>
          <div>
            <h1 className="text-sm font-bold leading-tight">Main Cafeteria</h1>
            <p className="text-[10px] text-muted-foreground">Building A - Central</p>
          </div>
        </div>

        <nav className="flex-1 space-y-1">
          {[
            { label: "Sales", icon: TrendingUp, href: "#", active: true },
            { label: "Transactions", icon: Receipt, href: "#", active: false },
            { label: "Inventory", icon: Package, href: "#", active: false },
          ].map((item) => {
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
        </nav>

        <div className="border-t border-border pt-4 mt-auto space-y-1">
          <a
            href="#"
            className="flex items-center gap-3 px-3 py-2.5 rounded-lg text-sm text-muted-foreground hover:text-foreground hover:bg-secondary/40 font-medium transition-all"
          >
            <Settings className="h-4 w-4" />
            <span>Settings</span>
          </a>
          <button
            onClick={disconnect}
            className="w-full flex items-center gap-3 px-3 py-2.5 rounded-lg text-sm text-muted-foreground hover:text-destructive font-medium transition-all text-left cursor-pointer"
          >
            <span>Logout</span>
          </button>
        </div>
      </nav>

      {/* Main Content Area */}
      <div className="flex-grow md:ml-64 flex flex-col h-full overflow-hidden">
        {/* 2. Top Navbar */}
        <header className="hidden md:flex justify-between items-center h-16 border-b border-border bg-card px-6 sticky top-0 z-30 shrink-0">
          <div className="flex items-center gap-4 flex-1">
            <h2 className="text-lg font-bold">Sales Dashboard</h2>
          </div>

          <div className="flex items-center gap-6">
            {/* UI State Control Dropdown */}
            <div className="w-40">
              <Dropdown<DashboardState>
                options={[
                  { value: "success", label: "State: Success" },
                  { value: "loading", label: "State: Loading" },
                  { value: "empty", label: "State: Empty" },
                ]}
                value={dbState}
                onChange={(val) => setDbState(val)}
              />
            </div>

            <button className="text-muted-foreground hover:text-foreground p-2 rounded-full hover:bg-muted transition-colors relative cursor-pointer">
              <Bell className="h-5 w-5" />
            </button>
            <button className="text-muted-foreground hover:text-foreground p-2 rounded-full hover:bg-muted transition-colors relative cursor-pointer">
              <HelpCircle className="h-5 w-5" />
            </button>

            <div className="w-8 h-8 rounded-full bg-muted flex items-center justify-center text-xs font-bold border border-border">
              MP
            </div>
          </div>
        </header>

        {/* Content Viewport */}
        <main className="flex-grow overflow-y-auto p-4 md:p-6 pb-24 md:pb-6 relative h-full bg-muted/20">
          <div className="max-w-6xl mx-auto space-y-6">

            {/* MOBILE ONLY: Top Header */}
            <div className="flex md:hidden justify-between items-center py-2 shrink-0">
              <div>
                <h1 className="text-2xl font-bold">Sales</h1>
                <p className="text-xs text-muted-foreground mt-0.5">Overview of today&apos;s campus sales.</p>
              </div>
              <div className="flex items-center gap-2">
                <div className="w-28">
                  <Dropdown<DashboardState>
                    options={[
                      { value: "success", label: "Success" },
                      { value: "loading", label: "Loading" },
                      { value: "empty", label: "Empty" },
                    ]}
                    value={dbState}
                    onChange={(val) => setDbState(val)}
                  />
                </div>
                <div className="w-8 h-8 rounded-full bg-muted flex items-center justify-center text-xs font-bold">
                  MP
                </div>
              </div>
            </div>

            {/* 3. Stats Row */}
            <div className="grid grid-cols-1 md:grid-cols-3 gap-6">
              {[
                { label: "Today's Sales", value: "342.50 XLM", secondary: "~34,250 CAMP" },
                { label: "Transactions Today", value: "42", secondary: "Last tx 10 mins ago" },
                { label: "Pending Settlements", value: "12.40 XLM", secondary: "Next processing: tomorrow" },
              ].map((stat, i) => (
                <div key={i} className="bg-card border border-border rounded-xl p-5 shadow-sm">
                  <p className="text-[10px] uppercase font-bold tracking-wider text-muted-foreground mb-1.5">
                    {stat.label}
                  </p>
                  {dbState === "loading" ? (
                    <div className="space-y-2">
                      <Skeleton className="h-8 w-28" />
                      <Skeleton className="h-4 w-20" />
                    </div>
                  ) : dbState === "empty" ? (
                    <div>
                      <p className="text-2xl font-bold">0.00</p>
                      <p className="text-[10px] text-muted-foreground mt-1">No data</p>
                    </div>
                  ) : (
                    <div>
                      <p className="text-2xl font-black">{stat.value}</p>
                      <p className="text-[10px] text-muted-foreground mt-1">{stat.secondary}</p>
                    </div>
                  )}
                </div>
              ))}
            </div>

            {/* Bento Grid Split Layout */}
            <div className="grid grid-cols-1 lg:grid-cols-12 gap-6 items-start">
              
              {/* Left Column: Accept payments and settlements */}
              <div className="lg:col-span-5 flex flex-col gap-6">
                
                {/* Accept Payments Form */}
                <div className="bg-card border border-border rounded-xl p-5 shadow-sm">
                  <h3 className="text-sm font-bold text-foreground mb-4 flex items-center gap-2">
                    <QrCode className="h-4 w-4 text-muted-foreground/80" />
                    <span>Accept Payments</span>
                  </h3>

                  <form onSubmit={handleGenerateQr} className="space-y-4">
                    <div>
                      <label className="block text-[10px] uppercase font-bold tracking-wider text-muted-foreground mb-1.5" htmlFor="amount-input">
                        Amount (XLM)
                      </label>
                      <div className="relative">
                        <input
                          id="amount-input"
                          type="number"
                          step="0.01"
                          value={payAmount}
                          onChange={(e) => setPayAmount(e.target.value)}
                          placeholder="0.00"
                          required
                          disabled={dbState === "loading"}
                          className="w-full h-11 px-4 bg-card border border-border rounded-lg text-sm focus:border-foreground focus:ring-1 focus:ring-foreground focus:outline-none"
                        />
                        <span className="absolute right-4 top-1/2 -translate-y-1/2 text-xs font-bold text-muted-foreground">
                          XLM
                        </span>
                      </div>
                    </div>

                    <button
                      type="submit"
                      disabled={dbState === "loading"}
                      className="w-full h-11 bg-primary text-primary-foreground font-semibold rounded-lg flex items-center justify-center gap-2 hover:bg-primary/95 transition-all active:scale-[0.99] disabled:opacity-80 disabled:cursor-not-allowed cursor-pointer"
                    >
                      <QrCode className="h-4 w-4" />
                      <span>Generate Payment QR</span>
                    </button>
                  </form>
                </div>

                {/* Settlement Card */}
                <div className="bg-muted/40 border border-border rounded-xl p-5 shadow-sm">
                  <h3 className="text-sm font-bold text-foreground mb-2 flex items-center gap-2">
                    <Landmark className="h-4 w-4 text-muted-foreground/80" />
                    <span>Settlement</span>
                  </h3>
                  
                  <p className="text-xs text-muted-foreground mb-5">
                    Available to withdraw:{" "}
                    <strong className="text-foreground font-black text-sm">1,240.00 XLM</strong>
                  </p>

                  <div className="relative">
                    <button
                      disabled
                      className="w-full h-11 bg-muted border border-border text-muted-foreground font-semibold rounded-lg flex items-center justify-center gap-2 opacity-65 cursor-not-allowed"
                    >
                      <span>Withdraw to Bank/Anchor</span>
                    </button>
                    <span className="absolute -top-3 right-4 bg-card border border-border px-2.5 py-0.5 rounded-full text-[9px] font-bold text-muted-foreground shadow-sm uppercase tracking-wider">
                      Coming Soon
                    </span>
                  </div>
                </div>

              </div>

              {/* Right Column: Recent Payments Table */}
              <div className="lg:col-span-7 bg-card border border-border rounded-xl p-5 shadow-sm flex flex-col overflow-hidden">
                <div className="flex justify-between items-center mb-4">
                  <h3 className="text-sm font-bold text-foreground">Recent Payments</h3>
                  <button className="text-muted-foreground hover:text-foreground cursor-pointer">
                    <SlidersHorizontalIcon className="h-4 w-4" />
                  </button>
                </div>

                <div className="overflow-x-auto">
                  <table className="w-full text-left border-collapse">
                    <thead>
                      <tr className="border-b border-border text-[10px] font-bold text-muted-foreground uppercase tracking-wider select-none">
                        <th className="py-3 px-2">Student</th>
                        <th className="py-3 px-2">Amount</th>
                        <th className="py-3 px-2">Time</th>
                        <th className="py-3 px-2 pr-4 text-right">Status</th>
                      </tr>
                    </thead>
                    <tbody className="divide-y divide-border/60 text-xs">
                      {dbState === "loading" ? (
                        [1, 2].map((i) => (
                          <tr key={i}>
                            <td className="py-3 px-2"><Skeleton className="h-4 w-24" /></td>
                            <td className="py-3 px-2"><Skeleton className="h-4 w-16" /></td>
                            <td className="py-3 px-2"><Skeleton className="h-4 w-12" /></td>
                            <td className="py-3 px-2 text-right"><Skeleton className="h-4 w-16 ml-auto" /></td>
                          </tr>
                        ))
                      ) : dbState === "empty" || filteredTxs(mockSales).length === 0 ? (
                        <tr>
                          <td colSpan={4} className="py-8 text-center text-xs text-muted-foreground">
                            No sales recorded today.
                          </td>
                        </tr>
                      ) : (
                        filteredTxs(mockSales).map((sale) => (
                          <tr key={sale.id} className="hover:bg-muted/15 transition-colors">
                            <td className="py-3 px-2 flex items-center gap-2">
                              <div className="w-7 h-7 rounded-full bg-secondary flex items-center justify-center font-bold text-[9px] text-secondary-foreground select-none shrink-0">
                                {sale.studentInitials}
                              </div>
                              <span className="font-bold text-foreground">{sale.studentName}</span>
                            </td>
                            <td className="py-3 px-2">
                              <div className="font-bold">{sale.amountXlm}</div>
                              <div className="text-[10px] text-muted-foreground">{sale.amountCamp}</div>
                            </td>
                            <td className="py-3 px-2 text-muted-foreground">{sale.time}</td>
                            <td className="py-3 px-2 pr-4 text-right">
                              <span
                                className={`inline-flex items-center px-2 py-0.5 rounded-full text-[10px] font-bold border ${
                                  sale.status === "Confirmed"
                                    ? "bg-muted text-foreground border-border"
                                    : "bg-muted text-muted-foreground border-border animate-pulse"
                                }`}
                              >
                                {sale.status}
                              </span>
                            </td>
                          </tr>
                        ))
                      )}
                    </tbody>
                  </table>
                </div>

                {dbState === "success" && (
                  <button className="w-full mt-4 h-9 bg-card border border-border text-foreground hover:bg-accent font-semibold rounded-lg text-xs transition-colors cursor-pointer">
                    View All Transactions
                  </button>
                )}
              </div>

            </div>

          </div>
        </main>
      </div>

      {/* 4. Payment QR Code generation modal dialog */}
      {showQrModal && (
        <div className="fixed inset-0 z-50 flex items-center justify-center p-4">
          <div
            onClick={() => setShowQrModal(false)}
            className="absolute inset-0 bg-background/60 backdrop-blur-sm transition-opacity"
          ></div>

          <div className="relative w-full max-w-sm bg-card border border-border rounded-xl shadow-2xl overflow-hidden flex flex-col p-6 items-center text-center gap-6 animate-in fade-in zoom-in-95 duration-200">
            <div className="w-full flex justify-between items-center shrink-0">
              <h3 className="text-sm font-bold uppercase tracking-wider text-muted-foreground">
                Payment Request QR
              </h3>
              <button
                onClick={() => setShowQrModal(false)}
                className="p-1 rounded-full hover:bg-muted text-muted-foreground hover:text-foreground cursor-pointer transition-colors"
              >
                <X className="h-4.5 w-4.5" />
              </button>
            </div>

            <div className="space-y-1">
              <div className="text-2xl font-black">{payAmount} XLM</div>
              <div className="text-xs text-muted-foreground">≈ {parseFloat(payAmount) * 100} CAMP</div>
            </div>

            {/* Simulated QR code block */}
            <div className="w-44 h-44 bg-white border border-border rounded-xl flex items-center justify-center p-3 relative shadow-inner">
              <div className="grid grid-cols-5 gap-1.5 w-full h-full p-1 opacity-80">
                <div className="bg-primary col-span-2 row-span-2 rounded"></div>
                <div className="bg-muted rounded"></div>
                <div className="bg-primary rounded"></div>
                <div className="bg-primary rounded"></div>
                <div className="bg-muted rounded"></div>
                <div className="bg-primary rounded"></div>
                <div className="bg-muted rounded"></div>
                <div className="bg-primary col-span-2 row-span-2 rounded"></div>
                <div className="bg-primary rounded"></div>
                <div className="bg-muted rounded"></div>
                <div className="bg-primary rounded"></div>
                <div className="bg-muted rounded"></div>
                <div className="bg-primary rounded"></div>
                <div className="bg-muted rounded"></div>
                <div className="bg-primary rounded"></div>
                <div className="bg-primary rounded"></div>
                <div className="bg-muted rounded"></div>
                <div className="bg-primary col-span-2 row-span-2 rounded"></div>
              </div>
              <div className="absolute top-5 left-5 w-10 h-10 border-4 border-primary rounded flex items-center justify-center">
                <div className="w-3.5 h-3.5 bg-primary rounded-sm"></div>
              </div>
              <div className="absolute top-5 right-5 w-10 h-10 border-4 border-primary rounded flex items-center justify-center">
                <div className="w-3.5 h-3.5 bg-primary rounded-sm"></div>
              </div>
              <div className="absolute bottom-5 left-5 w-10 h-10 border-4 border-primary rounded flex items-center justify-center">
                <div className="w-3.5 h-3.5 bg-primary rounded-sm"></div>
              </div>
            </div>

            <p className="text-[10px] text-muted-foreground max-w-[200px] leading-relaxed">
              Scan this QR code using a student wallet app to pay {payAmount} XLM instantly.
            </p>

            <button
              onClick={() => setShowQrModal(false)}
              className="w-full h-11 bg-primary text-primary-foreground font-semibold rounded-lg hover:bg-primary/95 transition-all cursor-pointer"
            >
              Done
            </button>
          </div>
        </div>
      )}

      {/* 5. Mobile Bottom Tab navigation */}
      <nav className="lg:hidden fixed bottom-0 left-0 right-0 h-20 bg-card border-t border-border z-45 flex justify-around items-center px-2 shadow-lg">
        {[
          { label: "Sales", icon: TrendingUp, active: true },
          { label: "Trans", icon: Receipt, active: false },
          { label: "Stock", icon: Package, active: false },
          { label: "Config", icon: Settings, active: false },
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

// Helper to represent filter sliders
function SlidersHorizontalIcon(props: React.SVGProps<SVGSVGElement>) {
  return (
    <svg
      {...props}
      xmlns="http://www.w3.org/2000/svg"
      width="24"
      height="24"
      viewBox="0 0 24 24"
      fill="none"
      stroke="currentColor"
      strokeWidth="2"
      strokeLinecap="round"
      strokeLinejoin="round"
    >
      <line x1="4" x2="4" y1="21" y2="14" />
      <line x1="4" x2="4" y1="10" y2="3" />
      <line x1="12" x2="12" y1="21" y2="12" />
      <line x1="12" x2="12" y1="8" y2="3" />
      <line x1="20" x2="20" y1="21" y2="16" />
      <line x1="20" x2="20" y1="12" y2="3" />
      <line x1="2" x2="6" y1="14" y2="14" />
      <line x1="10" x2="14" y1="8" y2="8" />
      <line x1="18" x2="22" y1="16" y2="16" />
    </svg>
  );
}

// Fallback filtering helper
function filteredTxs(txs: SaleTransaction[]) {
  return txs;
}

export default MerchantDashboard;
