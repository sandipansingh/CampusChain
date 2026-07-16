"use client";

import { useEffect } from "react";
import { useRouter } from "next/navigation";
import Link from "next/link";
import Header from "@/components/Header";
import { useWalletStore } from "@/state/useWalletStore";

export default function LandingPage() {
  const { address, isConnecting, connectWallet } = useWalletStore();
  const router = useRouter();

  // If wallet is already connected, auto-redirect to dashboard
  useEffect(() => {
    if (address) {
      router.push("/dashboard");
    }
  }, [address, router]);

  const features = [
    {
      num: "01",
      title: "INSTANT QR PAYMENTS",
      desc: "Scan to pay at any campus merchant instantly. Zero settlement wait times, powered by fast-finality Stellar ledger operations.",
    },
    {
      num: "02",
      title: "P2P ESCROW MARKETPLACE",
      desc: "Buy and sell student gear with on-chain security. Tokens are locked in smart contract escrow and released only upon delivery verification.",
    },
    {
      num: "03",
      title: "DIGITAL CLUB TICKETING",
      desc: "Clubs create events and sell tickets directly as tokenized passes. Validated at the door by organizers with cryptographic signatures.",
    },
    {
      num: "04",
      title: "REWARDS & SCHOLARSHIPS",
      desc: "Earn campus tokens for extracurricular merit. Automate scholarship payouts using custom Soroban state transitions.",
    },
  ];

  return (
    <div className="min-h-screen bg-background text-foreground flex flex-col font-sans select-none">
      <Header />

      {/* Hero Section */}
      <section className="relative w-full flex flex-col items-center justify-center pt-24 pb-16 overflow-hidden border-b-2 border-border">
        <div className="max-w-[95vw] w-full flex flex-col items-start justify-center gap-8 z-10">
          <span className="text-accent text-lg md:text-xl font-bold tracking-widest uppercase">
            {"// UNIFIED CAMPUS ECONOMY"}
          </span>
          <h1 className="text-[clamp(2.5rem,11vw,12rem)] font-bold tracking-tighter leading-[0.85] text-left uppercase">
            FINANCE <br />
            REDEFINED.
          </h1>
          <p className="max-w-2xl text-lg md:text-2xl text-muted-foreground font-medium leading-tight">
            Replace manual checks, paper tickets, and fragmented payments with a single
            Stellar-powered Web3 economy built exclusively for your university.
          </p>

          <div className="flex flex-wrap gap-4 mt-4">
            {address ? (
              <Link href="/dashboard">
                <button className="h-16 px-10 bg-accent text-accent-foreground uppercase tracking-tighter font-bold text-lg transition-all duration-300 hover:scale-105 active:scale-95">
                  ENTER ECONOMY →
                </button>
              </Link>
            ) : (
              <button
                onClick={connectWallet}
                disabled={isConnecting}
                className="h-16 px-10 bg-accent text-accent-foreground uppercase tracking-tighter font-bold text-lg transition-all duration-300 hover:scale-105 active:scale-95"
              >
                {isConnecting ? "CONNECTING..." : "ACTIVATE WALLET →"}
              </button>
            )}
            <a
              href="#features"
              className="h-16 px-10 border-2 border-border bg-transparent text-foreground uppercase tracking-tighter font-bold text-lg flex items-center justify-center transition-colors duration-200 hover:bg-foreground hover:text-background"
            >
              EXPLORE PROTOCOLS
            </a>
          </div>
        </div>

        {/* Huge decorative watermark background number */}
        <div className="absolute right-0 bottom-0 text-[18rem] md:text-[24rem] font-bold text-muted opacity-5 leading-none translate-y-1/4 pointer-events-none select-none">
          CAMPUS
        </div>
      </section>

      {/* Fast Infinite Stats Marquee */}
      <section className="w-full bg-accent text-accent-foreground py-6 overflow-hidden border-b-2 border-border flex items-center">
        <div className="animate-marquee-ltr animate-marquee-fast flex gap-12 whitespace-nowrap text-2xl md:text-4xl font-bold tracking-tighter uppercase">
          <span>★ 12,000+ ACTIVE STUDENTS</span>
          <span>★ 85 PARTICIPATING MERCHANTS</span>
          <span>★ 320K+ SETTLED TRANSACTIONS</span>
          <span>★ 100% STELLAR POWERED</span>
          <span>★ ZERO MANUAL CHECKS</span>
          {/* Duplicate for infinite loop */}
          <span>★ 12,000+ ACTIVE STUDENTS</span>
          <span>★ 85 PARTICIPATING MERCHANTS</span>
          <span>★ 320K+ SETTLED TRANSACTIONS</span>
          <span>★ 100% STELLAR POWERED</span>
          <span>★ ZERO MANUAL CHECKS</span>
        </div>
      </section>

      {/* Features Brutalist Hairline Grid */}
      <section id="features" className="w-full py-32 border-b-2 border-border">
        <div className="max-w-[95vw] mx-auto flex flex-col gap-16">
          <div className="flex flex-col md:flex-row items-start md:items-end justify-between gap-8">
            <h2 className="text-5xl md:text-7xl font-bold tracking-tighter uppercase leading-none">
              CAMPUS PROTOCOLS
            </h2>
            <span className="text-muted-foreground text-lg md:text-xl font-medium max-w-md">
              Custom Soroban smart contracts orchestrating decentralized services with absolute security.
            </span>
          </div>

          <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-6">
            {features.map((feat) => (
              <div
                key={feat.num}
                className="group border-2 border-border bg-background p-8 flex flex-col justify-between min-h-[350px] transition-all duration-300 hover:bg-accent hover:border-accent hover:text-accent-foreground rounded-2xl"
              >
                <div>
                  <span className="text-4xl font-bold text-muted group-hover:text-accent-foreground/50 transition-colors duration-300 font-mono">
                    {feat.num}
                  </span>
                  <h3 className="text-2xl font-bold tracking-tight mt-6 uppercase leading-none">
                    {feat.title}
                  </h3>
                </div>
                <p className="text-muted-foreground group-hover:text-accent-foreground font-medium text-base mt-6">
                  {feat.desc}
                </p>
              </div>
            ))}
          </div>
        </div>
      </section>

      {/* Slower News Marquee */}
      <section className="w-full bg-background py-8 border-b-2 border-border overflow-hidden flex items-center">
        <div className="animate-marquee-rtl animate-marquee-slow flex gap-16 whitespace-nowrap text-xl md:text-2xl font-bold tracking-widest uppercase text-muted-foreground">
          <span>{"// NEW MERCHANDISE ESCROWS LIVE NOW"}</span>
          <span>{"// UNIVERSITY ACCREDITATION SCHOLARSHIPS ACTIVE"}</span>
          <span>{"// CLUB EVENTS TICKETING PIPELINE DEPLOYED ON TESTNET"}</span>
          <span>{"// SWK SUPPORT EXTENDED TO FREIGHTER AND ALBEDO WALLETS"}</span>
          {/* Duplicate for infinite loop */}
          <span>{"// NEW MERCHANDISE ESCROWS LIVE NOW"}</span>
          <span>{"// UNIVERSITY ACCREDITATION SCHOLARSHIPS ACTIVE"}</span>
          <span>{"// CLUB EVENTS TICKETING PIPELINE DEPLOYED ON TESTNET"}</span>
          <span>{"// SWK SUPPORT EXTENDED TO FREIGHTER AND ALBEDO WALLETS"}</span>
        </div>
      </section>

      {/* Call to Action Section */}
      <section className="w-full py-32 bg-background relative overflow-hidden flex flex-col items-center justify-center">
        <div className="max-w-[95vw] w-full text-center flex flex-col items-center gap-8 z-10">
          <h2 className="text-4xl md:text-8xl font-bold tracking-tighter uppercase leading-[0.85] max-w-4xl">
            JOIN THE DIGITAL TRANSFORMATION
          </h2>
          <p className="max-w-xl text-lg md:text-xl text-muted-foreground font-medium">
            Equip your phone with freighter wallet, load testnet XLM, and dive into a fully
            decentralized campus economy ecosystem.
          </p>
          <button
            onClick={connectWallet}
            disabled={isConnecting}
            className="h-20 px-16 bg-accent text-accent-foreground uppercase tracking-tighter font-bold text-xl rounded-2xl transition-all duration-300 hover:scale-105 active:scale-95 shadow-lg shadow-accent/25"
          >
            {isConnecting ? "CONNECTING..." : "CONNECT WALLET NOW"}
          </button>
        </div>

        {/* Decorative background grids */}
        <div className="absolute inset-0 bg-[linear-gradient(to_right,#cbd5e1_1px,transparent_1px),linear-gradient(to_bottom,#cbd5e1_1px,transparent_1px)] bg-[size:4rem_4rem] [mask-image:radial-gradient(ellipse_60%_50%_at_50%_50%,#000_70%,transparent_100%)] opacity-15 pointer-events-none" />
      </section>

      {/* Footer */}
      <footer className="w-full border-t-2 border-border py-12 bg-background mt-auto">
        <div className="max-w-[95vw] mx-auto flex flex-col md:flex-row items-center justify-between gap-6">
          <span className="text-sm font-semibold text-slate-500 uppercase tracking-wider">
            © 2026 CampusChain Labs. Built on Stellar/Soroban.
          </span>
          <div className="flex gap-8">
            <a
              href="https://github.com/sandipansingh/CampusChain/blob/main/docs/architecture.md"
              target="_blank"
              rel="noopener noreferrer"
              className="text-sm font-semibold text-slate-400 hover:text-accent uppercase tracking-wider"
            >
              Architecture
            </a>
            <a
              href="https://github.com/sandipansingh/CampusChain/blob/main/docs/SECURITY.md"
              target="_blank"
              rel="noopener noreferrer"
              className="text-sm font-semibold text-slate-400 hover:text-accent uppercase tracking-wider"
            >
              Security
            </a>
            <a
              href="https://github.com/sandipansingh/CampusChain/blob/main/docs/DEPLOYMENT.md"
              target="_blank"
              rel="noopener noreferrer"
              className="text-sm font-semibold text-slate-400 hover:text-accent uppercase tracking-wider"
            >
              Deployment
            </a>
          </div>
        </div>
      </footer>
    </div>
  );
}
