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
  Search,
  Download,
  ArrowDown,
  Trophy,
  Coffee,
  Copy,
  ExternalLink,
  Check,
  History,
} from "lucide-react";

type TxState = "success" | "loading" | "empty";

interface TransactionItem {
  id: string;
  entityName: string;
  memo: string;
  type: "payment" | "receive" | "reward" | "dining";
  amount: string;
  time: string;
  hash: string;
  fee: string;
  ledger: string;
  icon: React.ComponentType<React.SVGProps<SVGSVGElement>>;
}

interface DateGroup {
  groupTitle: string;
  transactions: TransactionItem[];
}

const mockGroups: DateGroup[] = [
  {
    groupTitle: "TODAY",
    transactions: [
      {
        id: "tx-1",
        entityName: "University Bookstore",
        memo: "Course Materials Payment",
        type: "payment",
        amount: "-145.50 CAMP",
        time: "10:42 AM",
        hash: "a1b2c3d4e5f6g7h8i9j0k1l2m3n4o5p6q7r8s9t0u1v2w3x4y5z6a7b8c9d0e1f2",
        fee: "0.00001 XLM",
        ledger: "45098231",
        icon: Store,
      },
      {
        id: "tx-2",
        entityName: "Sarah Jenkins",
        memo: "P2P Transfer",
        type: "receive",
        amount: "+25.00 CAMP",
        time: "08:15 AM",
        hash: "f2e1d0c9b8a7z6y5x4w3v2u1t0s9r8q7p6o5n4m3l2k1j0i9h8g7f6e5d4c3b2a1",
        fee: "0.00001 XLM",
        ledger: "45098211",
        icon: ArrowDown,
      },
    ],
  },
  {
    groupTitle: "YESTERDAY",
    transactions: [
      {
        id: "tx-3",
        entityName: "Wellness Program",
        memo: "10k Steps Milestone Reward",
        type: "reward",
        amount: "+50.00 CAMP",
        time: "06:30 PM",
        hash: "b8c7d6e5f4g3h2i1j0k9l8m7n6o5p4q3r2s1t0u9v8w7x6y5z4a3b2c1d0e9f8g7",
        fee: "0.00001 XLM",
        ledger: "45091102",
        icon: Trophy,
      },
      {
        id: "tx-4",
        entityName: "Campus Cafe",
        memo: "Dining Services",
        type: "dining",
        amount: "-15.00 CAMP",
        time: "08:45 AM",
        hash: "q1w2e3r4t5y6u7i8o9p0a1s2d3f4g5h6j7k8l9z0x1c2v3b4n5m6q7w8e9r0t1y2",
        fee: "0.00001 XLM",
        ledger: "45091001",
        icon: Coffee,
      },
    ],
  },
];

