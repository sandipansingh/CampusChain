"use client";

import { useState, useEffect } from "react";
import { useWallet } from "@/shared/stellar/useWallet";
import { Skeleton } from "@/shared/ui/Skeleton";
import { NotificationPanel } from "@/shared/ui/NotificationPanel";
import {
  LayoutDashboard,
  Users,
  GraduationCap,
  Store,
  Calendar,
  Settings,
  Bell,
  CheckCircle2,
  XCircle,
  ClipboardList,
} from "lucide-react";

import {
  useCampusProfile,
  useUniversityProfiles,
  useVerifyProfileMutation,
  useRejectProfileMutation,
} from "@/features/wallet/hooks/useWallet";
import {
  useScholarshipPrograms,
  useScholarshipApplications,
  useCreateScholarshipProgramMutation,
  useReviewScholarshipApplicationMutation,
  useDisburseScholarshipMutation,
} from "@/features/scholarships/hooks/useScholarships";
import { Settings as SettingsView } from "./Settings";

import { useNotificationStore } from "@/shared/hooks/useNotificationStore";

export function UniversityDashboard() {
  const { address, disconnect } = useWallet();
  const [activeTab, setActiveTab] = useState<string>("overview");
  const [isFeedOpen, setIsFeedOpen] = useState(false);
  const unreadCount = useNotificationStore((s) => s.unreadCount);

  // Scholarship form state
  const [progName, setProgName] = useState("");
  const [progAmount, setProgAmount] = useState("");
  const [progMinGpa, setProgMinGpa] = useState("");

  const { data: profile } = useCampusProfile(address);
  const universityCode = profile?.universityCode ?? "";

  const { data: members = [], isLoading: isLoadingMembers } = useUniversityProfiles(universityCode);

  // Scholarships data
  const { data: programs = [], isLoading: isLoadingProgs } = useScholarshipPrograms(address ?? undefined);
  const { data: applications = [], isLoading: isLoadingApps } = useScholarshipApplications(address ?? undefined);

  // Mutations
  const verifyProfile = useVerifyProfileMutation();
  const rejectProfile = useRejectProfileMutation();
  const createProgram = useCreateScholarshipProgramMutation();
  const reviewApp = useReviewScholarshipApplicationMutation();
  const disburseSch = useDisburseScholarshipMutation();

  const pendingRequests = members.filter((m) => m.verificationStatus === 1);
  const verifiedMembers = members.filter((m) => m.verificationStatus === 2);
  const universityMerchants = verifiedMembers.filter((m) => m.role === 2);

  const handleCreateProgram = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!address || !progName || !progAmount || !progMinGpa) return;
    try {
      await createProgram.mutateAsync({
        admin: address,
        name: progName,
        amount: Number(progAmount),
        minGpa: Number(progMinGpa) * 100, // convert e.g. 3.50 to 350
      });
      setProgName("");
      setProgAmount("");
      setProgMinGpa("");
    } catch (err) {
      console.error(err);
    }
  };

  const renderOverview = () => {
    return (
      <div className="space-y-6">
        <div className="grid grid-cols-1 md:grid-cols-4 gap-6">
          {[
            { label: "Total Members", value: verifiedMembers.length, icon: Users },
            { label: "Pending Approvals", value: pendingRequests.length, icon: ClipboardList },
            { label: "Verified Merchants", value: universityMerchants.length, icon: Store },
            { label: "Scholarship Programs", value: programs.length, icon: GraduationCap },
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

        {/* Recent Verification Requests Preview */}
        <div className="bg-card rounded-xl border border-border shadow-sm overflow-hidden p-6">
          <h3 className="text-base font-bold mb-4">Pending Approvals Queue</h3>
          {pendingRequests.length === 0 ? (
            <p className="text-sm text-muted-foreground">No pending member verification requests.</p>
          ) : (
            <div className="space-y-3">
              {pendingRequests.slice(0, 3).map((r) => (
                <div key={r.address} className="flex flex-col sm:flex-row sm:items-center sm:justify-between p-4 border border-border rounded-lg gap-4 bg-muted/20">
                  <div>
                    <p className="font-semibold text-sm">{r.fullName}</p>
                    <p className="text-xs text-muted-foreground font-mono">{r.address}</p>
                  </div>
                  <div className="flex gap-2">
                    <button
                      onClick={() => verifyProfile.mutate({ caller: address!, targetAddress: r.address })}
                      className="px-3 py-1.5 bg-emerald-600 hover:bg-emerald-700 text-white rounded-lg text-xs font-bold flex items-center gap-1"
                    >
                      <CheckCircle2 className="size-3.5" /> Approve
                    </button>
                    <button
                      onClick={() => rejectProfile.mutate({ caller: address!, targetAddress: r.address })}
                      className="px-3 py-1.5 border border-border hover:bg-muted text-red-600 rounded-lg text-xs font-bold flex items-center gap-1"
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

  const renderRequests = () => {
    return (
      <div className="bg-card rounded-xl border border-border shadow-sm p-6 space-y-4">
        <h3 className="text-lg font-bold">Verification Requests</h3>
        <p className="text-xs text-muted-foreground">Pending student, merchant, and organizer registrations for code: {universityCode}</p>
        {isLoadingMembers ? (
          <Skeleton className="h-40 w-full" />
        ) : pendingRequests.length === 0 ? (
          <p className="text-sm text-muted-foreground py-6 text-center">No pending verification requests.</p>
        ) : (
          <div className="space-y-3">
            {pendingRequests.map((r) => {
              const isVerifyPending = verifyProfile.isPending && verifyProfile.variables?.targetAddress === r.address;
              const isRejectPending = rejectProfile.isPending && rejectProfile.variables?.targetAddress === r.address;
              const hasVerifyError = verifyProfile.isError && verifyProfile.variables?.targetAddress === r.address;
              const hasRejectError = rejectProfile.isError && rejectProfile.variables?.targetAddress === r.address;

              return (
                <div key={r.address} className="flex flex-col p-4 border border-border rounded-lg gap-3 bg-muted/10">
                  <div className="flex flex-col sm:flex-row sm:items-center sm:justify-between gap-4">
                    <div>
                      <div className="flex items-center gap-2">
                        <p className="font-semibold text-sm">{r.fullName}</p>
                        <span className="px-2 py-0.5 rounded-full bg-primary/10 text-primary text-[10px] font-bold">
                          {r.role === 1 ? "Student" : r.role === 2 ? "Merchant" : "Organizer"}
                        </span>
                      </div>
                      <p className="text-xs text-muted-foreground font-mono mt-1">{r.address}</p>
                      
                      {/* Role-Specific Metadata */}
                      {r.role === 1 && (
                        <p className="text-xs text-muted-foreground mt-1 bg-muted/30 p-1.5 rounded font-medium">
                          🎓 Dept: {String(r.details?.department || "N/A")} | Program: {String(r.details?.program || "N/A")} | Class: {String(r.details?.graduationYear || "N/A")}
                        </p>
                      )}
                      {r.role === 2 && (
                        <p className="text-xs text-muted-foreground mt-1 bg-muted/30 p-1.5 rounded font-medium">
                          🏪 Business: {String(r.details?.businessName || "N/A")} | Description: {String(r.details?.businessDescription || "N/A")}
                        </p>
                      )}
                      {r.role === 3 && (
                        <p className="text-xs text-muted-foreground mt-1 bg-muted/30 p-1.5 rounded font-medium">
                          📣 Organization: {String(r.details?.organizationName || "N/A")} | Desc: {String(r.details?.organizationDescription || "N/A")}
                        </p>
                      )}
                      
                      <p className="text-[10px] text-muted-foreground mt-1.5">Submitted: {new Date(Number(r.createdAt) * 1000).toLocaleString()}</p>
                    </div>
                    <div className="flex gap-2 shrink-0">
                      <button
                        disabled={verifyProfile.isPending || rejectProfile.isPending}
                        onClick={() => verifyProfile.mutate({ caller: address!, targetAddress: r.address })}
                        className="px-3 py-1.5 bg-emerald-600 hover:bg-emerald-700 text-white rounded-lg text-xs font-bold flex items-center gap-1.5 disabled:opacity-50 cursor-pointer h-9 transition-colors"
                      >
                        {isVerifyPending ? (
                          <span className="h-3 w-3 border-2 border-white border-t-transparent rounded-full animate-spin" />
                        ) : (
                          <CheckCircle2 className="size-3.5" />
                        )}
                        {isVerifyPending ? "Verifying..." : "Verify"}
                      </button>
                      <button
                        disabled={verifyProfile.isPending || rejectProfile.isPending}
                        onClick={() => rejectProfile.mutate({ caller: address!, targetAddress: r.address })}
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
                  {hasVerifyError && (
                    <p className="text-xs text-destructive bg-destructive/5 border border-destructive/20 p-2 rounded">
                      Error: {verifyProfile.error instanceof Error ? verifyProfile.error.message : "Verification transaction failed"}
                    </p>
                  )}
                  {hasRejectError && (
                    <p className="text-xs text-destructive bg-destructive/5 border border-destructive/20 p-2 rounded">
                      Error: {rejectProfile.error instanceof Error ? rejectProfile.error.message : "Rejection transaction failed"}
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

  const renderMembers = () => {
    return (
      <div className="bg-card rounded-xl border border-border shadow-sm p-6 space-y-4">
        <h3 className="text-lg font-bold">University Members</h3>
        {isLoadingMembers ? (
          <Skeleton className="h-40 w-full" />
        ) : verifiedMembers.length === 0 ? (
          <p className="text-sm text-muted-foreground py-6 text-center">No verified university members found.</p>
        ) : (
          <div className="overflow-x-auto">
            <table className="w-full text-left text-sm">
              <thead>
                <tr className="border-b border-border text-muted-foreground text-xs font-semibold">
                  <th className="py-3 px-4">Name</th>
                  <th className="py-3 px-4">Role</th>
                  <th className="py-3 px-4">Address</th>
                </tr>
              </thead>
              <tbody className="divide-y divide-border">
                {verifiedMembers.map((m) => (
                  <tr key={m.address} className="hover:bg-muted/30">
                    <td className="py-3 px-4 font-medium">{m.fullName}</td>
                    <td className="py-3 px-4">
                      {m.role === 1 ? "Student" : m.role === 2 ? "Merchant" : m.role === 3 ? "Organizer" : "Admin"}
                    </td>
                    <td className="py-3 px-4 font-mono text-xs text-muted-foreground">{m.address}</td>
                  </tr>
                ))}
              </tbody>
            </table>
          </div>
        )}
      </div>
    );
  };

  const renderScholarships = () => {
    return (
      <div className="space-y-6">
        {/* Create Scholarship Program Form */}
        <div className="bg-card rounded-xl border border-border shadow-sm p-6">
          <h3 className="text-base font-bold mb-4">Create Scholarship Program</h3>
          <form onSubmit={handleCreateProgram} className="grid grid-cols-1 md:grid-cols-4 gap-4 items-end">
            <div>
              <label className="block text-xs font-semibold mb-1">Program Name</label>
              <input
                type="text"
                required
                value={progName}
                onChange={(e) => setProgName(e.target.value)}
                placeholder="e.g. Dean's List Award"
                className="w-full bg-background border border-border rounded-lg px-3 py-2 text-sm focus:outline-none focus:border-foreground animate-none"
              />
            </div>
            <div>
              <label className="block text-xs font-semibold mb-1">Amount (CAMP)</label>
              <input
                type="number"
                required
                value={progAmount}
                onChange={(e) => setProgAmount(e.target.value)}
                placeholder="e.g. 500"
                className="w-full bg-background border border-border rounded-lg px-3 py-2 text-sm focus:outline-none focus:border-foreground animate-none"
              />
            </div>
            <div>
              <label className="block text-xs font-semibold mb-1">Min GPA (e.g. 3.5)</label>
              <input
                type="number"
                step="0.01"
                required
                value={progMinGpa}
                onChange={(e) => setProgMinGpa(e.target.value)}
                placeholder="e.g. 3.50"
                className="w-full bg-background border border-border rounded-lg px-3 py-2 text-sm focus:outline-none focus:border-foreground animate-none"
              />
            </div>
            <button
              type="submit"
              disabled={createProgram.isPending}
              className="bg-zinc-950 hover:bg-zinc-800 text-white font-semibold rounded-lg py-2.5 px-4 text-xs cursor-pointer disabled:opacity-50 h-10"
            >
              {createProgram.isPending ? "Creating..." : "Create Program"}
            </button>
          </form>
        </div>

        {/* Programs List */}
        <div className="bg-card rounded-xl border border-border shadow-sm p-6">
          <h3 className="text-base font-bold mb-4">Scholarship Programs</h3>
          {isLoadingProgs ? (
            <Skeleton className="h-20 w-full" />
          ) : programs.length === 0 ? (
            <p className="text-sm text-muted-foreground">No scholarship programs created yet.</p>
          ) : (
            <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
              {programs.map((p) => (
                <div key={p.id} className="p-4 border border-border rounded-lg space-y-2 bg-muted/15">
                  <div className="flex justify-between items-center">
                    <h4 className="font-bold text-sm">{p.name}</h4>
                    <span className="px-2 py-0.5 rounded-full bg-emerald-100 text-emerald-800 text-[10px] font-bold border border-emerald-200">
                      Active
                    </span>
                  </div>
                  <p className="text-xs text-muted-foreground">
                    Award: <strong className="text-foreground">{p.amount.toLocaleString()} CAMP</strong> · Min GPA: <strong className="text-foreground">{(p.min_gpa / 100).toFixed(2)}</strong>
                  </p>
                </div>
              ))}
            </div>
          )}
        </div>

        {/* Applications List */}
        <div className="bg-card rounded-xl border border-border shadow-sm p-6">
          <h3 className="text-base font-bold mb-4">Scholarship Applications</h3>
          {isLoadingApps ? (
            <Skeleton className="h-20 w-full" />
          ) : applications.length === 0 ? (
            <p className="text-sm text-muted-foreground">No applications submitted yet.</p>
          ) : (
            <div className="space-y-3">
              {applications.map((app) => (
                <div key={app.id} className="flex flex-col sm:flex-row sm:items-center sm:justify-between p-4 border border-border rounded-lg gap-4 bg-muted/5">
                  <div>
                    <p className="text-xs text-muted-foreground">App #{app.id} for Program #{app.program_id}</p>
                    <p className="text-sm font-semibold mt-1">Applicant: <span className="font-mono text-xs">{app.applicant}</span></p>
                    <p className="text-xs text-muted-foreground mt-0.5">GPA: {(app.gpa / 100).toFixed(2)} · Status: <strong>{app.status === 0 ? "Pending" : app.status === 1 ? "Approved" : app.status === 2 ? "Denied" : "Disbursed"}</strong></p>
                  </div>
                  <div className="flex gap-2">
                    {app.status === 0 && (
                      <>
                        <button
                          onClick={() => reviewApp.mutate({ admin: address!, applicationId: app.id, approved: true })}
                          className="px-2.5 py-1.5 bg-emerald-600 hover:bg-emerald-700 text-white rounded-lg text-xs font-bold"
                        >
                          Approve
                        </button>
                        <button
                          onClick={() => reviewApp.mutate({ admin: address!, applicationId: app.id, approved: false })}
                          className="px-2.5 py-1.5 border border-border hover:bg-muted text-red-600 rounded-lg text-xs font-bold"
                        >
                          Deny
                        </button>
                      </>
                    )}
                    {app.status === 1 && (
                      <button
                        onClick={() => disburseSch.mutate({ admin: address!, applicationId: app.id })}
                        className="px-3 py-1.5 bg-zinc-950 hover:bg-zinc-800 text-white rounded-lg text-xs font-bold"
                      >
                        Disburse Funds
                      </button>
                    )}
                  </div>
                </div>
              ))}
            </div>
          )}
        </div>
      </div>
    );
  };

  const renderMerchants = () => {
    return (
      <div className="bg-card rounded-xl border border-border shadow-sm p-6 space-y-4">
        <h3 className="text-lg font-bold">Onboarded Merchants</h3>
        {isLoadingMembers ? (
          <Skeleton className="h-40 w-full" />
        ) : universityMerchants.length === 0 ? (
          <p className="text-sm text-muted-foreground py-6 text-center">No verified university merchants found.</p>
        ) : (
          <div className="space-y-4">
            {universityMerchants.map((m) => (
              <div key={m.address} className="p-4 border border-border rounded-lg bg-muted/10 space-y-2">
                <div className="flex justify-between items-center">
                  <h4 className="font-bold text-sm">{m.fullName}</h4>
                  <span className="px-2 py-0.5 rounded-full bg-primary/10 text-primary text-[10px] font-bold border border-primary/20">
                    Merchant
                  </span>
                </div>
                <p className="text-xs text-muted-foreground font-mono">{m.address}</p>
              </div>
            ))}
          </div>
        )}
      </div>
    );
  };

  const renderEvents = () => {
    return (
      <div className="bg-card rounded-xl border border-border shadow-sm p-6 space-y-4">
        <h3 className="text-lg font-bold">Events Oversight</h3>
        <p className="text-sm text-muted-foreground">List of all events created by university organizers.</p>
        <p className="text-xs text-muted-foreground mt-4 py-8 text-center bg-muted/20 border border-border border-dashed rounded-lg">
          Oversight features will scale automatically with organizer activity.
        </p>
      </div>
    );
  };

  const renderContentView = () => {
    switch (activeTab) {
      case "requests":
        return renderRequests();
      case "members":
        return renderMembers();
      case "scholarships":
        return renderScholarships();
      case "merchants":
        return renderMerchants();
      case "events":
        return renderEvents();
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
            UA
          </div>
          <div>
            <h1 className="text-lg font-bold leading-tight">CampusChain</h1>
            <p className="text-xs text-muted-foreground">University Admin</p>
          </div>
        </div>

        <div className="flex-1 space-y-1">
          {[
            { value: "overview", label: "Overview", icon: LayoutDashboard },
            { value: "requests", label: "Approvals Queue", icon: ClipboardList },
            { value: "members", label: "Members", icon: Users },
            { value: "scholarships", label: "Scholarships", icon: GraduationCap },
            { value: "merchants", label: "Merchants", icon: Store },
            { value: "events", label: "Events Oversight", icon: Calendar },
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
            <span className="px-2.5 py-0.5 rounded-full bg-zinc-100 text-zinc-800 text-[10px] font-bold border border-zinc-200">
              Admin: {universityCode}
            </span>
          </div>

          <div className="flex items-center gap-3 md:gap-6">
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
              <div className="w-8 h-8 rounded-full bg-muted flex items-center justify-center text-xs font-bold">
                UA
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

      <NotificationPanel isOpen={isFeedOpen} onClose={() => setIsFeedOpen(false)} />
    </div>
  );
}
export default UniversityDashboard;
