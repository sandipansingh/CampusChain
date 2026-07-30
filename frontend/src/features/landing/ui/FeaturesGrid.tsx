import { BadgeCheck, QrCode, ReceiptText, School, ShieldCheck, Store, Ticket, Trophy } from "lucide-react";
import type { LucideIcon } from "lucide-react";

const desktopFeatures: Array<{ icon: LucideIcon; title: string; description: string }> = [
  { icon: QrCode, title: "QR Payments", description: "Lightning-fast scan-to-pay at campus kiosks, cafeterias, and bookstores." },
  { icon: Store, title: "Escrow Marketplace", description: "Peer-to-peer textbook and supply trading with secure smart-contract escrow." },
  { icon: Ticket, title: "Event Ticketing", description: "Digital-first entry for sports, concerts, and workshops. Fraud-proof and instant." },
  { icon: Trophy, title: "CAMP Rewards", description: "Earn native utility tokens for volunteer work, high grades, or eco-friendly habits." },
  { icon: School, title: "Scholarships", description: "Direct-to-wallet disbursements with zero intermediary delays or processing fees." },
  { icon: ReceiptText, title: "Transaction History", description: "Transparent, immutable logs for all campus financial interactions." },
];

const mobileFeatures: Array<{ icon: LucideIcon; title: string; description: string }> = [
  { icon: ShieldCheck, title: "Secure Identity", description: "Encrypted biometric authentication tied to campus credentials." },
  { icon: Store, title: "Merchant Portal", description: "Real-time settlement and analytics for campus shops and cafes." },
  { icon: BadgeCheck, title: "Ledger Transparency", description: "Auditable, immutable transaction history for university compliance." },
];

export function FeaturesGrid() {
  return <section id="features" className="bg-white py-8 sm:py-24"><div className="mx-auto max-w-7xl px-6"><div className="mb-8 text-left sm:mb-16 sm:text-center"><h2 className="text-[28px] font-bold leading-[34px] tracking-[-0.02em] text-zinc-950 sm:text-4xl sm:leading-11"><span className="sm:hidden">Infrastructure Features</span><span className="hidden sm:inline">Engineered for Campus Life</span></h2><p className="mt-4 hidden text-base font-medium text-zinc-500 sm:block">The essential tools for a modern digital university economy.</p></div><div className="hidden grid-cols-1 gap-8 md:grid md:grid-cols-2 lg:grid-cols-3">{desktopFeatures.map((feature) => <FeatureCard key={feature.title} feature={feature} />)}</div><div className="flex flex-col gap-4 md:hidden">{mobileFeatures.map((feature) => <FeatureCard key={feature.title} feature={feature} />)}</div></div></section>;
}

function FeatureCard({ feature }: { feature: { icon: LucideIcon; title: string; description: string } }) {
  const Icon = feature.icon;
  return <article className="rounded-xl border border-zinc-200 bg-white p-6 shadow-[0_4px_20px_rgba(0,0,0,0.04)] transition-colors hover:bg-[#f7f7f5] sm:p-8"><Icon className="mb-4 sm:mb-6" size={28} strokeWidth={1.75} /><h3 className="text-2xl font-semibold tracking-[-0.02em]">{feature.title}</h3><p className="mt-2 text-base font-medium leading-6 text-zinc-500 sm:mt-3">{feature.description}</p></article>;
}
