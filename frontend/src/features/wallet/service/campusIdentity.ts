import {
  addressToScVal,
  invokeContractMethod,
  NEXT_PUBLIC_CAMPUS_IDENTITY_CONTRACT_ID,
  readContract,
  stringToScVal,
  u32ToScVal,
} from "@/shared/stellar/client";
import { nativeToScVal, xdr } from "@stellar/stellar-sdk";

export const UserRole = {
  Student: 1,
  Merchant: 2,
  EventOrganizer: 3,
  UniversityAdmin: 4,
  PlatformAdmin: 5,
} as const;

export const VerificationStatus = {
  Pending: 1,
  Verified: 2,
  Rejected: 3,
} as const;

export const UniversityApprovalStatus = {
  PendingApproval: 1,
  Approved: 2,
  Rejected: 3,
  Suspended: 4,
} as const;

export type OnboardingRole = keyof Pick<typeof UserRole, "Student" | "Merchant" | "EventOrganizer" | "UniversityAdmin">;

export interface UniversityRecord {
  code: string;
  name: string;
  address: string;
  adminAddress: string;
  approvalStatus: number;
  createdAt: number;
}

export interface UserProfile {
  address: string;
  fullName: string;
  universityCode: string | null;
  role: number;
  verificationStatus: number;
  details: Record<string, unknown>;
  createdAt: number;
}

export type ProfileRegistration =
  | { role: "Student"; department: string; program: string; graduationYear: number; studentIdentifier: string }
  | { role: "Merchant"; businessName: string; category: number; businessDescription: string }
  | { role: "EventOrganizer"; organizationName: string; organizationDescription: string };

function enumValue(value: unknown, fallback = 0): number {
  if (typeof value === "number") return value;
  if (typeof value === "bigint") return Number(value);
  if (typeof value === "string") {
    const names: Record<string, number> = {
      Student: UserRole.Student, Merchant: UserRole.Merchant, EventOrganizer: UserRole.EventOrganizer,
      UniversityAdmin: UserRole.UniversityAdmin, PlatformAdmin: UserRole.PlatformAdmin,
      Pending: VerificationStatus.Pending, Verified: VerificationStatus.Verified, Rejected: VerificationStatus.Rejected,
      PendingApproval: UniversityApprovalStatus.PendingApproval, Approved: UniversityApprovalStatus.Approved,
      Suspended: UniversityApprovalStatus.Suspended,
    };
    return names[value] ?? (Number(value) || fallback);
  }
  const item = value as Record<string, unknown> | null;
  if (item && typeof item === "object") return enumValue(item.name ?? item.tag ?? Object.keys(item)[0], fallback);
  return fallback;
}

function enumScVal(name: string, payload: xdr.ScVal): xdr.ScVal {
  return xdr.ScVal.scvVec([nativeToScVal(name, { type: "symbol" }), payload]);
}

function structScVal(fields: Record<string, unknown>, types: Record<string, ["symbol", "string" | "u32" | "bytes"]>): xdr.ScVal {
  return nativeToScVal(fields, { type: types });
}

async function profileDetailsScVal(registration: ProfileRegistration): Promise<xdr.ScVal> {
  if (registration.role === "Student") {
    const digest = new Uint8Array(await crypto.subtle.digest(
      "SHA-256",
      new TextEncoder().encode(registration.studentIdentifier).buffer as ArrayBuffer
    ));
    return enumScVal("Student", structScVal(
      {
        department: registration.department,
        program: registration.program,
        graduation_year: registration.graduationYear,
        student_identifier_hash: digest,
      },
      {
        department: ["symbol", "string"], program: ["symbol", "string"],
        graduation_year: ["symbol", "u32"], student_identifier_hash: ["symbol", "bytes"],
      }
    ));
  }
  if (registration.role === "Merchant") {
    return enumScVal("Merchant", structScVal(
      { business_name: registration.businessName, category: registration.category, business_description: registration.businessDescription },
      { business_name: ["symbol", "string"], category: ["symbol", "u32"], business_description: ["symbol", "string"] }
    ));
  }
  return enumScVal("EventOrganizer", structScVal(
    { organization_name: registration.organizationName, organization_description: registration.organizationDescription },
    { organization_name: ["symbol", "string"], organization_description: ["symbol", "string"] }
  ));
}

export async function fetchUserProfile(address: string): Promise<UserProfile | null> {
  try {
    const result = await readContract(NEXT_PUBLIC_CAMPUS_IDENTITY_CONTRACT_ID, "get_profile", [addressToScVal(address)], address);
    if (!result || typeof result !== "object") return null;
    const profile = result as Record<string, unknown>;
    return {
      address: String(profile.address ?? address),
      fullName: String(profile.full_name ?? ""),
      universityCode: profile.university_code == null ? null : String(profile.university_code),
      role: enumValue(profile.role),
      verificationStatus: enumValue(profile.verification_status),
      details: (profile.details as Record<string, unknown>) ?? {},
      createdAt: Number(profile.created_at ?? 0),
    };
  } catch (error) {
    const message = String(error instanceof Error ? error.message : error);
    if (message.includes("ProfileNotFound") || message.includes("Contract, #4")) return null;
    throw error;
  }
}

