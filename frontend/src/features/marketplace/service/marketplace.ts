import {
  readContract,
  invokeContractMethod,
  addressToScVal,
  i128ToScVal,
  u32ToScVal,
  u64ToScVal,
  stringToScVal,
  NEXT_PUBLIC_CAMPUS_SERVICE_CONTRACT_ID,
} from "@/shared/stellar/client";
import { signTx } from "@/features/wallet/service/wallet";
import { nativeToScVal } from "@stellar/stellar-sdk";

export async function fetchListing(id: number, address?: string) {
  if (!address) return null;
  const res = (await readContract(
    NEXT_PUBLIC_CAMPUS_SERVICE_CONTRACT_ID,
    "get_listing",
    [u64ToScVal(id), addressToScVal(address)],
    address
  )) as unknown as { id: bigint; seller: string; title: string; description: string; image_url?: string; price: bigint; category: number; status: number; escrow_enabled: boolean };

  if (!res) return null;
  return {
    id: Number(res.id),
    seller: String(res.seller),
    title: String(res.title),
    description: String(res.description),
    imageUrl: res.image_url ? String(res.image_url) : "",
    price: Number(res.price) / 10_000_000,
    category: Number(res.category),
    status: Number(res.status),
    escrow_enabled: Boolean(res.escrow_enabled),
  };
}

type RawListing = { id: bigint; seller: string; title: string; description: string; image_url?: string; price: bigint; category: number; status: number; escrow_enabled: boolean };

function parseListing(res: RawListing) {
  return {
    id: Number(res.id),
    seller: String(res.seller),
    title: String(res.title),
    description: String(res.description),
    imageUrl: res.image_url ? String(res.image_url) : "",
    price: Number(res.price) / 10_000_000,
    category: Number(res.category),
    status: Number(res.status),
    escrow_enabled: Boolean(res.escrow_enabled),
  };
}

export async function fetchListings(startAfter = 0, limit = 50, address?: string) {
  if (!address) return [];
  const res = await readContract(
    NEXT_PUBLIC_CAMPUS_SERVICE_CONTRACT_ID,
    "list_listings",
    [addressToScVal(address), u64ToScVal(startAfter), u32ToScVal(limit)],
    address
  );
  if (!Array.isArray(res)) return [];
  return (res as RawListing[]).map(parseListing);
}

export async function fetchListingEscrow(listingId: number, address?: string): Promise<number | null> {
  if (!address) return null;
  const res = await readContract(
    NEXT_PUBLIC_CAMPUS_SERVICE_CONTRACT_ID,
    "get_listing_escrow",
    [u64ToScVal(listingId), addressToScVal(address)],
    address
  );
  return res === null || res === undefined ? null : Number(res);
}

export async function executeCreateListing(
  seller: string,
  title: string,
  description: string,
  imageUrl: string,
  price: number,
  category: number,
  escrowEnabled: boolean
): Promise<string> {
  const rawPrice = BigInt(Math.round(price * 10_000_000));
  return invokeContractMethod(
    NEXT_PUBLIC_CAMPUS_SERVICE_CONTRACT_ID,
    "create_listing",
    [
      addressToScVal(seller),
      stringToScVal(title),
      stringToScVal(description),
      stringToScVal(imageUrl || ""),
      i128ToScVal(rawPrice),
      u32ToScVal(category),
      nativeToScVal(escrowEnabled),
    ],
    seller,
    signTx
  );
}

export async function executeUpdateListing(
  id: number,
  seller: string,
  newPrice: number,
  newStatus: number
): Promise<string> {
  const rawPrice = BigInt(Math.round(newPrice * 10_000_000));
  return invokeContractMethod(
    NEXT_PUBLIC_CAMPUS_SERVICE_CONTRACT_ID,
    "update_listing",
    [
      u64ToScVal(id),
      addressToScVal(seller),
      i128ToScVal(rawPrice),
      u32ToScVal(newStatus),
    ],
    seller,
    signTx
  );
}

export async function executeBuyListing(id: number, buyer: string): Promise<string> {
  return invokeContractMethod(
    NEXT_PUBLIC_CAMPUS_SERVICE_CONTRACT_ID,
    "buy_listing",
    [u64ToScVal(id), addressToScVal(buyer)],
    buyer,
    signTx
  );
}
