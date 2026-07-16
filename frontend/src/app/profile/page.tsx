"use client";

import React, { useState } from "react";
import { useWalletStore } from "@/state/useWalletStore";
import { useCampusUserRole, useSetRoleMutation } from "@/hooks/useCampusToken";
import { useTransactionStore } from "@/state/useTransactionStore";
import { pollTransactionStatus } from "@/services/contracts";
import { logger } from "@/services/logger";
import {
  User,
  Shield,
  Copy,
  CheckCircle,
  Loader2,
  GraduationCap,
  Store,
  Calendar,
  Building
} from "lucide-react";

export default function ProfilePage() {
  const { address } = useWalletStore();
  const { data: role } = useCampusUserRole(address);
  const setRoleMut = useSetRoleMutation();

  const addTransaction = useTransactionStore((state) => state.addTransaction);
  const updateTransaction = useTransactionStore((state) => state.updateTransaction);

  const [selectedRole, setSelectedRole] = useState<number>(1);
  const [copied, setCopied] = useState(false);

  const getRoleInfo = (roleNum?: number) => {
    const roles = {
      0: {
        label: "Guest Member",
        desc: "Basic access to view telemetry. Connect/activate wallet to participate in the economy.",
        icon: User,
        color: "text-slate-600 bg-slate-50 border-slate-200",
      },
      1: {
        label: "Student",
        desc: "Send P2P transfers, buy marketplace goods, purchase club event ticket passes, and receive merit rewards.",
        icon: GraduationCap,
        color: "text-emerald-700 bg-emerald-50 border-emerald-200",
      },
      2: {
        label: "Merchant",
        desc: "Accept instant payments from students, receive settlements, and settle smart contract escrows.",
        icon: Store,
        color: "text-blue-700 bg-blue-50 border-blue-200",
      },
      3: {
        label: "Club Organizer",
        desc: "Mint tokenized club event passes, sell tickets directly on-chain, and manage doors via cryptographic signatures.",
        icon: Calendar,
        color: "text-purple-700 bg-purple-50 border-purple-200",
      },
      4: {
        label: "University Admin",
        desc: "Super-user dashboard control. Authorize campus merchants, distribute merit scholarships, and modify network constants.",
        icon: Building,
        color: "text-rose-700 bg-rose-50 border-rose-200",
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

  const currentRole = getRoleInfo(role);

  return (
    <div className="flex flex-col gap-8 w-full max-w-7xl mx-auto">
      {/* Title */}
      <div className="flex flex-col md:flex-row md:items-center justify-between gap-4">
        <div>
          <h1 className="text-3xl font-extrabold tracking-tight text-slate-900 uppercase">
            My Profile
          </h1>
          <p className="text-slate-500 text-sm mt-1">
            Manage your on-chain wallet identity, register roles, and check smart contract permissions.
          </p>
        </div>
      </div>

      {/* Grid Layout */}
      <div className="grid grid-cols-1 lg:grid-cols-3 gap-8">
        
        {/* Left Side: Profile Summary Card */}
        <div className="lg:col-span-1 flex flex-col gap-6">
          <div className="bg-white border border-border rounded-2xl shadow-sm p-6 flex flex-col items-center text-center gap-6">
            {/* Avatar block */}
            <div className="relative">
              <div className="w-24 h-24 rounded-2xl bg-gradient-to-tr from-accent to-rose-500 shadow-lg flex items-center justify-center text-white text-3xl font-black">
                {address ? address.slice(2, 4).toUpperCase() : "G"}
              </div>
              <div className="absolute -bottom-2 -right-2 w-8 h-8 rounded-full bg-slate-900 border-2 border-white flex items-center justify-center text-white">
                <Shield className="w-4 h-4 text-accent" />
              </div>
            </div>

            <div className="flex flex-col gap-1.5 w-full">
              <span className="font-extrabold text-slate-900 truncate px-4">
                {address ? `${address.slice(0, 8)}...${address.slice(-8)}` : "Guest Wallet"}
              </span>
              <span className={`text-[10px] font-bold uppercase tracking-wider px-2 py-0.5 rounded border self-center ${currentRole.color}`}>
                {currentRole.label}
              </span>
            </div>

            <p className="text-xs text-slate-500 font-semibold leading-relaxed px-2">
              {currentRole.desc}
            </p>

            {address && (
              <button
                onClick={handleCopy}
                className="h-10 px-4 w-full bg-slate-50 hover:bg-slate-100 border border-border text-xs font-bold text-slate-600 rounded-xl flex items-center justify-center gap-2 active:scale-95 transition-all"
              >
                {copied ? (
                  <>
                    <CheckCircle className="w-4 h-4 text-emerald-600" />
                    Copied
                  </>
                ) : (
                  <>
                    <Copy className="w-4 h-4" />
                    Copy Wallet Address
                  </>
                )}
              </button>
            )}
          </div>
        </div>

        {/* Right Side: Role Assignment Form */}
        <div className="lg:col-span-2 bg-white border border-border rounded-2xl shadow-sm p-6 flex flex-col gap-6">
          <div className="border-b border-slate-100 pb-4">
            <h3 className="text-base font-extrabold text-slate-900 uppercase">
              On-Chain Identity Registrar
            </h3>
            <p className="text-xs text-slate-400 font-medium mt-1">
              Soroban smart contracts secure permissions using Role-Based Access Control (RBAC). Select a role to update your ledger permissions.
            </p>
          </div>

          <form onSubmit={handleRegisterRole} className="flex flex-col gap-6">
            <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
              {[
                { id: 1, name: "Student", icon: GraduationCap, desc: "Participate in P2P escrows and event passes" },
                { id: 2, name: "Merchant", icon: Store, desc: "Settle escrows and receive goods payments" },
                { id: 3, name: "Club Organizer", icon: Calendar, desc: "Mint event tickets and manage door verification" },
                { id: 4, name: "University Admin", icon: Building, desc: "scholarships, manage merchant registries" },
              ].map((r) => {
                const Icon = r.icon;
                const isSelected = selectedRole === r.id;
                return (
                  <div
                    key={r.id}
                    onClick={() => setSelectedRole(r.id)}
                    className={`border p-4 rounded-xl cursor-pointer flex gap-4 transition-all ${
                      isSelected
                        ? "border-accent bg-orange-50/20 ring-1 ring-accent/10"
                        : "border-border hover:border-slate-300"
                    }`}
                  >
                    <div className={`w-10 h-10 rounded-xl flex items-center justify-center shrink-0 ${
                      isSelected ? "bg-accent text-white" : "bg-slate-50 text-slate-400"
                    }`}>
                      <Icon className="w-5 h-5" />
                    </div>
                    <div className="flex flex-col">
                      <span className="text-xs font-bold text-slate-800 uppercase">{r.name}</span>
                      <span className="text-[10px] text-slate-400 font-semibold mt-1 leading-normal">{r.desc}</span>
                    </div>
                  </div>
                );
              })}
            </div>

            <button
              type="submit"
              disabled={setRoleMut.isPending}
              className="h-12 w-full bg-accent hover:opacity-95 text-white text-xs font-bold uppercase rounded-xl flex items-center justify-center gap-2 active:scale-95 transition-all shadow-md shadow-accent/15 disabled:opacity-50 disabled:pointer-events-none mt-4"
            >
              {setRoleMut.isPending ? (
                <>
                  <Loader2 className="w-4 h-4 animate-spin" />
                  MINTING ROLE TRANSACTION...
                </>
              ) : (
                "Update On-Chain Role Permissions"
              )}
            </button>
          </form>
        </div>
      </div>
    </div>
  );
}
