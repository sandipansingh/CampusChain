import {
  rpc,
  Horizon,
  TransactionBuilder,
  Contract,
  nativeToScVal,
  scValToNative,
  Transaction,
  xdr,
  Account,
  Operation,
  Asset,
} from "@stellar/stellar-sdk";

import { useTransactionStatusStore, mapTransactionError } from "../hooks/useTransactionStatus";
import { txMonitor, captureError } from "../lib/observability";

export const NEXT_PUBLIC_STELLAR_RPC_URL =
  process.env.NEXT_PUBLIC_STELLAR_RPC_URL || "https://soroban-testnet.stellar.org";
export const NEXT_PUBLIC_STELLAR_PASSPHRASE =
  process.env.NEXT_PUBLIC_STELLAR_PASSPHRASE || "Test SDF Network ; September 2015";
export const NEXT_PUBLIC_CAMPUS_IDENTITY_CONTRACT_ID =
  process.env.NEXT_PUBLIC_CAMPUS_IDENTITY_CONTRACT_ID || "CBSP6PGVKP3OHV7CHFIVNYA6GA3WQ2VGWMGW4YTG7IF6FBEKUVFKNH6Q";
export const NEXT_PUBLIC_CAMPUS_TOKEN_CONTRACT_ID =
  process.env.NEXT_PUBLIC_CAMPUS_TOKEN_CONTRACT_ID || "CCNX6UK6XNBXG63I75R5EVRHXQKD23ECUUJSH6NPV32OWJWJL72ZQCP2";
export const NEXT_PUBLIC_CAMPUS_SERVICE_CONTRACT_ID =
  process.env.NEXT_PUBLIC_CAMPUS_SERVICE_CONTRACT_ID || "CATHDHIUADXXENVYN7Z2ABSERDYUGK7OQMWFODBW7I66HS43WSUZNGLL";
export const NEXT_PUBLIC_CAMPUS_ADMIN_ADDRESS =
  process.env.NEXT_PUBLIC_CAMPUS_ADMIN_ADDRESS || "GC6BMAHRKAWHPPI6T67QZV2CQIWG7DVJT47ZNZQUYF3L625G3OPNBBSQ";

export function getRpcServer(): rpc.Server {
  return new rpc.Server(NEXT_PUBLIC_STELLAR_RPC_URL);
}

export async function readContract(
  contractId: string,
  methodName: string,
  args: xdr.ScVal[] = [],
  sourceAddress?: string
): Promise<unknown> {
  const server = getRpcServer();
  const srcAddress = sourceAddress || "GCFIRY65OQE7DFP5KLNS2PF2LVZMUZYJX4OZIEQ36N2IQANUB5XVYOJR";
  const sourceAccount = new Account(srcAddress, "0");

  const contract = new Contract(contractId);
  const operation = contract.call(methodName, ...args);

  const tx = new TransactionBuilder(sourceAccount, {
    fee: "100",
    networkPassphrase: NEXT_PUBLIC_STELLAR_PASSPHRASE,
  })
    .addOperation(operation)
    .setTimeout(180)
    .build();

  const sim = await server.simulateTransaction(tx);

  if ("error" in sim) {
    throw new Error(`Simulation error for ${methodName}: ${sim.error}`);
  }

  const successSim = sim as rpc.Api.SimulateTransactionSuccessResponse;
  const retval = successSim.result?.retval;
  if (!retval) {
    return null;
  }

  return scValToNative(retval);
}

function getActionLabel(methodName: string): string {
  switch (methodName) {
    case "transfer":
      return "Send CAMP Tokens";
    case "buy_camp_tokens":
      return "Buy CAMP Tokens";
    case "claim_faucet":
      return "Claim Testnet CAMP Faucet";
    case "create_scholarship":
      return "Create Scholarship Program";
    case "admin_approve_scholarship":
      return "Approve Scholarship Program";
    case "admin_reject_scholarship":
      return "Reject Scholarship Program";
    case "apply_scholarship":
      return "Apply for Scholarship";
    case "decide_application":
      return "Review Scholarship Application";
    case "approve":
      return "Approve Contract Allowance";
    default:
      return methodName
        .split("_")
        .map((word) => word.charAt(0).toUpperCase() + word.slice(1))
        .join(" ");
  }
}

