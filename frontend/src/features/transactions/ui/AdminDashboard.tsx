"use client";

import { useState } from "react";
import { useWallet } from "@/shared/stellar/useWallet";
import { Skeleton } from "@/shared/ui/Skeleton";
import { Dropdown } from "@/shared/ui/Dropdown";
import {
  LayoutDashboard,
  Users,
  Store,
  Settings,
  HelpCircle,
  Bell,
  Coins,
} from "lucide-react";

type AdminState = "success" | "loading" | "empty";

interface OnboardingMerchant {
  id: string;
  name: string;
  category: string;
  status: "Pending" | "Active";
}

const initialMerchants: OnboardingMerchant[] = [
  { id: "mer1", name: "Central Library Cafe", category: "Food", status: "Pending" },
  { id: "mer2", name: "University Bookstore", category: "Retail", status: "Active" },
];

export function AdminDashboard() {
  const { disconnect } = useWallet();
  const [adminState, setAdminState] = useState<AdminState>("success");
  const [merchants, setMerchants] = useState<OnboardingMerchant[]>(initialMerchants);
  
  // Issuance form states
  const [recipient, setRecipient] = useState("all");
  const [issueAmount, setIssueAmount] = useState("");
  const [issueReason, setIssueReason] = useState("");
  const [issuing, setIssuing] = useState(false);
  const [issueSuccess, setIssueSuccess] = useState(false);

  const handleIssueTokens = (e: React.FormEvent) => {
    e.preventDefault();
    if (!issueAmount || parseInt(issueAmount) <= 0) return;

    setIssuing(true);
    setTimeout(() => {
      setIssuing(false);
      setIssueSuccess(true);
      setIssueAmount("");
      setIssueReason("");
      setTimeout(() => setIssueSuccess(false), 4000);
    }, 1500);
  };

  const handleApproveMerchant = (id: string) => {
    setMerchants((prev) =>
      prev.map((m) => (m.id === id ? { ...m, status: "Active" } : m))
    );
  };

  // Navigation items for the sidebar (desktop)
  const navItems = [
    { label: "Dashboard", icon: LayoutDashboard, href: "#", active: true },
    { label: "Students", icon: Users, href: "#", active: false },
    { label: "Merchants", icon: Store, href: "#", active: false },
    { label: "Financials", icon: Coins, href: "#", active: false },
  ];

  return (
    <div className="flex h-screen w-full bg-background text-foreground overflow-hidden">
      {/* 1. Desktop Sidebar Navigation */}
      <nav className="hidden md:flex flex-col w-64 bg-card border-r border-border h-full fixed left-0 top-0 py-6 px-4 z-50">
        <div className="flex items-center gap-3 mb-8 px-2">
          <div className="w-10 h-10 rounded-full bg-muted flex items-center justify-center font-bold text-foreground">
            UA
          </div>
          <div>
            <h1 className="text-lg font-bold leading-tight">CampusChain</h1>
            <p className="text-xs text-muted-foreground">University Admin</p>
          </div>
        </div>

        <nav className="flex-grow space-y-1">
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
        </nav>

        <div className="border-t border-border pt-4 space-y-1 mt-auto">
          <button className="w-full h-10 bg-primary text-primary-foreground font-semibold rounded-lg text-xs hover:bg-primary/95 transition-colors cursor-pointer mb-2">
            Generate Report
          </button>
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
            <h2 className="text-xl font-bold">Overview</h2>
          </div>

          <div className="flex items-center gap-6">
            {/* UI State Control Dropdown */}
            <div className="w-40">
              <Dropdown<AdminState>
                options={[
                  { value: "success", label: "State: Success" },
                  { value: "loading", label: "State: Loading" },
                  { value: "empty", label: "State: Empty" },
                ]}
                value={adminState}
                onChange={(val) => setAdminState(val)}
              />
            </div>

            <button className="text-muted-foreground hover:text-foreground p-2 rounded-full hover:bg-muted transition-colors relative cursor-pointer">
              <Bell className="h-5 w-5" />
            </button>
            <button className="text-muted-foreground hover:text-foreground p-2 rounded-full hover:bg-muted transition-colors relative cursor-pointer">
              <HelpCircle className="h-5 w-5" />
            </button>

            <div className="w-8 h-8 rounded-full bg-muted flex items-center justify-center text-xs font-bold border border-border">
              A
            </div>
          </div>
        </header>

        {/* Content Viewport */}
        <main className="flex-grow overflow-y-auto p-4 md:p-6 pb-24 md:pb-6 relative h-full bg-muted/20">
          <div className="max-w-6xl mx-auto space-y-6">

            {/* MOBILE ONLY: Top Header */}
            <div className="flex md:hidden justify-between items-center py-2 shrink-0">
              <div>
                <h1 className="text-2xl font-bold">CampusChain</h1>
                <p className="text-xs text-muted-foreground mt-0.5">University Admin Portal</p>
              </div>
              <div className="flex items-center gap-2">
                <div className="w-28">
                  <Dropdown<AdminState>
                    options={[
                      { value: "success", label: "Success" },
                      { value: "loading", label: "Loading" },
                      { value: "empty", label: "Empty" },
                    ]}
                    value={adminState}
                    onChange={(val) => setAdminState(val)}
                  />
                </div>
                <div className="w-8 h-8 rounded-full bg-muted flex items-center justify-center text-xs font-bold">
                  A
                </div>
              </div>
            </div>

            {/* 3. Stat Cards */}
            <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-6">
              {[
                { label: "Total Active Wallets", value: "12,450", unit: "" },
                { label: "Total Transaction Volume", value: "854,200", unit: "XLM" },
                { label: "CAMP in Circulation", value: "4.25M", unit: "CAMP" },
                { label: "Pending Scholarships", value: "12", unit: "", action: true },
              ].map((stat, i) => (
                <div key={i} className="bg-card border border-border rounded-xl p-5 shadow-sm flex flex-col justify-between h-28">
                  <p className="text-[10px] uppercase font-bold tracking-wider text-muted-foreground">
                    {stat.label}
                  </p>
                  
                  {adminState === "loading" ? (
                    <Skeleton className="h-7 w-24" />
                  ) : adminState === "empty" ? (
                    <p className="text-xl font-bold">0</p>
                  ) : (
                    <div className="flex justify-between items-center mt-2">
                      <p className="text-xl font-black tracking-tight">
                        {stat.value}{" "}
                        {stat.unit && <span className="text-[10px] text-muted-foreground font-semibold ml-0.5">{stat.unit}</span>}
                      </p>
                      {stat.action && (
                        <button className="bg-primary text-primary-foreground font-bold px-2.5 py-1 rounded text-[10px] uppercase tracking-wider hover:bg-primary/90 transition-colors cursor-pointer select-none">
                          Review
                        </button>
                      )}
                    </div>
                  )}
                </div>
              ))}
            </div>

            {/* Split Middle Area */}
            <div className="grid grid-cols-1 lg:grid-cols-3 gap-6">
              
              {/* Left Side: SVG line chart */}
              <div className="lg:col-span-2 bg-card border border-border rounded-xl p-5 shadow-sm min-h-[380px] flex flex-col justify-between">
                <div className="flex justify-between items-center mb-4">
                  <h3 className="text-sm font-bold text-foreground">Transaction Volume</h3>
                  <select className="border border-border bg-card text-foreground rounded text-[10px] font-bold py-1 px-2 focus:outline-none">
                    <option>Last 7 Days</option>
                    <option>Last 30 Days</option>
                  </select>
                </div>

                {adminState === "loading" ? (
                  <Skeleton className="flex-1 w-full rounded-lg" />
                ) : adminState === "empty" ? (
                  <div className="flex-1 flex items-center justify-center text-xs text-muted-foreground border border-dashed border-border rounded-lg bg-muted/20">
                    No volume logs recorded.
                  </div>
                ) : (
                  <div className="flex-1 border border-border/60 rounded-lg relative overflow-hidden bg-muted/10 p-2">
                    <div className="absolute inset-0 grid grid-rows-4 grid-cols-1 opacity-20">
                      <div className="border-b border-foreground"></div>
                      <div className="border-b border-foreground"></div>
                      <div className="border-b border-foreground"></div>
                      <div className="border-b border-foreground"></div>
                    </div>
                    {/* Simulated SVG Graph */}
                    <svg className="absolute inset-0 h-full w-full p-2" preserveAspectRatio="none" viewBox="0 0 100 100">
                      <polyline
                        fill="none"
                        points="0,80 20,60 40,75 60,30 80,45 100,20"
                        className="stroke-foreground"
                        strokeWidth="2"
                      />
                    </svg>
                  </div>
                )}
              </div>

              {/* Right Side: Token Issuance Panel */}
              <div className="bg-card border border-border rounded-xl p-5 shadow-sm flex flex-col justify-between">
                <div>
                  <h3 className="text-sm font-bold text-foreground">Token Issuance</h3>
                  <p className="text-[10px] text-muted-foreground mt-0.5">Issue custom CAMP tokens to specific user groups.</p>
                </div>

                <form onSubmit={handleIssueTokens} className="space-y-3.5 my-4">
                  <div>
                    <label className="block text-[10px] uppercase font-bold tracking-wider text-muted-foreground mb-1" htmlFor="recipient-select">
                      Recipient Group
                    </label>
                    <select
                      id="recipient-select"
                      value={recipient}
                      onChange={(e) => setRecipient(e.target.value)}
                      disabled={adminState === "loading" || issuing}
                      className="w-full border border-border bg-card rounded-lg py-2 px-3 text-xs focus:border-foreground focus:ring-1 focus:ring-foreground focus:outline-none"
                    >
                      <option value="all">All Students</option>
                      <option value="dept">Specific Department</option>
                      <option value="faculty">Faculty</option>
                    </select>
                  </div>

                  <div>
                    <label className="block text-[10px] uppercase font-bold tracking-wider text-muted-foreground mb-1" htmlFor="issuance-amount">
                      Amount (CAMP)
                    </label>
                    <input
                      id="issuance-amount"
                      type="number"
                      value={issueAmount}
                      onChange={(e) => setIssueAmount(e.target.value)}
                      placeholder="0"
                      required
                      disabled={adminState === "loading" || issuing}
                      className="w-full border border-border bg-card rounded-lg py-2 px-3 text-xs focus:border-foreground focus:ring-1 focus:ring-foreground focus:outline-none"
                    />
                  </div>

                  <div>
                    <label className="block text-[10px] uppercase font-bold tracking-wider text-muted-foreground mb-1" htmlFor="issuance-reason">
                      Reason
                    </label>
                    <textarea
                      id="issuance-reason"
                      value={issueReason}
                      onChange={(e) => setIssueReason(e.target.value)}
                      placeholder="e.g. Semester Stipend"
                      required
                      disabled={adminState === "loading" || issuing}
                      rows={2}
                      className="w-full border border-border bg-card rounded-lg py-2 px-3 text-xs focus:border-foreground focus:ring-1 focus:ring-foreground focus:outline-none resize-none"
                    />
                  </div>

                  {issueSuccess && (
                    <div className="p-2.5 bg-muted border border-border rounded-lg text-[10px] font-bold text-foreground text-center">
                      Successfully issued tokens!
                    </div>
                  )}

                  <button
                    type="submit"
                    disabled={adminState === "loading" || issuing}
                    className="w-full h-10 bg-primary text-primary-foreground font-semibold rounded-lg text-xs hover:bg-primary/95 flex items-center justify-center gap-2 active:scale-[0.99] disabled:opacity-85 disabled:cursor-not-allowed cursor-pointer"
                  >
                    {issuing ? (
                      <span className="w-3.5 h-3.5 border-2 border-primary-foreground border-t-transparent rounded-full animate-spin"></span>
                    ) : (
                      <span>Issue CAMP Tokens</span>
                    )}
                  </button>
                </form>
              </div>

            </div>

            {/* Merchant Onboarding Table */}
            <div className="bg-card border border-border rounded-xl p-5 shadow-sm">
              <div className="flex justify-between items-center mb-4">
                <h3 className="text-sm font-bold text-foreground">Merchant Onboarding</h3>
                <button className="text-xs font-bold uppercase tracking-wider text-muted-foreground hover:text-foreground cursor-pointer">
                  View All
                </button>
              </div>

              <div className="overflow-x-auto">
                <table className="w-full text-left border-collapse">
                  <thead>
                    <tr className="border-b border-border text-[10px] font-bold text-muted-foreground uppercase tracking-wider select-none">
                      <th className="py-3 px-2">Merchant Name</th>
                      <th className="py-3 px-2">Category</th>
                      <th className="py-3 px-2">Status</th>
                      <th className="py-3 px-2 text-right pr-4">Action</th>
                    </tr>
                  </thead>
                  <tbody className="divide-y divide-border/60 text-xs">
                    {adminState === "loading" ? (
                      [1, 2].map((i) => (
                        <tr key={i}>
                          <td className="py-3 px-2"><Skeleton className="h-4 w-32" /></td>
                          <td className="py-3 px-2"><Skeleton className="h-4 w-12" /></td>
                          <td className="py-3 px-2"><Skeleton className="h-4 w-16" /></td>
                          <td className="py-3 px-2 text-right pr-4"><Skeleton className="h-4 w-16 ml-auto" /></td>
                        </tr>
                      ))
                    ) : adminState === "empty" || merchants.length === 0 ? (
                      <tr>
                        <td colSpan={4} className="py-8 text-center text-xs text-muted-foreground">
                          No merchants awaiting onboarding review.
                        </td>
                      </tr>
                    ) : (
                      merchants.map((merchant) => (
                        <tr key={merchant.id} className="hover:bg-muted/15 transition-colors">
                          <td className="py-3 px-2 font-bold text-foreground">{merchant.name}</td>
                          <td className="py-3 px-2">
                            <span className="bg-muted text-muted-foreground border border-border px-2 py-0.5 rounded text-[10px] font-semibold">
                              {merchant.category}
                            </span>
                          </td>
                          <td className="py-3 px-2">
                            <span className="inline-flex items-center gap-1 bg-muted/65 border border-border px-2 py-0.5 rounded-full text-[10px] font-bold">
                              <span className={`w-1.5 h-1.5 rounded-full ${
                                merchant.status === "Active" ? "bg-primary" : "bg-muted-foreground"
                              }`}></span>
                              <span>{merchant.status}</span>
                            </span>
                          </td>
                          <td className="py-3 px-2 text-right pr-4">
                            {merchant.status === "Pending" ? (
                              <button
                                onClick={() => handleApproveMerchant(merchant.id)}
                                className="bg-primary text-primary-foreground font-bold px-3 py-1.5 rounded-lg text-[10px] uppercase tracking-wider hover:bg-primary/95 transition-all cursor-pointer"
                              >
                                Approve
                              </button>
                            ) : (
                              <button className="border border-border text-foreground font-bold px-3 py-1.5 rounded-lg text-[10px] uppercase tracking-wider hover:bg-accent transition-all cursor-pointer">
                                Manage
                              </button>
                            )}
                          </td>
                        </tr>
                      ))
                    )}
                  </tbody>
                </table>
              </div>
            </div>

          </div>
        </main>
      </div>

      {/* 5. Mobile Bottom Tab navigation */}
      <nav className="lg:hidden fixed bottom-0 left-0 right-0 h-20 bg-card border-t border-border z-45 flex justify-around items-center px-2 shadow-lg">
        {[
          { label: "Home", icon: LayoutDashboard, active: true },
          { label: "Students", icon: Users, active: false },
          { label: "Stores", icon: Store, active: false },
          { label: "Finance", icon: Coins, active: false },
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

export default AdminDashboard;
