"use client";

import { useMemo, useState } from "react";
import { BookOpen, FileText, FlaskConical, Lock, PackageOpen, Plus, Search, Smartphone } from "lucide-react";
import { Skeleton } from "@/shared/ui/Skeleton";
import { useMarketplaceListings } from "@/features/marketplace/hooks/useMarketplace";

const categories = ["All", "Books", "Electronics", "Notes", "Hostel Items", "Others"];
const categoryName: Record<number, string> = { 1: "Books", 2: "Electronics", 3: "Notes", 4: "Hostel Items", 5: "Others" };
const categoryIcon: Record<number, React.ComponentType<React.SVGProps<SVGSVGElement>>> = { 1: BookOpen, 2: Smartphone, 3: FileText, 4: FlaskConical, 5: PackageOpen };

interface MarketplaceGridProps { onSelectItem: (id: string) => void; onSellItem: () => void; }

export function MarketplaceGrid({ onSelectItem, onSellItem }: MarketplaceGridProps) {
  const [searchQuery, setSearchQuery] = useState("");
  const [selectedCategory, setSelectedCategory] = useState("All");
  const { data: listings = [], isLoading, isError, error, refetch } = useMarketplaceListings();
  const visibleListings = useMemo(() => listings.filter((listing) => listing.status === 1).filter((listing) => {
    const matchesCategory = selectedCategory === "All" || categoryName[listing.category] === selectedCategory;
    const query = searchQuery.toLowerCase().trim();
    return matchesCategory && (!query || listing.title.toLowerCase().includes(query) || listing.description.toLowerCase().includes(query) || listing.seller.toLowerCase().includes(query));
  }), [listings, searchQuery, selectedCategory]);

  return <div className="w-full space-y-6">
    <div className="flex flex-col md:flex-row gap-4 items-center justify-between">
      <label className="relative w-full md:w-80"><span className="sr-only">Search marketplace</span><Search className="absolute left-3 top-1/2 -translate-y-1/2 h-4 w-4 text-muted-foreground" /><input value={searchQuery} onChange={(event) => setSearchQuery(event.target.value)} placeholder="Search marketplace" className="w-full pl-9 pr-4 py-2 bg-card border border-border rounded-lg text-sm focus:border-foreground focus:ring-1 focus:ring-foreground focus:outline-none" /></label>
      <button onClick={onSellItem} className="w-full md:w-auto bg-primary text-primary-foreground rounded-lg px-4 py-2 text-sm font-semibold flex justify-center items-center gap-2"><Plus className="h-4 w-4" />Sell item</button>
    </div>
    <div className="flex gap-2 overflow-x-auto pb-2 border-b border-border">{categories.map((category) => <button key={category} onClick={() => setSelectedCategory(category)} className={selectedCategory === category ? "px-3 py-1.5 text-xs font-bold border-b-2 border-foreground" : "px-3 py-1.5 text-xs font-semibold text-muted-foreground hover:text-foreground"}>{category}</button>)}</div>
    {isLoading ? <ListingSkeletons /> : isError ? <ErrorState message={error instanceof Error ? error.message : "Unable to read marketplace listings."} retry={refetch} /> : visibleListings.length === 0 ? <EmptyState /> : <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 gap-6">{visibleListings.map((listing) => {
      const Icon = categoryIcon[listing.category] ?? PackageOpen;
      return <button key={listing.id} onClick={() => onSelectItem(String(listing.id))} className="text-left bg-card border border-border rounded-xl hover:border-foreground flex flex-col justify-between overflow-hidden">
        <div className="p-5 flex-1"><div className="flex justify-between items-start gap-3 mb-3"><h4 className="text-sm font-bold line-clamp-2 leading-snug" title={listing.title}>{listing.title}</h4>{listing.escrow_enabled && <span className="px-2 py-0.5 text-[9px] font-bold border border-border rounded-full flex items-center gap-1 shrink-0"><Lock className="h-2.5 w-2.5" />Escrow</span>}</div><div className="aspect-[4/3] bg-muted/30 rounded-lg flex items-center justify-center text-muted-foreground border border-border/40"><Icon className="h-12 w-12 stroke-[1.2]" /></div></div>
        <div className="p-5 pt-0 flex items-center justify-between border-t border-border/60"><div className="min-w-0"><p className="text-[10px] text-muted-foreground truncate" title={listing.seller}>{shortAddress(listing.seller)}</p><p className="text-[10px] text-muted-foreground">{categoryName[listing.category] ?? "Other"}</p></div><p className="text-sm font-extrabold shrink-0">{listing.price.toLocaleString()} CAMP</p></div>
      </button>;
    })}</div>}
  </div>;
}

function ListingSkeletons() { return <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 gap-6">{[1, 2, 3].map((id) => <div key={id} className="bg-card border border-border rounded-xl p-5 space-y-4"><Skeleton className="h-6 w-3/4" /><Skeleton className="h-32 w-full rounded" /><Skeleton className="h-4 w-full" /></div>)}</div>; }
function EmptyState() { return <div className="p-16 text-center bg-card border border-border rounded-xl flex flex-col items-center gap-3"><PackageOpen className="h-10 w-10 text-muted-foreground" /><h3 className="text-base font-bold">No listings found</h3><p className="text-xs text-muted-foreground">There are no active on-chain listings matching this filter.</p></div>; }
function ErrorState({ message, retry }: { message: string; retry: () => void }) { return <div className="p-6 bg-card border border-destructive/30 rounded-xl text-sm"><p className="font-semibold">Marketplace data is unavailable.</p><p className="mt-1 text-xs text-muted-foreground break-words">{message}</p><button onClick={() => retry()} className="mt-3 text-xs font-bold underline underline-offset-4">Retry</button></div>; }
function shortAddress(address: string) { return `${address.slice(0, 6)}…${address.slice(-6)}`; }

export default MarketplaceGrid;
