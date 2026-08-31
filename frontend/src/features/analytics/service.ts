import { fetchLedgerEventsRaw } from "@/features/transactions/service/events";
import { fetchEvents } from "@/features/events/service/events";
import { fetchEscrows } from "@/features/marketplace/service/escrow";
import { fetchListings } from "@/features/marketplace/service/marketplace";
import { fetchScholarshipApplications, fetchScholarshipPrograms } from "@/features/scholarships/service/scholarships";
import { fetchAllProfiles, fetchUniversities } from "@/features/wallet/service/campusIdentity";
import { NEXT_PUBLIC_CAMPUS_ADMIN_ADDRESS } from "@/shared/stellar/client";
import type { OperationsData, OperationsSource } from "./types";

function errorMessage(error: unknown): string {
  return error instanceof Error ? error.message : String(error);
}
/**
 * Load every platform-wide read concurrently. Each source is isolated so a
 * single RPC simulation failure still leaves useful operational data visible.
 */
export async function loadOperationsData(address?: string): Promise<OperationsData> {
  const caller = address || NEXT_PUBLIC_CAMPUS_ADMIN_ADDRESS;
  const results = await Promise.allSettled([
    fetchUniversities(caller),
    fetchAllProfiles(caller),
    fetchScholarshipPrograms(caller),
    fetchScholarshipApplications(caller),
    fetchEvents(0, 50, caller),
    fetchEscrows(0, 50, caller),
    fetchListings(0, 50, caller),
    fetchLedgerEventsRaw(),
  ]);

  const errors: Partial<Record<OperationsSource, string>> = {};
  const read = <T>(index: number, source: OperationsSource, fallback: T): T => {
    const result = results[index];
    if (result.status === "fulfilled") return result.value as T;
    errors[source] = errorMessage(result.reason);
    return fallback;
  };

  return {
    universities: read(0, "universities", []),
    profiles: read(1, "profiles", []),
    scholarships: read(2, "scholarships", []),
    applications: read(3, "applications", []),
    events: read(4, "events", []),
    escrows: read(5, "escrows", []),
    listings: read(6, "listings", []),
    activity: read(7, "activity", []),
    errors,
    loadedAt: Date.now(),
  };
}
