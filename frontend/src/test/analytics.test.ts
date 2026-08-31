import { describe, expect, it } from "vitest";
import type { OperationsData } from "@/features/analytics/types";
import { aggregateOperations, activityCategory, filterActivityEvents, formatUniversitiesCsv } from "@/features/analytics/aggregation";
import type { DecodedEvent } from "@/shared/stellar/eventDecoder";

const address = (id: number) => `G${"A".repeat(10)}${id}`;

function event(type: DecodedEvent["type"], txHash: string, overrides: Partial<DecodedEvent> = {}): DecodedEvent {
  return {
    id: `${txHash}-${type}`,
    eventName: type,
    type,
    title: type,
    message: `${type} activity`,
    details: "test",
    txHash,
    fullTxHash: txHash,
    timestamp: "just now",
    ledger: 100,
    color: "blue",
    icon: "system",
    ledgerClosedAt: new Date().toISOString(),
    ...overrides,
  };
}

function operationsData(overrides: Partial<OperationsData> = {}): OperationsData {
  return {
    universities: [
      { code: "NORTH", name: "North Campus", address: "1 Main St", adminAddress: address(1), approvalStatus: 2, createdAt: 1 },
      { code: "SOUTH", name: "South Campus", address: "2 Main St", adminAddress: address(2), approvalStatus: 1, createdAt: 1 },
      { code: "WEST", name: "West Campus", address: "3 Main St", adminAddress: address(3), approvalStatus: 4, createdAt: 1 },
    ],
    profiles: [
      { address: address(10), fullName: "Student", universityCode: "NORTH", role: 1, verificationStatus: 2, details: {}, createdAt: 1 },
      { address: address(11), fullName: "Merchant", universityCode: "NORTH", role: 2, verificationStatus: 1, details: {}, createdAt: 1 },
      { address: address(12), fullName: "Organizer", universityCode: "SOUTH", role: 3, verificationStatus: 3, details: {}, createdAt: 1 },
      { address: address(13), fullName: "Admin", universityCode: "NORTH", role: 4, verificationStatus: 2, details: {}, createdAt: 1 },
    ],
    scholarships: [
      { id: 1, title: "Pending", description: "", criteria: "", amount: 10, deadline: "", slots: 1, createdByUniversityId: address(13), adminApprovalStatus: "pending", createdAt: 1 },
      { id: 2, title: "Approved", description: "", criteria: "", amount: 20, deadline: "", slots: 1, createdByUniversityId: address(13), adminApprovalStatus: "approved", createdAt: 1 },
      { id: 3, title: "Rejected", description: "", criteria: "", amount: 30, deadline: "", slots: 1, createdByUniversityId: address(12), adminApprovalStatus: "rejected", createdAt: 1 },
      { id: 4, title: "Suspended", description: "", criteria: "", amount: 40, deadline: "", slots: 1, createdByUniversityId: address(12), adminApprovalStatus: "suspended", createdAt: 1 },
    ],
    applications: [
      { id: 1, scholarshipId: 1, studentId: address(10), status: "pending", appliedAt: 1, decidedAt: 0, decidedBy: "" },
      { id: 2, scholarshipId: 1, studentId: address(10), status: "approved", appliedAt: 1, decidedAt: 1, decidedBy: address(13) },
      { id: 3, scholarshipId: 1, studentId: address(12), status: "rejected", appliedAt: 1, decidedAt: 1, decidedBy: address(13) },
    ],
    events: [
      { id: 1, host: address(10), university_code: "NORTH", price: 1, capacity: 100, tickets_sold: 30 },
      { id: 2, host: address(12), university_code: "SOUTH", price: 1, capacity: 50, tickets_sold: 25 },
    ],
    escrows: [
      { id: 1, buyer: address(10), seller: address(11), universityCode: "NORTH", amount: 100, status: 1 },
      { id: 2, buyer: address(10), seller: address(11), universityCode: "NORTH", amount: 50, status: 2 },
      { id: 3, buyer: address(12), seller: address(12), universityCode: "SOUTH", amount: 25, status: 3 },
    ],
    listings: [
      { id: 1, seller: address(11), universityCode: "NORTH", title: "Book", description: "", price: 1, category: 1, status: 1, escrow_enabled: false },
      { id: 2, seller: address(11), universityCode: "NORTH", title: "Bike", description: "", price: 1, category: 1, status: 2, escrow_enabled: false },
      { id: 3, seller: address(12), universityCode: "SOUTH", title: "Notes", description: "", price: 1, category: 1, status: 3, escrow_enabled: false },
    ],
    activity: [
      event("ticket", "tx-1", { universityCode: "NORTH", entityId: 1 }),
      event("escrow", "tx-1", { universityCode: "NORTH", amountCamp: 100 }),
      event("scholarship", "tx-2", { universityCode: "NORTH", status: "approved" }),
      event("order", "tx-3", { universityCode: "SOUTH" }),
    ],
    errors: {},
    loadedAt: 1,
    ...overrides,
  };
}

