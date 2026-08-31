import { beforeEach, describe, expect, it, vi } from "vitest";
import { QueryClient, QueryClientProvider } from "@tanstack/react-query";
import { fireEvent, render, screen, waitFor } from "@testing-library/react";
import type { OperationsData, OperationsSource, OperationsSourceHealth } from "@/features/analytics/types";
import { OperationsCenter } from "@/features/analytics/ui/OperationsCenter";

const mocks = vi.hoisted(() => ({
  query: {
    isLoading: true,
    isFetching: false,
    data: undefined as OperationsData | undefined,
    refetch: vi.fn(),
  },
  approveUniversity: vi.fn().mockResolvedValue("university-tx"),
  rejectUniversity: vi.fn().mockResolvedValue("university-reject-tx"),
  reviewScholarship: vi.fn().mockResolvedValue("scholarship-tx"),
}));

vi.mock("@/shared/stellar/useWallet", () => ({
  useWallet: () => ({ address: "GADMIN", disconnect: vi.fn() }),
}));

vi.mock("@/features/analytics/hooks", () => ({
  useOperationsData: () => mocks.query,
}));

vi.mock("@/features/wallet/service/campusIdentity", () => ({
  executeApproveUniversity: mocks.approveUniversity,
  executeRejectUniversity: mocks.rejectUniversity,
}));

vi.mock("@/features/scholarships/hooks/useScholarships", () => ({
  useAdminReviewScholarshipMutation: () => ({ isPending: false, mutateAsync: mocks.reviewScholarship }),
}));

const baseData = (): OperationsData => ({
  universities: [{ code: "NORTH", name: "North Campus", address: "Main", adminAddress: "GADMIN", approvalStatus: 1, createdAt: 1 }],
  profiles: [{ address: "GUSER", fullName: "User", universityCode: "NORTH", role: 1, verificationStatus: 2, details: {}, createdAt: 1 }],
  scholarships: [],
  applications: [],
  events: [{ id: 1, host: "GUSER", university_code: "NORTH", price: 1, capacity: 20, tickets_sold: 5 }],
  escrows: [],
  listings: [],
  activity: [{ id: "evt-1", eventName: "event_created", type: "ticket", title: "Event Created", message: "Event #1", details: "new event published", txHash: "tx-1", fullTxHash: "tx-1", timestamp: "just now", ledger: 10, color: "emerald", icon: "ticket", ledgerClosedAt: new Date().toISOString(), entityId: 1, universityCode: "NORTH" }],
  errors: {},
  loadedAt: 1,
});

const sourceHealth = (overrides: Partial<Record<OperationsSource, Partial<OperationsSourceHealth>>> = {}) =>
  Object.fromEntries(([
    "universities", "profiles", "scholarships", "applications", "events", "escrows", "listings", "activity",
  ] as OperationsSource[]).map((source) => [source, {
    status: "success",
    returnedCount: 1,
    durationMs: 12,
    truncated: false,
    coverage: source === "activity" ? "recent-window" : source === "events" || source === "escrows" || source === "listings" ? "exhaustive" : "contract-returned",
    ...overrides[source],
  }])) as Record<OperationsSource, OperationsSourceHealth>;

function renderOperations() {
  return render(<QueryClientProvider client={new QueryClient()}><OperationsCenter /></QueryClientProvider>);
}

describe("OperationsCenter states and controls", () => {
  beforeEach(() => {
    mocks.query.isLoading = true;
    mocks.query.isFetching = false;
    mocks.query.data = undefined;
    mocks.query.refetch.mockReset();
    mocks.approveUniversity.mockClear();
  });

  it("renders a structural loading state", () => {
    renderOperations();
    expect(screen.getByLabelText("Loading operations data")).toBeInTheDocument();
  });

  it("renders an RPC error state with retry", () => {
    mocks.query.isLoading = false;
    mocks.query.data = { ...baseData(), universities: [], profiles: [], events: [], activity: [], errors: { universities: "RPC unavailable" } };
    renderOperations();
    expect(screen.getByRole("alert")).toHaveTextContent("On-chain data is unavailable");
    fireEvent.click(screen.getByRole("button", { name: /Retry reads/ }));
    expect(mocks.query.refetch).toHaveBeenCalled();
  });

  it("renders an empty state with a next action", () => {
    mocks.query.isLoading = false;
    mocks.query.data = { ...baseData(), universities: [], profiles: [], events: [], activity: [] };
    renderOperations();
    expect(screen.getByText("No on-chain operations yet")).toBeInTheDocument();
    expect(screen.getByRole("button", { name: /Refresh registry/ })).toBeInTheDocument();
  });

  it("renders populated metrics, table, timeline, explorer link, and approval action", async () => {
    mocks.query.isLoading = false;
    mocks.query.data = baseData();
    renderOperations();

    expect(screen.getByRole("heading", { name: "Operations Center" })).toBeInTheDocument();
    expect(screen.getAllByText("North Campus").length).toBeGreaterThan(0);
    expect(screen.getByText("Recent on-chain activity")).toBeInTheDocument();
    expect(screen.getByRole("link", { name: /Explorer/ })).toHaveAttribute("href", expect.stringContaining("tx-1"));

    fireEvent.click(screen.getByRole("button", { name: /Approve/ }));
    await waitFor(() => expect(mocks.approveUniversity).toHaveBeenCalledWith("GADMIN", "NORTH"));
  });

  it("renders source-level partial coverage, failed addresses, and stale data messaging", () => {
    mocks.query.isLoading = false;
    mocks.query.data = {
      ...baseData(),
      sourceHealth: sourceHealth({
        profiles: { status: "partial", returnedCount: 1, failedAddresses: ["GFAILED", "GFAILED2"], error: "2 profile reads failed" },
        activity: { status: "partial", truncated: true, error: "Activity window cap reached" },
      }),
      errors: { profiles: "2 profile reads failed", activity: "Activity window cap reached" },
      lastSuccessfulRefreshAt: 1,
    };

    renderOperations();

    expect(screen.getByRole("region", { name: "Operations source health" })).toBeInTheDocument();
    expect(screen.getByTestId("source-health-profiles")).toHaveTextContent("Partial");
    expect(screen.getByTestId("source-health-profiles")).toHaveTextContent("2 profile addresses unavailable");
    expect(screen.getByText("Data may be stale.")).toBeInTheDocument();
    expect(screen.getByText(/250-event-per-contract window cap was reached/)).toBeInTheDocument();
  });
});
