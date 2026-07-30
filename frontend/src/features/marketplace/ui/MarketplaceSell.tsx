"use client";

import { useState } from "react";
import { useWallet } from "@/shared/stellar/useWallet";
import { Skeleton } from "@/shared/ui/Skeleton";
import { Dropdown } from "@/shared/ui/Dropdown";
import { useCreateListingMutation } from "@/features/marketplace/hooks/useMarketplace";
import {
  ArrowLeft,
  CheckCircle2,
  BookOpen,
  Laptop,
  FileText,
  Home,
  Layers,
  Sparkles,
  ThumbsUp,
  Wrench,
  AlertCircle,
} from "lucide-react";

type CategoryType = "textbooks" | "electronics" | "notes" | "hostel" | "other";
type ConditionType = "new" | "like-new" | "used";

interface MarketplaceSellProps {
  onBack: () => void;
}

export function MarketplaceSell({ onBack }: MarketplaceSellProps) {
  const { address } = useWallet();
  const [isSubmitting, setIsSubmitting] = useState(false);
  const [isSuccess, setIsSuccess] = useState(false);
  
  // Form input states
  const [title, setTitle] = useState("");
  const [category, setCategory] = useState<CategoryType | "">("");
  const [condition, setCondition] = useState<ConditionType | "">("");
  const [priceCamp, setPriceCamp] = useState("");
  const [description, setDescription] = useState("");
  const [escrowEnabled, setEscrowEnabled] = useState(true);
  const [statusMsg, setStatusMsg] = useState<{ type: "success" | "error" | "info"; text: string } | null>(null);

  const createListingMutation = useCreateListingMutation();

  const handleFormSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!address) {
      setStatusMsg({ type: "error", text: "Please connect your wallet first." });
      return;
    }
    if (!category) {
      setStatusMsg({ type: "error", text: "Please select a category." });
      return;
    }

    const price = parseFloat(priceCamp);
    if (isNaN(price) || price <= 0) {
      setStatusMsg({ type: "error", text: "Please enter a valid price." });
      return;
    }

    // Map Category to contract number
    const categoryMap: Record<CategoryType, number> = {
      textbooks: 1,
      electronics: 2,
      notes: 3,
      hostel: 4,
      other: 5,
    };

    setIsSubmitting(true);
    setStatusMsg({ type: "info", text: "Signing listing creation transaction..." });

    createListingMutation.mutate(
      {
        seller: address,
        title,
        description,
        price,
        category: categoryMap[category],
        escrowEnabled,
      },
      {
        onSuccess: (txHash) => {
          setIsSubmitting(false);
          setIsSuccess(true);
          setStatusMsg({ type: "success", text: `Listing created successfully! Hash: ${txHash.slice(0, 8)}...${txHash.slice(-8)}` });
        },
        onError: (err: unknown) => {
          setIsSubmitting(false);
          const msg = err instanceof Error ? err.message : String(err);
          setStatusMsg({ type: "error", text: `Failed to create listing: ${msg}` });
        },
      }
    );
  };

  const handleResetForm = () => {
    setTitle("");
    setCategory("");
    setCondition("");
    setPriceCamp("");
    setDescription("");
    setEscrowEnabled(true);
    setIsSuccess(false);
    setStatusMsg(null);
  };

  return (
    <div className="w-full max-w-2xl mx-auto space-y-6">
      {/* Top Header Back Action */}
      <div className="flex items-center justify-between">
        <button
          onClick={onBack}
          className="inline-flex items-center gap-2 text-muted-foreground hover:text-foreground text-sm font-semibold transition-colors group cursor-pointer"
        >
          <ArrowLeft className="h-4 w-4" />
          <span>Back to Marketplace</span>
        </button>
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

      {isSuccess ? (
        <div className="bg-card border border-border rounded-xl p-8 text-center flex flex-col items-center justify-center gap-6 shadow-sm py-16">
          <div className="w-16 h-16 rounded-full bg-emerald-500/10 flex items-center justify-center text-emerald-600">
            <CheckCircle2 className="h-8 w-8" />
          </div>
          <div>
            <h3 className="text-lg font-bold text-foreground">Listing Successfully Published!</h3>
            <p className="text-xs text-muted-foreground mt-2 max-w-sm mx-auto leading-relaxed">
              Your item is now registered on the Soroban smart contract and visible in the campus marketplace.
            </p>
          </div>
          <div className="flex gap-4 w-full max-w-xs pt-4">
            <button
              onClick={handleResetForm}
              className="flex-1 h-11 bg-secondary text-secondary-foreground font-semibold rounded-lg hover:bg-secondary/80 transition-colors text-xs cursor-pointer"
            >
              List Another Item
            </button>
            <button
              onClick={onBack}
              className="flex-1 h-11 bg-primary text-primary-foreground font-semibold rounded-lg hover:bg-primary/95 transition-all text-xs cursor-pointer"
            >
              Back to Marketplace
            </button>
          </div>
        </div>
      ) : (
        <form onSubmit={handleFormSubmit} className="bg-card rounded-xl border border-border p-6 md:p-8 shadow-sm space-y-5">
          <div>
            <h2 className="text-base font-bold">List a New Item</h2>
            <p className="text-xs text-muted-foreground mt-1">Convert your unused goods into CAMP tokens instantly.</p>
          </div>

          <div className="space-y-4">
            {/* Title */}
            <div>
              <label className="block text-xs font-bold uppercase tracking-wider text-muted-foreground mb-1.5" htmlFor="title">
                Item Title
              </label>
              {isSubmitting ? (
                <Skeleton className="h-11 w-full rounded-lg" />
              ) : (
                <input
                  id="title"
                  type="text"
                  value={title}
                  onChange={(e) => setTitle(e.target.value)}
                  placeholder="e.g. Organic Chemistry Textbook"
                  required
                  className="w-full h-11 px-4 bg-card border border-border rounded-lg text-sm focus:border-foreground focus:ring-1 focus:ring-foreground focus:outline-none"
                />
              )}
            </div>

            {/* Category & Condition */}
            <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
              <div>
                <label className="block text-xs font-bold uppercase tracking-wider text-muted-foreground mb-1.5 animate-none">
                  Category
                </label>
                {isSubmitting ? (
                  <Skeleton className="h-11 w-full rounded-lg" />
                ) : (
                  <Dropdown<CategoryType | "">
                    options={[
                      { value: "", label: "Select category", icon: <AlertCircle className="h-4 w-4 text-muted-foreground" /> },
                      { value: "textbooks", label: "Textbooks", icon: <BookOpen className="h-4 w-4 text-blue-500" /> },
                      { value: "electronics", label: "Electronics", icon: <Laptop className="h-4 w-4 text-purple-500" /> },
                      { value: "notes", label: "Course Notes", icon: <FileText className="h-4 w-4 text-amber-500" /> },
                      { value: "hostel", label: "Hostel", icon: <Home className="h-4 w-4 text-emerald-500" /> },
                      { value: "other", label: "Other", icon: <Layers className="h-4 w-4 text-zinc-500" /> },
                    ]}
                    value={category}
                    onChange={(val) => setCategory(val)}
                  />
                )}
              </div>

              <div>
                <label className="block text-xs font-bold uppercase tracking-wider text-muted-foreground mb-1.5">
                  Condition
                </label>
                {isSubmitting ? (
                  <Skeleton className="h-11 w-full rounded-lg" />
                ) : (
                <Dropdown<ConditionType | "">
                  options={[
                    { value: "", label: "Select condition", icon: <AlertCircle className="h-4 w-4 text-muted-foreground" /> },
                    { value: "new", label: "New", icon: <Sparkles className="h-4 w-4 text-emerald-500" /> },
                    { value: "like-new", label: "Like New", icon: <ThumbsUp className="h-4 w-4 text-blue-500" /> },
                    { value: "used", label: "Used", icon: <Wrench className="h-4 w-4 text-amber-500" /> },
                  ]}
                  value={condition}
                  onChange={(val) => setCondition(val)}
                />
                )}
              </div>
            </div>

            {/* Price */}
            <div>
              <label className="block text-xs font-bold uppercase tracking-wider text-muted-foreground mb-1.5" htmlFor="price">
                Price (CAMP)
              </label>
              {isSubmitting ? (
                <Skeleton className="h-11 w-full rounded-lg" />
              ) : (
                <div className="relative">
                  <span className="absolute left-4 top-1/2 -translate-y-1/2 text-muted-foreground font-semibold text-sm select-none">
                    ⓒ
                  </span>
                  <input
                    id="price"
                    type="number"
                    value={priceCamp}
                    onChange={(e) => setPriceCamp(e.target.value)}
                    placeholder="0.00"
                    required
                    className="w-full h-11 pl-10 pr-4 bg-card border border-border rounded-lg text-sm focus:border-foreground focus:ring-1 focus:ring-foreground focus:outline-none"
                  />
                </div>
              )}
            </div>

            {/* Description */}
            <div>
              <label className="block text-xs font-bold uppercase tracking-wider text-muted-foreground mb-1.5" htmlFor="description">
                Description
              </label>
              {isSubmitting ? (
                <Skeleton className="h-24 w-full rounded-lg" />
              ) : (
                <textarea
                  id="description"
                  value={description}
                  onChange={(e) => setDescription(e.target.value)}
                  placeholder="Describe the condition, location, or availability of the item."
                  required
                  rows={4}
                  className="w-full p-4 bg-card border border-border rounded-lg text-sm focus:border-foreground focus:ring-1 focus:ring-foreground focus:outline-none resize-none"
                />
              )}
            </div>

            {/* Escrow Opt-in Toggle */}
            <div className="flex items-center gap-3 py-2">
              <input
                id="escrow-checkbox"
                type="checkbox"
                checked={escrowEnabled}
                onChange={(e) => setEscrowEnabled(e.target.checked)}
                className="w-4 h-4 rounded text-primary focus:ring-primary border-border cursor-pointer"
              />
              <label htmlFor="escrow-checkbox" className="text-xs font-semibold text-foreground cursor-pointer select-none">
                Enable Escrow Buyer Protection (Recommended)
              </label>
            </div>
          </div>

          <button
            type="submit"
            disabled={isSubmitting}
            className="w-full h-12 mt-4 bg-primary text-primary-foreground font-semibold rounded-lg hover:bg-primary/95 flex items-center justify-center gap-2 cursor-pointer disabled:opacity-50 disabled:cursor-not-allowed"
          >
            <span>{isSubmitting ? "Publishing..." : "Submit Listing"}</span>
          </button>
        </form>
      )}
    </div>
  );
}
export default MarketplaceSell;
