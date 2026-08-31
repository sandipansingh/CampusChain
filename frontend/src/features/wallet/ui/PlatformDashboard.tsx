"use client";

import { useState, useEffect } from "react";
import { useParams, useRouter } from "next/navigation";
import Image from "next/image";
import { useWallet } from "@/shared/stellar/useWallet";
import { Skeleton } from "@/shared/ui/Skeleton";
import { ThemeToggle } from "@/shared/ui/ThemeToggle";
import {
  LayoutDashboard,
  Building2,
  Clock3,
  CheckCircle2,
  XCircle,
  Settings,
  Coins,
  Bell,
  GraduationCap,
  History,
} from "lucide-react";

import { useQuery, useMutation, useQueryClient } from "@tanstack/react-query";
import {
  executeApproveUniversity,
  executeRejectUniversity,
  executeSuspendUniversity,
  fetchUniversities,
} from "@/features/wallet/service/campusIdentity";
import { ActivityFeed } from "@/features/transactions/ui/ActivityFeed";
import { Settings as SettingsView } from "./Settings";
import { NotificationPanel } from "@/shared/ui/NotificationPanel";
import { useNotificationStore } from "@/shared/hooks/useNotificationStore";
import {
  useScholarshipPrograms,
  useScholarshipApplications,
  useAdminReviewScholarshipMutation,
  useAdminSuspendScholarshipMutation,
} from "@/features/scholarships/hooks/useScholarships";
import { OperationsCenter } from "@/features/analytics/ui/OperationsCenter";

