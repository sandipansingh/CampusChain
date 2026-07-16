# CampusChain Frontend Service & API Hook Specifications

This document outlines the API layer, React Query hooks, and Zustand store layouts that link our Next.js frontend application with the Stellar/Soroban ledger.

---

## 1. Zustand Global State

We use Zustand to manage transient, local states such as active wallet address, current network settings, and active processing transactions.

### Store Schema: `useWalletStore`
```typescript
interface WalletState {
  address: string | null;
  network: "testnet" | "public" | "standalone";
  isConnecting: boolean;
  error: string | null;
  connectWallet: (walletType: string) => Promise<void>;
  disconnectWallet: () => void;
  switchNetwork: (newNetwork: "testnet" | "public" | "standalone") => void;
}
```

### Store Schema: `useTransactionStore`
```typescript
interface Transaction {
  hash: string;
  status: "pending" | "processing" | "confirmed" | "failed";
  method: string;
  timestamp: number;
  explorerUrl?: string;
  errorMessage?: string;
  retryAction?: () => Promise<void>;
}

interface TransactionState {
  transactions: Transaction[];
  addTransaction: (tx: Transaction) => void;
  updateTransaction: (hash: string, updates: Partial<Transaction>) => void;
  clearTransactions: () => void;
}
```

---

## 2. React Query Hooks

We use TanStack React Query to cache and manage read-only smart contract operations.

### Hook: `useCampusBalance(address: string)`
* **Method**: Calls `CampusToken.balance(id: Address)`
* **Cache Key**: `['campus-balance', address]`
* **Fetch Function**: Calls contract client library.

### Hook: `useEscrowAgreement(escrowId: string)`
* **Method**: Calls `CampusService.get_escrow(id: u64)`
* **Cache Key**: `['campus-escrow', escrowId]`

### Hook: `useEventTickets(eventId: string)`
* **Method**: Calls `CampusService.get_event_tickets(event_id: u64)`
* **Cache Key**: `['campus-event-tickets', eventId]`

---

## 3. Stellar/Soroban Service Layer

A service layer abstraction hides XDR serialization, fee estimation, and polling from the visual component tree.

### File: `frontend/src/services/contracts.ts`

#### Function: `submitSorobanTransaction`
* **Purpose**: Submits a signed transaction, polls the RPC node for confirmation, and reports status.
* **Flow**:
  1. Build transaction using transaction builder.
  2. Estimate resource limits and fees.
  3. Send to wallet interface (e.g. Freighter) for signature.
  4. Submit to RPC node via `rpc.sendTransaction()`.
  5. Poll `rpc.getTransaction()` at 1-2 second intervals until completion.
  6. Return transaction metadata, hash, and status.

```typescript
export async function submitSorobanTransaction(
  contractId: string,
  methodName: string,
  args: any[],
  sourceKey: string
): Promise<TransactionResult>;
```
