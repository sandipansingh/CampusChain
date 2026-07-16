"use client";

import React, { useState } from "react";
import { useWalletStore } from "@/state/useWalletStore";
import { useTransactionStore } from "@/state/useTransactionStore";
import {
  useCampusBalance,
  useCampusUserRole,
  useTransferMutation,
  useApproveMutation,
} from "@/hooks/useCampusToken";
import {
  useCreateEscrowMutation,
  useCreateEventMutation,
  useBuyTicketMutation,
} from "@/hooks/useCampusService";
import { pollTransactionStatus } from "@/services/contracts";
import { logger } from "@/services/logger";
import {
  Wallet,
  Lock,
  Calendar,
  Send,
  Loader2,
  TrendingUp,
  ExternalLink,
  Shield,
  ArrowRightLeft,
  Clock,
  Search,
  SlidersHorizontal,
  ChevronDown
} from "lucide-react";

export default function DashboardPage() {
  const { address, network } = useWalletStore();
  const { data: balance, isLoading: balanceLoading } = useCampusBalance(address);
  const { data: role } = useCampusUserRole(address);

  // Form states
  const [transferRecipient, setTransferRecipient] = useState("");
  const [transferAmount, setTransferAmount] = useState("");

  const [escrowSeller, setEscrowSeller] = useState("");
  const [escrowAmount, setEscrowAmount] = useState("");

  const [eventPrice, setEventPrice] = useState("");
  const [eventCapacity, setEventCapacity] = useState("");

  const [buyTicketEventId, setBuyTicketEventId] = useState("");

  const [activeTab, setActiveTab] = useState<"send" | "escrow" | "events">("send");
  const [hoveredBar, setHoveredBar] = useState<number | null>(null);

  // Mutation Hooks
  const transferMut = useTransferMutation();
  const approveMut = useApproveMutation();
  const createEscrowMut = useCreateEscrowMutation();
  const createEventMut = useCreateEventMutation();
  const buyTicketMut = useBuyTicketMutation();

  const addTransaction = useTransactionStore((state) => state.addTransaction);
  const updateTransaction = useTransactionStore((state) => state.updateTransaction);
  const transactions = useTransactionStore((state) => state.transactions);

  const getRoleLabel = (r?: number) => {
    if (r === 1) return "Student";
    if (r === 2) return "Merchant";
    if (r === 3) return "Club Organizer";
    if (r === 4) return "University Admin";
    return "Member";
  };

  // Transaction execution wrapper
  const handleTx = async (
    name: string,
    mutationCall: () => Promise<string>,
    onComplete?: () => void
  ) => {
    const startTime = Date.now();
    try {
      const hash = await mutationCall();
      addTransaction({
        hash,
        status: "pending",
        method: name,
        timestamp: Date.now(),
        explorerUrl: `https://stellar.expert/explorer/testnet/tx/${hash}`,
      });
      logger.trackTransaction({ hash, method: name, status: "pending" });

      updateTransaction(hash, { status: "processing" });
      logger.trackTransaction({ hash, method: name, status: "processing" });

      // Poll transaction completion
      await pollTransactionStatus(hash);
      updateTransaction(hash, { status: "confirmed" });
      logger.trackTransaction({
        hash,
        method: name,
        status: "confirmed",
        durationMs: Date.now() - startTime,
      });

      if (onComplete) onComplete();
    } catch (err) {
      const errMsg = err instanceof Error ? err.message : "Transaction failed";
      const errHash = `err_${Date.now()}`;
      // Fail transaction logging
      addTransaction({
        hash: errHash,
        status: "failed",
        method: name,
        timestamp: Date.now(),
        errorMessage: errMsg,
      });
      logger.error(`Transaction failed: ${name}`, err);
      logger.trackTransaction({
        hash: errHash,
        method: name,
        status: "failed",
        errorMessage: errMsg,
        durationMs: Date.now() - startTime,
      });
    }
  };

  const executeTransfer = (e: React.FormEvent) => {
    e.preventDefault();
    if (!address || !transferRecipient || !transferAmount) return;
    handleTx(
      "TRANSFER",
      () =>
        transferMut.mutateAsync({
          from: address,
          to: transferRecipient,
          amount: parseFloat(transferAmount),
        }),
      () => {
        setTransferRecipient("");
        setTransferAmount("");
      }
    );
  };

  const executeEscrow = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!address || !escrowSeller || !escrowAmount) return;
    const amount = parseFloat(escrowAmount);

    handleTx("CREATE ESCROW", async () => {
      // Step 1: Approve Escrow Contract
      await approveMut.mutateAsync({
        from: address,
        spender: process.env.NEXT_PUBLIC_CAMPUS_SERVICE_CONTRACT_ID || "CA5W44S3S7WTRHPHHY5W7RPHHY5W7RPHHY5W7RPHHY5W7RPHHY5W7RPH",
        amount,
      });

      // Step 2: Create Escrow
      const hash = await createEscrowMut.mutateAsync({
        buyer: address,
        seller: escrowSeller,
        amount,
      });
      return hash;
    }, () => {
      setEscrowSeller("");
      setEscrowAmount("");
    });
  };

  const executeCreateEvent = (e: React.FormEvent) => {
    e.preventDefault();
    if (!address || !eventCapacity) return;
    const price = eventPrice ? parseFloat(eventPrice) : 0;
    handleTx(
      "CREATE EVENT",
      () =>
        createEventMut.mutateAsync({
          host: address,
          price,
          capacity: parseInt(eventCapacity),
        }),
      () => {
        setEventPrice("");
        setEventCapacity("");
      }
    );
  };

  const executeBuyTicket = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!address || !buyTicketEventId) return;

    handleTx("BUY EVENT TICKET", async () => {
      // Step 1: Approve token transfer
      await approveMut.mutateAsync({
        from: address,
        spender: process.env.NEXT_PUBLIC_CAMPUS_SERVICE_CONTRACT_ID || "CA5W44S3S7WTRHPHHY5W7RPHHY5W7RPHHY5W7RPHHY5W7RPHHY5W7RPH",
        amount: 500,
      });

      // Step 2: Purchase Ticket
      const hash = await buyTicketMut.mutateAsync({
        eventId: parseInt(buyTicketEventId),
        buyer: address,
      });
      return hash;
    }, () => {
      setBuyTicketEventId("");
    });
  };

  // Static chart data mapping days of week
  const weeklyData = [
    { day: "Fri", amount: 15400 },
    { day: "Sat", amount: 12000 },
    { day: "Sun", amount: 22430 },
    { day: "Mon", amount: 14200 },
    { day: "Thu", amount: 15100 },
    { day: "Wed", amount: 20500 },
    { day: "Thur", amount: 14800 },
  ];

  return (
    <div className="flex flex-col gap-8 w-full max-w-7xl mx-auto">
      {/* Welcome Title Banner */}
      <div className="flex flex-col md:flex-row md:items-center justify-between gap-4">
        <div>
          <h1 className="text-3xl font-extrabold tracking-tight text-slate-900 uppercase">
            Campus Overview
          </h1>
          <p className="text-slate-500 text-sm mt-1">
            Analyze campus metrics, transfer rewards, and log secure smart contract escrows.
          </p>
        </div>
        <div className="flex items-center gap-3 bg-white border border-border px-4 py-2.5 rounded-xl shadow-sm text-xs font-bold text-slate-700">
          <Clock className="w-4 h-4 text-accent" />
          <span>July 16, 2026</span>
          <ChevronDown className="w-3.5 h-3.5 text-slate-400" />
        </div>
      </div>

      {/* Grid of Stats Cards (Finexy Style) */}
      <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-6">
        {/* Card 1: Balance */}
        <div className="bg-white border border-border p-6 rounded-2xl shadow-sm flex flex-col justify-between min-h-[160px] group hover:border-accent/40 hover:shadow-md transition-all duration-300">
          <div className="flex justify-between items-start">
            <span className="text-xs font-bold tracking-wider text-slate-400 uppercase">
              Total Balance
            </span>
            <div className="w-10 h-10 rounded-xl bg-orange-50 flex items-center justify-center text-accent group-hover:scale-110 transition-transform">
              <Wallet className="w-5 h-5" />
            </div>
          </div>
          <div className="mt-4 flex flex-col">
            <span className="text-3xl font-bold tracking-tight text-slate-900 font-mono">
              {balanceLoading ? (
                <Loader2 className="w-6 h-6 animate-spin text-slate-400" />
              ) : (
                `${balance?.toFixed(2)} CAMP`
              )}
            </span>
            <div className="flex items-center gap-2 mt-2">
              <span className="text-[10px] font-bold text-emerald-600 bg-emerald-50 px-2 py-0.5 rounded-full border border-emerald-100">
                ↑ 12.4%
              </span>
              <span className="text-[10px] text-slate-400 font-medium">From merit rewards</span>
            </div>
          </div>
        </div>

        {/* Card 2: Wallet Role */}
        <div className="bg-white border border-border p-6 rounded-2xl shadow-sm flex flex-col justify-between min-h-[160px] group hover:border-accent/40 hover:shadow-md transition-all duration-300">
          <div className="flex justify-between items-start">
            <span className="text-xs font-bold tracking-wider text-slate-400 uppercase">
              Profile Type
            </span>
            <div className="w-10 h-10 rounded-xl bg-orange-50 flex items-center justify-center text-accent group-hover:scale-110 transition-transform">
              <Shield className="w-5 h-5" />
            </div>
          </div>
          <div className="mt-4 flex flex-col">
            <span className="text-3xl font-bold tracking-tight text-slate-900 truncate">
              {getRoleLabel(role)}
            </span>
            <div className="flex items-center gap-2 mt-2">
              <span className="text-[10px] font-bold text-blue-600 bg-blue-50 px-2 py-0.5 rounded-full border border-blue-100">
                On-Chain
              </span>
              <span className="text-[10px] text-slate-400 font-medium">Authorized on Stellar</span>
            </div>
          </div>
        </div>

        {/* Card 3: Session Actions */}
        <div className="bg-white border border-border p-6 rounded-2xl shadow-sm flex flex-col justify-between min-h-[160px] group hover:border-accent/40 hover:shadow-md transition-all duration-300">
          <div className="flex justify-between items-start">
            <span className="text-xs font-bold tracking-wider text-slate-400 uppercase">
              Session Transactions
            </span>
            <div className="w-10 h-10 rounded-xl bg-orange-50 flex items-center justify-center text-accent group-hover:scale-110 transition-transform">
              <ArrowRightLeft className="w-5 h-5" />
            </div>
          </div>
          <div className="mt-4 flex flex-col">
            <span className="text-3xl font-bold tracking-tight text-slate-900 font-mono">
              {transactions.length}
            </span>
            <div className="flex items-center gap-2 mt-2">
              <span className="text-[10px] font-bold text-purple-600 bg-purple-50 px-2 py-0.5 rounded-full border border-purple-100">
                Tracked
              </span>
              <span className="text-[10px] text-slate-400 font-medium">Pending state transitions</span>
            </div>
          </div>
        </div>

        {/* Card 4: Ledger Network */}
        <div className="bg-white border border-border p-6 rounded-2xl shadow-sm flex flex-col justify-between min-h-[160px] group hover:border-accent/40 hover:shadow-md transition-all duration-300">
          <div className="flex justify-between items-start">
            <span className="text-xs font-bold tracking-wider text-slate-400 uppercase">
              Ledger Network
            </span>
            <div className="w-10 h-10 rounded-xl bg-orange-50 flex items-center justify-center text-accent group-hover:scale-110 transition-transform">
              <TrendingUp className="w-5 h-5" />
            </div>
          </div>
          <div className="mt-4 flex flex-col">
            <span className="text-3xl font-bold tracking-tight text-slate-900 uppercase">
              {network}
            </span>
            <div className="flex items-center gap-2 mt-2">
              <span className="text-[10px] font-bold text-amber-600 bg-amber-50 px-2 py-0.5 rounded-full border border-amber-100">
                5s Finality
              </span>
              <span className="text-[10px] text-slate-400 font-medium">RPC active</span>
            </div>
          </div>
        </div>
      </div>

      {/* Grid: Charts (Left) & Controls (Right) */}
      <div className="grid grid-cols-1 lg:grid-cols-3 gap-8">
        {/* Chart Column (Finexy inspired charts) */}
        <div className="lg:col-span-2 flex flex-col gap-6">
          {/* Revenue Analytics (Weekly Volume Chart) */}
          <div className="bg-white border border-border rounded-2xl shadow-sm p-6 flex flex-col justify-between">
            <div className="flex items-center justify-between">
              <div>
                <h3 className="text-base font-bold text-slate-900 uppercase">
                  Transaction Telemetry
                </h3>
                <p className="text-xs text-slate-400 font-medium">Weekly activity index in CAMP tokens</p>
              </div>
              <div className="text-xs font-bold bg-slate-50 border border-border px-3 py-1.5 rounded-lg text-slate-600">
                This Week
              </div>
            </div>

            {/* Custom SVG Bar Chart */}
            <div className="mt-8 relative h-64 flex items-end justify-between px-2 pt-6">
              {/* Grid Lines */}
              <div className="absolute inset-x-0 bottom-0 top-6 flex flex-col justify-between pointer-events-none">
                <div className="border-t border-slate-100 w-full h-0" />
                <div className="border-t border-slate-100 w-full h-0" />
                <div className="border-t border-slate-100 w-full h-0" />
                <div className="border-t border-slate-100 w-full h-0" />
                <div className="border-b border-slate-200 w-full h-0" />
              </div>

              {/* Y Axis Labels */}
              <div className="absolute left-0 top-4 text-[10px] font-bold text-slate-400 flex flex-col justify-between h-60 pointer-events-none">
                <span>30k</span>
                <span>20k</span>
                <span>10k</span>
                <span>0k</span>
              </div>

              {/* Weekly Bars */}
              <div className="flex-1 flex justify-around items-end z-10 pl-6 h-full">
                {weeklyData.map((data, index) => {
                  const maxVal = 30000;
                  const pct = (data.amount / maxVal) * 100;
                  const isHovered = hoveredBar === index;
                  return (
                    <div
                      key={data.day}
                      className="flex flex-col items-center gap-3 w-12 group relative"
                      onMouseEnter={() => setHoveredBar(index)}
                      onMouseLeave={() => setHoveredBar(null)}
                    >
                      {/* Tooltip on Hover */}
                      {isHovered && (
                        <div className="absolute -top-10 bg-slate-900 text-white text-[10px] font-bold px-2 py-1 rounded shadow-md z-20 whitespace-nowrap animate-in fade-in zoom-in-95 duration-100">
                          {data.amount.toLocaleString()} CAMP
                        </div>
                      )}

                      {/* Bar Pillar */}
                      <div
                        className="w-8 rounded-full cursor-pointer transition-all duration-300 relative overflow-hidden"
                        style={{
                          height: `${pct}%`,
                          backgroundColor: isHovered ? "#e14e27" : "#f15a30",
                          opacity: isHovered ? 1 : 0.85,
                        }}
                      />
                      <span className="text-[10px] font-bold text-slate-400 group-hover:text-slate-900 transition-colors uppercase">
                        {data.day}
                      </span>
                    </div>
                  );
                })}
              </div>
            </div>
          </div>

          {/* Profit & Loss Stacked Chart with Diagonal Stripes */}
          <div className="bg-white border border-border rounded-2xl shadow-sm p-6">
            <div className="flex items-center justify-between mb-6">
              <div>
                <h3 className="text-base font-bold text-slate-900 uppercase">
                  Flow Analytics
                </h3>
                <p className="text-xs text-slate-400 font-medium">Minting rewards vs Transaction expenses</p>
              </div>
              <div className="flex items-center gap-4 text-xs font-bold">
                <div className="flex items-center gap-1.5">
                  <span className="w-2.5 h-2.5 rounded-full bg-accent" />
                  <span className="text-slate-600">Rewards</span>
                </div>
                <div className="flex items-center gap-1.5">
                  <span className="w-2.5 h-2.5 rounded bg-slate-900" />
                  <span className="text-slate-600">Transfers</span>
                </div>
              </div>
            </div>

            {/* Custom SVG Stacked Bars */}
            <div className="h-44 w-full flex items-end pl-6 justify-between pr-4 relative pt-4">
              <svg className="absolute inset-0 w-full h-full pointer-events-none" xmlns="http://www.w3.org/2000/svg">
                <defs>
                  {/* Diagonal Stripes Pattern Definition */}
                  <pattern id="stripes" width="10" height="10" patternUnits="userSpaceOnUse">
                    <path d="M-1,1 l2,-2 M0,10 l10,-10 M9,11 l2,-2" stroke="#e14e27" strokeWidth="2.5" />
                  </pattern>
                </defs>
              </svg>

              {/* Grid Lines */}
              <div className="absolute inset-x-0 bottom-0 top-0 flex flex-col justify-between pointer-events-none">
                <div className="border-t border-slate-100 w-full" />
                <div className="border-t border-slate-100 w-full" />
                <div className="border-b border-slate-200 w-full" />
              </div>

              {/* Y Axis Labels */}
              <div className="absolute left-0 top-0 text-[10px] font-bold text-slate-400 flex flex-col justify-between h-40 pointer-events-none">
                <span>50k</span>
                <span>25k</span>
                <span>0k</span>
              </div>

              {/* Stacked Bars list */}
              <div className="flex-1 flex justify-around items-end z-10 pl-6 h-full pb-1">
                {[
                  { m: "Jan", r: 15, t: 20 },
                  { m: "Feb", r: 18, t: 15 },
                  { m: "Mar", r: 25, t: 12 },
                  { m: "Apr", r: 20, t: 18 },
                  { m: "May", r: 22, t: 14 },
                  { m: "Jun", r: 28, t: 22 },
                  { m: "Jul", r: 20, t: 19 },
                  { m: "Aug", r: 16, t: 15 },
                ].map((item) => (
                  <div key={item.m} className="flex flex-col items-center gap-2">
                    <div className="flex flex-col w-6 h-32 justify-end">
                      {/* Top Stacked Bar (Striped - Rewards) */}
                      <div
                        className="w-full rounded-t-md relative overflow-hidden"
                        style={{ height: `${item.r * 2.5}px`, background: "url(#stripes)" }}
                      />
                      {/* Bottom Stacked Bar (Dark - Transfers) */}
                      <div
                        className="w-full bg-slate-900 rounded-b-md"
                        style={{ height: `${item.t * 2.5}px` }}
                      />
                    </div>
                    <span className="text-[10px] font-bold text-slate-400 uppercase mt-1">
                      {item.m}
                    </span>
                  </div>
                ))}
              </div>
            </div>
          </div>
        </div>

        {/* Interactive Action Controls (Right Panel) */}
        <div className="bg-white border border-border rounded-2xl shadow-sm p-6 flex flex-col gap-6">
          <div className="flex items-center justify-between border-b border-slate-100 pb-4 shrink-0">
            <h3 className="text-base font-extrabold text-slate-900 uppercase">
              Action Center
            </h3>
            <SlidersHorizontal className="w-4 h-4 text-slate-400" />
          </div>

          {/* Action Tabs Selector */}
          <div className="flex bg-slate-50 p-1.5 rounded-xl border border-slate-200">
            <button
              onClick={() => setActiveTab("send")}
              className={`flex-1 py-2 text-xs font-bold rounded-lg uppercase tracking-wider transition-all duration-200 ${
                activeTab === "send"
                  ? "bg-white text-slate-900 shadow-sm border border-slate-200"
                  : "text-slate-400 hover:text-slate-700"
              }`}
            >
              Transfer
            </button>
            <button
              onClick={() => setActiveTab("escrow")}
              className={`flex-1 py-2 text-xs font-bold rounded-lg uppercase tracking-wider transition-all duration-200 ${
                activeTab === "escrow"
                  ? "bg-white text-slate-900 shadow-sm border border-slate-200"
                  : "text-slate-400 hover:text-slate-700"
              }`}
            >
              Escrow
            </button>
            <button
              onClick={() => setActiveTab("events")}
              className={`flex-1 py-2 text-xs font-bold rounded-lg uppercase tracking-wider transition-all duration-200 ${
                activeTab === "events"
                  ? "bg-white text-slate-900 shadow-sm border border-slate-200"
                  : "text-slate-400 hover:text-slate-700"
              }`}
            >
              Events
            </button>
          </div>

          {/* Form Content container */}
          <div className="flex-1 min-h-[280px] flex flex-col justify-start">
            {/* Send Tab Form */}
            {activeTab === "send" && (
              <form onSubmit={executeTransfer} className="flex flex-col gap-5 h-full">
                <div className="flex flex-col gap-2">
                  <label className="text-[10px] font-bold tracking-widest text-slate-400 uppercase">
                    Recipient Wallet Address
                  </label>
                  <div className="relative">
                    <Send className="absolute left-3.5 top-1/2 -translate-y-1/2 w-4.5 h-4.5 text-slate-400 pointer-events-none" />
                    <input
                      type="text"
                      required
                      placeholder="G..."
                      value={transferRecipient}
                      onChange={(e) => setTransferRecipient(e.target.value)}
                      className="w-full h-12 bg-slate-50 border border-border rounded-xl pl-11 pr-4 text-sm font-semibold outline-none focus:border-accent/40 focus:ring-1 focus:ring-accent/15 transition-all uppercase font-mono"
                    />
                  </div>
                </div>

                <div className="flex flex-col gap-2">
                  <label className="text-[10px] font-bold tracking-widest text-slate-400 uppercase">
                    Amount (CAMP)
                  </label>
                  <div className="relative">
                    <span className="absolute left-3.5 top-1/2 -translate-y-1/2 text-sm font-bold text-slate-400">
                      $
                    </span>
                    <input
                      type="number"
                      step="0.01"
                      required
                      placeholder="0.00"
                      value={transferAmount}
                      onChange={(e) => setTransferAmount(e.target.value)}
                      className="w-full h-12 bg-slate-50 border border-border rounded-xl pl-8 pr-4 text-sm font-semibold outline-none focus:border-accent/40 focus:ring-1 focus:ring-accent/15 transition-all font-mono"
                    />
                  </div>
                </div>

                <button
                  type="submit"
                  disabled={transferMut.isPending}
                  className="w-full h-12 mt-auto bg-accent hover:opacity-95 text-white font-bold uppercase text-xs tracking-wider rounded-xl flex items-center justify-center gap-2 active:scale-[0.98] transition-all duration-200 disabled:opacity-50 disabled:pointer-events-none shadow-md shadow-accent/15"
                >
                  {transferMut.isPending ? (
                    <>
                      <Loader2 className="w-4 h-4 animate-spin" />
                      Executing...
                    </>
                  ) : (
                    "Execute Transfer"
                  )}
                </button>
              </form>
            )}

            {/* Escrow Tab Form */}
            {activeTab === "escrow" && (
              <form onSubmit={executeEscrow} className="flex flex-col gap-5 h-full">
                <div className="flex flex-col gap-2">
                  <label className="text-[10px] font-bold tracking-widest text-slate-400 uppercase">
                    Seller / Merchant Address
                  </label>
                  <div className="relative">
                    <Send className="absolute left-3.5 top-1/2 -translate-y-1/2 w-4.5 h-4.5 text-slate-400 pointer-events-none" />
                    <input
                      type="text"
                      required
                      placeholder="G..."
                      value={escrowSeller}
                      onChange={(e) => setEscrowSeller(e.target.value)}
                      className="w-full h-12 bg-slate-50 border border-border rounded-xl pl-11 pr-4 text-sm font-semibold outline-none focus:border-accent/40 focus:ring-1 focus:ring-accent/15 transition-all uppercase font-mono"
                    />
                  </div>
                </div>

                <div className="flex flex-col gap-2">
                  <label className="text-[10px] font-bold tracking-widest text-slate-400 uppercase">
                    Escrow Amount (CAMP)
                  </label>
                  <div className="relative">
                    <span className="absolute left-3.5 top-1/2 -translate-y-1/2 text-sm font-bold text-slate-400">
                      $
                    </span>
                    <input
                      type="number"
                      step="0.01"
                      required
                      placeholder="0.00"
                      value={escrowAmount}
                      onChange={(e) => setEscrowAmount(e.target.value)}
                      className="w-full h-12 bg-slate-50 border border-border rounded-xl pl-8 pr-4 text-sm font-semibold outline-none focus:border-accent/40 focus:ring-1 focus:ring-accent/15 transition-all font-mono"
                    />
                  </div>
                </div>

                <button
                  type="submit"
                  disabled={createEscrowMut.isPending || approveMut.isPending}
                  className="w-full h-12 mt-auto bg-accent hover:opacity-95 text-white font-bold uppercase text-xs tracking-wider rounded-xl flex items-center justify-center gap-2 active:scale-[0.98] transition-all duration-200 disabled:opacity-50 disabled:pointer-events-none shadow-md shadow-accent/15"
                >
                  {createEscrowMut.isPending || approveMut.isPending ? (
                    <>
                      <Loader2 className="w-4 h-4 animate-spin" />
                      Locking Funds...
                    </>
                  ) : (
                    "Lock Funds in Escrow"
                  )}
                </button>
              </form>
            )}

            {/* Events Tab Form */}
            {activeTab === "events" && (
              <div className="flex flex-col h-full">
                {role === 3 || role === 4 ? (
                  /* Create Event Form */
                  <form onSubmit={executeCreateEvent} className="flex flex-col gap-5 h-full">
                    <span className="text-[10px] font-bold text-accent uppercase tracking-wider">
                      Club Admin Controls
                    </span>
                    <div className="flex flex-col gap-2">
                      <label className="text-[10px] font-bold tracking-widest text-slate-400 uppercase">
                        Ticket Price (CAMP)
                      </label>
                      <div className="relative">
                        <span className="absolute left-3.5 top-1/2 -translate-y-1/2 text-sm font-bold text-slate-400">
                          $
                        </span>
                        <input
                          type="number"
                          placeholder="0"
                          value={eventPrice}
                          onChange={(e) => setEventPrice(e.target.value)}
                          className="w-full h-12 bg-slate-50 border border-border rounded-xl pl-8 pr-4 text-sm font-semibold outline-none focus:border-accent/40 focus:ring-1 focus:ring-accent/15 transition-all font-mono"
                        />
                      </div>
                    </div>

                    <div className="flex flex-col gap-2">
                      <label className="text-[10px] font-bold tracking-widest text-slate-400 uppercase">
                        Max Capacity (Tickets)
                      </label>
                      <div className="relative">
                        <Calendar className="absolute left-3.5 top-1/2 -translate-y-1/2 w-4.5 h-4.5 text-slate-400 pointer-events-none" />
                        <input
                          type="number"
                          required
                          placeholder="50"
                          value={eventCapacity}
                          onChange={(e) => setEventCapacity(e.target.value)}
                          className="w-full h-12 bg-slate-50 border border-border rounded-xl pl-11 pr-4 text-sm font-semibold outline-none focus:border-accent/40 focus:ring-1 focus:ring-accent/15 transition-all font-mono"
                        />
                      </div>
                    </div>

                    <button
                      type="submit"
                      disabled={createEventMut.isPending}
                      className="w-full h-12 mt-auto bg-accent hover:opacity-95 text-white font-bold uppercase text-xs tracking-wider rounded-xl flex items-center justify-center gap-2 active:scale-[0.98] transition-all duration-200 disabled:opacity-50 disabled:pointer-events-none shadow-md shadow-accent/15"
                    >
                      {createEventMut.isPending ? (
                        <>
                          <Loader2 className="w-4 h-4 animate-spin" />
                          Minting Passes...
                        </>
                      ) : (
                        "Mint Event Tickets"
                      )}
                    </button>
                  </form>
                ) : (
                  /* Buy Ticket Form */
                  <form onSubmit={executeBuyTicket} className="flex flex-col gap-5 h-full justify-between">
                    <span className="text-[10px] font-bold text-accent uppercase tracking-wider">
                      Student Event Pass
                    </span>
                    <div className="flex flex-col gap-2">
                      <label className="text-[10px] font-bold tracking-widest text-slate-400 uppercase">
                        Event ID (Ledger Index)
                      </label>
                      <div className="relative">
                        <Lock className="absolute left-3.5 top-1/2 -translate-y-1/2 w-4.5 h-4.5 text-slate-400 pointer-events-none" />
                        <input
                          type="number"
                          required
                          placeholder="1"
                          value={buyTicketEventId}
                          onChange={(e) => setBuyTicketEventId(e.target.value)}
                          className="w-full h-12 bg-slate-50 border border-border rounded-xl pl-11 pr-4 text-sm font-semibold outline-none focus:border-accent/40 focus:ring-1 focus:ring-accent/15 transition-all font-mono"
                        />
                      </div>
                    </div>

                    <button
                      type="submit"
                      disabled={buyTicketMut.isPending || approveMut.isPending}
                      className="w-full h-12 mt-8 bg-accent hover:opacity-95 text-white font-bold uppercase text-xs tracking-wider rounded-xl flex items-center justify-center gap-2 active:scale-[0.98] transition-all duration-200 disabled:opacity-50 disabled:pointer-events-none shadow-md shadow-accent/15"
                    >
                      {buyTicketMut.isPending || approveMut.isPending ? (
                        <>
                          <Loader2 className="w-4 h-4 animate-spin" />
                          Acquiring Pass...
                        </>
                      ) : (
                        "Acquire Ticket Pass"
                      )}
                    </button>
                  </form>
                )}
              </div>
            )}
          </div>
        </div>
      </div>

      {/* Recent Activity Table (Finexy Style) */}
      <div className="bg-white border border-border rounded-2xl shadow-sm p-6 flex flex-col gap-6">
        <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4">
          <div>
            <h3 className="text-base font-extrabold text-slate-900 uppercase">
              Recent Transactions
            </h3>
            <p className="text-xs text-slate-400 font-medium">Session-specific ledger interactions</p>
          </div>
          <div className="flex items-center gap-3">
            {/* Table controls */}
            <div className="relative flex items-center bg-slate-50 border border-border rounded-xl px-3 py-1.5 text-xs text-slate-500 font-semibold focus-within:border-accent/40 transition-all">
              <Search className="w-3.5 h-3.5 text-slate-400 mr-2 shrink-0" />
              <input
                type="text"
                placeholder="Search..."
                className="bg-transparent outline-none w-28 placeholder-slate-400"
              />
            </div>
            <div className="flex items-center gap-1.5 bg-slate-50 border border-border px-3 py-1.5 rounded-xl text-xs font-bold text-slate-600">
              <SlidersHorizontal className="w-3.5 h-3.5 text-slate-400" />
              <span>Sort by</span>
            </div>
          </div>
        </div>

        {transactions.length === 0 ? (
          <div className="border border-dashed border-slate-200 rounded-2xl p-12 text-center flex flex-col items-center justify-center gap-3">
            <Clock className="w-8 h-8 text-slate-300" />
            <span className="font-bold text-slate-400 text-xs uppercase tracking-widest">
              No transactions deployed in this session yet
            </span>
          </div>
        ) : (
          <div className="overflow-x-auto">
            <table className="w-full text-left border-collapse">
              <thead>
                <tr className="border-b border-slate-100 text-[10px] font-black text-slate-400 uppercase tracking-widest">
                  <th className="py-4 px-3 w-12">
                    <input type="checkbox" className="rounded border-slate-300 text-accent focus:ring-accent" />
                  </th>
                  <th className="py-4 px-3">Transaction ID / Hash</th>
                  <th className="py-4 px-3">Method</th>
                  <th className="py-4 px-3">Status</th>
                  <th className="py-4 px-3">Timestamp</th>
                  <th className="py-4 px-3 text-right">Details</th>
                </tr>
              </thead>
              <tbody className="divide-y divide-slate-100 text-xs font-bold text-slate-600">
                {transactions.map((tx) => (
                  <tr key={tx.hash} className="hover:bg-slate-50/50 transition-colors">
                    <td className="py-4 px-3">
                      <input type="checkbox" className="rounded border-slate-300 text-accent focus:ring-accent" />
                    </td>
                    <td className="py-4 px-3 font-mono text-slate-400">
                      {tx.hash.slice(0, 16)}...{tx.hash.slice(-16)}
                    </td>
                    <td className="py-4 px-3 text-slate-800 uppercase tracking-tight">
                      {tx.method}
                    </td>
                    <td className="py-4 px-3">
                      <span
                        className={`inline-flex items-center gap-1.5 px-2.5 py-0.5 rounded-full text-[10px] font-bold uppercase border ${
                          tx.status === "pending"
                            ? "bg-yellow-50 text-yellow-700 border-yellow-200"
                            : tx.status === "processing"
                            ? "bg-blue-50 text-blue-700 border-blue-200"
                            : tx.status === "confirmed"
                            ? "bg-emerald-50 text-emerald-700 border-emerald-200"
                            : "bg-red-50 text-red-700 border-red-200"
                        }`}
                      >
                        <span
                          className={`w-1.5 h-1.5 rounded-full ${
                            tx.status === "pending"
                              ? "bg-yellow-500 animate-pulse"
                              : tx.status === "processing"
                              ? "bg-blue-500"
                              : tx.status === "confirmed"
                              ? "bg-emerald-500"
                              : "bg-red-500"
                          }`}
                        />
                        {tx.status}
                      </span>
                    </td>
                    <td className="py-4 px-3 text-slate-400">
                      {new Date(tx.timestamp).toLocaleTimeString()}
                    </td>
                    <td className="py-4 px-3 text-right">
                      {tx.explorerUrl && tx.status === "confirmed" ? (
                        <a
                          href={tx.explorerUrl}
                          target="_blank"
                          rel="noopener noreferrer"
                          className="inline-flex items-center gap-1 text-accent hover:underline uppercase tracking-wider text-[10px] font-black"
                        >
                          Explorer
                          <ExternalLink className="w-3 h-3" />
                        </a>
                      ) : tx.errorMessage ? (
                        <span className="text-red-500 font-mono text-[10px] break-all block max-w-[200px] text-right ml-auto">
                          {tx.errorMessage}
                        </span>
                      ) : (
                        <span className="text-slate-300">-</span>
                      )}
                    </td>
                  </tr>
                ))}
              </tbody>
            </table>
          </div>
        )}
      </div>
    </div>
  );
}
