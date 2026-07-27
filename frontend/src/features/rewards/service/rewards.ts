import {
  readContract,
  invokeContractMethod,
  sendNativePayment,
  addressToScVal,
  i128ToScVal,
  u32ToScVal,
  u64ToScVal,
  stringToScVal,
  NEXT_PUBLIC_CAMPUS_SERVICE_CONTRACT_ID,
  NEXT_PUBLIC_CAMPUS_ADMIN_ADDRESS,
} from "@/shared/stellar/client";
import { signTx } from "@/features/wallet/service/wallet";
import { nativeToScVal } from "@stellar/stellar-sdk";

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
  // 1. Perform Horizon payment for XLM to admin address
  const xlmDecimal = (Number(xlmAmount) / 10_000_000).toFixed(7);
  await sendNativePayment(
    NEXT_PUBLIC_CAMPUS_ADMIN_ADDRESS,
    xlmDecimal,
    recipient,
    signTx
  );

  // 2. Invoke contract function to record and mint
  return invokeContractMethod(
    NEXT_PUBLIC_CAMPUS_SERVICE_CONTRACT_ID,
    "buy_camp_tokens",
    [addressToScVal(recipient), nativeToScVal(xlmAmount, { type: "i128" } as never)],
    recipient,
    signTx
  );
}