export function TransactionHistory() {
  const { disconnect } = useWallet();
  const [txState, setTxState] = useState<TxState>("success");
  const [searchQuery, setSearchQuery] = useState("");
  const [dateRange, setDateRange] = useState("30");
  const [txType, setTxType] = useState("all");
  const [expandedTxId, setExpandedTxId] = useState<string | null>(null);
  const [copiedId, setCopiedId] = useState<string | null>(null);

  // Toggle detail rows
  const handleToggleDetails = (id: string) => {
    setExpandedTxId(expandedTxId === id ? null : id);
  };

  const handleCopyHash = (e: React.MouseEvent, id: string, hash: string) => {
    e.stopPropagation();
    navigator.clipboard.writeText(hash);
    setCopiedId(id);
    setTimeout(() => setCopiedId(null), 2000);
  };

  // Filter groups
  const filteredGroups = mockGroups
    .map((group) => {
      const filteredTxs = group.transactions.filter((tx) => {
        if (txType !== "all" && tx.type !== txType) return false;
        if (
          searchQuery &&
          !tx.entityName.toLowerCase().includes(searchQuery.toLowerCase()) &&
          !tx.memo.toLowerCase().includes(searchQuery.toLowerCase()) &&
          !tx.hash.toLowerCase().includes(searchQuery.toLowerCase())
        ) {
          return false;
        }
        return true;
      });
      return { ...group, transactions: filteredTxs };
    })
    .filter((group) => group.transactions.length > 0);

  // Navigation items for the sidebar (desktop)
  const navItems = [
    { label: "Dashboard", icon: LayoutDashboard, href: "#", active: false },
    { label: "Wallet", icon: Wallet, href: "#", active: false },
    { label: "Pay (QR)", icon: Coins, href: "#", active: false },
    { label: "Marketplace", icon: Store, href: "#", active: false },
    { label: "Events", icon: Calendar, href: "#", active: false },
    { label: "Rewards", icon: Award, href: "#", active: false },
    { label: "Scholarships", icon: GraduationCap, href: "#", active: false },
    { label: "Transactions", icon: Receipt, href: "#", active: true },
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
        <header className="hidden md:flex justify-between items-center h-16 border-b border-border bg-card px-6 sticky top-0 z-30 shrink-0">
          <h2 className="text-xl font-bold">Transaction History</h2>

          <div className="flex items-center gap-6">
            {/* State Switcher Dropdown */}
            <div className="w-40">
              <Dropdown<TxState>
                options={[
                  { value: "success", label: "State: Success" },
                  { value: "loading", label: "State: Loading" },
                  { value: "empty", label: "State: Empty" },
                ]}
                value={txState}
                onChange={(val) => setTxState(val)}
              />
            </div>

            <div className="flex items-center gap-3">
              <div className="w-8 h-8 rounded-full bg-muted flex items-center justify-center text-xs font-bold select-none cursor-pointer">
                JS
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
          <div className="max-w-4xl mx-auto space-y-6">

            {/* MOBILE ONLY: Top Header */}
            <div className="flex md:hidden justify-between items-center py-2 shrink-0">
              <div>
                <h1 className="text-2xl font-bold">Transactions</h1>
                <p className="text-xs text-muted-foreground mt-0.5">Review ledger entries</p>
              </div>
              <div className="flex items-center gap-2">
                <div className="w-28">
                  <Dropdown<TxState>
                    options={[
                      { value: "success", label: "Success" },
                      { value: "loading", label: "Loading" },
                      { value: "empty", label: "Empty" },
                    ]}
                    value={txState}
                    onChange={(val) => setTxState(val)}
                  />
                </div>
                <div className="w-8 h-8 rounded-full bg-muted flex items-center justify-center text-xs font-bold">
                  JS
                </div>
              </div>
            </div>

            {/* Filters Row */}
            <div className="flex flex-col sm:flex-row items-center justify-between gap-4 bg-card p-3 rounded-xl border border-border shadow-sm shrink-0">
              <div className="flex flex-col sm:flex-row items-center gap-3 flex-grow w-full">
                {/* Search */}
                <div className="relative w-full sm:w-64">
                  <Search className="absolute left-3 top-1/2 -translate-y-1/2 h-4 w-4 text-muted-foreground" />
                  <input
                    type="text"
                    value={searchQuery}
                    onChange={(e) => setSearchQuery(e.target.value)}
                    placeholder="Search hash, entity..."
                    className="w-full pl-9 pr-3 py-1.5 bg-muted/40 border border-border rounded-lg text-xs placeholder:text-muted-foreground/60 focus:border-foreground focus:ring-1 focus:ring-foreground focus:outline-none"
                  />
                </div>
                {/* Date Dropdown */}
                <div className="w-full sm:w-40">
                  <Dropdown<string>
                    options={[
                      { value: "30", label: "Last 30 Days" },
                      { value: "60", label: "Last 60 Days" },
                      { value: "90", label: "Last 90 Days" },
                    ]}
                    value={dateRange}
                    onChange={(val) => setDateRange(val)}
                  />
                </div>
                {/* Type Dropdown */}
                <div className="w-full sm:w-40">
                  <Dropdown<string>
                    options={[
                      { value: "all", label: "All Types" },
                      { value: "payment", label: "Payments" },
                      { value: "receive", label: "Receives" },
                      { value: "reward", label: "Rewards" },
                      { value: "dining", label: "Dining" },
                    ]}
                    value={txType}
                    onChange={(val) => setTxType(val)}
                  />
                </div>
              </div>
              
              {/* Export Button */}
              <button className="w-full sm:w-auto h-9 bg-card border border-border text-foreground hover:bg-accent font-semibold px-4 rounded-lg text-xs transition-colors flex items-center justify-center gap-1.5 cursor-pointer">
                <Download className="h-4 w-4" />
                <span>Export CSV</span>
              </button>
            </div>

            {/* Content Lists */}
            {txState === "loading" ? (
              <div className="space-y-6">
                {[1, 2].map((group) => (
                  <div key={group} className="space-y-3">
                    <Skeleton className="h-4 w-16" />
                    <Skeleton className="h-16 w-full rounded-xl" />
                    <Skeleton className="h-16 w-full rounded-xl" />
                  </div>
                ))}
              </div>
            ) : txState === "empty" || filteredGroups.length === 0 ? (
              <div className="p-16 border border-border rounded-xl bg-card text-center flex flex-col items-center justify-center gap-3 shadow-sm">
                <History className="h-12 w-12 text-muted-foreground/50" />
                <h3 className="text-md font-bold">No Transactions</h3>
                <p className="text-xs text-muted-foreground max-w-[260px] mx-auto leading-relaxed">
                  There are no ledger entries recorded on-chain matching your filter options.
                </p>
              </div>
            ) : (
              <div className="space-y-8">
                {filteredGroups.map((group) => (
                  <section key={group.groupTitle} className="space-y-3">
                    <h3 className="text-[10px] font-bold uppercase tracking-widest text-muted-foreground px-1">
                      {group.groupTitle}
                    </h3>
                    
                    <div className="space-y-2">
                      {group.transactions.map((tx) => {
                        const TxIcon = tx.icon;
                        const isExpanded = expandedTxId === tx.id;
                        
                        return (
                          <div
                            key={tx.id}
                            onClick={() => handleToggleDetails(tx.id)}
                            className="bg-card border border-border rounded-xl p-4 hover:border-foreground/35 transition-all duration-200 cursor-pointer shadow-sm"
                          >
                            <div className="flex justify-between items-center">
                              <div className="flex items-center gap-3 min-w-0">
                                <div className="w-10 h-10 rounded-full bg-muted flex items-center justify-center text-foreground shrink-0 border border-border">
                                  <TxIcon className="h-4.5 w-4.5" />
                                </div>
                                <div className="min-w-0">
                                  <p className="text-sm font-bold truncate leading-snug">{tx.entityName}</p>
                                  <p className="text-xs text-muted-foreground truncate">{tx.memo}</p>
                                </div>
                              </div>

                              <div className="text-right shrink-0">
                                <p className={`text-sm font-bold ${
                                  tx.amount.startsWith("+") ? "text-foreground" : "text-foreground"
                                }`}>
                                  {tx.amount}
                                </p>
                                <p className="text-[10px] text-muted-foreground mt-0.5">{tx.time}</p>
                              </div>
                            </div>

                            {/* Collapsible Details */}
                            {isExpanded && (
                              <div className="mt-4 pt-4 border-t border-border space-y-3 animate-in slide-in-from-top-1 duration-200">
                                <div className="flex justify-between items-center bg-muted/50 p-2 rounded-lg border border-border">
                                  <div className="flex flex-col min-w-0 pr-4">
                                    <span className="text-[9px] uppercase font-bold tracking-wider text-muted-foreground mb-0.5">
                                      Stellar Transaction Hash
                                    </span>
                                    <span className="text-[10px] text-foreground font-mono truncate select-all">
                                      {tx.hash}
                                    </span>
                                  </div>

                                  <div className="flex gap-1 shrink-0">
                                    <button
                                      onClick={(e) => handleCopyHash(e, tx.id, tx.hash)}
                                      className="p-1.5 bg-card border border-border rounded-md text-muted-foreground hover:text-foreground transition-colors cursor-pointer"
                                      title="Copy Hash"
                                    >
                                      {copiedId === tx.id ? (
                                        <Check className="h-3.5 w-3.5 text-emerald-600" />
                                      ) : (
                                        <Copy className="h-3.5 w-3.5" />
                                      )}
                                    </button>
                                    <button
                                      onClick={(e) => e.stopPropagation()}
                                      className="p-1.5 bg-card border border-border rounded-md text-muted-foreground hover:text-foreground transition-colors cursor-pointer"
                                      title="View on Explorer"
                                    >
                                      <ExternalLink className="h-3.5 w-3.5" />
                                    </button>
                                  </div>
                                </div>

                                <div className="flex gap-4 text-[10px] font-bold uppercase tracking-wider text-muted-foreground pl-1">
                                  <span>Fee: {tx.fee}</span>
                                  <span>•</span>
                                  <span>Ledger: {tx.ledger}</span>
                                </div>
                              </div>
                            )}

                          </div>
                        );
                      })}
                    </div>
                  </section>
                ))}
              </div>
            )}

            {/* Load More Button */}
            {txState === "success" && filteredGroups.length > 0 && (
              <div className="flex justify-center pt-6 pb-4">
                <button className="px-6 py-2 border border-border rounded-full text-foreground font-bold hover:bg-accent transition-colors bg-card text-xs">
                  Load More Transactions
                </button>
              </div>
            )}

          </div>
        </main>
      </div>

      {/* 4. Mobile Bottom Navigation Bar */}
      <nav className="lg:hidden fixed bottom-0 left-0 right-0 h-20 bg-card border-t border-border z-45 flex justify-around items-center px-2 shadow-lg">
        {[
          { label: "Dashboard", icon: LayoutDashboard, active: false },
          { label: "Wallet", icon: Wallet, active: false },
          { label: "Pay", icon: Coins, active: false },
          { label: "Market", icon: Store, active: false },
          { label: "History", icon: Receipt, active: true },
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
export default TransactionHistory;
