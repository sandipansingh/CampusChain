"use client";

import { useState } from "react";
import { useWallet } from "@/shared/stellar/useWallet";
import { Skeleton } from "@/shared/ui/Skeleton";
import { Dropdown } from "@/shared/ui/Dropdown";
import { useCampusUserRole, useSetIdentityRoleMutation, useSetVerifiedMutation } from "@/features/wallet/hooks/useWallet";
import {
  Bell,
  Coins,
  AlertCircle,
  CheckCircle2,
} from "lucide-react";

type AdminState = "success" | "loading" | "empty";

interface OnboardingMerchant {
  id: string;
  name: string;
  category: string;
  status: "Pending" | "Active";
}

const initialMerchants: OnboardingMerchant[] = [
  { id: "mer1", name: "Central Library Cafe", category: "Food", status: "Pending" },
  { id: "mer2", name: "University Bookstore", category: "Retail", status: "Active" },
];

export function AdminDashboard() {
  const { address } = useWallet();
  const [adminState, setAdminState] = useState<AdminState>("success");
  const [merchants, setMerchants] = useState<OnboardingMerchant[]>(initialMerchants);
  
  // Role form states
  const [targetUser, setTargetUser] = useState("");
  const [targetRole, setTargetRole] = useState("1"); // 1: Student, 2: Merchant, 4: Admin
  const [statusMsg, setStatusMsg] = useState<{ type: "success" | "error" | "info"; text: string } | null>(null);

  // Verification form states
  const [verifyUser, setVerifyUser] = useState("");
  const [verifyStatus, setVerifyStatus] = useState("true"); // "true" or "false"
  const [verifyStatusMsg, setVerifyStatusMsg] = useState<{ type: "success" | "error" | "info"; text: string } | null>(null);

  const { data: userRole, isLoading: isRoleLoading } = useCampusUserRole(address);
  const setIdentityRoleMutation = useSetIdentityRoleMutation();
  const setVerifiedMutation = useSetVerifiedMutation();

  const handleUpdateRoleSubmit = (e: React.FormEvent) => {
    e.preventDefault();
    if (!address) return;
    if (!targetUser) {
      setStatusMsg({ type: "error", text: "Please provide a valid Stellar address." });
      return;
    }

    setStatusMsg({ type: "info", text: "Submitting role update transaction..." });

    setIdentityRoleMutation.mutate(
      {
        admin: address,
        user: targetUser,
        role: Number(targetRole),
      },
      {
        onSuccess: (txHash) => {
          setStatusMsg({ type: "success", text: `User role updated successfully! Hash: ${txHash.slice(0, 8)}...${txHash.slice(-8)}` });
          setTargetUser("");
        },
        onError: (err: unknown) => {
          const msg = err instanceof Error ? err.message : String(err);
          setStatusMsg({ type: "error", text: `Transaction failed: ${msg}` });
        },
      }
    );
  };

  const handleUpdateVerificationSubmit = (e: React.FormEvent) => {
    e.preventDefault();
    if (!address) return;
    if (!verifyUser) {
      setVerifyStatusMsg({ type: "error", text: "Please provide a valid Stellar address." });
      return;
    }

    setVerifyStatusMsg({ type: "info", text: "Submitting verification update transaction..." });

    setVerifiedMutation.mutate(
      {
        admin: address,
        user: verifyUser,
        verified: verifyStatus === "true",
      },
      {
        onSuccess: (txHash) => {
          setVerifyStatusMsg({ type: "success", text: `Verification status updated successfully! Hash: ${txHash.slice(0, 8)}...${txHash.slice(-8)}` });
          setVerifyUser("");
        },
        onError: (err: unknown) => {
          const msg = err instanceof Error ? err.message : String(err);
          setVerifyStatusMsg({ type: "error", text: `Transaction failed: ${msg}` });
        },
      }
    );
  };

  const handleApproveMerchant = (id: string) => {
    setMerchants((prev) =>
      prev.map((m) => (m.id === id ? { ...m, status: "Active" } : m))
    );
  };

  if (isRoleLoading) {
    return (
      <div className="p-8 text-center bg-card border border-border rounded-xl max-w-md mx-auto space-y-4">
        <Skeleton className="h-6 w-3/4 mx-auto animate-pulse" />
        <Skeleton className="h-20 w-full animate-pulse" />
      </div>
    );
  }

  // Enforce Admin (4)
  if (userRole !== 4) {
    return (
      <div className="p-8 text-center bg-card border border-border rounded-xl max-w-md mx-auto space-y-4">
        <AlertCircle className="h-10 w-10 text-destructive mx-auto" />
        <h3 className="text-base font-bold text-foreground">Access Denied</h3>
        <p className="text-xs text-muted-foreground leading-relaxed">
          Only users registered with the Administrator role can view this dashboard.
        </p>
      </div>
    );
  }

  return (
    <div className="w-full max-w-6xl mx-auto space-y-6">
      {/* Top Header */}
      <div className="flex justify-between items-center">
        <h3 className="text-sm font-bold text-foreground uppercase tracking-wider">Admin Control Portal</h3>
        <div className="w-40">
          <Dropdown<AdminState>
            options={[
              { value: "success", label: "State: Success" },
              { value: "loading", label: "State: Loading" },
              { value: "empty", label: "State: Empty" },
            ]}
            value={adminState}
            onChange={(val) => setAdminState(val)}
          />
        </div>
      </div>

      {statusMsg && (
        <div className={`p-4 rounded-xl text-xs font-semibold border ${
          statusMsg.type === "success"
            ? "bg-emerald-500/10 text-emerald-600 border-emerald-500/20"
            : statusMsg.type === "error"
            ? "bg-destructive/10 text-destructive border-destructive/20"
            : "bg-blue-500/10 text-blue-600 border-blue-500/20 animate-pulse"
        }`}>
          {statusMsg.text}
        </div>
      )}

      {/* Main split grid */}
      <div className="grid grid-cols-1 lg:grid-cols-12 gap-6 items-start">
        
        {/* Left Column: Role Issuance */}
        <div className="lg:col-span-5 flex flex-col gap-6">
          <div className="bg-card border border-border p-6 rounded-2xl shadow-sm">
            <div className="mb-4">
              <h3 className="text-sm font-bold text-foreground">Assign Role Permissions</h3>
              <p className="text-xs text-muted-foreground mt-0.5">
                Set on-chain RBAC roles for students, organizers, or merchant addresses.
              </p>
            </div>

            <form onSubmit={handleUpdateRoleSubmit} className="space-y-4">
              <div>
                <label className="block text-xs font-bold uppercase tracking-wider text-muted-foreground mb-1.5" htmlFor="target-user">
                  Target Wallet Address
                </label>
                <input
                  id="target-user"
                  type="text"
                  value={targetUser}
                  onChange={(e) => setTargetUser(e.target.value)}
                  placeholder="G..."
                  required
                  className="w-full h-11 px-4 bg-card border border-border rounded-lg text-sm focus:border-foreground focus:ring-1 focus:ring-foreground focus:outline-none"
                />
              </div>

              <div>
                <label className="block text-xs font-bold uppercase tracking-wider text-muted-foreground mb-1.5 animate-none">
                  Select Permission Role
                </label>
                <Dropdown<string>
                  options={[
                    { value: "1", label: "Student" },
                    { value: "2", label: "Merchant" },
                    { value: "4", label: "Administrator" },
                  ]}
                  value={targetRole}
                  onChange={(val) => setTargetRole(val)}
                />
              </div>

              <button
                type="submit"
                disabled={setIdentityRoleMutation.isPending}
                className="w-full h-11 bg-primary text-primary-foreground font-bold rounded-lg hover:bg-primary/95 transition-colors cursor-pointer disabled:opacity-50"
              >
                {setIdentityRoleMutation.isPending ? "Assigning..." : "Publish Permissions"}
              </button>
            </form>
          </div>

          <div className="bg-card border border-border p-6 rounded-2xl shadow-sm">
            <div className="mb-4">
              <h3 className="text-sm font-bold text-foreground">Verify Student Identity</h3>
              <p className="text-xs text-muted-foreground mt-0.5">
                Set the verified flag on a student profile to approve scholarship applications.
              </p>
            </div>

            {verifyStatusMsg && (
              <div className={`p-4 rounded-xl text-xs font-semibold border mb-4 ${
                verifyStatusMsg.type === "success"
                  ? "bg-emerald-500/10 text-emerald-600 border-emerald-500/20"
                  : verifyStatusMsg.type === "error"
                  ? "bg-destructive/10 text-destructive border-destructive/20"
                  : "bg-blue-500/10 text-blue-600 border-blue-500/20 animate-pulse"
              }`}>
                {verifyStatusMsg.text}
              </div>
            )}

            <form onSubmit={handleUpdateVerificationSubmit} className="space-y-4">
              <div>
                <label className="block text-xs font-bold uppercase tracking-wider text-muted-foreground mb-1.5" htmlFor="verify-user">
                  Target Wallet Address
                </label>
                <input
                  id="verify-user"
                  type="text"
                  value={verifyUser}
                  onChange={(e) => setVerifyUser(e.target.value)}
                  placeholder="G..."
                  required
                  className="w-full h-11 px-4 bg-card border border-border rounded-lg text-sm focus:border-foreground focus:ring-1 focus:ring-foreground focus:outline-none"
                />
              </div>

              <div>
                <label className="block text-xs font-bold uppercase tracking-wider text-muted-foreground mb-1.5 animate-none">
                  Verification Status
                </label>
                <Dropdown<string>
                  options={[
                    { value: "true", label: "Verified (True)" },
                    { value: "false", label: "Unverified (False)" },
                  ]}
                  value={verifyStatus}
                  onChange={(val) => setVerifyStatus(val)}
                />
              </div>

              <button
                type="submit"
                disabled={setVerifiedMutation.isPending}
                className="w-full h-11 bg-primary text-primary-foreground font-bold rounded-lg hover:bg-primary/95 transition-colors cursor-pointer disabled:opacity-50"
              >
                {setVerifiedMutation.isPending ? "Updating..." : "Publish Verification"}
              </button>
            </form>
          </div>
        </div>

        {/* Right Column: Onboarding Merchants */}
        <div className="lg:col-span-7 flex flex-col gap-4">
          <div>
            <h3 className="text-base font-bold text-foreground">Onboarding Merchants</h3>
            <p className="text-xs text-muted-foreground mt-0.5">
              Review and approve campus vendors requesting contract participation.
            </p>
          </div>

          {adminState === "loading" ? (
            <div className="space-y-4">
              {[1, 2].map((i) => (
                <div key={i} className="bg-card border border-border p-5 rounded-2xl space-y-3">
                  <Skeleton className="h-6 w-1/2 animate-pulse" />
                  <Skeleton className="h-10 w-full animate-pulse" />
                </div>
              ))}
            </div>
          ) : adminState === "empty" || merchants.length === 0 ? (
            <div className="p-16 border border-border rounded-2xl bg-card text-center flex flex-col items-center justify-center gap-3">
              <Coins className="h-12 w-12 text-muted-foreground/50" />
              <h3 className="text-base font-bold">No Vendors Pending</h3>
            </div>
          ) : (
            <div className="bg-card border border-border rounded-2xl shadow-sm divide-y divide-border overflow-hidden">
              {merchants.map((merchant) => (
                <div key={merchant.id} className="p-4 flex items-center justify-between hover:bg-muted/40 transition-colors text-xs">
                  <div>
                    <p className="font-bold text-foreground">{merchant.name}</p>
                    <p className="text-muted-foreground mt-0.5">Category: {merchant.category}</p>
                  </div>
                  <div className="flex gap-2">
                    {merchant.status === "Pending" ? (
                      <button
                        onClick={() => handleApproveMerchant(merchant.id)}
                        className="bg-primary text-primary-foreground font-bold px-3 py-1.5 rounded-lg text-[10px] uppercase tracking-wider hover:bg-primary/95 transition-all cursor-pointer"
                      >
                        Approve
                      </button>
                    ) : (
                      <span className="text-emerald-600 font-bold uppercase tracking-wider text-[10px] py-1.5">Approved</span>
                    )}
                  </div>
                </div>
              ))}
            </div>
          )}
        </div>
      </div>
    </div>
  );
}
export default AdminDashboard;
