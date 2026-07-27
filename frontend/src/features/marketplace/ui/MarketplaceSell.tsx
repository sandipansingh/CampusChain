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
  ArrowRight,
  ArrowLeft,
  CheckCircle2,
} from "lucide-react";

type SellState = "form" | "submitting" | "success";
type CategoryType = "textbooks" | "electronics" | "furniture" | "clothing" | "other";
type ConditionType = "new" | "like-new" | "used";

export function MarketplaceSell() {
  const { disconnect } = useWallet();
  const [sellState, setSellState] = useState<SellState>("form");
  
  // Form input states
  const [title, setTitle] = useState("");
  const [category, setCategory] = useState<CategoryType | "">("");
  const [condition, setCondition] = useState<ConditionType | "">("");
  const [priceCamp, setPriceCamp] = useState("");
  const [description, setDescription] = useState("");

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

  // Price conversion (mock 1 CAMP = 0.5 XLM)
  const conversionXlm = priceCamp ? (parseFloat(priceCamp) * 0.5).toFixed(2) : "0.00";

  const handleFormSubmit = (e: React.FormEvent) => {
    e.preventDefault();
    setSellState("submitting");
    setTimeout(() => {
      setSellState("success");
    }, 1500); // simulated listing wait
  };

  const handleResetForm = () => {
    setTitle("");
    setCategory("");
    setCondition("");
    setPriceCamp("");
    setDescription("");
    setSellState("form");
  };

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
        <header className="flex justify-between items-center h-16 border-b border-border bg-card px-6 sticky top-0 z-30 shrink-0">
          <div className="flex items-center gap-2">
            <a
              href="#"
              className="inline-flex items-center gap-2 text-muted-foreground hover:text-foreground text-sm font-semibold transition-colors group"
            >
              <ArrowLeft className="h-4 w-4 group-hover:-translate-x-0.5 transition-transform" />
              <span>Back to Marketplace</span>
            </a>
          </div>

          <div className="flex items-center gap-4">
            {/* Demo State Control Dropdown */}
            <div className="w-40">
              <Dropdown<SellState>
                options={[
                  { value: "form", label: "State: Form" },
                  { value: "submitting", label: "State: Submitting" },
                  { value: "success", label: "State: Success" },
                ]}
                value={sellState}
                onChange={(val) => setSellState(val)}
              />
            </div>
            
            <div className="hidden md:flex items-center gap-3">
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

        {/* Content Canvas */}
        <main className="flex-grow overflow-y-auto p-4 md:p-8 bg-muted/20 pb-24 md:pb-8 flex justify-center items-start pt-6 md:pt-10">
          
          {sellState === "success" ? (
            <div className="w-full max-w-xl bg-card rounded-2xl border border-border p-8 text-center flex flex-col items-center justify-center gap-6 shadow-sm">
              <CheckCircle2 className="h-16 w-16 text-emerald-600 fill-emerald-50" />
              
              <div className="space-y-2">
                <h3 className="text-xl font-bold">Item Listed Successfully!</h3>
                <p className="text-xs text-muted-foreground max-w-[280px] mx-auto leading-relaxed">
                  Your textbook has been registered on-chain and added to the peer-to-peer campus marketplace.
                </p>
              </div>

              <div className="w-full bg-muted/50 p-4 rounded-xl border border-border text-left space-y-3 text-sm">
                <div className="flex justify-between">
                  <span className="text-muted-foreground text-xs">Title:</span>
                  <span className="font-bold">{title || "Introduction to Algorithms"}</span>
                </div>
                <div className="flex justify-between border-t border-border/60 pt-2.5">
                  <span className="text-muted-foreground text-xs">Price:</span>
                  <span className="font-bold text-foreground">{priceCamp || "120"} CAMP (~{conversionXlm} XLM)</span>
                </div>
                <div className="flex justify-between border-t border-border/60 pt-2.5">
                  <span className="text-muted-foreground text-xs">Escrow Protection:</span>
                  <span className="font-bold text-emerald-600">Active</span>
                </div>
              </div>

              <button
                onClick={handleResetForm}
                className="w-full h-11 bg-primary text-primary-foreground font-semibold rounded-lg hover:bg-primary/95 transition-all flex items-center justify-center cursor-pointer"
              >
                Back to Marketplace
              </button>
            </div>
          ) : (
            <div className="w-full max-w-xl bg-card rounded-2xl border border-border p-6 md:p-8 shadow-sm">
              <h2 className="text-lg md:text-xl font-bold mb-6 border-b border-border pb-4">
                List an Item
              </h2>

              <form onSubmit={handleFormSubmit} className="space-y-5">
                
                {/* Title */}
                <div>
                  <label className="block text-xs font-bold uppercase tracking-wider text-muted-foreground mb-1.5" htmlFor="title">
                    Title
                  </label>
                  {sellState === "submitting" ? (
                    <Skeleton className="h-11 w-full rounded-lg" />
                  ) : (
                    <input
                      id="title"
                      type="text"
                      value={title}
                      onChange={(e) => setTitle(e.target.value)}
                      placeholder="e.g., Intro to Microeconomics Textbook"
                      required
                      className="w-full h-11 px-4 bg-card border border-border rounded-lg text-sm placeholder:text-muted-foreground/60 focus:border-foreground focus:ring-1 focus:ring-foreground focus:outline-none"
                    />
                  )}
                </div>

                {/* Category & Condition split row */}
                <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                  
                  {/* Category */}
                  <div>
                    <label className="block text-xs font-bold uppercase tracking-wider text-muted-foreground mb-1.5" htmlFor="category">
                      Category
                    </label>
                    {sellState === "submitting" ? (
                      <Skeleton className="h-11 w-full rounded-lg" />
                    ) : (
                      <Dropdown<CategoryType | "">
                        options={[
                          { value: "", label: "Select category" },
                          { value: "textbooks", label: "Textbooks" },
                          { value: "electronics", label: "Electronics" },
                          { value: "furniture", label: "Dorm Furniture" },
                          { value: "clothing", label: "Clothing" },
                          { value: "other", label: "Other" },
                        ]}
                        value={category}
                        onChange={(val) => setCategory(val)}
                      />
                    )}
                  </div>

                  {/* Condition */}
                  <div>
                    <label className="block text-xs font-bold uppercase tracking-wider text-muted-foreground mb-1.5" htmlFor="condition">
                      Condition
                    </label>
                    {sellState === "submitting" ? (
                      <Skeleton className="h-11 w-full rounded-lg" />
                    ) : (
                      <Dropdown<ConditionType | "">
                        options={[
                          { value: "", label: "Select condition" },
                          { value: "new", label: "New" },
                          { value: "like-new", label: "Like New" },
                          { value: "used", label: "Used" },
                        ]}
                        value={condition}
                        onChange={(val) => setCondition(val)}
                      />
                    )}
                  </div>

                </div>

                {/* Price (CAMP) */}
                <div>
                  <label className="block text-xs font-bold uppercase tracking-wider text-muted-foreground mb-1.5" htmlFor="price">
                    Price (CAMP)
                  </label>
                  {sellState === "submitting" ? (
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
                  <p className="text-xs text-muted-foreground mt-1.5 pl-1">
                    ~ {conversionXlm} XLM
                  </p>
                </div>

                {/* Description */}
                <div>
                  <label className="block text-xs font-bold uppercase tracking-wider text-muted-foreground mb-1.5" htmlFor="description">
                    Description
                  </label>
                  {sellState === "submitting" ? (
                    <Skeleton className="h-28 w-full rounded-lg" />
                  ) : (
                    <textarea
                      id="description"
                      value={description}
                      onChange={(e) => setDescription(e.target.value)}
                      placeholder="Describe the item, including any flaws or notable features..."
                      rows={4}
                      required
                      className="w-full px-4 py-3 bg-card border border-border rounded-lg text-sm focus:border-foreground focus:ring-1 focus:ring-foreground focus:outline-none resize-none"
                    />
                  )}
                </div>

                {/* Submit button */}
                <button
                  type="submit"
                  disabled={sellState === "submitting"}
                  className="w-full h-12 mt-4 bg-primary text-primary-foreground font-semibold rounded-lg hover:bg-primary/95 flex items-center justify-center gap-2 cursor-pointer transition-all active:scale-[0.99] disabled:opacity-85 disabled:cursor-not-allowed shadow-sm"
                >
                  {sellState === "submitting" ? (
                    <span className="inline-block w-4 h-4 border-2 border-primary-foreground border-t-transparent rounded-full animate-spin"></span>
                  ) : (
                    <>
                      <span>List Item</span>
                      <ArrowRight className="h-4 w-4" />
                    </>
                  )}
                </button>

              </form>
            </div>
          )}

        </main>
      </div>

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
export default MarketplaceSell;
