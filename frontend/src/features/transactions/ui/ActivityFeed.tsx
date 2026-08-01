"use client";

import { useState } from "react";
import { useWallet } from "@/shared/stellar/useWallet";
import { Dropdown } from "@/shared/ui/Dropdown";
import { Skeleton } from "@/shared/ui/Skeleton";
import { useActivityFeed } from "@/features/transactions/hooks/useActivityFeed";
import { ICON_COLORS } from "@/shared/stellar/eventDecoder";
import {
  Search,
  Copy,
  ExternalLink,
  Check,
  History,
  ListFilter,
  ArrowLeftRight,
  Lock,
  Ticket,
  Coins,
  UserCheck,
  Building,
  Shield,
  ArrowDown,
  ArrowUp,
} from "lucide-react";

function getEventIcon(icon: string) {
  switch (icon) {
    case "transfer":
      return <ArrowLeftRight className="h-4.5 w-4.5" />;
    case "escrow":
      return <Lock className="h-4.5 w-4.5" />;
    case "ticket":
      return <Ticket className="h-4.5 w-4.5" />;
    case "faucet":
      return <Coins className="h-4.5 w-4.5" />;
    case "role":
      return <UserCheck className="h-4.5 w-4.5" />;
    case "university":
      return <Building className="h-4.5 w-4.5" />;
    default:
      return <Shield className="h-4.5 w-4.5" />;
  }
}

