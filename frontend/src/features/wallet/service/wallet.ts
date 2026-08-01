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
  let activeAddr: string | null = null;
  try {
    const res = await StellarWalletsKit.getAddress();
    activeAddr = res.address;
  } catch {
    throw new Error("Unable to retrieve active wallet account. Please ensure your wallet extension is unlocked and connected.");
  }

  if (activeAddr && activeAddr.toLowerCase() !== userAddress.toLowerCase()) {
    const short = (a: string) => `${a.slice(0, 6)}...${a.slice(-6)}`;
    throw new Error(`Account mismatch: Your wallet is connected as ${short(activeAddr)}, but you are logged into the app as ${short(userAddress)}. Please switch your wallet account to match.`);
  }

  try {
    const net = await StellarWalletsKit.getNetwork();
    if (net && net.networkPassphrase && net.networkPassphrase !== networkPassphrase) {
      const getNetName = (phrase: string) => {
        if (phrase === "Test SDF Network ; September 2015") return "Testnet";
        if (phrase === "Public Global Stellar Network ; September 2015") return "Public Network";
        if (phrase === "Standalone Network ; February 2017") return "Standalone (Local)";
        return "Unknown Network";
      };
      throw new Error(`Network mismatch: Your wallet is connected to ${getNetName(net.networkPassphrase)}, but the app is configured for ${getNetName(networkPassphrase)}. Please switch your wallet network.`);
    }
  } catch (err) {
    if (err instanceof Error && err.message.includes("Network mismatch")) {
      throw err;
    }
  }

  const { signedTxXdr } = await StellarWalletsKit.signTransaction(xdr, {
    networkPassphrase,
    address: userAddress,
  });
  return signedTxXdr;
}
