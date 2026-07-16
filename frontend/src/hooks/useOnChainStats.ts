"use client";

import { useQuery } from "@tanstack/react-query";
import { useWalletStore } from "@/state/useWalletStore";
import { getRpcServer, NEXT_PUBLIC_CAMPUS_TOKEN_CONTRACT_ID, NEXT_PUBLIC_CAMPUS_SERVICE_CONTRACT_ID } from "@/services/contracts";
import { scValToNative } from "@stellar/stellar-sdk";
import { readContract } from "@/services/contracts";

export function useCampusTotalSupply() {
  const address = useWalletStore((state) => state.address);
  return useQuery({
    queryKey: ["campus-total-supply"],
    queryFn: async () => {
      const v = await readContract(NEXT_PUBLIC_CAMPUS_TOKEN_CONTRACT_ID, "total_supply", [], address ?? undefined);
      return typeof v === "bigint" ? v : BigInt(Number(v ?? 0));
    },
    refetchInterval: 60000,
  });
}

export interface ActivityStats {
  totalEvents: number;
  transferEvents: number;
  escrowEvents: number;
  ticketEvents: number;
  roleEvents: number;
  universityEvents: number;
  membershipEvents: number;
  faucetEvents: number;
}

export function useActivityStats() {
  return useQuery({
    queryKey: ["onchain-activity-stats"],
    queryFn: async (): Promise<ActivityStats> => {
      const server = getRpcServer();
      const latestLedger = await server.getLatestLedger();
      const startLedger = Math.max(1, latestLedger.sequence - 5000);

      const [sRes, tRes] = await Promise.all([
        server.getEvents({
          startLedger,
          filters: [{ type: "contract", contractIds: [NEXT_PUBLIC_CAMPUS_SERVICE_CONTRACT_ID] }],
          limit: 200,
        }),
        server.getEvents({
          startLedger,
          filters: [{ type: "contract", contractIds: [NEXT_PUBLIC_CAMPUS_TOKEN_CONTRACT_ID] }],
          limit: 200,
        }),
      ]);

      const allEvents = [...sRes.events, ...tRes.events];
      const stats: ActivityStats = {
        totalEvents: allEvents.length,
        transferEvents: 0,
        escrowEvents: 0,
        ticketEvents: 0,
        roleEvents: 0,
        universityEvents: 0,
        membershipEvents: 0,
        faucetEvents: 0,
      };

      for (const evt of allEvents) {
        try {
          const topic = evt.topic[0] ? scValToNative(evt.topic[0]) : "";
          const name = typeof topic === "string" ? topic : "";
          if (name === "transfer" || name === "approve" || name === "mint" || name === "burn" || name === "mint_purchase") stats.transferEvents++;
          else if (name.startsWith("escrow")) stats.escrowEvents++;
          else if (name.startsWith("ticket") || name.startsWith("event")) stats.ticketEvents++;
          else if (name.includes("role")) stats.roleEvents++;
          else if (name.includes("university") || name.includes("member") || name.includes("invite") || name.includes("join")) stats.membershipEvents++;
          else if (name.startsWith("faucet")) stats.faucetEvents++;
        } catch { /* skip */ }
      }

      return stats;
    },
    refetchInterval: 30000,
  });
}
