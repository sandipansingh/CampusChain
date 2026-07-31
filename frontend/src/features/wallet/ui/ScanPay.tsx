"use client";

import { useEffect, useRef, useState } from "react";
import { Camera, CheckCircle2, QrCode, ScanLine, X, AlertCircle, Loader2 } from "lucide-react";
import { useMutation, useQueryClient } from "@tanstack/react-query";
import { useWallet } from "@/shared/stellar/useWallet";
import { executeTransfer } from "@/features/wallet/service/campusToken";
import { sendNativePayment } from "@/shared/stellar/client";
import { signTx } from "@/features/wallet/service/wallet";
import { decodePaymentRequest, PaymentRequest } from "@/features/wallet/service/paymentRequest";
import { useCampusProfile } from "@/features/wallet/hooks/useWallet";

/**
 * ScanPay
 *
 * Provides two paths for reading a CampusChain payment-request QR:
 *
 * 1. Live camera scanning via the `qr-scanner` library (Nimiq).
 *    - Uses `BarcodeDetector` natively on Chrome/Android where available,
 *      otherwise falls back to a pure-JS WASM decoder.
 *    - Works on: Chrome (desktop & Android), Safari (iOS 14.3+), Firefox.
 *    - Rear/environment camera is preferred on mobile; front camera on desktop.
 *
 * 2. Manual paste of the encoded payload string.
 */
