"use client";

import { useState } from "react";
import { useWallet } from "@/shared/stellar/useWallet";
import { Skeleton } from "@/shared/ui/Skeleton";
import { Dropdown } from "@/shared/ui/Dropdown";
import { useMutation, useQueryClient } from "@tanstack/react-query";
import {
  useCampusBalance,
  useCampusUserRole,
} from "@/features/wallet/hooks/useWallet";
import {
  useClaimFaucetMutation,
  useHasClaimedFaucet,
  useBuyCampTokensMutation,
  useRedeemRewardMutation,
} from "@/features/rewards/hooks/useRewards";
import {
  ArrowUpDown,
  Info,
  Trophy,
  UserCheck,
  HeartHandshake,
  Utensils,
  BookOpen,
  Printer,
  Dumbbell,
  Gift,
  Coins,
} from "lucide-react";

type RewardsState = "success" | "loading" | "empty";

interface EarningItem {
  id: string;
  title: string;
  date: string;
  amount: string;
  icon: React.ComponentType<React.SVGProps<SVGSVGElement>>;
}

interface RewardItem {
  id: number;
  title: string;
  description: string;
  cost: string;
  costNum: number;
  icon: React.ComponentType<React.SVGProps<SVGSVGElement>>;
}

const mockEarnings: EarningItem[] = [
  { id: "ern1", title: "Hackathon Winner", date: "Oct 24, 2023", amount: "+1,500 CAMP", icon: Trophy },
  { id: "ern2", title: "Tech Talk Attendance", date: "Oct 20, 2023", amount: "+250 CAMP", icon: UserCheck },
  { id: "ern3", title: "Peer Mentorship", date: "Oct 15, 2023", amount: "+500 CAMP", icon: HeartHandshake },
];

const mockRewards: RewardItem[] = [
  { id: 1, title: "Cafeteria Discount", description: "20% off any meal at the main dining hall.", cost: "500 CAMP", costNum: 500, icon: Utensils },
  { id: 2, title: "Bookstore Voucher", description: "$15 credit towards supplies or apparel.", cost: "1,200 CAMP", costNum: 1200, icon: BookOpen },
  { id: 3, title: "Print Credits", description: "100 pages of black and white printing at library hubs.", cost: "200 CAMP", costNum: 200, icon: Printer },
  { id: 4, title: "Gym Guest Pass", description: "One day access for a non-student guest.", cost: "800 CAMP", costNum: 800, icon: Dumbbell },
];

