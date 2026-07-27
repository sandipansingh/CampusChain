import { useQuery } from "@tanstack/react-query";
import { pollTransactionStatus } from "@/shared/stellar/client";

export function useTransactionStatus(hash: string | null) {
  return useQuery({
    queryKey: ["transaction-status", hash],
    queryFn: async () => {
      if (!hash) return null;
      return pollTransactionStatus(hash);
    },
    enabled: !!hash,
    refetchInterval: (query) => {
      const data = query.state.data;
      if (data && (data.status === "SUCCESS" || data.status === "FAILED")) {
        return false;
      }
      return 2000; // poll every 2 seconds
    },
  });
}
