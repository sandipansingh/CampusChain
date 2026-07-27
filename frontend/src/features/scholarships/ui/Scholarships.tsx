"use client";

import { useState } from "react";
import { useWallet } from "@/shared/stellar/useWallet";
import { Skeleton } from "@/shared/ui/Skeleton";
import { Dropdown } from "@/shared/ui/Dropdown";
import {
  LayoutDashboard,
  Wallet,
  Coins,
  Store,
  Calendar,
  Award,
  GraduationCap,
  Receipt,
  Settings,
  Search,
  CheckCircle,
  HelpCircle,
  Bell,
  Star,
  User,
  Users,
  FileText,
  ArrowRight,
  X,
  Sparkles,
} from "lucide-react";

type ScholarshipsState = "success" | "loading" | "empty";

interface ScholarshipGrant {
  id: string;
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
    title: "Campus Leadership Award",
    minGpa: "Active club leadership",
    statusRequirement: "Faculty recommendation",
    amountCamp: "2,500 CAMP",
    amountXlm: "25 XLM",
    deadline: "Dec 01, 2024",
    applied: true,
    reqIcon1: Users,
    reqIcon2: FileText,
  },
];

const mockDisbursements: Disbursement[] = [
  { id: "dsb1", date: "Oct 01, 2024", name: "Freshman Starter Grant", amount: "1,000 CAMP", status: "Disbursed" },
  { id: "dsb2", date: "Sep 15, 2023", name: "Tech Innovator Stipend", amount: "750 CAMP", status: "Disbursed" },
];

