/* eslint-disable @typescript-eslint/no-explicit-any */
import {
  readContract,
  invokeContractMethod,
  addressToScVal,
  i128ToScVal,
  u32ToScVal,
  u64ToScVal,
  stringToScVal,
  NEXT_PUBLIC_CAMPUS_SERVICE_CONTRACT_ID,
} from "@/shared/stellar/client";
import { nativeToScVal } from "@stellar/stellar-sdk";
import { executeApprove } from "@/features/wallet/service/campusToken";

export interface Scholarship {
  id: number;
  title: string;
  description: string;
  criteria: string;
  amount: number;
  deadline: string;
  slots: number;
  createdByUniversityId: string;
  adminApprovalStatus: "pending" | "approved" | "rejected";
  createdAt: number;
}

export interface ScholarshipApplication {
  id: number;
  scholarshipId: number;
  studentId: string;
  status: "pending" | "approved" | "rejected";
  appliedAt: number;
  decidedAt: number;
  decidedBy: string;
}

function parseStatus(statusVal: any): "pending" | "approved" | "rejected" {
  if (!statusVal) return "pending";
  if (typeof statusVal === "string") {
    const val = statusVal.toLowerCase();
    if (val === "pending" || val === "approved" || val === "rejected") {
      return val as any;
    }
  }
  if (typeof statusVal === "object" && statusVal.name) {
    const val = String(statusVal.name).toLowerCase();
    if (val === "pending" || val === "approved" || val === "rejected") {
      return val as any;
    }
  }
  return "pending";
}

export async function fetchScholarshipProgram(id: number, address?: string): Promise<Scholarship | null> {
  try {
    const item: any = await readContract(
      NEXT_PUBLIC_CAMPUS_SERVICE_CONTRACT_ID,
      "get_scholarship",
      [u64ToScVal(id)],
      address
    );
    if (!item) return null;
    return {
      id: Number(item.id),
      title: String(item.title || ""),
      description: String(item.description || ""),
      criteria: String(item.criteria || ""),
      amount: Number(item.amount) / 10_000_000,
      deadline: String(item.deadline || ""),
      slots: Number(item.slots),
      createdByUniversityId: String(item.created_by || ""),
      adminApprovalStatus: parseStatus(item.admin_approval_status),
      createdAt: Number(item.created_at) * 1000,
    };
  } catch (err) {
    console.error("fetchScholarshipProgram failed", err);
    return null;
  }
}

export async function fetchScholarshipPrograms(address?: string): Promise<Scholarship[]> {
  try {
    const list = await readContract(
      NEXT_PUBLIC_CAMPUS_SERVICE_CONTRACT_ID,
      "get_scholarships",
      [],
      address
    );
    if (!Array.isArray(list)) return [];
    return list.map((item: any) => ({
      id: Number(item.id),
      title: String(item.title || ""),
      description: String(item.description || ""),
      criteria: String(item.criteria || ""),
      amount: Number(item.amount) / 10_000_000,
      deadline: String(item.deadline || ""),
      slots: Number(item.slots),
      createdByUniversityId: String(item.created_by || ""),
      adminApprovalStatus: parseStatus(item.admin_approval_status),
      createdAt: Number(item.created_at) * 1000,
    }));
  } catch (err) {
    console.error("fetchScholarshipPrograms failed", err);
    return [];
  }
}

export async function fetchScholarshipApplications(address?: string): Promise<ScholarshipApplication[]> {
  try {
    const list = await readContract(
      NEXT_PUBLIC_CAMPUS_SERVICE_CONTRACT_ID,
      "get_scholarship_applications",
      [],
      address
    );
    if (!Array.isArray(list)) return [];
    return list.map((item: any) => ({
      id: Number(item.id),
      scholarshipId: Number(item.scholarship_id),
      studentId: String(item.student || ""),
      status: parseStatus(item.status),
      appliedAt: Number(item.applied_at) * 1000,
      decidedAt: Number(item.decided_at) * 1000,
      decidedBy: String(item.decided_by || ""),
    }));
  } catch (err) {
    console.error("fetchScholarshipApplications failed", err);
    return [];
  }
}

export async function fetchScholarshipApplication(id: number, address?: string): Promise<ScholarshipApplication | null> {
  try {
    const item: any = await readContract(
      NEXT_PUBLIC_CAMPUS_SERVICE_CONTRACT_ID,
      "get_scholarship_application",
      [u64ToScVal(id)],
      address
    );
    if (!item) return null;
    return {
      id: Number(item.id),
      scholarshipId: Number(item.scholarship_id),
      studentId: String(item.student || ""),
      status: parseStatus(item.status),
      appliedAt: Number(item.applied_at) * 1000,
      decidedAt: Number(item.decided_at) * 1000,
      decidedBy: String(item.decided_by || ""),
    };
  } catch (err) {
    console.error("fetchScholarshipApplication failed", err);
    return null;
  }
}

export async function executeCreateScholarshipProgram(
  universityId: string,
  title: string,
  description: string,
  criteria: string,
  amount: number,
  deadline: string,
  slots: number
): Promise<string> {
  const totalAmount = amount * slots;
  // Step 1: Approve service contract to withdraw funds
  await executeApprove(universityId, NEXT_PUBLIC_CAMPUS_SERVICE_CONTRACT_ID, totalAmount);

  // Step 2: Invoke create_scholarship
  const rawAmount = BigInt(Math.round(amount * 10_000_000));
  const { signTx } = await import("@/features/wallet/service/wallet");

  return invokeContractMethod(
    NEXT_PUBLIC_CAMPUS_SERVICE_CONTRACT_ID,
    "create_scholarship",
    [
      addressToScVal(universityId),
      stringToScVal(title),
      stringToScVal(description),
      stringToScVal(criteria),
      i128ToScVal(rawAmount),
      stringToScVal(deadline),
      u32ToScVal(slots),
    ],
    universityId,
    signTx
  );
}

export async function executeApplyForScholarship(studentId: string, scholarshipId: number): Promise<string> {
  const { signTx } = await import("@/features/wallet/service/wallet");
  return invokeContractMethod(
    NEXT_PUBLIC_CAMPUS_SERVICE_CONTRACT_ID,
    "apply_scholarship",
    [
      addressToScVal(studentId),
      u64ToScVal(scholarshipId),
    ],
    studentId,
    signTx
  );
}

export async function executeReviewScholarshipApplication(
  universityId: string,
  applicationId: number,
  approved: boolean
): Promise<string> {
  const { signTx } = await import("@/features/wallet/service/wallet");
  return invokeContractMethod(
    NEXT_PUBLIC_CAMPUS_SERVICE_CONTRACT_ID,
    "decide_application",
    [
      addressToScVal(universityId),
      u64ToScVal(applicationId),
      nativeToScVal(approved),
    ],
    universityId,
    signTx
  );
}

export async function executeAdminReviewScholarship(
  adminId: string,
  scholarshipId: number,
  approved: boolean
): Promise<string> {
  const { signTx } = await import("@/features/wallet/service/wallet");
  const method = approved ? "admin_approve_scholarship" : "admin_reject_scholarship";
  return invokeContractMethod(
    NEXT_PUBLIC_CAMPUS_SERVICE_CONTRACT_ID,
    method,
    [
      addressToScVal(adminId),
      u64ToScVal(scholarshipId),
    ],
    adminId,
    signTx
  );
}
