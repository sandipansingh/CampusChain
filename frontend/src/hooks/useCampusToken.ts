import { useQuery, useMutation, useQueryClient } from "@tanstack/react-query";
import {
  readContract,
  invokeContractMethod,
  addressToScVal,
  i128ToScVal,
  u32ToScVal,
  NEXT_PUBLIC_CAMPUS_TOKEN_CONTRACT_ID,
} from "@/services/contracts";

export function useCampusBalance(address: string | null) {
  return useQuery({
    queryKey: ["campus-balance", address],
    queryFn: async () => {
      if (!address) return 0;
      try {
        const res = await readContract(
          NEXT_PUBLIC_CAMPUS_TOKEN_CONTRACT_ID,
          "balance",
          [addressToScVal(address)]
        );
        return Number(res) / 10_000_000;
      } catch (err) {
        console.warn("Failed to fetch on-chain balance, using default fallback", err);
        return 1000.00;
      }
    },
    enabled: !!address,
  });
}

export function useCampusUserRole(address: string | null) {
  return useQuery({
    queryKey: ["campus-role", address],
    queryFn: async () => {
      if (!address) return 0;
      try {
        const res = await readContract(
          NEXT_PUBLIC_CAMPUS_TOKEN_CONTRACT_ID,
          "get_role",
          [addressToScVal(address)]
        );
        return Number(res);
      } catch (err) {
        console.warn("Failed to fetch on-chain user role, using default fallback", err);
        return 1;
      }
    },
    enabled: !!address,
  });
}

export function useCampusTokenMetadata() {
  return useQuery({
    queryKey: ["campus-token-metadata"],
    queryFn: async () => {
      try {
        const name = await readContract(NEXT_PUBLIC_CAMPUS_TOKEN_CONTRACT_ID, "name");
        const symbol = await readContract(NEXT_PUBLIC_CAMPUS_TOKEN_CONTRACT_ID, "symbol");
        const decimals = await readContract(NEXT_PUBLIC_CAMPUS_TOKEN_CONTRACT_ID, "decimals");
        const totalSupply = await readContract(NEXT_PUBLIC_CAMPUS_TOKEN_CONTRACT_ID, "total_supply");

        return {
          name: String(name || "CampusChain Token"),
          symbol: String(symbol || "CAMP"),
          decimals: Number(decimals || 7),
          totalSupply: Number(totalSupply || 10000000000000) / 10 ** Number(decimals || 7),
        };
      } catch (err) {
        console.warn("Failed to fetch on-chain token metadata, using default fallback", err);
        return {
          name: "CampusChain Token",
          symbol: "CAMP",
          decimals: 7,
          totalSupply: 1000000,
        };
      }
    },
  });
}

export function useTransferMutation() {
  const queryClient = useQueryClient();
  return useMutation({
    mutationFn: async ({
      from,
      to,
      amount,
    }: {
      from: string;
      to: string;
      amount: number;
    }) => {
      const rawAmount = BigInt(Math.round(amount * 10_000_000));
      const hash = await invokeContractMethod(
        NEXT_PUBLIC_CAMPUS_TOKEN_CONTRACT_ID,
        "transfer",
        [addressToScVal(from), addressToScVal(to), i128ToScVal(rawAmount)],
        from
      );
      return hash;
    },
    onSuccess: (_, variables) => {
      queryClient.invalidateQueries({ queryKey: ["campus-balance", variables.from] });
      queryClient.invalidateQueries({ queryKey: ["campus-balance", variables.to] });
    },
  });
}

export function useApproveMutation() {
  return useMutation({
    mutationFn: async ({
      from,
      spender,
      amount,
      expirationLedger = 1000000,
    }: {
      from: string;
      spender: string;
      amount: number;
      expirationLedger?: number;
    }) => {
      const rawAmount = BigInt(Math.round(amount * 10_000_000));
      const hash = await invokeContractMethod(
        NEXT_PUBLIC_CAMPUS_TOKEN_CONTRACT_ID,
        "approve",
        [
          addressToScVal(from),
          addressToScVal(spender),
          i128ToScVal(rawAmount),
          u32ToScVal(expirationLedger),
        ],
        from
      );
      return hash;
    },
  });
}

export function useSetRoleMutation() {
  const queryClient = useQueryClient();
  return useMutation({
    mutationFn: async ({
      user,
      role,
      caller,
    }: {
      user: string;
      role: number;
      caller: string;
    }) => {
      return invokeContractMethod(
        NEXT_PUBLIC_CAMPUS_TOKEN_CONTRACT_ID,
        "set_role",
        [addressToScVal(user), u32ToScVal(role)],
        caller
      );
    },
    onSuccess: (_, variables) => {
      queryClient.invalidateQueries({ queryKey: ["campus-role", variables.user] });
    },
  });
}

