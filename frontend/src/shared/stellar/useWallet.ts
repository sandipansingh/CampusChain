import { useWalletStore } from "@/features/wallet/state/useWalletStore";

export function useWallet() {
  const address = useWalletStore((state) => state.address);
  const isConnected = useWalletStore((state) => state.isConnected);
  const isConnecting = useWalletStore((state) => state.isConnecting);
  const wrongNetwork = useWalletStore((state) => state.wrongNetwork);
  const error = useWalletStore((state) => state.error);
  const connect = useWalletStore((state) => state.connectWallet);
  const disconnect = useWalletStore((state) => state.disconnectWallet);
  const initialize = useWalletStore((state) => state.initialize);

  return {
    address,
    isConnected,
    isConnecting,
    wrongNetwork,
    error,
    connect,
    disconnect,
    initialize,
  };
}
export type UseWalletReturn = ReturnType<typeof useWallet>;
