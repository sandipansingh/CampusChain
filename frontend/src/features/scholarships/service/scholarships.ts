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

export interface Scholarship {
  id: number;
  title: string;
  description: string;
  criteria: string;
  amount: number;
  deadline: string;
  slots: number;
  createdByUniversityId: string;
  adminApprovalStatus: "pending" | "approved" | "rejected" | "suspended";
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

function parseStatus(statusVal: any): "pending" | "approved" | "rejected" | "suspended" {
  if (statusVal === 0 || statusVal === "0") return "pending";
  if (statusVal === 1 || statusVal === "1") return "approved";
  if (statusVal === 2 || statusVal === "2") return "rejected";
  if (statusVal === 3 || statusVal === "3") return "suspended";
  if (!statusVal) return "pending";
  let statusStr = "";
  if (typeof statusVal === "string") {
    statusStr = statusVal;
  } else if (typeof statusVal === "object") {
    statusStr = statusVal.name ?? statusVal.tag ?? Object.keys(statusVal)[0] ?? "";
  }
  const val = String(statusStr).toLowerCase();
  if (val === "pending" || val === "approved" || val === "rejected" || val === "suspended") {
    return val as any;
  }
  return "pending";
}

export async function fetchScholarshipProgram(id: number, address?: string): Promise<Scholarship | null> {
  try {
    const caller = address || "GCFIRY65OQE7DFP5KLNS2PF2LVZMUZYJX4OZIEQ36N2IQANUB5XVYOJR";
    const item: any = await readContract(
      NEXT_PUBLIC_CAMPUS_SERVICE_CONTRACT_ID,
      "get_scholarship",
      [u64ToScVal(id), addressToScVal(caller)],
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
    const caller = address || "GCFIRY65OQE7DFP5KLNS2PF2LVZMUZYJX4OZIEQ36N2IQANUB5XVYOJR";
    const list = await readContract(
      NEXT_PUBLIC_CAMPUS_SERVICE_CONTRACT_ID,
      "get_scholarships",
      [addressToScVal(caller)],
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
    const caller = address || "GCFIRY65OQE7DFP5KLNS2PF2LVZMUZYJX4OZIEQ36N2IQANUB5XVYOJR";
    const list = await readContract(
      NEXT_PUBLIC_CAMPUS_SERVICE_CONTRACT_ID,
      "get_scholarship_applications",
      [addressToScVal(caller)],
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
    const caller = address || "GCFIRY65OQE7DFP5KLNS2PF2LVZMUZYJX4OZIEQ36N2IQANUB5XVYOJR";
    const item: any = await readContract(
      NEXT_PUBLIC_CAMPUS_SERVICE_CONTRACT_ID,
      "get_scholarship_application",
      [u64ToScVal(id), addressToScVal(caller)],
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

export async function executeAdminSuspendScholarship(
  adminId: string,
  scholarshipId: number
): Promise<string> {
  const { signTx } = await import("@/features/wallet/service/wallet");
  return invokeContractMethod(
    NEXT_PUBLIC_CAMPUS_SERVICE_CONTRACT_ID,
    "admin_suspend_scholarship",
    [
      addressToScVal(adminId),
      u64ToScVal(scholarshipId),
    ],
    adminId,
    signTx
  );
}
