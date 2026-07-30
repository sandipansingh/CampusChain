"use client";

import { useState, useEffect } from "react";
import { useWallet } from "@/shared/stellar/useWallet";
import { Skeleton } from "@/shared/ui/Skeleton";
import {
  LayoutDashboard,
  Building2,
  Clock3,
  CheckCircle2,
  XCircle,
  Settings,
  Coins,
} from "lucide-react";

import { useQuery, useMutation, useQueryClient } from "@tanstack/react-query";
import {
  executeApproveUniversity,
  executeRejectUniversity,
  executeSuspendUniversity,
  fetchUniversities,
} from "@/features/wallet/service/campusIdentity";
import { useLedgerEvents } from "@/features/transactions/hooks/useTransactions";
import { Settings as SettingsView } from "./Settings";

export function PlatformDashboard() {
  const { address, disconnect } = useWallet();
  const [activeTab, setActiveTab] = useState<string>("overview");
  const queryClient = useQueryClient();

  useEffect(() => {
    const handleNavigate = (e: Event) => {
      const customEvent = e as CustomEvent<string>;
      if (customEvent.detail) {
        setActiveTab(customEvent.detail);
      }
    };
    window.addEventListener("campuschain:navigate", handleNavigate);
    return () => window.removeEventListener("campuschain:navigate", handleNavigate);
  }, []);

  // Fetch data
  const universitiesQuery = useQuery({
    queryKey: ["universities"],
    queryFn: () => fetchUniversities(address ?? undefined),
    refetchInterval: 20000,
  });
  const ledgerEventsQuery = useLedgerEvents();

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
    return (
      <div className="space-y-6">
        <div className="grid grid-cols-1 md:grid-cols-3 gap-6">
          {[
            { label: "Registered Universities", value: universities.length, icon: Building2 },
            { label: "Pending Approvals", value: pendingUniversities.length, icon: Clock3 },
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
        <div className="bg-card rounded-xl border border-border shadow-sm p-6">
          <h3 className="text-base font-bold mb-4">University Claims Awaiting Review</h3>
          {pendingUniversities.length === 0 ? (
            <p className="text-sm text-muted-foreground">No universities awaiting approval.</p>
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
      </div>
    );
  };

  const renderQueue = () => {
    return (
      <div className="bg-card rounded-xl border border-border shadow-sm p-6 space-y-4">
        <h3 className="text-lg font-bold">University Approval Requests</h3>
        {universitiesQuery.isLoading ? (
          <Skeleton className="h-40 w-full" />
        ) : pendingUniversities.length === 0 ? (
          <p className="text-sm text-muted-foreground py-6 text-center">No pending approvals in queue.</p>
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
    const events = ledgerEventsQuery.data ?? [];
    return (
      <div className="bg-card rounded-xl border border-border shadow-sm p-6 space-y-4">
        <h3 className="text-lg font-bold">Cross-University Activity Feed</h3>
        {ledgerEventsQuery.isLoading ? (
          <Skeleton className="h-40 w-full" />
        ) : events.length === 0 ? (
          <p className="text-sm text-muted-foreground py-6 text-center">No platform-wide events found.</p>
        ) : (
          <div className="divide-y divide-border">
            {events.map((evt) => (
              <div key={evt.id} className="py-3 flex items-center justify-between hover:bg-muted/10 px-2 rounded-lg text-xs">
                <div className="flex items-center gap-4 min-w-0">
                  <div className="w-8 h-8 rounded-full bg-muted flex items-center justify-center shrink-0">
                    <Building2 className="h-4 w-4" />
                  </div>
                  <div className="min-w-0">
                    <p className="font-bold text-foreground truncate">{evt.title}</p>
                    <p className="text-muted-foreground truncate">{evt.message}</p>
                  </div>
                </div>
                <div className="text-right shrink-0">
                  <p className="font-bold text-foreground">{evt.details}</p>
                  <p className="text-[10px] text-muted-foreground mt-0.5">{evt.timestamp}</p>
                </div>
              </div>
            ))}
          </div>
        )}
      </div>
    );
  };

  const renderContentView = () => {
    switch (activeTab) {
      case "queue":
        return renderQueue();
      case "universities":
        return renderUniversitiesList();
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
    <div className="flex h-screen w-full bg-background text-foreground overflow-hidden">
      {/* Sidebar */}
      <nav className="hidden md:flex flex-col w-64 bg-card border-r border-border h-full fixed left-0 top-0 py-6 px-4 z-40">
        <div className="flex items-center gap-3 mb-8 px-2">
          <div className="w-10 h-10 rounded-full bg-muted flex items-center justify-center font-semibold text-foreground">
            PA
          </div>
          <div>
            <h1 className="text-lg font-bold leading-tight">CampusChain</h1>
            <p className="text-xs text-muted-foreground">Platform Admin</p>
          </div>
        </div>

        <div className="flex-1 space-y-1">
          {[
            { value: "overview", label: "Overview", icon: LayoutDashboard },
            { value: "queue", label: "Approval Queue", icon: Clock3 },
            { value: "universities", label: "Universities", icon: Building2 },
            { value: "activity", label: "Activity Feed", icon: Coins },
          ].map((item) => {
            const Icon = item.icon;
            const isActive = activeTab === item.value;
            return (
              <button
                key={item.value}
                onClick={() => setActiveTab(item.value)}
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
            onClick={() => setActiveTab("settings")}
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
          <div className="flex items-center gap-2">
            <h2 className="text-lg md:text-xl font-bold capitalize">{activeTab}</h2>
            <span className="px-2.5 py-0.5 rounded-full bg-emerald-100 text-emerald-800 text-[10px] font-bold border border-emerald-200">
              Platform Admin
            </span>
          </div>

          <div className="flex items-center gap-3 md:gap-6">
            <div className="flex items-center gap-2 md:gap-3">
              <div className="w-8 h-8 rounded-full bg-muted flex items-center justify-center text-xs font-bold">
                PA
              </div>
              <button onClick={disconnect} className="text-xs text-muted-foreground hover:text-destructive transition-colors font-medium">
                Logout
              </button>
            </div>
          </div>
        </header>

        <main className="flex-1 overflow-y-auto p-4 md:p-6 pb-24 md:pb-6 bg-[#F7F7F5]">
          {renderContentView()}
        </main>
      </div>
    </div>
  );
}
export default PlatformDashboard;