export function Rewards() {
  const { address } = useWallet();
  const [rewardsState, setRewardsState] = useState<RewardsState>("success");
  const [showConverter, setShowConverter] = useState(false);
  const [xlmAmount, setXlmAmount] = useState("");
  const [statusMsg, setStatusMsg] = useState<{ type: "success" | "error" | "info"; text: string } | null>(null);

  // Rate: 1 XLM = 100 CAMP
  const campCalculated = xlmAmount ? Math.floor(parseFloat(xlmAmount) * 100).toString() : "0";

  // Fetch balance and faucet state
  const { data: campBalance, isLoading: isBalanceLoading } = useCampusBalance(address);
  const { data: hasClaimed, isLoading: isFaucetLoading } = useHasClaimedFaucet(address || undefined);

  // Mutations
  const claimFaucetMutation = useClaimFaucetMutation();
  const buyCampMutation = useBuyCampTokensMutation();
  const redeemRewardMutation = useRedeemRewardMutation();

  const handleClaimFaucet = () => {
    if (!address) return;
    setStatusMsg({ type: "info", text: "Submitting faucet claim transaction..." });
    claimFaucetMutation.mutate(
      { recipient: address },
      {
        onSuccess: (txHash) => {
          setStatusMsg({ type: "success", text: `Faucet claimed! 100 CAMP added. Hash: ${txHash.slice(0, 8)}...${txHash.slice(-8)}` });
        },
        onError: (err: unknown) => {
          const msg = err instanceof Error ? err.message : String(err);
          setStatusMsg({ type: "error", text: `Faucet failed: ${msg}` });
        },
      }
    );
  };

  const handleSwap = () => {
    if (!address || !xlmAmount) return;
    const rawXlmBigInt = BigInt(Math.round(parseFloat(xlmAmount) * 10_000_000));
    setStatusMsg({ type: "info", text: "Submitting XLM -> CAMP swap transaction..." });
    
    buyCampMutation.mutate(
      { recipient: address, xlmAmount: rawXlmBigInt.toString() },
      {
        onSuccess: (txHash) => {
          setStatusMsg({ type: "success", text: `Swapped! CAMP tokens minted. Hash: ${txHash.slice(0, 8)}...${txHash.slice(-8)}` });
          setXlmAmount("");
          setShowConverter(false);
        },
        onError: (err: unknown) => {
          const msg = err instanceof Error ? err.message : String(err);
          setStatusMsg({ type: "error", text: `Swap failed: ${msg}` });
        },
      }
    );
  };

  const handleRedeem = (rewardId: number, cost: number) => {
    if (!address) return;
    if (campBalance !== undefined && campBalance < cost) {
      setStatusMsg({ type: "error", text: "Insufficient CAMP balance to redeem this utility." });
      return;
    }
    setStatusMsg({ type: "info", text: "Submitting redemption transaction..." });
    redeemRewardMutation.mutate(
      { student: address, rewardId },
      {
        onSuccess: (txHash) => {
          setStatusMsg({ type: "success", text: `Redemption complete! Reward code generated. Hash: ${txHash.slice(0, 8)}...${txHash.slice(-8)}` });
        },
        onError: (err: unknown) => {
          const msg = err instanceof Error ? err.message : String(err);
          setStatusMsg({ type: "error", text: `Redemption failed: ${msg}` });
        },
      }
    );
  };

  return (
    <div className="w-full space-y-6">
      {/* Top Navbar Action */}
      <div className="flex justify-between items-center">
        <h3 className="text-sm font-bold text-foreground">Available Rewards Options</h3>
        <div className="w-40">
          <Dropdown<RewardsState>
            options={[
              { value: "success", label: "State: Loaded" },
              { value: "loading", label: "State: Loading" },
              { value: "empty", label: "State: Empty" },
            ]}
            value={rewardsState}
            onChange={(val) => setRewardsState(val)}
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

      {/* Main split grid */}
      <div className="grid grid-cols-1 lg:grid-cols-12 gap-6 items-start">
        
        {/* Left Column: Balance & Convert & Faucet */}
        <div className="lg:col-span-5 flex flex-col gap-6">
          
          {/* Balance Card */}
          {isBalanceLoading || rewardsState === "loading" ? (
            <div className="bg-card border border-border p-6 rounded-2xl space-y-4">
              <Skeleton className="h-4 w-28" />
              <Skeleton className="h-10 w-44" />
            </div>
          ) : (
            <div className="bg-card border border-border p-6 rounded-2xl shadow-sm">
              <h3 className="text-xs font-bold text-muted-foreground uppercase tracking-wider mb-2">
                Available Balance
              </h3>
              <div className="flex items-baseline gap-2 mb-1">
                <span className="text-3xl font-black tracking-tight">
                  {campBalance !== undefined ? campBalance.toLocaleString() : "4,250"}
                </span>
                <span className="text-sm font-bold text-muted-foreground">CAMP</span>
              </div>
              <p className="text-xs text-muted-foreground mb-6">≈ {((campBalance || 0) * 0.11).toFixed(2)} XLM</p>

              <div className="bg-muted/50 border border-border rounded-lg p-3 flex justify-between items-center mb-4 text-xs">
                <span className="text-muted-foreground flex items-center gap-1">
                  <Info className="h-4 w-4" />
                  <span>Swap Rate</span>
                </span>
                <span className="font-bold text-foreground">1 XLM = 100 CAMP</span>
              </div>

              <button
                onClick={() => setShowConverter(!showConverter)}
                className={`w-full h-11 bg-primary text-primary-foreground font-semibold rounded-lg flex items-center justify-center gap-2 hover:bg-primary/95 transition-all cursor-pointer ${
                  showConverter ? "opacity-75" : ""
                }`}
              >
                <ArrowUpDown className="h-4 w-4" />
                <span>Convert XLM to CAMP</span>
              </button>

              {/* Converter Panel */}
              {showConverter && (
                <div className="mt-4 pt-4 border-t border-border space-y-4 animate-in slide-in-from-top-2 duration-200">
                  <div className="space-y-3">
                    <div>
                      <label className="block text-[10px] uppercase font-bold tracking-wider text-muted-foreground mb-1">
                        From XLM
                      </label>
                      <div className="relative">
                        <input
                          type="number"
                          value={xlmAmount}
                          onChange={(e) => setXlmAmount(e.target.value)}
                          placeholder="0.00"
                          className="w-full h-10 px-3 bg-card border border-border rounded-lg text-sm placeholder:text-muted-foreground/60 focus:border-foreground focus:outline-none"
                        />
                        <span className="absolute right-3 top-1/2 -translate-y-1/2 text-xs font-bold text-muted-foreground">
                          XLM
                        </span>
                      </div>
                    </div>

                    <div className="flex justify-center -my-2.5 z-10 relative">
                      <div className="bg-card border border-border rounded-full p-1.5 text-muted-foreground shadow-sm">
                        <ArrowUpDown className="h-4 w-4" />
                      </div>
                    </div>

                    <div>
                      <label className="block text-[10px] uppercase font-bold tracking-wider text-muted-foreground mb-1">
                        To CAMP
                      </label>
                      <div className="relative font-mono">
                        <input
                          type="text"
                          value={campCalculated}
                          readOnly
                          className="w-full h-10 px-3 bg-muted/65 border border-border rounded-lg text-sm focus:outline-none select-none text-muted-foreground font-semibold"
                        />
                        <span className="absolute right-3 top-1/2 -translate-y-1/2 text-xs font-bold text-muted-foreground">
                          CAMP
                        </span>
                      </div>
                    </div>

                    <button
                      onClick={handleSwap}
                      disabled={buyCampMutation.isPending}
                      className="w-full h-10 border border-border bg-card hover:bg-accent text-foreground font-semibold rounded-lg text-xs transition-colors mt-2 cursor-pointer disabled:opacity-50"
                    >
                      {buyCampMutation.isPending ? "Swapping..." : "Confirm Swap"}
                    </button>
                  </div>
                </div>
              )}
            </div>
          )}

          {/* Faucet card */}
          <div className="bg-card border border-border p-6 rounded-2xl shadow-sm">
            <h3 className="text-xs font-bold text-muted-foreground uppercase tracking-wider mb-2">
              Daily Faucet Claim
            </h3>
            <p className="text-xs text-muted-foreground leading-relaxed mb-4">
              Get free 100 CAMP daily to test campus apps, events, and scholarships.
            </p>
            <button
              onClick={handleClaimFaucet}
              disabled={hasClaimed || claimFaucetMutation.isPending || isFaucetLoading}
              className="w-full h-11 bg-card border border-border hover:bg-accent text-foreground font-semibold rounded-lg flex items-center justify-center gap-2 cursor-pointer transition-colors disabled:opacity-50 disabled:cursor-not-allowed"
            >
              <Coins className="h-4.5 w-4.5" />
              <span>
                {claimFaucetMutation.isPending
                  ? "Claiming..."
                  : hasClaimed
                  ? "Already Claimed Today"
                  : "Claim 100 CAMP"}
              </span>
            </button>
          </div>

          {/* Earn History */}
          <div className="bg-card border border-border p-6 rounded-2xl shadow-sm">
            <div className="flex justify-between items-center mb-5">
              <h3 className="text-xs font-bold text-foreground uppercase tracking-wider">Recent Earnings</h3>
            </div>

            <div className="divide-y divide-border">
              {mockEarnings.map((item) => {
                const Icon = item.icon;
                return (
                  <div key={item.id} className="flex justify-between items-center py-3 first:pt-0 last:pb-0">
                    <div className="flex items-center gap-3">
                      <div className="w-9 h-9 bg-muted rounded-full flex items-center justify-center text-foreground shrink-0 select-none">
                        <Icon className="h-4.5 w-4.5" />
                      </div>
                      <div>
                        <p className="text-xs font-bold text-foreground leading-snug">{item.title}</p>
                        <p className="text-[10px] text-muted-foreground mt-0.5">{item.date}</p>
                      </div>
                    </div>
                    <span className="text-xs font-bold text-foreground">{item.amount}</span>
                  </div>
                );
              })}
            </div>
          </div>

        </div>

        {/* Right Column: Redeem Rewards grid */}
        <div className="lg:col-span-7 flex flex-col gap-4">
          <div>
            <h3 className="text-base font-bold text-foreground">Redeem Rewards</h3>
            <p className="text-xs text-muted-foreground mt-0.5">
              Exchange your CAMP tokens for various campus utilities.
            </p>
          </div>

          {rewardsState === "loading" ? (
            <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
              {[1, 2].map((i) => (
                <div key={i} className="bg-card border border-border p-5 rounded-2xl space-y-3">
                  <Skeleton className="w-10 h-10 rounded-lg" />
                  <Skeleton className="h-4 w-28" />
                  <Skeleton className="h-10 w-full" />
                </div>
              ))}
            </div>
          ) : rewardsState === "empty" ? (
            <div className="p-16 border border-border rounded-2xl bg-card text-center flex flex-col items-center justify-center gap-3 shadow-sm">
              <Gift className="h-12 w-12 text-muted-foreground/50" />
              <h3 className="text-md font-bold">No Rewards Offered</h3>
              <p className="text-xs text-muted-foreground max-w-[260px] mx-auto leading-relaxed">
                There are no available redeemable rewards offered by campus merchants at this time.
              </p>
            </div>
          ) : (
            <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
              {mockRewards.map((item) => {
                const Icon = item.icon;
                return (
                  <div
                    key={item.id}
                    className="bg-card border border-border p-5 rounded-2xl flex flex-col h-full hover:border-foreground/35 transition-all duration-200 group shadow-sm"
                  >
                    <div className="h-10 w-10 bg-muted rounded-lg flex items-center justify-center text-foreground mb-4 group-hover:bg-primary group-hover:text-primary-foreground transition-colors shrink-0 select-none">
                      <Icon className="h-5 w-5" />
                    </div>
                    <h4 className="text-xs font-bold text-foreground mb-1 leading-snug group-hover:text-primary transition-colors">
                      {item.title}
                    </h4>
                    <p className="text-[10px] text-muted-foreground flex-grow mb-4 leading-relaxed">
                      {item.description}
                    </p>
                    <div className="flex justify-between items-center mt-auto pt-2 border-t border-border/60">
                      <span className="text-xs font-black text-foreground">{item.cost}</span>
                      <button
                        onClick={() => handleRedeem(item.id, item.costNum)}
                        disabled={redeemRewardMutation.isPending}
                        className="border border-border text-foreground font-bold px-3 py-1.5 rounded-lg text-[10px] uppercase tracking-wider hover:bg-accent transition-colors cursor-pointer disabled:opacity-50"
                      >
                        Redeem
                      </button>
                    </div>
                  </div>
                );
              })}
            </div>
          )}
        </div>

      </div>
    </div>
  );
}
export default Rewards;
