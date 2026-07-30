# CampusChain Production-Fix Plan

## Phase 0 scope and evidence

This document is the Phase 0 deliverable only. No application code, contracts, deployment, testnet state, or demo accounts were changed while producing it.

### Sources of truth audited

- Official Stellar documentation index and the linked dapp, transaction, authorization, contract testing, and security guidance at `https://developers.stellar.org/llms.txt` (reviewed 2026-07-30).
- Deployed Testnet contract interfaces, fetched read-only with Stellar CLI:
  - `CampusIdentity`: `CBSP6PGVKP3OHV7CHFIVNYA6GA3WQ2VGWMGW4YTG7IF6FBEKUVFKNH6Q`
  - `CampusToken`: `CCNX6UK6XNBXG63I75R5EVRHXQKD23ECUUJSH6NPV32OWJWJL72ZQCP2`
  - `CampusService`: `CATHDHIUADXXENVYN7Z2ABSERDYUGK7OQMWFODBW7I66HS43WSUZNGLL`
- Local contract source/ABI, `frontend/BUSINESS_LOGIC.md`, root `DEPLOYMENT.md`, `docs/DEPLOYMENT.md`, and the frontend route/component/service graph.

The checked deployed interfaces match the local ABI for the functions listed below. The narrative documents are not fully authoritative: for example, `BUSINESS_LOGIC.md` describes an Identity `admin()` function that does not exist in the deployed Identity ABI and describes several obsolete route paths. Implementation must use the deployed ABI and current Rust source as the source of truth, then correct the documentation.

### Stellar implementation rules to carry into Phase 1

- Use `rpc.Server`, `prepareTransaction`, wallet signing, `sendTransaction`, and `getTransaction` polling for Soroban invocations. Treat only `SUCCESS` as confirmed.
- Use `Horizon.Server.loadAccount` and `submitTransaction` for a classic native-XLM peer payment. Do not submit classic payment operations through Soroban RPC and never combine a classic payment with an invoke-host-function operation.
- `buy_camp_tokens` is a special case: the deployed service itself calls the native XLM Stellar Asset Contract with `transfer_from`. It needs an on-chain native-SAC allowance to CampusService and a Soroban invocation; the present classic Horizon payment is both unnecessary and incompatible with the contract's required transfer path.
- Convert display CAMP to stroops with integers (`10_000_000`); validate addresses, positive finite amounts, field lengths, and role/authorization prerequisites before signature. Never turn RPC failures into balances, roles, profiles, or transaction success.
- Build contract upgrades with release safety settings, test authorization and state transitions locally, deploy/reinitialize only as needed, then execute testnet smoke tests with transaction hashes retained in the delivery record.
- Use explicit persistent indexes and bounded/paginated reads for on-chain collections. RPC events may support discovery and refresh, but are not a durable substitute for a complete application query model.

## Route and screen audit

The app has two filesystem routes. `/dashboard` contains the remaining screens as client-side tabs; each is separately audited because it is a user-visible screen.

