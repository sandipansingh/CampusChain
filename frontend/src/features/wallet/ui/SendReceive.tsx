"use client";

import { useState, useEffect } from "react";
import { useWallet } from "@/shared/stellar/useWallet";
import { Skeleton } from "@/shared/ui/Skeleton";
import { Dropdown } from "@/shared/ui/Dropdown";
import {
  Search,
  ArrowUpRight,
  Copy,
  Check,
  Share2,
  QrCode,
} from "lucide-react";

interface UserSuggestion {
  id: string;
  name: string;
  username: string;
  address: string;
}

const mockUsers: UserSuggestion[] = [
  { id: "sm", name: "Sarah Miller", username: "@sarahm", address: "GCO2...3F9A" },
  { id: "al", name: "Alex Lin", username: "@alexl", address: "GAXX...3K9L" },
];

export function SendReceive() {
  const { address } = useWallet();
  const [activeTab, setActiveTab] = useState<"send" | "receive">("send");
  const [toInput, setToInput] = useState("");
  const [amount, setAmount] = useState("50.00");
  const [asset, setAsset] = useState<"XLM" | "CAMP">("XLM");
  const [memo, setMemo] = useState("");
  
  // Suggestion list states
  const [suggestions, setSuggestions] = useState<UserSuggestion[]>([]);
  const [isSearching, setIsSearching] = useState(false);
  const [showSuggestions, setShowSuggestions] = useState(false);
  
  // Copy state
  const [copied, setCopied] = useState(false);

  // Simulate user search
  useEffect(() => {
    if (!toInput) {
      setSuggestions([]);
      setShowSuggestions(false);
      return;
    }

    setIsSearching(true);
    setShowSuggestions(true);

    const timer = setTimeout(() => {
      const filtered = mockUsers.filter(
        (user) =>
          user.name.toLowerCase().includes(toInput.toLowerCase()) ||
          user.username.toLowerCase().includes(toInput.toLowerCase()) ||
          user.address.toLowerCase().includes(toInput.toLowerCase())
      );
      setSuggestions(filtered);
      setIsSearching(false);
    }, 600); // simulated network search delay

    return () => clearTimeout(timer);
  }, [toInput]);

  const handleCopy = () => {
    if (!address) return;
    navigator.clipboard.writeText(address);
    setCopied(true);
    setTimeout(() => setCopied(false), 2000);
  };

  const handleSelectSuggestion = (user: UserSuggestion) => {
    setToInput(user.address);
    setShowSuggestions(false);
  };

  // Convert amount calculation for caption
  const convertedValue = asset === "XLM" 
    ? `≈ ${(parseFloat(amount) || 0) * 0.1} CAMP`
    : `≈ ${(parseFloat(amount) || 0) * 0.05} XLM`;

  return (
    <div className="bg-card rounded-2xl border border-border w-full max-w-md p-6 shadow-sm mx-auto">
      {/* 1. Tab Switcher */}
      <div className="bg-muted p-1 rounded-full flex mb-6">
        <button
          onClick={() => setActiveTab("send")}
          className={`flex-1 py-2 rounded-full font-semibold text-sm text-center transition-all cursor-pointer ${
            activeTab === "send"
              ? "bg-primary text-primary-foreground shadow-sm"
              : "text-muted-foreground hover:text-foreground"
          }`}
        >
          Send
        </button>
        <button
          onClick={() => setActiveTab("receive")}
          className={`flex-1 py-2 rounded-full font-semibold text-sm text-center transition-all cursor-pointer ${
            activeTab === "receive"
              ? "bg-primary text-primary-foreground shadow-sm"
              : "text-muted-foreground hover:text-foreground"
          }`}
        >
          Receive
        </button>
      </div>

      {/* 2. Send View */}
      {activeTab === "send" && (
        <div className="flex flex-col gap-5">
          {/* To Recipient Input */}
          <div className="relative">
            <label className="block text-xs font-bold uppercase tracking-wider text-muted-foreground mb-1.5" htmlFor="recipient">
              To
            </label>
            <div className="relative">
              <Search className="absolute left-3 top-1/2 -translate-y-1/2 h-5 w-5 text-muted-foreground/70" />
              <input
                id="recipient"
                type="text"
                value={toInput}
                onChange={(e) => setToInput(e.target.value)}
                placeholder="Student ID, @username or address"
                className="w-full h-12 pl-10 pr-4 bg-card border border-border rounded-lg text-sm placeholder:text-muted-foreground/60 focus:border-foreground focus:ring-1 focus:ring-foreground focus:outline-none transition-all"
                autoComplete="off"
              />
            </div>

            {/* Suggestions Dropdown (simulating loading, loaded, empty states) */}
            {showSuggestions && (
              <div className="absolute w-full mt-2 bg-card border border-border rounded-lg shadow-md z-50 overflow-hidden">
                {isSearching ? (
                  <div className="p-3 space-y-3">
                    <div className="flex items-center gap-3">
                      <Skeleton className="w-8 h-8 rounded-full" />
                      <div className="space-y-1.5 flex-1">
                        <Skeleton className="h-4 w-28" />
                        <Skeleton className="h-3 w-16" />
                      </div>
                    </div>
                    <div className="flex items-center gap-3">
                      <Skeleton className="w-8 h-8 rounded-full" />
                      <div className="space-y-1.5 flex-1">
                        <Skeleton className="h-4 w-24" />
                        <Skeleton className="h-3 w-16" />
                      </div>
                    </div>
                  </div>
                ) : suggestions.length === 0 ? (
                  <div className="p-4 text-center text-xs text-muted-foreground">
                    No student or wallet address found.
                  </div>
                ) : (
                  <div className="divide-y divide-border">
                    {suggestions.map((user) => (
                      <button
                        key={user.id}
                        onClick={() => handleSelectSuggestion(user)}
                        className="w-full flex items-center gap-3 p-3 hover:bg-muted/40 transition-colors text-left cursor-pointer"
                      >
                        <div className="w-8 h-8 rounded-full bg-secondary text-secondary-foreground flex items-center justify-center font-bold text-xs">
                          {user.name.split(" ").map((n) => n[0]).join("")}
                        </div>
                        <div>
                          <div className="text-sm font-semibold">{user.name}</div>
                          <div className="text-xs text-muted-foreground">{user.username}</div>
                        </div>
                      </button>
                    ))}
                  </div>
                )}
              </div>
            )}
          </div>

          {/* Amount Input */}
          <div>
            <label className="block text-xs font-bold uppercase tracking-wider text-muted-foreground mb-1.5" htmlFor="amount">
              Amount
            </label>
            <div className="flex items-center gap-2">
              <input
                id="amount"
                type="number"
                value={amount}
                onChange={(e) => setAmount(e.target.value)}
                placeholder="0.00"
                className="flex-1 h-12 px-4 bg-card border border-border rounded-lg text-lg font-bold text-right focus:border-foreground focus:ring-1 focus:ring-foreground focus:outline-none"
              />
              <div className="w-32 shrink-0">
                <Dropdown<"XLM" | "CAMP">
                  options={[
                    { value: "XLM", label: "XLM" },
                    { value: "CAMP", label: "CAMP" },
                  ]}
                  value={asset}
                  onChange={(val) => setAsset(val)}
                />
              </div>
            </div>
            <p className="text-xs text-muted-foreground mt-2 text-right">
              {convertedValue}
            </p>
          </div>

          {/* Memo Input */}
          <div>
            <label className="block text-xs font-bold uppercase tracking-wider text-muted-foreground mb-1.5" htmlFor="memo">
              Memo (Optional)
            </label>
            <input
              id="memo"
              type="text"
              value={memo}
              onChange={(e) => setMemo(e.target.value)}
              placeholder="What's this for?"
              className="w-full h-12 px-4 bg-card border border-border rounded-lg text-sm placeholder:text-muted-foreground/60 focus:border-foreground focus:ring-1 focus:ring-foreground focus:outline-none"
            />
          </div>

          {/* Action Button */}
          <button className="w-full h-12 mt-4 bg-primary text-primary-foreground font-semibold rounded-lg hover:bg-primary/95 transition-all flex items-center justify-center gap-2 cursor-pointer active:scale-[0.99]">
            <span>Review & Send</span>
            <ArrowUpRight className="h-4 w-4" />
          </button>
        </div>
      )}

      {/* 3. Receive View */}
      {activeTab === "receive" && (
        <div className="flex flex-col items-center gap-6 pt-2">
          <div className="text-center">
            <h3 className="text-lg font-bold mb-1">Scan to Receive</h3>
            <p className="text-xs text-muted-foreground max-w-[260px] mx-auto leading-relaxed">
              Show this QR code to anyone on CampusChain to receive payments instantly.
            </p>
          </div>

          {/* QR representation using standard styled elements */}
          <div className="w-48 h-48 bg-white border border-border rounded-xl flex items-center justify-center p-4 relative shadow-inner">
            <div className="grid grid-cols-5 gap-2 w-full h-full p-2 opacity-85">
              {/* QR pattern illusion */}
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
            {/* Corners markers */}
            <div className="absolute top-6 left-6 w-12 h-12 border-4 border-primary rounded flex items-center justify-center">
              <div className="w-4 h-4 bg-primary rounded-sm"></div>
            </div>
            <div className="absolute top-6 right-6 w-12 h-12 border-4 border-primary rounded flex items-center justify-center">
              <div className="w-4 h-4 bg-primary rounded-sm"></div>
            </div>
            <div className="absolute bottom-6 left-6 w-12 h-12 border-4 border-primary rounded flex items-center justify-center">
              <div className="w-4 h-4 bg-primary rounded-sm"></div>
            </div>
            {/* Minimal QrCode central overlay */}
            <div className="absolute bg-white p-1 rounded-md border border-border">
              <QrCode className="h-6 w-6 text-primary" />
            </div>
          </div>

          {/* Wallet Address Copyable */}
          <div className="w-full flex flex-col gap-1.5">
            <label className="text-xs font-bold uppercase tracking-wider text-muted-foreground" htmlFor="wallet-address">
              Your Wallet Address
            </label>
            <div className="flex items-center gap-2 bg-muted/65 p-2 rounded-lg border border-border">
              <span id="wallet-address" className="flex-1 text-xs text-muted-foreground font-mono select-all truncate pl-2">
                {address || "GAXX...3K9L"}
              </span>
              <button
                onClick={handleCopy}
                className="p-2 bg-card border border-border rounded-md text-muted-foreground hover:text-foreground transition-colors cursor-pointer shrink-0"
                title="Copy Address"
              >
                {copied ? <Check className="h-4 w-4 text-emerald-600" /> : <Copy className="h-4 w-4" />}
              </button>
            </div>
          </div>

          {/* Share Button */}
          <button className="w-full h-12 bg-card border border-border text-foreground font-semibold rounded-lg hover:bg-accent transition-colors flex items-center justify-center gap-2 cursor-pointer">
            <Share2 className="h-4 w-4" />
            <span>Share QR Code</span>
          </button>
        </div>
      )}
    </div>
  );
}
export default SendReceive;
