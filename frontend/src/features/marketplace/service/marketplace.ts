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
  const res = (await readContract(
    NEXT_PUBLIC_CAMPUS_SERVICE_CONTRACT_ID,
    "get_listing",
    [u64ToScVal(id)],
    address
  )) as unknown as { id: bigint; seller: string; title: string; description: string; price: bigint; category: number; status: number; escrow_enabled: boolean };

  if (!res) return null;
  return {
    id: Number(res.id),
    seller: String(res.seller),
    title: String(res.title),
    description: String(res.description),
    price: Number(res.price) / 10_000_000,
    category: Number(res.category),
    status: Number(res.status),
    escrow_enabled: Boolean(res.escrow_enabled),
  };
}

export async function executeCreateListing(
  seller: string,
  title: string,
  description: string,
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
