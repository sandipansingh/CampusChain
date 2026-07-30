"use client";

import { useEffect, useRef, useState } from "react";
import { Camera, CheckCircle2, QrCode, ScanLine } from "lucide-react";
import { useMutation, useQueryClient } from "@tanstack/react-query";
import { useWallet } from "@/shared/stellar/useWallet";
import { executeTransfer } from "@/features/wallet/service/campusToken";
import { sendNativePayment } from "@/shared/stellar/client";
import { signTx } from "@/features/wallet/service/wallet";
import { decodePaymentRequest, PaymentRequest } from "@/features/wallet/service/paymentRequest";

type BarcodeDetectorResult = { rawValue: string };
type BarcodeDetectorInstance = { detect: (source: HTMLVideoElement) => Promise<BarcodeDetectorResult[]> };
type BarcodeDetectorConstructor = new (options: { formats: string[] }) => BarcodeDetectorInstance;

export function ScanPay() {
  const { address } = useWallet();
  const queryClient = useQueryClient();
  const [payload, setPayload] = useState("");
  const [request, setRequest] = useState<PaymentRequest | null>(null);
  const [error, setError] = useState<string | null>(null);
  const [cameraOpen, setCameraOpen] = useState(false);
  const videoRef = useRef<HTMLVideoElement | null>(null);
  const streamRef = useRef<MediaStream | null>(null);

  const payment = useMutation({
    mutationFn: async () => {
      if (!address || !request) throw new Error("Connect a wallet and decode a payment request first.");
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

  const stopCamera = () => {
    streamRef.current?.getTracks().forEach((track) => track.stop());
    streamRef.current = null;
    setCameraOpen(false);
  };

  const readRequest = (rawPayload = payload) => {
    try {
      setRequest(decodePaymentRequest(rawPayload));
      setError(null);
    } catch (decodeError) {
      setRequest(null);
      setError(decodeError instanceof Error ? decodeError.message : "Could not decode payment request.");
    }
  };

  const startCamera = async () => {
    const BarcodeDetector = (window as unknown as { BarcodeDetector?: BarcodeDetectorConstructor }).BarcodeDetector;
    if (!BarcodeDetector || !navigator.mediaDevices?.getUserMedia) {
      setError("Camera QR scanning is not supported by this browser. Paste the request payload instead.");
      return;
    }
    try {
      const stream = await navigator.mediaDevices.getUserMedia({ video: { facingMode: { ideal: "environment" } }, audio: false });
      streamRef.current = stream;
      setCameraOpen(true);
      window.setTimeout(() => {
        if (videoRef.current) {
          videoRef.current.srcObject = stream;
          void videoRef.current.play();
        }
      }, 0);
      const detector = new BarcodeDetector({ formats: ["qr_code"] });
      const poll = window.setInterval(async () => {
        const video = videoRef.current;
        if (!video || video.readyState < HTMLMediaElement.HAVE_CURRENT_DATA) return;
        const codes = await detector.detect(video);
        const value = codes[0]?.rawValue;
        if (!value) return;
        window.clearInterval(poll);
        setPayload(value);
        readRequest(value);
        stopCamera();
      }, 300);
      setError(null);
    } catch (cameraError) {
      stopCamera();
      setError(cameraError instanceof Error ? cameraError.message : "Camera access could not be started.");
    }
  };

  useEffect(() => () => streamRef.current?.getTracks().forEach((track) => track.stop()), []);

  return <div className="w-full max-w-3xl mx-auto grid md:grid-cols-2 gap-6"><section className="bg-card border border-border rounded-xl p-6 space-y-4"><div className="flex items-center gap-2"><ScanLine className="h-5 w-5" /><h2 className="font-bold">Scan or paste a payment request</h2></div><p className="text-xs text-muted-foreground">Scan the generated QR with a supported device camera, or paste its encoded Testnet request. It is validated before any wallet signature.</p><div className="grid grid-cols-2 gap-3"><button onClick={() => void startCamera()} disabled={cameraOpen} className="h-11 border border-border rounded-lg text-sm font-bold inline-flex justify-center items-center gap-2 disabled:opacity-50"><Camera className="h-4 w-4" />Use camera</button><button onClick={() => readRequest()} className="h-11 border border-border rounded-lg text-sm font-bold inline-flex justify-center items-center gap-2"><QrCode className="h-4 w-4" />Read request</button></div>{cameraOpen && <div className="space-y-2"><video ref={videoRef} muted playsInline className="aspect-video w-full rounded-lg border border-border bg-black" /><button onClick={stopCamera} className="text-xs font-bold underline">Stop camera</button></div>}<textarea value={payload} onChange={(event) => setPayload(event.target.value)} placeholder="campuschain:pay?network=testnet&to=G...&asset=CAMP&amount=10" rows={6} className="w-full rounded-lg border border-border p-3 text-xs font-mono focus:outline-none focus:ring-1 focus:ring-foreground" />{error && <p className="text-xs text-destructive">{error}</p>}</section><section className="bg-card border border-border rounded-xl p-6">{request ? <div className="space-y-5"><div className="flex items-center gap-2 text-emerald-700"><CheckCircle2 className="h-5 w-5" /><p className="font-bold">Valid Testnet request</p></div><dl className="text-xs space-y-3"><div><dt className="text-muted-foreground">Recipient</dt><dd className="mt-1 font-mono truncate" title={request.destination}>{request.destination}</dd></div><div><dt className="text-muted-foreground">Amount</dt><dd className="mt-1 font-bold text-lg">{request.amount} {request.asset}</dd></div></dl><button onClick={() => payment.mutate()} disabled={payment.isPending || !address} className="h-11 w-full bg-primary text-primary-foreground rounded-lg text-sm font-bold disabled:opacity-50">{payment.isPending ? "Confirming payment" : `Pay ${request.amount} ${request.asset}`}</button>{payment.isSuccess && <p className="text-xs text-emerald-700 break-all">Payment confirmed: {payment.data}</p>}{payment.isError && <p className="text-xs text-destructive break-words">{payment.error instanceof Error ? payment.error.message : "Payment failed."}</p>}</div> : <div className="h-full min-h-48 flex flex-col justify-center items-center text-center text-muted-foreground"><QrCode className="h-10 w-10" /><p className="mt-3 text-sm font-semibold">No payment request read</p><p className="mt-1 text-xs">Decoded recipient, asset, and amount will appear here.</p></div>}</section></div>;
}
export default ScanPay;
