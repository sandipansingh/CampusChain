import { create } from "zustand";
import { StellarWalletsKit, KitEventType, Networks } from "@creit.tech/stellar-wallets-kit";
import { defaultModules } from "@creit.tech/stellar-wallets-kit/modules/utils";
import { NEXT_PUBLIC_STELLAR_PASSPHRASE } from "@/shared/stellar/client";

export type NetworkType = "testnet" | "public" | "standalone";

interface WalletState {
  address: string | null;
  network: NetworkType;
  networkPassphrase: string | null;
  isConnecting: boolean;
  isConnected: boolean;
  wrongNetwork: boolean;
  error: string | null;
  selectedWalletId: string | null;
  
  initialize: () => void;
  connectWallet: () => Promise<string | null>;
  disconnectWallet: () => Promise<void>;
  switchNetwork: (newNetwork: NetworkType) => void;
}

export const useWalletStore = create<WalletState>((set, get) => {
  let unsubscribeState: (() => void) | null = null;
  let unsubscribeDisconnect: (() => void) | null = null;
  let unsubscribeWalletSelected: (() => void) | null = null;

  // Human-readable error mapper
  const mapWalletError = (err: unknown): string => {
    if (!err) return "An unknown error occurred.";
    const errMsg = err instanceof Error ? err.message : String(err);

    if (errMsg.includes("User closed connection") || errMsg.includes("closed connection") || errMsg.includes("Modal closed")) {
      return "Wallet connection was canceled by user.";
    }
    if (errMsg.includes("User rejected") || errMsg.includes("rejected signature") || errMsg.includes("declined")) {
      return "Transaction signature was rejected by user.";
    }
    if (errMsg.includes("not installed") || errMsg.includes("missing extension") || errMsg.includes("install")) {
      return "The selected wallet extension is not installed. Please install it and try again.";
    }
    if (errMsg.includes("wrong network") || errMsg.includes("Network mismatch")) {
      return "Wallet is connected to the wrong network. Please switch to Stellar Testnet.";
    }
    if (errMsg.includes("insufficient balance") || errMsg.includes("underfunded")) {
      return "Insufficient XLM balance to cover transaction fees. Please fund your account.";
    }
    if (errMsg.includes("Simulation error") || errMsg.includes("Host function failed")) {
      return "Transaction simulation failed. Check contract constraints or parameters.";
    }
    return errMsg;
  };

  const setupListeners = () => {
    if (typeof window === "undefined") return;

    // Clean up previous listeners
    if (unsubscribeState) unsubscribeState();
    if (unsubscribeDisconnect) unsubscribeDisconnect();
    if (unsubscribeWalletSelected) unsubscribeWalletSelected();

    // Subscribe to state updates (fires when address/network change in the wallet extension)
    unsubscribeState = StellarWalletsKit.on(KitEventType.STATE_UPDATED, (event) => {
      const address = event.payload.address || null;
      const networkPassphrase = event.payload.networkPassphrase || null;
      
      const expectedPassphrase = NEXT_PUBLIC_STELLAR_PASSPHRASE;
      const wrongNetwork = !!address && networkPassphrase !== expectedPassphrase;

      if (address) {
        localStorage.setItem("campuschain_wallet_address", address);
      }

      const isExpectedTestnet = NEXT_PUBLIC_STELLAR_PASSPHRASE === "Test SDF Network ; September 2015";
      const networkName = isExpectedTestnet ? "Testnet" : "the configured network";

      set({
        address,
        networkPassphrase,
        isConnected: !!address,
        wrongNetwork,
        error: wrongNetwork ? `Wrong Network: Please switch your wallet to ${networkName}.` : null,
      });
    });

    // Subscribe to select wallet
    unsubscribeWalletSelected = StellarWalletsKit.on(KitEventType.WALLET_SELECTED, (event) => {
      const walletId = event.payload.id || null;
      if (walletId) {
        localStorage.setItem("campuschain_selected_wallet_id", walletId);
        set({ selectedWalletId: walletId });
      }
    });

    // Subscribe to disconnect
    unsubscribeDisconnect = StellarWalletsKit.on(KitEventType.DISCONNECT, () => {
      localStorage.removeItem("campuschain_wallet_address");
      localStorage.removeItem("campuschain_selected_wallet_id");
      set({
        address: null,
        isConnected: false,
        wrongNetwork: false,
        error: null,
        selectedWalletId: null,
        networkPassphrase: null,
      });
    });
  };

  return {
    address: null,
    network: "testnet",
    networkPassphrase: null,
    isConnecting: false,
    isConnected: false,
    wrongNetwork: false,
    error: null,
    selectedWalletId: null,

    initialize: () => {
      if (typeof window === "undefined") return;

      // Initialize the Kit with the configured network passphrase
      StellarWalletsKit.init({
        modules: defaultModules(),
        network: NEXT_PUBLIC_STELLAR_PASSPHRASE as Networks,
      });

      setupListeners();

      const storedAddress = localStorage.getItem("campuschain_wallet_address");
      const storedWalletId = localStorage.getItem("campuschain_selected_wallet_id");

      if (storedWalletId && storedAddress) {
        try {
          StellarWalletsKit.setWallet(storedWalletId);
          
          // Re-fetch connection status programmatically to ensure session is valid
          StellarWalletsKit.getAddress().then(({ address }) => {
            if (address) {
              set({
                address,
                isConnected: true,
                selectedWalletId: storedWalletId,
              });
              // Fetch connected network passphrase
              StellarWalletsKit.getNetwork().then((networkInfo) => {
                const passphrase = networkInfo.networkPassphrase;
                const wrongNetwork = passphrase !== NEXT_PUBLIC_STELLAR_PASSPHRASE;
                const isExpectedTestnet = NEXT_PUBLIC_STELLAR_PASSPHRASE === "Test SDF Network ; September 2015";
                const networkName = isExpectedTestnet ? "Testnet" : "the configured network";
                set({
                  networkPassphrase: passphrase,
                  wrongNetwork,
                  error: wrongNetwork ? `Wrong Network: Please switch your wallet to ${networkName}.` : null,
                });
              }).catch(() => {});
            }
          }).catch(() => {
            // Stale connection, clear
            localStorage.removeItem("campuschain_wallet_address");
            localStorage.removeItem("campuschain_selected_wallet_id");
          });
        } catch {
          // Ignore restore error
        }
      }
    },

    connectWallet: async () => {
      set({ isConnecting: true, error: null });
      try {
        const { address } = await StellarWalletsKit.authModal();
        if (!address) {
          throw new Error("No address returned from wallet kit authModal.");
        }

        const networkInfo = await StellarWalletsKit.getNetwork();
        const passphrase = networkInfo.networkPassphrase;
        const expectedPassphrase = NEXT_PUBLIC_STELLAR_PASSPHRASE;
        const wrongNetwork = passphrase !== expectedPassphrase;

        localStorage.setItem("campuschain_wallet_address", address);

        const isExpectedTestnet = NEXT_PUBLIC_STELLAR_PASSPHRASE === "Test SDF Network ; September 2015";
        const networkName = isExpectedTestnet ? "Testnet" : "the configured network";

        set({
          address,
          isConnected: true,
          networkPassphrase: passphrase,
          wrongNetwork,
          isConnecting: false,
          error: wrongNetwork ? `Wrong Network: Please switch your wallet to ${networkName}.` : null,
        });

        return address;
      } catch (err) {
        const userFriendlyError = mapWalletError(err);
        set({ error: userFriendlyError, isConnecting: false });
        return null;
      }
    },

    disconnectWallet: async () => {
      try {
        await StellarWalletsKit.disconnect();
      } catch {
        // Ignore disconnect errors
      }
      localStorage.removeItem("campuschain_wallet_address");
      localStorage.removeItem("campuschain_selected_wallet_id");
      set({
        address: null,
        isConnected: false,
        wrongNetwork: false,
        error: null,
        selectedWalletId: null,
        networkPassphrase: null,
      });
    },

    switchNetwork: (newNetwork: NetworkType) => {
      localStorage.setItem("campuschain_wallet_network", newNetwork);
      const passphrase = newNetwork === "public"
        ? "Public Global Stellar Network ; September 2015"
        : newNetwork === "standalone"
        ? "Standalone Network ; February 2017"
        : "Test SDF Network ; September 2015";
        
      const networksMap = {
        testnet: Networks.TESTNET,
        public: Networks.PUBLIC,
        standalone: Networks.STANDALONE,
      };
      
      try {
        StellarWalletsKit.setNetwork(networksMap[newNetwork]);
      } catch {
        // Fallback for modules that don't support dynamic switching
      }
      
      set({ network: newNetwork, networkPassphrase: passphrase });
      
      const address = get().address;
      const wrongNetwork = !!address && passphrase !== NEXT_PUBLIC_STELLAR_PASSPHRASE;
      const isExpectedTestnet = NEXT_PUBLIC_STELLAR_PASSPHRASE === "Test SDF Network ; September 2015";
      const networkName = isExpectedTestnet ? "Testnet" : "the configured network";
      set({
        wrongNetwork,
        error: wrongNetwork ? `Wrong Network: Please switch your wallet to ${networkName}.` : null,
      });
    },
  };
});
