"use client";

import { AlertCircle, PackageOpen, Receipt } from "lucide-react";
import { Skeleton } from "@/shared/ui/Skeleton";
import { useWallet } from "@/shared/stellar/useWallet";
import { useCampusUserRole } from "@/features/wallet/hooks/useWallet";
import { useEscrows, useMarketplaceListings } from "@/features/marketplace/hooks/useMarketplace";

export function MerchantDashboard() {
  const { address } = useWallet();
  const role = useCampusUserRole(address);
  const escrows = useEscrows(address ?? undefined);
  const listings = useMarketplaceListings(address ?? undefined);
  if (role.isLoading) return <div className="p-8 bg-card border border-border rounded-xl"><Skeleton className="h-6 w-1/3" /><Skeleton className="mt-4 h-24 w-full" /></div>;
  if (role.data !== 2 && role.data !== 4) return <div className="p-8 text-center bg-card border border-border rounded-xl"><AlertCircle className="h-10 w-10 mx-auto text-destructive" /><h2 className="mt-3 font-bold">Merchant access required</h2><p className="mt-1 text-xs text-muted-foreground">Your connected on-chain profile does not have the Merchant role.</p></div>;
  const merchantEscrows = escrows.data?.filter((escrow) => escrow.seller === address) ?? [];
  const merchantListings = listings.data?.filter((listing) => listing.seller === address) ?? [];
  return <div className="max-w-6xl mx-auto grid lg:grid-cols-2 gap-6"><section className="bg-card border border-border rounded-xl p-6"><div className="flex items-center gap-2"><Receipt className="h-5 w-5" /><h2 className="font-bold">Escrows payable to you</h2></div>{escrows.isLoading ? <div className="mt-5 space-y-3"><Skeleton className="h-12 w-full" /><Skeleton className="h-12 w-full" /></div> : merchantEscrows.length === 0 ? <p className="mt-5 text-xs text-muted-foreground">No escrow records name this merchant wallet as seller.</p> : <div className="mt-5 divide-y divide-border">{merchantEscrows.map((escrow) => <div key={escrow.id} className="py-3 flex justify-between text-xs"><div><p className="font-bold">Escrow #{escrow.id}</p><p className="mt-1 text-muted-foreground font-mono truncate max-w-48" title={escrow.buyer}>Buyer: {escrow.buyer}</p></div><div className="text-right"><p className="font-bold">{escrow.amount.toLocaleString()} CAMP</p><p className="mt-1 text-muted-foreground">{escrow.status === 1 ? "Funded" : escrow.status === 2 ? "Released" : "Refunded"}</p></div></div>)}</div>}</section><section className="bg-card border border-border rounded-xl p-6"><div className="flex items-center gap-2"><PackageOpen className="h-5 w-5" /><h2 className="font-bold">Your marketplace listings</h2></div>{listings.isLoading ? <div className="mt-5 space-y-3"><Skeleton className="h-12 w-full" /><Skeleton className="h-12 w-full" /></div> : merchantListings.length === 0 ? <p className="mt-5 text-xs text-muted-foreground">No on-chain marketplace listings belong to this wallet.</p> : <div className="mt-5 divide-y divide-border">{merchantListings.map((listing) => <div key={listing.id} className="py-3 flex justify-between gap-4 text-xs"><div className="min-w-0"><p className="font-bold truncate" title={listing.title}>{listing.title}</p><p className="mt-1 text-muted-foreground">Listing #{listing.id} · {listing.status === 1 ? "Active" : listing.status === 2 ? "Sold" : "Cancelled"}</p></div><p className="font-bold shrink-0">{listing.price.toLocaleString()} CAMP</p></div>)}</div>}</section></div>;
}
export default MerchantDashboard;
