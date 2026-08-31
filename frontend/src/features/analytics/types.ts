import type { DecodedEvent } from "@/shared/stellar/eventDecoder";
import type { EventDetails } from "@/features/events/types";
import type { Scholarship, ScholarshipApplication } from "@/features/scholarships/service/scholarships";
import type { EscrowAgreement } from "@/features/marketplace/types";
import type { Listing } from "@/features/marketplace/types";
import type { UniversityRecord, UserProfile } from "@/features/wallet/service/campusIdentity";

export type OperationsSource =
  | "universities"
  | "profiles"
  | "scholarships"
  | "applications"
  | "events"
  | "escrows"
  | "listings"
  | "activity";

export interface OperationsData {
  universities: UniversityRecord[];
  profiles: UserProfile[];
  scholarships: Scholarship[];
  applications: ScholarshipApplication[];
  events: EventDetails[];
  escrows: EscrowAgreement[];
  listings: Listing[];
  activity: DecodedEvent[];
  errors: Partial<Record<OperationsSource, string>>;
  loadedAt: number;
}
export type ActivityCategory =
  | "identity"
  | "payments"
  | "escrow"
  | "events"
  | "scholarships"
  | "marketplace"
  | "food"
  | "other";

export interface UniversitySummary {
  code: string;
  name: string;
  approvalStatus: number;
  profileCount: number;
  pendingProfileCount: number;
  scholarshipCount: number;
  eventCount: number;
  eventCapacity: number;
  ticketsSold: number;
  listingCount: number;
  escrowCount: number;
  escrowVolumeCamp: number;
}

export interface OperationsMetrics {
  totalUniversities: number;
  activeUniversities: number;
  pendingUniversities: number;
  suspendedUniversities: number;
  rejectedUniversities: number;
  totalProfiles: number;
  profilesByRole: Record<string, number>;
  profilesByVerification: Record<string, number>;
  pendingApprovals: {
    total: number;
    universities: number;
    scholarships: number;
    profiles: number;
  };
  scholarships: {
    total: number;
    pending: number;
    approved: number;
    rejected: number;
    suspended: number;
  };
  applications: {
    total: number;
    pending: number;
    approved: number;
    rejected: number;
    suspended: number;
  };
  events: {
    total: number;
    capacity: number;
    ticketsSold: number;
    utilizationPercent: number;
  };
  escrows: {
    total: number;
    volumeCamp: number;
    funded: number;
    released: number;
    refunded: number;
  };
  listings: {
    total: number;
    active: number;
    sold: number;
    cancelled: number;
  };
  activity: {
    total: number;
    recentTransactionVolume: number;
    byCategory: Record<ActivityCategory, number>;
  };
  universities: UniversitySummary[];
}
