import { Wallet, BadgeCheck, Utensils, Award } from "lucide-react";
import type { LucideIcon } from "lucide-react";

interface Step {
  icon: LucideIcon;
  title: string;
  description: string;
}

const steps: Step[] = [
  {
    icon: Wallet,
    title: "Connect Wallet",
    description: "Link your Freighter, xBull, Albedo, or WalletConnect wallet to get started instantly."
  },
  {
    icon: BadgeCheck,
    title: "Verify Identity",
    description: "Securely link your student or faculty credentials to verify your role on-chain."
  },
  {
    icon: Utensils,
    title: "Order & Trade",
    description: "Buy canteen meals with live status tracking, purchase event tickets, or trade on the P2P marketplace."
  },
  {
    icon: Award,
    title: "Earn & Redeem",
    description: "Receive direct-to-wallet scholarship payouts and redeem CAMP tokens for campus rewards."
  }
];

export function HowItWorks() {
  return (
    <section id="how-it-works" className="bg-[#fcfcfa] py-16 sm:py-24 border-y border-zinc-200/60">
      <div className="mx-auto max-w-7xl px-6">
        <div className="mb-12 sm:mb-16">
          <span className="text-xs font-semibold uppercase tracking-[0.2em] text-zinc-500">Lifecycle</span>
          <h2 className="mt-2 text-3xl font-bold leading-tight tracking-[-0.03em] text-zinc-950 sm:text-5xl">How it works</h2>
          <div className="mt-4 hidden h-1 w-16 bg-zinc-950 sm:block" />
        </div>
        <div className="hidden grid-cols-1 gap-6 sm:grid sm:grid-cols-2 lg:grid-cols-4">
          {steps.map((step, index) => <DesktopStep key={step.title} step={step} number={index + 1} />)}
        </div>
        <div className="flex flex-col gap-6 sm:hidden">
          {steps.map((step, index) => <MobileStep key={step.title} step={step} number={index + 1} />)}
        </div>
      </div>
    </section>
  );
}

function DesktopStep({ step, number }: { step: Step; number: number }) {
  const Icon = step.icon;
  return (
    <article className="rounded-2xl border border-zinc-200/80 bg-white p-8 shadow-sm hover:shadow-md transition-all duration-200">
      <div className="mb-6 flex size-12 items-center justify-center rounded-xl bg-zinc-50 border border-zinc-200/50 shadow-inner">
        <Icon size={22} className="text-zinc-700" />
      </div>
      <p className="mb-2 text-xs font-bold text-zinc-400">STEP {String(number).padStart(2, "0")}</p>
      <h3 className="mb-3 text-xl font-bold tracking-tight text-zinc-950">{step.title}</h3>
      <p className="text-sm font-medium leading-relaxed text-zinc-500">{step.description}</p>
    </article>
  );
}

function MobileStep({ step, number }: { step: Step; number: number }) {
  const Icon = step.icon;
  return (
    <article className="flex flex-col gap-4 rounded-xl border border-zinc-200/80 bg-white p-6 shadow-sm">
      <div className="flex items-center justify-between">
        <div className="flex size-10 items-center justify-center rounded-lg bg-zinc-50 border border-zinc-200/50">
          <Icon size={20} className="text-zinc-700" />
        </div>
        <span className="text-2xl font-extrabold text-zinc-200">{String(number).padStart(2, "0")}</span>
      </div>
      <div>
        <h3 className="text-lg font-bold tracking-tight text-zinc-950">{step.title}</h3>
        <p className="mt-1 text-sm font-medium leading-relaxed text-zinc-500">{step.description}</p>
      </div>
    </article>
  );
}