| Route / screen | Status | Evidence and required destination |
| --- | --- | --- |
| `/` landing page | [DEMO] | Marketing claims are static, and the “For Universities” section deliberately renders fake dashboard mockups. It does not need contract reads, but must be labelled/rewritten as non-product marketing or removed; it must not imply those mockups are live data. |
| `/connect` | [BROKEN] | It renders wallet access/onboarding, but there is no route audit guarantee that connecting takes a user to a live profile view. Make connect/onboard redirect deterministically after confirmed `CampusIdentity.register_profile`; use the live query, a profile skeleton, and explicit read error state. |
| `/dashboard` shell and overview | [BROKEN] | CAMP balance and role attempt live reads, but failures become `1000.0`, Student, token metadata defaults, and `1,245.50`. Avatar is always `JD`; debug state selectors can force fake loading/empty/success. Replace with live `CampusIdentity.get_profile`, `CampusToken.balance`, real event/payment summaries, or genuine empty/error states. |
| Wallet: Send & Receive | [BROKEN] | CAMP `CampusToken.transfer` and classic XLM `Operation.payment` are wired, but recipient search uses two hardcoded people, the receive QR is decorative, memo is ignored, and conversion captions are invented. Keep direct-address payment real, replace name search with on-chain profile directory or address-only input, generate a real encoded payment request, and include a real classic memo only for XLM. |
| Pay (QR): Scan & Pay | [DEMO] | Recipient and amount are hardcoded, camera is a drawing, state dropdown changes the result, and “Simulate QR Scan” exists. Implement real request encoding/decoding and scanner/manual paste; submit `CampusToken.transfer` or classic XLM payment according to the request asset. |
| Marketplace grid | [DEMO] | `mockListings` is the rendered source. `get_listing` exists only for a known ID; no list query exists. Add collection APIs/indexing, then read and filter actual active listings. |
| Marketplace detail / checkout | [BROKEN] | It falls back to a fabricated listing after a failed read, has a manual “Simulate Step” control, treats `listingId` as an escrow ID when releasing/refunding, and does not retain the `escrow_id` returned in the `item_sold` event. Wire live listing + purchase record/escrow relationship and contract status. |
| Marketplace sell | [BROKEN] | `create_listing` is invoked, but category values are mapped `0..4` while the contract permits `1..5`; success does not ensure the new listing appears; the XLM quote is a mock. Correct mapping, return/parse listing ID, invalidate and navigate to live listing, and remove the fabricated exchange quote. |
| Events | [DEMO] | `mockEvents` supplies names, dates, places, descriptions, capacity, and checkout target. The deployed `EventDetails` only has id, host, price, capacity, tickets_sold; no event list/count API exists. Upgrade schema and index first, then call `get_event` through a paginated listing query and call `CampusService.buy_ticket` after CAMP approval. |
| Rewards & CAMP | [BROKEN] | Balance/faucet calls are real, but balance falls back to `4,250`, earnings and rewards are hardcoded, reward redemption uses fake IDs, and buy-CAMP first sends a classic payment then calls a contract that needs native-SAC allowance. Implement reward/list/history reads, CAMP approval before redemption, and the native-SAC approve + `buy_camp_tokens` flow. |
| Scholarships | [DEMO] | Program cards, application names, history, and IDs are static; applying stores a random local application ID; statement of purpose and deadline are not in the ABI. Add program/application indexes and the required data model, show only on-chain fields, derive application IDs from transaction return/events, and eliminate localStorage as the authoritative record. |
| Transactions | [BROKEN] | Soroban events are real but globally scoped, only search the last 5,000 ledgers, hide errors, omit Horizon XLM payments, and display a debug state selector and raw “Loading...” button label. Query only activity involving the connected address, merge contract-event and Horizon payment history without duplicates, preserve full hash and explorer link. |
| Merchant Hub | [DEMO] | Sales are `mockSales`; QR generation form has no submit handler; no escrow/listing management is rendered. Build it from actual merchant-facing payment requests, listing reads, escrow state, and redemption fulfillment. |
| Admin Hub | [BROKEN] | Role/verification writes call live Identity methods, but authorization actually requires Identity’s original configured admin, not merely any profile with role Admin. Merchant onboarding is static local state and approve only mutates React state. Add auditable identity role-request APIs or use a reconciled canonical flow, query requests, and invoke the contract review method. |
| Settings | [DEMO] | It does not query an Identity profile; it shows a static email and non-functional local Security/Keys and Notifications controls. Keep only actual profile fields and safe network display/configuration. |
| Onboarding / login screen | [BROKEN] | Profile registration is a real write, but it includes an email field that is neither persisted nor used; it does not expose the confirmed on-chain profile outcome. Remove email and refresh/redirect only after the confirmed profile query returns the submitted fields. |
| Activity feed / header menu | [BROKEN] | The feed receives real global contract events but is not address-filtered. Header/mobile avatars are static `JD`; profile error is silent in upstream fallback hooks. Filter, live-query profile, and use a shortened public address where a profile is absent. |

