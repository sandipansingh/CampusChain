import type { DecodedEvent } from "@/shared/stellar/eventDecoder";
import type { OperationsData, OperationsMetrics, ActivityCategory, UniversitySummary } from "./types";

const ROLE_LABELS: Record<number, string> = {
  1: "Student",
  2: "Merchant",
  3: "Event Organizer",
  4: "University Admin",
  5: "Platform Admin",
};

const VERIFICATION_LABELS: Record<number, string> = {
  1: "Pending",
  2: "Verified",
  3: "Rejected",
};

const STATUS_LABELS = ["pending", "approved", "rejected", "suspended"] as const;

export function activityCategory(event: Pick<DecodedEvent, "type">): ActivityCategory {
  switch (event.type) {
    case "role":
    case "membership":
    case "university":
      return "identity";
    case "transfer":
    case "faucet":
      return "payments";
    case "escrow":
      return "escrow";
    case "ticket":
      return "events";
    case "scholarship":
      return "scholarships";
    case "marketplace":
      return "marketplace";
    case "order":
      return "food";
    default:
      return "other";
  }
}

export function filterActivityEvents(
  events: DecodedEvent[],
  query = "",
  category: ActivityCategory | "all" = "all"
): DecodedEvent[] {
  const normalizedQuery = query.trim().toLowerCase();
  return events.filter((event) => {
    const matchesCategory = category === "all" || activityCategory(event) === category;
    if (!matchesCategory) return false;
    if (!normalizedQuery) return true;
    return [
      event.eventName,
      event.title,
      event.message,
      event.details,
      event.fullTxHash,
      event.universityCode,
      event.entityId,
      event.entityId === undefined ? "" : `#${event.entityId}`,
      event.amountCamp,
      event.status,
    ].some((value) => String(value ?? "").toLowerCase().includes(normalizedQuery));
  });
}

function countStatuses<T>(items: T[], getStatus: (item: T) => string) {
  return Object.fromEntries(STATUS_LABELS.map((status) => [status, items.filter((item) => getStatus(item) === status).length])) as Record<typeof STATUS_LABELS[number], number>;
}

function statusForUniversity(status: number): string {
  if (status === 2) return "Active";
  if (status === 1) return "Pending";
  if (status === 3) return "Rejected";
  if (status === 4) return "Suspended";
  return "Unknown";
}

export function universityStatusLabel(status: number): string {
  return statusForUniversity(status);
}

