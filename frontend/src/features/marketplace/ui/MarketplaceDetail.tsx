"use client";

import { ArrowLeft, CheckCircle2, Lock, PackageX, RotateCcw } from "lucide-react";
import { Skeleton } from "@/shared/ui/Skeleton";
import { useWallet } from "@/shared/stellar/useWallet";
import { NEXT_PUBLIC_CAMPUS_SERVICE_CONTRACT_ID } from "@/shared/stellar/client";
import { useApproveMutation } from "@/features/wallet/hooks/useWallet";
import { useBuyListingMutation, useEscrowAgreement, useListingEscrowId, useMarketplaceListing, useRefundEscrowMutation, useReleaseEscrowMutation } from "@/features/marketplace/hooks/useMarketplace";

interface MarketplaceDetailProps { listingId: number; onBack: () => void; }

export function MarketplaceDetail({ listingId, onBack }: MarketplaceDetailProps) {
  const { address } = useWallet();
  const listingQuery = useMarketplaceListing(listingId, address ?? undefined);
  const escrowIdQuery = useListingEscrowId(listingId, address ?? undefined);
  const escrowQuery = useEscrowAgreement(escrowIdQuery.data ?? null, address ?? undefined);
  const approve = useApproveMutation();
  const buy = useBuyListingMutation();
  const release = useReleaseEscrowMutation();
  const refund = useRefundEscrowMutation();

  const buyListing = async () => {
    const listing = listingQuery.data;
    if (!address || !listing) return;
    await approve.mutateAsync({ from: address, spender: NEXT_PUBLIC_CAMPUS_SERVICE_CONTRACT_ID, amount: listing.price });
    await buy.mutateAsync({ id: listing.id, buyer: address });
    await Promise.all([listingQuery.refetch(), escrowIdQuery.refetch()]);
  };

  if (listingQuery.isLoading) return <DetailSkeleton />;
  if (listingQuery.isError) return <ReadError title="Could not load this on-chain listing." message={listingQuery.error instanceof Error ? listingQuery.error.message : "Unknown read error"} retry={listingQuery.refetch} />;
  if (!listingQuery.data) return <div className="p-8 bg-card border border-border rounded-xl text-center"><PackageX className="h-8 w-8 mx-auto text-muted-foreground" /><p className="mt-3 text-sm font-semibold">Listing not found</p><button onClick={onBack} className="mt-4 text-xs font-bold underline">Back to marketplace</button></div>;
  const listing = listingQuery.data;
  const escrow = escrowQuery.data;
  const isBuying = approve.isPending || buy.isPending;

  return <div className="w-full max-w-4xl mx-auto space-y-6">
    <button onClick={onBack} className="inline-flex items-center gap-2 text-sm font-semibold text-muted-foreground hover:text-foreground"><ArrowLeft className="h-4 w-4" />Back to marketplace</button>
    <article className="bg-card border border-border rounded-xl p-6 md:p-8 grid md:grid-cols-12 gap-8">
      <div className="md:col-span-5 min-h-56 bg-muted/30 rounded-xl border border-border flex items-center justify-center overflow-hidden relative">
        {listing.imageUrl ? (
          <img
            src={listing.imageUrl}
            alt={listing.title}
            className="w-full h-full object-cover rounded-xl"
            onError={(e) => {
              (e.target as HTMLElement).style.display = "none";
              const parent = (e.target as HTMLElement).parentElement;
              if (parent) {
                const fallback = parent.querySelector(".detail-fallback");
                if (fallback) fallback.classList.remove("hidden");
              }
            }}
          />
        ) : null}
        <div className={`detail-fallback flex items-center justify-center ${listing.imageUrl ? "hidden" : ""}`}>
          <PackageX className="h-16 w-16 text-muted-foreground" />
        </div>
      </div>
      <div className="md:col-span-7 flex flex-col gap-5 min-w-0"><div><p className="text-xs text-muted-foreground">Listing #{listing.id}</p><h2 className="text-2xl font-bold break-words" title={listing.title}>{listing.title}</h2><p className="mt-3 text-3xl font-bold">{listing.price.toLocaleString()} CAMP</p></div><dl className="text-xs space-y-2"><div><dt className="text-muted-foreground">Seller</dt><dd className="font-mono truncate" title={listing.seller}>{listing.seller}</dd></div><div><dt className="text-muted-foreground">Description</dt><dd className="whitespace-pre-wrap break-words leading-relaxed">{listing.description}</dd></div></dl>
        {listing.status === 1 ? <button onClick={buyListing} disabled={!address || isBuying} className="h-12 bg-primary text-primary-foreground rounded-lg font-bold disabled:opacity-50 inline-flex items-center justify-center gap-2"><Lock className="h-4 w-4" />{isBuying ? "Confirming on-chain purchase" : listing.escrow_enabled ? "Buy with escrow" : "Buy listing"}</button> : <EscrowState listingId={listing.id} escrowId={escrowIdQuery.data} escrow={escrow} address={address} loading={escrowIdQuery.isLoading || escrowQuery.isLoading} releasing={release.isPending} refunding={refund.isPending} onRelease={() => escrowIdQuery.data && address && release.mutate({ escrowId: escrowIdQuery.data, caller: address })} onRefund={() => escrowIdQuery.data && address && refund.mutate({ escrowId: escrowIdQuery.data, caller: address })} />}
        {(approve.isError || buy.isError) && <p className="text-xs text-destructive break-words">{(approve.error ?? buy.error) instanceof Error ? (approve.error ?? buy.error)?.message : "Purchase was not confirmed."}</p>}
      </div>
    </article>
  </div>;
}

