"use client";

import { useMemo, useState } from "react";
import { useMutation, useQueryClient } from "@tanstack/react-query";
import {
  Activity,
  AlertTriangle,
  ArrowUpRight,
  BarChart3,
  Building2,
  CheckCircle2,
  Clock3,
  Download,
  ExternalLink,
  GraduationCap,
  Landmark,
  LifeBuoy,
  ListFilter,
  RefreshCw,
  Search,
  ShieldCheck,
  Ticket,
  Users,
  XCircle,
} from "lucide-react";
import { useWallet } from "@/shared/stellar/useWallet";
import { Skeleton } from "@/shared/ui/Skeleton";
import {
  executeApproveUniversity,
  executeRejectUniversity,
} from "@/features/wallet/service/campusIdentity";
import {
  useAdminReviewScholarshipMutation,
} from "@/features/scholarships/hooks/useScholarships";
import {
  aggregateOperations,
  activityCategory,
  filterActivityEvents,
  formatUniversitiesCsv,
  universityStatusLabel,
} from "../aggregation";
import { useOperationsData } from "../hooks";
import type { ActivityCategory } from "../types";

const CATEGORY_OPTIONS: Array<{ value: ActivityCategory | "all"; label: string }> = [
  { value: "all", label: "All categories" },
  { value: "identity", label: "Identity & approvals" },
  { value: "payments", label: "Payments" },
  { value: "escrow", label: "Escrow" },
  { value: "events", label: "Events & tickets" },
  { value: "scholarships", label: "Scholarships" },
  { value: "marketplace", label: "Marketplace" },
  { value: "food", label: "Food ordering" },
  { value: "other", label: "Other" },
];

const CATEGORY_LABELS: Record<ActivityCategory, string> = Object.fromEntries(
  CATEGORY_OPTIONS.filter((option) => option.value !== "all").map((option) => [option.value, option.label])
) as Record<ActivityCategory, string>;

function formatNumber(value: number): string {
  return value.toLocaleString();
}

function formatCamp(value: number): string {
  return `${value.toLocaleString(undefined, { maximumFractionDigits: 2 })} CAMP`;
}

function StatusPill({ status }: { status: string }) {
  const normalized = status.toLowerCase();
  const color = normalized === "active" || normalized === "approved" || normalized === "verified"
    ? "border-emerald-500/20 bg-emerald-500/10 text-emerald-700 dark:text-emerald-300"
    : normalized === "pending"
    ? "border-amber-500/20 bg-amber-500/10 text-amber-700 dark:text-amber-300"
    : "border-rose-500/20 bg-rose-500/10 text-rose-700 dark:text-rose-300";
  return <span className={`inline-flex rounded-full border px-2 py-0.5 text-[10px] font-semibold ${color}`}>{status}</span>;
}

function MetricCard({ label, value, detail, icon: Icon }: { label: string; value: string; detail: string; icon: typeof Activity }) {
  return (
    <section className="rounded-xl border border-border bg-card p-5 shadow-sm">
      <div className="flex items-start justify-between gap-4">
        <div>
          <p className="text-xs font-medium text-muted-foreground">{label}</p>
          <p className="mt-2 text-2xl font-bold tabular-nums text-foreground">{value}</p>
          <p className="mt-1 text-[11px] text-muted-foreground">{detail}</p>
        </div>
        <div className="flex size-10 shrink-0 items-center justify-center rounded-lg bg-muted text-foreground">
          <Icon className="size-5" />
        </div>
      </div>
    </section>
  );
}

function ProgressRow({ label, value, total, tone = "bg-foreground" }: { label: string; value: number; total: number; tone?: string }) {
  const percent = total ? Math.round((value / total) * 100) : 0;
  return (
    <div className="space-y-1.5">
      <div className="flex items-center justify-between text-xs">
        <span className="text-muted-foreground">{label}</span>
        <span className="font-semibold tabular-nums text-foreground">{formatNumber(value)} <span className="font-normal text-muted-foreground">({percent}%)</span></span>
      </div>
      <div className="h-2 overflow-hidden rounded-full bg-muted">
        <div className={`h-full rounded-full ${tone}`} style={{ width: `${Math.min(100, percent)}%` }} />
      </div>
    </div>
  );
}

