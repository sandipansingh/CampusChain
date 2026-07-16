"use client";

import React from "react";
import Header from "@/components/Header";
import { useCampusTokenMetadata } from "@/hooks/useCampusToken";

export default function AnalyticsPage() {
  const { data: meta, isLoading } = useCampusTokenMetadata();

  const metrics = [
    {
      num: "840K",
      label: "TOTAL TRANSACTIONS",
      desc: "Cumulative transaction count processed across all campus nodes since system genesis.",
    },
    {
      num: "2,450",
      label: "ESCROWS SETTLED",
      desc: "Marketplace purchases successfully validated and released via smart contract escrows.",
    },
    {
      num: "125K",
      label: "REWARDS MINTED",
      desc: "Academic merit reward points minted and distributed to students for extracurricular merit.",
    },
    {
      num: "14.2K",
      label: "TICKET PASSES SOLD",
      desc: "Tokenized club event tickets purchased, validated, and verified on-chain.",
    },
  ];

  return (
    <div className="min-h-screen bg-background text-foreground flex flex-col font-sans">
      <Header />

      {/* Hero Header */}
      <section className="w-full border-b-2 border-border py-20 bg-background relative overflow-hidden">
        <div className="max-w-[95vw] mx-auto z-10 relative">
          <span className="text-accent text-sm font-bold tracking-widest uppercase mb-4 block">
            {"// METRIC TELEMETRY"}
          </span>
          <h1 className="text-5xl md:text-8xl font-bold tracking-tighter uppercase leading-none">
            ANALYTICS & STATS
          </h1>
          <p className="text-muted-foreground text-lg md:text-xl font-medium mt-4 max-w-xl">
            Real-time token distribution stats, cumulative transaction count, and active escrow volumes.
          </p>
        </div>
      </section>

      {/* Global Ledger Stats Block */}
      <section className="w-full border-b-2 border-border py-16 bg-muted/20">
        <div className="max-w-[95vw] mx-auto grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-6">
          <div className="border-2 border-border bg-background p-8 flex flex-col justify-between min-h-[180px]">
            <span className="text-xs font-bold tracking-wider text-muted-foreground uppercase">
              {"// TOKEN NAME"}
            </span>
            <span className="text-3xl md:text-4xl font-bold tracking-tighter uppercase mt-4">
              {isLoading ? "..." : meta?.name}
            </span>
          </div>

          <div className="border-2 border-border bg-background p-8 flex flex-col justify-between min-h-[180px]">
            <span className="text-xs font-bold tracking-wider text-muted-foreground uppercase">
              {"// SYMBOL"}
            </span>
            <span className="text-3xl md:text-4xl font-bold tracking-tighter uppercase mt-4">
              {isLoading ? "..." : meta?.symbol}
            </span>
          </div>

          <div className="border-2 border-border bg-background p-8 flex flex-col justify-between min-h-[180px]">
            <span className="text-xs font-bold tracking-wider text-muted-foreground uppercase">
              {"// TOTAL CIRCULATING SUPPLY"}
            </span>
            <span className="text-3xl md:text-4xl font-bold tracking-tighter uppercase mt-4">
              {isLoading ? "..." : `${meta?.totalSupply?.toLocaleString()} ${meta?.symbol}`}
            </span>
          </div>

          <div className="border-2 border-border bg-background p-8 flex flex-col justify-between min-h-[180px]">
            <span className="text-xs font-bold tracking-wider text-muted-foreground uppercase">
              {"// DECIMALS"}
            </span>
            <span className="text-3xl md:text-4xl font-bold tracking-tighter uppercase mt-4">
              {isLoading ? "..." : meta?.decimals}
            </span>
          </div>
        </div>
      </section>

      {/* Metric Cards Grid */}
      <main className="max-w-[95vw] w-full mx-auto py-16 flex-1 flex flex-col gap-12">
        <h3 className="text-xl font-bold tracking-wider text-muted-foreground uppercase">
          {"// PERFORMANCE METRICS"}
        </h3>

        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-6">
          {metrics.map((metric) => (
            <div
              key={metric.label}
              className="border-2 border-border bg-background p-8 flex flex-col justify-between min-h-[350px] hover:border-accent transition-colors duration-300"
            >
              <div>
                <span className="text-[5rem] md:text-[6rem] font-bold tracking-tighter text-accent leading-none">
                  {metric.num}
                </span>
                <h4 className="text-xl font-bold tracking-tight uppercase mt-6 leading-none">
                  {metric.label}
                </h4>
              </div>
              <p className="text-muted-foreground font-medium text-base mt-6">
                {metric.desc}
              </p>
            </div>
          ))}
        </div>
      </main>
    </div>
  );
}
