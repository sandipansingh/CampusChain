"use client";

import React, { useState } from "react";
import { useQueryClient } from "@tanstack/react-query";
import { useWalletStore } from "@/state/useWalletStore";
import { useCampusUserRole, useSetRoleMutation } from "@/hooks/useCampusToken";
import { useTransactionStore } from "@/state/useTransactionStore";
import { pollTransactionStatus } from "@/services/contracts";
import { logger } from "@/services/logger";
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
import ProfileAvatar from "@/components/ProfileAvatar";
import {
  User,
  Shield,
  CheckCircle,
  Loader2,
  GraduationCap,
  Store,
  Calendar,
  Building,
  PlusCircle,
  Users,
  Check,
  X,
  UserPlus,
  Send,
} from "lucide-react";

export default function ProfilePage() {
  const { address } = useWalletStore();
  const { data: role } = useCampusUserRole(address);
  const setRoleMut = useSetRoleMutation();
  const queryClient = useQueryClient();

  const addTransaction = useTransactionStore((state) => state.addTransaction);
  const updateTransaction = useTransactionStore((state) => state.updateTransaction);

  const [selectedRole, setSelectedRole] = useState<number>(1);
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

  const getRoleInfo = (roleNum?: number) => {
    const roles: Record<number, { label: string; desc: string; icon: React.ElementType; color: string }> = {
      0: { label: "Guest", desc: "Connect wallet to participate.", icon: User, color: "text-slate-800 bg-slate-50" },
      1: { label: "Student", desc: "Send P2P transfers, buy marketplace goods, purchase event tickets.", icon: GraduationCap, color: "text-emerald-700 bg-emerald-50" },
      2: { label: "Merchant", desc: "Accept payments from students, settle escrows.", icon: Store, color: "text-blue-700 bg-blue-50" },
      3: { label: "Club Organizer", desc: "Mint event passes, sell tickets on-chain.", icon: Calendar, color: "text-purple-700 bg-purple-50" },
      4: { label: "University Admin", desc: "Register universities, manage members, distribute rewards.", icon: Building, color: "text-rose-700 bg-rose-50" },
    };
    return roles[roleNum ?? 0];
  };

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
    const actionName = "UPDATE PROFILE ROLE";
    try {
      const hash = await setRoleMut.mutateAsync({ user: address, role: selectedRole, caller: address });
      addTransaction({ hash, status: "pending", method: actionName, timestamp: Date.now(), explorerUrl: `https://stellar.expert/explorer/testnet/tx/${hash}` });
      updateTransaction(hash, { status: "processing" });
      await pollTransactionStatus(hash);
      updateTransaction(hash, { status: "confirmed" });
      queryClient.invalidateQueries({ queryKey: ["campus-role", address] });
      logger.trackTransaction({ hash, method: actionName, status: "confirmed", durationMs: Date.now() - startTime });
    } catch (err) {
      const errMsg = err instanceof Error ? err.message : "Role registration failed";
      addTransaction({ hash: `err_${Date.now()}`, status: "failed", method: actionName, timestamp: Date.now(), errorMessage: errMsg });
      logger.error("Role update failed", err);
    }
  };

  const handleCreateUniversity = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!address || !uniName || !uniLocation) return;
    try {
      const hash = await regUniMut.mutateAsync({ admin: address, name: uniName, location: uniLocation, description: uniDesc });
      addTransaction({ hash, status: "pending", method: "REGISTER UNIVERSITY", timestamp: Date.now(), explorerUrl: `https://stellar.expert/explorer/testnet/tx/${hash}` });
      updateTransaction(hash, { status: "processing" });
      await pollTransactionStatus(hash);
      updateTransaction(hash, { status: "confirmed" });
      setUniName(""); setUniLocation(""); setUniDesc("");
    } catch (err) {
      addTransaction({ hash: `err_${Date.now()}`, status: "failed", method: "REGISTER UNIVERSITY", timestamp: Date.now(), errorMessage: String(err) });
    }
  };

  const handleRequestJoin = async (uniId: number) => {
    if (!address) return;
    try {
      const hash = await reqJoinMut.mutateAsync({ universityId: uniId, applicant: address });
      addTransaction({ hash, status: "pending", method: "REQUEST JOIN", timestamp: Date.now(), explorerUrl: `https://stellar.expert/explorer/testnet/tx/${hash}` });
      updateTransaction(hash, { status: "processing" });
      await pollTransactionStatus(hash);
      updateTransaction(hash, { status: "confirmed" });
    } catch (err) {
      addTransaction({ hash: `err_${Date.now()}`, status: "failed", method: "REQUEST JOIN", timestamp: Date.now(), errorMessage: String(err) });
    }
  };

  const handleApprove = async (reqId: number) => {
    if (!address) return;
    try {
      const hash = await approveMut.mutateAsync({ requestId: reqId, admin: address });
      addTransaction({ hash, status: "pending", method: "APPROVE MEMBER", timestamp: Date.now(), explorerUrl: `https://stellar.expert/explorer/testnet/tx/${hash}` });
      updateTransaction(hash, { status: "processing" });
      await pollTransactionStatus(hash);
      updateTransaction(hash, { status: "confirmed" });
    } catch (err) {
      addTransaction({ hash: `err_${Date.now()}`, status: "failed", method: "APPROVE MEMBER", timestamp: Date.now(), errorMessage: String(err) });
    }
  };

  const handleDeny = async (reqId: number) => {
    if (!address) return;
    try {
      const hash = await denyMut.mutateAsync({ requestId: reqId, admin: address });
      addTransaction({ hash, status: "pending", method: "DENY MEMBER", timestamp: Date.now(), explorerUrl: `https://stellar.expert/explorer/testnet/tx/${hash}` });
      updateTransaction(hash, { status: "processing" });
      await pollTransactionStatus(hash);
      updateTransaction(hash, { status: "confirmed" });
    } catch (err) {
      addTransaction({ hash: `err_${Date.now()}`, status: "failed", method: "DENY MEMBER", timestamp: Date.now(), errorMessage: String(err) });
    }
  };

  const handleInvite = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!address || !myUniversity || !inviteAddress) return;
    try {
      const hash = await inviteMut.mutateAsync({ universityId: myUniversity.id, invitee: inviteAddress, admin: address });
      addTransaction({ hash, status: "pending", method: "INVITE MEMBER", timestamp: Date.now(), explorerUrl: `https://stellar.expert/explorer/testnet/tx/${hash}` });
      updateTransaction(hash, { status: "processing" });
      await pollTransactionStatus(hash);
      updateTransaction(hash, { status: "confirmed" });
      setInviteAddress("");
    } catch (err) {
      addTransaction({ hash: `err_${Date.now()}`, status: "failed", method: "INVITE MEMBER", timestamp: Date.now(), errorMessage: String(err) });
    }
  };

  const handleLeave = async () => {
    if (!address) return;
    try {
      const hash = await leaveMut.mutateAsync({ member: address });
      addTransaction({ hash, status: "pending", method: "LEAVE UNIVERSITY", timestamp: Date.now(), explorerUrl: `https://stellar.expert/explorer/testnet/tx/${hash}` });
      updateTransaction(hash, { status: "processing" });
      await pollTransactionStatus(hash);
      updateTransaction(hash, { status: "confirmed" });
    } catch (err) {
      addTransaction({ hash: `err_${Date.now()}`, status: "failed", method: "LEAVE UNIVERSITY", timestamp: Date.now(), errorMessage: String(err) });
    }
  };

  const currentRole = getRoleInfo(role);

  return (
    <div className="flex flex-col gap-6 w-full max-w-7xl mx-auto">
      <div className="flex flex-col md:flex-row md:items-center justify-between gap-4">
        <div>
          <h1 className="text-2xl font-semibold tracking-tight text-slate-900 uppercase">My Profile</h1>
          <p className="text-slate-700 text-xs font-semibold mt-1">Manage your on-chain wallet identity, register roles, and check smart contract permissions.</p>
        </div>
      </div>

      <div className="grid grid-cols-1 lg:grid-cols-3 gap-6">
        <div className="lg:col-span-1 flex flex-col gap-6">
          <div className="bg-white rounded-[24px] p-6 flex flex-col items-center text-center gap-6 shadow-sm">
            <div className="relative">
              <ProfileAvatar address={address} size={96} />
              <div className="absolute -bottom-2 -right-2 w-8 h-8 rounded-full bg-slate-900 border-2 border-white flex items-center justify-center text-white">
                <Shield className="w-4 h-4 text-accent" />
              </div>
            </div>
            <div className="flex flex-col gap-1.5 w-full">
              <span className="font-semibold text-slate-900 truncate px-4">{address ? `${address.slice(0, 8)}...${address.slice(-8)}` : "Guest Wallet"}</span>
              <span className={`text-[10px] font-bold uppercase tracking-wider px-2 py-0.5 rounded self-center ${currentRole.color}`}>{currentRole.label}</span>
            </div>
            <p className="text-xs text-slate-800 font-semibold leading-relaxed px-2">{currentRole.desc}</p>
            {address && (
              <button onClick={handleCopy} className="h-10 px-4 w-full bg-slate-50 text-xs font-bold text-slate-600 rounded-xl flex items-center justify-center gap-2 active:scale-95 transition-all shadow-sm">
                {copied ? <><CheckCircle className="w-4 h-4 text-emerald-600" />Copied Address</> : "Copy Wallet Address"}
              </button>
            )}
          </div>
        </div>

        <div className="lg:col-span-2 bg-white rounded-[24px] p-6 flex flex-col gap-6 shadow-sm">
          <div className="border-b border-slate-100 pb-4">
            <h3 className="text-base font-bold text-slate-900 uppercase">On-Chain Identity Registrar</h3>
            <p className="text-xs text-slate-700 font-semibold mt-1">Soroban smart contracts secure permissions using Role-Based Access Control (RBAC).</p>
          </div>
          <form onSubmit={handleRegisterRole} className="flex flex-col gap-6">
            <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
              {[ { id: 1, name: "Student", icon: GraduationCap, desc: "Lock escrows, buy ticket passes, transfer tokens" }, { id: 2, name: "Merchant", icon: Store, desc: "Accept peer payments and settle locked escrows" }, { id: 3, name: "Club Organizer", icon: Calendar, desc: "Mint ticket passes and run door authentication" }, { id: 4, name: "University Admin", icon: Building, desc: "Register universities, distribute scholarship rewards" } ].map((r) => {
                const Icon = r.icon;
                const isSelected = selectedRole === r.id;
                return (
                  <div key={r.id} onClick={() => setSelectedRole(r.id)} className={`p-4 rounded-xl cursor-pointer flex gap-4 transition-all ${isSelected ? "bg-slate-100 text-slate-950 font-bold" : "bg-slate-50/50 hover:bg-slate-50 text-slate-700"}`}>
                    <div className={`w-10 h-10 rounded-xl flex items-center justify-center shrink-0 ${isSelected ? "bg-accent text-white" : "bg-slate-100 text-slate-700"}`}><Icon className="w-5 h-5" /></div>
                    <div className="flex flex-col"><span className="text-xs font-bold uppercase">{r.name}</span><span className="text-[10px] text-slate-700 font-semibold mt-1 leading-normal">{r.desc}</span></div>
                  </div>
                );
              })}
            </div>
            <button type="submit" disabled={setRoleMut.isPending} className="h-12 w-full bg-accent hover:opacity-95 text-white text-xs font-bold uppercase rounded-xl flex items-center justify-center gap-2 active:scale-95 transition-all disabled:opacity-50 disabled:pointer-events-none mt-2">
              {setRoleMut.isPending ? <><Loader2 className="w-4 h-4 animate-spin" />Minting Role Transaction...</> : "Update On-Chain Role Permissions"}
            </button>
          </form>
        </div>
      </div>

      {/* University Section */}
      <div className="bg-white rounded-[24px] p-6 flex flex-col gap-6 shadow-sm">
        {role === 4 ? (
          <div className="flex flex-col gap-6">
            <div className="border-b border-slate-100 pb-4">
              <h3 className="text-base font-bold text-slate-900 uppercase flex items-center gap-2"><Building className="w-5 h-5 text-slate-700" />University Administration</h3>
              <p className="text-xs text-slate-700 font-semibold mt-1">Register your university on-chain and manage members.</p>
            </div>

            {!myUniversity ? (
              <form onSubmit={handleCreateUniversity} className="flex flex-col gap-4 max-w-xl">
                <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                  <div className="flex flex-col gap-2">
                    <label className="text-[10px] font-semibold text-slate-700 uppercase tracking-wider">University Name</label>
                    <input type="text" required placeholder="e.g., Stellar Tech University" value={uniName} onChange={(e) => setUniName(e.target.value)} className="h-11 bg-slate-50 border border-slate-200 rounded-xl px-4 text-xs font-semibold outline-none focus:border-slate-350 transition-all" />
                  </div>
                  <div className="flex flex-col gap-2">
                    <label className="text-[10px] font-semibold text-slate-700 uppercase tracking-wider">Location</label>
                    <input type="text" required placeholder="e.g., San Francisco, CA" value={uniLocation} onChange={(e) => setUniLocation(e.target.value)} className="h-11 bg-slate-50 border border-slate-200 rounded-xl px-4 text-xs font-semibold outline-none focus:border-slate-350 transition-all" />
                  </div>
                </div>
                <div className="flex flex-col gap-2">
                  <label className="text-[10px] font-semibold text-slate-700 uppercase tracking-wider">Description</label>
                  <input type="text" placeholder="Brief details about your campus economy..." value={uniDesc} onChange={(e) => setUniDesc(e.target.value)} className="h-11 bg-slate-50 border border-slate-200 rounded-xl px-4 text-xs font-semibold outline-none focus:border-slate-350 transition-all" />
                </div>
                <button type="submit" disabled={regUniMut.isPending} className="h-11 px-6 bg-accent hover:opacity-95 text-white text-xs font-bold uppercase rounded-xl flex items-center justify-center gap-2 active:scale-95 transition-all self-start">
                  {regUniMut.isPending ? <><Loader2 className="w-4 h-4 animate-spin" />Registering...</> : <><PlusCircle className="w-4 h-4" />Register University On-Chain</>}
                </button>
              </form>
            ) : (
              <div className="grid grid-cols-1 lg:grid-cols-2 gap-8">
                <div className="bg-slate-50/50 p-6 rounded-[20px] flex flex-col justify-between min-h-[160px]">
                  <div className="flex flex-col gap-2">
                    <span className="text-[9px] font-bold text-accent uppercase tracking-wider">Active On-Chain Portal</span>
                    <h4 className="text-lg font-bold text-slate-900 leading-none">{myUniversity.name}</h4>
                    <span className="text-xs font-semibold text-slate-700">Location: {myUniversity.location}</span>
                    <p className="text-xs text-slate-700 font-semibold mt-2 leading-relaxed">{myUniversity.description || "No description."}</p>
                    <span className="text-[10px] font-bold text-slate-500 mt-1">{myUniversity.member_count} members</span>
                  </div>
                </div>
                <div className="flex flex-col gap-4">
                  <div className="flex flex-col gap-2">
                    <span className="text-[10px] font-bold text-slate-700 uppercase tracking-wider flex items-center gap-1.5"><Users className="w-4 h-4" />Invite Member</span>
                    <form onSubmit={handleInvite} className="flex gap-2">
                      <input type="text" required placeholder="Stellar address (G...)" value={inviteAddress} onChange={(e) => setInviteAddress(e.target.value)} className="flex-1 h-10 bg-slate-50 border border-slate-200 rounded-xl px-4 text-xs font-semibold outline-none" />
                      <button type="submit" disabled={inviteMut.isPending} className="h-10 px-4 bg-accent text-white text-xs font-bold rounded-xl flex items-center gap-1.5">
                        {inviteMut.isPending ? <Loader2 className="w-3 h-3 animate-spin" /> : <Send className="w-3 h-3" />}Invite
                      </button>
                    </form>
                  </div>
                  <span className="text-[10px] font-bold text-slate-700 uppercase tracking-wider flex items-center gap-1.5"><Users className="w-4 h-4" />Pending Requests ({pendingReqs.length})</span>
                  <div className="flex flex-col gap-2 max-h-60 overflow-y-auto pr-2">
                    {pendingReqs.length === 0 ? (
                      <div className="text-xs font-semibold text-slate-700 py-6 text-center border border-dashed border-slate-200 rounded-xl">No pending requests.</div>
                    ) : pendingReqs.map((req) => (
                      <div key={req.id} className="bg-slate-50 p-4 rounded-xl flex items-center justify-between gap-4">
                        <span className="text-xs font-mono font-semibold text-slate-900 truncate flex-1">{req.applicant.slice(0, 12)}...{req.applicant.slice(-8)}</span>
                        <div className="flex items-center gap-1.5 shrink-0">
                          <button onClick={() => handleApprove(req.id)} className="w-7 h-7 rounded-lg bg-emerald-50 hover:bg-emerald-100 flex items-center justify-center text-emerald-600"><Check className="w-4 h-4" /></button>
                          <button onClick={() => handleDeny(req.id)} className="w-7 h-7 rounded-lg bg-red-50 hover:bg-red-100 flex items-center justify-center text-red-600"><X className="w-4 h-4" /></button>
                        </div>
                      </div>
                    ))}
                  </div>
                </div>
              </div>
            )}
          </div>
        ) : (
          <div className="flex flex-col gap-4">
            <div className="border-b border-slate-100 pb-4">
              <h3 className="text-base font-bold text-slate-900 uppercase">University Association</h3>
              <p className="text-xs text-slate-700 font-semibold mt-1">Join a university directory to participate in the campus economy.</p>
            </div>
            {myUni ? (
              <div className="bg-emerald-50/20 p-6 rounded-[20px] flex flex-col md:flex-row items-center justify-between gap-6">
                <div className="flex flex-col gap-1.5">
                  <span className="text-[9px] font-bold text-emerald-600 bg-emerald-50 border border-emerald-100 px-2 py-0.5 rounded-full self-start uppercase">Verified On-Chain Member</span>
                  <h4 className="text-lg font-bold text-slate-900 leading-none mt-1">{myUni.name}</h4>
                  <span className="text-xs font-semibold text-slate-700">Location: {myUni.location}</span>
                </div>
                <button onClick={handleLeave} disabled={leaveMut.isPending} className="h-10 px-5 bg-white border border-red-100 text-red-600 font-semibold text-xs rounded-xl hover:bg-red-50 transition-colors">
                  {leaveMut.isPending ? <Loader2 className="w-3 h-3 animate-spin" /> : "Leave University"}
                </button>
              </div>
            ) : (
              <div className="flex flex-col gap-4">
                <span className="text-xs font-bold text-slate-700 uppercase tracking-wider">Available Universities On-Chain</span>
                {universities.length === 0 ? (
                  <div className="border border-dashed border-slate-200 rounded-xl p-8 text-center text-xs font-semibold text-slate-700">No universities registered yet. A University Admin must create one first.</div>
                ) : (
                  <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-4">
                    {universities.map((uni) => (
                      <div key={uni.id} className="bg-slate-50/50 p-4 rounded-xl flex flex-col justify-between gap-4">
                        <div className="flex flex-col gap-1">
                          <h5 className="font-bold text-xs text-slate-900">{uni.name}</h5>
                          <span className="text-[10px] text-slate-700 font-semibold">{uni.location}</span>
                          <span className="text-[9px] text-slate-500">{uni.member_count} members</span>
                          <p className="text-[10px] text-slate-700 font-semibold mt-2 leading-relaxed">{uni.description || "No description."}</p>
                        </div>
                        <button onClick={() => handleRequestJoin(uni.id)} disabled={reqJoinMut.isPending} className="h-9 w-full bg-slate-900 text-white text-xs font-semibold rounded-lg flex items-center justify-center gap-1.5 hover:bg-slate-800 transition-colors">
                          {reqJoinMut.isPending ? <Loader2 className="w-3 h-3 animate-spin" /> : <><UserPlus className="w-3.5 h-3.5" />Request to Join</>}
                        </button>
                      </div>
                    ))}
                  </div>
                )}
              </div>
            )}
          </div>
        )}
      </div>
    </div>
  );
}
