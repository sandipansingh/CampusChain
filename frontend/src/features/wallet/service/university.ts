import {
  readContract,
  invokeContractMethod,
  addressToScVal,
  u64ToScVal,
  stringToScVal,
  NEXT_PUBLIC_CAMPUS_SERVICE_CONTRACT_ID,
} from "@/shared/stellar/client";
import { signTx } from "@/features/wallet/service/wallet";

export async function fetchUniversities(address?: string) {
  const res = await readContract(
    NEXT_PUBLIC_CAMPUS_SERVICE_CONTRACT_ID,
    "list_universities",
    [],
    address
  );
  if (!res || !Array.isArray(res)) return [];
  return res.map((u: { id: bigint; name: string; location: string; description: string; admin: string; member_count: bigint }) => ({
    id: Number(u.id),
    name: String(u.name),
    location: String(u.location),
    description: String(u.description),
    admin: String(u.admin),
    member_count: Number(u.member_count),
  }));
}

export async function fetchUniversity(id: number, address?: string) {
  const res = await readContract(
    NEXT_PUBLIC_CAMPUS_SERVICE_CONTRACT_ID,
    "get_university",
    [u64ToScVal(id)],
    address
  );
  if (!res) return null;
  const u = res as { id: bigint; name: string; location: string; description: string; admin: string; member_count: bigint };
  return {
    id: Number(u.id),
    name: String(u.name),
    location: String(u.location),
    description: String(u.description),
    admin: String(u.admin),
    member_count: Number(u.member_count),
  };
}

export async function fetchMembership(memberAddress: string): Promise<number | null> {
  const res = await readContract(
    NEXT_PUBLIC_CAMPUS_SERVICE_CONTRACT_ID,
    "get_membership",
    [addressToScVal(memberAddress)],
    memberAddress
  );
  if (res === null || res === undefined) return null;
  return Number(res);
}

export async function fetchPendingRequests(universityId: number, address?: string) {
  const res = await readContract(
    NEXT_PUBLIC_CAMPUS_SERVICE_CONTRACT_ID,
    "list_pending_requests",
    [u64ToScVal(universityId)],
    address
  );
  if (!res || !Array.isArray(res)) return [];
  return res.map((r: { id: bigint; university_id: bigint; applicant: string; status: number }) => ({
    id: Number(r.id),
    university_id: Number(r.university_id),
    applicant: String(r.applicant),
    status: Number(r.status),
  }));
}

export async function executeRegisterUniversity(
  admin: string,
  name: string,
  location: string,
  description: string
): Promise<string> {
  return invokeContractMethod(
    NEXT_PUBLIC_CAMPUS_SERVICE_CONTRACT_ID,
    "register_university",
    [addressToScVal(admin), stringToScVal(name), stringToScVal(location), stringToScVal(description)],
    admin,
    signTx
  );
}

export async function executeRequestJoin(universityId: number, applicant: string): Promise<string> {
  return invokeContractMethod(
    NEXT_PUBLIC_CAMPUS_SERVICE_CONTRACT_ID,
    "request_join",
    [u64ToScVal(universityId), addressToScVal(applicant)],
    applicant,
    signTx
  );
}

export async function executeApproveMember(requestId: number, admin: string): Promise<string> {
  return invokeContractMethod(
    NEXT_PUBLIC_CAMPUS_SERVICE_CONTRACT_ID,
    "approve_member",
    [u64ToScVal(requestId), addressToScVal(admin)],
    admin,
    signTx
  );
}

export async function executeDenyMember(requestId: number, admin: string): Promise<string> {
  return invokeContractMethod(
    NEXT_PUBLIC_CAMPUS_SERVICE_CONTRACT_ID,
    "deny_member",
    [u64ToScVal(requestId), addressToScVal(admin)],
    admin,
    signTx
  );
}

export async function executeInviteMember(
  universityId: number,
  invitee: string,
  admin: string
): Promise<string> {
  return invokeContractMethod(
    NEXT_PUBLIC_CAMPUS_SERVICE_CONTRACT_ID,
    "invite_member",
    [u64ToScVal(universityId), addressToScVal(invitee), addressToScVal(admin)],
    admin,
    signTx
  );
}

export async function executeAcceptInvite(inviteId: number, invitee: string): Promise<string> {
  return invokeContractMethod(
    NEXT_PUBLIC_CAMPUS_SERVICE_CONTRACT_ID,
    "accept_invite",
    [u64ToScVal(inviteId), addressToScVal(invitee)],
    invitee,
    signTx
  );
}

export async function executeLeaveUniversity(member: string): Promise<string> {
  return invokeContractMethod(
    NEXT_PUBLIC_CAMPUS_SERVICE_CONTRACT_ID,
    "leave_university",
    [addressToScVal(member)],
    member,
    signTx
  );
}