function LoadingState() {
  return (
    <div className="space-y-6" aria-label="Loading operations data">
      <div className="grid gap-4 md:grid-cols-2 xl:grid-cols-4">
        {[1, 2, 3, 4].map((item) => <Skeleton key={item} className="h-32 rounded-xl" />)}
      </div>
      <div className="grid gap-6 xl:grid-cols-3">
        <Skeleton className="h-72 rounded-xl xl:col-span-2" />
        <Skeleton className="h-72 rounded-xl" />
      </div>
      <Skeleton className="h-80 rounded-xl" />
    </div>
  );
}

function EmptyState({ onRefresh }: { onRefresh: () => void }) {
  return (
    <div className="rounded-xl border border-dashed border-border bg-card px-6 py-16 text-center shadow-sm">
      <Landmark className="mx-auto size-10 text-muted-foreground" />
      <h2 className="mt-4 text-lg font-semibold text-balance">No on-chain operations yet</h2>
      <p className="mx-auto mt-2 max-w-md text-sm text-pretty text-muted-foreground">
        The connected platform registry has not returned any universities, profiles, or service activity yet.
      </p>
      <button onClick={onRefresh} className="mt-5 inline-flex items-center gap-2 rounded-lg bg-foreground px-4 py-2 text-xs font-semibold text-background">
        <RefreshCw className="size-3.5" /> Refresh registry
      </button>
    </div>
  );
}