export function PlatformDashboard() {
  const { address, disconnect } = useWallet();
  const params = useParams();
  const router = useRouter();
  const role = params?.role as string;
  const activeTab = (params?.slug as string) || "overview";

  const [isFeedOpen, setIsFeedOpen] = useState(false);
  const unreadCount = useNotificationStore((s) => s.unreadCount);
  const queryClient = useQueryClient();

  // Scholarships approvals & applications
  const scholarshipsQuery = useScholarshipPrograms(address ?? undefined);
  const applicationsQuery = useScholarshipApplications(address ?? undefined);
  const reviewScholarship = useAdminReviewScholarshipMutation();
  const suspendScholarship = useAdminSuspendScholarshipMutation();
  const [schNotice, setSchNotice] = useState<string | null>(null);

  useEffect(() => {
    const handleNavigate = (e: Event) => {
      const customEvent = e as CustomEvent<string>;
      if (customEvent.detail && role) {
        router.push(`/${role}/${customEvent.detail}`);
      }
    };
    window.addEventListener("campuschain:navigate", handleNavigate);
    return () => window.removeEventListener("campuschain:navigate", handleNavigate);
  }, [role, router]);

  // Fetch data
  const universitiesQuery = useQuery({
    queryKey: ["universities"],
    queryFn: () => fetchUniversities(address ?? undefined),
    refetchInterval: 20000,
  });

  // Mutations
  const approveUniv = useMutation({
    mutationFn: (code: string) => executeApproveUniversity(address!, code),
    onSuccess: () => queryClient.invalidateQueries({ queryKey: ["universities"] }),
  });
  const rejectUniv = useMutation({
    mutationFn: (code: string) => executeRejectUniversity(address!, code),
    onSuccess: () => queryClient.invalidateQueries({ queryKey: ["universities"] }),
  });
  const suspendUniv = useMutation({
    mutationFn: ({ caller, code }: { caller: string; code: string }) =>
      executeSuspendUniversity(caller, code),
    onSuccess: () => queryClient.invalidateQueries({ queryKey: ["universities"] }),
  });

  const universities = universitiesQuery.data ?? [];
  const pendingUniversities = universities.filter((u) => u.approvalStatus === 1);
  const approvedUniversities = universities.filter((u) => u.approvalStatus === 2 || u.approvalStatus === 4);

  const renderOverview = () => {
    const pendingScholarships = (scholarshipsQuery.data ?? []).filter((s) => s.adminApprovalStatus === "pending");
    const activeScholarshipsCount = (scholarshipsQuery.data ?? []).filter((s) => s.adminApprovalStatus === "approved").length;
    const totalPending = pendingUniversities.length + pendingScholarships.length;

    return (
      <div className="space-y-6">
        <div className="grid grid-cols-1 md:grid-cols-4 gap-6">
          {[
            { label: "Registered Universities", value: universities.length, icon: Building2 },
            { label: "Active Scholarships", value: activeScholarshipsCount, icon: GraduationCap },
            { label: "Pending Approvals", value: totalPending, icon: Clock3 },
            { label: "Platform Operations", value: "Stellar Testnet", icon: Coins },
          ].map((stat) => {
            const Icon = stat.icon;
            return (
              <div key={stat.label} className="bg-card rounded-xl p-6 border border-border shadow-sm flex items-center justify-between">
                <div>
                  <p className="text-xs text-muted-foreground mb-1">{stat.label}</p>
                  <p className="text-2xl font-bold">{stat.value}</p>
                </div>
                <div className="w-10 h-10 rounded-full bg-muted flex items-center justify-center text-muted-foreground shrink-0">
                  <Icon className="h-5 w-5" />
                </div>
              </div>
            );
          })}
        </div>

        {/* Pending approvals queue preview */}
        <div className="bg-card rounded-xl border border-border shadow-sm p-6 space-y-6">
          <h3 className="text-base font-bold text-foreground">Awaiting Review & Approvals</h3>

          {/* Section 1: University registrations */}
          <div>
            <h4 className="text-xs font-bold text-muted-foreground uppercase tracking-wider mb-3">
              University Registration Claims ({pendingUniversities.length})
            </h4>
            {pendingUniversities.length === 0 ? (
              <p className="text-xs text-muted-foreground">No universities awaiting approval.</p>
            ) : (
              <div className="space-y-3">
                {pendingUniversities.slice(0, 3).map((u) => (
                  <div key={u.code} className="flex flex-col sm:flex-row sm:items-center sm:justify-between p-4 border border-border rounded-lg bg-muted/10 gap-4">
                    <div>
                      <p className="font-bold text-sm">{u.name} <span className="text-xs text-muted-foreground font-mono">({u.code})</span></p>
                      <p className="text-xs text-muted-foreground mt-0.5">Admin: {u.adminAddress}</p>
                    </div>
                    <div className="flex gap-2">
                      <button
                        onClick={() => approveUniv.mutate(u.code)}
                        className="px-3 py-1.5 bg-emerald-600 hover:bg-emerald-700 text-white rounded-lg text-xs font-bold flex items-center gap-1 cursor-pointer"
                      >
                        <CheckCircle2 className="size-3.5" /> Approve
                      </button>
                      <button
                        onClick={() => rejectUniv.mutate(u.code)}
                        className="px-3 py-1.5 border border-border hover:bg-muted text-red-600 rounded-lg text-xs font-bold flex items-center gap-1 cursor-pointer"
                      >
                        <XCircle className="size-3.5" /> Reject
                      </button>
                    </div>
                  </div>
                ))}
              </div>
            )}
          </div>

          {/* Section 2: Scholarships */}
          <div className="border-t border-border pt-6">
            <h4 className="text-xs font-bold text-muted-foreground uppercase tracking-wider mb-3">
              Scholarship Programs ({pendingScholarships.length})
            </h4>
            {schNotice && (
              <div
                className={`text-xs p-2.5 rounded-lg border mb-3 ${
                  schNotice.includes("successfully")
                    ? "text-emerald-700 bg-emerald-50 border-emerald-200"
                    : "text-destructive bg-destructive/5 border-destructive/20"
                }`}
              >
                {schNotice}
              </div>
            )}
            {pendingScholarships.length === 0 ? (
              <p className="text-xs text-muted-foreground">No scholarship programs awaiting approval.</p>
            ) : (
              <div className="space-y-3">
                {pendingScholarships.slice(0, 3).map((s) => (
                  <div key={s.id} className="flex flex-col sm:flex-row sm:items-center sm:justify-between p-4 border border-border rounded-lg bg-muted/10 gap-4">
                    <div>
                      <p className="font-bold text-sm">{s.title} <span className="text-xs text-muted-foreground">({s.amount.toLocaleString()} CAMP)</span></p>
                      <p className="text-xs text-muted-foreground mt-0.5 leading-relaxed truncate max-w-[400px]">{s.description}</p>
                      <p className="text-[10px] text-muted-foreground mt-0.5">Univ: {s.createdByUniversityId}</p>
                    </div>
                    <div className="flex gap-2">
                      <button
                        disabled={reviewScholarship.isPending}
                        onClick={async () => {
                          try {
                            setSchNotice(null);
                            const txHash = await reviewScholarship.mutateAsync({ adminId: address!, scholarshipId: s.id, approved: true });
                            setSchNotice(`Scholarship approved successfully! Tx: ${txHash}`);
                          } catch (err) {
                            setSchNotice(err instanceof Error ? err.message : "Approval failed.");
                          }
                        }}
                        className="px-3 py-1.5 bg-emerald-600 hover:bg-emerald-700 text-white rounded-lg text-xs font-bold flex items-center gap-1 cursor-pointer disabled:opacity-50"
                      >
                        <CheckCircle2 className="size-3.5" /> Approve
                      </button>
                      <button
                        disabled={reviewScholarship.isPending}
                        onClick={async () => {
                          try {
                            setSchNotice(null);
                            const txHash = await reviewScholarship.mutateAsync({ adminId: address!, scholarshipId: s.id, approved: false });
                            setSchNotice(`Scholarship rejected successfully! Tx: ${txHash}`);
                          } catch (err) {
                            setSchNotice(err instanceof Error ? err.message : "Rejection failed.");
                          }
                        }}
                        className="px-3 py-1.5 border border-border hover:bg-muted text-red-600 rounded-lg text-xs font-bold flex items-center gap-1 cursor-pointer disabled:opacity-50"
                      >
                        <XCircle className="size-3.5" /> Reject
                      </button>
                    </div>
                  </div>
                ))}
              </div>
            )}
          </div>
        </div>
      </div>
    );
  };

  const renderQueue = () => {
    const pendingScholarships = (scholarshipsQuery.data ?? []).filter((s) => s.adminApprovalStatus === "pending");

    return (
      <div className="space-y-6">
        {/* University requests */}
        <div className="bg-card rounded-xl border border-border shadow-sm p-6 space-y-4">
          <h3 className="text-lg font-bold text-foreground">Approval Requests</h3>
          <p className="text-xs text-muted-foreground">Manage and review incoming claims for University registrations and Scholarship approvals.</p>
          
          <div className="border-t border-border pt-4">
            <h4 className="text-sm font-bold text-foreground mb-3 flex items-center gap-2">
              <Building2 className="size-4" /> University Registration Requests ({pendingUniversities.length})
            </h4>
            {universitiesQuery.isLoading ? (
              <Skeleton className="h-40 w-full animate-pulse" />
            ) : pendingUniversities.length === 0 ? (
              <p className="text-sm text-muted-foreground py-4">No pending university registrations in queue.</p>
            ) : (
              <div className="space-y-3">
                {pendingUniversities.map((u) => {
                  const isApprovePending = approveUniv.isPending && approveUniv.variables === u.code;
                  const isRejectPending = rejectUniv.isPending && rejectUniv.variables === u.code;
                  const hasApproveError = approveUniv.isError && approveUniv.variables === u.code;
                  const hasRejectError = rejectUniv.isError && rejectUniv.variables === u.code;

                  return (
                    <div key={u.code} className="flex flex-col p-4 border border-border rounded-lg gap-3 bg-muted/10">
                      <div className="flex flex-col sm:flex-row sm:items-center sm:justify-between gap-4">
                        <div>
                          <p className="font-bold text-sm">{u.name} <span className="text-xs text-muted-foreground font-mono">({u.code})</span></p>
                          <p className="text-xs text-muted-foreground mt-0.5">Physical address: {u.address}</p>
                          <p className="text-xs text-muted-foreground mt-0.5">Admin wallet: <span className="font-mono text-xs">{u.adminAddress}</span></p>
                          <p className="text-[10px] text-muted-foreground mt-1">Submitted: {new Date(Number(u.createdAt) * 1000).toLocaleString()}</p>
                        </div>
                        <div className="flex gap-2 shrink-0">
                          <button
                            disabled={approveUniv.isPending || rejectUniv.isPending}
                            onClick={() => approveUniv.mutate(u.code)}
                            className="px-3 py-1.5 bg-emerald-600 hover:bg-emerald-700 text-white rounded-lg text-xs font-bold flex items-center gap-1.5 disabled:opacity-50 cursor-pointer h-9 transition-colors"
                          >
                            {isApprovePending ? (
                              <span className="h-3 w-3 border-2 border-white border-t-transparent rounded-full animate-spin" />
                            ) : (
                              <CheckCircle2 className="size-3.5" />
                            )}
                            {isApprovePending ? "Approving..." : "Approve"}
                          </button>
                          <button
                            disabled={approveUniv.isPending || rejectUniv.isPending}
                            onClick={() => rejectUniv.mutate(u.code)}
                            className="px-3 py-1.5 border border-border hover:bg-muted text-red-600 rounded-lg text-xs font-bold flex items-center gap-1.5 disabled:opacity-50 cursor-pointer h-9 transition-colors"
                          >
                            {isRejectPending ? (
                              <span className="h-3 w-3 border-2 border-red-600 border-t-transparent rounded-full animate-spin" />
                            ) : (
                              <XCircle className="size-3.5" />
                            )}
                            {isRejectPending ? "Rejecting..." : "Reject"}
                          </button>
                        </div>
                      </div>
                      {hasApproveError && (
                        <p className="text-xs text-destructive bg-destructive/5 border border-destructive/20 p-2 rounded">
                          Error: {approveUniv.error instanceof Error ? approveUniv.error.message : "Approval transaction failed"}
                        </p>
                      )}
                      {hasRejectError && (
                        <p className="text-xs text-destructive bg-destructive/5 border border-destructive/20 p-2 rounded">
                          Error: {rejectUniv.error instanceof Error ? rejectUniv.error.message : "Rejection transaction failed"}
                        </p>
                      )}
                    </div>
                  );
                })}
              </div>
            )}
          </div>

          {/* Scholarship requests */}
          <div className="border-t border-border pt-6">
            <h4 className="text-sm font-bold text-foreground mb-3 flex items-center gap-2">
              <GraduationCap className="size-4" /> Scholarship Program Requests ({pendingScholarships.length})
            </h4>

            {schNotice && (
              <div
                className={`text-xs p-2.5 rounded-lg border mb-3 ${
                  schNotice.includes("successfully")
                    ? "text-emerald-700 bg-emerald-50 border-emerald-200"
                    : "text-destructive bg-destructive/5 border-destructive/20"
                }`}
              >
                {schNotice}
              </div>
            )}

            {scholarshipsQuery.isLoading ? (
              <Skeleton className="h-40 w-full animate-pulse" />
            ) : pendingScholarships.length === 0 ? (
              <p className="text-sm text-muted-foreground py-4">No pending scholarship requests in queue.</p>
            ) : (
              <div className="space-y-3">
                {pendingScholarships.map((s) => (
                  <div key={s.id} className="p-4 border border-border rounded-lg bg-muted/10 space-y-3">
                    <div className="flex flex-col sm:flex-row justify-between sm:items-start gap-4">
                      <div className="space-y-1">
                        <h5 className="font-bold text-sm text-foreground">{s.title}</h5>
                        <p className="text-xs text-muted-foreground leading-relaxed">{s.description}</p>
                      </div>
                      <div className="shrink-0 flex items-center gap-1 bg-primary/10 text-primary font-bold px-2.5 py-1 rounded-lg text-xs border border-primary/20">
                        {s.amount.toLocaleString()} CAMP
                      </div>
                    </div>

                    <div className="grid grid-cols-2 gap-4 text-xs pt-3 border-t border-border">
                      <div className="space-y-1">
                        <span className="text-muted-foreground font-semibold block">Eligibility Criteria</span>
                        <span className="text-foreground">{s.criteria}</span>
                      </div>
                      <div className="space-y-1.5">
                        <p className="text-muted-foreground">Deadline: <strong className="text-foreground">{s.deadline}</strong></p>
                        <p className="text-muted-foreground">Slots: <strong className="text-foreground">{s.slots}</strong></p>
                      </div>
                    </div>

                    <div className="flex flex-col sm:flex-row justify-between sm:items-center pt-3 border-t border-border gap-3">
                      <span className="text-[10px] font-mono text-muted-foreground truncate max-w-[250px]" title={s.createdByUniversityId}>
                        University: {s.createdByUniversityId}
                      </span>
                      <div className="flex gap-2">
                        <button
                          disabled={reviewScholarship.isPending}
                          onClick={async () => {
                            try {
                              setSchNotice(null);
                              const txHash = await reviewScholarship.mutateAsync({ adminId: address!, scholarshipId: s.id, approved: true });
                              setSchNotice(`Scholarship approved successfully! Tx: ${txHash}`);
                            } catch (err) {
                              setSchNotice(err instanceof Error ? err.message : "Approval failed.");
                            }
                          }}
                          className="px-3 py-1.5 bg-emerald-600 hover:bg-emerald-700 text-white rounded-lg text-xs font-bold flex items-center gap-1 cursor-pointer disabled:opacity-50"
                        >
                          <CheckCircle2 className="size-3.5" /> Approve
                        </button>
                        <button
                          disabled={reviewScholarship.isPending}
                          onClick={async () => {
                            try {
                              setSchNotice(null);
                              const txHash = await reviewScholarship.mutateAsync({ adminId: address!, scholarshipId: s.id, approved: false });
                              setSchNotice(`Scholarship rejected successfully! Tx: ${txHash}`);
                            } catch (err) {
                              setSchNotice(err instanceof Error ? err.message : "Rejection failed.");
                            }
                          }}
                          className="px-3 py-1.5 border border-border hover:bg-muted text-red-600 rounded-lg text-xs font-bold flex items-center gap-1 cursor-pointer disabled:opacity-50"
                        >
                          <XCircle className="size-3.5" /> Reject
                        </button>
                      </div>
                    </div>
                  </div>
                ))}
              </div>
            )}
          </div>
        </div>
      </div>
    );
  };

  const renderUniversitiesList = () => {
    return (
      <div className="bg-card rounded-xl border border-border shadow-sm p-6 space-y-4">
        <h3 className="text-lg font-bold">Registered Universities</h3>
        {universitiesQuery.isLoading ? (
          <Skeleton className="h-40 w-full" />
        ) : approvedUniversities.length === 0 ? (
          <p className="text-sm text-muted-foreground py-6 text-center">No registered universities.</p>
        ) : (
          <div className="overflow-x-auto">
            <table className="w-full text-left text-sm">
              <thead>
                <tr className="border-b border-border text-muted-foreground text-xs font-semibold">
                  <th className="py-3 px-4">Name</th>
                  <th className="py-3 px-4">Code</th>
                  <th className="py-3 px-4">Status</th>
                  <th className="py-3 px-4">Admin</th>
                  <th className="py-3 px-4">Actions</th>
                </tr>
              </thead>
              <tbody className="divide-y divide-border">
                {approvedUniversities.map((u) => {
                  const isSuspended = u.approvalStatus === 4;
                  return (
                    <tr key={u.code} className="hover:bg-muted/30">
                      <td className="py-3 px-4 font-medium">{u.name}</td>
                      <td className="py-3 px-4 font-mono text-xs">{u.code}</td>
                      <td className="py-3 px-4">
                        <span className={`px-2 py-0.5 rounded-full text-[10px] font-bold border ${isSuspended ? "bg-red-50 text-red-700 border-red-200" : "bg-emerald-50 text-emerald-800 border-emerald-200"}`}>
                          {isSuspended ? "Suspended" : "Active"}
                        </span>
                      </td>
                      <td className="py-3 px-4 font-mono text-xs text-muted-foreground">{u.adminAddress.slice(0, 8)}...{u.adminAddress.slice(-8)}</td>
                      <td className="py-3 px-4">
                        {!isSuspended ? (
                          <button
                            disabled={suspendUniv.isPending}
                            onClick={() => suspendUniv.mutate({ caller: address!, code: u.code })}
                            className="px-2 py-1 border border-red-200 text-red-600 hover:bg-red-50 text-xs font-bold rounded-lg disabled:opacity-50 cursor-pointer"
                          >
                            Suspend
                          </button>
                        ) : (
                          <span className="text-xs text-muted-foreground">Admin suspension active</span>
                        )}
                      </td>
                    </tr>
                  );
                })}
              </tbody>
            </table>
          </div>
        )}
      </div>
    );
  };

  const renderActivityFeed = () => {
    return <ActivityFeed global />;
  };

  const renderScholarshipsList = () => {
    const activeScholarships = (scholarshipsQuery.data ?? []).filter((s) => s.adminApprovalStatus === "approved");

    return (
      <div className="bg-card rounded-xl border border-border shadow-sm p-6 space-y-4">
        <h3 className="text-base font-bold text-foreground">Active Scholarship Programs</h3>
        <p className="text-xs text-muted-foreground font-normal">
          Monitor all active on-chain scholarship programs. Platform Admin can immediately suspend any program if necessary.
        </p>

        {schNotice && (
          <div
            className={`text-xs p-2.5 rounded-lg border ${
              schNotice.includes("successfully")
                ? "text-emerald-700 bg-emerald-50 border-emerald-200"
                : "text-destructive bg-destructive/5 border-destructive/20"
            }`}
          >
            {schNotice}
          </div>
        )}

        {scholarshipsQuery.isLoading ? (
          <Skeleton className="h-24 w-full animate-pulse" />
        ) : activeScholarships.length === 0 ? (
          <div className="text-center py-12 border border-border border-dashed rounded-lg bg-muted/5">
            <GraduationCap className="h-10 w-10 mx-auto text-muted-foreground animate-none" />
            <p className="mt-3 text-sm font-bold text-foreground">No active scholarships</p>
            <p className="text-xs text-muted-foreground mt-1">There are no approved or active scholarship programs on-chain.</p>
          </div>
        ) : (
          <div className="space-y-4">
            {activeScholarships.map((s) => (
              <div key={s.id} className="p-5 border border-border rounded-lg bg-muted/10 space-y-3">
                <div className="flex flex-col sm:flex-row justify-between sm:items-start gap-4">
                  <div className="space-y-1">
                    <h4 className="font-bold text-sm text-foreground">{s.title}</h4>
                    <p className="text-xs text-muted-foreground leading-relaxed">{s.description}</p>
                  </div>
                  <div className="shrink-0 flex items-center gap-1 bg-primary/10 text-primary font-bold px-2.5 py-1 rounded-lg text-xs border border-primary/20">
                    {s.amount.toLocaleString()} CAMP
                  </div>
                </div>

                <div className="grid grid-cols-2 gap-4 text-xs pt-3 border-t border-border">
                  <div className="space-y-1">
                    <span className="text-muted-foreground font-semibold block">Eligibility Criteria</span>
                    <span className="text-foreground">{s.criteria}</span>
                  </div>
                  <div className="space-y-1.5">
                    <p className="text-muted-foreground">Deadline: <strong className="text-foreground">{s.deadline}</strong></p>
                    <p className="text-muted-foreground">Slots: <strong className="text-foreground">{s.slots}</strong></p>
                  </div>
                </div>

                <div className="flex flex-col sm:flex-row justify-between sm:items-center pt-3 border-t border-border gap-3">
                  <span className="text-[10px] font-mono text-muted-foreground truncate max-w-[250px]" title={s.createdByUniversityId}>
                    University: {s.createdByUniversityId}
                  </span>
                  <div className="flex gap-2">
                    <button
                      disabled={suspendScholarship.isPending}
                      onClick={async () => {
                        try {
                          setSchNotice(null);
                          const txHash = await suspendScholarship.mutateAsync({ adminId: address!, scholarshipId: s.id });
                          setSchNotice(`Scholarship suspended successfully! Tx: ${txHash}`);
                        } catch (err) {
                          setSchNotice(err instanceof Error ? err.message : "Suspension failed.");
                        }
                      }}
                      className="px-3 py-1.5 bg-red-600 hover:bg-red-700 text-white rounded-lg text-xs font-bold flex items-center gap-1 cursor-pointer disabled:opacity-50"
                    >
                      <XCircle className="size-3.5" /> Suspend Immediately
                    </button>
                  </div>
                </div>
              </div>
            ))}
          </div>
        )}

        {/* Student Applications Overview */}
        <div className="pt-6 border-t border-border space-y-4">
          <h4 className="text-sm font-bold text-foreground">Student Applications Overview</h4>
          {applicationsQuery.isLoading ? (
            <Skeleton className="h-16 w-full animate-pulse" />
          ) : (applicationsQuery.data ?? []).length === 0 ? (
            <p className="text-xs text-muted-foreground">No student applications submitted on-chain yet.</p>
          ) : (
            <div className="space-y-2">
              {(applicationsQuery.data ?? []).map((app) => (
                <div key={app.id} className="p-3 border border-border rounded-lg bg-card flex items-center justify-between text-xs">
                  <div>
                    <span className="font-bold text-foreground">App #{app.id}</span> · Scholarship #{app.scholarshipId}
                    <p className="text-[10px] text-muted-foreground font-mono">Student: {app.studentId}</p>
                  </div>
                  <span
                    className={`px-2 py-0.5 rounded-full text-[10px] font-bold border ${
                      app.status === "approved"
                        ? "bg-emerald-50 text-emerald-700 border-emerald-200"
                        : app.status === "rejected"
                        ? "bg-rose-50 text-rose-700 border-rose-200"
                        : "bg-amber-50 text-amber-700 border-amber-200"
                    }`}
                  >
                    {app.status.toUpperCase()}
                  </span>
                </div>
              ))}
            </div>
          )}
        </div>
      </div>
    );
  };

  const renderContentView = () => {
    switch (activeTab) {
      case "operations":
        return <OperationsCenter />;
      case "queue":
        return renderQueue();
      case "universities":
        return renderUniversitiesList();
      case "scholarships":
        return renderScholarshipsList();
      case "activity":
        return renderActivityFeed();
      case "settings":
        return <SettingsView />;
      case "overview":
      default:
        return renderOverview();
    }
  };

  return (
    <div className="flex h-dvh w-full bg-background text-foreground overflow-hidden">
      {/* Sidebar */}
      <nav className="hidden md:flex flex-col w-64 bg-card border-r border-border h-full fixed left-0 top-0 py-6 px-4 z-40">
        <div className="flex items-center gap-3 mb-8 px-2">
          <Image
            src="/icon.png"
            alt="CampusChain Logo"
            width={40}
            height={40}
            className="w-10 h-10 rounded-xl object-contain dark:invert transition-[filter] duration-150"
          />
          <div>
            <h1 className="text-lg font-bold leading-tight">CampusChain</h1>
            <p className="text-xs text-muted-foreground">Platform Admin</p>
          </div>
        </div>

        <div className="flex-1 space-y-1">
          {[
            { value: "operations", label: "Operations Center", icon: LayoutDashboard },
            { value: "overview", label: "Overview", icon: LayoutDashboard },
            { value: "queue", label: "Approval Queue", icon: Clock3 },
            { value: "universities", label: "Universities", icon: Building2 },
            { value: "scholarships", label: "Scholarships", icon: GraduationCap },
            { value: "activity", label: "Activity Feed", icon: History },
          ].map((item) => {
            const Icon = item.icon;
            const isActive = activeTab === item.value;
            return (
              <button
                key={item.value}
                onClick={() => router.push(`/${role}/${item.value}`)}
                className={`w-full flex items-center gap-3 px-3 py-2.5 rounded-lg text-sm transition-all text-left cursor-pointer ${
                  isActive
                    ? "text-foreground font-bold border-l-2 border-foreground rounded-none"
                    : "text-muted-foreground hover:text-foreground font-medium"
                }`}
              >
                <Icon className="h-4 w-4" />
                <span>{item.label}</span>
              </button>
            );
          })}
        </div>

        <div className="border-t border-border pt-4 mt-auto">
          <button
            onClick={() => router.push(`/${role}/settings`)}
            className={`w-full flex items-center gap-3 px-3 py-2.5 rounded-lg text-sm text-left transition-all cursor-pointer ${
              activeTab === "settings"
                ? "text-foreground font-bold border-l-2 border-foreground rounded-none"
                : "text-muted-foreground hover:text-foreground font-medium"
            }`}
          >
            <Settings className="h-4 w-4" />
            <span>Settings</span>
          </button>
        </div>
      </nav>

      {/* Main Content */}
      <div className="flex-1 md:ml-64 flex flex-col h-full overflow-hidden">
        <header className="flex justify-between items-center h-16 border-b border-border bg-card px-4 md:px-6 sticky top-0 z-30 shrink-0">
          <div className="flex items-center gap-2.5">
            <Image
              src="/icon.png"
              alt="CampusChain Logo"
              width={28}
              height={28}
              className="h-7 w-7 rounded-lg object-contain md:hidden dark:invert transition-[filter] duration-150"
            />
            <h2 className="text-lg md:text-xl font-bold capitalize">
              {activeTab === "queue" ? "Approval Requests" : activeTab}
            </h2>
            <span className="px-2.5 py-0.5 rounded-full bg-emerald-500/10 text-emerald-600 dark:text-emerald-400 text-[10px] font-bold border border-emerald-500/20">
              Platform Admin
            </span>
          </div>

          <div className="flex items-center gap-3 md:gap-4">
            <ThemeToggle variant="compact" />
            <button
              onClick={() => setIsFeedOpen(true)}
              className="text-muted-foreground hover:text-foreground p-2 rounded-full hover:bg-muted transition-colors relative cursor-pointer"
              aria-label="Open activity feed"
            >
              <Bell className="h-5 w-5" />
              {unreadCount > 0 && (
                <span className="absolute -top-0.5 -right-0.5 min-w-[18px] h-[18px] rounded-full bg-primary text-primary-foreground text-[9px] font-bold flex items-center justify-center px-1">
                  {unreadCount > 99 ? "99" : unreadCount}
                </span>
              )}
            </button>
            <div className="flex items-center gap-2 md:gap-3">
              <div className="w-8 h-8 rounded-full bg-muted flex items-center justify-center text-xs font-bold text-foreground">
                PA
              </div>
              <button onClick={disconnect} className="text-xs text-muted-foreground hover:text-destructive transition-colors font-medium cursor-pointer">
                Logout
              </button>
            </div>
          </div>
        </header>

        <main className="flex-1 overflow-y-auto p-4 md:p-6 pb-24 md:pb-6 bg-background transition-colors">
          {renderContentView()}
        </main>
      </div>

      <NotificationPanel isOpen={isFeedOpen} onClose={() => setIsFeedOpen(false)} />
    </div>
  );
}
export default PlatformDashboard;
