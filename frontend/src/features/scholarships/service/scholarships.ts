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
import { signTx } from "@/features/wallet/service/wallet";
import { nativeToScVal } from "@stellar/stellar-sdk";

export async function fetchScholarshipProgram(id: number, address?: string) {
  const res = (await readContract(
    NEXT_PUBLIC_CAMPUS_SERVICE_CONTRACT_ID,
    "get_scholarship_program",
    [u64ToScVal(id)],
    address
  )) as unknown as { id: bigint; name: string; amount: bigint; sponsor: string; min_gpa: number; active: boolean };

  if (!res) return null;
  return {
    id: Number(res.id),
    name: String(res.name),
    amount: Number(res.amount) / 10_000_000,
    sponsor: String(res.sponsor),
    min_gpa: Number(res.min_gpa),
    active: Boolean(res.active),
  };
}

export async function fetchScholarshipApplication(id: number, address?: string) {
  const res = (await readContract(
    NEXT_PUBLIC_CAMPUS_SERVICE_CONTRACT_ID,
    "get_scholarship_application",
    [u64ToScVal(id)],
    address
  )) as unknown as { id: bigint; program_id: bigint; applicant: string; gpa: number; status: number };

  if (!res) return null;
  return {
    id: Number(res.id),
    program_id: Number(res.program_id),
    applicant: String(res.applicant),
    gpa: Number(res.gpa),
    status: Number(res.status),
  };
}

export async function executeCreateScholarshipProgram(
  admin: string,
  name: string,
  amount: number,
  minGpa: number
): Promise<string> {
  const rawAmount = BigInt(Math.round(amount * 10_000_000));
  return invokeContractMethod(
    NEXT_PUBLIC_CAMPUS_SERVICE_CONTRACT_ID,
    "create_scholarship_program",
    [
      addressToScVal(admin),
      stringToScVal(name),
      i128ToScVal(rawAmount),
      u32ToScVal(minGpa),
    ],
    admin,
    signTx
  );
}

export async function executeApplyForScholarship(
  applicant: string,
  programId: number,
  gpa: number
): Promise<string> {
  return invokeContractMethod(
    NEXT_PUBLIC_CAMPUS_SERVICE_CONTRACT_ID,
    "apply_for_scholarship",
    [
      addressToScVal(applicant),
      u64ToScVal(programId),
      u32ToScVal(gpa),
    ],
    applicant,
    signTx
  );
}

export async function executeReviewScholarshipApplication(
  admin: string,
  applicationId: number,
  approved: boolean
): Promise<string> {
  return invokeContractMethod(
    NEXT_PUBLIC_CAMPUS_SERVICE_CONTRACT_ID,
    "review_scholarship_application",
    [
      addressToScVal(admin),
      u64ToScVal(applicationId),
      nativeToScVal(approved),
    ],
    admin,
    signTx
  );
}

export async function executeDisburseScholarship(
  admin: string,
  applicationId: number
): Promise<string> {
  return invokeContractMethod(
    NEXT_PUBLIC_CAMPUS_SERVICE_CONTRACT_ID,
    "disburse_scholarship",
    [
      addressToScVal(admin),
      u64ToScVal(applicationId),
    ],
    admin,
    signTx
  );
}
