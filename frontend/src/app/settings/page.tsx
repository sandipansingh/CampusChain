"use client";

import React from "react";
import Header from "@/components/Header";
import { useWalletStore, NetworkType } from "@/state/useWalletStore";

export default function SettingsPage() {
  const { network, switchNetwork } = useWalletStore();

  const networksList = [
    {
      id: "testnet",
      name: "STELLAR TESTNET",
      passphrase: "Test SDF Network ; September 2015",
      rpc: "https://soroban-testnet.stellar.org",
      desc: "Primary sandbox network powered by Stellar Development Foundation validators. Ideal for prototyping and token validation.",
    },
    {
      id: "standalone",
      name: "LOCAL STANDALONE",
      passphrase: "Standalone Network ; Latitude 0.0",
      rpc: "http://localhost:8000/soroban/rpc",
      desc: "Fully isolated local docker container sandbox environment. Zero external latency, ideal for unit testing and local deployment.",
    },
    {
      id: "public",
      name: "STELLAR MAINNET",
      passphrase: "Public Global Stellar Network ; September 2015",
      rpc: "https://soroban-rpc.stellar.org",
      desc: "Production environment orchestrating actual economic value. Restricted for approved university systems.",
    },
  ];

  return (
    <div className="min-h-screen bg-background text-foreground flex flex-col font-sans">
      <Header />

      {/* Hero Header */}
      <section className="w-full border-b-2 border-border py-20 bg-background relative overflow-hidden">
        <div className="max-w-[95vw] mx-auto z-10 relative">
          <span className="text-accent text-sm font-bold tracking-widest uppercase mb-4 block">
            {"// TELEMETRY ROUTER"}
          </span>
          <h1 className="text-5xl md:text-8xl font-bold tracking-tighter uppercase leading-none">
            NETWORK CONFIG
          </h1>
          <p className="text-muted-foreground text-lg md:text-xl font-medium mt-4 max-w-xl">
            Configure RPC nodes, network passphrases, wallet modules, and transaction settlement constraints.
          </p>
        </div>
      </section>

      {/* Network Selectors */}
      <main className="max-w-[95vw] w-full mx-auto py-16 flex-1 flex flex-col gap-12">
        <h3 className="text-xl font-bold tracking-wider text-muted-foreground uppercase">
          {"// AVAILABLE NETWORKS"}
        </h3>

        <div className="grid grid-cols-1 lg:grid-cols-3 gap-6">
          {networksList.map((net) => {
            const isSelected = network === net.id;
            return (
              <div
                key={net.id}
                onClick={() => switchNetwork(net.id as NetworkType)}
                className={`border-2 p-8 flex flex-col justify-between min-h-[350px] cursor-pointer transition-all duration-300 ${
                  isSelected
                    ? "border-accent bg-accent text-accent-foreground"
                    : "border-border bg-background hover:border-muted-foreground"
                }`}
              >
                <div>
                  <div className="flex justify-between items-start">
                    <h4 className="text-2xl font-bold uppercase tracking-tight leading-none">
                      {net.name}
                    </h4>
                    {isSelected && (
                      <span className="text-xs font-bold tracking-widest uppercase border border-accent-foreground px-2 py-0.5">
                        ACTIVE
                      </span>
                    )}
                  </div>
                  <p
                    className={`text-base font-medium mt-6 ${
                      isSelected ? "text-accent-foreground/80" : "text-muted-foreground"
                    }`}
                  >
                    {net.desc}
                  </p>
                </div>

                <div className="mt-8 flex flex-col gap-2 font-mono text-xs">
                  <div>
                    <span className="opacity-60">RPC:</span> {net.rpc}
                  </div>
                  <div className="break-all">
                    <span className="opacity-60">PASSPHRASE:</span> {net.passphrase}
                  </div>
                </div>
              </div>
            );
          })}
        </div>
      </main>
    </div>
  );
}