export function OperationsCenter() {
  const { address } = useWallet();
  const queryClient = useQueryClient();
  const operationsQuery = useOperationsData(address);
  const reviewScholarship = useAdminReviewScholarshipMutation();
  const [search, setSearch] = useState("");
  const [category, setCategory] = useState<ActivityCategory | "all">("all");
  const [universityFilter, setUniversityFilter] = useState("all");
  const [notice, setNotice] = useState<string | null>(null);

  const data = operationsQuery.data;
  const metrics = useMemo(() => data ? aggregateOperations(data) : null, [data]);
  const pendingUniversities = useMemo(
    () => data?.universities.filter((university) => university.approvalStatus === 1) ?? [],
    [data]
  );
  const pendingScholarships = useMemo(
    () => data?.scholarships.filter((scholarship) => scholarship.adminApprovalStatus === "pending") ?? [],
    [data]
  );
  const filteredUniversities = useMemo(() => {
    if (!metrics) return [];
    const query = search.trim().toLowerCase();
    return metrics.universities.filter((university) => {
      const matchesFilter = universityFilter === "all" || university.code === universityFilter;
      const matchesSearch = !query || `${university.name} ${university.code}`.toLowerCase().includes(query);
      return matchesFilter && matchesSearch;
    });
  }, [metrics, search, universityFilter]);
  const filteredActivity = useMemo(
    () => data ? filterActivityEvents(data.activity, search, category).slice(0, 12) : [],
    [data, search, category]
  );

  const approveUniversity = useMutation({
    mutationFn: (code: string) => executeApproveUniversity(address!, code),
    onSuccess: async () => {
      await queryClient.invalidateQueries({ queryKey: ["operations-center"] });
      await queryClient.invalidateQueries({ queryKey: ["universities"] });
      setNotice("University approval submitted.");
    },
  });
  const rejectUniversity = useMutation({
    mutationFn: (code: string) => executeRejectUniversity(address!, code),
    onSuccess: async () => {
      await queryClient.invalidateQueries({ queryKey: ["operations-center"] });
      await queryClient.invalidateQueries({ queryKey: ["universities"] });
      setNotice("University rejection submitted.");
    },
  });

  const runScholarshipReview = async (id: number, approved: boolean) => {
    try {
      setNotice(null);
      await reviewScholarship.mutateAsync({ adminId: address!, scholarshipId: id, approved });
      await queryClient.invalidateQueries({ queryKey: ["operations-center"] });
      setNotice(`Scholarship ${approved ? "approval" : "rejection"} submitted.`);
    } catch (error) {
      setNotice(error instanceof Error ? error.message : "Scholarship review failed.");
    }
  };

  const exportCsv = () => {
    if (!metrics || typeof document === "undefined") return;
    const blob = new Blob([formatUniversitiesCsv(metrics.universities)], { type: "text/csv;charset=utf-8" });
    const url = URL.createObjectURL(blob);
    const link = document.createElement("a");
    link.href = url;
    link.download = "campuschain-university-operations.csv";
    link.click();
    URL.revokeObjectURL(url);
  };

  if (operationsQuery.isLoading || !data) return <LoadingState />;

  const errorEntries = Object.entries(data.errors);
  const hasRecords = data.universities.length + data.profiles.length + data.scholarships.length + data.applications.length
    + data.events.length + data.escrows.length + data.listings.length + data.activity.length > 0;
  if (!hasRecords && errorEntries.length > 0) {
    return (
      <div className="rounded-xl border border-rose-500/20 bg-card px-6 py-12 text-center shadow-sm" role="alert">
        <AlertTriangle className="mx-auto size-10 text-rose-600" />
        <h2 className="mt-4 text-lg font-semibold text-balance">On-chain data is unavailable</h2>
        <p className="mx-auto mt-2 max-w-lg text-sm text-pretty text-muted-foreground">
          The Operations Center could not read the connected testnet contracts. Check the RPC connection and try again.
        </p>
        <p className="mt-3 text-xs text-rose-700 dark:text-rose-300">{errorEntries[0][1]}</p>
        <button onClick={() => void operationsQuery.refetch()} className="mt-5 inline-flex items-center gap-2 rounded-lg bg-foreground px-4 py-2 text-xs font-semibold text-background">
          <RefreshCw className="size-3.5" /> Retry reads
        </button>
      </div>
    );
  }

  if (!hasRecords && errorEntries.length === 0) return <EmptyState onRefresh={() => void operationsQuery.refetch()} />;
  if (!metrics) return null;

  const maxCategoryCount = Math.max(1, ...Object.values(metrics.activity.byCategory));

  return (
    <div className="mx-auto max-w-[1600px] space-y-6">
      <div className="flex flex-col justify-between gap-4 lg:flex-row lg:items-end">
        <div>
          <p className="text-xs font-semibold uppercase text-muted-foreground">Platform Admin / Control room</p>
          <h1 className="mt-1 text-2xl font-bold text-balance">Operations Center</h1>
          <p className="mt-1 max-w-2xl text-sm text-pretty text-muted-foreground">
            A live view of campus health, approval workload, and service activity across the deployed testnet contracts.
          </p>
        </div>
        <div className="flex flex-wrap items-center gap-2">
          <span className="mr-1 text-[11px] text-muted-foreground">Updated {new Date(data.loadedAt).toLocaleTimeString()}</span>
          <button
            onClick={() => void operationsQuery.refetch()}
            disabled={operationsQuery.isFetching}
            className="inline-flex items-center gap-2 rounded-lg border border-border bg-card px-3 py-2 text-xs font-semibold text-foreground hover:bg-muted disabled:opacity-60"
          >
            <RefreshCw className={`size-3.5 ${operationsQuery.isFetching ? "animate-spin" : ""}`} /> Refresh
          </button>
          <button onClick={exportCsv} className="inline-flex items-center gap-2 rounded-lg bg-foreground px-3 py-2 text-xs font-semibold text-background hover:opacity-90">
            <Download className="size-3.5" /> Export CSV
          </button>
        </div>
      </div>

      {errorEntries.length > 0 && (
        <div className="flex items-start gap-3 rounded-lg border border-amber-500/25 bg-amber-500/5 px-4 py-3 text-xs text-amber-800 dark:text-amber-200" role="status">
          <AlertTriangle className="mt-0.5 size-4 shrink-0" />
          <p><span className="font-semibold">Partial RPC read:</span> {errorEntries.length} data source{errorEntries.length === 1 ? "" : "s"} failed. Showing the sources that are available.</p>
        </div>
      )}

      {notice && (
        <div className="flex items-center justify-between gap-3 rounded-lg border border-border bg-card px-4 py-3 text-xs" role="status">
          <span className="truncate text-muted-foreground">{notice}</span>
          <button onClick={() => setNotice(null)} className="text-muted-foreground hover:text-foreground" aria-label="Dismiss operations notice">Dismiss</button>
        </div>
      )}

      <div className="grid gap-4 md:grid-cols-2 xl:grid-cols-4">
        <MetricCard label="Active universities" value={formatNumber(metrics.activeUniversities)} detail={`${formatNumber(metrics.totalUniversities)} registered total`} icon={Building2} />
        <MetricCard label="Profiles indexed" value={formatNumber(metrics.totalProfiles)} detail={`${formatNumber(metrics.profilesByVerification.Verified ?? 0)} verified identities`} icon={Users} />
        <MetricCard label="Approval workload" value={formatNumber(metrics.pendingApprovals.total)} detail={`${metrics.pendingApprovals.universities} university · ${metrics.pendingApprovals.scholarships} scholarship`} icon={Clock3} />
        <MetricCard label="Recent transactions" value={formatNumber(metrics.activity.recentTransactionVolume)} detail={`${formatNumber(metrics.activity.total)} decoded events loaded`} icon={Activity} />
      </div>

      <div className="grid gap-6 xl:grid-cols-3">
        <section className="rounded-xl border border-border bg-card p-5 shadow-sm xl:col-span-2">
          <div className="flex flex-col justify-between gap-2 sm:flex-row sm:items-start">
            <div>
              <h2 className="text-base font-semibold text-balance">Approval workload</h2>
              <p className="mt-1 text-xs text-muted-foreground">Review the queues that need platform attention.</p>
            </div>
            <span className="rounded-full bg-muted px-2.5 py-1 text-xs font-semibold tabular-nums">{metrics.pendingApprovals.total} pending</span>
          </div>
          <div className="mt-5 grid gap-5 lg:grid-cols-2">
            <div>
              <h3 className="flex items-center gap-2 text-xs font-semibold"><Building2 className="size-4" /> University registrations</h3>
              {pendingUniversities.length === 0 ? <p className="mt-3 text-xs text-muted-foreground">No university claims are waiting.</p> : (
                <div className="mt-3 space-y-2">
                  {pendingUniversities.slice(0, 4).map((university) => (
                    <div key={university.code} className="rounded-lg border border-border bg-muted/20 p-3">
                      <div className="flex items-start justify-between gap-3">
                        <div className="min-w-0"><p className="truncate text-xs font-semibold">{university.name}</p><p className="mt-0.5 font-mono text-[10px] text-muted-foreground">{university.code}</p></div>
                        <div className="flex shrink-0 gap-1.5">
                          <button onClick={() => approveUniversity.mutate(university.code)} disabled={approveUniversity.isPending || rejectUniversity.isPending} className="inline-flex items-center gap-1 rounded-md bg-emerald-600 px-2 py-1 text-[10px] font-semibold text-white disabled:opacity-50"><CheckCircle2 className="size-3" /> Approve</button>
                          <button onClick={() => rejectUniversity.mutate(university.code)} disabled={approveUniversity.isPending || rejectUniversity.isPending} className="inline-flex items-center gap-1 rounded-md border border-border px-2 py-1 text-[10px] font-semibold text-rose-700 dark:text-rose-300 disabled:opacity-50"><XCircle className="size-3" /> Reject</button>
                        </div>
                      </div>
                      {(approveUniversity.isError || rejectUniversity.isError) && (approveUniversity.variables === university.code || rejectUniversity.variables === university.code) && <p className="mt-2 text-[10px] text-rose-700 dark:text-rose-300">{(approveUniversity.error ?? rejectUniversity.error) instanceof Error ? (approveUniversity.error ?? rejectUniversity.error)?.message : "Transaction failed"}</p>}
                    </div>
                  ))}
                </div>
              )}
            </div>
            <div>
              <h3 className="flex items-center gap-2 text-xs font-semibold"><GraduationCap className="size-4" /> Scholarship programs</h3>
              {pendingScholarships.length === 0 ? <p className="mt-3 text-xs text-muted-foreground">No scholarship programs are waiting.</p> : (
                <div className="mt-3 space-y-2">
                  {pendingScholarships.slice(0, 4).map((scholarship) => (
                    <div key={scholarship.id} className="rounded-lg border border-border bg-muted/20 p-3">
                      <div className="flex items-start justify-between gap-3"><div className="min-w-0"><p className="truncate text-xs font-semibold">{scholarship.title}</p><p className="mt-0.5 text-[10px] text-muted-foreground">{formatCamp(scholarship.amount)} · {scholarship.slots} slots</p></div><span className="font-mono text-[10px] text-muted-foreground">#{scholarship.id}</span></div>
                      <div className="mt-2 flex gap-1.5"><button onClick={() => void runScholarshipReview(scholarship.id, true)} disabled={reviewScholarship.isPending} className="inline-flex items-center gap-1 rounded-md bg-emerald-600 px-2 py-1 text-[10px] font-semibold text-white disabled:opacity-50"><CheckCircle2 className="size-3" /> Approve</button><button onClick={() => void runScholarshipReview(scholarship.id, false)} disabled={reviewScholarship.isPending} className="inline-flex items-center gap-1 rounded-md border border-border px-2 py-1 text-[10px] font-semibold text-rose-700 dark:text-rose-300 disabled:opacity-50"><XCircle className="size-3" /> Reject</button></div>
                    </div>
                  ))}
                </div>
              )}
            </div>
          </div>
        </section>

        <section className="rounded-xl border border-border bg-card p-5 shadow-sm">
          <div className="flex items-start justify-between gap-3"><div><h2 className="text-base font-semibold text-balance">Verification health</h2><p className="mt-1 text-xs text-muted-foreground">Identity state across all indexed profiles.</p></div><ShieldCheck className="size-5 text-muted-foreground" /></div>
          <div className="mt-6 space-y-5">
            <ProgressRow label="Verified" value={metrics.profilesByVerification.Verified ?? 0} total={metrics.totalProfiles} tone="bg-emerald-600" />
            <ProgressRow label="Pending" value={metrics.profilesByVerification.Pending ?? 0} total={metrics.totalProfiles} tone="bg-amber-500" />
            <ProgressRow label="Rejected" value={metrics.profilesByVerification.Rejected ?? 0} total={metrics.totalProfiles} tone="bg-rose-500" />
          </div>
          <div className="mt-6 border-t border-border pt-4"><p className="text-[11px] font-semibold uppercase text-muted-foreground">Roles</p><div className="mt-3 flex flex-wrap gap-2">{Object.entries(metrics.profilesByRole).map(([role, count]) => <span key={role} className="rounded-md bg-muted px-2 py-1 text-[10px] text-muted-foreground">{role} <strong className="tabular-nums text-foreground">{count}</strong></span>)}</div></div>
        </section>
      </div>

      <div className="grid gap-6 xl:grid-cols-3">
        <section className="rounded-xl border border-border bg-card p-5 shadow-sm xl:col-span-2">
          <div className="flex flex-col justify-between gap-3 sm:flex-row sm:items-start"><div><h2 className="text-base font-semibold text-balance">Service health</h2><p className="mt-1 text-xs text-muted-foreground">Capacity, capital, and service records read from CampusService.</p></div><div className="flex items-center gap-2 text-xs text-muted-foreground"><Ticket className="size-4" /> {metrics.events.utilizationPercent}% ticket utilization</div></div>
          <div className="mt-5 grid gap-4 sm:grid-cols-2 xl:grid-cols-4">
            <div className="rounded-lg bg-muted/40 p-4"><p className="text-[11px] text-muted-foreground">Events</p><p className="mt-1 text-xl font-bold tabular-nums">{formatNumber(metrics.events.total)}</p><p className="mt-1 text-[10px] text-muted-foreground">{formatNumber(metrics.events.ticketsSold)} / {formatNumber(metrics.events.capacity)} tickets</p></div>
            <div className="rounded-lg bg-muted/40 p-4"><p className="text-[11px] text-muted-foreground">Escrow volume</p><p className="mt-1 text-xl font-bold tabular-nums">{formatCamp(metrics.escrows.volumeCamp)}</p><p className="mt-1 text-[10px] text-muted-foreground">{metrics.escrows.funded} funded · {metrics.escrows.released} released · {metrics.escrows.refunded} refunded</p></div>
            <div className="rounded-lg bg-muted/40 p-4"><p className="text-[11px] text-muted-foreground">Marketplace</p><p className="mt-1 text-xl font-bold tabular-nums">{formatNumber(metrics.listings.total)}</p><p className="mt-1 text-[10px] text-muted-foreground">{metrics.listings.active} active · {metrics.listings.sold} sold</p></div>
            <div className="rounded-lg bg-muted/40 p-4"><p className="text-[11px] text-muted-foreground">Scholarships</p><p className="mt-1 text-xl font-bold tabular-nums">{formatNumber(metrics.scholarships.total)}</p><p className="mt-1 text-[10px] text-muted-foreground">{metrics.scholarships.pending} pending · {metrics.applications.total} applications</p></div>
          </div>
          <div className="mt-5 grid gap-3 sm:grid-cols-2"><ProgressRow label="Ticket utilization" value={metrics.events.ticketsSold} total={metrics.events.capacity} tone="bg-foreground" /><ProgressRow label="Funded escrow share" value={metrics.escrows.funded} total={metrics.escrows.total} tone="bg-amber-500" /></div>
        </section>
        <section className="rounded-xl border border-border bg-card p-5 shadow-sm"><div className="flex items-start justify-between gap-3"><div><h2 className="text-base font-semibold text-balance">Activity mix</h2><p className="mt-1 text-xs text-muted-foreground">Decoded Soroban events by category.</p></div><BarChart3 className="size-5 text-muted-foreground" /></div><div className="mt-5 space-y-3">{Object.entries(metrics.activity.byCategory).map(([key, count]) => <div key={key} className="flex items-center gap-3"><span className="w-28 truncate text-[11px] text-muted-foreground">{CATEGORY_LABELS[key as ActivityCategory]}</span><div className="h-2 flex-1 overflow-hidden rounded-full bg-muted"><div className="h-full rounded-full bg-foreground" style={{ width: `${(count / maxCategoryCount) * 100}%` }} /></div><span className="w-7 text-right text-[11px] font-semibold tabular-nums">{count}</span></div>)}</div></section>
      </div>

      <section className="rounded-xl border border-border bg-card shadow-sm">
        <div className="flex flex-col justify-between gap-4 border-b border-border p-5 lg:flex-row lg:items-start"><div><h2 className="text-base font-semibold text-balance">University operations</h2><p className="mt-1 text-xs text-muted-foreground">Campus-level visibility for registry, identity, service, and capital activity.</p></div><div className="flex flex-col gap-2 sm:flex-row"><div className="relative"><Search className="pointer-events-none absolute left-3 top-1/2 size-3.5 -translate-y-1/2 text-muted-foreground" /><input value={search} onChange={(event) => setSearch(event.target.value)} placeholder="Search universities or activity" className="h-9 w-full rounded-lg border border-border bg-background pl-9 pr-3 text-xs outline-none focus:ring-1 focus:ring-ring sm:w-64" /></div><select value={universityFilter} onChange={(event) => setUniversityFilter(event.target.value)} className="h-9 rounded-lg border border-border bg-background px-3 text-xs outline-none focus:ring-1 focus:ring-ring"><option value="all">All universities</option>{metrics.universities.map((university) => <option key={university.code} value={university.code}>{university.code}</option>)}</select></div></div>
        {filteredUniversities.length === 0 ? <p className="p-8 text-center text-xs text-muted-foreground">No universities match the current search.</p> : <div className="overflow-x-auto"><table className="w-full min-w-[900px] text-left text-xs"><thead><tr className="border-b border-border text-[10px] uppercase text-muted-foreground"><th className="px-5 py-3 font-semibold">University</th><th className="px-3 py-3 font-semibold">Status</th><th className="px-3 py-3 text-right font-semibold">Profiles</th><th className="px-3 py-3 text-right font-semibold">Scholarships</th><th className="px-3 py-3 text-right font-semibold">Events</th><th className="px-3 py-3 text-right font-semibold">Tickets</th><th className="px-3 py-3 text-right font-semibold">Listings</th><th className="px-3 py-3 text-right font-semibold">Escrow</th></tr></thead><tbody className="divide-y divide-border">{filteredUniversities.map((university) => <tr key={university.code} className="hover:bg-muted/30"><td className="px-5 py-3"><p className="font-semibold">{university.name}</p><p className="mt-0.5 font-mono text-[10px] text-muted-foreground">{university.code}</p></td><td className="px-3 py-3"><StatusPill status={universityStatusLabel(university.approvalStatus)} /></td><td className="px-3 py-3 text-right tabular-nums">{university.profileCount}<span className="ml-1 text-[10px] text-muted-foreground">({university.pendingProfileCount} pending)</span></td><td className="px-3 py-3 text-right tabular-nums">{university.scholarshipCount}</td><td className="px-3 py-3 text-right tabular-nums">{university.eventCount}</td><td className="px-3 py-3 text-right tabular-nums">{university.ticketsSold} / {university.eventCapacity}</td><td className="px-3 py-3 text-right tabular-nums">{university.listingCount}</td><td className="px-3 py-3 text-right tabular-nums">{formatCamp(university.escrowVolumeCamp)}</td></tr>)}</tbody></table></div>}
        <div className="flex justify-end border-t border-border p-4"><button onClick={exportCsv} className="inline-flex items-center gap-2 text-xs font-semibold text-muted-foreground hover:text-foreground"><Download className="size-3.5" /> Download university CSV <ArrowUpRight className="size-3.5" /></button></div>
      </section>

      <section className="rounded-xl border border-border bg-card p-5 shadow-sm">
        <div className="flex flex-col justify-between gap-3 sm:flex-row sm:items-start">
          <div><h2 className="text-base font-semibold text-balance">Recent on-chain activity</h2><p className="mt-1 text-xs text-muted-foreground">The latest decoded contract events across identity, service, and token contracts.</p></div>
          <div className="flex items-center gap-2"><ListFilter className="size-3.5 text-muted-foreground" /><select value={category} onChange={(event) => setCategory(event.target.value as ActivityCategory | "all")} className="h-8 rounded-lg border border-border bg-background px-2 text-xs outline-none focus:ring-1 focus:ring-ring">{CATEGORY_OPTIONS.map((option) => <option key={option.value} value={option.value}>{option.label}</option>)}</select></div>
        </div>
        {filteredActivity.length === 0 ? (
          <div className="mt-5 rounded-lg border border-dashed border-border px-6 py-10 text-center"><LifeBuoy className="mx-auto size-7 text-muted-foreground" /><p className="mt-3 text-xs font-semibold">No activity matches these filters</p><p className="mt-1 text-[11px] text-muted-foreground">Try a different category or search term.</p></div>
        ) : (
          <div className="mt-5 divide-y divide-border">
            {filteredActivity.map((event) => (
              <div key={event.id} className="flex flex-col gap-3 py-4 first:pt-0 sm:flex-row sm:items-center sm:justify-between">
                <div className="flex min-w-0 items-start gap-3"><div className="flex size-8 shrink-0 items-center justify-center rounded-lg bg-muted"><Activity className="size-4" /></div><div className="min-w-0"><p className="truncate text-xs font-semibold">{event.title}</p><p className="mt-0.5 truncate text-[11px] text-muted-foreground">{event.message}</p><div className="mt-1 flex flex-wrap items-center gap-2 text-[10px] text-muted-foreground"><span>{CATEGORY_LABELS[activityCategory(event)]}</span>{event.universityCode && <span>· {event.universityCode}</span>}{event.entityId !== undefined && <span>· #{event.entityId}</span>}</div></div></div>
                <div className="flex shrink-0 items-center justify-between gap-4 sm:justify-end"><div className="text-left sm:text-right"><p className="text-xs font-semibold tabular-nums">{event.amountCamp !== undefined ? formatCamp(event.amountCamp) : (event.status || event.details)}</p><p className="mt-0.5 text-[10px] text-muted-foreground">{event.timestamp} · ledger {event.ledger}</p></div><a href={"https://stellar.expert/explorer/testnet/tx/" + event.fullTxHash} target="_blank" rel="noreferrer" className="inline-flex items-center gap-1 rounded-md border border-border px-2 py-1.5 text-[10px] font-semibold text-muted-foreground hover:text-foreground"><ExternalLink className="size-3" /> Explorer</a></div>
              </div>
            ))}
          </div>
        )}
      </section>
    </div>
  );
}

export default OperationsCenter;
