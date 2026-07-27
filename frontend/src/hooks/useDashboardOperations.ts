"use client";

import { useState } from "react";
import { useWalletStore } from "@/state/useWalletStore";
import { useTransactionStore } from "@/state/useTransactionStore";
import {
  useTransferMutation,
  useApproveMutation,
} from "@/hooks/useCampusToken";
import {
  useCreateEscrowMutation,
  useCreateEventMutation,
  useBuyTicketMutation,
} from "@/hooks/useCampusService";
import {
  pollTransactionStatus,
  NEXT_PUBLIC_CAMPUS_SERVICE_CONTRACT_ID,
} from "@/services/contracts";
import { logger } from "@/services/logger";

export function useDashboardOperations() {
  const { address } = useWalletStore();

  // Form states
  const [transferRecipient, setTransferRecipient] = useState("");
  const [transferAmount, setTransferAmount] = useState("");

  const [escrowSeller, setEscrowSeller] = useState("");
  const [escrowAmount, setEscrowAmount] = useState("");

  const [eventPrice, setEventPrice] = useState("");
  const [eventCapacity, setEventCapacity] = useState("");

  const [buyTicketEventId, setBuyTicketEventId] = useState("");

  const [activeTab, setActiveTab] = useState<"send" | "escrow" | "events">("send");
  const [txSearchQuery, setTxSearchQuery] = useState("");

  // Mutation Hooks
  const transferMut = useTransferMutation();
  const approveMut = useApproveMutation();
  const createEscrowMut = useCreateEscrowMutation();
  const createEventMut = useCreateEventMutation();
  const buyTicketMut = useBuyTicketMutation();

  const addTransaction = useTransactionStore((state) => state.addTransaction);
  const updateTransaction = useTransactionStore((state) => state.updateTransaction);

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
        spender: NEXT_PUBLIC_CAMPUS_SERVICE_CONTRACT_ID,
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
        spender: NEXT_PUBLIC_CAMPUS_SERVICE_CONTRACT_ID,
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

  return {
    transferRecipient,
    setTransferRecipient,
    transferAmount,
    setTransferAmount,
    escrowSeller,
    setEscrowSeller,
    escrowAmount,
    setEscrowAmount,
    eventPrice,
    setEventPrice,
    eventCapacity,
    setEventCapacity,
    buyTicketEventId,
    setBuyTicketEventId,
    activeTab,
    setActiveTab,
    txSearchQuery,
    setTxSearchQuery,
    executeTransfer,
    executeEscrow,
    executeCreateEvent,
    executeBuyTicket,
    transferPending: transferMut.isPending,
    escrowPending: approveMut.isPending || createEscrowMut.isPending,
    eventPending: createEventMut.isPending,
    buyTicketPending: approveMut.isPending || buyTicketMut.isPending,
  };
}
