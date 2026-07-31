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

export async function fetchUtilityReward(id: number, address?: string) {
  const res = (await readContract(
    NEXT_PUBLIC_CAMPUS_SERVICE_CONTRACT_ID,
    "get_utility_reward",
    [u64ToScVal(id)],
    address
  )) as unknown as { id: bigint; name: string; cost_camp: bigint; stock: number };

  if (!res) return null;
  return {
    id: Number(res.id),
    name: String(res.name),
    cost_camp: Number(res.cost_camp) / 10_000_000,
    stock: Number(res.stock),
  };
}

type RawReward = { id: bigint; name: string; cost_camp: bigint; stock: number };
function parseReward(res: RawReward) {
  return { id: Number(res.id), name: String(res.name), cost_camp: Number(res.cost_camp) / 10_000_000, stock: Number(res.stock) };
}

export async function fetchUtilityRewards(startAfter = 0, limit = 50, address?: string) {
  const res = await readContract(NEXT_PUBLIC_CAMPUS_SERVICE_CONTRACT_ID, "list_utility_rewards", [u64ToScVal(startAfter), u32ToScVal(limit)], address);
  return Array.isArray(res) ? (res as RawReward[]).map(parseReward) : [];
}

export async function fetchNativeToken(address?: string): Promise<string | null> {
  const res = await readContract(NEXT_PUBLIC_CAMPUS_SERVICE_CONTRACT_ID, "native_token_contract", [], address);
  return res ? String(res) : null;
}

export async function executeCreateUtilityReward(
  admin: string,
  name: string,
  costCamp: number,
  stock: number
): Promise<string> {
  const rawCost = BigInt(Math.round(costCamp * 10_000_000));
  return invokeContractMethod(
    NEXT_PUBLIC_CAMPUS_SERVICE_CONTRACT_ID,
    "create_utility_reward",
    [
      addressToScVal(admin),
      stringToScVal(name),
      i128ToScVal(rawCost),
      u32ToScVal(stock),
    ],
    admin,
    signTx
  );
}

export async function executeRedeemReward(student: string, rewardId: number): Promise<string> {
  return invokeContractMethod(
    NEXT_PUBLIC_CAMPUS_SERVICE_CONTRACT_ID,
    "redeem_reward",
    [addressToScVal(student), u64ToScVal(rewardId)],
    student,
    signTx
  );
}

export async function executeClaimFaucet(recipient: string): Promise<string> {
  return invokeContractMethod(
    NEXT_PUBLIC_CAMPUS_SERVICE_CONTRACT_ID,
    "claim_faucet",
    [addressToScVal(recipient)],
    recipient,
    signTx
  );
}

export async function fetchHasClaimedFaucet(address: string): Promise<boolean> {
  const res = await readContract(
    NEXT_PUBLIC_CAMPUS_SERVICE_CONTRACT_ID,
    "has_claimed_faucet",
    [addressToScVal(address)],
    address
  );
  return Boolean(res);
}

export async function executeBuyCampTokens(recipient: string, xlmAmount: string): Promise<string> {
  const nativeToken = await fetchNativeToken(recipient);
  if (!nativeToken) throw new Error("The CAMP purchase contract has no configured native XLM token.");
  const latestLedger = await (await import("@/shared/stellar/client")).getRpcServer().getLatestLedger();
  await invokeContractMethod(
    nativeToken,
    "approve",
    [
      addressToScVal(recipient),
      addressToScVal(NEXT_PUBLIC_CAMPUS_SERVICE_CONTRACT_ID),
      i128ToScVal(xlmAmount),
      u32ToScVal(latestLedger.sequence + 10_000),
    ],
    recipient,
    signTx
  );
  return invokeContractMethod(
    NEXT_PUBLIC_CAMPUS_SERVICE_CONTRACT_ID,
    "buy_camp_tokens",
    [addressToScVal(recipient), i128ToScVal(xlmAmount)],
    recipient,
    signTx
  );
}