export function aggregateOperations(data: OperationsData): OperationsMetrics {
  const { universities, profiles, scholarships, applications, events, escrows, listings, activity } = data;
  const profileByAddress = new Map(profiles.map((profile) => [profile.address.toLowerCase(), profile]));
  const universityCodeForAddress = (address: string) =>
    profileByAddress.get(address.toLowerCase())?.universityCode?.toUpperCase() ?? "";
  const statusCounts = countStatuses(scholarships, (scholarship) => scholarship.adminApprovalStatus);
  const applicationCounts = countStatuses(applications, (application) => application.status);
  const byCategory: Record<ActivityCategory, number> = {
    identity: 0,
    payments: 0,
    escrow: 0,
    events: 0,
    scholarships: 0,
    marketplace: 0,
    food: 0,
    other: 0,
  };
  activity.forEach((event) => { byCategory[activityCategory(event)] += 1; });

  const summaries: UniversitySummary[] = universities.map((university) => {
    const code = university.code.toUpperCase();
    const campusProfiles = profiles.filter((profile) => profile.universityCode?.toUpperCase() === code);
    const campusEvents = events.filter((event) => event.university_code?.toUpperCase() === code);
    const campusScholarships = scholarships.filter((scholarship) => universityCodeForAddress(scholarship.createdByUniversityId) === code);
    const campusListings = listings.filter((listing) => listing.universityCode?.toUpperCase() === code);
    const campusEscrows = escrows.filter((escrow) => escrow.universityCode?.toUpperCase() === code);
    return {
      code: university.code,
      name: university.name,
      approvalStatus: university.approvalStatus,
      profileCount: campusProfiles.length,
      pendingProfileCount: campusProfiles.filter((profile) => profile.verificationStatus === 1).length,
      scholarshipCount: campusScholarships.length,
      eventCount: campusEvents.length,
      eventCapacity: campusEvents.reduce((total, event) => total + event.capacity, 0),
      ticketsSold: campusEvents.reduce((total, event) => total + event.tickets_sold, 0),
      listingCount: campusListings.length,
      escrowCount: campusEscrows.length,
      escrowVolumeCamp: campusEscrows.reduce((total, escrow) => total + escrow.amount, 0),
    };
  });

  const activityTransactions = new Set(activity.map((event) => event.fullTxHash)).size;
  const totalEventCapacity = events.reduce((total, event) => total + event.capacity, 0);
  const totalTicketsSold = events.reduce((total, event) => total + event.tickets_sold, 0);

  return {
    totalUniversities: universities.length,
    activeUniversities: universities.filter((university) => university.approvalStatus === 2).length,
    pendingUniversities: universities.filter((university) => university.approvalStatus === 1).length,
    suspendedUniversities: universities.filter((university) => university.approvalStatus === 4).length,
    rejectedUniversities: universities.filter((university) => university.approvalStatus === 3).length,
    totalProfiles: profiles.length,
    profilesByRole: Object.fromEntries(
      Object.entries(profiles.reduce<Record<string, number>>((counts, profile) => {
        const label = ROLE_LABELS[profile.role] ?? `Role ${profile.role}`;
        counts[label] = (counts[label] ?? 0) + 1;
        return counts;
      }, {}))
    ),
    profilesByVerification: Object.fromEntries(
      Object.entries(profiles.reduce<Record<string, number>>((counts, profile) => {
        const label = VERIFICATION_LABELS[profile.verificationStatus] ?? `Status ${profile.verificationStatus}`;
        counts[label] = (counts[label] ?? 0) + 1;
        return counts;
      }, {}))
    ),
    pendingApprovals: {
      universities: universities.filter((university) => university.approvalStatus === 1).length,
      scholarships: scholarships.filter((scholarship) => scholarship.adminApprovalStatus === "pending").length,
      profiles: profiles.filter((profile) => profile.verificationStatus === 1).length,
      total: universities.filter((university) => university.approvalStatus === 1).length
        + scholarships.filter((scholarship) => scholarship.adminApprovalStatus === "pending").length
        + profiles.filter((profile) => profile.verificationStatus === 1).length,
    },
    scholarships: {
      total: scholarships.length,
      pending: statusCounts.pending,
      approved: statusCounts.approved,
      rejected: statusCounts.rejected,
      suspended: statusCounts.suspended,
    },
    applications: {
      total: applications.length,
      pending: applicationCounts.pending,
      approved: applicationCounts.approved,
      rejected: applicationCounts.rejected,
      suspended: applicationCounts.suspended,
    },
    events: {
      total: events.length,
      capacity: totalEventCapacity,
      ticketsSold: totalTicketsSold,
      utilizationPercent: totalEventCapacity ? Math.round((totalTicketsSold / totalEventCapacity) * 100) : 0,
    },
    escrows: {
      total: escrows.length,
      volumeCamp: escrows.reduce((total, escrow) => total + escrow.amount, 0),
      funded: escrows.filter((escrow) => escrow.status === 1).length,
      released: escrows.filter((escrow) => escrow.status === 2).length,
      refunded: escrows.filter((escrow) => escrow.status === 3).length,
    },
    listings: {
      total: listings.length,
      active: listings.filter((listing) => listing.status === 1).length,
      sold: listings.filter((listing) => listing.status === 2).length,
      cancelled: listings.filter((listing) => listing.status === 3).length,
    },
    activity: {
      total: activity.length,
      recentTransactionVolume: activityTransactions,
      byCategory,
    },
    universities: summaries,
  };
}

function csvCell(value: string | number): string {
  const text = String(value);
  return /[",\n]/.test(text) ? `"${text.replaceAll('"', '""')}"` : text;
}

export function formatUniversitiesCsv(summaries: UniversitySummary[]): string {
  const headers = [
    "University", "Code", "Status", "Profiles", "Pending Profiles", "Scholarships",
    "Events", "Event Capacity", "Tickets Sold", "Utilization", "Listings", "Escrows", "Escrow Volume (CAMP)",
  ];
  const rows = summaries.map((summary) => [
    summary.name,
    summary.code,
    statusForUniversity(summary.approvalStatus),
    summary.profileCount,
    summary.pendingProfileCount,
    summary.scholarshipCount,
    summary.eventCount,
    summary.eventCapacity,
    summary.ticketsSold,
    `${summary.eventCapacity ? Math.round((summary.ticketsSold / summary.eventCapacity) * 100) : 0}%`,
    summary.listingCount,
    summary.escrowCount,
    summary.escrowVolumeCamp.toFixed(2),
  ]);
  return [headers, ...rows].map((row) => row.map((cell) => csvCell(cell)).join(",")).join("\n");
}
