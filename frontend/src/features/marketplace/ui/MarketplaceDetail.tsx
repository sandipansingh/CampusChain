"use client";

import { useState } from "react";
import { useWallet } from "@/shared/stellar/useWallet";
import { Skeleton } from "@/shared/ui/Skeleton";
import { Dropdown } from "@/shared/ui/Dropdown";
import { useQuery, useMutation, useQueryClient } from "@tanstack/react-query";
import { fetchListing } from "@/features/marketplace/service/marketplace";
import { useBuyListingMutation, useReleaseEscrowMutation, useRefundEscrowMutation } from "@/features/marketplace/hooks/useMarketplace";
import {
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

interface MarketplaceDetailProps {
  listingId: number;
  onBack: () => void;
}

export function MarketplaceDetail({ listingId, onBack }: MarketplaceDetailProps) {
  const { address } = useWallet();
  const [detailState, setDetailState] = useState<DetailState>("success");
  const [currentStep, setCurrentStep] = useState<number>(1);
  const [statusMsg, setStatusMsg] = useState<{ type: "success" | "error" | "info"; text: string } | null>(null);

  const queryClient = useQueryClient();

  // Retrieve on-chain details
  const { data: listing, isLoading } = useQuery({
    queryKey: ["marketplace-listing", listingId],
    queryFn: async () => {
      try {
        const item = await fetchListing(listingId);
        if (item) return item;
      } catch (err) {
        console.warn("Failed to fetch on-chain listing details, using fallback", err);
      }
      // Fallback details
      return {
        id: listingId,
        title: listingId === 1 ? "Introduction to Algorithms, 3rd Edition" : "TI-84 Plus CE Graphing Calculator",
        description: "Barely used during previous semester. Excellent condition. Essential text for CS 301.",
        price: listingId === 1 ? 45.0 : 350.0,
        category: 0,
        seller: "GBPVICMAESR2O4LJRDAV2YGGIQDAEY6ANCAF3GLIXEYRAIDDXM7WQP7X",
        status: 0,
        escrow_enabled: true,
      };
    },
  });

  // Mutator hooks
  const buyMutation = useBuyListingMutation();
  const releaseEscrow = useReleaseEscrowMutation();
  const refundEscrow = useRefundEscrowMutation();

  const handleBuy = async () => {
    if (!address) {
      setStatusMsg({ type: "error", text: "Please connect your wallet first." });
      return;
    }
    setStatusMsg({ type: "info", text: "Signing purchase transaction..." });
    buyMutation.mutate(
      { id: listingId, buyer: address },
      {
        onSuccess: (txHash) => {
          setStatusMsg({ type: "success", text: `Item purchased successfully! Hash: ${txHash.slice(0, 8)}...${txHash.slice(-8)}` });
          setCurrentStep(2); // Progress to locked step
          queryClient.invalidateQueries({ queryKey: ["marketplace-listing", listingId] });
        },
        onError: (err: unknown) => {
          const msg = err instanceof Error ? err.message : String(err);
          setStatusMsg({ type: "error", text: `Purchase failed: ${msg}` });
        },
      }
    );
  };

  const handleRelease = async () => {
    if (!address) return;
    setStatusMsg({ type: "info", text: "Signing release transaction..." });
    releaseEscrow.mutate(
      { escrowId: listingId, caller: address },
      {
        onSuccess: () => {
          setStatusMsg({ type: "success", text: "Escrow funds released to seller." });
          setCurrentStep(4); // Released status
        },
        onError: (err: unknown) => {
          const msg = err instanceof Error ? err.message : String(err);
          setStatusMsg({ type: "error", text: `Release failed: ${msg}` });
        },
      }
    );
  };

  const handleRefund = async () => {
    if (!address) return;
    setStatusMsg({ type: "info", text: "Signing refund transaction..." });
    refundEscrow.mutate(
      { escrowId: listingId, caller: address },
      {
        onSuccess: () => {
          setStatusMsg({ type: "success", text: "Escrow funds refunded to buyer." });
          setCurrentStep(1); // Back to start/canceled
        },
        onError: (err: unknown) => {
          const msg = err instanceof Error ? err.message : String(err);
          setStatusMsg({ type: "error", text: `Refund failed: ${msg}` });
        },
      }
    );
  };

  return (
    <div className="w-full max-w-4xl mx-auto space-y-6">
      {/* Top Navbar Back Action */}
      <div className="flex items-center justify-between">
        <button
          onClick={onBack}
          className="inline-flex items-center gap-2 text-muted-foreground hover:text-foreground text-sm font-semibold transition-colors group cursor-pointer"
        >
          <ArrowLeft className="h-4 w-4 group-hover:-translate-x-0.5 transition-transform" />
          <span>Back to Marketplace</span>
        </button>

        <div className="w-40">
          <Dropdown<DetailState>
            options={[
              { value: "success", label: "State: Loaded" },
              { value: "loading", label: "State: Loading" },
              { value: "empty", label: "State: Empty" },
            ]}
            value={detailState}
            onChange={(val) => setDetailState(val)}
          />
        </div>
      </div>

      {statusMsg && (
        <div className={`p-4 rounded-xl text-xs font-semibold border ${
          statusMsg.type === "success"
            ? "bg-emerald-500/10 text-emerald-600 border-emerald-500/20"
            : statusMsg.type === "error"
            ? "bg-destructive/10 text-destructive border-destructive/20"
            : "bg-blue-500/10 text-blue-600 border-blue-500/20 animate-pulse"
        }`}>
          {statusMsg.text}
        </div>
      )}

      {/* Content details */}
      {isLoading || detailState === "loading" ? (
        <article className="bg-card border border-border rounded-xl p-6 md:p-10 space-y-8">
          <div className="grid grid-cols-1 md:grid-cols-12 gap-8 md:gap-12">
            <div className="md:col-span-5">
              <Skeleton className="w-full aspect-square rounded-2xl" />
            </div>
            <div className="md:col-span-7 space-y-4">
              <Skeleton className="h-8 w-4/5" />
              <Skeleton className="h-10 w-1/3" />
              <Skeleton className="h-4 w-1/4" />
            </div>
          </div>
        </article>
      ) : detailState === "empty" || !listing ? (
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
                    {listing.category === 0 ? "Book" : "Electronics"}
                  </span>
                </div>
              </div>
            </div>

            {/* Description Info Area */}
            <div className="md:col-span-7 flex flex-col justify-between">
              <div>
                <h2 className="text-xl md:text-2xl font-bold leading-tight">
                  {listing.title}
                </h2>
                
                <div className="mt-4 mb-6">
                  <div className="text-3xl font-black tracking-tight">{listing.price} CAMP</div>
                  <div className="text-xs text-muted-foreground mt-2 flex items-center gap-1">
                    <ArrowUpDown className="h-3.5 w-3.5" />
                    <span>≈ {(listing.price * 0.11).toFixed(2)} XLM</span>
                  </div>
                </div>

                {/* Seller Profile Block */}
                <div className="flex items-center gap-3 py-3 px-4 rounded-xl bg-muted/40 border border-border/60 mb-6">
                  <div className="w-10 h-10 rounded-full bg-secondary flex items-center justify-center text-secondary-foreground font-bold text-sm select-none">
                    SE
                  </div>
                  <div className="flex-grow min-w-0">
                    <div className="text-xs font-bold truncate">{listing.seller}</div>
                    <div className="flex items-center gap-1 text-[10px] text-muted-foreground mt-0.5">
                      <CheckCircle2 className="h-3.5 w-3.5 text-emerald-600 fill-emerald-50" />
                      <span>Verified seller</span>
                    </div>
                  </div>
                </div>

                <p className="text-sm text-muted-foreground leading-relaxed text-justify mb-8">
                  {listing.description}
                </p>
              </div>

              {/* Escrow Buy Button */}
              <div className="space-y-4">
                {currentStep === 1 ? (
                  <button
                    onClick={handleBuy}
                    disabled={buyMutation.isPending}
                    className="w-full h-12 bg-primary text-primary-foreground font-bold rounded-xl hover:bg-primary/95 flex items-center justify-center gap-2 cursor-pointer shadow-sm transition-all active:scale-[0.99] disabled:opacity-50 disabled:cursor-not-allowed"
                  >
                    <Lock className="h-4 w-4" />
                    <span>{buyMutation.isPending ? "Purchasing..." : listing.escrow_enabled ? "Buy with Escrow" : "Purchase Listing"}</span>
                  </button>
                ) : currentStep === 2 || currentStep === 3 ? (
                  <div className="flex gap-4">
                    <button
                      onClick={handleRelease}
                      disabled={releaseEscrow.isPending}
                      className="flex-1 h-12 bg-emerald-600 text-white font-bold rounded-xl hover:bg-emerald-700 flex items-center justify-center gap-2 cursor-pointer transition-all disabled:opacity-50"
                    >
                      Release Funds
                    </button>
                    <button
                      onClick={handleRefund}
                      disabled={refundEscrow.isPending}
                      className="flex-1 h-12 bg-destructive text-white font-bold rounded-xl hover:bg-destructive/95 flex items-center justify-center gap-2 cursor-pointer transition-all disabled:opacity-50"
                    >
                      Refund / Raise dispute
                    </button>
                  </div>
                ) : (
                  <div className="p-4 bg-emerald-500/10 text-emerald-600 border border-emerald-500/20 text-center rounded-xl text-xs font-semibold">
                    Transaction Complete
                  </div>
                )}
                <div className="flex items-start justify-center gap-2 text-center text-[10px] text-muted-foreground px-4">
                  <Info className="h-3.5 w-3.5 text-muted-foreground/75 shrink-0 mt-0.5" />
                  <p className="leading-relaxed">
                    {listing.escrow_enabled
                      ? "Funds held in smart contract escrow until item is confirmed received by buyer."
                      : "Direct peer-to-peer payout will be executed."}
                  </p>
                </div>
              </div>

            </div>

          </div>

          {/* Tracker stepper */}
          {listing.escrow_enabled && (
            <div className="mt-12 pt-8 border-t border-border">
              <div className="flex justify-between items-center mb-6">
                <h3 className="text-xs font-bold uppercase tracking-wider text-muted-foreground">
                  Escrow Process Tracker
                </h3>
                
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
                <div className="absolute top-[21px] left-[60px] right-[60px] h-0.5 bg-border z-0"></div>
                <div
                  className="absolute top-[21px] left-[60px] h-0.5 bg-primary z-0 transition-all duration-300"
                  style={{
                    width: `${((currentStep - 1) / 3) * 100}%`,
                  }}
                ></div>

                <div className="flex justify-between relative z-10">
                  {[
                    { label: "Listed", icon: Check },
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
          )}
        </article>
      )}
    </div>
  );
}
export default MarketplaceDetail;
