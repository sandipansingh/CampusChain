"use client";

import React, { useState } from "react";
import { useWalletStore } from "@/state/useWalletStore";
import { useCampusBalance } from "@/hooks/useCampusToken";
import {
  useEscrowAgreement,
  useReleaseEscrowMutation,
  useRefundEscrowMutation
} from "@/hooks/useCampusService";
import { pollTransactionStatus } from "@/services/contracts";
import { useTransactionStore } from "@/state/useTransactionStore";
import { logger } from "@/services/logger";
import {
  Wallet,
  Unlock,
  RefreshCw,
  Loader2,
  AlertTriangle
} from "lucide-react";

export default function WalletPage() {
  const { address } = useWalletStore();
  const { data: balance, isLoading: balanceLoading, refetch: refetchBalance } = useCampusBalance(address);

  // Escrow lookup state
  const [escrowIdInput, setEscrowIdInput] = useState("");
  const [activeEscrowId, setActiveEscrowId] = useState<number | null>(null);
  const [copied, setCopied] = useState(false);

  const { data: escrow, isLoading: escrowLoading, refetch: refetchEscrow } = useEscrowAgreement(activeEscrowId);

  // Mutations
  const releaseEscrowMut = useReleaseEscrowMutation();
  const refundEscrowMut = useRefundEscrowMutation();

  const addTransaction = useTransactionStore((state) => state.addTransaction);
  const updateTransaction = useTransactionStore((state) => state.updateTransaction);

  const handleLookup = (e: React.FormEvent) => {
    e.preventDefault();
    if (!escrowIdInput) return;
    setActiveEscrowId(parseInt(escrowIdInput));
  };

  const handleCopy = () => {
    if (!address) return;
    navigator.clipboard.writeText(address);
    setCopied(true);
    setTimeout(() => setCopied(false), 2000);
  };

  const getEscrowStatusLabel = (status?: number) => {
    if (status === 1) return { text: "Funded", style: "bg-blue-50 text-blue-700 border-blue-200" };
    if (status === 2) return { text: "Released", style: "bg-emerald-50 text-emerald-700 border-emerald-200" };
    if (status === 3) return { text: "Refunded", style: "bg-red-50 text-red-700 border-red-200" };
    return { text: "Unknown", style: "bg-slate-50 text-slate-700 border-slate-200" };
  };

  const handleEscrowAction = async (action: "release" | "refund") => {
    if (!address || !escrow) return;
    const startTime = Date.now();
    const actionName = action === "release" ? "RELEASE ESCROW" : "REFUND ESCROW";
    
    try {
      let hash = "";
      if (action === "release") {
        hash = await releaseEscrowMut.mutateAsync({ escrowId: escrow.id, caller: address });
      } else {
        hash = await refundEscrowMut.mutateAsync({ escrowId: escrow.id, caller: address });
      }

      addTransaction({
        hash,
        status: "pending",
        method: actionName,
        timestamp: Date.now(),
        explorerUrl: `https://stellar.expert/explorer/testnet/tx/${hash}`,
      });
      logger.trackTransaction({ hash, method: actionName, status: "pending" });

      updateTransaction(hash, { status: "processing" });
      logger.trackTransaction({ hash, method: actionName, status: "processing" });

      await pollTransactionStatus(hash);
      updateTransaction(hash, { status: "confirmed" });
      logger.trackTransaction({
        hash,
        method: actionName,
        status: "confirmed",
        durationMs: Date.now() - startTime,
      });

      refetchEscrow();
      refetchBalance();
    } catch (err) {
      const errMsg = err instanceof Error ? err.message : `${actionName} failed`;
      const errHash = `err_${Date.now()}`;
      addTransaction({
        hash: errHash,
        status: "failed",
        method: actionName,
        timestamp: Date.now(),
        errorMessage: errMsg,
      });
      logger.error(`${actionName} failed`, err);
    }
  };

  const fundTestnetAccount = () => {
    if (!address) return;
    window.open(`https://friendbot.stellar.org/?addr=${address}`, "_blank");
  };

  return (
    <div className="flex flex-col gap-6 w-full max-w-7xl mx-auto">
      {/* Title */}
      <div className="flex flex-col md:flex-row md:items-center justify-between gap-4">
        <div>
          <h1 className="text-2xl font-semibold tracking-tight text-slate-900 uppercase">
            My Wallet
          </h1>
          <p className="text-slate-700 text-xs font-semibold mt-1">
            Manage your CAMP balances, acquire testnet gas tokens, and release secure smart contract escrows.
          </p>
        </div>
        <button
          onClick={() => { refetchBalance(); if (activeEscrowId !== null) refetchEscrow(); }}
          className="h-11 px-4 bg-white text-xs font-bold text-slate-800 rounded-xl hover:bg-slate-50 flex items-center gap-2 active:scale-95 transition-all shadow-sm"
        >
          <RefreshCw className="w-4 h-4 text-slate-700" />
          Refresh State
        </button>
      </div>

      {/* Grid: Wallet Details (Left) & Escrow Console (Right) */}
      <div className="grid grid-cols-1 lg:grid-cols-3 gap-6">
        
        {/* Left Side: Wallet Card & Ledger details */}
        <div className="lg:col-span-1 flex flex-col gap-6">
          
          {/* Card: Wallet Balance - Clean Flat Light borderless design */}
          <div className="bg-white text-slate-900 rounded-[24px] p-6 flex flex-col justify-between min-h-[220px]">
            <div className="flex justify-between items-start">
              <span className="text-[10px] font-bold uppercase tracking-widest text-slate-700">
                Stellar Account Card
              </span>
              <Wallet className="w-5 h-5 text-slate-700" />
            </div>

            <div className="my-6 flex flex-col">
              <span className="text-4xl font-bold tracking-tight font-mono text-slate-900">
                {balanceLoading ? "..." : balance?.toFixed(2)}
              </span>
              <span className="text-xs font-bold tracking-widest uppercase text-accent mt-1">
                CAMP Tokens Available
              </span>
            </div>

            <div className="border-t border-slate-100 pt-4 flex flex-col gap-1">
              <span className="text-[9px] font-bold text-slate-700 uppercase">Public Key</span>
              <button
                onClick={handleCopy}
                className="text-left w-full focus:outline-none flex items-center justify-between group/copy"
                title="Click to copy address"
              >
                <span className="text-[10px] font-mono text-slate-800 truncate font-semibold mr-2 group-hover/copy:text-accent transition-colors">
                  {address}
                </span>
                <span className="text-[9px] font-bold uppercase text-slate-700 shrink-0 group-hover/copy:text-accent transition-colors">
                  {copied ? "Copied!" : "Copy"}
                </span>
              </button>
            </div>
          </div>

          {/* Card: Testnet Faucet (Gas helper) - Flat design */}
          <div className="bg-white rounded-[24px] p-6 flex flex-col gap-4">
            <h3 className="text-sm font-bold text-slate-900 uppercase">
              Sandbox Gas Helper
            </h3>
            <p className="text-xs text-slate-800 font-semibold leading-relaxed">
              Running on Stellar Testnet requires XLM to cover transaction gas fees. Use the Friendbot faucet to fund your address.
            </p>
            <button
              onClick={fundTestnetAccount}
              className="w-full h-11 bg-accent hover:opacity-95 text-white text-xs font-bold uppercase rounded-xl flex items-center justify-center gap-2 active:scale-95 transition-all"
            >
              Request Testnet XLM
            </button>
          </div>
        </div>

        {/* Right Side: On-Chain Escrow Console - Flat borderless design */}
        <div className="lg:col-span-2 bg-white rounded-[24px] p-6 flex flex-col gap-6">
          <div className="border-b border-slate-100 pb-4">
            <h3 className="text-base font-bold text-slate-900 uppercase">
              Escrow Management Console
            </h3>
            <p className="text-xs text-slate-800 font-semibold mt-1">
              Verify smart contract escrow conditions. Release funds as a Buyer, or request refunds as a Seller.
            </p>
          </div>

          {/* Lookup Input Form - Clean input with no icon */}
          <form onSubmit={handleLookup} className="flex gap-3">
            <input
              type="number"
              required
              placeholder="Enter Escrow ID (e.g., 1, 2, 3)"
              value={escrowIdInput}
              onChange={(e) => setEscrowIdInput(e.target.value)}
              className="flex-1 h-11 bg-slate-50 border border-slate-200 rounded-xl px-4 text-xs font-semibold outline-none focus:border-slate-300 focus:ring-1 focus:ring-slate-200/50 transition-all font-mono"
            />
            <button
              type="submit"
              className="h-11 px-6 bg-accent hover:opacity-95 text-white text-xs font-bold uppercase rounded-xl flex items-center gap-2 active:scale-95 transition-all"
            >
              Lookup
            </button>
          </form>

          {/* Lookup Result Content */}
          {activeEscrowId === null ? (
            <div className="border border-dashed border-slate-200 rounded-[24px] p-16 text-center flex flex-col items-center justify-center gap-3 bg-slate-50/20">
              <span className="font-bold text-slate-700 text-xs uppercase tracking-widest">
                Search for an Escrow Agreement to review details
              </span>
            </div>
          ) : escrowLoading ? (
            <div className="flex flex-col items-center justify-center py-16 gap-3">
              <Loader2 className="w-6 h-6 animate-spin text-accent" />
              <span className="text-xs font-bold uppercase tracking-wider text-slate-700">
                Fetching escrow from Soroban state...
              </span>
            </div>
          ) : !escrow ? (
            <div className="border border-dashed border-red-200 bg-red-50/15 rounded-[24px] p-12 text-center flex flex-col items-center justify-center gap-3">
              <AlertTriangle className="w-8 h-8 text-red-500" />
              <span className="font-bold text-red-700 text-xs uppercase tracking-widest">
                Escrow ID #{activeEscrowId} not found
              </span>
              <p className="text-[10px] text-slate-700 font-semibold">
                Make sure the ID is correct and you are connected to the right RPC network.
              </p>
            </div>
          ) : (
            /* Escrow Agreement Info Panel */
            <div className="bg-slate-50/50 rounded-[24px] p-6 flex flex-col gap-6 animate-in fade-in duration-200">
              <div className="flex items-center justify-between border-b border-slate-100 pb-4">
                <div className="flex items-center gap-2">
                  <span className="text-sm font-bold text-slate-900">
                    Agreement #{escrow.id}
                  </span>
                  <span className={`text-[10px] font-bold uppercase px-2.5 py-0.5 rounded-full border ${getEscrowStatusLabel(escrow.status).style}`}>
                    {getEscrowStatusLabel(escrow.status).text}
                  </span>
                </div>
                <span className="text-base font-bold text-accent font-mono">
                  {escrow.amount.toFixed(2)} CAMP
                </span>
              </div>

              {/* Roles detail */}
              <div className="flex flex-col gap-4">
                <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                  <div className="flex flex-col gap-1 bg-slate-50 p-4 rounded-xl">
                    <span className="text-[9px] font-bold uppercase text-slate-700 tracking-wider">Buyer</span>
                    <span className="text-xs font-mono font-bold text-slate-800 break-all">{escrow.buyer}</span>
                    {address === escrow.buyer && (
                      <span className="text-[9px] font-bold text-emerald-600 bg-emerald-50 border border-emerald-100 rounded px-1.5 py-0.5 self-start mt-2">
                        You are the Buyer
                      </span>
                    )}
                  </div>
                  <div className="flex flex-col gap-1 bg-slate-50 p-4 rounded-xl">
                    <span className="text-[9px] font-bold uppercase text-slate-700 tracking-wider">Seller</span>
                    <span className="text-xs font-mono font-bold text-slate-800 break-all">{escrow.seller}</span>
                    {address === escrow.seller && (
                      <span className="text-[9px] font-bold text-blue-600 bg-blue-50 border border-blue-100 rounded px-1.5 py-0.5 self-start mt-2">
                        You are the Seller
                      </span>
                    )}
                  </div>
                </div>
              </div>

              {/* Action buttons (only active if status is 1: Funded) */}
              {escrow.status === 1 ? (
                <div className="border-t border-slate-100 pt-6 flex flex-col sm:flex-row gap-3">
                  <button
                    disabled={address !== escrow.buyer || releaseEscrowMut.isPending}
                    onClick={() => handleEscrowAction("release")}
                    className="flex-1 h-12 bg-accent hover:opacity-95 text-white text-xs font-bold uppercase rounded-xl flex items-center justify-center gap-2 active:scale-95 transition-all disabled:opacity-40 disabled:pointer-events-none"
                  >
                    {releaseEscrowMut.isPending ? (
                      <Loader2 className="w-4 h-4 animate-spin" />
                    ) : (
                      <Unlock className="w-4 h-4" />
                    )}
                    Release Escrow (Buyer Only)
                  </button>
                  <button
                    disabled={(address !== escrow.seller && address !== escrow.buyer) || refundEscrowMut.isPending}
                    onClick={() => handleEscrowAction("refund")}
                    className="flex-1 h-12 bg-slate-900 hover:bg-slate-800 text-white text-xs font-bold uppercase rounded-xl flex items-center justify-center gap-2 active:scale-95 transition-all disabled:opacity-40 disabled:pointer-events-none"
                  >
                    Refund Escrow
                  </button>
                </div>
              ) : (
                <div className="border-t border-slate-100 pt-6 text-center text-xs font-bold text-slate-700 uppercase tracking-wide">
                  This escrow agreement has been finalized and cannot be modified.
                </div>
              )}
            </div>
          )}
        </div>
      </div>
    </div>
  );
}
