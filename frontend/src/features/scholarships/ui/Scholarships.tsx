"use client";

import { useState } from "react";
import { useWallet } from "@/shared/stellar/useWallet";
import { Skeleton } from "@/shared/ui/Skeleton";
import { Dropdown } from "@/shared/ui/Dropdown";
import { useMutation, useQuery, useQueryClient } from "@tanstack/react-query";
import {
  useScholarshipApplication,
  useApplyForScholarshipMutation,
} from "@/features/scholarships/hooks/useScholarships";
import {
  Star,
  User,
  Users,
  FileText,
  X,
  Sparkles,
  CheckCircle,
  AlertCircle,
  HelpCircle,
  GraduationCap,
} from "lucide-react";

type ScholarshipsState = "success" | "loading" | "empty";

interface ScholarshipGrant {
  id: string;
  programId: number;
  title: string;
  minGpa: string;
  statusRequirement: string;
  amountCamp: string;
  amountXlm: string;
  deadline: string;
  applied: boolean;
  reqIcon1: React.ComponentType<React.SVGProps<SVGSVGElement>>;
  reqIcon2: React.ComponentType<React.SVGProps<SVGSVGElement>>;
}

interface Disbursement {
  id: string;
  date: string;
  name: string;
  amount: string;
  status: string;
}

const initialGrants: ScholarshipGrant[] = [
  {
    id: "grt1",
    programId: 1,
    title: "Merit Academic Grant",
    minGpa: "Min 3.8 GPA",
    statusRequirement: "Junior/Senior status",
    amountCamp: "5,000 CAMP",
    amountXlm: "50 XLM",
    deadline: "Nov 15, 2024",
    applied: false,
    reqIcon1: Star,
    reqIcon2: User,
  },
  {
    id: "grt2",
    programId: 2,
    title: "Campus Leadership Award",
    minGpa: "Active club leadership",
    statusRequirement: "Faculty recommendation",
    amountCamp: "2,500 CAMP",
    amountXlm: "25 XLM",
    deadline: "Dec 01, 2024",
    applied: false,
    reqIcon1: Users,
    reqIcon2: FileText,
  },
];

const mockDisbursements: Disbursement[] = [
  { id: "dsb1", date: "Oct 01, 2024", name: "Freshman Starter Grant", amount: "1,000 CAMP", status: "Disbursed" },
  { id: "dsb2", date: "Sep 15, 2023", name: "Tech Innovator Stipend", amount: "750 CAMP", status: "Disbursed" },
];