export function Scholarships() {
  const { disconnect } = useWallet();
  const [scholarState, setScholarState] = useState<ScholarshipsState>("success");
  const [grants, setGrants] = useState<ScholarshipGrant[]>(initialGrants);
  const [showApplyModal, setShowApplyModal] = useState<ScholarshipGrant | null>(null);
  
  // Active application track
  const [activeApp, setActiveApp] = useState<{ title: string; id: string; step: number } | null>({
    title: "STEM Excellence Fund",
    id: "#492-AXL",
    step: 2,
  });

  // Modal form states
  const [sop, setSop] = useState("");
  const [gpa, setGpa] = useState("3.9");
  const [submitting, setSubmitting] = useState(false);

  const handleApplySubmit = (e: React.FormEvent) => {
    e.preventDefault();
    if (!showApplyModal) return;

    setSubmitting(true);
    setTimeout(() => {
      // Mark as applied
      setGrants((prev) =>
        prev.map((g) => (g.id === showApplyModal.id ? { ...g, applied: true } : g))
      );
      
      // Update active application card
      setActiveApp({
        title: showApplyModal.title,
        id: `#${Math.floor(100 + Math.random() * 900)}-CC`,
        step: 1,
      });

      setSubmitting(false);
      setShowApplyModal(null);
      setSop("");
    }, 1200);
  };

  // Navigation items for the sidebar (desktop)
  const navItems = [
    { label: "Dashboard", icon: LayoutDashboard, href: "#", active: false },
    { label: "Wallet", icon: Wallet, href: "#", active: false },
    { label: "Pay (QR)", icon: Coins, href: "#", active: false },
    { label: "Marketplace", icon: Store, href: "#", active: false },
    { label: "Events", icon: Calendar, href: "#", active: false },
    { label: "Rewards", icon: Award, href: "#", active: false },
    { label: "Scholarships", icon: GraduationCap, href: "#", active: true },
    { label: "Transactions", icon: Receipt, href: "#", active: false },
  ];

  return (
    <div className="flex h-screen w-full bg-background text-foreground overflow-hidden">
      {/* 1. Desktop Sidebar Navigation */}
      <nav className="hidden md:flex flex-col w-64 bg-card border-r border-border h-full fixed left-0 top-0 py-6 px-4 z-40">
        <div className="flex items-center gap-3 mb-8 px-2">
          <div className="w-10 h-10 rounded-full bg-muted flex items-center justify-center font-semibold text-foreground">
            CC
          </div>
          <div>
            <h1 className="text-lg font-bold leading-tight">CampusChain</h1>
            <p className="text-xs text-muted-foreground">University Infrastructure</p>
          </div>
        </div>

        <div className="flex-1 space-y-1">
          {navItems.map((item) => {
            const Icon = item.icon;
            return (
              <a
                key={item.label}
                href={item.href}
                className={`flex items-center gap-3 px-3 py-2.5 rounded-lg text-sm transition-all ${
                  item.active
                    ? "bg-secondary text-secondary-foreground font-bold border-r-4 border-primary"
                    : "text-muted-foreground hover:text-foreground hover:bg-secondary/40 font-medium"
                }`}
              >
                <Icon className="h-4 w-4" />
                <span>{item.label}</span>
              </a>
            );
          })}
        </div>

        <div className="border-t border-border pt-4 mt-auto">
          <a
            href="#"
            className="flex items-center gap-3 px-3 py-2.5 rounded-lg text-sm text-muted-foreground hover:text-foreground hover:bg-secondary/40 font-medium transition-all"
          >
            <Settings className="h-4 w-4" />
            <span>Settings</span>
          </a>
        </div>
      </nav>

      {/* Main Content Area */}
      <div className="flex-1 md:ml-64 flex flex-col h-full overflow-hidden">
        {/* 2. Top Navbar */}
        <header className="hidden md:flex justify-between items-center h-16 border-b border-border bg-card px-6 sticky top-0 z-30 shrink-0">
          <div className="flex items-center gap-4 flex-1">
            <h2 className="text-xl font-bold">Scholarships</h2>
            <div className="relative w-64">
              <Search className="absolute left-3 top-1/2 -translate-y-1/2 h-4 w-4 text-muted-foreground" />
              <input
                type="text"
                placeholder="Search..."
                className="w-full pl-9 pr-4 py-1.5 bg-muted/40 border border-border rounded-lg text-sm placeholder:text-muted-foreground/60 focus:border-foreground focus:ring-1 focus:ring-foreground focus:outline-none transition-colors"
              />
            </div>
          </div>

          <div className="flex items-center gap-6">
            <button className="text-muted-foreground hover:text-foreground p-2 rounded-full hover:bg-muted transition-colors relative">
              <HelpCircle className="h-5 w-5" />
            </button>
            <button className="text-muted-foreground hover:text-foreground p-2 rounded-full hover:bg-muted transition-colors relative">
              <Bell className="h-5 w-5" />
            </button>

            {/* UI State Control Dropdown */}
            <div className="w-40">
              <Dropdown<ScholarshipsState>
                options={[
                  { value: "success", label: "State: Success" },
                  { value: "loading", label: "State: Loading" },
                  { value: "empty", label: "State: Empty" },
                ]}
                value={scholarState}
                onChange={(val) => setScholarState(val)}
              />
            </div>

            <div className="flex items-center gap-3">
              <div className="w-8 h-8 rounded-full bg-muted flex items-center justify-center text-xs font-bold select-none cursor-pointer">
                JS
              </div>
              <button
                onClick={disconnect}
                className="text-xs text-muted-foreground hover:text-destructive transition-colors font-medium cursor-pointer"
              >
                Logout
              </button>
            </div>
          </div>
        </header>

        {/* Content Viewport */}
        <main className="flex-grow overflow-y-auto p-4 md:p-6 pb-24 md:pb-6 relative h-full">
          <div className="max-w-4xl mx-auto space-y-6">

            {/* MOBILE ONLY: Top Header */}
            <div className="flex md:hidden justify-between items-center py-2 shrink-0">
              <div>
                <h1 className="text-2xl font-bold">Scholarships</h1>
                <p className="text-xs text-muted-foreground mt-0.5">Student Financial Portal</p>
              </div>
              <div className="flex items-center gap-2">
                <div className="w-28">
                  <Dropdown<ScholarshipsState>
                    options={[
                      { value: "success", label: "Success" },
                      { value: "loading", label: "Loading" },
                      { value: "empty", label: "Empty" },
                    ]}
                    value={scholarState}
                    onChange={(val) => setScholarState(val)}
                  />
                </div>
                <div className="w-8 h-8 rounded-full bg-muted flex items-center justify-center text-xs font-bold">
                  JS
                </div>
              </div>
            </div>

            {scholarState === "loading" ? (
              <div className="space-y-6">
                <Skeleton className="h-44 w-full rounded-2xl" />
                <Skeleton className="h-10 w-48" />
                <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
                  <Skeleton className="h-56 w-full rounded-xl" />
                  <Skeleton className="h-56 w-full rounded-xl" />
                </div>
              </div>
            ) : scholarState === "empty" ? (
              <div className="p-16 border border-border rounded-2xl bg-card text-center flex flex-col items-center justify-center gap-3 shadow-sm">
                <GraduationCap className="h-12 w-12 text-muted-foreground/50" />
                <h3 className="text-md font-bold">No Active Grants</h3>
                <p className="text-xs text-muted-foreground max-w-[260px] mx-auto leading-relaxed">
                  There are currently no active applications or available scholarships registered on CampusChain.
                </p>
              </div>
            ) : (
              <>
                {/* 1. Active Application Stepper Card */}
                {activeApp && (
                  <section>
                    <div className="bg-card border border-border rounded-xl p-6 shadow-sm">
                      <div className="flex justify-between items-start mb-6">
                        <div>
                          <h3 className="text-sm md:text-base font-bold text-foreground">
                            Active Application: {activeApp.title}
                          </h3>
                          <p className="text-[10px] text-muted-foreground font-mono mt-0.5">
                            Application ID: {activeApp.id}
                          </p>
                        </div>
                        <span className="bg-muted text-foreground text-[10px] font-bold uppercase tracking-wider px-2.5 py-1 rounded-full border border-border">
                          {activeApp.step === 1 ? "Submitted" : activeApp.step === 2 ? "Under Review" : "Approved"}
                        </span>
                      </div>

                      {/* Horizontal Stepper line */}
                      <div className="relative py-4 w-full max-w-xl mx-auto">
                        <div className="absolute left-[30px] right-[30px] top-[26px] h-0.5 bg-border -z-10"></div>
                        <div
                          className="absolute left-[30px] top-[26px] h-0.5 bg-primary -z-10 transition-all duration-300"
                          style={{ width: `${((activeApp.step - 1) / 3) * 100}%` }}
                        ></div>

                        <div className="flex justify-between relative z-10">
                          {[
                            { label: "Applied", stepVal: 1 },
                            { label: "Under Review", stepVal: 2 },
                            { label: "Approved", stepVal: 3 },
                            { label: "Disbursed", stepVal: 4 },
                          ].map((step) => {
                            const isCompleted = step.stepVal < activeApp.step;
                            const isActive = step.stepVal === activeApp.step;
                            
                            return (
                              <div key={step.label} className="flex flex-col items-center w-20">
                                <div
                                  className={`w-6 h-6 rounded-full border-2 flex items-center justify-center text-[10px] font-bold transition-all ${
                                    isCompleted
                                      ? "bg-primary text-primary-foreground border-primary"
                                      : isActive
                                      ? "bg-primary text-primary-foreground border-primary ring-4 ring-primary/10"
                                      : "bg-card text-muted-foreground border-border"
                                  }`}
                                >
                                  {isCompleted ? "✓" : step.stepVal}
                                </div>
                                <span
                                  className={`mt-2 text-[10px] font-bold uppercase tracking-wide text-center ${
                                    isActive || isCompleted ? "text-foreground" : "text-muted-foreground"
                                  }`}
                                >
                                  {step.label}
                                </span>
                              </div>
                            );
                          })}
                        </div>
                      </div>
                    </div>
                  </section>
                )}

                {/* 2. Available Grants Section */}
                <section className="space-y-4">
                  <h3 className="text-base font-bold text-foreground">Available Scholarships</h3>
                  <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
                    {grants.map((item) => {
                      const ReqIcon1 = item.reqIcon1;
                      const ReqIcon2 = item.reqIcon2;
                      return (
                        <div
                          key={item.id}
                          className={`bg-card border border-border rounded-xl p-6 flex flex-col h-full shadow-sm hover:border-foreground/35 transition-all duration-200 ${
                            item.applied ? "opacity-85" : ""
                          }`}
                        >
                          <div className="flex-grow">
                            <h4 className="text-sm font-bold text-foreground mb-2">{item.title}</h4>
                            
                            <div className="text-xs text-muted-foreground mb-4 space-y-1.5">
                              <div className="flex items-center gap-2">
                                <ReqIcon1 className="h-4 w-4 text-muted-foreground/80 shrink-0" />
                                <span>{item.minGpa}</span>
                              </div>
                              <div className="flex items-center gap-2">
                                <ReqIcon2 className="h-4 w-4 text-muted-foreground/80 shrink-0" />
                                <span>{item.statusRequirement}</span>
                              </div>
                            </div>

                            <div className="mb-6 p-3 bg-muted/40 rounded-lg border border-border/80">
                              <p className="text-[9px] uppercase tracking-wider font-bold text-muted-foreground mb-0.5">
                                Grant Value
                              </p>
                              <p className="text-xs font-bold text-foreground">
                                {item.amountCamp} / {item.amountXlm}
                              </p>
                            </div>
                          </div>

                          <div className="flex items-center justify-between mt-auto pt-4 border-t border-border">
                            <div className="text-[10px] text-muted-foreground">
                              <span className="block font-bold uppercase tracking-wider">Deadline</span>
                              <span className="font-semibold text-foreground">{item.deadline}</span>
                            </div>

                            {item.applied ? (
                              <button className="bg-muted text-muted-foreground border border-border px-4 py-1.5 rounded-lg text-xs font-semibold cursor-not-allowed">
                                Applied
                              </button>
                            ) : (
                              <button
                                onClick={() => setShowApplyModal(item)}
                                className="bg-primary text-primary-foreground px-5 py-1.5 rounded-lg text-xs font-semibold hover:bg-primary/95 transition-all active:scale-[0.98] cursor-pointer"
                              >
                                Apply
                              </button>
                            )}
                          </div>
                        </div>
                      );
                    })}
                  </div>
                </section>

                {/* 3. Disbursement History Section */}
                <section className="space-y-4">
                  <h3 className="text-base font-bold text-foreground">Disbursement History</h3>
                  <div className="bg-card border border-border rounded-xl overflow-hidden shadow-sm">
                    <div className="overflow-x-auto">
                      <table className="w-full text-left border-collapse">
                        <thead>
                          <tr className="bg-muted/40 border-b border-border text-[10px] font-bold text-muted-foreground uppercase tracking-wider select-none">
                            <th className="p-4 pl-6">Date</th>
                            <th className="p-4">Name</th>
                            <th className="p-4 text-right">Amount</th>
                            <th className="p-4 pr-6 text-right">Status</th>
                          </tr>
                        </thead>
                        <tbody className="divide-y divide-border">
                          {mockDisbursements.map((item) => (
                            <tr key={item.id} className="hover:bg-muted/10 transition-colors text-xs">
                              <td className="p-4 pl-6 text-muted-foreground font-mono">{item.date}</td>
                              <td className="p-4 font-bold text-foreground">{item.name}</td>
                              <td className="p-4 font-bold text-foreground text-right">{item.amount}</td>
                              <td className="p-4 pr-6 text-right">
                                <span className="inline-flex items-center gap-1 bg-muted/60 text-muted-foreground px-2.5 py-1 rounded-full text-[10px] font-bold border border-border/80">
                                  <CheckCircle className="h-3.5 w-3.5 text-emerald-600 shrink-0" />
                                  <span>{item.status}</span>
                                </span>
                              </td>
                            </tr>
                          ))}
                        </tbody>
                      </table>
                    </div>
                  </div>
                </section>
              </>
            )}

          </div>
        </main>
      </div>

      {/* 4. Application Dialog Modal */}
      {showApplyModal && (
        <div className="fixed inset-0 z-50 flex items-center justify-center p-4">
          <div
            onClick={() => setShowApplyModal(null)}
            className="absolute inset-0 bg-background/60 backdrop-blur-sm transition-opacity"
          ></div>

          <div className="relative w-full max-w-md bg-card border border-border rounded-xl shadow-2xl overflow-hidden flex flex-col max-h-[85vh] animate-in fade-in zoom-in-95 duration-200">
            <div className="p-6 border-b border-border flex justify-between items-center shrink-0">
              <h3 className="text-sm md:text-base font-bold flex items-center gap-2">
                <Sparkles className="h-4 w-4 text-muted-foreground/80" />
                <span>Apply: {showApplyModal.title}</span>
              </h3>
              <button
                onClick={() => setShowApplyModal(null)}
                className="p-1 rounded-full hover:bg-muted text-muted-foreground hover:text-foreground transition-colors cursor-pointer"
                aria-label="Close modal"
              >
                <X className="h-5 w-5" />
              </button>
            </div>

            <form onSubmit={handleApplySubmit} className="p-6 space-y-4 overflow-y-auto">
              <div>
                <label className="block text-[10px] uppercase font-bold tracking-wider text-muted-foreground mb-1.5" htmlFor="sop-input">
                  Statement of Purpose
                </label>
                <textarea
                  id="sop-input"
                  value={sop}
                  onChange={(e) => setSop(e.target.value)}
                  placeholder="Explain why you qualify for this academic grant registry..."
                  required
                  rows={4}
                  className="w-full px-3 py-2.5 bg-card border border-border rounded-lg text-xs placeholder:text-muted-foreground/60 focus:border-foreground focus:ring-1 focus:ring-foreground focus:outline-none resize-none"
                />
              </div>

              <div className="grid grid-cols-2 gap-4">
                <div>
                  <label className="block text-[10px] uppercase font-bold tracking-wider text-muted-foreground mb-1.5" htmlFor="gpa-input">
                    Current GPA
                  </label>
                  <input
                    id="gpa-input"
                    type="text"
                    value={gpa}
                    onChange={(e) => setGpa(e.target.value)}
                    required
                    className="w-full h-10 px-3 bg-card border border-border rounded-lg text-xs focus:border-foreground focus:ring-1 focus:ring-foreground focus:outline-none"
                  />
                </div>
                <div>
                  <label className="block text-[10px] uppercase font-bold tracking-wider text-muted-foreground mb-1.5">
                    Grant Value
                  </label>
                  <div className="w-full h-10 px-3 bg-muted/65 border border-border rounded-lg text-xs flex items-center font-bold text-muted-foreground select-none">
                    {showApplyModal.amountCamp}
                  </div>
                </div>
              </div>

              <button
                type="submit"
                disabled={submitting}
                className="w-full h-11 bg-primary text-primary-foreground font-bold rounded-lg hover:bg-primary/95 flex items-center justify-center gap-2 cursor-pointer transition-all active:scale-[0.99] disabled:opacity-85 disabled:cursor-not-allowed mt-4 shadow-sm"
              >
                {submitting ? (
                  <span className="inline-block w-4 h-4 border-2 border-primary-foreground border-t-transparent rounded-full animate-spin"></span>
                ) : (
                  <>
                    <span>Submit Application</span>
                    <ArrowRight className="h-4 w-4" />
                  </>
                )}
              </button>
            </form>
          </div>
        </div>
      )}

      {/* 5. Mobile Bottom Navigation Bar */}
      <nav className="lg:hidden fixed bottom-0 left-0 right-0 h-20 bg-card border-t border-border z-45 flex justify-around items-center px-2 shadow-lg">
        {[
          { label: "Dashboard", icon: LayoutDashboard, active: false },
          { label: "Wallet", icon: Wallet, active: false },
          { label: "Pay", icon: Coins, active: false },
          { label: "Market", icon: Store, active: false },
          { label: "Grants", icon: GraduationCap, active: true },
        ].map((item) => {
          const Icon = item.icon;
          return (
            <button
              key={item.label}
              className={`flex flex-col items-center justify-center w-16 py-2.5 transition-all cursor-pointer ${
                item.active ? "text-foreground font-bold scale-105" : "text-muted-foreground hover:text-foreground"
              }`}
            >
              <Icon className="h-5 w-5 mb-0.5" />
              <span className="text-[10px] tracking-wide">{item.label}</span>
            </button>
          );
        })}
      </nav>
    </div>
  );
}
export default Scholarships;
