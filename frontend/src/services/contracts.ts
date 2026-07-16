import {
  rpc,
  TransactionBuilder,
  Contract,
  nativeToScVal,
  scValToNative,
  Transaction,
  xdr,
} from "@stellar/stellar-sdk";
import { signTx } from "@/services/wallet";
import { logger } from "@/services/logger";

export const NEXT_PUBLIC_STELLAR_RPC_URL =
  process.env.NEXT_PUBLIC_STELLAR_RPC_URL || "https://soroban-testnet.stellar.org";
export const NEXT_PUBLIC_STELLAR_PASSPHRASE =
  process.env.NEXT_PUBLIC_STELLAR_PASSPHRASE || "Test SDF Network ; September 2015";
export const NEXT_PUBLIC_CAMPUS_TOKEN_CONTRACT_ID =
  process.env.NEXT_PUBLIC_CAMPUS_TOKEN_CONTRACT_ID || "CDP3PGBJ3E7D3F6JNE27PDUWUX2VGDLOMFGBQZ2L24LGTDTKCS5G6AMP";
export const NEXT_PUBLIC_CAMPUS_SERVICE_CONTRACT_ID =
  process.env.NEXT_PUBLIC_CAMPUS_SERVICE_CONTRACT_ID || "CA5W44S3S7WTRHPHHY5W7RPHHY5W7RPHHY5W7RPHHY5W7RPHHY5W7RPH";

export function getRpcServer(): rpc.Server {
  return new rpc.Server(NEXT_PUBLIC_STELLAR_RPC_URL);
}

export async function readContract(
  contractId: string,
  methodName: string,
  args: xdr.ScVal[] = []
): Promise<unknown> {
  const server = getRpcServer();

  // Use a generic valid public key to serve as source account during simulation
  const dummyPublicKey = "GDQ6NVSZ22MHTMXG7Q5CGF6V2YCYUNMXL6QGZYYJZ6KJV7Y6N3Y44444";
  const sourceAccount = await server.getAccount(dummyPublicKey);

  const contract = new Contract(contractId);
  const operation = contract.call(methodName, ...args);

  const tx = new TransactionBuilder(sourceAccount, {
    fee: "100",
    networkPassphrase: NEXT_PUBLIC_STELLAR_PASSPHRASE,
  })
    .addOperation(operation)
    .setTimeout(30)
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

export async function invokeContractMethod(
  contractId: string,
  methodName: string,
  args: xdr.ScVal[] = [],
  userAddress: string
): Promise<string> {
  const server = getRpcServer();
  const sourceAccount = await server.getAccount(userAddress);

  const contract = new Contract(contractId);
  const operation = contract.call(methodName, ...args);

  let tx = new TransactionBuilder(sourceAccount, {
    fee: "1000",
    networkPassphrase: NEXT_PUBLIC_STELLAR_PASSPHRASE,
  })
    .addOperation(operation)
    .setTimeout(60)
    .build();

  // Prepare transaction (simulates and estimates resource limits/fees)
  tx = await server.prepareTransaction(tx);

  // Sign transaction XDR via Freighter or other wallet
  const signedXdr = await signTx(tx.toXDR(), NEXT_PUBLIC_STELLAR_PASSPHRASE, userAddress);

  // Submit signed transaction envelope
  const submission = await server.sendTransaction(
    new Transaction(signedXdr, NEXT_PUBLIC_STELLAR_PASSPHRASE)
  );

  if (submission.status === "ERROR") {
    const errorXdr = submission.errorResult ? submission.errorResult.toXDR("base64") : "Unknown XDR";
    throw new Error(`Transaction submission error: ${errorXdr}`);
  }

  return submission.hash;
}

export async function pollTransactionStatus(
  hash: string
): Promise<rpc.Api.GetTransactionResponse> {
  logger.info(`Polling transaction status`, { hash });
  const server = getRpcServer();
  for (let i = 0; i < 40; i++) {
    const status = await server.getTransaction(hash);
    if (status.status === "SUCCESS") {
      logger.info(`Transaction confirmed on-chain`, { hash });
      return status;
    }
    if (status.status === "FAILED") {
      const errMsg = `Transaction execution failed: ${JSON.stringify(status.resultXdr)}`;
      logger.error(errMsg, null, { hash });
      throw new Error(errMsg);
    }
    // Wait 1.5 seconds between polls
    await new Promise((resolve) => setTimeout(resolve, 1500));
  }
  logger.warn(`Transaction verification timed out`, { hash });
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
