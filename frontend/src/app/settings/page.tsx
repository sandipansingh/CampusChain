"use client";

import React from "react";
import { useWalletStore, NetworkType } from "@/state/useWalletStore";
import {
  Globe,
  Monitor,
  Server
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
    },
    {
      id: "standalone",
      name: "Local Standalone",
      passphrase: "Standalone Network ; Latitude 0.0",
      rpc: "http://localhost:8000/soroban/rpc",
      desc: "Fully isolated local docker container sandbox environment. Zero external latency, ideal for unit testing and local deployment.",
      icon: Monitor,
    },
    {
      id: "public",
      name: "Stellar Mainnet",
      passphrase: "Public Global Stellar Network ; September 2015",
      rpc: "https://soroban-rpc.stellar.org",
      desc: "Production environment orchestrating actual economic value. Restricted for approved university systems.",
      icon: Server,
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
            return (
              <div
                key={net.id}
                onClick={() => switchNetwork(net.id as NetworkType)}
                className={`border bg-white p-6 rounded-[24px] flex flex-col justify-between min-h-[350px] cursor-pointer group transition-all duration-300 ${
                  isSelected
                    ? "border-slate-900 ring-1 ring-slate-900/10 bg-slate-50/5"
                    : "border-border"
                }`}
              >
                <div>
                  <div className="flex justify-between items-start">
                    <div className={`w-10 h-10 rounded-xl flex items-center justify-center transition-colors ${
                      isSelected ? "bg-slate-900 text-white" : "bg-slate-50 text-slate-750 group-hover:text-slate-900"
                    }`}>
                      <Icon className="w-5 h-5" />
                    </div>
                    {isSelected && (
                      <span className="text-[10px] font-bold tracking-widest uppercase bg-slate-900 text-white px-2.5 py-0.5 rounded-full">
                        Active
                      </span>
                    )}
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