export async function invokeContractMethod(
  contractId: string,
  methodName: string,
  args: xdr.ScVal[] = [],
  userAddress: string,
  signTxFn: (xdr: string, passphrase: string, address: string) => Promise<string>
): Promise<string> {
  const store = useTransactionStatusStore.getState();
  const label = getActionLabel(methodName);

  const run = async (): Promise<string> => {
    store.setPending(label, run);
    txMonitor.record({ action: methodName, status: "pending", contractId, walletAddress: userAddress });
    try {
      const server = getRpcServer();
      const sourceAccount = await server.getAccount(userAddress);

      const contract = new Contract(contractId);
      const operation = contract.call(methodName, ...args);

      let tx = new TransactionBuilder(sourceAccount, {
        fee: "1000",
        networkPassphrase: NEXT_PUBLIC_STELLAR_PASSPHRASE,
      })
        .addOperation(operation)
        .setTimeout(300)
        .build();

      tx = await server.prepareTransaction(tx);

      const signedXdr = await signTxFn(tx.toXDR(), NEXT_PUBLIC_STELLAR_PASSPHRASE, userAddress);

      store.setProcessing();
      txMonitor.record({ action: methodName, status: "processing", contractId, walletAddress: userAddress });

      const submission = await server.sendTransaction(
        new Transaction(signedXdr, NEXT_PUBLIC_STELLAR_PASSPHRASE)
      );

      if (submission.status === "ERROR") {
        const errorXdr = submission.errorResult ? submission.errorResult.toXDR("base64") : "Unknown XDR";
        throw new Error(`Transaction submission error: ${errorXdr}`);
      }

      await pollTransactionStatus(submission.hash);

      store.setConfirmed(submission.hash);
      txMonitor.record({ action: methodName, status: "confirmed", contractId, walletAddress: userAddress, txHash: submission.hash });
      return submission.hash;
    } catch (err: unknown) {
      const mapped = mapTransactionError(err);
      store.setFailed(mapped);
      txMonitor.record({ action: methodName, status: "failed", contractId, walletAddress: userAddress, errorMessage: mapped });
      captureError(err, { action: methodName, contract: contractId, walletAddress: userAddress });
      throw err;
    }
  };

  return run();
}

export async function sendNativePayment(
  xlmDestination: string,
  xlmAmount: string,
  userAddress: string,
  signTxFn: (xdr: string, passphrase: string, address: string) => Promise<string>
): Promise<string> {
  const store = useTransactionStatusStore.getState();
  const label = `Transfer XLM payment`;

  const run = async (): Promise<string> => {
    store.setPending(label, run);
    txMonitor.record({ action: "xlm_payment", status: "pending", walletAddress: userAddress });
    try {
      const horizon = new Horizon.Server("https://horizon-testnet.stellar.org");
      const sourceAccount = await horizon.loadAccount(userAddress);

      const paymentOp = Operation.payment({
        destination: xlmDestination,
        asset: Asset.native(),
        amount: xlmAmount,
      });

      const tx = new TransactionBuilder(sourceAccount, {
        fee: "1000",
        networkPassphrase: NEXT_PUBLIC_STELLAR_PASSPHRASE,
      })
        .addOperation(paymentOp)
        .setTimeout(300)
        .build();

      const signedXdr = await signTxFn(tx.toXDR(), NEXT_PUBLIC_STELLAR_PASSPHRASE, userAddress);

      store.setProcessing();
      txMonitor.record({ action: "xlm_payment", status: "processing", walletAddress: userAddress });

      const submission = await horizon.submitTransaction(
        new Transaction(signedXdr, NEXT_PUBLIC_STELLAR_PASSPHRASE)
      );

      if (!submission.successful) {
        throw new Error(`Payment failed: ${JSON.stringify(submission)}`);
      }

      store.setConfirmed(submission.hash);
      txMonitor.record({ action: "xlm_payment", status: "confirmed", walletAddress: userAddress, txHash: submission.hash });
      return submission.hash;
    } catch (err: unknown) {
      const mapped = mapTransactionError(err);
      store.setFailed(mapped);
      txMonitor.record({ action: "xlm_payment", status: "failed", walletAddress: userAddress, errorMessage: mapped });
      captureError(err, { action: "xlm_payment", contract: "horizon", walletAddress: userAddress });
      throw err;
    }
  };

  return run();
}

export async function pollTransactionStatus(
  hash: string
): Promise<rpc.Api.GetTransactionResponse> {
  const server = getRpcServer();
  for (let i = 0; i < 40; i++) {
    const status = await server.getTransaction(hash);
    if (status.status === "SUCCESS") {
      return status;
    }
    if (status.status === "FAILED") {
      const errMsg = `Transaction execution failed: ${JSON.stringify(status.resultXdr)}`;
      throw new Error(errMsg);
    }
    // Wait 1.5 seconds between polls
    await new Promise((resolve) => setTimeout(resolve, 1500));
  }
  throw new Error("Transaction verification timed out");
}

// Helpers for ScVal creation
export function addressToScVal(address: string): xdr.ScVal {
  return nativeToScVal(address, { type: "address" });
}

export function i128ToScVal(value: string | number | bigint): xdr.ScVal {
  return nativeToScVal(value.toString(), { type: "i128" });
}

export function stringToScVal(value: string): xdr.ScVal {
  return nativeToScVal(value, { type: "string" });
}

export function u32ToScVal(value: number): xdr.ScVal {
  return nativeToScVal(value, { type: "u32" });
}

export function u64ToScVal(value: number): xdr.ScVal {
  return nativeToScVal(value, { type: "u64" });
}

export async function getEventsSafe(
  server: rpc.Server,
  options: {
    startLedger?: number;
    cursor?: string;
    filters: unknown[];
    limit?: number;
  }
): Promise<unknown> {
  try {
    return await server.getEvents(options as never);
  } catch (err: unknown) {
    const msg = err instanceof Error ? err.message : String(err);
    const match = msg.match(/oldest ledger\s*\(?(\d+)\)?/i);
    if (match && match[1]) {
      const oldestLedger = Number(match[1]);
      return await server.getEvents({
        ...options,
        startLedger: oldestLedger,
      } as never);
    }
    throw err;
  }
}