## Exact contract mapping and service-layer gaps

### Reads that can be made real against the current deployed ABI

| Feature | Required read | Current gap |
| --- | --- | --- |
| Connected identity / settings / avatar | `CampusIdentity.get_profile(address)` | `fetchUserProfile` exists but parsing/error handling must be validated; no Settings consumption; avatar is hardcoded. Add `update_profile` mutation. Never default a missing/failed read to a fabricated profile. |
| CAMP balance and metadata | `CampusToken.balance`, `name`, `symbol`, `decimals`, `total_supply` | Hooks replace failed reads with fake CAMP balance/role/metadata. Remove all fallbacks and surface retryable error states. |
| CAMP P2P payment | `CampusToken.transfer(from,to,amount)` | Existing invocation is viable but recipient discovery, validation, history invalidation, QR request support, and confirmed explorer receipt are missing. |
| XLM P2P payment | Horizon classic `Operation.payment` | Existing method is viable but must validate destination/amount, optionally add classic memo, merge confirmed Horizon data into history, and use the actual Horizon URL from configuration. |
| Faucet | `CampusService.has_claimed_faucet`, `claim_faucet` | Write/read exist; replace hardcoded “daily” language because the contract is once-per-address, and show confirmed status from the live query. |
| One known listing/escrow/event/ticket/reward/program/application/redemption | `get_listing`, `get_escrow`, `get_event`, `get_ticket`, `get_utility_reward`, `get_scholarship_program`, `get_scholarship_application`, `get_redemption` | Service functions exist but screens lack stable known IDs and collection/discovery queries. Individual service parsers must preserve bigint-safe values and validate decoded shapes. |
| Universities / role requests | `CampusService.list_universities`, `get_university`, `get_membership`, `list_pending_requests`; `CampusToken.list_pending_role_requests` | Current visible dashboard does not render these real collections. Token role requests are not the identity role source used by CampusService, so they cannot be presented as effective Service permissions without reconciliation. |
| Event, reward, scholarship, marketplace transitions | `create_listing`, `update_listing`, `buy_listing`; `create_event`, `buy_ticket`, `redeem_ticket`; `create_utility_reward`, `redeem_reward`, `fulfill_redemption`; `create_scholarship_program`, `apply_for_scholarship`, `review_scholarship_application`, `disburse_scholarship` | Writes exist in part, but approval sequencing, IDs returned/events, permission guards, list refreshes, and UI state mapping are incomplete or incorrect. |

### Contract upgrade required before the affected screens can be [REAL]

The deployed Service ABI has getters for individual numeric IDs but no exposed counters or paginated collection methods for listings, events, tickets, escrows, rewards, scholarship programs, applications, or redemptions. It is not possible for a fresh browser to truthfully render a complete list from contract reads alone. Implement a backward-compatible Service upgrade with bounded, stable pagination and owner/participant indexes, for example:

