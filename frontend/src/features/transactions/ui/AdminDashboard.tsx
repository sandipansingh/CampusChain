"use client";

import { useMutation, useQuery, useQueryClient } from "@tanstack/react-query";
import { AlertCircle, Building2, CheckCircle2, XCircle } from "lucide-react";
import { useWallet } from "@/shared/stellar/useWallet";
import { Skeleton } from "@/shared/ui/Skeleton";
import { useCampusProfile, useCampusTokenMetadata } from "@/features/wallet/hooks/useWallet";
import { executeApproveUniversity, executeRejectUniversity, fetchUniversities, UniversityApprovalStatus } from "@/features/wallet/service/campusIdentity";

export function AdminDashboard() {
  const { address } = useWallet();
  const profile = useCampusProfile(address);
  const token = useCampusTokenMetadata();
  const queryClient = useQueryClient();
  const universities = useQuery({ queryKey: ["universities"], queryFn: () => fetchUniversities(address ?? undefined), refetchInterval: 20_000 });
  const approve = useMutation({ mutationFn: (code: string) => executeApproveUniversity(address!, code), onSuccess: () => queryClient.invalidateQueries({ queryKey: ["universities"] }) });
  const reject = useMutation({ mutationFn: (code: string) => executeRejectUniversity(address!, code), onSuccess: () => queryClient.invalidateQueries({ queryKey: ["universities"] }) });
  if (profile.isLoading) return <div className="rounded-xl border bg-card p-8"><Skeleton className="h-6 w-1/3" /></div>;
  if (profile.data?.role !== 5) return <div className="rounded-xl border bg-card p-8 text-center"><AlertCircle className="mx-auto size-10 text-destructive" /><h2 className="mt-3 font-bold">Platform Admin access required</h2><p className="mt-1 text-xs text-muted-foreground">Only the immutable Platform Admin can approve university claims.</p></div>;
  const pending = (universities.data ?? []).filter((university) => university.approvalStatus === UniversityApprovalStatus.PendingApproval);
  return <div className="mx-auto max-w-5xl space-y-6"><section className="grid gap-4 sm:grid-cols-2"><div className="rounded-xl border bg-card p-5"><p className="text-xs font-bold uppercase tracking-wider text-muted-foreground">CAMP circulating supply</p><p className="mt-2 text-2xl font-bold">{token.data?.totalSupply.toLocaleString() ?? "Unavailable"}</p></div><div className="rounded-xl border bg-card p-5"><p className="text-xs font-bold uppercase tracking-wider text-muted-foreground">Pending university claims</p><p className="mt-2 text-2xl font-bold">{pending.length}</p></div></section><section className="rounded-xl border bg-card p-6"><div className="flex items-center gap-2"><Building2 className="size-5" /><h2 className="font-bold">University approval queue</h2></div><p className="mt-1 text-xs text-muted-foreground">Live Identity registry entries filtered client-side to PendingApproval.</p>{universities.isLoading ? <Skeleton className="mt-4 h-24 w-full" /> : pending.length === 0 ? <p className="mt-5 text-sm text-muted-foreground">No university claims are awaiting review.</p> : <div className="mt-5 space-y-3">{pending.map((university) => <div key={university.code} className="flex flex-col gap-3 rounded-lg border p-4 sm:flex-row sm:items-center sm:justify-between"><div><p className="font-semibold">{university.name} <span className="font-mono text-xs text-muted-foreground">{university.code}</span></p><p className="text-xs text-muted-foreground">{university.address}</p><p className="mt-1 text-xs text-muted-foreground">Admin: {university.adminAddress}</p></div><div className="flex gap-2"><button disabled={approve.isPending || reject.isPending} onClick={() => approve.mutate(university.code)} className="inline-flex items-center gap-1 rounded-lg bg-emerald-600 px-3 py-2 text-xs font-bold text-white disabled:opacity-50"><CheckCircle2 className="size-4" />Approve</button><button disabled={approve.isPending || reject.isPending} onClick={() => reject.mutate(university.code)} className="inline-flex items-center gap-1 rounded-lg border px-3 py-2 text-xs font-bold text-red-700 disabled:opacity-50"><XCircle className="size-4" />Reject</button></div></div>)}</div>}</section></div>;
}
export default AdminDashboard;
