"use client";

import React from "react";
import { useUniversityProfile } from "@/hooks/useUniversityProfile";
import ProfileAvatar from "@/components/ProfileAvatar";
import {
  User,
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
  const {
    address,
    role,
    selectedRole,
    setSelectedRole,
    copied,
    universities,
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
    setRolePending,
    createUniPending,
    invitePending,
    leavePending,
  } = useUniversityProfile();

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

  const getRoleLabel = (r: number) => {
    const labels: Record<number, string> = { 0: "Guest", 1: "Student", 2: "Merchant", 3: "Club Organizer", 4: "Admin" };
    return labels[r] ?? "Unknown";
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

      {/* Grid: Identity Card (Left) & Controls (Right) */}
      <div className="grid grid-cols-1 lg:grid-cols-3 gap-6">
        
        {/* Left Side: Avatar Card */}
        <div className="lg:col-span-1 flex flex-col gap-6">
          <div className="bg-white rounded-[24px] p-6 flex flex-col items-center text-center shadow-sm">
            <ProfileAvatar address={address} size={96} />
            <span className="text-sm font-bold text-slate-900 mt-4 break-all max-w-full px-2 font-mono">
              {address ? `${address.slice(0, 12)}...${address.slice(-12)}` : "Disconnected"}
            </span>
            <button
              onClick={handleCopy}
              className="mt-2 text-[10px] font-bold text-slate-700 hover:text-accent transition-colors uppercase"
            >
              {copied ? "Copied Public Key!" : "Copy Public Key"}
            </button>

            {/* Current Active Role Badge */}
            <div className={`mt-6 w-full rounded-2xl p-4 border border-slate-100 flex items-center gap-3 ${currentRole.color}`}>
              <div className="w-10 h-10 rounded-xl bg-white flex items-center justify-center border border-current/10 shrink-0">
                <currentRole.icon className="w-5 h-5" />
              </div>
              <div className="text-left min-w-0">
                <span className="text-[10px] font-bold tracking-wider uppercase opacity-75">Active Permission</span>
                <h4 className="text-sm font-bold truncate uppercase">{currentRole.label}</h4>
              </div>
            </div>
          </div>

          {/* Card: Register Role */}
          <div className="bg-white rounded-[24px] p-6 flex flex-col gap-4 shadow-sm">
            <h3 className="text-sm font-bold text-slate-900 uppercase">Request Role Change</h3>
            <p className="text-[10px] text-slate-700 font-semibold leading-relaxed">
              Student roles are self-assigned immediately. Merchant, Club, and Admin roles require verification approval.
            </p>
            <form onSubmit={handleRegisterRole} className="flex flex-col gap-4">
              <div className="flex flex-col gap-2">
                <label className="text-[10px] font-bold text-slate-700 uppercase tracking-wider">Select Role</label>
                <select
                  value={selectedRole}
                  onChange={(e) => setSelectedRole(parseInt(e.target.value))}
                  className="w-full h-11 bg-slate-50 border border-slate-200 rounded-xl px-4 text-xs font-semibold outline-none focus:border-slate-300 focus:ring-1 focus:ring-slate-200/50 transition-all cursor-pointer text-slate-800"
                >
                  <option value={0}>Guest (Viewer)</option>
                  <option value={1}>Student</option>
                  <option value={2}>Merchant (Needs Admin)</option>
                  <option value={3}>Club Organizer (Needs Admin)</option>
                  <option value={4}>University Admin (Needs Admin)</option>
                </select>
              </div>
              <button
                type="submit"
                disabled={setRolePending || Number(role) === selectedRole}
                className="w-full h-11 bg-accent hover:opacity-95 text-white text-xs font-bold uppercase rounded-xl flex items-center justify-center gap-2 active:scale-95 transition-all disabled:opacity-50"
              >
                {setRolePending ? <Loader2 className="w-4 h-4 animate-spin" /> : null}
                {selectedRole <= 1 ? "Update Role" : "Request Approval"}
              </button>
            </form>
          </div>
        </div>

        {/* Right Side: University & Requests Console */}
        <div className="lg:col-span-2 flex flex-col gap-6">
          
          {/* Section: University Association */}
          <div className="bg-white rounded-[24px] p-6 flex flex-col gap-6 shadow-sm">
            <div className="border-b border-slate-100 pb-4">
              <h3 className="text-base font-bold text-slate-900 uppercase">University Hub</h3>
              <p className="text-xs text-slate-700 font-semibold mt-1">
                Associate your identity with an accredited university or register a new campus registry instance.
              </p>
            </div>

            {/* University Details Panel */}
            {myUni ? (
              <div className="bg-slate-50 border border-slate-100 rounded-2xl p-5 flex flex-col md:flex-row justify-between items-start md:items-center gap-4 animate-in fade-in duration-200">
                <div className="flex items-center gap-3">
                  <div className="w-11 h-11 rounded-xl bg-white border border-slate-200 flex items-center justify-center text-slate-700 shrink-0 shadow-sm">
                    <Building className="w-5 h-5" />
                  </div>
                  <div>
                    <span className="text-[9px] font-bold text-emerald-600 bg-emerald-50 border border-emerald-100 rounded px-1.5 py-0.5 uppercase tracking-wide">Joined Member</span>
                    <h4 className="text-sm font-extrabold text-slate-900 mt-1 uppercase">{myUni.name}</h4>
                    <p className="text-[10px] text-slate-500 font-medium font-mono break-all">{myUni.location}</p>
                  </div>
                </div>
                <button
                  onClick={handleLeave}
                  disabled={leavePending}
                  className="h-10 px-5 bg-white border border-slate-200 text-xs font-bold text-red-600 hover:bg-red-50 hover:border-red-100 rounded-xl transition-all active:scale-95 shrink-0 flex items-center gap-1.5 shadow-sm"
                >
                  {leavePending ? <Loader2 className="w-3.5 h-3.5 animate-spin" /> : null}
                  Leave Campus
                </button>
              </div>
            ) : (
              <div className="border border-dashed border-slate-200 rounded-[24px] p-10 text-center flex flex-col items-center justify-center gap-2 bg-slate-50/20">
                <Users className="w-8 h-8 text-slate-300" />
                <span className="font-bold text-slate-700 text-xs uppercase tracking-widest">Unassociated Wallet</span>
                <p className="text-[10px] text-slate-700 font-semibold max-w-sm">
                  You are not registered under any university. Request access below or set up a new registry.
                </p>
              </div>
            )}

            {/* University Registry Registry Forms */}
            {!myUni && (
              <div className="grid grid-cols-1 md:grid-cols-2 gap-6 pt-4 border-t border-slate-100">
                
                {/* Join Form */}
                <div className="flex flex-col gap-4">
                  <h4 className="text-xs font-bold text-slate-900 uppercase">Available Registries</h4>
                  {universities.length === 0 ? (
                    <span className="text-xs font-semibold text-slate-400 italic">No registered universities yet.</span>
                  ) : (
                    <div className="flex flex-col gap-2.5 max-h-[220px] overflow-y-auto">
                      {universities.map((uni) => (
                        <div key={uni.id} className="border border-slate-100 rounded-xl p-3 flex justify-between items-center gap-2 hover:bg-slate-50/50 transition-colors bg-white">
                          <div className="min-w-0">
                            <span className="text-xs font-bold text-slate-900 truncate block uppercase">{uni.name}</span>
                            <span className="text-[9px] text-slate-400 font-semibold font-mono block mt-0.5 truncate">{uni.location}</span>
                          </div>
                          <button
                            onClick={() => handleRequestJoin(uni.id)}
                            className="h-8 px-3 bg-slate-950 hover:bg-slate-800 text-white text-[10px] font-bold uppercase rounded-lg flex items-center gap-1 active:scale-95 transition-all shrink-0"
                          >
                            <UserPlus className="w-3.5 h-3.5" />
                            Join
                          </button>
                        </div>
                      ))}
                    </div>
                  )}
                </div>

                {/* Create registry Form */}
                {role === 4 && (
                  <form onSubmit={handleCreateUniversity} className="flex flex-col gap-3.5 bg-slate-50/50 p-5 rounded-2xl border border-slate-100/50">
                    <h4 className="text-xs font-bold text-slate-900 uppercase">Register New University</h4>
                    <div className="flex flex-col gap-1.5">
                      <label className="text-[9px] font-bold text-slate-700 uppercase">Registry Name</label>
                      <input
                        type="text"
                        required
                        placeholder="e.g. Stanford University"
                        value={uniName}
                        onChange={(e) => setUniName(e.target.value)}
                        className="w-full h-10 bg-white border border-slate-200 rounded-lg px-3 text-xs font-semibold outline-none focus:border-slate-300 focus:ring-1 focus:ring-slate-200/50 transition-all uppercase"
                      />
                    </div>
                    <div className="flex flex-col gap-1.5">
                      <label className="text-[9px] font-bold text-slate-700 uppercase">Location / Realm</label>
                      <input
                        type="text"
                        required
                        placeholder="e.g. Stanford, CA"
                        value={uniLocation}
                        onChange={(e) => setUniLocation(e.target.value)}
                        className="w-full h-10 bg-white border border-slate-200 rounded-lg px-3 text-xs font-semibold outline-none focus:border-slate-300 focus:ring-1 focus:ring-slate-200/50 transition-all uppercase"
                      />
                    </div>
                    <div className="flex flex-col gap-1.5">
                      <label className="text-[9px] font-bold text-slate-700 uppercase">Description</label>
                      <input
                        type="text"
                        required
                        placeholder="e.g. Stanford University Realm"
                        value={uniDesc}
                        onChange={(e) => setUniDesc(e.target.value)}
                        className="w-full h-10 bg-white border border-slate-200 rounded-lg px-3 text-xs font-semibold outline-none focus:border-slate-300 focus:ring-1 focus:ring-slate-200/50 transition-all uppercase"
                      />
                    </div>
                    <button
                      type="submit"
                      disabled={createUniPending}
                      className="h-10 mt-2 bg-accent hover:opacity-95 text-white text-xs font-bold uppercase rounded-xl flex items-center justify-center gap-2 active:scale-95 transition-all disabled:opacity-50"
                    >
                      {createUniPending ? <Loader2 className="w-4 h-4 animate-spin" /> : <PlusCircle className="w-4 h-4" />}
                      Register University
                    </button>
                  </form>
                )}
              </div>
            )}
          </div>

          {/* Admin Management Section: Member invites & Approvals (Only visible to Admin) */}
          {role === 4 && (myUniversity || pendingRoleReqs.length > 0) && (
            <div className="bg-white rounded-[24px] p-6 flex flex-col gap-6 shadow-sm">
              <div className="border-b border-slate-100 pb-4">
                <h3 className="text-base font-bold text-slate-900 uppercase">Admin Console</h3>
                <p className="text-xs text-slate-700 font-semibold mt-1">Manage membership invitations, approve applicant requests, and verify RBAC registrations.</p>
              </div>

              <div className="grid grid-cols-1 md:grid-cols-2 gap-8">
                {/* Left: Invites and Members Requests */}
                {myUniversity && (
                  <div className="flex flex-col gap-4">
                    <h4 className="text-xs font-bold text-slate-900 uppercase">Member Registry</h4>
                    <form onSubmit={handleInvite} className="flex gap-2">
                      <input
                        type="text"
                        required
                        placeholder="Enter applicant G... address"
                        value={inviteAddress}
                        onChange={(e) => setInviteAddress(e.target.value)}
                        className="flex-1 h-10 bg-slate-50 border border-slate-200 rounded-xl px-3 text-xs font-semibold outline-none focus:border-slate-300 focus:ring-1 focus:ring-slate-200/50 transition-all uppercase font-mono"
                      />
                      <button
                        type="submit"
                        disabled={invitePending}
                        className="h-10 px-4 bg-slate-950 hover:bg-slate-800 text-white text-xs font-bold uppercase rounded-xl flex items-center gap-1 active:scale-95 transition-all shrink-0"
                      >
                        {invitePending ? <Loader2 className="w-3.5 h-3.5 animate-spin" /> : <Send className="w-3.5 h-3.5" />}
                        Invite
                      </button>
                    </form>

                    {/* Pending membership requests list */}
                    <div className="flex flex-col gap-2 mt-2">
                      <span className="text-[10px] font-bold text-slate-700 uppercase tracking-wider">Pending Admission Requests ({pendingReqs.length})</span>
                      {pendingReqs.length === 0 ? (
                        <span className="text-xs font-semibold text-slate-400 italic">No pending requests</span>
                      ) : (
                        <div className="flex flex-col gap-2 max-h-[200px] overflow-y-auto">
                          {pendingReqs.map((req) => (
                            <div key={req.id} className="border border-slate-100 rounded-xl p-3 flex justify-between items-center bg-slate-50/50">
                              <span className="text-[10px] font-mono font-bold text-slate-800 truncate mr-2">{req.applicant}</span>
                              <div className="flex gap-1.5 shrink-0">
                                <button
                                  onClick={() => handleApprove(req.id)}
                                  className="w-7 h-7 rounded-lg bg-emerald-50 text-emerald-600 hover:bg-emerald-100 flex items-center justify-center active:scale-95 transition-all"
                                >
                                  <Check className="w-4 h-4" />
                                </button>
                                <button
                                  onClick={() => handleDeny(req.id)}
                                  className="w-7 h-7 rounded-lg bg-red-50 text-red-600 hover:bg-red-100 flex items-center justify-center active:scale-95 transition-all"
                                >
                                  <X className="w-4 h-4" />
                                </button>
                              </div>
                            </div>
                          ))}
                        </div>
                      )}
                    </div>
                  </div>
                )}

                {/* Right: Role requests approvals */}
                <div className="flex flex-col gap-4">
                  <h4 className="text-xs font-bold text-slate-900 uppercase">Pending Role Requests ({pendingRoleReqs.length})</h4>
                  {pendingRoleReqs.length === 0 ? (
                    <span className="text-xs font-semibold text-slate-400 italic">No pending role approvals</span>
                  ) : (
                    <div className="flex flex-col gap-2.5 max-h-[260px] overflow-y-auto">
                      {pendingRoleReqs.map((req) => (
                        <div key={req.id} className="border border-slate-100 rounded-xl p-3 flex flex-col gap-2 bg-slate-50/30">
                          <div className="flex items-center justify-between">
                            <span className="text-[10px] font-mono font-bold text-slate-800 truncate max-w-[120px]">{req.applicant}</span>
                            <span className="text-[9px] font-bold text-purple-700 bg-purple-50 border border-purple-100 px-1.5 py-0.5 rounded uppercase">
                              {getRoleLabel(req.requested_role)}
                            </span>
                          </div>
                          <div className="flex gap-2">
                            <button
                              onClick={() => handleApproveRole(req.id)}
                              className="flex-1 h-8 bg-emerald-50 hover:bg-emerald-100 text-emerald-700 text-[10px] font-bold uppercase rounded-lg active:scale-95 transition-all"
                            >
                              Approve
                            </button>
                            <button
                              onClick={() => handleDenyRole(req.id)}
                              className="flex-1 h-8 bg-red-50 hover:bg-red-100 text-red-700 text-[10px] font-bold uppercase rounded-lg active:scale-95 transition-all"
                            >
                              Deny
                            </button>
                          </div>
                        </div>
                      ))}
                    </div>
                  )}
                </div>
              </div>
            </div>
          )}
        </div>
      </div>
    </div>
  );
}