export async function fetchUniversities(address?: string): Promise<UniversityRecord[]> {
  const result = await readContract(NEXT_PUBLIC_CAMPUS_IDENTITY_CONTRACT_ID, "list_universities", [], address);
  if (!Array.isArray(result)) return [];
  return result.map((university) => {
    const item = university as Record<string, unknown>;
    return {
      code: String(item.code ?? ""), name: String(item.name ?? ""), address: String(item.address ?? ""),
      adminAddress: String(item.admin_address ?? ""), approvalStatus: enumValue(item.approval_status),
      createdAt: Number(item.created_at ?? 0),
    };
  });
}

export async function fetchUniversity(code: string, address?: string): Promise<UniversityRecord | null> {
  try {
    const result = await readContract(NEXT_PUBLIC_CAMPUS_IDENTITY_CONTRACT_ID, "get_university", [stringToScVal(code)], address);
    if (!result || typeof result !== "object") return null;
    const item = result as Record<string, unknown>;
    return { code: String(item.code ?? ""), name: String(item.name ?? ""), address: String(item.address ?? ""), adminAddress: String(item.admin_address ?? ""), approvalStatus: enumValue(item.approval_status), createdAt: Number(item.created_at ?? 0) };
  } catch (error) {
    const message = String(error instanceof Error ? error.message : error);
    if (message.includes("UniversityNotFound") || message.includes("Contract, #6")) return null;
    throw error;
  }
}

export async function executeRegisterUniversity(admin: string, code: string, name: string, address: string, title: string): Promise<string> {
  const { signTx } = await import("./wallet");
  return invokeContractMethod(NEXT_PUBLIC_CAMPUS_IDENTITY_CONTRACT_ID, "register_university", [addressToScVal(admin), stringToScVal(code), stringToScVal(name), stringToScVal(address), stringToScVal(title)], admin, signTx);
}

export async function executeRegisterProfile(address: string, fullName: string, universityCode: string, registration: ProfileRegistration): Promise<string> {
  const { signTx } = await import("./wallet");
  return invokeContractMethod(NEXT_PUBLIC_CAMPUS_IDENTITY_CONTRACT_ID, "register_profile", [addressToScVal(address), stringToScVal(fullName), stringToScVal(universityCode), u32ToScVal(UserRole[registration.role]), await profileDetailsScVal(registration)], address, signTx);
}

export async function executeApproveUniversity(caller: string, code: string): Promise<string> {
  const { signTx } = await import("./wallet");
  return invokeContractMethod(NEXT_PUBLIC_CAMPUS_IDENTITY_CONTRACT_ID, "approve_university", [addressToScVal(caller), stringToScVal(code)], caller, signTx);
}

export async function executeRejectUniversity(caller: string, code: string): Promise<string> {
  const { signTx } = await import("./wallet");
  return invokeContractMethod(NEXT_PUBLIC_CAMPUS_IDENTITY_CONTRACT_ID, "reject_university", [addressToScVal(caller), stringToScVal(code)], caller, signTx);
}

export async function executeVerifyProfile(caller: string, targetAddress: string): Promise<string> {
  const { signTx } = await import("./wallet");
  return invokeContractMethod(NEXT_PUBLIC_CAMPUS_IDENTITY_CONTRACT_ID, "verify_profile", [addressToScVal(caller), addressToScVal(targetAddress)], caller, signTx);
}

export async function executeRejectProfile(caller: string, targetAddress: string): Promise<string> {
  const { signTx } = await import("./wallet");
  return invokeContractMethod(NEXT_PUBLIC_CAMPUS_IDENTITY_CONTRACT_ID, "reject_profile", [addressToScVal(caller), addressToScVal(targetAddress)], caller, signTx);
}

export async function fetchUniversityProfiles(universityCode: string): Promise<UserProfile[]> {
  try {
    const rawAddresses = await readContract(
      NEXT_PUBLIC_CAMPUS_IDENTITY_CONTRACT_ID,
      "list_profiles",
      []
    );
    if (!rawAddresses || !Array.isArray(rawAddresses)) return [];

    const profiles: UserProfile[] = [];
    for (const addr of rawAddresses) {
      if (typeof addr !== "string") continue;
      try {
        const profile = await fetchUserProfile(addr);
        if (profile && profile.universityCode?.toUpperCase() === universityCode.toUpperCase()) {
          profiles.push(profile);
        }
      } catch {
        // ignore profile fetch issues
      }
    }

    return profiles;
  } catch (error) {
    console.error("fetchUniversityProfiles failed", error);
    return [];
  }
}

export async function executeSuspendUniversity(caller: string, code: string): Promise<string> {
  const { signTx } = await import("./wallet");
  return invokeContractMethod(NEXT_PUBLIC_CAMPUS_IDENTITY_CONTRACT_ID, "suspend_university", [addressToScVal(caller), stringToScVal(code)], caller, signTx);
}
