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
  const activeAddr = await getActiveAddress();
  if (activeAddr && activeAddr.toLowerCase() !== userAddress.toLowerCase()) {
    const short = (a: string) => `${a.slice(0, 6)}...${a.slice(-6)}`;
    throw new Error(`Account mismatch: Your wallet is connected as ${short(activeAddr)}, but you are logged into the app as ${short(userAddress)}. Please switch your wallet account to match.`);
  }

  const { signedTxXdr } = await StellarWalletsKit.signTransaction(xdr, {
    networkPassphrase,
    address: userAddress,
  });
  return signedTxXdr;
}