export function ScanPay() {
  const { address } = useWallet();
  const queryClient = useQueryClient();

  const [payload, setPayload] = useState("");
  const [request, setRequest] = useState<PaymentRequest | null>(null);
  const [error, setError] = useState<string | null>(null);
  const [cameraOpen, setCameraOpen] = useState(false);
  const [cameraLoading, setCameraLoading] = useState(false);

  const videoRef = useRef<HTMLVideoElement | null>(null);
  // QrScanner instance — dynamically imported to avoid SSR issues
  // eslint-disable-next-line @typescript-eslint/no-explicit-any
  const scannerRef = useRef<any | null>(null);

  const { data: profile } = useCampusProfile(address ?? null);
  const { data: merchantProfile, isLoading: isMerchantLoading } = useCampusProfile(
    request?.destination ?? null
  );

  // Cross-university defense-in-depth UI check
  const isCrossUniversity =
    !!request &&
    !!profile &&
    !isMerchantLoading &&
    (!merchantProfile ||
      profile.universityCode?.toUpperCase() !== merchantProfile.universityCode?.toUpperCase());

  const payment = useMutation({
    mutationFn: async () => {
      if (!address || !request)
        throw new Error("Connect a wallet and decode a payment request first.");
      if (isCrossUniversity) throw new Error("Cannot pay merchants outside your university.");
      return request.asset === "CAMP"
        ? executeTransfer(address, request.destination, Number(request.amount))
        : sendNativePayment(request.destination, request.amount, address, signTx);
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ["campus-balance", address] });
      if (request) queryClient.invalidateQueries({ queryKey: ["campus-balance", request.destination] });
      window.dispatchEvent(new Event("campuschain:transaction-submitted"));
    },
  });

  /** Decode the raw payload string into a structured PaymentRequest. */
  const readRequest = (rawPayload = payload) => {
    try {
      setRequest(decodePaymentRequest(rawPayload));
      setError(null);
    } catch (decodeError) {
      setRequest(null);
      setError(
        decodeError instanceof Error
          ? decodeError.message
          : "Could not decode payment request."
      );
    }
  };

  /** Destroy the QrScanner instance and stop all camera tracks. */
  const stopCamera = () => {
    if (scannerRef.current) {
      try {
        scannerRef.current.stop();
        scannerRef.current.destroy();
      } catch {
        // Ignore errors from destroying the scanner
      }
      scannerRef.current = null;
    }
    setCameraOpen(false);
    setCameraLoading(false);
  };

  /** Start live camera scanning using qr-scanner (Nimiq). */
  const startCamera = async () => {
    // Guard: camera already active
    if (cameraOpen || scannerRef.current) return;

    setError(null);
    setCameraLoading(true);

    try {
      // Dynamic import keeps the WASM worker out of the initial bundle
      const QrScannerModule = await import("qr-scanner");
      const QrScanner = QrScannerModule.default;

      // Check if the device has at least one camera
      const hasCam = await QrScanner.hasCamera();
      if (!hasCam) {
        setError("No camera detected on this device. Paste the payment payload instead.");
        setCameraLoading(false);
        return;
      }

      // Wait for React to render the <video> element
      await new Promise<void>((resolve) => setTimeout(resolve, 50));

      const video = videoRef.current;
      if (!video) {
        setError("Camera container not ready. Please try again.");
        setCameraLoading(false);
        return;
      }

      const scanner = new QrScanner(
        video,
        (result: { data: string }) => {
          const value = result.data;
          if (!value) return;

          // Stop scanning and process the result
          stopCamera();
          setPayload(value);
          readRequest(value);
        },
        {
          // Prefer rear camera on mobile (environment), fall back to any available camera
          preferredCamera: "environment",
          // Show a highlighted scan region for better UX
          highlightScanRegion: true,
          highlightCodeOutline: true,
          // Return detailed result objects
          returnDetailedScanResult: true,
        }
      );

      scannerRef.current = scanner;
      setCameraOpen(true);
      setCameraLoading(false);

      await scanner.start();
    } catch (cameraError) {
      stopCamera();
      const msg = cameraError instanceof Error ? cameraError.message : String(cameraError);

      // Provide human-readable messages for common error cases
      if (msg.toLowerCase().includes("permission") || msg.toLowerCase().includes("denied")) {
        setError(
          "Camera permission was denied. Please allow camera access in your browser settings and try again."
        );
      } else if (msg.toLowerCase().includes("notfound") || msg.toLowerCase().includes("no camera")) {
        setError("No camera detected on this device. Paste the payment payload instead.");
      } else if (msg.toLowerCase().includes("notreadable") || msg.toLowerCase().includes("in use")) {
        setError(
          "Camera is already in use by another app. Close other apps using the camera and try again."
        );
      } else {
        setError(`Camera error: ${msg}`);
      }
    }
  };

  // Cleanup scanner on component unmount
  useEffect(() => {
    return () => {
      if (scannerRef.current) {
        try {
          scannerRef.current.stop();
          scannerRef.current.destroy();
        } catch {
          // Ignore cleanup errors
        }
        scannerRef.current = null;
      }
    };
  }, []);

  return (
    <div className="w-full max-w-3xl mx-auto grid md:grid-cols-2 gap-6">
      {/* Left Panel: Scanner */}
      <section className="bg-card border border-border rounded-xl p-6 space-y-4">
        <div className="flex items-center gap-2">
          <ScanLine className="h-5 w-5" />
          <h2 className="font-bold">Scan or paste a payment request</h2>
        </div>
        <p className="text-xs text-muted-foreground">
          Point your camera at a CampusChain QR code, or paste its encoded
          payload below. Works on Chrome (desktop &amp; Android), Safari (iOS
          14.3+), and Firefox.
        </p>

        <div className="grid grid-cols-2 gap-3">
          <button
            id="scan-camera-btn"
            onClick={() => void startCamera()}
            disabled={cameraOpen || cameraLoading}
            className="h-11 border border-border rounded-lg text-sm font-bold inline-flex justify-center items-center gap-2 disabled:opacity-50 cursor-pointer hover:bg-muted/40 transition-colors"
          >
            {cameraLoading ? (
              <Loader2 className="h-4 w-4 animate-spin" />
            ) : (
              <Camera className="h-4 w-4" />
            )}
            {cameraLoading ? "Starting…" : "Use camera"}
          </button>

          <button
            id="read-request-btn"
            onClick={() => readRequest()}
            className="h-11 border border-border rounded-lg text-sm font-bold inline-flex justify-center items-center gap-2 cursor-pointer hover:bg-muted/40 transition-colors"
          >
            <QrCode className="h-4 w-4" />
            Read request
          </button>
        </div>

        {/* Camera viewfinder — always in DOM so the ref is available before startCamera resolves */}
        <div className={cameraOpen ? "space-y-2" : "hidden"}>
          <div className="relative aspect-video w-full overflow-hidden rounded-xl border border-border bg-black">
            <video
              ref={videoRef}
              muted
              playsInline
              className="h-full w-full object-cover"
            />
            {/* Scan hint overlay */}
            <div className="pointer-events-none absolute inset-0 flex items-center justify-center">
              <div className="h-48 w-48 rounded-2xl border-2 border-primary/60 shadow-[0_0_0_9999px_rgba(0,0,0,0.45)]" />
            </div>
          </div>
          <button
            onClick={stopCamera}
            className="w-full h-9 text-xs font-bold border border-border rounded-lg inline-flex items-center justify-center gap-1.5 cursor-pointer hover:bg-destructive/10 hover:text-destructive transition-colors"
          >
            <X className="h-3.5 w-3.5" />
            Stop camera
          </button>
        </div>

        <textarea
          id="payment-payload-input"
          value={payload}
          onChange={(event) => setPayload(event.target.value)}
          placeholder="campuschain:pay?network=testnet&to=G...&asset=CAMP&amount=10"
          rows={6}
          className="w-full rounded-lg border border-border p-3 text-xs font-mono focus:outline-none focus:ring-1 focus:ring-foreground bg-transparent resize-none"
        />

        {error && (
          <div className="flex items-start gap-2 text-xs text-destructive bg-destructive/5 border border-destructive/20 rounded-lg p-3">
            <AlertCircle className="h-3.5 w-3.5 mt-0.5 shrink-0" />
            <span>{error}</span>
          </div>
        )}
      </section>

      {/* Right Panel: Payment confirmation */}
      <section className="bg-card border border-border rounded-xl p-6">
        {request ? (
          <div className="space-y-5">
            <div className="flex items-center gap-2 text-emerald-700">
              <CheckCircle2 className="h-5 w-5" />
              <p className="font-bold">Valid Testnet request</p>
            </div>

            <dl className="text-xs space-y-3">
              <div>
                <dt className="text-muted-foreground">Recipient</dt>
                <dd className="mt-1 font-mono truncate" title={request.destination}>
                  {request.destination}
                </dd>
              </div>
              {merchantProfile && (
                <div>
                  <dt className="text-muted-foreground">Merchant Name</dt>
                  <dd className="mt-1 font-bold text-foreground">{merchantProfile.fullName}</dd>
                </div>
              )}
              <div>
                <dt className="text-muted-foreground">Amount</dt>
                <dd className="mt-1 font-bold text-lg">
                  {request.amount} {request.asset}
                </dd>
              </div>
            </dl>

            {isCrossUniversity && (
              <div className="text-xs text-destructive bg-destructive/5 border border-destructive/20 p-3 rounded-lg font-medium">
                ⚠️ This merchant is not part of your university. Payments to
                cross-university merchants are blocked.
              </div>
            )}

            <button
              id="confirm-payment-btn"
              onClick={() => payment.mutate()}
              disabled={payment.isPending || !address || isCrossUniversity}
              className="h-11 w-full bg-primary text-primary-foreground rounded-lg text-sm font-bold disabled:opacity-50 cursor-pointer transition-colors"
            >
              {payment.isPending
                ? "Confirming payment…"
                : `Pay ${request.amount} ${request.asset}`}
            </button>

            {payment.isSuccess && (
              <p className="text-xs text-emerald-700 break-all bg-emerald-50 border border-emerald-200 p-2 rounded">
                Payment confirmed: {payment.data}
              </p>
            )}
            {payment.isError && (
              <p className="text-xs text-destructive break-words bg-destructive/5 border border-destructive/20 p-2 rounded">
                {payment.error instanceof Error ? payment.error.message : "Payment failed."}
              </p>
            )}
          </div>
        ) : (
          <div className="h-full min-h-48 flex flex-col justify-center items-center text-center text-muted-foreground">
            <QrCode className="h-10 w-10" />
            <p className="mt-3 text-sm font-semibold">No payment request read</p>
            <p className="mt-1 text-xs">
              Decoded recipient, asset, and amount will appear here.
            </p>
          </div>
        )}
      </section>
    </div>
  );
}

export default ScanPay;
