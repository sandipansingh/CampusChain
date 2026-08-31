import { beforeEach, describe, expect, it, vi } from "vitest";
import { paginateOperationsSource } from "@/features/analytics/service";
import {
  fetchAllProfilesWithFailures,
  type UserProfile,
} from "@/features/wallet/service/campusIdentity";
import {
  fetchScholarshipApplications,
  fetchScholarshipApplicationsStrict,
  fetchScholarshipPrograms,
  fetchScholarshipProgramsStrict,
} from "@/features/scholarships/service/scholarships";

const { readContract } = vi.hoisted(() => ({ readContract: vi.fn() }));

vi.mock("@/shared/stellar/client", () => ({
  addressToScVal: (value: string) => value,
  i128ToScVal: (value: string | number | bigint) => value,
  invokeContractMethod: vi.fn(),
  NEXT_PUBLIC_CAMPUS_IDENTITY_CONTRACT_ID: "identity",
  NEXT_PUBLIC_CAMPUS_SERVICE_CONTRACT_ID: "service",
  NEXT_PUBLIC_CAMPUS_TOKEN_CONTRACT_ID: "token",
  readContract,
  stringToScVal: (value: string) => value,
  u32ToScVal: (value: number) => value,
  u64ToScVal: (value: number) => value,
}));

const profile = (address: string): UserProfile => ({
  address,
  fullName: address,
  universityCode: "NORTH",
  role: 1,
  verificationStatus: 2,
  details: {},
  createdAt: 1,
});

describe("Operations Center reliability helpers", () => {
  beforeEach(() => readContract.mockReset());

  it("loads multiple cursor pages and never requests more than 50 records", async () => {
    const firstPage = Array.from({ length: 50 }, (_, index) => ({ id: index + 1 }));
    const readPage = vi.fn()
      .mockResolvedValueOnce(firstPage)
      .mockResolvedValueOnce([{ id: 51 }]);

    const result = await paginateOperationsSource(readPage);

    expect(result).toMatchObject({ status: "success", truncated: false });
    expect(result.records).toHaveLength(51);
    expect(readPage.mock.calls).toEqual([[0, 50], [50, 50]]);
  });

  it("handles empty pages, repeated cursors, and page caps", async () => {
    const empty = await paginateOperationsSource(vi.fn().mockResolvedValue([]));
    expect(empty).toMatchObject({ records: [], status: "success", truncated: false });

    const repeatedPage = Array.from({ length: 50 }, (_, index) => ({ id: index + 1 }));
    const repeated = await paginateOperationsSource(
      vi.fn().mockResolvedValue(repeatedPage)
    );
    expect(repeated).toMatchObject({ status: "partial", truncated: true });
    expect(repeated.records).toHaveLength(50);

    let cursor = 0;
    const capped = await paginateOperationsSource(
      vi.fn().mockImplementation(async () => {
        const page = Array.from({ length: 2 }, () => ({ id: cursor + 1 }));
        cursor += 2;
        return page;
      }),
      { pageSize: 2, maxPages: 3 }
    );
    expect(capped).toMatchObject({ status: "partial", truncated: true });
    expect(capped.records).toHaveLength(6);
  });

  it("limits profile reads to eight workers, retries transient failures, and reports failed addresses", async () => {
    const addresses = Array.from({ length: 12 }, (_, index) => `P${index + 1}`);
    readContract.mockResolvedValue(addresses);
    let active = 0;
    let maxActive = 0;
    const attempts = new Map<string, number>();

    const result = await fetchAllProfilesWithFailures("CALLER", {
      retryDelayMs: 0,
      profileReader: async (address) => {
        active += 1;
        maxActive = Math.max(maxActive, active);
        await new Promise((resolve) => setTimeout(resolve, 0));
        active -= 1;
        const attempt = (attempts.get(address) ?? 0) + 1;
        attempts.set(address, attempt);
        if (address === "P11" && attempt < 3) throw new Error("network timeout");
        if (address === "P12") throw new Error("network timeout");
        return profile(address);
      },
    });

    expect(maxActive).toBeLessThanOrEqual(8);
    expect(attempts.get("P11")).toBe(3);
    expect(attempts.get("P12")).toBe(3);
    expect(result.profiles).toHaveLength(11);
    expect(result.failedAddresses).toEqual(["P12"]);
  });

  it("keeps strict scholarship RPC failures visible while legacy readers remain empty-array compatible", async () => {
    readContract.mockImplementation(async () => {
      throw new Error("RPC unavailable");
    });

    await fetchScholarshipProgramsStrict("CALLER").then(
      () => { throw new Error("strict program reader unexpectedly succeeded"); },
      (error: unknown) => expect(error).toEqual(new Error("RPC unavailable"))
    );
    await fetchScholarshipApplicationsStrict("CALLER").then(
      () => { throw new Error("strict application reader unexpectedly succeeded"); },
      (error: unknown) => expect(error).toEqual(new Error("RPC unavailable"))
    );
    readContract.mockResolvedValue(null);
    expect(await fetchScholarshipPrograms("CALLER")).toEqual([]);
    expect(await fetchScholarshipApplications("CALLER")).toEqual([]);
  });
});