function EscrowState({ escrowId, escrow, address, loading, releasing, refunding, onRelease, onRefund }: { listingId: number; escrowId?: number | null; escrow?: { buyer: string; seller: string; amount: number; status: number } | null; address: string | null; loading: boolean; releasing: boolean; refunding: boolean; onRelease: () => void; onRefund: () => void }) {
  if (loading) return <Skeleton className="h-12 w-full" />;
  if (!escrowId) return <div className="border border-border rounded-lg p-4 text-xs"><CheckCircle2 className="inline h-4 w-4 mr-2" />This listing was sold directly on-chain.</div>;
  if (!escrow) return <div className="border border-destructive/30 rounded-lg p-4 text-xs">Escrow #{escrowId} could not be loaded.</div>;
  const status = escrow.status === 1 ? "Funds locked" : escrow.status === 2 ? "Funds released" : "Funds refunded";
  return <div className="border border-border rounded-lg p-4 space-y-3"><p className="text-sm font-bold">Escrow #{escrowId}: {status}</p><p className="text-xs text-muted-foreground">{escrow.amount.toLocaleString()} CAMP</p>{escrow.status === 1 && <div className="flex gap-3"><button onClick={onRelease} disabled={address !== escrow.buyer || releasing} className="flex-1 h-10 border border-border rounded-lg text-xs font-bold disabled:opacity-40">{releasing ? "Releasing" : "Release funds"}</button><button onClick={onRefund} disabled={address !== escrow.seller || refunding} className="flex-1 h-10 border border-border rounded-lg text-xs font-bold disabled:opacity-40 inline-flex justify-center items-center gap-1"><RotateCcw className="h-3.5 w-3.5" />{refunding ? "Refunding" : "Refund buyer"}</button></div>}</div>;
}
function DetailSkeleton() { return <div className="max-w-4xl mx-auto bg-card border border-border rounded-xl p-8 grid md:grid-cols-12 gap-8"><Skeleton className="md:col-span-5 h-56 w-full" /><div className="md:col-span-7 space-y-4"><Skeleton className="h-8 w-3/4" /><Skeleton className="h-6 w-1/3" /><Skeleton className="h-24 w-full" /></div></div>; }
function ReadError({ title, message, retry }: { title: string; message: string; retry: () => void }) { return <div className="p-6 bg-card border border-destructive/30 rounded-xl"><p className="font-bold">{title}</p><p className="text-xs text-muted-foreground mt-1 break-words">{message}</p><button onClick={() => retry()} className="mt-3 text-xs font-bold underline">Retry</button></div>; }

export default MarketplaceDetail;
