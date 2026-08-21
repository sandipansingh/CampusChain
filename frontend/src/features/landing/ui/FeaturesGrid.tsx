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
    <section id="features" className="bg-background py-16 sm:py-24 transition-colors">
      <div className="mx-auto max-w-7xl px-6">
        <div className="mb-12 text-left sm:mb-20 sm:text-center">
          <span className="text-xs font-semibold uppercase tracking-[0.2em] text-muted-foreground">Capabilities</span>
          <h2 className="mt-2 text-3xl font-bold leading-tight tracking-[-0.03em] text-foreground sm:text-5xl">
            Engineered for modern campus life
          </h2>
          <p className="mx-auto mt-4 max-w-2xl text-base font-medium text-muted-foreground sm:text-lg">
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
    <article className="group relative flex flex-col justify-between rounded-2xl border border-border bg-card/60 p-6 shadow-sm transition-all duration-200 hover:-translate-y-1 hover:border-border hover:bg-card hover:shadow-md">
      <div>
        <div className="flex items-center justify-between">
          <div className="flex size-11 items-center justify-center rounded-xl bg-muted border border-border shadow-sm transition-colors group-hover:bg-muted/80">
            <Icon size={22} className="text-foreground transition-colors" strokeWidth={1.75} />
          </div>
          {feature.badge && (
            <span className="rounded-full bg-muted px-2.5 py-0.5 text-[10px] font-bold uppercase tracking-wider text-muted-foreground transition-colors group-hover:text-foreground">
              {feature.badge}
            </span>
          )}
        </div>
        <h3 className="mt-6 text-lg font-bold tracking-tight text-foreground sm:text-xl">
          {feature.title}
        </h3>
        <p className="mt-2 text-sm font-medium leading-relaxed text-muted-foreground sm:mt-3">
          {feature.description}
        </p>
      </div>
    </article>
  );
}

export default FeaturesGrid;
