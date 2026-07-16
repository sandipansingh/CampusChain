import "@testing-library/jest-dom";
import { vi } from "vitest";

// Mock localStorage for Zustand persistence tests
const localStorageMock = (() => {
  let store: Record<string, string> = {};
  return {
    getItem: (key: string) => store[key] || null,
    setItem: (key: string, value: string) => {
      store[key] = value.toString();
    },
    removeItem: (key: string) => {
      delete store[key];
    },
    clear: () => {
      store = {};
    },
  };
})();

Object.defineProperty(window, "localStorage", {
  value: localStorageMock,
});

// Mock @creit.tech/stellar-wallets-kit globally to prevent freighter api compilation errors in vitest
vi.mock("@creit.tech/stellar-wallets-kit", () => {
  return {
    StellarWalletsKit: {
      init: vi.fn(),
      authModal: vi.fn().mockResolvedValue({ address: "GBB2GDQ6NVSZ22MHTMXG7Q5CGF6V2YCYUNMXL6QGZYYJZ6KJV7Y6NXYZ123" }),
      getAddress: vi.fn().mockResolvedValue({ address: "GBB2GDQ6NVSZ22MHTMXG7Q5CGF6V2YCYUNMXL6QGZYYJZ6KJV7Y6NXYZ123" }),
      disconnect: vi.fn().mockResolvedValue(undefined),
      signTransaction: vi.fn().mockResolvedValue({ signedTxXdr: "mocked_signed_xdr" }),
    },
    Networks: {
      TESTNET: "Test SDF Network ; September 2015",
      PUBLIC: "Public Global Stellar Network ; September 2015",
      STANDALONE: "Standalone Network ; Latitude 0.0",
    },
  };
});

vi.mock("@creit.tech/stellar-wallets-kit/modules/utils", () => {
  return {
    defaultModules: vi.fn().mockReturnValue([]),
  };
});