describe("Operations Center analytics", () => {
  it("aggregates registry, workload, role health, service capacity, and activity", () => {
    const metrics = aggregateOperations(operationsData());

    expect(metrics.totalUniversities).toBe(3);
    expect(metrics.activeUniversities).toBe(1);
    expect(metrics.pendingUniversities).toBe(1);
    expect(metrics.suspendedUniversities).toBe(1);
    expect(metrics.totalProfiles).toBe(4);
    expect(metrics.profilesByRole).toMatchObject({ Student: 1, Merchant: 1, "Event Organizer": 1, "University Admin": 1 });
    expect(metrics.profilesByVerification).toMatchObject({ Verified: 2, Pending: 1, Rejected: 1 });
    expect(metrics.pendingApprovals).toEqual({ total: 3, universities: 1, scholarships: 1, profiles: 1 });
    expect(metrics.scholarships).toMatchObject({ total: 4, pending: 1, approved: 1, rejected: 1, suspended: 1 });
    expect(metrics.applications).toMatchObject({ total: 3, pending: 1, approved: 1, rejected: 1 });
    expect(metrics.events).toEqual({ total: 2, capacity: 150, ticketsSold: 55, utilizationPercent: 37 });
    expect(metrics.escrows).toMatchObject({ total: 3, volumeCamp: 175, funded: 1, released: 1, refunded: 1 });
    expect(metrics.listings).toEqual({ total: 3, active: 1, sold: 1, cancelled: 1 });
    expect(metrics.activity).toMatchObject({ total: 4, recentTransactionVolume: 3 });
    expect(metrics.activity.byCategory).toMatchObject({ events: 1, escrow: 1, scholarships: 1, food: 1 });
    expect(metrics.universities[0]).toMatchObject({ code: "NORTH", profileCount: 3, pendingProfileCount: 1, scholarshipCount: 2, eventCapacity: 100, ticketsSold: 30, listingCount: 2, escrowVolumeCamp: 150 });
  });

  it("returns safe zero metrics for empty and partially failed reads", () => {
    const empty = operationsData({ universities: [], profiles: [], scholarships: [], applications: [], events: [], escrows: [], listings: [], activity: [] });
    const metrics = aggregateOperations(empty);
    expect(metrics.totalUniversities).toBe(0);
    expect(metrics.events.utilizationPercent).toBe(0);
    expect(metrics.activity.recentTransactionVolume).toBe(0);
    expect(Object.values(metrics.activity.byCategory).every((count) => count === 0)).toBe(true);

    const partial = aggregateOperations(operationsData({ profiles: [], events: [], errors: { profiles: "RPC timeout", events: "Simulation failed" } }));
    expect(partial.totalUniversities).toBe(3);
    expect(partial.totalProfiles).toBe(0);
    expect(partial.pendingApprovals.profiles).toBe(0);
    expect(partial.events.capacity).toBe(0);
  });

  it("handles zero event capacity without dividing by zero", () => {
    const metrics = aggregateOperations(operationsData({ events: [{ id: 1, host: address(1), university_code: "NORTH", price: 0, capacity: 0, tickets_sold: 0 }] }));
    expect(metrics.events.utilizationPercent).toBe(0);
  });

  it("filters decoded activity by category and machine-readable fields", () => {
    const activity = operationsData().activity;
    expect(activityCategory(activity[0])).toBe("events");
    expect(filterActivityEvents(activity, "north", "all")).toHaveLength(3);
    expect(filterActivityEvents(activity, "", "scholarships")).toHaveLength(1);
    expect(filterActivityEvents(activity, "#1", "events")).toHaveLength(1);
  });

  it("formats a safe CSV export with escaped cells", () => {
    const csv = formatUniversitiesCsv([{ ...aggregateOperations(operationsData()).universities[0], name: 'North, "Campus"' }]);
    expect(csv.split("\n")[0]).toContain("University,Code,Status");
    expect(csv).toContain('"North, ""Campus""",NORTH,Active');
    expect(csv).toContain("100,30,30%");
  });
});
