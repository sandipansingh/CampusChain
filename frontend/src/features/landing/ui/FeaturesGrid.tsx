import {
  Coins,
  Utensils,
  GraduationCap,
  ShieldCheck,
  Ticket,
  Building2,
  Gift,
  Activity
} from "lucide-react";
import type { LucideIcon } from "lucide-react";

interface Feature {
  icon: LucideIcon;
  title: string;
  description: string;
  badge?: string;
}

const features: Feature[] = [
  {
    icon: Coins,
    title: "CAMP Token Ecosystem",
    description: "Fungible Soroban token (7 decimals). Instantly buy CAMP with XLM at a 1:100 rate, or request dev testnet funds via faucet.",
    badge: "Core"
  },
  {
    icon: Utensils,
    title: "Campus Food Ordering",
    description: "On-chain canteen ordering. Browse menus, pay with CAMP, and track order status live with contract-enforced refunds.",
    badge: "New"
  },
  {
    icon: GraduationCap,
    title: "On-Chain Scholarships",
    description: "Complete decentralized scholarship lifecycle. Students apply, admins review, and funds disburse directly to student wallets.",
    badge: "Scholarships"
  },
  {
    icon: ShieldCheck,
    title: "Escrow Marketplace",
    description: "Secure P2P textbook and supply trading. Funds are locked in smart contracts and released upon successful exchange.",
    badge: "P2P Trades"
  },
  {
    icon: Ticket,
    title: "Event Ticketing",
    description: "Buy and redeem event tickets securely on-chain. Capacity limits are enforced programmatically for fraud-free admission.",
    badge: "Events"
  },
  {
    icon: Building2,
    title: "University Registry",
    description: "Institutional onboarding registry. Manage student/faculty memberships, permissions, and administrative approvals.",
    badge: "Admin"
  },
  {
    icon: Gift,
    title: "Rewards Catalogue",
    description: "Redeem CAMP tokens for utility rewards. Tokens are burned automatically upon redemption to manage circulating supply.",
    badge: "Rewards"
  },
  {
    icon: Activity,
    title: "Live Activity Feed",
    description: "Real-time Soroban event polling (4s interval) to update transactional history feeds and trigger live UI notifications.",
    badge: "Real-Time"
  }
];

export function FeaturesGrid() {
  return (
    <section id="features" className="bg-white py-16 sm:py-24">
      <div className="mx-auto max-w-7xl px-6">
        <div className="mb-12 text-left sm:mb-20 sm:text-center">
          <span className="text-xs font-semibold uppercase tracking-[0.2em] text-zinc-500">Capabilities</span>
          <h2 className="mt-2 text-3xl font-bold leading-tight tracking-[-0.03em] text-zinc-950 sm:text-5xl">
            Engineered for modern campus life
          </h2>
          <p className="mx-auto mt-4 max-w-2xl text-base font-medium text-zinc-500 sm:text-lg">
            A secure, instant, and transparent payment and services ecosystem built on Stellar Soroban smart contracts.
          </p>
        </div>
        
        <div className="grid grid-cols-1 gap-6 sm:grid-cols-2 lg:grid-cols-3 xl:grid-cols-4">
          {features.map((feature) => (
            <FeatureCard key={feature.title} feature={feature} />
          ))}
        </div>
      </div>
    </section>
  );
}

function FeatureCard({ feature }: { feature: Feature }) {
  const Icon = feature.icon;
  return (
    <article className="group relative flex flex-col justify-between rounded-2xl border border-zinc-200/80 bg-zinc-50/20 p-6 shadow-sm transition-all duration-200 hover:-translate-y-1 hover:border-zinc-300 hover:bg-zinc-50/50 hover:shadow-md">
      <div>
        <div className="flex items-center justify-between">
          <div className="flex size-11 items-center justify-center rounded-xl bg-zinc-50 border border-zinc-200/60 shadow-sm transition-colors group-hover:bg-white group-hover:border-zinc-300">
            <Icon size={22} className="text-zinc-700 transition-colors group-hover:text-zinc-950" strokeWidth={1.75} />
          </div>
          {feature.badge && (
            <span className="rounded-full bg-zinc-100 px-2.5 py-0.5 text-[10px] font-bold uppercase tracking-wider text-zinc-600 transition-colors group-hover:bg-zinc-200/60 group-hover:text-zinc-900">
              {feature.badge}
            </span>
          )}
        </div>
        <h3 className="mt-6 text-lg font-bold tracking-tight text-zinc-950 sm:text-xl">
          {feature.title}
        </h3>
        <p className="mt-2 text-sm font-medium leading-relaxed text-zinc-500 sm:mt-3">
          {feature.description}
        </p>
      </div>
    </article>
  );
}
