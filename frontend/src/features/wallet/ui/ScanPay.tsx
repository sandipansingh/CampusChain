"use client";

import { useState } from "react";
import { useWallet } from "@/shared/stellar/useWallet";
import { Skeleton } from "@/shared/ui/Skeleton";
import { Dropdown } from "@/shared/ui/Dropdown";
import { useMutation, useQueryClient } from "@tanstack/react-query";
import { executeTransfer } from "@/features/wallet/service/campusToken";
import { sendNativePayment } from "@/shared/stellar/client";
import { signTx } from "@/features/wallet/service/wallet";
import {
  CameraOff,
  Keyboard,
  ArrowLeft,
  Zap,
  CheckCircle,
  AlertCircle,
  Store,
  ArrowRight,
} from "lucide-react";

type ScanState = "waiting" | "scanned" | "loading" | "empty";

export function ScanPay() {
  const { address } = useWallet();
  const [scanState, setScanState] = useState<ScanState>("scanned");
  
  // Scanned QR details
  const targetRecipient = "GBPVICMAESR2O4LJRDAV2YGGIQDAEY6ANCAF3GLIXEYRAIDDXM7WQP7X";
  const paymentAmount = "15.00";
  const [statusMsg, setStatusMsg] = useState<{ type: "success" | "error" | "info"; text: string } | null>(null);

  const queryClient = useQueryClient();
  const checkoutMutation = useMutation({
    mutationFn: async () => {
      if (!address) throw new Error("Wallet not connected");
      setStatusMsg({ type: "info", text: "Signing and submitting scanned checkout..." });
      
      // Let's perform a CAMP transfer
      return await executeTransfer(address, targetRecipient, parseFloat(paymentAmount));
    },
    onSuccess: (txHash) => {
      setStatusMsg({ type: "success", text: `Scanned checkout successful! Hash: ${txHash.slice(0, 8)}...${txHash.slice(-8)}` });
      queryClient.invalidateQueries({ queryKey: ["campus-balance", address] });
      queryClient.invalidateQueries({ queryKey: ["campus-balance", targetRecipient] });
      setScanState("empty");
    },
    onError: (err: unknown) => {
      const msg = err instanceof Error ? err.message : String(err);
      setStatusMsg({ type: "error", text: `Checkout failed: ${msg}` });
    },
  });

  return (
    <div className="w-full max-w-4xl mx-auto space-y-6">
      {statusMsg && (
        <div className={`p-4 rounded-xl text-xs font-semibold border ${
          statusMsg.type === "success"
            ? "bg-emerald-500/10 text-emerald-600 border-emerald-500/20"
            : statusMsg.type === "error"
            ? "bg-destructive/10 text-destructive border-destructive/20"
            : "bg-blue-500/10 text-blue-600 border-blue-500/20 animate-pulse"
        }`}>
          {statusMsg.text}
        </div>
      )}

      {/* Main card viewport */}
      <div className="flex flex-col md:flex-row w-full bg-card rounded-xl border border-border shadow-sm overflow-hidden min-h-[500px]">
        {/* Left Side: Camera Scan View */}
        <div className="flex-1 p-8 flex flex-col justify-center items-center border-r border-border bg-card/60">
          <div className="w-full max-w-sm text-center">
            <h3 className="text-lg font-bold mb-4">Scan Merchant QR</h3>
            
            {/* Viewfinder simulation */}
            <div className="relative w-full aspect-square bg-zinc-900 rounded-xl flex flex-col items-center justify-center overflow-hidden border border-border shadow-inner">
              {/* Outer scan brackets */}
              <div className="absolute inset-6 border-2 border-dashed border-zinc-700 rounded-lg"></div>
              
              {/* Scanning brackets corner accents */}
              <div className="absolute top-6 left-6 w-8 h-8 border-t-4 border-l-4 border-card rounded-tl"></div>
              <div className="absolute top-6 right-6 w-8 h-8 border-t-4 border-r-4 border-card rounded-tr"></div>
              <div className="absolute bottom-6 left-6 w-8 h-8 border-b-4 border-l-4 border-card rounded-bl"></div>
              <div className="absolute bottom-6 right-6 w-8 h-8 border-b-4 border-r-4 border-card rounded-br"></div>
              
              {/* Laser line animation */}
              <div className="absolute w-[80%] h-0.5 bg-primary/60 shadow-[0_0_8px_var(--primary)] left-10 animate-pulse top-1/2 -translate-y-1/2"></div>
              
              <div className="flex flex-col items-center justify-center text-zinc-500 gap-2 z-10">
                <CameraOff className="h-10 w-10 text-zinc-600" />
                <span className="text-xs font-semibold uppercase tracking-wider text-zinc-500">Camera Viewfinder</span>
              </div>
            </div>
          </div>
        </div>

        {/* Right Side: Info Panel & State rendering */}
        <div className="w-full md:w-80 p-8 flex flex-col justify-between bg-muted/30">
          <div className="space-y-6">
            <div className="flex justify-between items-center">
              <span className="inline-flex items-center gap-1.5 px-2.5 py-1 rounded-full bg-secondary text-secondary-foreground text-[10px] font-bold uppercase tracking-wider">
                <Store className="h-3.5 w-3.5" />
                Kiosk Mode
              </span>

              <div className="w-28 shrink-0">
                <Dropdown<ScanState>
                  options={[
                    { value: "scanned", label: "Scanned" },
                    { value: "waiting", label: "Waiting" },
                    { value: "loading", label: "Loading" },
                    { value: "empty", label: "Empty" },
                  ]}
                  value={scanState}
                  onChange={(val) => setScanState(val)}
                />
              </div>
            </div>

            {/* State rendering */}
            {scanState === "loading" ? (
              <div className="p-4 bg-card rounded-lg border border-border space-y-3">
                <Skeleton className="h-4 w-28" />
                <Skeleton className="h-6 w-full" />
              </div>
            ) : scanState === "empty" ? (
              <div className="p-4 bg-card rounded-lg border border-border flex items-start gap-3">
                <AlertCircle className="h-5 w-5 text-muted-foreground shrink-0 mt-0.5" />
                <div>
                  <h5 className="text-xs font-bold text-foreground">Checkout Cleared</h5>
                  <p className="text-[11px] text-muted-foreground mt-0.5 leading-relaxed">
                    No scanned code active. Point the camera at a QR to start payment.
                  </p>
                </div>
              </div>
            ) : scanState === "waiting" ? (
              <div className="p-4 bg-card rounded-lg border border-border flex items-center gap-3">
                <div className="w-2.5 h-2.5 rounded-full bg-primary animate-ping shrink-0"></div>
                <span className="text-xs font-bold text-foreground">Aligning QR code...</span>
              </div>
            ) : (
              <div className="p-4 bg-card rounded-lg border border-border space-y-4 shadow-sm">
                <div className="flex items-center gap-2 text-xs font-bold text-emerald-600 bg-emerald-50 border border-emerald-100 px-2 py-1 rounded-md w-fit">
                  <CheckCircle className="h-3.5 w-3.5" />
                  QR Validated
                </div>
                
                <div className="space-y-1">
                  <div className="text-[10px] uppercase font-bold tracking-wider text-muted-foreground">Recipient</div>
                  <div className="text-sm font-bold truncate">{targetRecipient}</div>
                </div>

                <div className="space-y-1 pt-1 border-t border-border">
                  <div className="text-[10px] uppercase font-bold tracking-wider text-muted-foreground">Checkout Amount</div>
                  <div className="text-base font-extrabold">{paymentAmount} CAMP</div>
                </div>
              </div>
            )}
          </div>

          <div className="mt-8">
            {scanState === "scanned" ? (
              <button
                onClick={() => checkoutMutation.mutate()}
                disabled={checkoutMutation.isPending}
                className="w-full h-11 bg-primary text-primary-foreground font-semibold rounded-lg hover:bg-primary/95 flex items-center justify-center gap-2 cursor-pointer transition-all active:scale-[0.98] disabled:opacity-50 disabled:cursor-not-allowed"
              >
                <span>{checkoutMutation.isPending ? "Processing..." : "Confirm Checkout"}</span>
                <ArrowRight className="h-4 w-4" />
              </button>
            ) : (
              <button
                onClick={() => setScanState("scanned")}
                className="w-full h-11 bg-card border border-border text-foreground font-semibold rounded-lg hover:bg-accent flex items-center justify-center gap-2 cursor-pointer transition-colors"
              >
                <span>Simulate QR Scan</span>
              </button>
            )}
          </div>
        </div>
      </div>
    </div>
  );
}
export default ScanPay;
