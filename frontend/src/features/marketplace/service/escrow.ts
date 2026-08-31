import {
  readContract,
  invokeContractMethod,
  addressToScVal,
  i128ToScVal,
  u32ToScVal,
  u64ToScVal,
  NEXT_PUBLIC_CAMPUS_SERVICE_CONTRACT_ID,
} from "@/shared/stellar/client";
import { signTx } from "@/features/wallet/service/wallet";

export async function fetchEscrow(escrowId: number, address?: string) {
  const caller = address || "GCFIRY65OQE7DFP5KLNS2PF2LVZMUZYJX4OZIEQ36N2IQANUB5XVYOJR";
  const res = (await readContract(
    NEXT_PUBLIC_CAMPUS_SERVICE_CONTRACT_ID,
    "get_escrow",
    [u64ToScVal(escrowId), addressToScVal(caller)],
    address
  )) as unknown as { id: bigint; buyer: string; seller: string; university_code?: string; amount: bigint; status: number };

  if (!res) return null;
  return {
    id: Number(res.id),
    buyer: String(res.buyer),
    seller: String(res.seller),
    universityCode: String(res.university_code ?? ""),
    amount: Number(res.amount) / 10_000_000,
    status: Number(res.status),
  };
}

export async function fetchEscrows(startAfter = 0, limit = 50, address?: string) {
  const caller = address || "GCFIRY65OQE7DFP5KLNS2PF2LVZMUZYJX4OZIEQ36N2IQANUB5XVYOJR";
  const res = await readContract(
    NEXT_PUBLIC_CAMPUS_SERVICE_CONTRACT_ID,
    "list_escrows",
    [addressToScVal(caller), u64ToScVal(startAfter), u32ToScVal(limit)],
    address
  ) as unknown[];
  if (!Array.isArray(res)) return [];
  return res.map((entry) => {
    const escrow = entry as { id: bigint; buyer: string; seller: string; university_code?: string; amount: bigint; status: number };
    return { id: Number(escrow.id), buyer: String(escrow.buyer), seller: String(escrow.seller), universityCode: String(escrow.university_code ?? ""), amount: Number(escrow.amount) / 10_000_000, status: Number(escrow.status) };
  });
}

export async function executeCreateEscrow(buyer: string, seller: string, amount: number): Promise<string> {
  const rawAmount = BigInt(Math.round(amount * 10_000_000));
  return invokeContractMethod(
    NEXT_PUBLIC_CAMPUS_SERVICE_CONTRACT_ID,
    "create_escrow",
    [addressToScVal(buyer), addressToScVal(seller), i128ToScVal(rawAmount)],
    buyer,
    signTx
  );
}

export async function executeReleaseEscrow(escrowId: number, caller: string): Promise<string> {
  return invokeContractMethod(
    NEXT_PUBLIC_CAMPUS_SERVICE_CONTRACT_ID,
    "release_escrow",
    [u64ToScVal(escrowId), addressToScVal(caller)],
    caller,
    signTx
  );
}

export async function executeRefundEscrow(escrowId: number, caller: string): Promise<string> {
  return invokeContractMethod(
    NEXT_PUBLIC_CAMPUS_SERVICE_CONTRACT_ID,
    "refund_escrow",
    [u64ToScVal(escrowId), addressToScVal(caller)],
    caller,
    signTx
  );
}
