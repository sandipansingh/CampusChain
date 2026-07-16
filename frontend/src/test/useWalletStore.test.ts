import { describe, it, expect, vi, beforeEach } from "vitest";
import { useWalletStore } from "../state/useWalletStore";

vi.mock("@/services/wallet", () => ({
  initWalletKit: vi.fn(),
  connectWalletModal: vi.fn().mockResolvedValue("GBB2GDQ6NVSZ22MHTMXG7Q5CGF6V2YCYUNMXL6QGZYYJZ6KJV7Y6N3Y44"),
  disconnectWallet: vi.fn().mockResolvedValue(undefined),
}));

describe("useWalletStore", () => {
  beforeEach(() => {
    localStorage.clear();
    // Reset Zustand state manually
    useWalletStore.setState({
      address: null,
      network: "testnet",
      isConnecting: false,
      error: null,
    });
  });

  it("should initialize with default testnet network and no address", () => {
    const store = useWalletStore.getState();
    store.initialize();
    expect(useWalletStore.getState().network).toBe("testnet");
    expect(useWalletStore.getState().address).toBeNull();
  });

  it("should connect wallet and store address in local storage", async () => {
    const store = useWalletStore.getState();
    const address = await store.connectWallet();
    
    expect(address).toBe("GBB2GDQ6NVSZ22MHTMXG7Q5CGF6V2YCYUNMXL6QGZYYJZ6KJV7Y6N3Y44");
    expect(useWalletStore.getState().address).toBe("GBB2GDQ6NVSZ22MHTMXG7Q5CGF6V2YCYUNMXL6QGZYYJZ6KJV7Y6N3Y44");
    expect(localStorage.getItem("campuschain_wallet_address")).toBe("GBB2GDQ6NVSZ22MHTMXG7Q5CGF6V2YCYUNMXL6QGZYYJZ6KJV7Y6N3Y44");
  });

  it("should switch network and store updated value in local storage", () => {
    const store = useWalletStore.getState();
    store.switchNetwork("standalone");
    
    expect(useWalletStore.getState().network).toBe("standalone");
    expect(localStorage.getItem("campuschain_wallet_network")).toBe("standalone");
  });

  it("should clear session data on disconnect", async () => {
    localStorage.setItem("campuschain_wallet_address", "GBB2GDQ6NVSZ22MHTMXG7Q5CGF6V2YCYUNMXL6QGZYYJZ6KJV7Y6N3Y44");
    useWalletStore.setState({ address: "GBB2GDQ6NVSZ22MHTMXG7Q5CGF6V2YCYUNMXL6QGZYYJZ6KJV7Y6N3Y44" });

    const store = useWalletStore.getState();
    await store.disconnectWallet();

    expect(useWalletStore.getState().address).toBeNull();
    expect(localStorage.getItem("campuschain_wallet_address")).toBeNull();
  });
});
