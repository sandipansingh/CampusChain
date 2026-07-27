"use client";

/**
 * ContractEventStreamController
 *
 * Zero-render component that mounts useContractEventStream so the event
 * polling loop can be started from a client boundary (layout.tsx is a server
 * component and cannot call hooks directly).
 *
 * Mounted globally in layout.tsx alongside <TransactionStatusToast />.
 */

import { useContractEventStream } from "@/shared/hooks/useContractEventStream";
import { useWalletStore } from "@/features/wallet/state/useWalletStore";

export function ContractEventStreamController() {
  const address = useWalletStore((s) => s.address);
  useContractEventStream(address);
  return null;
}

export default ContractEventStreamController;
