export type PaymentAsset = "CAMP" | "XLM";

export interface PaymentRequest {
  network: "testnet";
  destination: string;
  asset: PaymentAsset;
  amount: string;
}

const PREFIX = "campuschain:pay";
const PUBLIC_KEY = /^G[A-Z2-7]{55}$/;

export function encodePaymentRequest(request: PaymentRequest): string {
  validatePaymentRequest(request);
  const query = new URLSearchParams({ network: request.network, to: request.destination, asset: request.asset, amount: request.amount });
  return `${PREFIX}?${query.toString()}`;
}

export function decodePaymentRequest(payload: string): PaymentRequest {
  const url = new URL(payload.trim());
  if (url.protocol !== "campuschain:" || url.pathname !== "pay") throw new Error("This is not a CampusChain payment request.");
  const request: PaymentRequest = { network: url.searchParams.get("network") as "testnet", destination: url.searchParams.get("to") ?? "", asset: url.searchParams.get("asset") as PaymentAsset, amount: url.searchParams.get("amount") ?? "" };
  validatePaymentRequest(request);
  return request;
}

export function validatePaymentRequest(request: PaymentRequest) {
  if (request.network !== "testnet") throw new Error("Only Stellar Testnet payment requests are supported.");
  if (!PUBLIC_KEY.test(request.destination)) throw new Error("The payment request contains an invalid Stellar destination.");
  if (request.asset !== "CAMP" && request.asset !== "XLM") throw new Error("The payment request contains an unsupported asset.");
  const amount = Number(request.amount);
  if (!Number.isFinite(amount) || amount <= 0 || !/^\d+(\.\d{1,7})?$/.test(request.amount)) throw new Error("The payment amount must be a positive value with at most seven decimals.");
}
