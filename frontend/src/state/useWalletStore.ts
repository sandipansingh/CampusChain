import { create } from "zustand";
import {
  initWalletKit,
  connectWalletModal,
  disconnectWallet as sdkDisconnectWallet,
} from "@/services/wallet";

export type NetworkType = "testnet" | "public" | "standalone";

interface WalletState {
  address: string | null;
  network: NetworkType;
  isConnecting: boolean;
  error: string | null;
  initialize: () => void;
  connectWallet: () => Promise<string | null>;
  disconnectWallet: () => Promise<void>;
  switchNetwork: (newNetwork: NetworkType) => void;
}

export const useWalletStore = create<WalletState>((set, get) => ({
  address: null,
  network: "testnet",
  isConnecting: false,
  error: null,

  initialize: () => {
    if (typeof window === "undefined") return;
    const storedAddress = localStorage.getItem("campuschain_wallet_address");
    const storedNetwork = localStorage.getItem("campuschain_wallet_network") as NetworkType;
    const currentNetwork = storedNetwork || "testnet";

    initWalletKit(currentNetwork);

    set({
      address: storedAddress || null,
      network: currentNetwork,
    });
  },

  connectWallet: async () => {
    set({ isConnecting: true, error: null });
    try {
      initWalletKit(get().network);
      const address = await connectWalletModal();
      localStorage.setItem("campuschain_wallet_address", address);
      set({ address, isConnecting: false });
      return address;
    } catch (err) {
      const errMsg = err instanceof Error ? err.message : "User closed connection dialog";
      set({ error: errMsg, isConnecting: false });
      return null;
    }
  },

  disconnectWallet: async () => {
    try {
      await sdkDisconnectWallet();
    } catch {
      // Ignore disconnect errors
    }
    localStorage.removeItem("campuschain_wallet_address");
    set({ address: null, error: null });
  },

  switchNetwork: (newNetwork: NetworkType) => {
    localStorage.setItem("campuschain_wallet_network", newNetwork);
    initWalletKit(newNetwork);
    set({ network: newNetwork });
  },
}));
