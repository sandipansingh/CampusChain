import {
  readContract,
  invokeContractMethod,
  addressToScVal,
  stringToScVal,
  u64ToScVal,
  NEXT_PUBLIC_CAMPUS_IDENTITY_CONTRACT_ID,
} from "@/shared/stellar/client";
import { signTx } from "./wallet";
import { xdr, nativeToScVal } from "@stellar/stellar-sdk";

export interface UserProfile {
  address: string;
  fullName: string;
  universityId: number;
  department: string;
  role: number; // 1 = Student, 2 = Merchant, 4 = Admin
  verified: boolean;
  createdAt: number;
}

function parseRole(roleVal: unknown): number {
  if (!roleVal) return 1;
  if (typeof roleVal === "number") {
    if (roleVal === 1 || roleVal === 2 || roleVal === 4) return roleVal;
    return 1;
  }
  if (typeof roleVal === "string") {
    if (roleVal === "Student" || roleVal === "1") return 1;
    if (roleVal === "Merchant" || roleVal === "2") return 2;
    if (roleVal === "Admin" || roleVal === "4") return 4;
    return 1;
  }
  const obj = roleVal as Record<string, unknown>;
  const name = String(obj.name || obj.tag || "");
  if (name === "Student" || name === "1") return 1;
  if (name === "Merchant" || name === "2") return 2;
  if (name === "Admin" || name === "4") return 4;
  return 1;
}

export function roleToScVal(role: number): xdr.ScVal {
  let roleName = "Student";
  if (role === 2) roleName = "Merchant";
  if (role === 4) roleName = "Admin";
  return xdr.ScVal.scvVec([
    xdr.ScVal.scvSymbol(roleName)
  ]);
}

export async function fetchUserProfile(address: string): Promise<UserProfile | null> {
  try {
    const res = await readContract(
      NEXT_PUBLIC_CAMPUS_IDENTITY_CONTRACT_ID,
      "get_profile",
      [addressToScVal(address)],
      address
    );
    if (!res || typeof res !== "object") {
      return null;
    }
    const profile = res as Record<string, unknown>;
    return {
      address: String(profile.address || address),
      fullName: String(profile.full_name || ""),
      universityId: Number(profile.university_id || 0),
      department: String(profile.department || ""),
      role: parseRole(profile.role),
      verified: Boolean(profile.verified),
      createdAt: Number(profile.created_at || 0),
    };
  } catch (err: unknown) {
    // If the contract throws a "ProfileNotFound" simulation error, return null
    const errStr = String(err instanceof Error ? err.message : err);
    if (errStr.includes("ProfileNotFound") || errStr.includes("Contract, #4")) {
      return null;
    }
    throw err;
  }
}

export async function executeRegisterProfile(
  address: string,
  fullName: string,
  universityId: number,
  department: string
): Promise<string> {
  return invokeContractMethod(
    NEXT_PUBLIC_CAMPUS_IDENTITY_CONTRACT_ID,
    "register_profile",
    [
      addressToScVal(address),
      stringToScVal(fullName),
      u64ToScVal(universityId),
      stringToScVal(department),
    ],
    address,
    signTx
  );
}

export async function executeSetRole(admin: string, targetAddress: string, role: number): Promise<string> {
  return invokeContractMethod(
    NEXT_PUBLIC_CAMPUS_IDENTITY_CONTRACT_ID,
    "set_role",
    [
      addressToScVal(admin),
      addressToScVal(targetAddress),
      roleToScVal(role),
    ],
    admin,
    signTx
  );
}

export async function executeSetVerified(admin: string, targetAddress: string, verified: boolean): Promise<string> {
  return invokeContractMethod(
    NEXT_PUBLIC_CAMPUS_IDENTITY_CONTRACT_ID,
    "set_verified",
    [
      addressToScVal(admin),
      addressToScVal(targetAddress),
      nativeToScVal(verified),
    ],
    admin,
    signTx
  );
}
