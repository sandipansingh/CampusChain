"use client";

import React, { useState } from "react";
import Header from "@/components/Header";
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

export default function DashboardPage() {
  const { address } = useWalletStore();
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

  // Mutation Hooks
  const transferMut = useTransferMutation();
  const approveMut = useApproveMutation();
  const createEscrowMut = useCreateEscrowMutation();
  const createEventMut = useCreateEventMutation();
  const buyTicketMut = useBuyTicketMutation();

  const addTransaction = useTransactionStore((state) => state.addTransaction);
  const updateTransaction = useTransactionStore((state) => state.updateTransaction);

  const getRoleLabel = (r?: number) => {
    if (r === 1) return "STUDENT";
    if (r === 2) return "MERCHANT";
    if (r === 3) return "CLUB ORGANIZER";
    if (r === 4) return "UNIVERSITY ADMIN";
    return "MEMBER";
  };

  // Transaction execution wrapper
  const handleTx = async (
    name: string,
    mutationCall: () => Promise<string>,
    onComplete?: () => void
  ) => {
    try {
      const hash = await mutationCall();
      addTransaction({
        hash,
        status: "pending",
        method: name,
        timestamp: Date.now(),
        explorerUrl: `https://stellar.expert/explorer/testnet/tx/${hash}`,
      });

      updateTransaction(hash, { status: "processing" });

      // Poll transaction completion
      await pollTransactionStatus(hash);
      updateTransaction(hash, { status: "confirmed" });

      if (onComplete) onComplete();
    } catch (err) {
      const errMsg = err instanceof Error ? err.message : "Transaction failed";
      // Fail transaction logging
      addTransaction({
        hash: `err_${Date.now()}`,
        status: "failed",
        method: name,
        timestamp: Date.now(),
        errorMessage: errMsg,
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
      // Step 1: Approve token transfer (dummy price approval of 500 for security)
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

  return (
    <div className="min-h-screen bg-background text-foreground flex flex-col font-sans">
      <Header />

      <main className="max-w-[95vw] w-full mx-auto py-16 flex flex-col lg:flex-row gap-12">
        {/* Left Side: Balance & Wallet Profile */}
        <div className="flex-1 flex flex-col gap-12">
          {/* Profile Overview Card */}
          <div className="border-2 border-border p-8 flex flex-col justify-between min-h-[220px]">
            <div>
              <span className="text-[10px] tracking-widest text-muted-foreground uppercase font-bold">
                {"// ACTIVE PROFILE"}
              </span>
              <h2 className="text-4xl font-bold tracking-tighter mt-4 uppercase">
                {getRoleLabel(role)}
              </h2>
            </div>
            <div className="mt-8 font-mono text-sm text-muted-foreground break-all">
              {address ? address : "WALLET DISCONNECTED"}
            </div>
          </div>

          {/* Balance Display */}
          <div className="border-2 border-border p-8 bg-accent text-accent-foreground min-h-[300px] flex flex-col justify-between">
            <span className="text-[10px] tracking-widest text-accent-foreground/60 uppercase font-bold">
              {"// LEDGER BALANCE"}
            </span>
            <div className="flex flex-col">
              <span className="text-[5rem] md:text-[8rem] font-bold tracking-tighter leading-none">
                {balanceLoading ? "..." : balance?.toFixed(2)}
              </span>
              <span className="text-2xl font-bold tracking-widest uppercase mt-4">
                CAMP POINTS
              </span>
            </div>
          </div>
        </div>

        {/* Right Side: Interactive Action Center */}
        <div className="flex-[1.5] border-2 border-border bg-background p-8 md:p-12 flex flex-col gap-12">
          {/* Action Tabs Selector */}
          <div className="flex border-b-2 border-border pb-4 gap-8">
            <button
              onClick={() => setActiveTab("send")}
              className={`text-xl font-bold uppercase tracking-wider pb-2 border-b-4 transition-all duration-200 ${
                activeTab === "send"
                  ? "border-accent text-foreground"
                  : "border-transparent text-muted-foreground hover:text-foreground"
              }`}
            >
              SEND FUNDS
            </button>
            <button
              onClick={() => setActiveTab("escrow")}
              className={`text-xl font-bold uppercase tracking-wider pb-2 border-b-4 transition-all duration-200 ${
                activeTab === "escrow"
                  ? "border-accent text-foreground"
                  : "border-transparent text-muted-foreground hover:text-foreground"
              }`}
            >
              ESCROW TRANSACTION
            </button>
            <button
              onClick={() => setActiveTab("events")}
              className={`text-xl font-bold uppercase tracking-wider pb-2 border-b-4 transition-all duration-200 ${
                activeTab === "events"
                  ? "border-accent text-foreground"
                  : "border-transparent text-muted-foreground hover:text-foreground"
              }`}
            >
              EVENTS & TICKETING
            </button>
          </div>

          {/* Action Contents */}
          {address ? (
            <div className="flex-1 flex flex-col justify-center min-h-[300px]">
              {/* Send Funds Form */}
              {activeTab === "send" && (
                <form onSubmit={executeTransfer} className="space-y-12">
                  <div className="flex flex-col">
                    <label className="text-xs font-bold tracking-widest text-muted-foreground uppercase mb-2">
                      RECIPIENT ACCOUNT ADDRESS
                    </label>
                    <input
                      type="text"
                      required
                      placeholder="G..."
                      value={transferRecipient}
                      onChange={(e) => setTransferRecipient(e.target.value)}
                      className="h-20 border-b-2 border-border focus:border-accent bg-transparent text-3xl font-bold uppercase tracking-tighter outline-none w-full"
                    />
                  </div>
                  <div className="flex flex-col">
                    <label className="text-xs font-bold tracking-widest text-muted-foreground uppercase mb-2">
                      AMOUNT (CAMP)
                    </label>
                    <input
                      type="number"
                      step="0.01"
                      required
                      placeholder="0.00"
                      value={transferAmount}
                      onChange={(e) => setTransferAmount(e.target.value)}
                      className="h-20 border-b-2 border-border focus:border-accent bg-transparent text-3xl font-bold uppercase tracking-tighter outline-none w-full"
                    />
                  </div>
                  <button
                    type="submit"
                    className="h-16 w-full bg-accent text-accent-foreground font-bold uppercase tracking-tighter text-lg transition-transform duration-200 hover:scale-105 active:scale-95"
                  >
                    EXECUTE TRANSFER →
                  </button>
                </form>
              )}

              {/* Escrow Creation Form */}
              {activeTab === "escrow" && (
                <form onSubmit={executeEscrow} className="space-y-12">
                  <div className="flex flex-col">
                    <label className="text-xs font-bold tracking-widest text-muted-foreground uppercase mb-2">
                      SELLER / MERCHANT ADDRESS
                    </label>
                    <input
                      type="text"
                      required
                      placeholder="G..."
                      value={escrowSeller}
                      onChange={(e) => setEscrowSeller(e.target.value)}
                      className="h-20 border-b-2 border-border focus:border-accent bg-transparent text-3xl font-bold uppercase tracking-tighter outline-none w-full"
                    />
                  </div>
                  <div className="flex flex-col">
                    <label className="text-xs font-bold tracking-widest text-muted-foreground uppercase mb-2">
                      ESCROW DEPOSIT AMOUNT (CAMP)
                    </label>
                    <input
                      type="number"
                      step="0.01"
                      required
                      placeholder="0.00"
                      value={escrowAmount}
                      onChange={(e) => setEscrowAmount(e.target.value)}
                      className="h-20 border-b-2 border-border focus:border-accent bg-transparent text-3xl font-bold uppercase tracking-tighter outline-none w-full"
                    />
                  </div>
                  <button
                    type="submit"
                    className="h-16 w-full bg-accent text-accent-foreground font-bold uppercase tracking-tighter text-lg transition-transform duration-200 hover:scale-105 active:scale-95"
                  >
                    LOCK FUNDS IN ESCROW →
                  </button>
                </form>
              )}

              {/* Events & Ticketing forms (Conditional UI based on role) */}
              {activeTab === "events" && (
                <div className="space-y-12">
                  {role === 3 || role === 4 ? (
                    /* Club or Admin: Create Event */
                    <form onSubmit={executeCreateEvent} className="space-y-12">
                      <h4 className="text-sm font-bold tracking-wider text-accent uppercase">
                        {"// CLUB ORGANIZER CONTROL: CREATE EVENT PASS"}
                      </h4>
                      <div className="flex flex-col">
                        <label className="text-xs font-bold tracking-widest text-muted-foreground uppercase mb-2">
                          TICKET PRICE (CAMP) - ENTER 0 FOR FREE
                        </label>
                        <input
                          type="number"
                          placeholder="0"
                          value={eventPrice}
                          onChange={(e) => setEventPrice(e.target.value)}
                          className="h-20 border-b-2 border-border focus:border-accent bg-transparent text-3xl font-bold uppercase tracking-tighter outline-none w-full"
                        />
                      </div>
                      <div className="flex flex-col">
                        <label className="text-xs font-bold tracking-widest text-muted-foreground uppercase mb-2">
                          MAX CAPACITY (TICKETS AVAILABLE)
                        </label>
                        <input
                          type="number"
                          required
                          placeholder="50"
                          value={eventCapacity}
                          onChange={(e) => setEventCapacity(e.target.value)}
                          className="h-20 border-b-2 border-border focus:border-accent bg-transparent text-3xl font-bold uppercase tracking-tighter outline-none w-full"
                        />
                      </div>
                      <button
                        type="submit"
                        className="h-16 w-full bg-accent text-accent-foreground font-bold uppercase tracking-tighter text-lg transition-transform duration-200 hover:scale-105 active:scale-95"
                      >
                        MINT EVENT TICKETS →
                      </button>
                    </form>
                  ) : (
                    /* Student/Member: Buy ticket */
                    <form onSubmit={executeBuyTicket} className="space-y-12">
                      <h4 className="text-sm font-bold tracking-wider text-accent uppercase">
                        {"// PURCHASE EVENT PASS"}
                      </h4>
                      <div className="flex flex-col">
                        <label className="text-xs font-bold tracking-widest text-muted-foreground uppercase mb-2">
                          EVENT ID (LEDGER TARGET)
                        </label>
                        <input
                          type="number"
                          required
                          placeholder="1"
                          value={buyTicketEventId}
                          onChange={(e) => setBuyTicketEventId(e.target.value)}
                          className="h-20 border-b-2 border-border focus:border-accent bg-transparent text-3xl font-bold uppercase tracking-tighter outline-none w-full"
                        />
                      </div>
                      <button
                        type="submit"
                        className="h-16 w-full bg-accent text-accent-foreground font-bold uppercase tracking-tighter text-lg transition-transform duration-200 hover:scale-105 active:scale-95"
                      >
                        ACQUIRE TICKET PASS →
                      </button>
                    </form>
                  )}
                </div>
              )}
            </div>
          ) : (
            <div className="min-h-[300px] flex items-center justify-center border-2 border-dashed border-border p-8">
              <span className="text-center font-bold text-muted-foreground uppercase tracking-widest">
                ACTIVATE ACCOUNT TO ENABLE FINANCIAL INTERACTIONS
              </span>
            </div>
          )}
        </div>
      </main>
    </div>
  );
}
