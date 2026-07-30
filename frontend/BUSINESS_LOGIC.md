# Business Logic Reference

## 1. Chain & Wallet Config
- **Network**: Stellar Testnet
  - **RPC URL**: `https://soroban-testnet.stellar.org` (or `NEXT_PUBLIC_STELLAR_RPC_URL` env override)
  - **Passphrase**: `Test SDF Network ; September 2015`
- **Wallet Adapter**: Freighter Wallet.
  - Browser extension signed transactions via Freighter window provider (`window.sorobanUserApi`).
  - Implemented inside [wallet.ts](file:///home/sandipansingh/Projects/CampusChain/frontend/src/services/wallet.ts) using transaction XDR signing.

---

## 2. Contract Interfaces

### CampusToken Contract
- **Contract ID**: `CD63BOFRQNCDR7FVVWYPOI5DASAMSIIR3O54EXMGGDNUMGEWAHMU5PA7` (Testnet fallback)
- **Functions called**:
  - `balance(address)`: 
    - *Purpose*: Get CAMP token balance.
    - *Params*: `address: Address`
    - *Return*: `i128` (stroops, 7 decimals)
  - `get_role(address)`: 
    - *Purpose*: Get RBAC permission role.
    - *Params*: `address: Address`
    - *Return*: `u32` (0: Guest, 1: Student, 2: Merchant, 3: Club Organizer, 4: Admin)
  - `name()`, `symbol()`, `decimals()`, `total_supply()`:
    - *Purpose*: Standard ERC20/Token metadata.
    - *Return*: Name (`String`), Symbol (`String`), Decimals (`u32` = 7), Total Supply (`i128`).
  - `transfer(from, to, amount)`:
    - *Purpose*: Move CAMP tokens between addresses.
    - *Params*: `from: Address`, `to: Address`, `amount: i128` (stroops)
    - *Return*: `String` (Tx Hash)
  - `approve(from, spender, amount)`:
    - *Purpose*: Authorize a spender (e.g. Escrow/Service contract) to withdraw up to amount.
    - *Params*: `from: Address`, `spender: Address`, `amount: i128` (stroops)
    - *Return*: `String` (Tx Hash)
  - `set_role(admin, user, role)`:
    - *Purpose*: Set user role.
    - *Params*: `admin: Address`, `user: Address`, `role: u32`
  - `request_role_change(applicant, requested_role)`:
    - *Purpose*: Submit role upgrade request for Admin approval.
    - *Params*: `applicant: Address`, `requested_role: u32`
  - `approve_role_change(request_id, admin)`:
    - *Purpose*: Approve role change request (Admin only).
    - *Params*: `request_id: u64`, `admin: Address`
  - `deny_role_change(request_id, admin)`:
    - *Purpose*: Deny role change request (Admin only).
    - *Params*: `request_id: u64`, `admin: Address`
  - `get_pending_role_requests()`:
    - *Purpose*: List all role changes waiting for approval.
    - *Return*: Array of `RoleRequest` structs.

### CampusIdentity Contract
- **Contract ID**: `CARIZNHDFQU635QTQY7KK7N43D7YEQFUZDCEQC4IS6YBR7EMLHZVAW5E` (Testnet fallback)
- **Functions called**:
  - `register_profile(address, full_name, university_id, department)`:
    - *Purpose*: Register a new profile (Student role, unverified by default).
  - `get_profile(address)`:
    - *Purpose*: Fetch on-chain profile metadata (name, role, verification status).
    - *Return*: `Profile` struct.
  - `set_role(admin, target_address, role)`:
    - *Purpose*: Modify user role (Admin only).
  - `set_verified(admin, target_address, verified)`:
    - *Purpose*: Toggle profile verification status (Admin only).
  - `update_profile(address, full_name, university_id, department)`:
    - *Purpose*: Update personal profile fields (Owner only).

### CampusService Contract
- **Contract ID**: `CDCPGEB2VLSKXGKHOBNZKUH5XEHLQ2VVYDQ2CAOO4Q7S2PEQXTKPY257` (Testnet fallback)
- **Functions called**:
  - `get_escrow(escrow_id)`:
    - *Purpose*: Fetch active escrow details.
    - *Params*: `escrow_id: u64`
    - *Return*: `EscrowAgreement` struct (id, buyer, seller, amount, status [1: Funded, 2: Released, 3: Refunded])
  - `create_escrow(buyer, seller, amount)`:
    - *Purpose*: Lock buyer's approved CAMP tokens into escrow for seller.
    - *Params*: `buyer: Address`, `seller: Address`, `amount: i128` (stroops)
  - `release_escrow(escrow_id, caller)`:
    - *Purpose*: Release locked escrow funds to the seller (Buyer only).
    - *Params*: `escrow_id: u64`, `caller: Address`
  - `refund_escrow(escrow_id, caller)`:
    - *Purpose*: Refund locked escrow funds back to the buyer (Buyer or Seller).
    - *Params*: `escrow_id: u64`, `caller: Address`
  - `get_event(event_id)`:
    - *Purpose*: Fetch on-chain event details.
    - *Params*: `event_id: u64`
    - *Return*: `EventDetails` (id, host, price, capacity, tickets_sold)
  - `create_event(host, price, capacity)`:
    - *Purpose*: Register new event and mint ticketing pass pool.
    - *Params*: `host: Address`, `price: i128` (stroops), `capacity: u32`
  - `buy_ticket(event_id, buyer)`:
    - *Purpose*: Purchase ticketing pass for event using CAMP.
    - *Params*: `event_id: u64`, `buyer: Address`
  - `get_ticket(ticket_id)`:
    - *Purpose*: Retrieve ticket ownership.
    - *Params*: `ticket_id: u64`
    - *Return*: `TicketDetails` (id, event_id, owner, redeemed)
  - `claim_faucet(recipient)`:
    - *Purpose*: Claim 100 CAMP faucet tokens once.
    - *Params*: `recipient: Address`
  - `has_claimed_faucet(user)`:
    - *Purpose*: Check if faucet already claimed.
    - *Params*: `user: Address`
    - *Return*: `bool`
  - `buy_tokens(recipient, xlm_amount)`:
    - *Purpose*: Buy CAMP tokens with native XLM (Horizon API for payment, Soroban for minting).
    - *Params*: `recipient: Address`, `xlm_amount: String` (stroops)
  - `get_universities()`:
    - *Purpose*: Fetch registered universities.
    - *Return*: Array of `University` structs.
  - `get_membership(address)`:
    - *Purpose*: Fetch university membership ID.
    - *Params*: `address: Address`
    - *Return*: `u64`
  - `get_pending_member_requests(university_id)`:
    - *Purpose*: Fetch pending member requests.
    - *Params*: `university_id: u64`
  - `register_university(admin, name, location, description)`:
    - *Purpose*: Register a new university.
    - *Params*: `admin: Address`, `name: String`, `location: String`, `description: String`
  - `request_join(university_id, applicant)`:
    - *Purpose*: Request to join a university.
    - *Params*: `university_id: u64`, `applicant: Address`
  - `approve_member(request_id, admin)`:
    - *Purpose*: Approve membership request.
    - *Params*: `request_id: u64`, `admin: Address`
  - `deny_member(request_id, admin)`:
    - *Purpose*: Reject membership request.
    - *Params*: `request_id: u64`, `admin: Address`
  - `invite_member(university_id, invitee, admin)`:
    - *Purpose*: Invite member directly.
    - *Params*: `university_id: u64`, `invitee: Address`, `admin: Address`
  - `leave_university(member)`:
    - *Purpose*: Leave university.
    - *Params*: `member: Address`

---

## 3. Extracted Hooks/Modules (post Phase 2)

All stateful operations and contract interaction logic are extracted into standalone hooks under `frontend/src/hooks/`:

### [useLedgerEvents.ts](file:///home/sandipansingh/Projects/CampusChain/frontend/src/hooks/useLedgerEvents.ts)
- *Purpose*: Poll and decode raw ledger events from the Soroban RPC.
- *Inputs*: None (subscribes to query state)
- *Outputs*: `{ ledgerEvents: DecodedEvent[], eventsLoading: boolean, refetchEvents: () => Promise<void> }`

### [useDashboardOperations.ts](file:///home/sandipansingh/Projects/CampusChain/frontend/src/hooks/useDashboardOperations.ts)
- *Purpose*: Forms state and validation wrapper for transfer, escrow, and ticketing creation on the dashboard.
- *Inputs*: None
- *Outputs*: Form bindings (recipient, amount, seller, capacity, prices, tab indexes), execution triggers (`executeTransfer`, `executeEscrow`, `executeCreateEvent`, `executeBuyTicket`), and mutation loading flags.
- *Side Effects*: Submits approve and invoke transaction envelopes to the RPC, updates transaction log store.

### [useWalletOperations.ts](file:///home/sandipansingh/Projects/CampusChain/frontend/src/hooks/useWalletOperations.ts)
- *Purpose*: Forms state and actions for faucet, token purchase, copy, and escrow console release/refund.
- *Inputs*: None
- *Outputs*: Faucet claim bindings, xlm amount state, escrow lookup state, copy feedback, handlers (`handleClaimFaucet`, `handleBuyCamp`, `handleLookup`, `handleCopy`, `handleEscrowAction`), and loading states.

### [useActivityPagination.ts](file:///home/sandipansingh/Projects/CampusChain/frontend/src/hooks/useActivityPagination.ts)
- *Purpose*: Pagination telemetry stream parser for smart contract events.
- *Inputs*: None
- *Outputs*: `events`, `filteredEvents`, pagination flags, queries, and `loadMore` triggers.

### [useUserNotifications.ts](file:///home/sandipansingh/Projects/CampusChain/frontend/src/hooks/useUserNotifications.ts)
- *Purpose*: Queries ledger history for events involving the user public key.
- *Inputs*: None
- *Outputs*: `notifications`, `filteredNotifications`, loading, and `clearAllNotifications` handlers.

### [useUniversityProfile.ts](file:///home/sandipansingh/Projects/CampusChain/frontend/src/hooks/useUniversityProfile.ts)
- *Purpose*: Custom hook orchestrating university hub logic, registrations, and member invites.
- *Inputs*: None
- *Outputs*: Form variables, invites, approvals, and mutations handlers.

---

## 4. Data Fetching / API Layer
- **RPC Client Connection**: Configured using `@stellar/stellar-sdk`'s `rpc.Server`.
- **horizon Client Connection**: Configured using `Horizon.Server`.
- **Query Strategy**: TanStack React Query (`@tanstack/react-query`) handles query key caching (`["campus-balance", address]`, `["campus-role", address]`, etc.) to prevent duplicate fetches.
- **Polling**: 
  - Ledger events: Polled every 15 seconds in the dashboard and 10 seconds in notifications to sync on-chain state updates.
  - Transactions status: `pollTransactionStatus(hash)` polls the Soroban RPC transaction status API endpoint in a loop until the transaction is closed (`SUCCESS` or `FAILED`).

---

## 5. State & Data Flow
- **Global State**: Managed using Zustand stores.
  - [useWalletStore](file:///home/sandipansingh/Projects/CampusChain/frontend/src/state/useWalletStore.ts): Manages active connection address, connection loading flags, and RPC networks selection (testnet, standalone, mainnet).
  - [useTransactionStore](file:///home/sandipansingh/Projects/CampusChain/frontend/src/state/useTransactionStore.ts): Persists transaction logs in the local session memory with statuses (`pending`, `processing`, `confirmed`, `failed`).
- **Data Refreshing Flow**: Mutators automatically invalidate corresponding cache keys in React Query:
  - Faucet claim & token purchases invalidate `["campus-balance"]`.
  - Escrow releases/refunds invalidate `["campus-escrow"]` and `["campus-balance"]`.
  - Profile role requests invalidate `["role-requests"]`.

---

## 6. Business Rules & Validation
- **CAMP Token Decimals**: Hardcoded scale of `10,000,000` (7 decimals) used to convert user-facing numbers to stroops for smart contract compatibility.
- **Escrow Creation guard**: Escrows require a pre-signed token approval transaction (`approve`) mapping the CampusService contract as a spender before calling `create_escrow`.
- **Ticket Purchase guard**: Purchasing a ticket pass requires a pre-signed token approval transaction (`approve`) with a safe ceiling allowance of 1000 CAMP before calling `buy_ticket`.
- **Role Request guard**: Standard student roles (Student/Guest) are instantly assigned via `set_role`, whereas Merchant, Club Organizer, and Admin require a request record change request `request_role_change`.

---

## 7. Routes & Page Responsibilities
- `/` | Landing page displaying system features and auto-redirecting to `/dashboard` if connected.
- `/dashboard` | Campus central workspace showing balances, breakdown metrics, action center transfers/escrows/tickets, and ledger events.
- `/wallet` | Console for buying tokens, claiming faucet tokens, looking up escrows, and releasing/refunding locked agreements.
- `/activity` | Complete paginated audit trail of all ledger events.
- `/notifications` | Live log of user-relevant ledger events and session transactions.
- `/profile` | Profile hub to manage on-chain role requests and campus registries (University Hub).
- `/settings` | Network configuration manager for switching RPC nodes.
- `/help` | Static FAQs and user guides.

---

## 8. Env Vars Required
```bash
NEXT_PUBLIC_STELLAR_RPC_URL          # Soroban RPC server endpoint
NEXT_PUBLIC_STELLAR_PASSPHRASE       # Stellar network passphrase
NEXT_PUBLIC_CAMPUS_TOKEN_CONTRACT_ID  # CampusToken contract address
NEXT_PUBLIC_CAMPUS_SERVICE_CONTRACT_ID # CampusService contract address
NEXT_PUBLIC_CAMPUS_ADMIN_ADDRESS     # Administrator address for native XLM token payments
```

---

## 9. Known Gotchas / Edge Cases
- **Transaction Separation**: Horizon classic payments (e.g. XLM payments) and Soroban contract invocation calls cannot be bundled in the same transaction envelope when signed by Freighter. They are split into two sequential transactions.
- **RPC Event Limitations**: `getEvents` queries on Soroban RPC are limited to a search depth of at most 5000 ledgers to avoid RPC timeouts.
- **Allowance Deductions**: In contract calls like `buy_ticket`, the actual deduction is decided inside the contract. The frontend pre-approves a safe allowance ceiling of 1000 CAMP tokens first.
