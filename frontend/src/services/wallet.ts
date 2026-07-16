import { StellarWalletsKit, Networks } from "@creit.tech/stellar-wallets-kit";
import { defaultModules } from "@creit.tech/stellar-wallets-kit/modules/utils";

let isKitInitialized = false;

export function initWalletKit(network: "testnet" | "public" | "standalone") {
  if (typeof window === "undefined" || isKitInitialized) return;

  const networkPassphrase =
    network === "public"
      ? Networks.PUBLIC
      : network === "standalone"
      ? Networks.STANDALONE
      : Networks.TESTNET;

  StellarWalletsKit.init({
    modules: defaultModules(),
    network: networkPassphrase,
  });

  isKitInitialized = true;
}

export async function connectWalletModal(): Promise<string> {
  if (typeof window === "undefined") {
    throw new Error("Cannot connect wallet on the server side");
  }

  const { address } = await StellarWalletsKit.authModal();
  return address;
}

export async function getActiveAddress(): Promise<string | null> {
  try {
    const { address } = await StellarWalletsKit.getAddress();
    return address;
  } catch {
    return null;
  }
}

export async function disconnectWallet(): Promise<void> {
  await StellarWalletsKit.disconnect();
}

export async function signTx(
  xdr: string,
  networkPassphrase: string,
  userAddress: string
): Promise<string> {
  const { signedTxXdr } = await StellarWalletsKit.signTransaction(xdr, {
    networkPassphrase,
    address: userAddress,
  });
  return signedTxXdr;
}
