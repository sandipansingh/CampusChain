"use client";

import { useState } from "react";
import { Coins, Gift, Info } from "lucide-react";
import { Skeleton } from "@/shared/ui/Skeleton";
import { useWallet } from "@/shared/stellar/useWallet";
import { NEXT_PUBLIC_CAMPUS_SERVICE_CONTRACT_ID } from "@/shared/stellar/client";
import { useApproveMutation } from "@/features/wallet/hooks/useWallet";
import { useClaimFaucetMutation, useHasClaimedFaucet, useRedeemRewardMutation, useUtilityRewards } from "@/features/rewards/hooks/useRewards";

export function Rewards() {
  const { address } = useWallet();
  const faucet = useHasClaimedFaucet(address ?? undefined);
  const rewards = useUtilityRewards(address ?? undefined);
  const claim = useClaimFaucetMutation();
  const approve = useApproveMutation();
  const redeem = useRedeemRewardMutation();
  const [notice, setNotice] = useState<string | null>(null);

  const redeemReward = async (reward: { id: number; cost_camp: number }) => {
    if (!address) return;
    try {
      await approve.mutateAsync({ from: address, spender: NEXT_PUBLIC_CAMPUS_SERVICE_CONTRACT_ID, amount: reward.cost_camp });
      const hash = await redeem.mutateAsync({ student: address, rewardId: reward.id });
      setNotice(`Reward redemption confirmed: ${hash}`);
      await rewards.refetch();
    } catch (error) {
      setNotice(error instanceof Error ? error.message : "Redemption failed.");
    }
  };

  return (
    <div className="w-full max-w-5xl mx-auto grid lg:grid-cols-12 gap-6 items-start animate-in fade-in duration-300">
      {/* Left Column: Testnet Faucet */}
      <section className="lg:col-span-5 space-y-6">
        <div className="bg-card border border-border rounded-xl p-6 shadow-sm">
          <h3 className="font-bold text-foreground">Testnet Faucet</h3>
          <p className="mt-1 text-xs text-muted-foreground font-normal">
            Claim test CAMP tokens. One 100 CAMP claim per wallet under the current contract.
          </p>
          <button
            onClick={() => address && claim.mutate({ recipient: address })}
            disabled={!address || faucet.data || faucet.isLoading || claim.isPending}
            className="mt-4 h-11 w-full border border-border rounded-lg text-sm font-bold disabled:opacity-50 inline-flex items-center justify-center gap-2 cursor-pointer transition-colors"
          >
            <Coins className="h-4 w-4" />
            {faucet.data ? "Already claimed" : claim.isPending ? "Confirming claim" : "Claim 100 CAMP"}
          </button>
        </div>
      </section>

      {/* Right Column: Redeem Rewards */}
      <section className="lg:col-span-7 space-y-4">
        <div>
          <h2 className="text-base font-bold text-foreground">Redeem rewards</h2>
          <p className="mt-1 text-xs text-muted-foreground font-normal">
            Available utility rewards stored in CampusService.
          </p>
        </div>

        {notice && (
          <div className={notice.includes("confirmed") ? "text-xs text-emerald-700 break-all bg-emerald-50 border border-emerald-200 p-2.5 rounded-lg" : "text-xs text-destructive break-words bg-destructive/5 border border-destructive/20 p-2.5 rounded-lg"}>
            {notice}
          </div>
        )}

        {rewards.isLoading ? (
          <div className="grid sm:grid-cols-2 gap-4">
            {[1, 2].map((id) => (
              <div key={id} className="border border-border rounded-xl p-5 space-y-3 bg-card shadow-sm">
                <Skeleton className="h-5 w-2/3" />
                <Skeleton className="h-9 w-full" />
              </div>
            ))}
          </div>
        ) : rewards.isError ? (
          <div className="border border-destructive/30 rounded-xl p-6 bg-card">
            <p className="font-bold text-foreground">Could not load rewards.</p>
            <button onClick={() => void rewards.refetch()} className="mt-3 text-xs font-bold underline cursor-pointer">
              Retry
            </button>
          </div>
        ) : rewards.data?.filter((reward) => reward.stock > 0).length === 0 ? (
          <div className="p-16 border border-border rounded-xl text-center bg-card shadow-sm">
            <Gift className="h-10 w-10 mx-auto text-muted-foreground" />
            <p className="mt-3 text-sm font-bold text-foreground">No rewards are available</p>
          </div>
        ) : (
          <div className="grid sm:grid-cols-2 gap-4">
            {rewards.data?.filter((reward) => reward.stock > 0).map((reward) => (
              <article key={reward.id} className="bg-card border border-border rounded-xl p-5 flex flex-col gap-4 shadow-sm">
                <div>
                  <h3 className="text-sm font-bold break-words text-foreground" title={reward.name}>
                    {reward.name}
                  </h3>
                  <p className="mt-1 text-xs text-muted-foreground font-normal">
                    {reward.stock} remaining
                  </p>
                </div>
                <div className="flex justify-between items-center border-t border-border pt-3">
                  <p className="text-sm font-bold text-foreground">
                    {reward.cost_camp.toLocaleString()} CAMP
                  </p>
                  <button
                    onClick={() => void redeemReward(reward)}
                    disabled={!address || approve.isPending || redeem.isPending}
                    className="border border-border rounded-lg px-3 py-1.5 text-xs font-bold disabled:opacity-50 cursor-pointer hover:bg-muted/30 transition-colors"
                  >
                    Redeem
                  </button>
                </div>
              </article>
            ))}
          </div>
        )}

        <p className="text-[11px] text-muted-foreground flex gap-1 items-center font-normal">
          <Info className="h-3.5 w-3.5 shrink-0" />
          A redemption is usable only after its confirmed on-chain record is created.
        </p>
      </section>
    </div>
  );
}

export default Rewards;
