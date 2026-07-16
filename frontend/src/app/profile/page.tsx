"use client";

import React, { useState, useEffect } from "react";
import { useWalletStore } from "@/state/useWalletStore";
import { useCampusUserRole, useSetRoleMutation } from "@/hooks/useCampusToken";
import { useTransactionStore } from "@/state/useTransactionStore";
import { pollTransactionStatus } from "@/services/contracts";
import { logger } from "@/services/logger";
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
  UserPlus
} from "lucide-react";

interface University {
  id: string;
  name: string;
  location: string;
  adminAddress: string;
  desc: string;
}

interface JoinRequest {
  id: string;
  universityId: string;
  applicantAddress: string;
  applicantRole: string;
  status: "pending" | "approved" | "denied";
}

export default function ProfilePage() {
  const { address } = useWalletStore();
  const { data: role } = useCampusUserRole(address);
  const setRoleMut = useSetRoleMutation();

  const addTransaction = useTransactionStore((state) => state.addTransaction);
  const updateTransaction = useTransactionStore((state) => state.updateTransaction);

  const [selectedRole, setSelectedRole] = useState<number>(1);
  const [copied, setCopied] = useState(false);

  // University Registry State
  const [universities, setUniversities] = useState<University[]>([]);
  const [requests, setRequests] = useState<JoinRequest[]>([]);
  const [memberOf, setMemberOf] = useState<Record<string, string>>({}); // address -> universityId

  // Form input states
  const [uniName, setUniName] = useState("");
  const [uniLocation, setUniLocation] = useState("");
  const [uniDesc, setUniDesc] = useState("");

  // Load state from LocalStorage on mount
  useEffect(() => {
    const savedUnis = localStorage.getItem("campuschain_universities");
    const savedRequests = localStorage.getItem("campuschain_requests");
    const savedMembers = localStorage.getItem("campuschain_member_of");

    if (savedUnis) setUniversities(JSON.parse(savedUnis));
    if (savedRequests) setRequests(JSON.parse(savedRequests));
    if (savedMembers) setMemberOf(JSON.parse(savedMembers));
  }, []);

  const saveToLocalStorage = (unis: University[], reqs: JoinRequest[], members: Record<string, string>) => {
    localStorage.setItem("campuschain_universities", JSON.stringify(unis));
    localStorage.setItem("campuschain_requests", JSON.stringify(reqs));
    localStorage.setItem("campuschain_member_of", JSON.stringify(members));

    setUniversities(unis);
    setRequests(reqs);
    setMemberOf(members);
  };

  const getRoleInfo = (roleNum?: number) => {
    const roles = {
      0: {
        label: "Guest Member",
        desc: "Basic access to view telemetry. Connect/activate wallet to participate in the economy.",
        icon: User,
        color: "text-slate-800 bg-slate-50",
      },
      1: {
        label: "Student",
        desc: "Send P2P transfers, buy marketplace goods, purchase club event ticket passes, and receive merit rewards.",
        icon: GraduationCap,
        color: "text-emerald-700 bg-emerald-50",
      },
      2: {
        label: "Merchant",
        desc: "Accept instant payments from students, receive settlements, and settle smart contract escrows.",
        icon: Store,
        color: "text-blue-700 bg-blue-50",
      },
      3: {
        label: "Club Organizer",
        desc: "Mint tokenized club event passes, sell tickets directly on-chain, and manage doors via cryptographic signatures.",
        icon: Calendar,
        color: "text-purple-700 bg-purple-50",
      },
      4: {
        label: "University Admin",
        desc: "Super-user dashboard control. Authorize campus merchants, distribute merit scholarships, and modify network constants.",
        icon: Building,
        color: "text-rose-700 bg-rose-50",
      },
    };
    return roles[(roleNum as 0 | 1 | 2 | 3 | 4) || 0];
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
      const hash = await setRoleMut.mutateAsync({
        user: address,
        role: selectedRole,
        caller: address,
      });

      addTransaction({
        hash,
        status: "pending",
        method: actionName,
        timestamp: Date.now(),
        explorerUrl: `https://stellar.expert/explorer/testnet/tx/${hash}`,
      });
      logger.trackTransaction({ hash, method: actionName, status: "pending" });

      updateTransaction(hash, { status: "processing" });
      logger.trackTransaction({ hash, method: actionName, status: "processing" });

      await pollTransactionStatus(hash);
      updateTransaction(hash, { status: "confirmed" });
      logger.trackTransaction({
        hash,
        method: actionName,
        status: "confirmed",
        durationMs: Date.now() - startTime,
      });
    } catch (err) {
      const errMsg = err instanceof Error ? err.message : "Role registration failed";
      const errHash = `err_${Date.now()}`;
      addTransaction({
        hash: errHash,
        status: "failed",
        method: actionName,
        timestamp: Date.now(),
        errorMessage: errMsg,
      });
      logger.error("Role update failed", err);
    }
  };

  // University Admin: Create University Profile
  const handleCreateUniversity = (e: React.FormEvent) => {
    e.preventDefault();
    if (!address || !uniName || !uniLocation) return;

    const newUni: University = {
      id: `uni_${Date.now()}`,
      name: uniName,
      location: uniLocation,
      adminAddress: address,
      desc: uniDesc,
    };

    const updatedUnis = [...universities, newUni];
    saveToLocalStorage(updatedUnis, requests, memberOf);

    setUniName("");
    setUniLocation("");
    setUniDesc("");
  };

  // User: Submit Join Request
  const handleSendJoinRequest = (uniId: string) => {
    if (!address) return;

    // Check if request already exists
    const hasRequest = requests.some(r => r.applicantAddress === address && r.universityId === uniId);
    if (hasRequest) return;

    const newRequest: JoinRequest = {
      id: `req_${Date.now()}`,
      universityId: uniId,
      applicantAddress: address,
      applicantRole: getRoleLabel(role),
      status: "pending",
    };

    const updatedRequests = [...requests, newRequest];
    saveToLocalStorage(universities, updatedRequests, memberOf);
  };

  // Admin: Accept request
  const handleAcceptRequest = (reqId: string, applicant: string, uniId: string) => {
    const updatedRequests = requests.map(r => r.id === reqId ? { ...r, status: "approved" as const } : r);
    const updatedMembers = { ...memberOf, [applicant]: uniId };
    saveToLocalStorage(universities, updatedRequests, updatedMembers);
  };

  // Admin: Deny request
  const handleDenyRequest = (reqId: string) => {
    const updatedRequests = requests.map(r => r.id === reqId ? { ...r, status: "denied" as const } : r);
    saveToLocalStorage(universities, updatedRequests, memberOf);
  };

  // User: Cancel request or Leave
  const handleLeaveUniversity = () => {
    if (!address) return;
    const updatedMembers = { ...memberOf };
    delete updatedMembers[address];

    // Mark requests as denied or clean them
    const updatedRequests = requests.filter(r => r.applicantAddress !== address);
    saveToLocalStorage(universities, updatedRequests, updatedMembers);
  };

  const currentRole = getRoleInfo(role);

  // Check if current user owns a university
  const myUniversity = universities.find(u => u.adminAddress === address);

  // Check if current user is associated with any university
  const myAssociatedUniId = address ? memberOf[address] : null;
  const myAssociatedUni = universities.find(u => u.id === myAssociatedUniId);

  // Check if user has a pending request
  const myPendingRequest = requests.find(r => r.applicantAddress === address && r.status === "pending");
  const myPendingUni = myPendingRequest ? universities.find(u => u.id === myPendingRequest.universityId) : null;

  function getRoleLabel(roleId?: number) {
    if (roleId === 1) return "Student";
    if (roleId === 2) return "Merchant";
    if (roleId === 3) return "Club Organizer";
    if (roleId === 4) return "Admin";
    return "Member";
  }

  return (
    <div className="flex flex-col gap-6 w-full max-w-7xl mx-auto">
      {/* Title */}
      <div className="flex flex-col md:flex-row md:items-center justify-between gap-4">
        <div>
          <h1 className="text-2xl font-semibold tracking-tight text-slate-900 uppercase">
            My Profile
          </h1>
          <p className="text-slate-700 text-xs font-semibold mt-1">
            Manage your on-chain wallet identity, register roles, and check smart contract permissions.
          </p>
        </div>
      </div>

      {/* Grid Layout - Profile Summary & Registrar */}
      <div className="grid grid-cols-1 lg:grid-cols-3 gap-6">
        
        {/* Left Side: Profile Summary Card - Flat borderless design */}
        <div className="lg:col-span-1 flex flex-col gap-6">
          <div className="bg-white rounded-[24px] p-6 flex flex-col items-center text-center gap-6 shadow-sm">
            {/* Avatar block */}
            <div className="relative">
              <ProfileAvatar address={address} size={96} />
              <div className="absolute -bottom-2 -right-2 w-8 h-8 rounded-full bg-slate-900 border-2 border-white flex items-center justify-center text-white">
                <Shield className="w-4 h-4 text-accent" />
              </div>
            </div>

            <div className="flex flex-col gap-1.5 w-full">
              <span className="font-semibold text-slate-900 truncate px-4">
                {address ? `${address.slice(0, 8)}...${address.slice(-8)}` : "Guest Wallet"}
              </span>
              <span className={`text-[10px] font-bold uppercase tracking-wider px-2 py-0.5 rounded self-center ${currentRole.color}`}>
                {currentRole.label}
              </span>
            </div>

            <p className="text-xs text-slate-800 font-semibold leading-relaxed px-2">
              {currentRole.desc}
            </p>

            {address && (
              <button
                onClick={handleCopy}
                className="h-10 px-4 w-full bg-slate-50 text-xs font-bold text-slate-600 rounded-xl flex items-center justify-center gap-2 active:scale-95 transition-all shadow-sm"
              >
                {copied ? (
                  <>
                    <CheckCircle className="w-4 h-4 text-emerald-600" />
                    Copied Address
                  </>
                ) : (
                  "Copy Wallet Address"
                )}
              </button>
            )}
          </div>
        </div>

        {/* Right Side: Role Assignment Form - Flat borderless design */}
        <div className="lg:col-span-2 bg-white rounded-[24px] p-6 flex flex-col gap-6 shadow-sm">
          <div className="border-b border-slate-100 pb-4">
            <h3 className="text-base font-bold text-slate-900 uppercase">
              On-Chain Identity Registrar
            </h3>
            <p className="text-xs text-slate-700 font-semibold mt-1">
              Soroban smart contracts secure permissions using Role-Based Access Control (RBAC). Select a role to update your ledger permissions.
            </p>
          </div>

          <form onSubmit={handleRegisterRole} className="flex flex-col gap-6">
            <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
              {[
                { id: 1, name: "Student", icon: GraduationCap, desc: "Lock escrows, buy ticket passes, transfer tokens" },
                { id: 2, name: "Merchant", icon: Store, desc: "Accept peer payments and settle locked escrows" },
                { id: 3, name: "Club Organizer", icon: Calendar, desc: "Mint ticket passes and run door authentication" },
                { id: 4, name: "University Admin", icon: Building, desc: "Register universities, distribute scholarship rewards" },
              ].map((r) => {
                const Icon = r.icon;
                const isSelected = selectedRole === r.id;
                return (
                  <div
                    key={r.id}
                    onClick={() => setSelectedRole(r.id)}
                    className={`p-4 rounded-xl cursor-pointer flex gap-4 transition-all ${
                      isSelected
                        ? "bg-slate-100 text-slate-950 font-bold"
                        : "bg-slate-50/50 hover:bg-slate-50 text-slate-700"
                    }`}
                  >
                    <div className={`w-10 h-10 rounded-xl flex items-center justify-center shrink-0 ${
                      isSelected ? "bg-accent text-white" : "bg-slate-100 text-slate-700"
                    }`}>
                      <Icon className="w-5 h-5" />
                    </div>
                    <div className="flex flex-col">
                      <span className="text-xs font-bold uppercase">{r.name}</span>
                      <span className="text-[10px] text-slate-700 font-semibold mt-1 leading-normal">{r.desc}</span>
                    </div>
                  </div>
                );
              })}
            </div>

            <button
              type="submit"
              disabled={setRoleMut.isPending}
              className="h-12 w-full bg-accent hover:opacity-95 text-white text-xs font-bold uppercase rounded-xl flex items-center justify-center gap-2 active:scale-95 transition-all disabled:opacity-50 disabled:pointer-events-none mt-2"
            >
              {setRoleMut.isPending ? (
                <>
                  <Loader2 className="w-4 h-4 animate-spin" />
                  Minting Role Transaction...
                </>
              ) : (
                "Update On-Chain Role Permissions"
              )}
            </button>
          </form>
        </div>
      </div>

      {/* Section: University Association Console (BORDERLESS FLAT CARD) */}
      <div className="bg-white rounded-[24px] p-6 flex flex-col gap-6 shadow-sm">
        
        {/* Admin Flow */}
        {role === 4 ? (
          <div className="flex flex-col gap-6">
            <div className="border-b border-slate-100 pb-4">
              <h3 className="text-base font-bold text-slate-900 uppercase flex items-center gap-2">
                <Building className="w-5 h-5 text-slate-700" />
                University Directory Administration
              </h3>
              <p className="text-xs text-slate-700 font-semibold mt-1">
                Establish a new university directory card or manage incoming member requests.
              </p>
            </div>

            {!myUniversity ? (
              /* Create University Form */
              <form onSubmit={handleCreateUniversity} className="flex flex-col gap-4 max-w-xl">
                <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                  <div className="flex flex-col gap-2">
                    <label className="text-[10px] font-semibold text-slate-700 uppercase tracking-wider">
                      University Name
                    </label>
                    <input
                      type="text"
                      required
                      placeholder="e.g., Stellar Tech University"
                      value={uniName}
                      onChange={(e) => setUniName(e.target.value)}
                      className="h-11 bg-slate-50 border border-slate-200 rounded-xl px-4 text-xs font-semibold outline-none focus:border-slate-350 transition-all"
                    />
                  </div>
                  <div className="flex flex-col gap-2">
                    <label className="text-[10px] font-semibold text-slate-700 uppercase tracking-wider">
                      Location / Campus
                    </label>
                    <input
                      type="text"
                      required
                      placeholder="e.g., San Francisco, CA"
                      value={uniLocation}
                      onChange={(e) => setUniLocation(e.target.value)}
                      className="h-11 bg-slate-50 border border-slate-200 rounded-xl px-4 text-xs font-semibold outline-none focus:border-slate-350 transition-all"
                    />
                  </div>
                </div>

                <div className="flex flex-col gap-2">
                  <label className="text-[10px] font-semibold text-slate-700 uppercase tracking-wider">
                    Short Description
                  </label>
                  <input
                    type="text"
                    placeholder="Brief details about your campus economy..."
                    value={uniDesc}
                    onChange={(e) => setUniDesc(e.target.value)}
                    className="h-11 bg-slate-50 border border-slate-200 rounded-xl px-4 text-xs font-semibold outline-none focus:border-slate-350 transition-all"
                  />
                </div>

                <button
                  type="submit"
                  className="h-11 px-6 bg-accent hover:opacity-95 text-white text-xs font-bold uppercase rounded-xl flex items-center justify-center gap-2 active:scale-95 transition-all self-start"
                >
                  <PlusCircle className="w-4 h-4" />
                  Register University Directory
                </button>
              </form>
            ) : (
              /* Manage University Console */
              <div className="grid grid-cols-1 lg:grid-cols-2 gap-8">
                {/* University profile card */}
                <div className="bg-slate-50/50 p-6 rounded-[20px] flex flex-col justify-between min-h-[160px]">
                  <div className="flex flex-col gap-2">
                    <span className="text-[9px] font-bold text-accent uppercase tracking-wider">
                      Active Portal
                    </span>
                    <h4 className="text-lg font-bold text-slate-900 leading-none">
                      {myUniversity.name}
                    </h4>
                    <span className="text-xs font-semibold text-slate-700">
                      Campus: {myUniversity.location}
                    </span>
                    <p className="text-xs text-slate-700 font-semibold mt-2 leading-relaxed">
                      {myUniversity.desc || "No description provided."}
                    </p>
                  </div>
                </div>

                {/* Join Requests */}
                <div className="flex flex-col gap-4">
                  <span className="text-[10px] font-bold text-slate-700 uppercase tracking-wider flex items-center gap-1.5">
                    <Users className="w-4 h-4" />
                    Incoming Join Requests ({requests.filter(r => r.universityId === myUniversity.id && r.status === "pending").length})
                  </span>

                  <div className="flex flex-col gap-2 max-h-60 overflow-y-auto pr-2">
                    {requests.filter(r => r.universityId === myUniversity.id && r.status === "pending").length === 0 ? (
                      <div className="text-xs font-semibold text-slate-700 py-6 text-center border border-dashed border-slate-200 rounded-xl">
                        No pending join requests at this time.
                      </div>
                    ) : (
                      requests.filter(r => r.universityId === myUniversity.id && r.status === "pending").map((req) => (
                        <div
                          key={req.id}
                          className="bg-slate-50 p-4 rounded-xl flex items-center justify-between gap-4"
                        >
                          <div className="flex flex-col min-w-0">
                            <span className="text-xs font-mono font-semibold text-slate-900 truncate">
                              {req.applicantAddress}
                            </span>
                            <span className="text-[9px] font-bold text-slate-500 uppercase mt-0.5">
                              Role: {req.applicantRole}
                            </span>
                          </div>

                          <div className="flex items-center gap-1.5 shrink-0">
                            <button
                              onClick={() => handleAcceptRequest(req.id, req.applicantAddress, myUniversity.id)}
                              className="w-7 h-7 rounded-lg bg-emerald-50 hover:bg-emerald-100 flex items-center justify-center text-emerald-600 transition-colors"
                            >
                              <Check className="w-4 h-4" />
                            </button>
                            <button
                              onClick={() => handleDenyRequest(req.id)}
                              className="w-7 h-7 rounded-lg bg-red-50 hover:bg-red-100 flex items-center justify-center text-red-600 transition-colors"
                            >
                              <X className="w-4 h-4" />
                            </button>
                          </div>
                        </div>
                      ))
                    )}
                  </div>
                </div>
              </div>
            )}
          </div>
        ) : (
          /* Student, Merchant, Club Organizer Flow */
          <div className="flex flex-col gap-4">
            <div className="border-b border-slate-100 pb-4">
              <h3 className="text-base font-bold text-slate-900 uppercase">
                University Association Portal
              </h3>
              <p className="text-xs text-slate-700 font-semibold mt-1">
                Connect your account to a university directory to participate in the local ledger economy.
              </p>
            </div>

            {myAssociatedUni ? (
              /* Already a member */
              <div className="bg-emerald-50/20 p-6 rounded-[20px] flex flex-col md:flex-row items-center justify-between gap-6">
                <div className="flex flex-col gap-1.5">
                  <span className="text-[9px] font-bold text-emerald-600 bg-emerald-50 border border-emerald-100 px-2 py-0.5 rounded-full self-start uppercase">
                    Verified Member
                  </span>
                  <h4 className="text-lg font-bold text-slate-900 leading-none mt-1">
                    {myAssociatedUni.name}
                  </h4>
                  <span className="text-xs font-semibold text-slate-700">
                    Location: {myAssociatedUni.location}
                  </span>
                </div>
                <button
                  onClick={handleLeaveUniversity}
                  className="h-10 px-5 bg-white border border-red-100 text-red-600 font-semibold text-xs rounded-xl hover:bg-red-50 transition-colors"
                >
                  Leave University
                </button>
              </div>
            ) : myPendingUni ? (
              /* Request Pending */
              <div className="bg-blue-50/20 p-6 rounded-[20px] flex flex-col md:flex-row items-center justify-between gap-6">
                <div className="flex flex-col gap-1.5">
                  <span className="text-[9px] font-bold text-blue-600 bg-blue-50 border border-blue-100 px-2 py-0.5 rounded-full self-start uppercase animate-pulse">
                    Pending Approval
                  </span>
                  <h4 className="text-lg font-bold text-slate-900 leading-none mt-1">
                    {myPendingUni.name}
                  </h4>
                  <p className="text-xs text-slate-700 font-semibold mt-1">
                    Waiting for University Admin ({myPendingUni.adminAddress.slice(0, 8)}...) to accept your join request.
                  </p>
                </div>
                <button
                  onClick={handleLeaveUniversity}
                  className="h-10 px-5 bg-white border border-slate-200 text-slate-700 font-semibold text-xs rounded-xl hover:bg-slate-50 transition-colors"
                >
                  Cancel Request
                </button>
              </div>
            ) : (
              /* Search / Join Available Universities */
              <div className="flex flex-col gap-4">
                <span className="text-xs font-bold text-slate-700 uppercase tracking-wider">
                  Available Directories to Join
                </span>

                {universities.length === 0 ? (
                  <div className="border border-dashed border-slate-200 rounded-xl p-8 text-center text-xs font-semibold text-slate-700">
                    No universities have registered on the ledger yet. An Admin must create a university profile first.
                  </div>
                ) : (
                  <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-4">
                    {universities.map((uni) => (
                      <div
                        key={uni.id}
                        className="bg-slate-50/50 p-4 rounded-xl flex flex-col justify-between gap-4"
                      >
                        <div className="flex flex-col gap-1">
                          <h5 className="font-bold text-xs text-slate-900">{uni.name}</h5>
                          <span className="text-[10px] text-slate-700 font-semibold">{uni.location}</span>
                          <p className="text-[10px] text-slate-700 font-semibold mt-2 leading-relaxed">
                            {uni.desc || "No description."}
                          </p>
                        </div>
                        <button
                          onClick={() => handleSendJoinRequest(uni.id)}
                          className="h-9 w-full bg-slate-900 text-white text-xs font-semibold rounded-lg flex items-center justify-center gap-1.5 hover:bg-slate-800 transition-colors"
                        >
                          <UserPlus className="w-3.5 h-3.5" />
                          Send Join Request
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
