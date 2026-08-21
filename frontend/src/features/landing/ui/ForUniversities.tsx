import { CheckCircle2, ShieldCheck, Store } from "lucide-react";

const benefits = [
  "On-Chain Identity & Member Registry",
  "Automated Scholarship Disbursements",
  "Canteen Merchant Management & Approvals",
  "Real-Time Audit Trail & Event Polling"
];

export function ForUniversities() {
  return (
    <section id="universities" className="overflow-hidden bg-muted/10 py-16 sm:py-24 border-b border-border transition-colors">
      <div className="mx-auto grid max-w-7xl grid-cols-1 items-center gap-12 px-6 lg:grid-cols-2 lg:gap-16">
        <div>
          <span className="text-xs font-semibold uppercase tracking-[0.2em] text-muted-foreground">Administration</span>
          <h2 className="mt-2 text-3xl font-bold leading-tight tracking-[-0.03em] text-foreground sm:text-4xl sm:leading-11">
            Built for administrative clarity
          </h2>
          <p className="mt-4 text-base font-medium leading-relaxed text-muted-foreground sm:mt-6 sm:text-lg">
            Deploy a secure payment and services ecosystem in minutes. CampusChain provides university admins with real-time financial oversight, automated scholarship distribution, canteen merchant validation, and member registry controls.
          </p>
          <ul className="mt-8 space-y-4">
            {benefits.map((benefit) => (
              <li key={benefit} className="flex items-center gap-3 text-sm font-semibold text-foreground/90 sm:text-base">
                <CheckCircle2 size={18} className="text-emerald-500 shrink-0" />
                {benefit}
              </li>
            ))}
          </ul>
        </div>
        <div className="flex flex-col gap-6 lg:gap-8">
          <DesktopMockup />
        </div>
      </div>
    </section>
  );
}

function DesktopMockup() {
  return (
    <div className="relative w-full">
      {/* Abstract Admin Panel Card */}
      <div className="relative z-10 mx-auto w-full max-w-lg rounded-2xl border border-border bg-card p-6 shadow-lg transition-shadow hover:shadow-xl sm:p-8">
        <div className="mb-6 flex items-center justify-between border-b border-border pb-4">
          <div className="flex items-center gap-2">
            <span className="size-2.5 rounded-full bg-primary" />
            <span className="text-sm font-bold tracking-tight text-foreground">University Registry Admin</span>
          </div>
          <span className="rounded-full bg-emerald-500/10 border border-emerald-500/20 px-2.5 py-0.5 text-[10px] font-bold tracking-wide text-emerald-600 dark:text-emerald-400">
            Connected
          </span>
        </div>
        
        <div className="space-y-5">
          {/* Stat Cards Row */}
          <div className="grid grid-cols-2 gap-4">
            <div className="rounded-xl border border-border bg-muted/40 p-4">
              <div className="text-xs font-bold text-muted-foreground uppercase tracking-wider">Total Members</div>
              <div className="mt-1 text-2xl font-extrabold text-foreground">1,248</div>
            </div>
            <div className="rounded-xl border border-border bg-muted/40 p-4">
              <div className="text-xs font-bold text-muted-foreground uppercase tracking-wider">Scholarships Paid</div>
              <div className="mt-1 text-2xl font-extrabold text-foreground">45k CAMP</div>
            </div>
          </div>

          {/* Pending Tasks Section */}
          <div className="rounded-xl border border-border p-4 bg-muted/20">
            <div className="mb-3 text-xs font-bold text-muted-foreground uppercase tracking-wider">Administrative Approvals</div>
            <div className="space-y-3">
              <div className="flex items-center justify-between text-xs">
                <div className="flex items-center gap-2 font-semibold text-foreground/90">
                  <Store size={14} className="text-muted-foreground" />
                  <span>Engineering Cafe (Merchant Request)</span>
                </div>
                <span className="rounded bg-foreground px-2 py-0.5 font-bold text-background">Approve</span>
              </div>
              <div className="flex items-center justify-between text-xs">
                <div className="flex items-center gap-2 font-semibold text-foreground/90">
                  <ShieldCheck size={14} className="text-muted-foreground" />
                  <span>Student #8291 (Verify Identity)</span>
                </div>
                <span className="rounded bg-foreground px-2 py-0.5 font-bold text-background">Verify</span>
              </div>
            </div>
          </div>
        </div>
      </div>
      {/* Background visual accents */}
      <div className="absolute -right-6 -top-6 -z-10 size-64 rounded-full border border-border/50 opacity-60" />
      <div className="absolute -bottom-8 -left-8 -z-10 size-48 rounded-full bg-muted blur-3xl opacity-50" />
    </div>
  );
}

export default ForUniversities;
