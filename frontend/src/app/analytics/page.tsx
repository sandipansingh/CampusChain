"use client";

import React from "react";
import { useCampusTokenMetadata } from "@/hooks/useCampusToken";
import {
  Coins,
  Award,
  Layers,
  Database,
  Ticket,
  Lock,
  ArrowRightLeft,
  Sparkles
} from "lucide-react";

export default function AnalyticsPage() {
  const { data: meta, isLoading } = useCampusTokenMetadata();

  const metrics = [
    {
      num: "840K",
      label: "Total Transactions",
      desc: "Cumulative transaction count processed across all campus nodes since system genesis.",
      icon: ArrowRightLeft,
      color: "bg-blue-50 text-blue-600 border-blue-100",
    },
    {
      num: "2,450",
      label: "Escrows Settled",
      desc: "Marketplace purchases successfully validated and released via smart contract escrows.",
      icon: Lock,
      color: "bg-purple-50 text-purple-600 border-purple-100",
    },
    {
      num: "125K",
      label: "Rewards Minted",
      desc: "Academic merit reward points minted and distributed to students for extracurricular merit.",
      icon: Award,
      color: "bg-emerald-50 text-emerald-600 border-emerald-100",
    },
    {
      num: "14.2K",
      label: "Ticket Passes Sold",
      desc: "Tokenized club event tickets purchased, validated, and verified on-chain.",
      icon: Ticket,
      color: "bg-rose-50 text-rose-600 border-rose-100",
    },
  ];

  return (
    <div className="flex flex-col gap-8 w-full max-w-7xl mx-auto">
      {/* Title */}
      <div className="flex flex-col md:flex-row md:items-center justify-between gap-4">
        <div>
          <h1 className="text-3xl font-extrabold tracking-tight text-slate-900 uppercase">
            Analytics & Stats
          </h1>
          <p className="text-slate-500 text-sm mt-1">
            Real-time token distribution statistics, circulating supply, and performance metrics.
          </p>
        </div>
      </div>

      {/* Global Ledger Stats Block - Flat, no shadows */}
      <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-6">
        <div className="bg-white border border-border p-6 rounded-2xl">
          <div className="flex items-center justify-between">
            <span className="text-xs font-bold tracking-wider text-slate-400 uppercase">
              Token Name
            </span>
            <Coins className="w-5 h-5 text-slate-400" />
          </div>
          <span className="text-2xl font-bold tracking-tight text-slate-900 uppercase mt-4 block">
            {isLoading ? "..." : meta?.name}
          </span>
        </div>

        <div className="bg-white border border-border p-6 rounded-2xl">
          <div className="flex items-center justify-between">
            <span className="text-xs font-bold tracking-wider text-slate-400 uppercase">
              Symbol
            </span>
            <Sparkles className="w-5 h-5 text-slate-400" />
          </div>
          <span className="text-2xl font-bold tracking-tight text-slate-900 uppercase mt-4 block">
            {isLoading ? "..." : meta?.symbol}
          </span>
        </div>

        <div className="bg-white border border-border p-6 rounded-2xl">
          <div className="flex items-center justify-between">
            <span className="text-xs font-bold tracking-wider text-slate-400 uppercase">
              Circulating Supply
            </span>
            <Layers className="w-5 h-5 text-slate-400" />
          </div>
          <span className="text-2xl font-bold tracking-tight text-slate-900 uppercase mt-4 block font-mono">
            {isLoading ? "..." : `${meta?.totalSupply?.toLocaleString()} ${meta?.symbol}`}
          </span>
        </div>

        <div className="bg-white border border-border p-6 rounded-2xl">
          <div className="flex items-center justify-between">
            <span className="text-xs font-bold tracking-wider text-slate-400 uppercase">
              Decimals
            </span>
            <Database className="w-5 h-5 text-slate-400" />
          </div>
          <span className="text-2xl font-bold tracking-tight text-slate-900 uppercase mt-4 block font-mono">
            {isLoading ? "..." : meta?.decimals}
          </span>
        </div>
      </div>

      {/* Metric Cards Grid - Flat, no shadows */}
      <div className="flex flex-col gap-6">
        <h3 className="text-xs font-bold tracking-wider text-slate-400 uppercase">
          Performance Metrics
        </h3>

        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-6">
          {metrics.map((metric) => {
            const Icon = metric.icon;
            return (
              <div
                key={metric.label}
                className="bg-white border border-border p-6 rounded-2xl flex flex-col justify-between min-h-[260px]"
              >
                <div className="flex justify-between items-start">
                  <div className={`w-10 h-10 rounded-xl border flex items-center justify-center ${metric.color}`}>
                    <Icon className="w-5 h-5" />
                  </div>
                  <span className="text-3xl font-extrabold tracking-tight text-accent leading-none font-mono">
                    {metric.num}
                  </span>
                </div>
                
                <div className="mt-8 flex flex-col gap-2">
                  <h4 className="text-sm font-bold tracking-tight text-slate-800 uppercase leading-none">
                    {metric.label}
                  </h4>
                  <p className="text-xs text-slate-500 font-medium leading-relaxed">
                    {metric.desc}
                  </p>
                </div>
              </div>
            );
          })}
        </div>
      </div>
    </div>
  );
}
