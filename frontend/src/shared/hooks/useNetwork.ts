import { useWalletStore } from "@/features/wallet/state/useWalletStore";

export function useNetwork() {
  const network = useWalletStore((state) => state.network);
  const switchNetwork = useWalletStore((state) => state.switchNetwork);

  return {
    network,
    switchNetwork,
    isTestnet: network === "testnet",
    isStandalone: network === "standalone",
    isPublic: network === "public",
  };
}
