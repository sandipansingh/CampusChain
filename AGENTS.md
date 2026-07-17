# CampusChain — Agent Instructions

## Commands

```
cargo build --target wasm32-unknown-unknown --release  # builds contracts to WASM
cargo test                                              # runs all smart contract tests
cargo fmt                                               # formats Rust code
cargo clippy                                            # lints Rust code
cd frontend && npm run dev                              # starts Next.js dev server
cd frontend && npm run lint                             # lints TypeScript
cd frontend && npm run test                             # runs vitest
cd frontend && npm run build                            # production build check
CAMPUSCHAIN_ADMIN_KEY=<secret> ./scripts/deploy.sh      # deploys both contracts to testnet
graphify query "<question>"                             # ask codebase questions
graphify update .                                       # rebuild knowledge graph after changes
```

## Architecture

Two Soroban smart contracts on Stellar testnet, one Next.js 15 frontend:

| Package | Dir | Purpose |
|---------|-----|---------|
| CampusToken | `contracts/campus-token/` | Fungible CAMP token (7 decimals), RBAC, faucet |
| CampusService | `contracts/campus-service/` | Escrow, events, university registry, token purchase |
| Frontend | `frontend/` | Next.js 15 App Router, Zustand state, TanStack React Query v5 |

**Contract dependency**: CampusService imports CampusToken's WASM via `soroban_sdk::contractimport!` — to build CampusService, `campus_token.wasm` must exist in `contracts/campus-service/wasm/`. Build both contracts together: `cargo build --target wasm32-unknown-unknown --release`.

## Critical: Stellar transaction routing

**Contract calls → Soroban RPC** (`rpc.Server`). Use `prepareTransaction` (simulates + estimates resources). Works with `invokeHostFunction`.

**Native XLM payments → Horizon API** (`Horizon.Server`). Do NOT use Soroban RPC for classic `Operation.payment()`. Soroban RPC's `prepareTransaction`/`sendTransaction` reject classic ops. Use `horizon.loadAccount()` and `horizon.submitTransaction()` for native XLM transfers.

**Can't mix ops in one tx**. Classic Payment and Soroban invoke can't be in the same transaction envelope when signed by Freighter. Split into two sequential transactions.

## Env Vars

`.env.local` is gitignored. Required vars for frontend:

```
NEXT_PUBLIC_STELLAR_RPC_URL     → Soroban RPC endpoint
NEXT_PUBLIC_STELLAR_PASSPHRASE  → "Test SDF Network ; September 2015"
NEXT_PUBLIC_CAMPUS_TOKEN_CONTRACT_ID     → C... contract ID
NEXT_PUBLIC_CAMPUS_SERVICE_CONTRACT_ID   → C... contract ID
NEXT_PUBLIC_CAMPUS_ADMIN_ADDRESS         → G... stellar address (for XLM purchases)
```

All four contract/address constants are in `frontend/src/services/contracts.ts` with fallback defaults matching testnet deploys. The deploy script auto-writes `.env.local` with new contract IDs.

## Commit conventions

- Conventional Commits only: `feat`, `fix`, `docs`, `style`, `refactor`, `perf`, `test`, `build`, `ci`, `chore`, `revert`
- Commit incrementally per logical sub-step, not one giant commit

## Knowledge graph

Graph lives at `graphify-out/graph.json`. Before investigating code, run `graphify query "<question>"`. After modifying files, run `graphify update .` to refresh (AST-only, no API cost).
