"use client";

import { useState } from "react";
import { useWallet } from "@/shared/stellar/useWallet";
import { Skeleton } from "@/shared/ui/Skeleton";
import { Dropdown } from "@/shared/ui/Dropdown";
import {
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
  category: string;
  sellerName: string;
  sellerInitials: string;
  priceCamp: string;
  priceXlm: string;
  escrow: boolean;
  icon: React.ComponentType<React.SVGProps<SVGSVGElement>>;
}

const mockListings: ListingItem[] = [
  {
    id: "1",
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
    id: "2",
    title: "Microeconomics Notes Y1 (Term 1)",
    category: "Notes",
    sellerName: "Sarah K.",
    sellerInitials: "SK",
    priceCamp: "15 CAMP",
    priceXlm: "~1.7 XLM",
    escrow: false,
    icon: FileText,
  },
  {
    id: "3",
    title: "Sony WH-1000XM4 Headphones",
    category: "Electronics",
    sellerName: "Mark T.",
    sellerInitials: "MT",
    priceCamp: "650 CAMP",
    priceXlm: "~75 XLM",
    escrow: true,
    icon: Smartphone,
  },
  {
    id: "4",
    title: "Organic Chemistry Lab Coat (Medium)",
    category: "Others",
    sellerName: "Elena R.",
    sellerInitials: "ER",
    priceCamp: "25 CAMP",
    priceXlm: "~2.8 XLM",
    escrow: true,
    icon: FlaskConical,
  },
  {
    id: "5",
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

interface MarketplaceGridProps {
  onSelectItem: (id: string) => void;
  onSellItem: () => void;
}

export function MarketplaceGrid({ onSelectItem, onSellItem }: MarketplaceGridProps) {
  const { address } = useWallet();
  const [marketState, setMarketState] = useState<MarketState>("success");
  const [searchQuery, setSearchQuery] = useState("");
  const [selectedCategory, setSelectedCategory] = useState<string>("Books");
  const [sortOption, setSortOption] = useState<string>("newest");

  const categories = ["Books", "Electronics", "Notes", "Hostel Items", "Others"];

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
    <div className="w-full space-y-6">
      {/* Search and Filters Header */}
      <div className="flex flex-col md:flex-row gap-4 items-center justify-between">
        <div className="relative w-full md:w-80">
          <Search className="absolute left-3 top-1/2 -translate-y-1/2 h-4 w-4 text-muted-foreground" />
          <input
            type="text"
            value={searchQuery}
            onChange={(e) => setSearchQuery(e.target.value)}
            placeholder="Search marketplace..."
            className="w-full pl-9 pr-4 py-2 bg-card border border-border rounded-lg text-sm placeholder:text-muted-foreground/60 focus:border-foreground focus:ring-1 focus:ring-foreground focus:outline-none transition-colors"
          />
        </div>

        <div className="flex gap-2 w-full md:w-auto">
          <div className="w-36">
            <Dropdown<MarketState>
              options={[
                { value: "success", label: "State: Loaded" },
                { value: "loading", label: "State: Loading" },
                { value: "empty", label: "State: Empty" },
              ]}
              value={marketState}
              onChange={(val) => setMarketState(val)}
            />
          </div>
        </div>
      </div>

      {/* Category Pills Selector */}
      <div className="flex gap-2 overflow-x-auto pb-2 border-b border-border scrollbar-none">
        {categories.map((cat) => (
          <button
            key={cat}
            onClick={() => setSelectedCategory(cat)}
            className={`px-4 py-1.5 rounded-full text-xs font-semibold whitespace-nowrap transition-all border cursor-pointer ${
              selectedCategory === cat
                ? "bg-primary text-primary-foreground border-primary"
                : "bg-card text-muted-foreground border-border hover:border-foreground"
            }`}
          >
            {cat}
          </button>
        ))}
      </div>

      {/* Content Rendering Grid */}
      {marketState === "loading" ? (
        <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 gap-6">
          {[1, 2, 3].map((i) => (
            <div key={i} className="bg-card border border-border rounded-xl p-5 space-y-4">
              <Skeleton className="h-6 w-3/4" />
              <Skeleton className="h-32 w-full rounded" />
              <div className="flex justify-between">
                <Skeleton className="h-4 w-16" />
                <Skeleton className="h-4 w-12" />
              </div>
            </div>
          ))}
        </div>
      ) : marketState === "empty" || filteredListings.length === 0 ? (
        <div className="p-16 text-center bg-card border border-border rounded-xl flex flex-col items-center justify-center gap-3">
          <PackageOpen className="h-10 w-10 text-muted-foreground/50" />
          <h3 className="text-base font-bold text-foreground">No listings found</h3>
          <p className="text-xs text-muted-foreground max-w-xs leading-relaxed">
            There are no active listings under this category. Be the first to create one!
          </p>
        </div>
      ) : (
        <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 gap-6">
          {filteredListings.map((item) => {
            const ItemIcon = item.icon;
            return (
              <article
                key={item.id}
                onClick={() => onSelectItem(item.id)}
                className="bg-card border border-border rounded-xl hover:border-foreground hover:shadow-md transition-all flex flex-col justify-between overflow-hidden cursor-pointer group"
              >
                <div className="p-5 flex-1 flex flex-col justify-between">
                  <div>
                    <div className="flex justify-between items-start gap-4 mb-3">
                      <h4 className="text-sm font-bold text-foreground group-hover:text-primary transition-colors line-clamp-2 leading-snug">
                        {item.title}
                      </h4>
                      {item.escrow && (
                        <span
                          className="px-2 py-0.5 rounded-full bg-blue-500/10 text-blue-600 text-[9px] font-bold border border-blue-500/20 flex items-center gap-1 shrink-0"
                          title="Safe escrow payments"
                        >
                          <Lock className="h-2.5 w-2.5" />
                          Escrow
                        </span>
                      )}
                    </div>

                    <div className="w-full aspect-[4/3] bg-muted/30 rounded-lg flex items-center justify-center text-muted-foreground/80 mb-4 border border-border/40">
                      <ItemIcon className="h-12 w-12 stroke-[1.2]" />
                    </div>
                  </div>

                  <div className="flex items-center justify-between border-t border-border/60 pt-4">
                    <div className="flex items-center gap-2 min-w-0">
                      <div className="w-7 h-7 rounded-full bg-secondary text-secondary-foreground flex items-center justify-center font-bold text-[10px] shrink-0">
                        {item.sellerInitials}
                      </div>
                      <span className="text-[10px] text-muted-foreground truncate">{item.sellerName}</span>
                    </div>
                    <div className="text-right shrink-0">
                      <div className="text-sm font-extrabold text-foreground">{item.priceCamp}</div>
                      <div className="text-[10px] text-muted-foreground">{item.priceXlm}</div>
                    </div>
                  </div>
                </div>
              </article>
            );
          })}
        </div>
      )}

      {/* Floating Action Button (+ Sell Item) */}
      <button
        onClick={onSellItem}
        className="fixed bottom-24 md:bottom-8 right-6 bg-primary text-primary-foreground rounded-full px-5 py-3 shadow-lg flex items-center gap-2 hover:bg-primary/95 transition-transform active:scale-95 z-40 cursor-pointer group"
      >
        <Plus className="h-4 w-4" />
        <span className="text-sm font-bold">Sell Item</span>
      </button>
    </div>
  );
}
export default MarketplaceGrid;
