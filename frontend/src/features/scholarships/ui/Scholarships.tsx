"use client";

import { useState } from "react";
import { GraduationCap, Calendar, Users, Award } from "lucide-react";
import { Skeleton } from "@/shared/ui/Skeleton";
import { useWallet } from "@/shared/stellar/useWallet";
import {
  useApplyForScholarshipMutation,
  useScholarshipApplications,
  useScholarshipPrograms,
} from "@/features/scholarships/hooks/useScholarships";

export function Scholarships() {
  const { address } = useWallet();
  const programs = useScholarshipPrograms(address ?? undefined);
  const applications = useScholarshipApplications(address ?? undefined);
  const apply = useApplyForScholarshipMutation();
  
  const [selectedProgram, setSelectedProgram] = useState<{ id: number; title: string } | null>(null);
  const [notice, setNotice] = useState<string | null>(null);

  const submit = async (event: React.FormEvent) => {
    event.preventDefault();
    if (!address || !selectedProgram) return;
    try {
      setNotice(null);
      const txHash = await apply.mutateAsync({ studentId: address, scholarshipId: selectedProgram.id });
      setNotice(`Application submitted successfully! Transaction hash: ${txHash}`);
      setSelectedProgram(null);
      await applications.refetch();
    } catch (error) {
      setNotice(error instanceof Error ? error.message : "Application failed.");
    }
  };

  const ownApplications = applications.data?.filter((app) => app.studentId === address) ?? [];
  const approvedPrograms = programs.data?.filter((p) => p.adminApprovalStatus === "approved") ?? [];

  return (
    <div className="w-full max-w-5xl mx-auto grid lg:grid-cols-12 gap-6 items-start animate-in fade-in duration-300">
      {/* Left Column: My Applications */}
      <section className="lg:col-span-4 bg-card border border-border rounded-xl p-6 shadow-sm space-y-4">
        <h2 className="text-sm font-bold flex items-center gap-2">
          <GraduationCap className="h-4 w-4 text-primary" /> My Applications
        </h2>
        {applications.isLoading ? (
          <div className="space-y-3">
            <Skeleton className="h-12 w-full" />
            <Skeleton className="h-12 w-full" />
          </div>
        ) : ownApplications.length === 0 ? (
          <p className="text-xs text-muted-foreground font-normal">
            You have no scholarship applications.
          </p>
        ) : (
          <div className="divide-y divide-border">
            {ownApplications.map((app) => {
              const program = programs.data?.find((p) => p.id === app.scholarshipId);
              return (
                <div key={app.id} className="py-3.5 space-y-1.5">
                  <p className="font-bold text-xs text-foreground">
                    {program ? program.title : `Scholarship #${app.scholarshipId}`}
                  </p>
                  <div className="flex items-center justify-between text-[11px] text-muted-foreground">
                    <span>Applied: {new Date(app.appliedAt).toLocaleDateString()}</span>
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
                </div>
              );
            })}
          </div>
        )}
      </section>

      {/* Right Column: Scholarship Programs */}
      <section className="lg:col-span-8 space-y-4">
        <div>
          <h2 className="text-base font-bold text-foreground">Available Scholarships</h2>
          <p className="mt-1 text-xs text-muted-foreground font-normal">
            Apply to active and admin-approved scholarship programs.
          </p>
        </div>

        {notice && (
          <div
            className={`text-xs p-2.5 rounded-lg border ${
              notice.includes("successfully")
                ? "text-emerald-700 bg-emerald-50 border-emerald-200"
                : "text-destructive bg-destructive/5 border-destructive/20"
            }`}
          >
            {notice}
          </div>
        )}

        {programs.isLoading ? (
          <div className="space-y-4">
            {[1, 2].map((id) => (
              <div key={id} className="border border-border rounded-xl p-5 bg-card shadow-sm space-y-3">
                <Skeleton className="h-5 w-1/3" />
                <Skeleton className="h-12 w-full" />
              </div>
            ))}
          </div>
        ) : programs.isError ? (
          <div className="border border-destructive/30 rounded-xl p-6 bg-card text-center">
            <p className="font-bold text-foreground">Could not load scholarship programs.</p>
            <button onClick={() => void programs.refetch()} className="mt-3 text-xs font-bold underline cursor-pointer">
              Retry
            </button>
          </div>
        ) : approvedPrograms.length === 0 ? (
          <div className="p-16 border border-border rounded-xl text-center bg-card shadow-sm">
            <GraduationCap className="h-10 w-10 mx-auto text-muted-foreground" />
            <p className="mt-3 text-sm font-bold text-foreground">No active programs available</p>
          </div>
        ) : (
          <div className="space-y-4">
            {approvedPrograms.map((program) => {
              const alreadyApplied = ownApplications.some((a) => a.scholarshipId === program.id);
              return (
                <article key={program.id} className="bg-card border border-border rounded-xl p-5 shadow-sm space-y-4">
                  <div className="flex flex-col sm:flex-row sm:items-start justify-between gap-4">
                    <div className="space-y-1">
                      <h3 className="text-sm font-bold text-foreground">{program.title}</h3>
                      <p className="text-xs text-muted-foreground leading-relaxed">{program.description}</p>
                    </div>
                    <div className="shrink-0 flex items-center gap-1.5 bg-primary/10 text-primary font-bold px-3 py-1 rounded-lg text-xs border border-primary/20">
                      <Award className="h-4 w-4" />
                      {program.amount.toLocaleString()} CAMP
                    </div>
                  </div>

                  <div className="grid grid-cols-2 gap-4 text-xs pt-3 border-t border-border">
                    <div className="space-y-1">
                      <span className="text-muted-foreground font-semibold block">Eligibility Criteria</span>
                      <span className="text-foreground">{program.criteria}</span>
                    </div>
                    <div className="space-y-2">
                      <div className="flex items-center gap-1.5 text-[11px] text-muted-foreground">
                        <Calendar className="h-3.5 w-3.5" />
                        Deadline: {program.deadline}
                      </div>
                      <div className="flex items-center gap-1.5 text-[11px] text-muted-foreground">
                        <Users className="h-3.5 w-3.5" />
                        Slots remaining: {program.slots}
                      </div>
                    </div>
                  </div>

                  <div className="flex items-center justify-between pt-3 border-t border-border">
                    <span className="text-[10px] font-mono text-muted-foreground truncate max-w-[200px]" title={program.createdByUniversityId}>
                      Sponsor: {program.createdByUniversityId}
                    </span>
                    <button
                      onClick={() => setSelectedProgram({ id: program.id, title: program.title })}
                      disabled={!address || alreadyApplied}
                      className="h-9 px-4 bg-primary text-primary-foreground rounded-lg text-xs font-bold disabled:opacity-50 shrink-0 transition-opacity hover:opacity-90 cursor-pointer"
                    >
                      {alreadyApplied ? "Applied" : "Apply"}
                    </button>
                  </div>
                </article>
              );
            })}
          </div>
        )}
      </section>

      {/* Application Confirmation Modal */}
      {selectedProgram && (
        <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-background/80 backdrop-blur-sm animate-in fade-in duration-200">
          <form onSubmit={submit} className="w-full max-w-md bg-card border border-border rounded-xl p-6 space-y-4 shadow-xl">
            <h3 className="font-bold text-foreground text-sm flex items-center gap-2">
              <GraduationCap className="h-5 w-5 text-primary" /> Apply for {selectedProgram.title}
            </h3>
            <p className="text-xs text-muted-foreground leading-relaxed">
              Are you sure you want to submit your application for this scholarship? Your profile and student ID will be shared with the University Reviewers.
            </p>
            <div className="flex justify-end gap-3 pt-2">
              <button
                type="button"
                onClick={() => setSelectedProgram(null)}
                className="h-10 px-4 border border-border rounded-lg text-xs font-bold cursor-pointer hover:bg-muted"
              >
                Cancel
              </button>
              <button
                type="submit"
                disabled={apply.isPending}
                className="h-10 px-4 bg-primary text-primary-foreground rounded-lg text-xs font-bold disabled:opacity-50 cursor-pointer"
              >
                {apply.isPending ? "Submitting..." : "Submit Application"}
              </button>
            </div>
          </form>
        </div>
      )}
    </div>
  );
}

export default Scholarships;
