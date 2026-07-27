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
  Plus,
  BookOpen,
  Smartphone,
  FileText,
  FlaskConical,
  Lock,
  PackageOpen,
} from "lucide-react";

type MarketState = "success" | "loading" | "empty";

interface ListingItem {
  id: string;
  title: string;
  category: "Books" | "Electronics" | "Notes" | "Others";
  sellerName: string;
  sellerInitials: string;
  priceCamp: string;
  priceXlm: string;
  escrow: boolean;
  icon: React.ComponentType<React.SVGProps<SVGSVGElement>>;
}

const mockListings: ListingItem[] = [
  {
    id: "lst1",
    title: "Introduction to Algorithms, 3rd Edition",
    category: "Books",
    sellerName: "Alex Chen",
    sellerInitials: "AC",
    priceCamp: "45 CAMP",
    priceXlm: "~5.2 XLM",
    escrow: true,
    icon: BookOpen,
  },
  {
    id: "lst2",
    title: "Microeconomics Notes Y1 (Term 1)",
    category: "Notes",
    sellerName: "Sarah K.",
    sellerInitials: "SK",
    priceCamp: "15 CAMP",
    priceXlm: "~1.7 XLM",
    escrow: true,
    icon: FileText,
  },
  {
    id: "lst3",
    title: "Organic Chem Lab Kit (Complete)",
    category: "Others",
    sellerName: "Mark T.",
    sellerInitials: "MT",
    priceCamp: "60 CAMP",
    priceXlm: "~6.9 XLM",
    escrow: true,
    icon: FlaskConical,
  },
  {
    id: "lst4",
    title: "Art History Reader V2 (Annotated)",
    category: "Books",
    sellerName: "Elena R.",
    sellerInitials: "ER",
    priceCamp: "25 CAMP",
    priceXlm: "~2.8 XLM",
    escrow: true,
    icon: BookOpen,
  },
  {
    id: "lst5",
    title: "TI-84 Plus CE Graphing Calculator",
    category: "Electronics",
    sellerName: "John Doe",
    sellerInitials: "JD",
    priceCamp: "350 CAMP",
    priceXlm: "~40 XLM",
    escrow: true,
    icon: Smartphone,
  },
];

