"use client";

import { useEffect, useState } from "react";
import Image from "next/image";
import QRCode from "qrcode";
import { ArrowUpRight, Check, Copy, QrCode, Coins } from "lucide-react";
import { useMutation, useQueryClient } from "@tanstack/react-query";
import { useWallet } from "@/shared/stellar/useWallet";
import { executeTransfer } from "@/features/wallet/service/campusToken";
import { sendNativePayment } from "@/shared/stellar/client";
import { signTx } from "@/features/wallet/service/wallet";
import { encodePaymentRequest, PaymentAsset } from "@/features/wallet/service/paymentRequest";
import {
  useCampusBalance,
  useCampusProfile,
  useUniversityProfiles,
  useBuyCampTokensMutation,
  useClaimFaucetMutation,
  useHasClaimedFaucet,
  useWithdrawCampMutation,
} from "@/features/wallet/hooks/useWallet";
import { Dropdown } from "@/shared/ui/Dropdown";
import { Skeleton } from "@/shared/ui/Skeleton";

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
  const { data: members = [] } = useUniversityProfiles(myUnivCode, address);

  // CAMP Balance and Buy states
  const { data: campBalance, isLoading: isBalanceLoading } = useCampusBalance(address ?? null);
  const buyCamp = useBuyCampTokensMutation();
  const [xlm, setXlm] = useState("");
  const [buyNotice, setBuyNotice] = useState<string | null>(null);

  // Faucet state
  const faucet = useHasClaimedFaucet(address ?? undefined);
  const claim = useClaimFaucetMutation();
  const [faucetNotice, setFaucetNotice] = useState<string | null>(null);

  // Withdraw state
  const [showWithdrawModal, setShowWithdrawModal] = useState(false);
  const [withdrawAmount, setWithdrawAmount] = useState("");
  const [withdrawNotice, setWithdrawNotice] = useState<string | null>(null);
  const withdrawMutation = useWithdrawCampMutation();

  const handleClaimFaucet = async () => {
    if (!address) return;
    try {
      setFaucetNotice(null);
      const hash = await claim.mutateAsync({ recipient: address });
      setFaucetNotice(`Claim confirmed: ${hash}`);
    } catch (error) {
      setFaucetNotice(error instanceof Error ? error.message : "Claim failed.");
    }
  };

  const buy = async () => {
    if (!address) return;
    try {
      const stroops = BigInt(Math.round(Number(xlm) * 10_000_000));
      if (stroops < BigInt(10_000_000)) throw new Error("Minimum purchase is 1 XLM.");
      const hash = await buyCamp.mutateAsync({ recipient: address, xlmAmount: stroops.toString() });
      setBuyNotice(`CAMP purchase confirmed: ${hash}`);
      setXlm("");
    } catch (error) {
      setBuyNotice(error instanceof Error ? error.message : "Purchase failed.");
    }
  };

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

  const assetOptions = [
    { value: "CAMP" as PaymentAsset, label: "CAMP" },
    { value: "XLM" as PaymentAsset, label: "XLM" },
  ];

  return (
    <div className="w-full max-w-5xl mx-auto grid lg:grid-cols-12 gap-6 items-start animate-in fade-in duration-300">
      {/* Left Column: CAMP Balance Card & Buy CAMP Card */}
      <section className="lg:col-span-5 space-y-6">
        <div className="bg-card border border-border rounded-xl p-6 shadow-sm space-y-4">
          <div>
            <p className="text-xs font-bold uppercase tracking-wider text-muted-foreground">Available CAMP</p>
            {isBalanceLoading ? (
              <Skeleton className="h-10 w-40 mt-3" />
            ) : (
              <p className="mt-2 text-3xl font-bold text-foreground">
                {campBalance?.toLocaleString() ?? "0"} CAMP
              </p>
            )}
          </div>
          <div className="pt-2 border-t border-border">
            <button
              onClick={() => setShowWithdrawModal(true)}
              className="w-full bg-zinc-900 hover:bg-zinc-800 text-white font-semibold rounded-lg py-2.5 px-4 text-xs flex items-center justify-center gap-1.5 transition-all cursor-pointer shadow-sm"
            >
              <ArrowUpRight className="h-4 w-4" />
              Withdraw CAMP to XLM
            </button>
          </div>
        </div>

        {(!faucet.data || (faucetNotice && faucetNotice.includes("confirmed"))) && (
          <div className="bg-card border border-border rounded-xl p-6 shadow-sm space-y-4">
            <h3 className="font-bold text-base text-foreground">Testnet Faucet</h3>
            <p className="text-xs text-muted-foreground">
              Claim test CAMP tokens. One 100 CAMP claim per wallet under the current contract.
            </p>
            {faucetNotice && (
              <div className={faucetNotice.includes("confirmed") ? "text-xs text-emerald-700 break-all bg-emerald-50 border border-emerald-200 p-2.5 rounded-lg" : "text-xs text-destructive break-words bg-destructive/5 border border-destructive/20 p-2.5 rounded-lg"}>
                {faucetNotice}
              </div>
            )}
            <button
              onClick={handleClaimFaucet}
              disabled={!address || faucet.data || faucet.isLoading || claim.isPending}
              className="h-11 w-full border border-border rounded-lg text-sm font-bold disabled:opacity-50 inline-flex items-center justify-center gap-2 cursor-pointer transition-colors hover:bg-muted"
            >
              <Coins className="h-4 w-4" />
              {faucet.data ? "Already claimed" : claim.isPending ? "Confirming claim" : "Claim 100 CAMP"}
            </button>
          </div>
        )}

        <div className="bg-card border border-border rounded-xl p-6 space-y-4 shadow-sm">
          <h3 className="font-bold text-base text-foreground">Buy CAMP with XLM</h3>
          <p className="text-xs text-muted-foreground">
            The contract rate is 1 XLM = 100 CAMP. This flow approves the native XLM Stellar Asset Contract, then confirms the CampusService purchase.
          </p>
          {buyNotice && (
            <div className={buyNotice.includes("confirmed") ? "text-xs text-emerald-700 break-all bg-emerald-50 border border-emerald-200 p-2.5 rounded-lg" : "text-xs text-destructive break-words bg-destructive/5 border border-destructive/20 p-2.5 rounded-lg"}>
              {buyNotice}
            </div>
          )}
          <label className="block text-xs font-bold text-muted-foreground">
            XLM amount
            <input
              value={xlm}
              onChange={(event) => {
                setXlm(event.target.value);
                setBuyNotice(null);
              }}
              type="number"
              min="1"
              step="0.0000001"
              className="mt-1.5 h-11 w-full rounded-lg border border-border px-3 text-sm text-foreground bg-transparent focus:outline-none focus:ring-1 focus:ring-foreground"
            />
          </label>
          <button
            onClick={buy}
            disabled={!address || buyCamp.isPending}
            className="h-11 w-full bg-primary text-primary-foreground rounded-lg text-sm font-bold disabled:opacity-50 cursor-pointer transition-colors hover:opacity-90"
          >
            {buyCamp.isPending ? "Confirming purchase" : "Buy CAMP"}
          </button>
        </div>
      </section>

      {/* Right Column: Send/Receive Card */}
      <section className="lg:col-span-7 w-full">
        <div className="bg-card rounded-xl border border-border p-6 shadow-sm w-full">
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
                            ({m.role === 1 ? "Student" : m.role === 2 ? "Merchant" : m.role === 3 ? "Organizer" : m.role === 4 ? "University Admin" : m.role === 5 ? "Platform Admin" : "Member"})
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
                  <Dropdown<PaymentAsset>
                    options={assetOptions}
                    value={asset}
                    onChange={(val) => setAsset(val)}
                    className="w-28 shrink-0"
                  />
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
                  <Dropdown<PaymentAsset>
                    options={assetOptions}
                    value={asset}
                    onChange={(val) => setAsset(val)}
                    className="w-28 shrink-0"
                  />
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
      </section>

      {/* Withdraw to XLM Modal */}
      {showWithdrawModal && (
        <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-background/80 backdrop-blur-sm animate-in fade-in duration-200">
          <form
            onSubmit={async (e) => {
              e.preventDefault();
              if (!address || !withdrawAmount || Number(withdrawAmount) <= 0) return;
              try {
                setWithdrawNotice(null);
                const txHash = await withdrawMutation.mutateAsync({
                  student: address,
                  campAmount: Number(withdrawAmount),
                });
                setWithdrawNotice(`Successfully withdrawn ${withdrawAmount} CAMP to XLM! Tx: ${txHash}`);
                setWithdrawAmount("");
              } catch (err) {
                setWithdrawNotice(err instanceof Error ? err.message : "Withdrawal failed.");
              }
            }}
            className="w-full max-w-md bg-card border border-border rounded-xl p-6 space-y-4 shadow-xl"
          >
            <div className="flex justify-between items-center">
              <h3 className="font-bold text-foreground text-sm flex items-center gap-2">
                <ArrowUpRight className="h-5 w-5 text-foreground" /> Withdraw CAMP to XLM
              </h3>
              <button
                type="button"
                onClick={() => {
                  setShowWithdrawModal(false);
                  setWithdrawNotice(null);
                }}
                className="text-muted-foreground hover:text-foreground text-xs font-bold cursor-pointer"
              >
                ✕
              </button>
            </div>

            <p className="text-xs text-muted-foreground leading-relaxed">
              Burn your CAMP tokens on-chain to receive native XLM directly into your Stellar wallet.
              <br />
              <strong className="text-foreground">Conversion Rate: 100 CAMP = 1 XLM</strong>
            </p>

            {withdrawNotice && (
              <div
                className={`text-xs p-2.5 rounded-lg border break-all ${
                  withdrawNotice.includes("Successfully")
                    ? "text-emerald-700 bg-emerald-50 border-emerald-200"
                    : "text-destructive bg-destructive/5 border-destructive/20"
                }`}
              >
                {withdrawNotice}
              </div>
            )}

            <div className="space-y-1.5">
              <label className="text-xs font-semibold text-foreground">CAMP Amount to Withdraw</label>
              <input
                type="number"
                min="1"
                step="1"
                value={withdrawAmount}
                onChange={(e) => setWithdrawAmount(e.target.value)}
                placeholder="e.g. 100"
                className="w-full px-3 py-2 bg-background border border-border rounded-lg text-xs focus:outline-none focus:ring-1 focus:ring-primary"
                required
              />
              <p className="text-[10px] text-muted-foreground">
                Estimated XLM payout: <strong>{(Number(withdrawAmount || 0) / 100).toFixed(2)} XLM</strong>
              </p>
            </div>

            <div className="flex justify-end gap-3 pt-2">
              <button
                type="button"
                onClick={() => {
                  setShowWithdrawModal(false);
                  setWithdrawNotice(null);
                }}
                className="h-10 px-4 border border-border rounded-lg text-xs font-bold cursor-pointer hover:bg-muted"
              >
                Cancel
              </button>
              <button
                type="submit"
                disabled={withdrawMutation.isPending || !withdrawAmount}
                className="h-10 px-4 bg-zinc-900 hover:bg-zinc-800 text-white rounded-lg text-xs font-bold disabled:opacity-50 cursor-pointer"
              >
                {withdrawMutation.isPending ? "Processing..." : "Confirm Withdrawal"}
              </button>
            </div>
          </form>
        </div>
      )}
    </div>
  );
}

export default SendReceive;
