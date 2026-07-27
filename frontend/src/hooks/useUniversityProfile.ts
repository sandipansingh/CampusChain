"use client";

import { useState, useEffect } from "react";
import { useQueryClient } from "@tanstack/react-query";
import { useWalletStore } from "@/state/useWalletStore";
import { useTransactionStore } from "@/state/useTransactionStore";
import {
  useCampusUserRole,
  useSetRoleMutation,
  useRequestRoleChangeMutation,
  useApproveRoleChangeMutation,
  useDenyRoleChangeMutation,
  usePendingRoleRequests,
} from "@/hooks/useCampusToken";
import {
  useUniversities,
  useMembership,
  usePendingRequests,
  useRegisterUniversityMutation,
  useRequestJoinMutation,
  useApproveMemberMutation,
  useDenyMemberMutation,
  useInviteMemberMutation,
  useLeaveUniversityMutation,
} from "@/hooks/useCampusService";
import { pollTransactionStatus } from "@/services/contracts";
import { logger } from "@/services/logger";

export function useUniversityProfile() {
  const { address } = useWalletStore();
  const { data: role } = useCampusUserRole(address);
  const setRoleMut = useSetRoleMutation();
  const requestRoleMut = useRequestRoleChangeMutation();
  const approveRoleMut = useApproveRoleChangeMutation();
  const denyRoleMut = useDenyRoleChangeMutation();
  const { data: pendingRoleReqs = [] } = usePendingRoleRequests();
  const queryClient = useQueryClient();

  const addTransaction = useTransactionStore((state) => state.addTransaction);
  const updateTransaction = useTransactionStore((state) => state.updateTransaction);

  const [selectedRole, setSelectedRole] = useState<number>(0);

  // Sync selectedRole to the actual on-chain role once it loads
  useEffect(() => {
    if (role !== undefined && role !== null) {
      setSelectedRole(Number(role));
    }
  }, [role]);
  const [copied, setCopied] = useState(false);

  const { data: universities = [] } = useUniversities();
  const { data: membershipUniId } = useMembership(address);

  const regUniMut = useRegisterUniversityMutation();
  const reqJoinMut = useRequestJoinMutation();
  const approveMut = useApproveMemberMutation();
  const denyMut = useDenyMemberMutation();
  const inviteMut = useInviteMemberMutation();
  const leaveMut = useLeaveUniversityMutation();

  const myUniversity = universities.find((u) => u.admin === address);
  const { data: pendingReqs = [] } = usePendingRequests(myUniversity?.id ?? null);
  const myUni = universities.find((u) => u.id === membershipUniId);

  const [uniName, setUniName] = useState("");
  const [uniLocation, setUniLocation] = useState("");
  const [uniDesc, setUniDesc] = useState("");
  const [inviteAddress, setInviteAddress] = useState("");

  const handleCopy = () => {
    if (!address) return;
    navigator.clipboard.writeText(address);
    setCopied(true);
    setTimeout(() => setCopied(false), 2000);
  };

  const handleRegisterRole = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!address) return;
    const startTime = Date.now();
    const actionName = "REQUEST ROLE CHANGE";
    try {
      if (selectedRole <= 1) {
        // Guest (0) / Student (1): self-assignable, no admin needed
        const hash = await setRoleMut.mutateAsync({ admin: address, user: address, role: selectedRole });
        addTransaction({
          hash,
          status: "pending",
          method: "UPDATE ROLE",
          timestamp: Date.now(),
          explorerUrl: `https://stellar.expert/explorer/testnet/tx/${hash}`,
        });
        updateTransaction(hash, { status: "processing" });
        await pollTransactionStatus(hash);
        updateTransaction(hash, { status: "confirmed" });
        queryClient.invalidateQueries({ queryKey: ["campus-role", address] });
        logger.trackTransaction({ hash, method: actionName, status: "confirmed", durationMs: Date.now() - startTime });
      } else {
        // Merchant (2) / Club (3) / Admin (4): requires admin approval via role request
        const hash = await requestRoleMut.mutateAsync({ applicant: address, requestedRole: selectedRole });
        addTransaction({
          hash,
          status: "pending",
          method: actionName,
          timestamp: Date.now(),
          explorerUrl: `https://stellar.expert/explorer/testnet/tx/${hash}`,
        });
        updateTransaction(hash, { status: "processing" });
        await pollTransactionStatus(hash);
        updateTransaction(hash, { status: "confirmed" });
        queryClient.invalidateQueries({ queryKey: ["role-requests"] });
        logger.trackTransaction({ hash, method: actionName, status: "confirmed", durationMs: Date.now() - startTime });
      }
    } catch (err) {
      const errMsg = err instanceof Error ? err.message : "Role registration failed";
      addTransaction({
        hash: `err_${Date.now()}`,
        status: "failed",
        method: actionName,
        timestamp: Date.now(),
        errorMessage: errMsg,
      });
      logger.error("Role update failed", err);
    }
  };

  const handleCreateUniversity = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!address || !uniName || !uniLocation) return;
    try {
      const hash = await regUniMut.mutateAsync({ admin: address, name: uniName, location: uniLocation, description: uniDesc });
      addTransaction({
        hash,
        status: "pending",
        method: "REGISTER UNIVERSITY",
        timestamp: Date.now(),
        explorerUrl: `https://stellar.expert/explorer/testnet/tx/${hash}`,
      });
      updateTransaction(hash, { status: "processing" });
      await pollTransactionStatus(hash);
      updateTransaction(hash, { status: "confirmed" });
      setUniName("");
      setUniLocation("");
      setUniDesc("");
    } catch (err) {
      addTransaction({
        hash: `err_${Date.now()}`,
        status: "failed",
        method: "REGISTER UNIVERSITY",
        timestamp: Date.now(),
        errorMessage: String(err),
      });
    }
  };

  const handleRequestJoin = async (uniId: number) => {
    if (!address) return;
    try {
      const hash = await reqJoinMut.mutateAsync({ universityId: uniId, applicant: address });
      addTransaction({
        hash,
        status: "pending",
        method: "REQUEST JOIN",
        timestamp: Date.now(),
        explorerUrl: `https://stellar.expert/explorer/testnet/tx/${hash}`,
      });
      updateTransaction(hash, { status: "processing" });
      await pollTransactionStatus(hash);
      updateTransaction(hash, { status: "confirmed" });
    } catch (err) {
      addTransaction({
        hash: `err_${Date.now()}`,
        status: "failed",
        method: "REQUEST JOIN",
        timestamp: Date.now(),
        errorMessage: String(err),
      });
    }
  };

  const handleApprove = async (reqId: number) => {
    if (!address) return;
    try {
      const hash = await approveMut.mutateAsync({ requestId: reqId, admin: address });
      addTransaction({
        hash,
        status: "pending",
        method: "APPROVE MEMBER",
        timestamp: Date.now(),
        explorerUrl: `https://stellar.expert/explorer/testnet/tx/${hash}`,
      });
      updateTransaction(hash, { status: "processing" });
      await pollTransactionStatus(hash);
      updateTransaction(hash, { status: "confirmed" });
    } catch (err) {
      addTransaction({
        hash: `err_${Date.now()}`,
        status: "failed",
        method: "APPROVE MEMBER",
        timestamp: Date.now(),
        errorMessage: String(err),
      });
    }
  };

  const handleDeny = async (reqId: number) => {
    if (!address) return;
    try {
      const hash = await denyMut.mutateAsync({ requestId: reqId, admin: address });
      addTransaction({
        hash,
        status: "pending",
        method: "DENY MEMBER",
        timestamp: Date.now(),
        explorerUrl: `https://stellar.expert/explorer/testnet/tx/${hash}`,
      });
      updateTransaction(hash, { status: "processing" });
      await pollTransactionStatus(hash);
      updateTransaction(hash, { status: "confirmed" });
    } catch (err) {
      addTransaction({
        hash: `err_${Date.now()}`,
        status: "failed",
        method: "DENY MEMBER",
        timestamp: Date.now(),
        errorMessage: String(err),
      });
    }
  };

  const handleInvite = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!address || !myUniversity || !inviteAddress) return;
    try {
      const hash = await inviteMut.mutateAsync({
        universityId: myUniversity.id,
        invitee: inviteAddress,
        admin: address,
      });
      addTransaction({
        hash,
        status: "pending",
        method: "INVITE MEMBER",
        timestamp: Date.now(),
        explorerUrl: `https://stellar.expert/explorer/testnet/tx/${hash}`,
      });
      updateTransaction(hash, { status: "processing" });
      await pollTransactionStatus(hash);
      updateTransaction(hash, { status: "confirmed" });
      setInviteAddress("");
    } catch (err) {
      addTransaction({
        hash: `err_${Date.now()}`,
        status: "failed",
        method: "INVITE MEMBER",
        timestamp: Date.now(),
        errorMessage: String(err),
      });
    }
  };

  const handleLeave = async () => {
    if (!address) return;
    try {
      const hash = await leaveMut.mutateAsync({ member: address });
      addTransaction({
        hash,
        status: "pending",
        method: "LEAVE UNIVERSITY",
        timestamp: Date.now(),
        explorerUrl: `https://stellar.expert/explorer/testnet/tx/${hash}`,
      });
      updateTransaction(hash, { status: "processing" });
      await pollTransactionStatus(hash);
      updateTransaction(hash, { status: "confirmed" });
    } catch (err) {
      addTransaction({
        hash: `err_${Date.now()}`,
        status: "failed",
        method: "LEAVE UNIVERSITY",
        timestamp: Date.now(),
        errorMessage: String(err),
      });
    }
  };

  const handleApproveRole = async (reqId: number) => {
    if (!address) return;
    try {
      const hash = await approveRoleMut.mutateAsync({ requestId: reqId, admin: address });
      addTransaction({
        hash,
        status: "pending",
        method: "APPROVE ROLE",
        timestamp: Date.now(),
        explorerUrl: `https://stellar.expert/explorer/testnet/tx/${hash}`,
      });
      updateTransaction(hash, { status: "processing" });
      await pollTransactionStatus(hash);
      updateTransaction(hash, { status: "confirmed" });
    } catch (err) {
      addTransaction({
        hash: `err_${Date.now()}`,
        status: "failed",
        method: "APPROVE ROLE",
        timestamp: Date.now(),
        errorMessage: String(err),
      });
    }
  };

  const handleDenyRole = async (reqId: number) => {
    if (!address) return;
    try {
      const hash = await denyRoleMut.mutateAsync({ requestId: reqId, admin: address });
      addTransaction({
        hash,
        status: "pending",
        method: "DENY ROLE",
        timestamp: Date.now(),
        explorerUrl: `https://stellar.expert/explorer/testnet/tx/${hash}`,
      });
      updateTransaction(hash, { status: "processing" });
      await pollTransactionStatus(hash);
      updateTransaction(hash, { status: "confirmed" });
    } catch (err) {
      addTransaction({
        hash: `err_${Date.now()}`,
        status: "failed",
        method: "DENY ROLE",
        timestamp: Date.now(),
        errorMessage: String(err),
      });
    }
  };

  return {
    address,
    role,
    selectedRole,
    setSelectedRole,
    copied,
    universities,
    membershipUniId,
    myUniversity,
    pendingReqs,
    myUni,
    pendingRoleReqs,
    uniName,
    setUniName,
    uniLocation,
    setUniLocation,
    uniDesc,
    setUniDesc,
    inviteAddress,
    setInviteAddress,
    handleCopy,
    handleRegisterRole,
    handleCreateUniversity,
    handleRequestJoin,
    handleApprove,
    handleDeny,
    handleInvite,
    handleLeave,
    handleApproveRole,
    handleDenyRole,
    setRolePending: setRoleMut.isPending || requestRoleMut.isPending,
    createUniPending: regUniMut.isPending,
    invitePending: inviteMut.isPending,
    leavePending: leaveMut.isPending,
  };
}