- `list_listings(status, cursor, limit)`, `list_events(cursor, limit)`, `list_rewards(cursor, limit)`, `list_scholarship_programs(active_only, cursor, limit)`.
- `list_escrows_for(address, cursor, limit)`, `list_tickets_for(owner, cursor, limit)`, `list_applications_for(applicant, cursor, limit)`, `list_redemptions_for(student, cursor, limit)`, plus admin review lists as needed.
- A first-class `Purchase`/listing-to-escrow record, or an indexed `listing_id -> escrow_id`, emitted on `buy_listing`; release/refund must use that actual escrow ID, never a listing ID.
- Extend `EventDetails`/`create_event` to persist fields the UI promises (at minimum title, description, start time, location, category) or remove those UI fields. The current ABI cannot truthfully supply them.
- Extend scholarships only with fields that are genuinely required (for example deadline and application narrative) or remove the corresponding inputs/claims. `apply_for_scholarship` currently stores only applicant, program ID, GPA, and status, so the statement-of-purpose textarea cannot remain as a pretend submission.
- Add `ClubOrganizer = 3` to `CampusIdentity.UserRole`, or make event creation explicitly Admin-only. `CampusService.create_event` requires a minimum role of 3 but the deployed Identity enum can only encode Student (1), Merchant (2), or Admin (4), making the stated Club Organizer flow impossible.
- Choose one authoritative RBAC source. Since Service verifies `CampusIdentity.get_profile`, implement role-request/review/list APIs in Identity (and expose a read-only configured-admin getter) or atomically reconcile CampusToken requests into Identity. Do not display CampusToken approval as an effective Service permission until it changes Identity.
- Provide profile discovery only if the product really needs name lookup. Otherwise payment entry must be a public Stellar address. If a directory is approved, index only opted-in public profiles and provide paginated Identity reads; never make an unbounded storage scan.

Every new or changed endpoint will receive Rust unit tests for authorization, invalid IDs, pagination bounds, indexes, approval/allowance failure, and each allowed state transition. Existing stored data will be migration-tested before Testnet upgrade.

## Current critical defects to fix first

1. **False data and false success:** remove balance/profile/metadata/listing fallbacks, random scholarship IDs, static QR values, and all debug state selectors. A failed read must not look like real data; a failed write must not advance a visual flow.
2. **Marketplace correctness:** correct category mapping to contract categories `1..5`; obtain listing/escrow IDs from confirmed return value/event; approve exactly the required CAMP allowance before `buy_listing`; show contract listing and escrow statuses, not manually selected steps.
3. **XLM purchase correctness:** replace Horizon classic payment + Soroban mint sequence with: native SAC allowance to CampusService, then `CampusService.buy_camp_tokens(recipient,xlm_amount)` in a separate Soroban transaction. Surface both hashes where the flow legitimately has two signed contract transactions; never claim success until both are confirmed.
4. **Permissions:** ensure UI guards use the effective on-chain source and that all admin actions also check the configured contract admin where required. A user role of Admin is not sufficient for the currently deployed Identity `set_role`/`set_verified` methods.
5. **History correctness:** combine address-filtered Service/Token events with Horizon account payments; do not show global campus events as a user’s history. Keep full hashes, ledger/time, status, and a testnet explorer link.

## Loading, empty, and error-state plan

- Delete every user-facing “State: Loaded/Loading/Empty”, “Simulate…”, and manual test-state control. Delete raw `Loading...` button text; use an inline visual pending treatment and `aria-busy` where appropriate.
- Replace the full-screen profile spinner with the same profile/dashboard skeleton geometry used after connection. Each collection gets card/table-shaped skeletons; each detail page gets a structured detail skeleton.
- Model each query as loading, error, empty, and data. Empty is valid only after a successful query; errors show a concise retry affordance and never substitute fixtures.
- After a confirmed write, update/invalidate all affected queries and reconcile the returned ID/event so the changed record is visible immediately without manual refresh. Cursor event polling remains a secondary synchronization mechanism.

## UI/cosmetic audit and file-level actions

