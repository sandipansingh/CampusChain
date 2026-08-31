import { renderHook, waitFor } from "@testing-library/react";
import { QueryClient, QueryClientProvider } from "@tanstack/react-query";
import { beforeEach, describe, expect, it, vi } from "vitest";
import type { OperationsData } from "@/features/analytics/types";

const { loadOperationsData } = vi.hoisted(() => ({ loadOperationsData: vi.fn() }));

vi.mock("@/features/analytics/service", () => ({ loadOperationsData }));

import { useOperationsData } from "@/features/analytics/hooks";

const snapshot = (loadedAt: number): OperationsData => ({
  universities: [],
  profiles: [],
  scholarships: [],
  applications: [],
  events: [],
  escrows: [],
  listings: [],
  activity: [],
  errors: {},
  loadedAt,
});

describe("useOperationsData", () => {
  beforeEach(() => loadOperationsData.mockReset());

  it("retains the previous successful snapshot while a refresh is fetching", async () => {
    const first = snapshot(1);
    const second = snapshot(2);
    let resolveRefresh: (value: OperationsData) => void = () => undefined;
    loadOperationsData
      .mockResolvedValueOnce(first)
      .mockImplementationOnce(() => new Promise((resolve) => { resolveRefresh = resolve; }));

    const queryClient = new QueryClient({ defaultOptions: { queries: { retry: false } } });
    const wrapper = ({ children }: { children: React.ReactNode }) => (
      <QueryClientProvider client={queryClient}>{children}</QueryClientProvider>
    );
    const { result } = renderHook(() => useOperationsData("ADMIN"), { wrapper });

    await waitFor(() => expect(result.current.data).toBe(first));
    const refresh = result.current.refetch();
    await waitFor(() => expect(loadOperationsData).toHaveBeenCalledTimes(2));
    expect(result.current.data).toBe(first);

    resolveRefresh(second);
    await refresh;
    await waitFor(() => expect(result.current.data).toEqual(second));
  });
});
