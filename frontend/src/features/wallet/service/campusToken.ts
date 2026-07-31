import {
  readContract,
  invokeContractMethod,
  addressToScVal,
  i128ToScVal,
  u32ToScVal,
  u64ToScVal,
  NEXT_PUBLIC_CAMPUS_TOKEN_CONTRACT_ID,
  NEXT_PUBLIC_CAMPUS_SERVICE_CONTRACT_ID,
} from "@/shared/stellar/client";
import { signTx } from "./wallet";

export async function fetchBalance(address: string): Promise<number> {
  const res = await readContract(
    NEXT_PUBLIC_CAMPUS_TOKEN_CONTRACT_ID,
    "balance",
    [addressToScVal(address)],
    address
  );
  return Number(res) / 10_000_000;
}

export async function fetchUserRole(address: string): Promise<number> {
  const res = await readContract(
    NEXT_PUBLIC_CAMPUS_TOKEN_CONTRACT_ID,
    "get_role",
    [addressToScVal(address)],
    address
  );
  return Number(res);
}

export async function fetchTokenMetadata(address?: string) {
  const name = await readContract(NEXT_PUBLIC_CAMPUS_TOKEN_CONTRACT_ID, "name", [], address);
  const symbol = await readContract(NEXT_PUBLIC_CAMPUS_TOKEN_CONTRACT_ID, "symbol", [], address);
  const decimals = await readContract(NEXT_PUBLIC_CAMPUS_TOKEN_CONTRACT_ID, "decimals", [], address);
  const totalSupply = await readContract(NEXT_PUBLIC_CAMPUS_TOKEN_CONTRACT_ID, "total_supply", [], address);

  return {
    name: String(name || "CampusChain Token"),
    symbol: String(symbol || "CAMP"),
    decimals: Number(decimals || 7),
    totalSupply: Number(totalSupply || 0) / 10 ** Number(decimals || 7),
  };
}

export async function executeTransfer(from: string, to: string, amount: number): Promise<string> {
  const rawAmount = BigInt(Math.round(amount * 10_000_000));
  return invokeContractMethod(
    NEXT_PUBLIC_CAMPUS_TOKEN_CONTRACT_ID,
    "transfer",
    [addressToScVal(from), addressToScVal(to), i128ToScVal(rawAmount)],
    from,
    signTx
  );
}

export async function executeApprove(
  from: string,
  spender: string,
  amount: number,
  expirationLedger = 1000000
): Promise<string> {
  const rawAmount = BigInt(Math.round(amount * 10_000_000));
  return invokeContractMethod(
    NEXT_PUBLIC_CAMPUS_TOKEN_CONTRACT_ID,
    "approve",
    [
      addressToScVal(from),
      addressToScVal(spender),
      i128ToScVal(rawAmount),
      u32ToScVal(expirationLedger),
    ],
    from,
    signTx
  );
}

export async function executeSetRole(admin: string, user: string, role: number): Promise<string> {
  return invokeContractMethod(
    NEXT_PUBLIC_CAMPUS_TOKEN_CONTRACT_ID,
    "set_role",
    [addressToScVal(admin), addressToScVal(user), u32ToScVal(role)],
    admin,
    signTx
  );
}

export async function executeRequestRoleChange(applicant: string, requestedRole: number): Promise<string> {
  return invokeContractMethod(
    NEXT_PUBLIC_CAMPUS_TOKEN_CONTRACT_ID,
    "request_role_change",
    [addressToScVal(applicant), u32ToScVal(requestedRole)],
    applicant,
    signTx
  );
}

export async function executeApproveRoleChange(requestId: number, admin: string): Promise<string> {
  return invokeContractMethod(
    NEXT_PUBLIC_CAMPUS_TOKEN_CONTRACT_ID,
    "approve_role_change",
    [u64ToScVal(requestId), addressToScVal(admin)],
    admin,
    signTx
  );
}

export async function executeDenyRoleChange(requestId: number, admin: string): Promise<string> {
  return invokeContractMethod(
    NEXT_PUBLIC_CAMPUS_TOKEN_CONTRACT_ID,
    "deny_role_change",
    [u64ToScVal(requestId), addressToScVal(admin)],
    admin,
    signTx
  );
}

export async function fetchPendingRoleRequests(address?: string) {
  const res = await readContract(
    NEXT_PUBLIC_CAMPUS_TOKEN_CONTRACT_ID,
    "list_pending_role_requests",
    [],
    address
  );
  if (!res || !Array.isArray(res)) return [];
  return res.map((r: { id: bigint; applicant: string; requested_role: number; status: number }) => ({
    id: Number(r.id),
    applicant: String(r.applicant),
    requested_role: Number(r.requested_role),
    status: Number(r.status),
  }));
}

export async function fetchNativeToken(address?: string): Promise<string | null> {
  const res = await readContract(NEXT_PUBLIC_CAMPUS_SERVICE_CONTRACT_ID, "native_token_contract", [], address);
  return res ? String(res) : null;
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