| Issue | Files to change |
| --- | --- |
| Static avatars/identity, fake balance, debug state controls, accent-filled sidebar active state, mobile `scale-105` active state, hover-heavy cards | `frontend/src/features/wallet/ui/WalletDashboard.tsx` |
| Remove Campus Email, Security & Keys, Notifications; show live full name, university ID, department, role, verified status, public wallet address; profile skeleton/error; profile edit only through `update_profile` | `frontend/src/features/wallet/ui/Settings.tsx`, `frontend/src/features/wallet/service/campusIdentity.ts`, `frontend/src/features/wallet/hooks/useWallet.ts` |
| Remove email from on-chain onboarding | `frontend/src/features/wallet/ui/Login.tsx` |
| Replace decorative receive QR, mock recipients, invented conversions, and unused memo behavior; make long address/name values truncate with a hover title and accessible copy | `frontend/src/features/wallet/ui/SendReceive.tsx`, payment/profile directory services |
| Replace fake camera, laser/glow, static recipient/amount, simulate control, and debug states with real scanner/paste flow | `frontend/src/features/wallet/ui/ScanPay.tsx`, new payment-request utility/service |
| Eliminate mock listing/detail fallback, blue accent badge, fake XLM quote, simulated tracker, incorrect escrow ID; use title attributes and line clamps for text | `frontend/src/features/marketplace/ui/MarketplaceGrid.tsx`, `MarketplaceDetail.tsx`, `MarketplaceSell.tsx`, marketplace service/hooks |
| Remove marketplace card lift/hover motion and floating-button scale motion; retain only subtle neutral border/shadow if needed | `MarketplaceGrid.tsx`, `MarketplaceDetail.tsx`, `MarketplaceSell.tsx` |
| Replace mock events and pulsing badge with live event model; remove card motion and non-contract date/place text unless persisted | `frontend/src/features/events/ui/Events.tsx`, event service/hooks, Service contract |
| Replace mock earnings/rewards/balance fallback and fake visual conversion rate; remove colored reward-card flourish | `frontend/src/features/rewards/ui/Rewards.tsx`, rewards service/hooks, Service contract |
| Replace program/history fixtures, random ID, fake metadata, Sparkles/colored badges where non-token, and state selector; use live programs/applications | `frontend/src/features/scholarships/ui/Scholarships.tsx`, scholarship service/hooks, Service contract |
| Replace all merchant/admin fixtures and local approval; real QR request, receipts, escrows, listings, redemptions, onboarding lists | `frontend/src/features/transactions/ui/MerchantDashboard.tsx`, `AdminDashboard.tsx`, transaction services/hooks, Identity/Service contracts |
| Remove transaction state selector and raw “Loading...” text; add address filtering/Horizon merge, skeleton pagination, actual error surface | `frontend/src/features/transactions/ui/TransactionHistory.tsx`, `hooks/useTransactions.ts`, `service/events.ts`, `shared/stellar/client.ts` |
| Filter the live event feed by connected address and align cache keys with actual queries | `frontend/src/shared/hooks/useContractEventStream.ts`, `frontend/src/shared/ui/ActivityFeedPanel.tsx`, `frontend/src/shared/stellar/eventDecoder.ts` |
| Remove card vertical lift and fake UI mockup treatment from marketing | `frontend/src/features/landing/ui/HowItWorks.tsx`, `ForUniversities.tsx` |

Global visual rule: active sidebar items become neutral bold text plus a thin black/grey left border; no accent fill or accent border. Cards may use a neutral border/shadow change only—no `translateY`, `scale`, glow, or animated gradient-like treatment. Long addresses always use `min-w-0`, `truncate`, a full-value `title`, and an accessible copy action; titles/descriptions wrap or line-clamp according to their layout.

## Implementation order after approval