export function ActivityFeed({
  global = false,
  universityCode,
}: {
  global?: boolean;
  universityCode?: string;
} = {}) {
  const { address } = useWallet();
  const [expandedTxId, setExpandedTxId] = useState<string | null>(null);
  const [copiedId, setCopiedId] = useState<string | null>(null);

  // Determine feed mode:
  // - global=true → platform admin: no address filter (all events)
  // - universityCode provided → university admin: campus-scoped feed
  // - default → own-wallet: sub-role personal activity
  const feedOptions = global
    ? {}
    : universityCode
    ? { address: address ?? undefined, universityCode }
    : { address: address ?? undefined };

  const {
    filteredEvents,
    loading,
    loadingMore,
    hasMore,
    searchQuery,
    setSearchQuery,
    typeFilter,
    setTypeFilter,
    sortBy,
    setSortBy,
    loadMore,
  } = useActivityFeed(feedOptions);

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

  const handleOpenExplorer = (e: React.MouseEvent, hash: string) => {
    e.stopPropagation();
    window.open(`https://stellar.expert/explorer/testnet/tx/${hash}`, "_blank");
  };

  return (
    <div className="w-full space-y-6">
      {/* Header Panel */}
      <div className="flex justify-between items-center">
        <h3 className="text-sm font-bold text-foreground">Activity Feed</h3>
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
              placeholder="Search hash, details..."
              className="w-full pl-9 pr-3 py-1.5 bg-card border border-border rounded-lg text-xs placeholder:text-muted-foreground/60 focus:border-foreground focus:ring-1 focus:ring-foreground focus:outline-none"
            />
          </div>
          
          {/* Type Filter */}
          <div className="w-full sm:w-40">
            <Dropdown<string>
              options={[
                { value: "all", label: "All Types", icon: <ListFilter className="h-4 w-4 text-muted-foreground" /> },
                { value: "transfer", label: "Transfers", icon: <ArrowLeftRight className="h-4 w-4 text-sky-500" /> },
                { value: "escrow", label: "Escrow", icon: <Lock className="h-4 w-4 text-amber-500" /> },
                { value: "ticket", label: "Ticketing", icon: <Ticket className="h-4 w-4 text-indigo-500" /> },
                { value: "faucet", label: "Faucet", icon: <Coins className="h-4 w-4 text-emerald-500" /> },
                { value: "role", label: "Verifications", icon: <UserCheck className="h-4 w-4 text-purple-500" /> },
                { value: "university", label: "Universities", icon: <Building className="h-4 w-4 text-pink-500" /> },
              ]}
              value={typeFilter}
              onChange={setTypeFilter}
            />
          </div>

          {/* Sort By */}
          <div className="w-full sm:w-40">
            <Dropdown<string>
              options={[
                { value: "newest", label: "Newest First", icon: <ArrowDown className="h-4 w-4 text-muted-foreground" /> },
                { value: "oldest", label: "Oldest First", icon: <ArrowUp className="h-4 w-4 text-muted-foreground" /> },
              ]}
              value={sortBy}
              onChange={(val) => setSortBy(val as "newest" | "oldest")}
            />
          </div>
        </div>
      </div>

      {/* Content Lists */}
      {loading ? (
        <div className="space-y-4">
          {[1, 2, 3].map((i) => (
            <div key={i} className="bg-card border border-border p-4 rounded-xl flex items-center justify-between">
              <div className="flex items-center gap-4 flex-1">
                <Skeleton className="w-10 h-10 rounded-full" />
                <div className="space-y-2 flex-1">
                  <Skeleton className="h-4 w-1/3" />
                  <Skeleton className="h-3 w-1/2" />
                </div>
              </div>
              <Skeleton className="h-4 w-16" />
            </div>
          ))}
        </div>
      ) : filteredEvents.length === 0 ? (
        <div className="p-16 border border-border rounded-xl bg-card text-center flex flex-col items-center justify-center gap-3 shadow-sm">
          <History className="h-12 w-12 text-muted-foreground/50" />
          <h3 className="text-md font-bold">No Activities Found</h3>
          <p className="text-xs text-muted-foreground max-w-[260px] mx-auto leading-relaxed">
            There are no activity feed entries recorded on-chain matching your filter options.
          </p>
        </div>
      ) : (
        <div className="space-y-3">
          {filteredEvents.map((evt) => {
            const isExpanded = expandedTxId === evt.id;
            
            return (
              <div
                key={evt.id}
                onClick={() => handleToggleDetails(evt.id)}
                className="bg-card border border-border rounded-xl p-4 hover:border-foreground/35 cursor-pointer shadow-sm text-xs"
              >
                <div className="flex justify-between items-center">
                  <div className="flex items-center gap-3 min-w-0">
                    <div className={`w-10 h-10 rounded-full flex items-center justify-center shrink-0 border ${ICON_COLORS[evt.color] || "bg-muted text-foreground border-border"}`}>
                      {getEventIcon(evt.icon)}
                    </div>
                    <div className="min-w-0">
                      <p className="font-bold truncate leading-snug">{evt.title}</p>
                      <p className="text-muted-foreground truncate mt-0.5">{evt.message}</p>
                    </div>
                  </div>

                  <div className="text-right shrink-0">
                    <p className="font-bold text-foreground">{evt.details}</p>
                    <p className="text-[10px] text-muted-foreground mt-0.5">{evt.timestamp}</p>
                  </div>
                </div>

                {/* Collapsible Details */}
                {isExpanded && (
                  <div className="mt-4 pt-4 border-t border-border space-y-3">
                    <div className="flex justify-between items-center bg-muted/50 p-2 rounded-lg border border-border">
                      <div className="flex flex-col min-w-0 pr-4">
                        <span className="text-[9px] uppercase font-bold tracking-wider text-muted-foreground mb-0.5">
                          Stellar Transaction Hash
                        </span>
                        <span className="text-[10px] text-foreground font-mono truncate select-all">
                          {evt.fullTxHash}
                        </span>
                      </div>

                      <div className="flex gap-1 shrink-0">
                        <button
                          onClick={(e) => handleCopyHash(e, evt.id, evt.fullTxHash)}
                          className="p-1.5 bg-card border border-border rounded-md text-muted-foreground hover:text-foreground transition-colors cursor-pointer"
                          title="Copy Hash"
                        >
                          {copiedId === evt.id ? (
                            <Check className="h-3.5 w-3.5 text-emerald-600" />
                          ) : (
                            <Copy className="h-3.5 w-3.5" />
                          )}
                        </button>
                        <button
                          onClick={(e) => handleOpenExplorer(e, evt.fullTxHash)}
                          className="p-1.5 bg-card border border-border rounded-md text-muted-foreground hover:text-foreground transition-colors cursor-pointer"
                          title="View on Explorer"
                        >
                          <ExternalLink className="h-3.5 w-3.5" />
                        </button>
                      </div>
                    </div>

                    <div className="flex gap-4 text-[10px] font-bold uppercase tracking-wider text-muted-foreground pl-1">
                      <span>Ledger: {evt.ledger}</span>
                    </div>
                  </div>
                )}
              </div>
            );
          })}

          {/* Load More Button */}
          {hasMore && (
            <div className="flex justify-center pt-6 pb-4">
              <button
                onClick={loadMore}
                disabled={loadingMore}
                className="px-6 py-2 border border-border rounded-full text-foreground font-bold hover:bg-accent transition-colors bg-card text-xs cursor-pointer disabled:opacity-50"
              >
                {loadingMore ? "Fetching more feed entries" : "Load more feed entries"}
              </button>
            </div>
          )}
        </div>
      )}
    </div>
  );
}

export default ActivityFeed;
