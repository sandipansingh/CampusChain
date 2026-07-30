"use client";

import { useEffect, useState } from "react";
import Image from "next/image";
import QRCode from "qrcode";
import { ArrowUpRight, Check, Copy, QrCode } from "lucide-react";
import { useMutation, useQueryClient } from "@tanstack/react-query";
import { useWallet } from "@/shared/stellar/useWallet";
import { executeTransfer } from "@/features/wallet/service/campusToken";
import { sendNativePayment } from "@/shared/stellar/client";
import { signTx } from "@/features/wallet/service/wallet";
import { encodePaymentRequest, PaymentAsset } from "@/features/wallet/service/paymentRequest";
import { useCampusProfile, useUniversityProfiles } from "@/features/wallet/hooks/useWallet";

export function SendReceive() {
  const { address } = useWallet();
  const [tab, setTab] = useState<"send" | "receive">("send");
  const [recipient, setRecipient] = useState("");
  const [amount, setAmount] = useState("");
  const [asset, setAsset] = useState<PaymentAsset>("CAMP");
  const [copyState, setCopyState] = useState(false);
  const [qrDataUrl, setQrDataUrl] = useState<string | null>(null);
  const [requestError, setRequestError] = useState<string | null>(null);
  const [showDropdown, setShowDropdown] = useState(false);
  const [localError, setLocalError] = useState<string | null>(null);

  const queryClient = useQueryClient();

  // Scoping queries
  const { data: profile } = useCampusProfile(address ?? null);
  const myUnivCode = profile?.universityCode ?? "";
  const { data: members = [] } = useUniversityProfiles(myUnivCode);

  const payment = useMutation({
    mutationFn: async () => {
      if (!address) throw new Error("Wallet not connected.");
      const request = {
        network: "testnet" as const,
        destination: recipient.trim(),
        asset,
        amount: amount.trim(),
      };
      const encoded = encodePaymentRequest(request);
      void encoded;
      return asset === "CAMP"
        ? executeTransfer(address, request.destination, Number(request.amount))
        : sendNativePayment(request.destination, request.amount, address, signTx);
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ["campus-balance", address] });
      queryClient.invalidateQueries({ queryKey: ["campus-balance", recipient.trim()] });
      window.dispatchEvent(new Event("campuschain:transaction-submitted"));
      setRecipient("");
      setAmount("");
      setLocalError(null);
    },
  });

  useEffect(() => {
    if (tab !== "receive" || !address || !amount) {
      setQrDataUrl(null);
      return;
    }
    try {
      const payload = encodePaymentRequest({
        network: "testnet",
        destination: address,
        asset,
        amount,
      });
      QRCode.toDataURL(payload, {
        width: 256,
        margin: 1,
        color: { dark: "#111111", light: "#ffffff" },
      })
        .then(setQrDataUrl)
        .catch((error: unknown) =>
          setRequestError(error instanceof Error ? error.message : "Unable to generate QR code.")
        );
      setRequestError(null);
    } catch (error) {
      setQrDataUrl(null);
      setRequestError(error instanceof Error ? error.message : "Enter a valid request amount.");
    }
  }, [address, amount, asset, tab]);

  const copyAddress = async () => {
    if (!address) return;
    await navigator.clipboard.writeText(address);
    setCopyState(true);
    window.setTimeout(() => setCopyState(false), 2000);
  };

  const handleSend = () => {
    setLocalError(null);
    const target = recipient.trim();
    if (!target) {
      setLocalError("Please enter a recipient Stellar address.");
      return;
    }
    if (!amount || Number(amount) <= 0) {
      setLocalError("Please enter a valid amount.");
      return;
    }
    // Defense-in-depth: check that the target recipient is a verified member of the user's university
    const isMember = members.some((m) => m.address.toLowerCase() === target.toLowerCase());
    if (!isMember) {
      setLocalError("Recipient is not a verified member of your university.");
      return;
    }
    payment.mutate();
  };

  // Autocomplete suggestions
  const query = recipient.trim().toLowerCase();
  const matchingMembers = query
    ? members.filter(
        (m) =>
          m.address.toLowerCase() !== address?.toLowerCase() &&
          (m.fullName.toLowerCase().includes(query) || m.address.toLowerCase().includes(query))
      )
    : [];

  return (
    <div className="bg-card rounded-xl border border-border w-full max-w-md p-6 shadow-sm mx-auto">
      <div className="flex border-b border-border mb-6">
        <button
          onClick={() => setTab("send")}
          className={
            tab === "send"
              ? "flex-1 py-2 text-sm font-bold border-b-2 border-foreground cursor-pointer"
              : "flex-1 py-2 text-sm text-muted-foreground cursor-pointer"
          }
        >
          Send
        </button>
        <button
          onClick={() => setTab("receive")}
          className={
            tab === "receive"
              ? "flex-1 py-2 text-sm font-bold border-b-2 border-foreground cursor-pointer"
              : "flex-1 py-2 text-sm text-muted-foreground cursor-pointer"
          }
        >
          Receive
        </button>
      </div>

      {tab === "send" ? (
        <div className="space-y-5">
          <div className="relative">
            <label className="block text-xs font-bold text-muted-foreground">
              Recipient Stellar address
              <input
                value={recipient}
                onChange={(event) => {
                  setRecipient(event.target.value);
                  setShowDropdown(true);
                  setLocalError(null);
                }}
                onFocus={() => setShowDropdown(true)}
                onBlur={() => window.setTimeout(() => setShowDropdown(false), 200)}
                placeholder="G..."
                className="mt-1.5 h-12 w-full border border-border rounded-lg px-3 text-sm font-mono text-foreground focus:outline-none focus:ring-1 focus:ring-foreground bg-transparent"
              />
            </label>

            {/* Recipient Dropdown Autocomplete */}
            {showDropdown && matchingMembers.length > 0 && (
              <div className="absolute left-0 right-0 mt-1 max-h-48 overflow-y-auto bg-card border border-border rounded-lg shadow-lg z-50 divide-y divide-border/60">
                {matchingMembers.map((m) => (
                  <button
                    key={m.address}
                    type="button"
                    onMouseDown={() => {
                      setRecipient(m.address);
                      setShowDropdown(false);
                      setLocalError(null);
                    }}
                    className="w-full text-left px-3 py-2 hover:bg-muted/50 transition-colors flex flex-col cursor-pointer"
                  >
                    <span className="text-xs font-bold text-foreground">
                      {m.fullName}{" "}
                      <span className="text-[10px] text-muted-foreground font-normal">
                        ({m.role === 1 ? "Student" : m.role === 2 ? "Merchant" : "Organizer"})
                      </span>
                    </span>
                    <span className="text-[10px] text-muted-foreground font-mono truncate">
                      {m.address}
                    </span>
                  </button>
                ))}
              </div>
            )}
          </div>

          <label className="block text-xs font-bold text-muted-foreground">
            Amount
            <div className="mt-1.5 flex gap-2">
              <input
                value={amount}
                onChange={(event) => {
                  setAmount(event.target.value);
                  setLocalError(null);
                }}
                type="number"
                min="0"
                step="0.0000001"
                placeholder="0.00"
                className="h-12 flex-1 border border-border rounded-lg px-3 text-sm text-foreground focus:outline-none focus:ring-1 focus:ring-foreground bg-transparent"
              />
              <select
                value={asset}
                onChange={(event) => setAsset(event.target.value as PaymentAsset)}
                className="h-12 border border-border rounded-lg px-3 text-sm text-foreground focus:outline-none bg-transparent"
              >
                <option value="CAMP">CAMP</option>
                <option value="XLM">XLM</option>
              </select>
            </div>
          </label>

          <button
            onClick={handleSend}
            disabled={payment.isPending}
            className="h-12 w-full bg-primary text-primary-foreground rounded-lg font-bold text-sm disabled:opacity-50 inline-flex justify-center items-center gap-2 cursor-pointer transition-colors"
          >
            {payment.isPending ? "Confirming payment" : "Send payment"}
            <ArrowUpRight className="h-4 w-4" />
          </button>

          {localError && (
            <p className="text-xs text-destructive bg-destructive/5 border border-destructive/20 p-2 rounded">
              {localError}
            </p>
          )}
          {payment.isSuccess && (
            <p className="text-xs text-emerald-700 bg-emerald-50 border border-emerald-200 p-2 rounded break-all">
              Payment confirmed: {payment.data}
            </p>
          )}
          {payment.isError && (
            <p className="text-xs text-destructive bg-destructive/5 border border-destructive/20 p-2 rounded break-words">
              {payment.error instanceof Error ? payment.error.message : "Payment failed."}
            </p>
          )}
        </div>
      ) : (
        <div className="space-y-5">
          <p className="text-xs text-muted-foreground">
            Generate an encoded Testnet payment request. It can be scanned or pasted into Scan & Pay.
          </p>
          <label className="block text-xs font-bold text-muted-foreground">
            Requested amount
            <div className="mt-1.5 flex gap-2">
              <input
                value={amount}
                onChange={(event) => setAmount(event.target.value)}
                type="number"
                min="0"
                step="0.0000001"
                placeholder="0.00"
                className="h-12 flex-1 border border-border rounded-lg px-3 text-sm text-foreground focus:outline-none focus:ring-1 focus:ring-foreground bg-transparent"
              />
              <select
                value={asset}
                onChange={(event) => setAsset(event.target.value as PaymentAsset)}
                className="h-12 border border-border rounded-lg px-3 text-sm text-foreground focus:outline-none bg-transparent"
              >
                <option value="CAMP">CAMP</option>
                <option value="XLM">XLM</option>
              </select>
            </div>
          </label>

          {qrDataUrl ? (
            <Image
              src={qrDataUrl}
              width={256}
              height={256}
              unoptimized
              alt="CampusChain payment request QR code"
              className="mx-auto border border-border rounded-lg"
            />
          ) : (
            <div className="h-56 border border-dashed border-border rounded-lg flex flex-col items-center justify-center text-muted-foreground">
              <QrCode className="h-10 w-10" />
              <p className="mt-2 text-xs">Enter a valid amount to generate a QR request.</p>
            </div>
          )}

          <div className="flex items-center gap-2 bg-muted/40 p-2 rounded-lg border border-border">
            <span className="flex-1 text-xs font-mono truncate" title={address ?? undefined}>
              {address ?? "Wallet not connected"}
            </span>
            <button
              onClick={copyAddress}
              disabled={!address}
              className="p-1.5 border border-border bg-card rounded-md cursor-pointer"
            >
              {copyState ? <Check className="h-3.5 w-3.5" /> : <Copy className="h-3.5 w-3.5" />}
            </button>
          </div>
          {requestError && <p className="text-xs text-destructive">{requestError}</p>}
        </div>
      )}
    </div>
  );
}

export default SendReceive;
