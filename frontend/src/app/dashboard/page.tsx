"use client";

import React, { useState, useEffect, useCallback } from "react";
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
import { getRpcServer, NEXT_PUBLIC_CAMPUS_SERVICE_CONTRACT_ID, NEXT_PUBLIC_CAMPUS_TOKEN_CONTRACT_ID, pollTransactionStatus } from "@/services/contracts";
import { decodeEvent, DecodedEvent, ICON_COLORS } from "@/services/eventDecoder";
import { logger } from "@/services/logger";
import {
  Wallet,
  Loader2,
  TrendingUp,
  ExternalLink,
  Shield,
  ArrowRightLeft,
  Calendar,
  Search,
  SlidersHorizontal,
  Clock,
  Lock,
  Ticket,
  Users,
  Droplets,
  Building,
  UserCheck,
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

  // Search state
  const [txSearchQuery, setTxSearchQuery] = useState("");

  // Mutation Hooks
  const transferMut = useTransferMutation();
  const approveMut = useApproveMutation();
  const createEscrowMut = useCreateEscrowMutation();
  const createEventMut = useCreateEventMutation();
  const buyTicketMut = useBuyTicketMutation();

  const addTransaction = useTransactionStore((state) => state.addTransaction);
  const updateTransaction = useTransactionStore((state) => state.updateTransaction);
  const transactions = useTransactionStore((state) => state.transactions);

  // On-chain ledger events
  const [ledgerEvents, setLedgerEvents] = useState<DecodedEvent[]>([]);
  const [eventsLoading, setEventsLoading] = useState(true);

  const fetchLedgerEvents = useCallback(async () => {
    try {
      const server = getRpcServer();
      const latestLedger = await server.getLatestLedger();
      const startLedger = Math.max(1, latestLedger.sequence - 2000);

      const [sRes, tRes] = await Promise.all([
        server.getEvents({ startLedger, filters: [{ type: "contract", contractIds: [NEXT_PUBLIC_CAMPUS_SERVICE_CONTRACT_ID] }], limit: 50 }),
        server.getEvents({ startLedger, filters: [{ type: "contract", contractIds: [NEXT_PUBLIC_CAMPUS_TOKEN_CONTRACT_ID] }], limit: 50 }),
      ]);

      const allEvents = [...sRes.events, ...tRes.events]
        .sort((a, b) => b.ledger - a.ledger)
        .slice(0, 50);

      const decoded = allEvents.map((evt) => {
        try {
          return decodeEvent({
            id: evt.id,
            ledger: evt.ledger,
            ledgerClosedAt: evt.ledgerClosedAt,
            txHash: evt.txHash,
            topic: evt.topic as unknown[],
            value: evt.value as unknown,
          });
        } catch {
          return null;
        }
      }).filter((e): e is DecodedEvent => e !== null);

      setLedgerEvents(decoded);
    } catch (err) {
      logger.error("Failed to fetch ledger events", err);
    } finally {
      setEventsLoading(false);
    }
  }, []);

  useEffect(() => {
    fetchLedgerEvents();
    const interval = setInterval(fetchLedgerEvents, 15000);
    return () => clearInterval(interval);
  }, [fetchLedgerEvents]);

  const getRoleLabel = (r?: number) => {
    if (r === 0) return "Guest";
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
      addTransaction({
        hash: errHash,
        status: "failed",
        method: name,
        timestamp: Date.now(),
        errorMessage: errMsg,
      });
      logger.error(`Transaction failed: ${name}`, err);
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
      // Step 1: Approve a safe allowance (matches ticket price from chain)
      await approveMut.mutateAsync({
        from: address,
        spender: process.env.NEXT_PUBLIC_CAMPUS_SERVICE_CONTRACT_ID || NEXT_PUBLIC_CAMPUS_SERVICE_CONTRACT_ID,
        amount: 1000, // safe ceiling; actual deduction is handled by contract
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

  const ICON_MAP = {
    transfer: ArrowRightLeft,
    escrow: Lock,
    ticket: Ticket,
    role: UserCheck,
    university: Building,
    membership: Users,
    faucet: Droplets,
    system: Clock,
  } as const;

  const today = new Date().toLocaleDateString("en-US", { month: "long", day: "numeric", year: "numeric" });

  return (
    <div className="flex flex-col gap-6 w-full max-w-7xl mx-auto">
      
      {/* Welcome Title Banner */}
      <div className="flex items-center justify-between">
        <h1 className="text-2xl font-semibold tracking-tight text-slate-900">
          Campus Overview
        </h1>
        <div className="flex items-center gap-2 bg-white px-4 py-2 rounded-2xl text-xs font-semibold text-slate-700 shadow-sm">
          <Calendar className="w-4 h-4 text-slate-700" />
          <span>{today}</span>
        </div>
      </div>

      {/* Grid of Stats Cards */}
      <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-6">
        {/* Card 1: Balance */}
        <div className="bg-white p-6 rounded-[24px] flex flex-col justify-between min-h-[140px] shadow-sm">
          <div className="flex justify-between items-start">
            <span className="text-xs font-semibold text-slate-700">Wallet Balance</span>
            <div className="w-8 h-8 rounded-full border border-slate-100 flex items-center justify-center text-slate-700">
              <Wallet className="w-4 h-4" />
            </div>
          </div>
          <div className="mt-4 flex flex-col">
            <span className="text-3xl font-semibold tracking-tight text-slate-900 font-mono">
              {balanceLoading ? <Loader2 className="w-4 h-4 animate-spin text-slate-700" /> : balance?.toFixed(0)}
            </span>
            <span className="text-[10px] text-slate-400 font-semibold mt-2">CAMP</span>
          </div>
        </div>

        {/* Card 2: Wallet Role */}
        <div className="bg-white p-6 rounded-[24px] flex flex-col justify-between min-h-[140px] shadow-sm">
          <div className="flex justify-between items-start">
            <span className="text-xs font-semibold text-slate-700">On-Chain Role</span>
            <div className="w-8 h-8 rounded-full border border-slate-100 flex items-center justify-center text-slate-700">
              <Shield className="w-4 h-4" />
            </div>
          </div>
          <div className="mt-4 flex flex-col">
            <span className="text-3xl font-semibold tracking-tight text-slate-900 truncate max-w-[130px]">
              {getRoleLabel(role)}
            </span>
            <span className="text-[10px] text-slate-400 font-semibold mt-2">RBAC registry</span>
          </div>
        </div>

        {/* Card 3: Session Ops */}
        <div className="bg-white p-6 rounded-[24px] flex flex-col justify-between min-h-[140px] shadow-sm">
          <div className="flex justify-between items-start">
            <span className="text-xs font-semibold text-slate-700">Session Ops</span>
            <div className="w-8 h-8 rounded-full border border-slate-100 flex items-center justify-center text-slate-700">
              <ArrowRightLeft className="w-4 h-4" />
            </div>
          </div>
          <div className="mt-4 flex flex-col">
            <span className="text-3xl font-semibold tracking-tight text-slate-900 font-mono">{transactions.length}</span>
            <span className="text-[10px] text-slate-400 font-semibold mt-2">this session</span>
          </div>
        </div>

        {/* Card 4: Network */}
        <div className="bg-white p-6 rounded-[24px] flex flex-col justify-between min-h-[140px] shadow-sm">
          <div className="flex justify-between items-start">
            <span className="text-xs font-semibold text-slate-700">Network</span>
            <div className="w-8 h-8 rounded-full border border-slate-100 flex items-center justify-center text-slate-700">
              <TrendingUp className="w-4 h-4" />
            </div>
          </div>
          <div className="mt-4 flex flex-col">
            <span className="text-3xl font-semibold tracking-tight text-slate-900 uppercase truncate max-w-[130px]">{network}</span>
            <span className="text-[10px] text-slate-400 font-semibold mt-2">Soroban</span>
          </div>
        </div>
      </div>

      {/* Grid: Charts (Left) & Controls (Right) */}
      <div className="grid grid-cols-1 lg:grid-cols-3 gap-6">
        {/* Left Column: On-Chain Event Metrics */}
        <div className="lg:col-span-2 flex flex-col gap-6">
          <div className="bg-white rounded-[24px] p-6 flex flex-col gap-4 shadow-sm">
            <h3 className="text-base font-semibold text-slate-900">On-Chain Event Breakdown</h3>
            <div className="grid grid-cols-2 sm:grid-cols-4 gap-4">
              {[
                { label: "Transfers", key: "transferEvents" as const, color: "bg-blue-50 text-blue-600" },
                { label: "Escrows", key: "escrowEvents" as const, color: "bg-purple-50 text-purple-600" },
                { label: "Tickets", key: "ticketEvents" as const, color: "bg-emerald-50 text-emerald-600" },
                { label: "Roles", key: "roleEvents" as const, color: "bg-amber-50 text-amber-600" },
              ].map((m) => (
                <div key={m.label} className={`${m.color} rounded-2xl p-4 border border-current/10 flex flex-col gap-2`}>
                  <span className="text-xs font-bold uppercase tracking-wider opacity-70">{m.label}</span>
                  <span className="text-2xl font-extrabold font-mono">
                    {eventsLoading ? <Loader2 className="w-5 h-5 animate-spin" /> : ledgerEvents.filter((e) => {
                      if (m.key === "transferEvents") return e.type === "transfer";
                      if (m.key === "escrowEvents") return e.type === "escrow";
                      if (m.key === "ticketEvents") return e.type === "ticket";
                      if (m.key === "roleEvents") return e.type === "role";
                      return false;
                    }).length}
                  </span>
                </div>
              ))}
            </div>
            <div className="grid grid-cols-2 sm:grid-cols-4 gap-4">
              {[
                { label: "Universities", key: "universityEvents" as const, color: "bg-indigo-50 text-indigo-600" },
                { label: "Memberships", key: "membershipEvents" as const, color: "bg-pink-50 text-pink-600" },
                { label: "Faucets", key: "faucetEvents" as const, color: "bg-cyan-50 text-cyan-600" },
                { label: "Total", key: "totalEvents" as const, color: "bg-slate-100 text-slate-700" },
              ].map((m) => (
                <div key={m.label} className={`${m.color} rounded-2xl p-4 border border-current/10 flex flex-col gap-2`}>
                  <span className="text-xs font-bold uppercase tracking-wider opacity-70">{m.label}</span>
                  <span className="text-2xl font-extrabold font-mono">
                    {eventsLoading ? <Loader2 className="w-5 h-5 animate-spin" /> : m.key === "totalEvents" ? ledgerEvents.length : ledgerEvents.filter((e) => {
                      if (m.key === "universityEvents") return e.type === "university";
                      if (m.key === "membershipEvents") return e.type === "membership";
                      if (m.key === "faucetEvents") return e.type === "faucet";
                      return false;
                    }).length}
                  </span>
                </div>
              ))}
            </div>
          </div>
        </div>

        {/* Interactive Action Controls (Right Panel) */}
        <div className="bg-white rounded-[24px] p-6 flex flex-col gap-6 shadow-sm">
          <div className="flex items-center justify-between border-b border-slate-100 pb-4 shrink-0">
            <h3 className="text-base font-semibold text-slate-900">
              Action Center
            </h3>
            <SlidersHorizontal className="w-4 h-4 text-slate-700" />
          </div>

          {/* Action Tabs Selector */}
          <div className="flex bg-slate-50 p-1.5 rounded-xl">
            <button
              onClick={() => setActiveTab("send")}
              className={`flex-1 py-2 text-xs font-semibold rounded-lg transition-all duration-200 ${
                activeTab === "send"
                  ? "bg-white text-slate-900 border border-slate-200"
                  : "text-slate-500 hover:text-slate-700"
              }`}
            >
              Transfer
            </button>
            <button
              onClick={() => setActiveTab("escrow")}
              className={`flex-1 py-2 text-xs font-semibold rounded-lg transition-all duration-200 ${
                activeTab === "escrow"
                  ? "bg-white text-slate-900 border border-slate-200"
                  : "text-slate-500 hover:text-slate-700"
              }`}
            >
              Escrow
            </button>
            <button
              onClick={() => setActiveTab("events")}
              className={`flex-1 py-2 text-xs font-semibold rounded-lg transition-all duration-200 ${
                activeTab === "events"
                  ? "bg-white text-slate-900 border border-slate-200"
                  : "text-slate-500 hover:text-slate-700"
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
                  <label className="text-[10px] font-semibold text-slate-700 uppercase tracking-wider">
                    Recipient Wallet Address
                  </label>
                  <input
                    type="text"
                    required
                    placeholder="Enter G... Address"
                    value={transferRecipient}
                    onChange={(e) => setTransferRecipient(e.target.value)}
                    className="w-full h-12 bg-slate-50 border border-slate-200 rounded-xl px-4 text-xs font-semibold outline-none focus:border-slate-300 focus:ring-1 focus:ring-slate-200/50 transition-all uppercase font-mono"
                  />
                </div>

                <div className="flex flex-col gap-2">
                  <label className="text-[10px] font-semibold text-slate-700 uppercase tracking-wider">
                    Amount (CAMP)
                  </label>
                  <input
                    type="number"
                    step="0.01"
                    required
                    placeholder="Enter amount"
                    value={transferAmount}
                    onChange={(e) => setTransferAmount(e.target.value)}
                    className="w-full h-12 bg-slate-50 border border-slate-200 rounded-xl px-4 text-xs font-semibold outline-none focus:border-slate-300 focus:ring-1 focus:ring-slate-200/50 transition-all font-mono"
                  />
                </div>

                <button
                  type="submit"
                  disabled={transferMut.isPending}
                  className="w-full h-12 mt-auto bg-accent hover:opacity-95 text-white font-semibold text-xs rounded-xl flex items-center justify-center gap-2 active:scale-[0.98] transition-all duration-200 disabled:opacity-50 disabled:pointer-events-none"
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
                  <label className="text-[10px] font-semibold text-slate-700 uppercase tracking-wider">
                    Seller / Merchant Address
                  </label>
                  <input
                    type="text"
                    required
                    placeholder="Enter G... Address"
                    value={escrowSeller}
                    onChange={(e) => setEscrowSeller(e.target.value)}
                    className="w-full h-12 bg-slate-50 border border-slate-200 rounded-xl px-4 text-xs font-semibold outline-none focus:border-slate-300 focus:ring-1 focus:ring-slate-200/50 transition-all uppercase font-mono"
                  />
                </div>

                <div className="flex flex-col gap-2">
                  <label className="text-[10px] font-semibold text-slate-700 uppercase tracking-wider">
                    Escrow Amount (CAMP)
                  </label>
                  <input
                    type="number"
                    step="0.01"
                    required
                    placeholder="Enter amount"
                    value={escrowAmount}
                    onChange={(e) => setEscrowAmount(e.target.value)}
                    className="w-full h-12 bg-slate-50 border border-slate-200 rounded-xl px-4 text-xs font-semibold outline-none focus:border-slate-300 focus:ring-1 focus:ring-slate-200/50 transition-all font-mono"
                  />
                </div>

                <button
                  type="submit"
                  disabled={createEscrowMut.isPending || approveMut.isPending}
                  className="w-full h-12 mt-auto bg-accent hover:opacity-95 text-white font-semibold text-xs rounded-xl flex items-center justify-center gap-2 active:scale-[0.98] transition-all duration-200 disabled:opacity-50 disabled:pointer-events-none"
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
                    <span className="text-[10px] font-semibold text-accent uppercase tracking-wider">
                      Club Admin Controls
                    </span>
                    <div className="flex flex-col gap-2">
                      <label className="text-[10px] font-semibold text-slate-700 uppercase tracking-wider">
                        Ticket Price (CAMP)
                      </label>
                      <input
                        type="number"
                        placeholder="Enter price"
                        value={eventPrice}
                        onChange={(e) => setEventPrice(e.target.value)}
                        className="w-full h-12 bg-slate-50 border border-slate-200 rounded-xl px-4 text-xs font-semibold outline-none focus:border-slate-300 focus:ring-1 focus:ring-slate-200/50 transition-all font-mono"
                      />
                    </div>

                    <div className="flex flex-col gap-2">
                      <label className="text-[10px] font-semibold text-slate-700 uppercase tracking-wider">
                        Max Capacity (Tickets)
                      </label>
                      <input
                        type="number"
                        required
                        placeholder="Enter max capacity"
                        value={eventCapacity}
                        onChange={(e) => setEventCapacity(e.target.value)}
                        className="w-full h-12 bg-slate-50 border border-slate-200 rounded-xl px-4 text-xs font-semibold outline-none focus:border-slate-300 focus:ring-1 focus:ring-slate-200/50 transition-all font-mono"
                      />
                    </div>

                    <button
                      type="submit"
                      disabled={createEventMut.isPending}
                      className="w-full h-12 mt-auto bg-accent hover:opacity-95 text-white font-semibold text-xs rounded-xl flex items-center justify-center gap-2 active:scale-[0.98] transition-all duration-200 disabled:opacity-50 disabled:pointer-events-none"
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
                    <span className="text-[10px] font-semibold text-accent uppercase tracking-wider">
                      Student Event Pass
                    </span>
                    <div className="flex flex-col gap-2">
                      <label className="text-[10px] font-semibold text-slate-700 uppercase tracking-wider">
                        Event ID (Ledger Index)
                      </label>
                      <input
                        type="number"
                        required
                        placeholder="Enter Event ID"
                        value={buyTicketEventId}
                        onChange={(e) => setBuyTicketEventId(e.target.value)}
                        className="w-full h-12 bg-slate-50 border border-border rounded-xl px-4 text-xs font-semibold outline-none focus:border-slate-300 focus:ring-1 focus:ring-slate-200/50 transition-all font-mono"
                      />
                    </div>

                    <button
                      type="submit"
                      disabled={buyTicketMut.isPending || approveMut.isPending}
                      className="w-full h-12 mt-8 bg-accent hover:opacity-95 text-white font-semibold text-xs rounded-xl flex items-center justify-center gap-2 active:scale-[0.98] transition-all duration-200 disabled:opacity-50 disabled:pointer-events-none"
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

      {/* Recent Activity Feed */}
      <div className="bg-white rounded-[24px] p-6 flex flex-col gap-6 shadow-sm">
        <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4">
          <div>
            <h3 className="text-base font-semibold text-slate-900">Recent Ledger Events</h3>
            <p className="text-xs text-slate-400 mt-0.5">Last {ledgerEvents.length} on-chain events across both contracts</p>
          </div>
          <div className="flex items-center gap-3">
            <div className="relative flex items-center bg-slate-50 border border-slate-100 rounded-xl px-3 py-1.5 text-xs text-slate-700 font-semibold focus-within:border-slate-300 transition-all shadow-sm">
              <Search className="w-3.5 h-3.5 text-slate-700 mr-2 shrink-0" />
              <input
                type="text"
                placeholder="Search events..."
                value={txSearchQuery}
                onChange={(e) => setTxSearchQuery(e.target.value)}
                className="bg-transparent outline-none w-36 placeholder-slate-400 font-medium"
              />
            </div>
          </div>
        </div>

        {eventsLoading ? (
          <div className="flex flex-col items-center justify-center py-12 gap-4">
            <Loader2 className="w-8 h-8 animate-spin text-accent" />
            <span className="text-xs font-bold uppercase tracking-widest text-slate-400">Fetching Ledger Events...</span>
          </div>
        ) : ledgerEvents.length === 0 ? (
          <div className="border border-dashed border-slate-200 rounded-[24px] p-12 text-center flex flex-col items-center justify-center gap-3">
            <Clock className="w-8 h-8 text-slate-700" />
            <span className="font-semibold text-slate-700 text-xs uppercase tracking-widest">No on-chain events detected</span>
          </div>
        ) : (
          <div className="overflow-x-auto">
            <table className="w-full text-left border-collapse">
              <thead>
                <tr className="border-b border-slate-100 text-[10px] font-bold text-slate-700 uppercase tracking-wider">
                  <th className="py-4 px-3">Event</th>
                  <th className="py-4 px-3">Type</th>
                  <th className="py-4 px-3">Details</th>
                  <th className="py-4 px-3">Ledger</th>
                  <th className="py-4 px-3 text-right">Tx</th>
                </tr>
              </thead>
              <tbody className="divide-y divide-slate-100 text-xs font-semibold text-slate-800">
                {ledgerEvents
                  .filter((evt) => {
                    if (!txSearchQuery.trim()) return true;
                    const q = txSearchQuery.toLowerCase().trim();
                    return evt.message.toLowerCase().includes(q) ||
                      evt.details.toLowerCase().includes(q) ||
                      evt.title.toLowerCase().includes(q) ||
                      evt.fullTxHash.toLowerCase().includes(q);
                  })
                  .map((evt) => {
                    const IconComponent = ICON_MAP[evt.icon];
                    const colorClass = ICON_COLORS[evt.color];
                    return (
                      <tr key={evt.id} className="hover:bg-slate-50/50 transition-colors">
                        <td className="py-4 px-3">
                          <div className="flex items-center gap-2">
                            <div className={`w-7 h-7 rounded-lg border flex items-center justify-center shrink-0 ${colorClass}`}>
                              <IconComponent className="w-3.5 h-3.5" />
                            </div>
                            <span className="font-bold text-slate-900 uppercase">{evt.title}</span>
                          </div>
                        </td>
                        <td className="py-4 px-3">
                          <span className="text-slate-500">{evt.message}</span>
                        </td>
                        <td className="py-4 px-3">
                          <span className="text-slate-500 font-mono text-[11px]">{evt.details}</span>
                        </td>
                        <td className="py-4 px-3 font-mono text-slate-500">
                          #{evt.ledger}
                        </td>
                        <td className="py-4 px-3 text-right">
                          <a
                            href={`https://stellar.expert/explorer/testnet/tx/${evt.fullTxHash}`}
                            target="_blank"
                            rel="noopener noreferrer"
                            className="inline-flex items-center gap-1 text-accent hover:underline uppercase tracking-wider text-[10px] font-black"
                          >
                            Explorer
                            <ExternalLink className="w-3 h-3" />
                          </a>
                        </td>
                      </tr>
                    );
                  })}
              </tbody>
            </table>
          </div>
        )}
      </div>
    </div>
  );
}
