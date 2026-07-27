"use client";

import { useState } from "react";
import { useWalletStore } from "@/state/useWalletStore";
import { useCampusBalance } from "@/hooks/useCampusToken";
import {
  useEscrowAgreement,
  useReleaseEscrowMutation,
  useRefundEscrowMutation,
  useClaimFaucetMutation,
  useBuyCampTokensMutation,
  useHasClaimedFaucet,
} from "@/hooks/useCampusService";
import { useTransactionStore } from "@/state/useTransactionStore";
import { pollTransactionStatus } from "@/services/contracts";
import { logger } from "@/services/logger";

export function useWalletOperations() {
  const { address } = useWalletStore();
  const { refetch: refetchBalance } = useCampusBalance(address);
  const { data: hasClaimed, refetch: refetchFaucetClaim } = useHasClaimedFaucet(address ?? undefined);

  // Escrow lookup state
  const [escrowIdInput, setEscrowIdInput] = useState("");
  const [activeEscrowId, setActiveEscrowId] = useState<number | null>(null);
  const [copied, setCopied] = useState(false);

  const { data: escrow, isLoading: escrowLoading, refetch: refetchEscrow } = useEscrowAgreement(activeEscrowId);

  // Mutations
  const releaseEscrowMut = useReleaseEscrowMutation();
  const refundEscrowMut = useRefundEscrowMutation();
  const claimFaucetMut = useClaimFaucetMutation();
  const buyCampMut = useBuyCampTokensMutation();

  // Buy CAMP form state
  const [xlmAmount, setXlmAmount] = useState("");
  const PURCHASE_RATE = 100; // 1 XLM = 100 CAMP

  const addTransaction = useTransactionStore((state) => state.addTransaction);
  const updateTransaction = useTransactionStore((state) => state.updateTransaction);

  const handleClaimFaucet = async () => {
    if (!address) return;
    try {
      const hash = await claimFaucetMut.mutateAsync({ recipient: address });
      addTransaction({
        hash,
        status: "pending",
        method: "CLAIM FAUCET",
        timestamp: Date.now(),
        explorerUrl: `https://stellar.expert/explorer/testnet/tx/${hash}`,
      });
      updateTransaction(hash, { status: "processing" });
      await pollTransactionStatus(hash);
      updateTransaction(hash, { status: "confirmed" });
      refetchBalance();
      refetchFaucetClaim();
    } catch (err) {
      addTransaction({
        hash: `err_${Date.now()}`,
        status: "failed",
        method: "CLAIM FAUCET",
        timestamp: Date.now(),
        errorMessage: String(err),
      });
    }
  };

  const handleBuyCamp = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!address || !xlmAmount) return;
    try {
      // Convert XLM to stroops (1 XLM = 10^7 stroops)
      const xlmStroops = String(BigInt(Math.round(parseFloat(xlmAmount) * 10_000_000)));
      const hash = await buyCampMut.mutateAsync({ recipient: address, xlmAmount: xlmStroops });
      addTransaction({
        hash,
        status: "pending",
        method: "BUY CAMP",
        timestamp: Date.now(),
        explorerUrl: `https://stellar.expert/explorer/testnet/tx/${hash}`,
      });
      updateTransaction(hash, { status: "processing" });
      await pollTransactionStatus(hash);
      updateTransaction(hash, { status: "confirmed" });
      refetchBalance();
      setXlmAmount("");
    } catch (err) {
      addTransaction({
        hash: `err_${Date.now()}`,
        status: "failed",
        method: "BUY CAMP",
        timestamp: Date.now(),
        errorMessage: String(err),
      });
    }
  };

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

  const refetchAll = () => {
    refetchBalance();
    if (activeEscrowId !== null) {
      refetchEscrow();
    }
  };

  return {
    address,
    hasClaimed,
    escrowIdInput,
    setEscrowIdInput,
    activeEscrowId,
    setActiveEscrowId,
    copied,
    escrow,
    escrowLoading,
    xlmAmount,
    setXlmAmount,
    PURCHASE_RATE,
    handleClaimFaucet,
    handleBuyCamp,
    handleLookup,
    handleCopy,
    handleEscrowAction,
    refetchAll,
    claimFaucetPending: claimFaucetMut.isPending,
    buyCampPending: buyCampMut.isPending,
    releaseEscrowPending: releaseEscrowMut.isPending,
    refundEscrowPending: refundEscrowMut.isPending,
  };
}
