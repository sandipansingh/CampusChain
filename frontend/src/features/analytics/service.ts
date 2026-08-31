import { fetchLedgerEventsForOperations } from "@/features/transactions/service/events";
import { fetchEvents } from "@/features/events/service/events";
import { fetchEscrows } from "@/features/marketplace/service/escrow";
import { fetchListings } from "@/features/marketplace/service/marketplace";
import {
  fetchScholarshipApplicationsStrict,
  fetchScholarshipProgramsStrict,
} from "@/features/scholarships/service/scholarships";
import {
  fetchAllProfilesWithFailures,
  fetchUniversities,
} from "@/features/wallet/service/campusIdentity";
import { NEXT_PUBLIC_CAMPUS_ADMIN_ADDRESS } from "@/shared/stellar/client";
import type {
  OperationsData,
  OperationsSource,
  OperationsSourceCoverage,
  OperationsSourceHealth,
  OperationsSourceStatus,
} from "./types";

export const OPERATIONS_PAGE_SIZE = 50;
export const OPERATIONS_MAX_PAGES = 100;
export const OPERATIONS_MAX_RECORDS = 5_000;

type IdentifiedRecord = { id: number | bigint | string };

export interface OperationsPaginationResult<T> {
  records: T[];
  status: OperationsSourceStatus;
  truncated: boolean;
  error?: string;
}

function errorMessage(error: unknown): string {
  return error instanceof Error ? error.message : String(error);
}

function recordId(record: IdentifiedRecord): number | null {
  const value = typeof record.id === "bigint" ? Number(record.id) : Number(record.id);
  return Number.isSafeInteger(value) ? value : null;
}

/**
 * Exhaustively reads an existing start_after/limit contract method while
 * bounding both RPC calls and memory. A failed later page keeps the records
 * already returned and reports partial coverage to the caller.
 */
export async function paginateOperationsSource<T extends IdentifiedRecord>(
  readPage: (startAfter: number, limit: number) => Promise<T[]>,
  options: {
    pageSize?: number;
    maxPages?: number;
    maxRecords?: number;
  } = {}
): Promise<OperationsPaginationResult<T>> {
  const pageSize = Math.max(1, Math.min(OPERATIONS_PAGE_SIZE, Math.floor(options.pageSize ?? OPERATIONS_PAGE_SIZE)));
  const maxPages = Math.max(1, Math.floor(options.maxPages ?? OPERATIONS_MAX_PAGES));
  const maxRecords = Math.max(1, Math.floor(options.maxRecords ?? OPERATIONS_MAX_RECORDS));
  const records: T[] = [];
  let startAfter = 0;

  for (let pageNumber = 0; pageNumber < maxPages; pageNumber += 1) {
    let page: T[];
    try {
      page = await readPage(startAfter, pageSize);
    } catch (error) {
      const message = errorMessage(error);
      return {
        records,
        status: records.length > 0 ? "partial" : "failed",
        truncated: records.length > 0,
        error: `Page ${pageNumber + 1} failed: ${message}`,
      };
    }

    const safePage = Array.isArray(page) ? page.slice(0, pageSize) : [];
    if (safePage.length === 0) {
      return { records, status: "success", truncated: false };
    }

    const lastId = recordId(safePage[safePage.length - 1]);
    if (lastId === null || lastId <= startAfter) {
      return {
        records,
        status: "partial",
        truncated: true,
        error: "Pagination cursor did not advance; results may be incomplete.",
      };
    }

    const remaining = maxRecords - records.length;
    records.push(...safePage.slice(0, remaining));
    startAfter = lastId;

    if (records.length >= maxRecords) {
      return {
        records,
        status: "partial",
        truncated: true,
        error: `Record cap reached at ${maxRecords.toLocaleString()} records.`,
      };
    }
    if (safePage.length < pageSize) {
      return { records, status: "success", truncated: false };
    }
  }

  return {
    records,
    status: "partial",
    truncated: true,
    error: `Page cap reached at ${maxPages} pages.`,
  };
}

interface SourceRead<T> {
  data: T;
  status?: OperationsSourceStatus;
  error?: string;
  truncated?: boolean;
  failedAddresses?: string[];
  coverage: OperationsSourceCoverage;
}

interface MeasuredSource<T> {
  data: T;
  health: OperationsSourceHealth;
}

