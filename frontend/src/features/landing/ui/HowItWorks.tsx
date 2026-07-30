import { Award, BadgeCheck, CreditCard, ReceiptText, ShoppingBag, Wallet } from "lucide-react";
import type { LucideIcon } from "lucide-react";

const desktopSteps: Array<{ icon: LucideIcon; title: string; description: string }> = [
  { icon: Wallet, title: "Connect Wallet", description: "Link your existing Stellar-compatible wallet or create a new one in seconds." },
  { icon: BadgeCheck, title: "Get Verified", description: "Securely verify your student status using campus-issued credentials." },
  { icon: ShoppingBag, title: "Start Transacting", description: "Pay at shops, trade with peers, and earn CAMP rewards on campus." },
  { icon: ReceiptText, title: "Track Assets", description: "Monitor your history and manage digital assets in one clean dashboard." },
];

const mobileSteps: Array<{ icon: LucideIcon; title: string; description: string }> = [
  { icon: Wallet, title: "Onboard", description: "Connect your university ID to generate a secure Stellar-based wallet instantly." },
  { icon: CreditCard, title: "Fund & Pay", description: "Load credits via bank or scholarship funds and tap to pay at any campus merchant." },
  { icon: Award, title: "Earn Rewards", description: "Receive automated rewards and cashback for on-campus spending and activities." },
];

export function HowItWorks() {
  return (
    <section id="how-it-works" className="bg-[#f7f7f5] py-8 sm:py-24">
      <div className="mx-auto max-w-7xl px-6">
        <div className="mb-8 sm:mb-16">
          <span className="text-xs font-semibold uppercase tracking-[0.2em] text-zinc-500 sm:hidden">Process</span>
          <h2 className="mt-2 text-[28px] font-bold leading-[34px] tracking-[-0.02em] text-zinc-950 sm:mt-0 sm:text-4xl sm:leading-11">How it Works</h2>
          <div className="mt-4 hidden h-1 w-16 bg-zinc-950 sm:block" />
        </div>
        <div className="hidden grid-cols-1 gap-6 sm:grid sm:grid-cols-2 lg:grid-cols-4">
          {desktopSteps.map((step, index) => <DesktopStep key={step.title} step={step} number={index + 1} />)}
        </div>
        <div className="flex flex-col gap-6 sm:hidden">
          {mobileSteps.map((step, index) => <MobileStep key={step.title} step={step} number={index + 1} />)}
        </div>
      </div>
    </section>
  );
}

function DesktopStep({ step, number }: { step: (typeof desktopSteps)[number]; number: number }) {
  const Icon = step.icon;
  return <article className="rounded-2xl border border-zinc-200 bg-white p-8 shadow-[0_4px_20px_rgba(0,0,0,0.04)]"><div className="mb-6 flex size-12 items-center justify-center rounded-lg bg-[#f7f7f5]"><Icon size={24} /></div><p className="mb-2 text-xs font-medium text-zinc-500">Step {String(number).padStart(2, "0")}</p><h3 className="mb-4 text-2xl font-semibold tracking-[-0.02em]">{step.title}</h3><p className="text-base font-medium leading-6 text-zinc-500">{step.description}</p></article>;
}

function MobileStep({ step, number }: { step: (typeof mobileSteps)[number]; number: number }) {
  const Icon = step.icon;
  return <article className="flex flex-col gap-4 rounded-xl border border-zinc-200 bg-white p-6"><div className="flex items-center justify-between"><Icon size={30} strokeWidth={1.5} /><span className="text-2xl font-semibold text-zinc-200">{String(number).padStart(2, "0")}</span></div><div><h3 className="text-2xl font-semibold tracking-[-0.02em]">{step.title}</h3><p className="mt-2 text-base font-medium leading-6 text-zinc-500">{step.description}</p></div></article>;
}