1. **Baseline and contract design:** build/test current workspace; document deployed state; define backward-compatible Identity/Service storage indexes, pagination, event metadata, escrow purchase relationship, canonical RBAC, and migrations. Add/expand Rust tests before deployment.
2. **Deploy contract upgrade safely:** build WASM, run full tests/lints, deploy an upgraded Testnet version using the authorized admin, verify ABI/wiring/TTL, record contract hashes and Testnet transaction hashes, and update environment fallbacks only after verification.
3. **Shared client and data layer:** generate/maintain typed ABI bindings or rigorously typed parsers; implement safe RPC reads, confirmed writes, native-SAC approval/purchase sequencing, Horizon classic-payment history, address filters, pagination, event decoding, and query invalidation.
4. **Wallet and identity foundation:** wallet connection/network guard, live profile registration/read/edit/avatar/settings, real balance, direct CAMP/XLM send/receive, and valid payment-request QR generation/scanning. This is the prerequisite for all checkout tests.
5. **Marketplace + escrow:** live collection/detail/sell/update/buy, exact approval flow, live escrow status and buyer/admin release or seller/admin refund. Execute and retain one real buyer/seller escrow walkthrough.
6. **Events, rewards, scholarships:** real list/detail/ownership/redeem/application/review/disbursement interfaces only for state the contracts persist; seed enough real records to exercise each genuine empty and populated state.
7. **Merchant, admin, transaction history:** real request QR, sales/escrows/listings/redemptions, canonical role onboarding, global supply/real stats, and address-scoped Explorer-linked history.
8. **Polish and acceptance:** complete loading/empty/error states, overflow and visual pass, remove all fixtures, run frontend tests/lint/build and Cargo test/fmt/clippy/build, update graph, then complete the Testnet acceptance script without manual refresh.

## Demo-seeding and acceptance plan

After the upgrade and before UI evidence is captured:

1. Generate at least 10 new Testnet keypairs outside the repository; Friendbot-fund each. Store secret keys only in an operator-controlled secure environment, never in source, environment examples, logs, screenshots, or `DEMO_ACCOUNTS.md`.
2. Register each with `CampusIdentity.register_profile`; use varied names, university IDs, and departments. Use the verified configured Identity admin to set at least two Merchant roles and one Admin role via the canonical Identity role path. Include any required verified Student accounts for scholarship testing.
3. Fund CAMP through the supported faucet/purchase/admin flow. Create real marketplace listings with `create_listing`, event listings with the upgraded `create_event`, utility rewards with `create_utility_reward`, and scholarship programs with `create_scholarship_program`, including approvals needed by `transfer_from`.
4. Create `DEMO_ACCOUNTS.md` with public address, display role, purpose, and funding/profile verification date only. Do not imply that a judge can sign as an account unless a secure out-of-band wallet import method is supplied; public addresses alone cannot be connected as funded identities.
5. Execute and record: (a) a real CAMP and/or XLM payment, (b) a listing purchase creating escrow, (c) escrow release or refund by the authorized party, (d) immediate UI query-cache/event-driven state update, (e) transaction-history entry and working StellarExpert Testnet link. The final delivery will list each hash and affected visible state.

## Definition of done

- No mock/hardcoded dynamic records, fake state selectors, simulated payment/scan controls, fabricated fallback balances/profiles, or success UI without a confirmed Testnet write remain.
- Every populated screen names the exact real read/write endpoint it uses; every empty screen is a successful on-chain/index query with no records.
- Settings contains only real Identity fields and safe network information; no email, notifications, or key-management controls remain.
- The required Testnet payment and marketplace escrow flows have been personally executed and their post-transaction UI state appears without a manual refresh.
- `DEMO_ACCOUNTS.md`, transaction evidence, documentation updates, tests, lint/build results, and a grouped changed-file list are included in the final Phase 1 handoff.

## Phase 1 deployment record

The Phase 1 Testnet deployment and seeding pass uses the following verified contract addresses:

| Contract | Testnet address |
| --- | --- |
| CampusIdentity | `CBSP6PGVKP3OHV7CHFIVNYA6GA3WQ2VGWMGW4YTG7IF6FBEKUVFKNH6Q` |
| CampusToken | `CCNX6UK6XNBXG63I75R5EVRHXQKD23ECUUJSH6NPV32OWJWJL72ZQCP2` |
| CampusService | `CATHDHIUADXXENVYN7Z2ABSERDYUGK7OQMWFODBW7I66HS43WSUZNGLL` |

The Service contract is wired to the Identity contract above.  The deployment, all ten profiles, marketplace listings, rewards, scholarship program/application, paid event ticket, CAMP payment, escrow purchase, and escrow release were verified with confirmed Testnet transactions. `DEMO_ACCOUNTS.md` contains the public account and transaction evidence.
