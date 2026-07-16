"use client";

import React from "react";
import { useCampusTokenMetadata } from "@/hooks/useCampusToken";
import { useActivityStats, useCampusTotalSupply } from "@/hooks/useOnChainStats";
import {
  Coins,
  Award,
  Layers,
  Database,
  Ticket,
  Lock,
  ArrowRightLeft,
  Sparkles,
  Loader2,
} from "lucide-react";

export default function AnalyticsPage() {
  const { data: meta, isLoading: metaLoading } = useCampusTokenMetadata();
  const { data: totalSupply, isLoading: supplyLoading } = useCampusTotalSupply();
  const { data: stats, isLoading: statsLoading } = useActivityStats();

  const isLoading = metaLoading || supplyLoading || statsLoading;

  const formattedSupply = totalSupply != null
    ? (Number(totalSupply) / 10_000_000).toLocaleString(undefined, { maximumFractionDigits: 2 })
    : null;

  const metrics = [
    {
      value: stats?.totalEvents?.toLocaleString() ?? "...",
      label: "Total Ledger Events",
      desc: "Contract events emitted across CampusToken and CampusService on Stellar testnet.",
      icon: ArrowRightLeft,
      color: "bg-blue-50 text-blue-600 border-blue-100",
    },
    {
      value: stats?.escrowEvents?.toLocaleString() ?? "...",
      label: "Escrows Processed",
      desc: "Created, released, and refunded escrow agreements tracked on-chain.",
      icon: Lock,
      color: "bg-purple-50 text-purple-600 border-purple-100",
    },
    {
      value: stats?.transferEvents?.toLocaleString() ?? "...",
      label: "Token Transfers",
      desc: "CAMP token movements recorded across all user and contract accounts.",
      icon: Award,
      color: "bg-emerald-50 text-emerald-600 border-emerald-100",
    },
    {
      value: stats?.ticketEvents?.toLocaleString() ?? "...",
      label: "Ticket Operations",
      desc: "Event passes created, purchased, and redeemed on the ledger.",
      icon: Ticket,
      color: "bg-rose-50 text-rose-600 border-rose-100",
    },
  ];

  return (
    <div className="flex flex-col gap-8 w-full max-w-7xl mx-auto">
      <div className="flex flex-col md:flex-row md:items-center justify-between gap-4">
        <div>
          <h1 className="text-3xl font-extrabold tracking-tight text-slate-900 uppercase">
            Analytics & Stats
          </h1>
          <p className="text-slate-500 text-sm mt-1">
            Real-time on-chain metrics pulled from the Soroban testnet ledger.
          </p>
        </div>
      </div>

      <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-6">
        <div className="bg-white p-6 rounded-2xl">
          <div className="flex items-center justify-between">
            <span className="text-xs font-bold tracking-wider text-slate-400 uppercase">Token Name</span>
            <Coins className="w-5 h-5 text-slate-400" />
          </div>
          <span className="text-2xl font-bold tracking-tight text-slate-900 uppercase mt-4 block">
            {metaLoading ? <Loader2 className="w-5 h-5 animate-spin text-accent" /> : meta?.name}
          </span>
        </div>

        <div className="bg-white p-6 rounded-2xl">
          <div className="flex items-center justify-between">
            <span className="text-xs font-bold tracking-wider text-slate-400 uppercase">Symbol</span>
            <Sparkles className="w-5 h-5 text-slate-400" />
          </div>
          <span className="text-2xl font-bold tracking-tight text-slate-900 uppercase mt-4 block">
            {metaLoading ? <Loader2 className="w-5 h-5 animate-spin text-accent" /> : meta?.symbol}
          </span>
        </div>

        <div className="bg-white p-6 rounded-2xl">
          <div className="flex items-center justify-between">
            <span className="text-xs font-bold tracking-wider text-slate-400 uppercase">Circulating Supply</span>
            <Layers className="w-5 h-5 text-slate-400" />
          </div>
          <span className="text-2xl font-bold tracking-tight text-slate-900 uppercase mt-4 block font-mono">
            {supplyLoading ? <Loader2 className="w-5 h-5 animate-spin text-accent" /> : `${formattedSupply} ${meta?.symbol ?? "CAMP"}`}
          </span>
        </div>

        <div className="bg-white p-6 rounded-2xl">
          <div className="flex items-center justify-between">
            <span className="text-xs font-bold tracking-wider text-slate-400 uppercase">Decimals</span>
            <Database className="w-5 h-5 text-slate-400" />
          </div>
          <span className="text-2xl font-bold tracking-tight text-slate-900 uppercase mt-4 block font-mono">
            {metaLoading ? <Loader2 className="w-5 h-5 animate-spin text-accent" /> : meta?.decimals}
          </span>
        </div>
      </div>

      <div className="flex flex-col gap-6">
        <h3 className="text-xs font-bold tracking-wider text-slate-400 uppercase">
          Performance Metrics (last 5000 ledgers)
        </h3>

        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-6">
          {metrics.map((metric) => {
            const Icon = metric.icon;
            return (
              <div key={metric.label} className="bg-white p-6 rounded-2xl flex flex-col justify-between min-h-[260px]">
                <div className="flex justify-between items-start">
                  <div className={`w-10 h-10 rounded-xl border flex items-center justify-center ${metric.color}`}>
                    <Icon className="w-5 h-5" />
                  </div>
                  <span className="text-3xl font-extrabold tracking-tight text-accent leading-none font-mono">
                    {isLoading ? <Loader2 className="w-5 h-5 animate-spin" /> : metric.value}
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