async function measureSource<T>(
  loader: () => Promise<SourceRead<T>>,
  fallback: T,
  coverage: OperationsSourceCoverage
): Promise<MeasuredSource<T>> {
  const startedAt = Date.now();
  try {
    const result = await loader();
    const returnedCount = Array.isArray(result.data) ? result.data.length : 0;
    return {
      data: result.data,
      health: {
        status: result.status ?? "success",
        returnedCount,
        durationMs: Math.max(0, Date.now() - startedAt),
        ...(result.error ? { error: result.error } : {}),
        truncated: result.truncated ?? false,
        coverage: result.coverage ?? coverage,
        ...(result.failedAddresses && result.failedAddresses.length > 0
          ? { failedAddresses: result.failedAddresses }
          : {}),
      },
    };
  } catch (error) {
    return {
      data: fallback,
      health: {
        status: "failed",
        returnedCount: 0,
        durationMs: Math.max(0, Date.now() - startedAt),
        error: errorMessage(error),
        truncated: false,
        coverage,
      },
    };
  }
}

function paginatedSource<T extends IdentifiedRecord>(
  readPage: (startAfter: number, limit: number) => Promise<T[]>
): Promise<SourceRead<T[]>> {
  return paginateOperationsSource(readPage).then((result) => ({
    data: result.records,
    status: result.status,
    ...(result.error ? { error: result.error } : {}),
    truncated: result.truncated,
    coverage: "exhaustive" as const,
  }));
}

function profileSource(address: string): Promise<SourceRead<Awaited<ReturnType<typeof fetchAllProfilesWithFailures>>["profiles"]>> {
  return fetchAllProfilesWithFailures(address).then((result) => {
    const error = result.failures.length > 0
      ? `${result.failures.length} of ${result.totalAddresses} profile reads failed${result.failures[0] ? `: ${result.failures[0].error}` : "."}`
      : undefined;
    return {
      data: result.profiles,
      status: result.failures.length > 0 ? "partial" : "success",
      ...(error ? { error } : {}),
      truncated: false,
      failedAddresses: result.failedAddresses,
      coverage: "contract-returned" as const,
    };
  });
}

/**
 * Load every Operations Center source concurrently. Each measured source is
 * isolated, so a rejected RPC promise cannot erase successful sources.
 */
export async function loadOperationsData(address?: string): Promise<OperationsData> {
  const caller = address || NEXT_PUBLIC_CAMPUS_ADMIN_ADDRESS;
  const [universities, profiles, scholarships, applications, events, escrows, listings, activity] = await Promise.all([
    measureSource(
      () => fetchUniversities(caller).then((data) => ({ data, coverage: "contract-returned" as const })),
      [],
      "contract-returned"
    ),
    measureSource(() => profileSource(caller), [], "contract-returned"),
    measureSource(
      () => fetchScholarshipProgramsStrict(caller).then((data) => ({ data, coverage: "contract-returned" as const })),
      [],
      "contract-returned"
    ),
    measureSource(
      () => fetchScholarshipApplicationsStrict(caller).then((data) => ({ data, coverage: "contract-returned" as const })),
      [],
      "contract-returned"
    ),
    measureSource(() => paginatedSource((startAfter, limit) => fetchEvents(startAfter, limit, caller)), [], "exhaustive"),
    measureSource(() => paginatedSource((startAfter, limit) => fetchEscrows(startAfter, limit, caller)), [], "exhaustive"),
    measureSource(() => paginatedSource((startAfter, limit) => fetchListings(startAfter, limit, caller)), [], "exhaustive"),
    measureSource(async () => {
      const result = await fetchLedgerEventsForOperations();
      return {
        data: result.events,
        status: result.partial ? "partial" : "success",
        ...(result.error ? { error: result.error } : {}),
        truncated: result.truncated,
        coverage: "recent-window" as const,
      };
    }, [], "recent-window"),
  ]);

  const measured = { universities, profiles, scholarships, applications, events, escrows, listings, activity };
  const sourceHealth = Object.fromEntries(
    Object.entries(measured).map(([source, result]) => [source, result.health])
  ) as Record<OperationsSource, OperationsSourceHealth>;
  const errors = Object.fromEntries(
    Object.entries(sourceHealth)
      .filter(([, health]) => health.status !== "success" && health.error)
      .map(([source, health]) => [source, health.error as string])
  ) as Partial<Record<OperationsSource, string>>;
  const now = Date.now();
  const hasSuccessfulSource = Object.values(sourceHealth).some((health) => health.status !== "failed");

  return {
    universities: universities.data,
    profiles: profiles.data,
    scholarships: scholarships.data,
    applications: applications.data,
    events: events.data,
    escrows: escrows.data,
    listings: listings.data,
    activity: activity.data,
    sourceHealth,
    errors,
    loadedAt: now,
    lastSuccessfulRefreshAt: hasSuccessfulSource ? now : null,
  };
}