export function MarketplaceGrid() {
  const { disconnect } = useWallet();
  const [marketState, setMarketState] = useState<MarketState>("success");
  const [searchQuery, setSearchQuery] = useState("");
  const [selectedCategory, setSelectedCategory] = useState<string>("Books");
  const [sortOption, setSortOption] = useState<string>("newest");

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

  const categories = ["Books", "Electronics", "Notes", "Hostel Items", "Others"];

  // Filter listings based on query, category, and state
  const filteredListings = mockListings.filter((item) => {
    if (selectedCategory && item.category !== selectedCategory) return false;
    if (
      searchQuery &&
      !item.title.toLowerCase().includes(searchQuery.toLowerCase()) &&
      !item.sellerName.toLowerCase().includes(searchQuery.toLowerCase())
    ) {
      return false;
    }
    return true;
  });

  return (
    <div className="flex h-screen w-full bg-background text-foreground overflow-hidden">
      {/* 1. Desktop Sidebar Navigation */}
      <nav className="hidden md:flex flex-col w-64 bg-card border-r border-border h-full fixed left-0 top-0 py-6 px-4 z-40">
        <div className="flex items-center gap-3 mb-4 px-2">
          <div className="w-10 h-10 rounded-full bg-muted flex items-center justify-center font-semibold text-foreground">
            CC
          </div>
          <div>
            <h1 className="text-lg font-bold leading-tight">CampusChain</h1>
            <p className="text-xs text-muted-foreground">University Infrastructure</p>
          </div>
        </div>

        <button className="w-full bg-primary text-primary-foreground font-semibold py-2.5 rounded-lg flex items-center justify-center gap-2 mb-6 hover:bg-primary/95 transition-colors text-sm cursor-pointer shadow-sm">
          <Plus className="h-4 w-4" />
          New Transaction
        </button>

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
          <div className="flex items-center gap-4 flex-1">
            <h2 className="text-xl font-bold">Marketplace</h2>
            <div className="relative w-64">
              <Search className="absolute left-3 top-1/2 -translate-y-1/2 h-4 w-4 text-muted-foreground" />
              <input
                type="text"
                value={searchQuery}
                onChange={(e) => setSearchQuery(e.target.value)}
                placeholder="Search marketplace..."
                className="w-full pl-9 pr-4 py-1.5 bg-muted/40 border border-border rounded-lg text-sm placeholder:text-muted-foreground/60 focus:border-foreground focus:ring-1 focus:ring-foreground focus:outline-none transition-colors"
              />
            </div>
          </div>

          <div className="flex items-center gap-6">
            {/* UI State Control Dropdown */}
            <div className="w-40">
              <Dropdown<MarketState>
                options={[
                  { value: "success", label: "State: Success" },
                  { value: "loading", label: "State: Loading" },
                  { value: "empty", label: "State: Empty" },
                ]}
                value={marketState}
                onChange={(val) => setMarketState(val)}
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
          <div className="max-w-5xl mx-auto space-y-6">
            
            {/* MOBILE ONLY: Top Header Bar */}
            <div className="flex md:hidden justify-between items-center py-2 shrink-0">
              <div>
                <h1 className="text-2xl font-bold">Marketplace</h1>
                <p className="text-xs text-muted-foreground mt-0.5">
                  Browse peer-to-peer campus listings.
                </p>
              </div>
              <div className="flex items-center gap-2">
                <div className="w-28">
                  <Dropdown<MarketState>
                    options={[
                      { value: "success", label: "Success" },
                      { value: "loading", label: "Loading" },
                      { value: "empty", label: "Empty" },
                    ]}
                    value={marketState}
                    onChange={(val) => setMarketState(val)}
                  />
                </div>
                <div className="w-8 h-8 rounded-full bg-muted flex items-center justify-center text-xs font-bold">
                  JD
                </div>
              </div>
            </div>

            {/* MOBILE ONLY Search & Filter Row */}
            <div className="flex md:hidden flex-col gap-3">
              <div className="relative w-full">
                <Search className="absolute left-3 top-1/2 -translate-y-1/2 h-4 w-4 text-muted-foreground" />
                <input
                  type="text"
                  value={searchQuery}
                  onChange={(e) => setSearchQuery(e.target.value)}
                  placeholder="Search textbooks, electronics..."
                  className="w-full pl-9 pr-4 py-2.5 bg-card border border-border rounded-xl text-sm placeholder:text-muted-foreground/60 focus:border-foreground focus:ring-1 focus:ring-foreground focus:outline-none transition-colors"
                />
              </div>
              
              <div className="flex gap-3 w-full">
                <div className="flex-1">
                  <Dropdown<string>
                    options={[
                      { value: "Books", label: "Books" },
                      { value: "Electronics", label: "Electronics" },
                      { value: "Notes", label: "Notes" },
                      { value: "Others", label: "Others" },
                    ]}
                    value={selectedCategory}
                    onChange={(val) => setSelectedCategory(val)}
                  />
                </div>
                <div className="flex-1">
                  <Dropdown<string>
                    options={[
                      { value: "newest", label: "Sort: Newest" },
                      { value: "low-high", label: "Sort: Price (Low-High)" },
                      { value: "high-low", label: "Sort: Price (High-Low)" },
                    ]}
                    value={sortOption}
                    onChange={(val) => setSortOption(val)}
                  />
                </div>
              </div>
            </div>

            {/* Desktop Filters: Category chips and sorting dropdown */}
            <div className="hidden md:flex justify-between items-center border-b border-border pb-4 shrink-0">
              <div className="flex overflow-x-auto gap-2 hide-scrollbar">
                {categories.map((cat) => (
                  <button
                    key={cat}
                    onClick={() => setSelectedCategory(cat)}
                    className={`px-4 py-1.5 rounded-full text-xs font-semibold border transition-all cursor-pointer ${
                      selectedCategory === cat
                        ? "bg-primary text-primary-foreground border-primary"
                        : "bg-card text-muted-foreground border-border hover:bg-muted"
                    }`}
                  >
                    {cat}
                  </button>
                ))}
              </div>

              <div className="w-48">
                <Dropdown<string>
                  options={[
                    { value: "newest", label: "Sort: Newest" },
                    { value: "low-high", label: "Sort: Price (Low to High)" },
                    { value: "high-low", label: "Sort: Price (High to Low)" },
                  ]}
                  value={sortOption}
                  onChange={(val) => setSortOption(val)}
                />
              </div>
            </div>

            {/* Mobile Category chips */}
            <div className="flex md:hidden gap-2 overflow-x-auto pb-1 shrink-0 hide-scrollbar">
              {categories.map((cat) => (
                <button
                  key={cat}
                  onClick={() => setSelectedCategory(cat)}
                  className={`px-4 py-1.5 rounded-full text-xs font-semibold border transition-all shrink-0 cursor-pointer ${
                    selectedCategory === cat
                      ? "bg-primary text-primary-foreground border-primary"
                      : "bg-card text-muted-foreground border-border hover:bg-muted"
                  }`}
                >
                  {cat}
                </button>
              ))}
            </div>

            {/* Listing Grid */}
            {marketState === "loading" ? (
              <div className="grid grid-cols-2 md:grid-cols-3 lg:grid-cols-4 gap-4">
                {[1, 2, 3, 4, 5, 6].map((i) => (
                  <div key={i} className="bg-card border border-border rounded-xl p-3 space-y-3">
                    <Skeleton className="w-full aspect-square rounded-lg" />
                    <Skeleton className="h-4 w-32" />
                    <div className="flex gap-2">
                      <Skeleton className="w-4 h-4 rounded-full" />
                      <Skeleton className="h-3 w-16" />
                    </div>
                    <Skeleton className="h-5 w-24" />
                  </div>
                ))}
              </div>
            ) : marketState === "empty" || filteredListings.length === 0 ? (
              <div className="p-16 border border-border rounded-xl bg-card text-center flex flex-col items-center justify-center gap-3">
                <PackageOpen className="h-12 w-12 text-muted-foreground/50" />
                <h3 className="text-md font-bold">No Listings Found</h3>
                <p className="text-xs text-muted-foreground max-w-[260px] mx-auto leading-relaxed">
                  We couldn&apos;t find any items matching your selected filters or search parameters.
                </p>
              </div>
            ) : (
              <div className="grid grid-cols-2 md:grid-cols-3 lg:grid-cols-4 gap-4">
                {filteredListings.map((item) => {
                  const ItemIcon = item.icon;
                  return (
                    <article
                      key={item.id}
                      className="bg-card border border-border rounded-xl p-3 shadow-sm flex flex-col hover:border-primary transition-all duration-200 cursor-pointer group"
                    >
                      <div className="w-full aspect-square bg-muted rounded-lg mb-3 flex items-center justify-center group-hover:bg-muted/70 transition-colors">
                        <ItemIcon className="h-10 w-10 text-muted-foreground group-hover:scale-105 transition-transform" />
                      </div>

                      <h3 className="text-xs font-bold text-foreground line-clamp-2 mb-1.5 leading-tight group-hover:text-primary transition-colors">
                        {item.title}
                      </h3>

                      <div className="flex items-center gap-1.5 mb-3 mt-auto">
                        <div className="w-4 h-4 rounded-full bg-secondary flex items-center justify-center font-bold text-[8px] text-secondary-foreground shrink-0 select-none">
                          {item.sellerInitials}
                        </div>
                        <span className="text-[10px] text-muted-foreground truncate">{item.sellerName}</span>
                      </div>

                      <div className="flex items-baseline gap-1 mb-1">
                        <span className="text-sm font-bold text-foreground">{item.priceCamp}</span>
                        <span className="text-[10px] text-muted-foreground">{item.priceXlm}</span>
                      </div>

                      {item.escrow && (
                        <div className="flex items-center gap-1 text-muted-foreground">
                          <Lock className="h-3 w-3" />
                          <span className="text-[9px] uppercase tracking-wider font-bold">Escrow Protected</span>
                        </div>
                      )}
                    </article>
                  );
                })}
              </div>
            )}
          </div>
        </main>
      </div>

      {/* Floating Action Button (+ Sell Item) */}
      <button className="fixed bottom-24 md:bottom-8 right-6 bg-primary text-primary-foreground rounded-full px-5 py-3 shadow-lg flex items-center gap-2 hover:bg-primary/95 transition-transform active:scale-95 z-40 cursor-pointer group">
        <Plus className="h-4 w-4" />
        <span className="text-sm font-bold">Sell Item</span>
        
        {/* Desktop Tooltip */}
        <span className="absolute right-24 bg-card text-foreground px-3 py-1.5 rounded shadow text-xs font-semibold opacity-0 group-hover:opacity-100 transition-opacity duration-200 whitespace-nowrap pointer-events-none border border-border hidden md:inline">
          List a new item
        </span>
      </button>

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
export default MarketplaceGrid;
