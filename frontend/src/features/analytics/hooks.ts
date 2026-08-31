import { useQuery } from "@tanstack/react-query";
import { loadOperationsData } from "./service";

export function useOperationsData(address?: string | null) {
  return useQuery({
    queryKey: ["operations-center", address],
    queryFn: () => loadOperationsData(address ?? undefined),
    enabled: Boolean(address),
    placeholderData: (previousData) => previousData,
    refetchInterval: 30_000,
  });
}
