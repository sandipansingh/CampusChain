"use client";

import React from "react";
import { useWalletStore, NetworkType } from "@/state/useWalletStore";
import {
  Globe,
  Monitor,
  Server,
  Lock
} from "lucide-react";

export default function SettingsPage() {
  const { network, switchNetwork } = useWalletStore();

  const networksList = [
    {
      id: "testnet",
      name: "Stellar Testnet",
      passphrase: "Test SDF Network ; September 2015",
      rpc: "https://soroban-testnet.stellar.org",
      desc: "Primary sandbox network powered by Stellar Development Foundation validators. Ideal for prototyping and token validation.",
      icon: Globe,
      locked: false,
    },
    {
      id: "standalone",
      name: "Local Standalone",
      passphrase: "Standalone Network ; Latitude 0.0",
      rpc: "http://localhost:8000/soroban/rpc",
      desc: "Fully isolated local docker container sandbox environment. Locked in live staging node distribution.",
      icon: Monitor,
      locked: true,
    },
    {
      id: "public",
      name: "Stellar Mainnet",
      passphrase: "Public Global Stellar Network ; September 2015",
      rpc: "https://soroban-rpc.stellar.org",
      desc: "Production environment orchestrating actual economic value. Restricted for approved university systems.",
      icon: Server,
      locked: true,
    },
  ];

  return (
    <div className="flex flex-col gap-6 w-full max-w-7xl mx-auto">
      {/* Title */}
      <div className="flex flex-col md:flex-row md:items-center justify-between gap-4">
        <div>
          <h1 className="text-2xl font-semibold tracking-tight text-slate-900 uppercase">
            Network Config
          </h1>
          <p className="text-slate-700 text-xs font-semibold mt-1">
            Configure RPC nodes, network passphrases, wallet modules, and transaction settlement constraints.
          </p>
        </div>
      </div>

      {/* Network Selectors */}
      <div className="flex flex-col gap-4">
        <h3 className="text-xs font-bold tracking-wider text-slate-700 uppercase">
          Available Networks
        </h3>

        <div className="grid grid-cols-1 lg:grid-cols-3 gap-6">
          {networksList.map((net) => {
            const isSelected = network === net.id;
            const Icon = net.icon;

            // Configure soft background colors & icons for active networks to avoid monochromatic styles
            let activeBgClass = "bg-white";
            let activeIconClass = "bg-slate-50 text-slate-700";
            let activeBadgeClass = "bg-slate-900 text-white";

            if (isSelected) {
              activeBgClass = "bg-emerald-50/70";
              activeIconClass = "bg-emerald-100 text-emerald-800";
              activeBadgeClass = "bg-emerald-600 text-white";
            } else if (net.locked) {
              activeBgClass = "bg-white opacity-50 cursor-not-allowed";
              activeIconClass = "bg-slate-50 text-slate-405";
            }

            return (
              <div
                key={net.id}
                onClick={() => {
                  if (!net.locked) {
                    switchNetwork(net.id as NetworkType);
                  }
                }}
                className={`p-6 rounded-[24px] flex flex-col justify-between min-h-[260px] group transition-all duration-300 shadow-sm ${
                  net.locked ? "cursor-not-allowed" : "cursor-pointer"
                } ${activeBgClass}`}
              >
                <div>
                  <div className="flex justify-between items-start">
                    <div className={`w-10 h-10 rounded-xl flex items-center justify-center transition-colors ${activeIconClass}`}>
                      <Icon className="w-5 h-5" />
                    </div>
                    {isSelected ? (
                      <span className={`text-[10px] font-bold tracking-widest uppercase px-2.5 py-0.5 rounded-full ${activeBadgeClass}`}>
                        Active
                      </span>
                    ) : net.locked ? (
                      <span className="text-[10px] font-bold tracking-widest uppercase bg-slate-100 text-slate-400 px-2.5 py-0.5 rounded-full flex items-center gap-1">
                        <Lock className="w-3 h-3" />
                        Locked
                      </span>
                    ) : null}
                  </div>

                  <h4 className="text-lg font-bold uppercase text-slate-900 mt-6 leading-none">
                    {net.name}
                  </h4>
                  <p className="text-xs text-slate-800 font-semibold leading-relaxed mt-4">
                    {net.desc}
                  </p>
                </div>

                <div className="mt-8 flex flex-col gap-3 font-mono text-[10px] border-t border-slate-100 pt-4 text-slate-700 group-hover:text-slate-900 transition-colors">
                  <div className="truncate">
                    <span className="font-bold uppercase tracking-wider text-slate-500 mr-1.5">RPC:</span>
                    <span className="font-semibold">{net.rpc}</span>
                  </div>
                  <div className="truncate">
                    <span className="font-bold uppercase tracking-wider text-slate-500 mr-1.5">Passphrase:</span>
                    <span className="font-semibold">{net.passphrase}</span>
                  </div>
                </div>
              </div>
            );
          })}
        </div>
      </div>
    </div>
  );
}