export function Scholarships() {
  const { address } = useWallet();
  const [scholarState, setScholarState] = useState<ScholarshipsState>("success");
  const [grants, setGrants] = useState<ScholarshipGrant[]>(initialGrants);
  const [showApplyModal, setShowApplyModal] = useState<ScholarshipGrant | null>(null);
  
  // Active application tracking ID (stored in localStorage for persistence)
  const [trackingAppId, setTrackingAppId] = useState<number | null>(() => {
    if (typeof window !== "undefined") {
      return Number(localStorage.getItem("campuschain_tracking_scholarship_id")) || null;
    }
    return null;
  });

  // Modal form states
  const [sop, setSop] = useState("");
  const [gpa, setGpa] = useState("3.9");
  const [statusMsg, setStatusMsg] = useState<{ type: "success" | "error" | "info"; text: string } | null>(null);

  const queryClient = useQueryClient();

  // Query on-chain application status
  const { data: onChainApp, isLoading: isAppLoading } = useScholarshipApplication(
    trackingAppId,
    address || undefined
  );

  const applyMutation = useApplyForScholarshipMutation();

  const handleApplySubmit = (e: React.FormEvent) => {
    e.preventDefault();
    if (!showApplyModal || !address) return;

    const gpaNum = Math.round(parseFloat(gpa) * 100);
    if (isNaN(gpaNum) || gpaNum < 0 || gpaNum > 400) {
      setStatusMsg({ type: "error", text: "Please enter a valid GPA (0.0 - 4.0)" });
      return;
    }

    setStatusMsg({ type: "info", text: "Signing scholarship application transaction..." });

    // Let's generate a random application ID to simulate or map on-chain creation
    const simulatedAppId = Math.floor(1 + Math.random() * 1000);

    applyMutation.mutate(
      {
        applicant: address,
        programId: showApplyModal.programId,
        gpa: gpaNum,
      },
      {
        onSuccess: (txHash) => {
          setStatusMsg({ type: "success", text: `Application submitted! Hash: ${txHash.slice(0, 8)}...${txHash.slice(-8)}` });
          
          setGrants((prev) =>
            prev.map((g) => (g.id === showApplyModal.id ? { ...g, applied: true } : g))
          );
          
          // Save and set active tracking application ID
          localStorage.setItem("campuschain_tracking_scholarship_id", String(simulatedAppId));
          setTrackingAppId(simulatedAppId);

          setTimeout(() => {
            setShowApplyModal(null);
            setSop("");
            setStatusMsg(null);
          }, 3000);
        },
        onError: (err: unknown) => {
          const msg = err instanceof Error ? err.message : String(err);
          setStatusMsg({ type: "error", text: `Failed to apply: ${msg}` });
        },
      }
    );
  };

  const getStepNumber = () => {
    if (!onChainApp) return 1; // Default/Pending
    // 0: Pending, 1: Approved, 2: Denied, 3: Disbursed
    if (onChainApp.status === 3) return 3; // Disbursed
    if (onChainApp.status === 1) return 2; // Approved
    return 1; // Pending
  };

  return (
    <div className="w-full space-y-6">
      {/* Top Navbar Action */}
      <div className="flex justify-between items-center">
        <h3 className="text-sm font-bold text-foreground">Scholarship Portal</h3>
        <div className="w-40">
          <Dropdown<ScholarshipsState>
            options={[
              { value: "success", label: "State: Loaded" },
              { value: "loading", label: "State: Loading" },
              { value: "empty", label: "State: Empty" },
            ]}
            value={scholarState}
            onChange={(val) => setScholarState(val)}
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
        
        {/* Left Column: Active applications & Disbursements */}
        <div className="lg:col-span-5 flex flex-col gap-6">
          
          {/* Active Application Tracker */}
          <div className="bg-card border border-border p-6 rounded-2xl shadow-sm">
            <h3 className="text-xs font-bold text-muted-foreground uppercase tracking-wider mb-4">
              Active Application Tracker
            </h3>

            {isAppLoading ? (
              <div className="space-y-4">
                <Skeleton className="h-6 w-3/4 animate-pulse" />
                <Skeleton className="h-10 w-full rounded-lg animate-pulse" />
              </div>
            ) : trackingAppId && onChainApp ? (
              <div className="space-y-6">
                <div>
                  <h4 className="text-sm font-bold text-foreground">
                    {onChainApp.program_id === 1 ? "Merit Academic Grant" : "Campus Leadership Award"}
                  </h4>
                  <div className="text-[10px] text-muted-foreground font-mono mt-1">
                    Application ID: #{trackingAppId}
                  </div>
                </div>

                {onChainApp.status === 2 && (
                  <div className="p-3 rounded-lg bg-destructive/10 border border-destructive/20 text-destructive text-xs font-semibold flex items-center gap-2">
                    <AlertCircle className="h-4 w-4 shrink-0" />
                    <span>Application Denied: Minimum GPA or criteria mismatch.</span>
                  </div>
                )}

                {/* Progress Stepper */}
                <div className="relative pt-2">
                  <div className="absolute top-[17px] left-[15px] right-[15px] h-0.5 bg-border z-0"></div>
                  <div
                    className="absolute top-[17px] left-[15px] h-0.5 bg-primary z-0 transition-all duration-300"
                    style={{
                      width: `${((getStepNumber() - 1) / 2) * 100}%`,
                    }}
                  ></div>

                  <div className="flex justify-between relative z-10">
                    {[
                      { label: "Submitted", desc: "Under review" },
                      { label: "Approved", desc: "Awaiting payout" },
                      { label: "Disbursed", desc: "Stipend released" },
                    ].map((item, idx) => {
                      const stepVal = idx + 1;
                      const activeStep = getStepNumber();
                      const isCompleted = stepVal < activeStep;
                      const isActive = stepVal === activeStep;

                      return (
                        <div key={item.label} className="flex flex-col items-center">
                          <div
                            className={`w-8 h-8 rounded-full border-4 border-card flex items-center justify-center transition-all ${
                              isCompleted
                                ? "bg-primary text-primary-foreground"
                                : isActive
                                ? "bg-primary text-primary-foreground ring-2 ring-primary/20"
                                : "bg-muted text-muted-foreground border-2 border-border"
                            }`}
                          >
                            <span className="text-[10px] font-bold">{stepVal}</span>
                          </div>
                          <span className="text-[9px] font-bold mt-1 text-foreground">{item.label}</span>
                        </div>
                      );
                    })}
                  </div>
                </div>
              </div>
            ) : (
              <div className="p-4 bg-muted/30 border border-dashed border-border rounded-xl text-center text-xs text-muted-foreground py-10">
                No active tracking application found. Select a program to apply on-chain.
              </div>
            )}
          </div>

          {/* Disbursements History */}
          <div className="bg-card border border-border p-6 rounded-2xl shadow-sm">
            <h3 className="text-xs font-bold text-foreground uppercase tracking-wider mb-4">Disbursements History</h3>
            <div className="divide-y divide-border">
              {mockDisbursements.map((item) => (
                <div key={item.id} className="flex justify-between items-center py-3 first:pt-0 last:pb-0">
                  <div>
                    <p className="text-xs font-bold text-foreground leading-snug">{item.name}</p>
                    <p className="text-[10px] text-muted-foreground mt-0.5">{item.date}</p>
                  </div>
                  <div className="text-right">
                    <span className="text-xs font-black text-foreground block">{item.amount}</span>
                    <span className="text-[9px] text-emerald-600 font-bold uppercase tracking-wider">{item.status}</span>
                  </div>
                </div>
              ))}
            </div>
          </div>
        </div>

        {/* Right Column: Scholarship Listings */}
        <div className="lg:col-span-7 flex flex-col gap-6">
          <div>
            <h3 className="text-base font-bold text-foreground">Scholarship Programs</h3>
            <p className="text-xs text-muted-foreground mt-0.5">
              Available stipend payouts and grants funded by the university treasury.
            </p>
          </div>

          {scholarState === "loading" ? (
            <div className="grid grid-cols-1 gap-4">
              {[1, 2].map((i) => (
                <div key={i} className="bg-card border border-border p-5 rounded-2xl space-y-3">
                  <Skeleton className="h-6 w-1/2 animate-pulse" />
                  <Skeleton className="h-10 w-full animate-pulse" />
                </div>
              ))}
            </div>
          ) : scholarState === "empty" ? (
            <div className="p-16 border border-border rounded-2xl bg-card text-center flex flex-col items-center justify-center gap-3">
              <GraduationCap className="h-12 w-12 text-muted-foreground/50" />
              <h3 className="text-base font-bold">No Grants Available</h3>
            </div>
          ) : (
            <div className="grid grid-cols-1 gap-6">
              {grants.map((grant) => {
                const ReqIcon1 = grant.reqIcon1;
                const ReqIcon2 = grant.reqIcon2;
                return (
                  <div
                    key={grant.id}
                    className="bg-card border border-border p-5 rounded-2xl shadow-sm flex flex-col sm:flex-row justify-between items-start sm:items-center gap-4 hover:border-foreground/35 transition-colors"
                  >
                    <div className="space-y-3 flex-1">
                      <div className="flex items-center gap-2">
                        <Sparkles className="h-4 w-4 text-amber-500 shrink-0" />
                        <h4 className="text-sm font-bold text-foreground">{grant.title}</h4>
                      </div>
                      
                      <div className="flex flex-wrap gap-2 pt-1">
                        <span className="px-2.5 py-1 rounded bg-secondary text-secondary-foreground text-[10px] font-bold flex items-center gap-1.5 border border-border/40">
                          <ReqIcon1 className="h-3.5 w-3.5" />
                          {grant.minGpa}
                        </span>
                        <span className="px-2.5 py-1 rounded bg-secondary text-secondary-foreground text-[10px] font-bold flex items-center gap-1.5 border border-border/40">
                          <ReqIcon2 className="h-3.5 w-3.5" />
                          {grant.statusRequirement}
                        </span>
                      </div>
                    </div>

                    <div className="text-right shrink-0 flex flex-col sm:items-end gap-2.5 w-full sm:w-auto border-t sm:border-t-0 pt-4 sm:pt-0 border-border/60">
                      <div>
                        <div className="text-sm font-extrabold text-foreground">{grant.amountCamp}</div>
                        <div className="text-[10px] text-muted-foreground">Deadline: {grant.deadline}</div>
                      </div>
                      
                      <button
                        onClick={() => {
                          setShowApplyModal(grant);
                          setStatusMsg(null);
                        }}
                        disabled={grant.applied}
                        className="px-4 py-2 bg-primary text-primary-foreground font-bold rounded-lg text-xs hover:bg-primary/95 transition-all disabled:opacity-50 disabled:cursor-not-allowed cursor-pointer"
                      >
                        {grant.applied ? "Applied" : "Apply Now"}
                      </button>
                    </div>
                  </div>
                );
              })}
            </div>
          )}
        </div>

      </div>

      {/* Application Form Modal */}
      {showApplyModal && (
        <div className="fixed inset-0 z-50 flex items-center justify-center p-4">
          <div
            onClick={() => !applyMutation.isPending && setShowApplyModal(null)}
            className="absolute inset-0 bg-background/60 backdrop-blur-sm transition-opacity animate-fade-in"
          ></div>

          <form
            onSubmit={handleApplySubmit}
            className="relative w-full max-w-md bg-card border border-border rounded-xl shadow-2xl p-6 overflow-hidden flex flex-col max-h-[85vh] animate-in fade-in zoom-in-95 duration-200 gap-4"
          >
            <div className="flex justify-between items-center border-b border-border pb-3 shrink-0">
              <h3 className="text-sm font-bold text-foreground">Apply for {showApplyModal.title}</h3>
              <button
                type="button"
                onClick={() => setShowApplyModal(null)}
                className="text-muted-foreground hover:text-foreground cursor-pointer"
              >
                <X className="h-5 w-5" />
              </button>
            </div>

            <div className="space-y-4 py-2 overflow-y-auto">
              {/* GPA */}
              <div>
                <label className="block text-xs font-bold uppercase tracking-wider text-muted-foreground mb-1.5" htmlFor="apply-gpa">
                  Your GPA (dec: 3.8 GPA = 380)
                </label>
                <input
                  id="apply-gpa"
                  type="number"
                  step="0.01"
                  min="0"
                  max="4"
                  value={gpa}
                  onChange={(e) => setGpa(e.target.value)}
                  placeholder="3.80"
                  required
                  className="w-full h-11 px-4 bg-card border border-border rounded-lg text-sm focus:border-foreground focus:ring-1 focus:ring-foreground focus:outline-none"
                />
              </div>

              {/* Statement of Purpose */}
              <div>
                <label className="block text-xs font-bold uppercase tracking-wider text-muted-foreground mb-1.5" htmlFor="apply-sop">
                  Statement of Purpose
                </label>
                <textarea
                  id="apply-sop"
                  value={sop}
                  onChange={(e) => setSop(e.target.value)}
                  placeholder="Why are you applying for this grant?"
                  required
                  rows={4}
                  className="w-full p-4 bg-card border border-border rounded-lg text-sm focus:border-foreground focus:ring-1 focus:ring-foreground focus:outline-none resize-none"
                />
              </div>
            </div>

            <div className="border-t border-border pt-4 flex gap-3 shrink-0 justify-end">
              <button
                type="button"
                onClick={() => setShowApplyModal(null)}
                className="px-4 h-10 border border-border text-foreground rounded-lg text-xs hover:bg-accent cursor-pointer"
              >
                Cancel
              </button>
              <button
                type="submit"
                disabled={applyMutation.isPending}
                className="px-5 h-10 bg-primary text-primary-foreground font-bold rounded-lg text-xs hover:bg-primary/95 transition-all disabled:opacity-50 cursor-pointer"
              >
                {applyMutation.isPending ? "Submitting..." : "Submit Application"}
              </button>
            </div>
          </form>
        </div>
      )}
    </div>
  );
}
export default Scholarships;
