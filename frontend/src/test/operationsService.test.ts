import { beforeEach, describe, expect, it, vi } from "vitest";

const mocks = vi.hoisted(() => ({
  fetchUniversities: vi.fn(),
  fetchAllProfilesWithFailures: vi.fn(),
  fetchScholarshipProgramsStrict: vi.fn(),
  fetchScholarshipApplicationsStrict: vi.fn(),
  fetchEvents: vi.fn(),
  fetchEscrows: vi.fn(),
  fetchListings: vi.fn(),
  fetchLedgerEventsForOperations: vi.fn(),
}));

vi.mock("@/features/wallet/service/campusIdentity", () => ({
  fetchUniversities: mocks.fetchUniversities,
  fetchAllProfilesWithFailures: mocks.fetchAllProfilesWithFailures,
}));
vi.mock("@/features/scholarships/service/scholarships", () => ({
  fetchScholarshipProgramsStrict: mocks.fetchScholarshipProgramsStrict,
  fetchScholarshipApplicationsStrict: mocks.fetchScholarshipApplicationsStrict,
}));
vi.mock("@/features/events/service/events", () => ({ fetchEvents: mocks.fetchEvents }));
vi.mock("@/features/marketplace/service/escrow", () => ({ fetchEscrows: mocks.fetchEscrows }));
vi.mock("@/features/marketplace/service/marketplace", () => ({ fetchListings: mocks.fetchListings }));
vi.mock("@/features/transactions/service/events", () => ({ fetchLedgerEventsForOperations: mocks.fetchLedgerEventsForOperations }));
vi.mock("@/shared/stellar/client", () => ({ NEXT_PUBLIC_CAMPUS_ADMIN_ADDRESS: "ADMIN" }));

import { loadOperationsData } from "@/features/analytics/service";

describe("loadOperationsData", () => {
  beforeEach(() => {
    mocks.fetchUniversities.mockResolvedValue([{ code: "NORTH" }]);
    mocks.fetchAllProfilesWithFailures.mockResolvedValue({ profiles: [], failedAddresses: [], failures: [], totalAddresses: 0 });
    mocks.fetchScholarshipProgramsStrict.mockResolvedValue([]);
    mocks.fetchScholarshipApplicationsStrict.mockResolvedValue([]);
    mocks.fetchEvents.mockResolvedValue([]);
    mocks.fetchEscrows.mockResolvedValue([]);
    mocks.fetchListings.mockResolvedValue([]);
    mocks.fetchLedgerEventsForOperations.mockResolvedValue({ events: [], partial: false, truncated: false });
  });

  it("isolates rejected sources and retains successful source data and health", async () => {
    mocks.fetchScholarshipProgramsStrict.mockRejectedValue(new Error("scholarship RPC unavailable"));

    const result = await loadOperationsData("ADMIN");

    expect(result.universities).toEqual([{ code: "NORTH" }]);
    expect(result.sourceHealth?.universities).toMatchObject({ status: "success", returnedCount: 1, truncated: false });
    expect(result.sourceHealth?.scholarships).toMatchObject({ status: "failed", returnedCount: 0, error: "scholarship RPC unavailable" });
    expect(result.errors.scholarships).toBe("scholarship RPC unavailable");
  });
});
