# University-Scoped RBAC Plan

## Scope and design decision

This plan replaces the current flat `Student` / `Merchant` / `Admin` model and the legacy
`CampusService` university-membership registry. It was prepared after reviewing the Stellar
developer documentation index (`https://developers.stellar.org/llms.txt`), especially its
contract authorization, storage, contract-convention, and state-archival guidance, plus the
current `CampusIdentity`, `CampusToken`, `CampusService`, `BUSINESS_LOGIC.md`,
`GAP_ANALYSIS.md`, and `DEPLOYMENT.md`.

**Decision: extend `CampusIdentity`; do not create a separate University Registry contract.**

`CampusIdentity` becomes the authoritative **Identity and University Registry** contract. A
university lookup and a profile lookup are part of one authorization decision, so co-locating
them gives every consumer one deterministic contract call rather than two. It also makes a
unique university-code claim atomic with creation of its University Admin profile. A separate
registry would save no meaningful storage (the same persistent entries still exist), but would
add an extra cross-contract call, a second mutable contract address to wire into every consumer,
and a risk of profile/registry state being checked inconsistently.

`CampusService` remains the domain-service contract for marketplace, escrow, events,
scholarships, utility rewards, and food ordering. It must delete its current `University`,
`UniversityMember`, join-request, and invite storage/API so it cannot become a second source of
university authority.

The three sources of truth after this change are deliberately narrow:

| Concern | Authoritative contract |
| --- | --- |
| Roles, profiles, university registry, approval and verification | `CampusIdentity` |
| CAMP balances, allowances, and guarded CAMP transfers | `CampusToken` |
| Marketplace, escrow, events, rewards, scholarships, and food orders | `CampusService` |

## Non-negotiable invariants

1. There is exactly one Platform Admin address. `initialize` stores it once, only after that
   address authorizes the call. No role-creation, role-edit, or upgrade path can create,
   transfer, or duplicate Platform Admin.
2. `PlatformAdmin` is not a university-scoped role. Its profile has no `university_code`; every
   other role has exactly one immutable canonical `university_code`.
3. A University Admin's initial registration atomically creates both its profile and a unique
   `PendingApproval` university registry entry. The code and the admin address are both unique.
4. Student, Merchant, and Event Organizer registrations are permitted only against an
   `Approved` university and always begin `Pending`; they cannot perform product actions before
   their own University Admin marks them `Verified`.
5. Any authorization helper used for a university-scoped action rejects a missing profile,
   `Pending` or `Rejected` profile, and a university whose state is not `Approved`.
6. The canonical university code is immutable after registration. There is no profile update
   operation that can change it. Moving to another university is a deliberately separate
   lifecycle, not an editable field.
7. Every action involving two university-scoped addresses calls the identity contract before
   token movement or a state transition. It must prove that both active profiles have the same
   canonical code.

### Platform Admin immutability

The deployed registry uses a persistent `PlatformAdmin` key, not a role assignment table:

```rust
pub fn initialize(env: Env, platform_admin: Address) -> Result<(), Error> {
    if env.storage().persistent().has(&DataKey::PlatformAdmin) {
        return Err(Error::AlreadyInitialized);
    }
    platform_admin.require_auth();
    env.storage().persistent().set(&DataKey::PlatformAdmin, &platform_admin);
    // Create the sole Platform Admin profile here; register_profile rejects this role.
    Ok(())
}
```

The deploy script must read `NEXT_PUBLIC_CAMPUS_ADMIN_ADDRESS`, resolve the address of
`CAMPUSCHAIN_ADMIN_KEY`, and fail unless they are identical. It invokes `initialize` with that
address and uses that same account as the transaction source. The environment variable is only a
deployment input; **the immutable on-chain persistent key is the security boundary**. A frontend
environment variable must never be consulted at runtime for authorization.

There is no `set_role`, `set_role_value`, `set_platform_admin`, `transfer_admin`, or role-request
function in `CampusIdentity`. Profile roles are write-once at creation. `CampusIdentity` must also
remove its current `upgrade` entry point: an upgrade controlled by Platform Admin could otherwise
install code that grants a second Platform Admin, which would defeat the stated invariant. A
future registry change therefore requires a new deployment and explicit migration, not an
in-place identity upgrade. The normal persistent/instance TTL-extension policy remains required
to keep the live contract and these entries from archival.

## Canonical storage schema

All user-entered strings must be bounded and normalized before storage. In particular,
`university_code` is uppercase ASCII `[A-Z0-9_-]`, 2–32 bytes, and is used exactly in that form as
a persistent key. Names, descriptions, and addresses need agreed maximum lengths (recommended:
128, 512, and 256 bytes respectively) to bound Soroban storage and execution costs.

### Enums

```rust
#[contracttype]
#[derive(Clone, Copy, Debug, Eq, PartialEq)]
#[repr(u32)]
pub enum UserRole {
    Student = 1,
    Merchant = 2,
    EventOrganizer = 3,
    UniversityAdmin = 4,
    PlatformAdmin = 5,
}

#[contracttype]
#[derive(Clone, Copy, Debug, Eq, PartialEq)]
#[repr(u32)]
pub enum VerificationStatus {
    Pending = 1,
    Verified = 2,
    Rejected = 3,
}

#[contracttype]
#[derive(Clone, Copy, Debug, Eq, PartialEq)]
#[repr(u32)]
pub enum UniversityApprovalStatus {
    PendingApproval = 1,
    Approved = 2,
    Rejected = 3,
    Suspended = 4,
}

#[contracttype]
#[derive(Clone, Copy, Debug, Eq, PartialEq)]
#[repr(u32)]
pub enum MerchantCategory {
    Retail = 1,
    FoodCanteen = 2,
    Services = 3,
    Other = 4,
}
```

### Profiles

`Profile` is persistent at `DataKey::Profile(Address)`. The initial Platform Admin profile is
created only by `initialize`; it has `PlatformAdmin`, `Verified`, and `None` for
`university_code`. All other stored profiles have `Some(code)`.

```rust
#[contracttype]
#[derive(Clone, Debug, Eq, PartialEq)]
pub struct Profile {
    pub address: Address,
    pub full_name: String,
    pub university_code: Option<String>,
    pub role: UserRole,
    pub verification_status: VerificationStatus,
    pub details: ProfileDetails,
    pub created_at: u64,
    pub updated_at: u64,
}

#[contracttype]
#[derive(Clone, Debug, Eq, PartialEq)]
pub enum ProfileDetails {
    Student {
        // Hash instead of a public on-chain student number; raw identifiers are PII.
        student_identifier_hash: BytesN<32>,
        department: String,
        program: String,
        graduation_year: u32,
    },
    Merchant {
        business_name: String,
        category: MerchantCategory,
        business_description: String,
    },
    EventOrganizer {
        organization_name: String,
        organization_description: String,
    },
    UniversityAdmin {
        title: String,
        owned_university_code: String,
    },
    PlatformAdmin,
}
```

`owned_university_code` is intentionally redundant with `Profile.university_code`; registration
must require equality and the contract checks it on read. It makes the ownership relation
explicit in the profile ABI while `UniversityByAdmin` provides an O(1) proof that the address has
not claimed another code.

### University registry

`University` is persistent at `DataKey::UniversityByCode(String)`. The value stores the physical
or postal `address` requested in the product brief, not a Stellar address.

```rust
#[contracttype]
#[derive(Clone, Debug, Eq, PartialEq)]
pub struct University {
    pub code: String,
    pub name: String,
    pub address: String,
    pub admin_address: Address,
    pub approval_status: UniversityApprovalStatus,
    pub created_at: u64,
    pub updated_at: u64,
}
```

### Index and configuration keys

| Key | Storage | Purpose |
| --- | --- | --- |
| `PlatformAdmin` | Persistent | The one immutable platform address. |
| `Profile(Address)` | Persistent | One profile per wallet. |
| `UniversityByCode(String)` | Persistent | The unique university registry entry. |
| `UniversityCodeByAdmin(Address)` | Persistent | Enforces one claimed code per University Admin. |
| `PendingProfileCount(String)` | Instance | Per-university monotonically increasing pending-profile sequence. |
| `PendingProfileAt(String, u64)` | Persistent | `university_code + sequence → applicant Address`, for bounded pending-review pagination. |
| `PendingProfileSequence(Address)` | Persistent | Lets approval/rejection remove or mark the applicant's pending index. |
| `SchemaVersion` | Instance | Defensive ABI/version check for the new deployment. |

The registry must not store an unbounded `Vec` of all users or pending users. Pending-review APIs
are paginated and capped (for example, 50 records) using `PendingProfileAt`. Reading a profile or
university refreshes its persistent TTL; all state-changing calls refresh relevant keys and the
contract instance TTL.

## Contract API and authorization design

### `CampusIdentity`: new authoritative API

| Function | Authorization and required behavior |
| --- | --- |
| `initialize(platform_admin: Address)` | One time only. `platform_admin.require_auth()`. Stores the immutable key and creates the only Platform Admin profile. |
| `platform_admin() -> Address` | Read-only canonical Platform Admin lookup. |
| `register_university(admin, code, name, address, title)` | `admin.require_auth()`. Rejects the platform address, existing profile, existing code, and existing `UniversityCodeByAdmin`. Atomically creates a University Admin profile and matching university at `PendingApproval`. |
| `approve_university(platform_admin, code)` | Platform Admin only. Requires `PendingApproval`; changes only to `Approved`. It makes the University Admin usable through the active-profile helper. |
| `reject_university(platform_admin, code)` | Platform Admin only. Requires `PendingApproval`; changes only to `Rejected`. |
| `suspend_university(platform_admin, code)` | Platform Admin only. Requires `Approved`; changes only to `Suspended` and immediately makes every scoped action fail. |
| `register_profile(address, full_name, university_code, role, details)` | `address.require_auth()`. Allowed roles are **only** Student, Merchant, Event Organizer. Requires target university `Approved`, no existing profile, and details matching the requested role. Stores `Pending`. |
| `verify_profile(university_admin, address)` | `university_admin.require_auth()`. The target must be `Pending`, non-admin, and at the caller's approved university; caller must be that registry entry's University Admin and active. Stores `Verified`. |
| `reject_profile(university_admin, address)` | Same authority and scope as `verify_profile`; changes the target from `Pending` to `Rejected`. |
| `get_profile(address) -> Result<Profile, Error>` | Read-only lookup. |
| `get_university(code) -> Result<University, Error>` | Read-only lookup. |
| `list_universities(start_after, limit) -> Vec<University>` | Bounded paginated read; needs a code index only if UI discovery is required. |
| `list_pending_profiles(university_admin, start_after, limit) -> Result<Vec<Profile>, Error>` | Bounded; rechecks that caller owns the approved university. |
| `is_same_university(left, right) -> Result<bool, Error>` | Pure code comparison of two existing scoped profiles. It returns `false` if either is Platform Admin; it does not itself grant permission. |
| `assert_active_profile(address) -> Result<Profile, Error>` | Requires a non-platform profile to be `Verified` and its university `Approved`; Platform Admin succeeds only for platform-only administrative calls. |
| `assert_active_role(address, role) -> Result<Profile, Error>` | `assert_active_profile` plus exact role match. No ordinal role comparisons. |
| `assert_active_role_any(address, roles: Vec<UserRole>) -> Result<Profile, Error>` | Exact membership check for Student-or-Merchant marketplace listing. Bound roles to a small fixed maximum. |
| `assert_active_same_university(left, right) -> Result<(), Error>` | The primary C2C guard: both are active scoped profiles and their canonical codes are equal. |
| `assert_active_university_admin(address, university_code) -> Result<(), Error>` | Ensures exact University Admin role, approved university, matching code, and matching registry owner. |

The plan intentionally does **not** add general `set_role`, `set_verified`, `update_profile` with a
university code, role-transfer, or role-request endpoints. A narrowly scoped
`update_profile_details(address, full_name, details)` may be added later only for fields that do
not change role, university code, identifier hash, or merchant category without review.

`approve_university` transitions a University Admin from operationally inactive to active because
`assert_active_profile` also checks that the owned university is approved. This plan gives the
University Admin profile `Verified` at atomic claim creation, while university status remains the
gate. Whether Platform Admin must independently verify that administrator's identity is an open
product decision listed below.

### `CampusToken`: remove RBAC ownership and guard CAMP transfers

CampusToken must no longer own `Role`, `RoleRequest`, or their APIs. It receives an immutable
`identity_contract` address during initialization, alongside the immutable `service_contract`
address, and exposes read-only getters. No post-initialization setter may repoint either address.

Before a direct user-to-user `transfer` or `transfer_from`, it calls:

```rust
CampusIdentityClient::assert_active_same_university(&from, &to)
```

This covers CAMP P2P and CAMP scan-and-pay even if a user bypasses the frontend. The sole
exception is the configured `CampusService` contract acting as a temporary payment/escrow holder:

* user -> `CampusService`: require the user to be an active profile; `CampusService` has already
  checked the user and the actual counterparty before making the transfer;
* `CampusService` -> user: require the recipient to be active; `CampusService` rechecks the
  stored counterparty relationship before release/refund;
* any other contract address is not exempt.

`mint_purchase` and the faucet must require the recipient to be active. Platform minting must
likewise require an active university-scoped recipient unless the mint is to the configured
service reserve. These checks close the current loophole where an unverified address can receive
and then use CAMP.

The resulting CampusToken public surface is deliberately limited to:

```text
initialize(platform_admin, identity_contract, service_contract, decimals, name, symbol)
platform_admin() | identity_contract() | service_contract()
name() | symbol() | decimals() | total_supply() | balance(address)
transfer(from, to, amount) | approve(from, spender, amount, expiration_ledger)
allowance(from, spender) | transfer_from(spender, from, to, amount)
mint(to, amount) | mint_purchase(caller, to, amount) | burn(from, amount) | faucet(recipient)
upgrade(new_wasm_hash)  // Platform Admin only; cannot change stored link addresses
```

The initializer must call `CampusIdentity::platform_admin()` and reject a different
`platform_admin` argument. It stores `identity_contract` and `service_contract` once; the current
`set_service_contract`, `get_role`, `set_role`, `request_role_change`,
`approve_role_change`, `deny_role_change`, and role-request listing APIs are removed. The
frontend obtains role/verification from CampusIdentity only.

### `CampusService`: identity link and exact call sites

`CampusService::initialize` receives the immutable addresses of CampusToken, CampusIdentity, and
the native-XLM Stellar Asset Contract. It removes the current mutable `set_identity_contract` and
the legacy university/membership endpoints. Before its first token transfer or record mutation,
each following action makes the listed `CampusIdentity` call.

| Existing service area and function | Required identity call before proceeding | Additional required change |
| --- | --- | --- |
| Generic Escrow: `create_escrow(buyer, seller, amount)` | `assert_active_same_university(buyer, seller)` | Store `university_code` in `EscrowAgreement` as an immutable audit/safety field. |
| Escrow settlement: `release_escrow`, `refund_escrow` | `assert_active_same_university(escrow.buyer, escrow.seller)` | Preserve buyer/seller authorization; apply the suspension/settlement policy below. |
| Events: `create_event(host, ...)` | `assert_active_role(host, EventOrganizer)` | Add `university_code` to `EventDetails`; Event Organizer replaces the old Club/Admin ordinal check. |
| Events: `buy_ticket(event_id, buyer)` | `assert_active_same_university(buyer, event.host)` | Store event code in tickets. Buyer-role eligibility needs confirmation. |
| Events: `redeem_ticket(ticket_id, host)` | `assert_active_role(host, EventOrganizer)` | Require host remains the event owner; event's stored code must equal host's active code. |
| Marketplace: `create_listing(seller, ...)` | `assert_active_role_any(seller, [Student, Merchant])` | Store seller code in `MarketplaceListing`. This explicitly allows **both Student and Merchant** listings. |
| Marketplace: `update_listing(id, seller, ...)` | `assert_active_role_any(seller, [Student, Merchant])` | Retain seller ownership; require seller code equals listing code. |
| Marketplace: `buy_listing(id, buyer)` | `assert_active_same_university(buyer, listing.seller)` | Check before direct payment or internal escrow creation. |
| Scholarships: `create_scholarship_program`, `review_scholarship_application`, `disburse_scholarship` | `assert_active_university_admin(admin, program.university_code)` | Add `university_code` to `ScholarshipProgram` and application. The old global Admin check is removed. |
| Scholarships: `apply_for_scholarship(applicant, program_id, gpa)` | `assert_active_role(applicant, Student)`, then `assert_active_same_university(applicant, program.sponsor)` | Student must be verified and within the program's code. |
| Utility rewards: `create_utility_reward` | `assert_active_role(merchant, Merchant)` | Change creator to merchant, add `merchant` and `university_code` to `UtilityReward`; do not allow an unowned global reward. |
| Utility rewards: `redeem_reward(student, reward_id)` | `assert_active_role(student, Student)`, then `assert_active_same_university(student, reward.merchant)` | Existing reward redemption becomes university-scoped. |
| Utility rewards: `fulfill_redemption(merchant, redemption_id)` | `assert_active_same_university(merchant, redemption.student)` | Merchant must also equal the reward's recorded merchant. |
| CAMP purchase: `buy_camp_tokens(recipient, xlm_amount)` | `assert_active_profile(recipient)` | A pending/rejected/suspended user cannot buy CAMP through the app. |
| Faucet: `claim_faucet(recipient)` | `assert_active_profile(recipient)` | A pending/rejected/suspended user cannot claim. |

The stored `university_code` on domain records is not a substitute for a live identity check. It
is immutable historical context and supports filtering/auditing; the identity call is what blocks
an account whose profile or university has since been suspended.

The resulting CampusService function inventory is:

```text
initialize(platform_admin, token_contract, identity_contract, native_token_contract)
platform_admin() | token_contract() | identity_contract() | native_token_contract()

create_escrow | get_escrow | list_escrows | release_escrow | refund_escrow
create_event | get_event | list_events | buy_ticket | get_ticket | redeem_ticket
create_listing | get_listing | list_listings | update_listing | buy_listing | get_listing_escrow
create_scholarship_program | get_scholarship_program | list_scholarship_programs
apply_for_scholarship | get_scholarship_application | list_scholarship_applications
review_scholarship_application | disburse_scholarship
create_utility_reward | get_utility_reward | list_utility_rewards | redeem_reward
get_redemption | fulfill_redemption
claim_faucet | has_claimed_faucet | buy_camp_tokens
pay_camp | pay_xlm
publish_menu_item | update_menu_item | get_menu_item | list_menu_items_by_merchant
place_order | update_order_status | cancel_order | get_food_order
list_food_orders_by_student | list_food_orders_by_merchant
upgrade(new_wasm_hash)  // Platform Admin only; configuration addresses remain immutable
```

Deleted Service APIs are `register_university`, `get_university`, `list_universities`,
`request_join`, `approve_member`, `deny_member`, `get_join_request`, `invite_member`,
`accept_invite`, `leave_university`, `list_pending_requests`, `get_membership`,
`set_identity_contract`, and `set_native_token`. They would otherwise leave legacy routes around
the new registry. `CampusService::initialize` must verify that its `platform_admin` matches
`CampusIdentity::platform_admin()`; each `upgrade` is authorized by that stored address only.

### P2P payments and scan-and-pay

The current frontend routes CAMP directly to `CampusToken::transfer` and XLM through Horizon
`Operation.payment`. The CAMP guard above makes direct CAMP calls safe. Raw classic XLM payments
cannot invoke a Soroban contract and therefore **cannot be made universally university-scoped on
Stellar**; a wallet can always submit a normal payment outside CampusChain.

For CampusChain's P2P and QR flows, replace `sendNativePayment` with two `CampusService` entry
points, both guarded by `assert_active_same_university(sender, recipient)`:

```rust
pay_camp(sender: Address, recipient: Address, amount: i128) -> Result<(), Error>
pay_xlm(sender: Address, recipient: Address, amount: i128) -> Result<(), Error>
```

`pay_camp` uses CAMP `transfer_from` after an approval. `pay_xlm` uses the configured native-XLM
Stellar Asset Contract's `transfer_from` after a separate SAC approval. The UI must prepare and
submit the approval and the Soroban invocation as two sequential transactions; it must not try to
mix a classic payment operation with an invocation. CampusChain must remove the XLM option from
the direct Horizon send/scan route. This enforces the stated rule for all payments made through
the product, while documenting the protocol-level limitation for arbitrary external XLM payments.

## Food Ordering: extend `CampusService`

**Decision: implement food ordering as a `CampusService` module, not a separate contract.**

Food ordering shares the same merchant identity, CAMP token, university boundary, storage/TTL
policy, and approval-before-transfer flow as marketplace. A standalone contract would add one
more deployment and immutable configuration link plus another identity/token C2C client, without
isolating a present security or settlement boundary. Keeping it modular within `CampusService`
also lets an order use the existing service contract as a short-lived CAMP holder. Re-evaluate a
separate contract only if delivery partners, disputes, high-volume order processing, or
independent upgrade cadence become real requirements.

### Food storage

```rust
#[contracttype]
#[derive(Clone, Copy, Debug, Eq, PartialEq)]
#[repr(u32)]
pub enum FoodOrderStatus {
    Placed = 1,
    Preparing = 2,
    ReadyForPickup = 3,
    Completed = 4,
    Cancelled = 5,
}

#[contracttype]
#[derive(Clone, Debug, Eq, PartialEq)]
pub struct MenuItem {
    pub id: u64,
    pub merchant: Address,
    pub university_code: String,
    pub name: String,
    pub description: String,
    pub price_camp: i128,
    pub available: bool,
    pub created_at: u64,
    pub updated_at: u64,
}

#[contracttype]
#[derive(Clone, Debug, Eq, PartialEq)]
pub struct FoodOrder {
    pub id: u64,
    pub merchant: Address,
    pub student: Address,
    pub university_code: String,
    pub menu_item_id: u64,
    pub quantity: u32,
    pub unit_price_camp: i128,
    pub total_camp: i128,
    pub status: FoodOrderStatus,
    pub placed_at: u64,
    pub updated_at: u64,
}
```

Persistent keys are `MenuItem(u64)`, `FoodOrder(u64)`, and bounded secondary-index entries such
as `MenuItemByMerchant(merchant, sequence)` and `FoodOrderByMerchant(merchant, sequence)`.
Instance counters provide their monotonically increasing IDs. The order snapshots price and code;
later menu edits cannot alter an already placed order.

### Food functions and checks

| Function | Required behavior |
| --- | --- |
| `publish_menu_item(merchant, name, description, price_camp, available)` | Merchant auth; `assert_active_role(merchant, Merchant)`; profile category must be `FoodCanteen`; positive price. Stores merchant and code. |
| `update_menu_item(merchant, item_id, ...)` | Same verified Food/Canteen merchant and exact item ownership. Cannot change merchant or university code. |
| `place_order(student, item_id, quantity)` | Student auth; `assert_active_role(student, Student)` and `assert_active_same_university(student, item.merchant)`; item available and quantity positive. Moves `total_camp` from student to `CampusService` with `transfer_from`; creates `Placed` order. |
| `update_order_status(merchant, order_id, status)` | Merchant auth; merchant must own the order, remain a verified Food/Canteen merchant, and pass same-university check with the student. Valid forward transitions only: `Placed → Preparing → ReadyForPickup → Completed`. On `Completed`, release held CAMP to the merchant. |
| `cancel_order(caller, order_id)` | Performs the cancellation policy below, sets `Cancelled`, and refunds held CAMP to the student. It may never cancel `Completed`. |
| `get_menu_item`, `list_menu_items_by_merchant`, `get_food_order`, `list_food_orders_by_student`, `list_food_orders_by_merchant` | Bounded reads; private/order-specific reads should require the relevant participant. |

Holding CAMP until `Completed` is preferred to paying the merchant at `Placed`: it makes an
on-chain cancellation/refund deterministic and avoids requiring the merchant to approve a later
refund. The required product decision is whether a student may cancel only while `Placed`, and
whether a merchant may cancel at any non-completed state; the proposed default is student-only
while `Placed`, merchant at `Placed`, `Preparing`, or `ReadyForPickup`, with a full refund.

## Status and suspension policy

`Approved` is the only university state that passes active checks. `Rejected` and `Suspended`
block registrations and every new scoped action. Pending/rejected user profiles block every
product action.

Re-checking active status during escrow release/refund, food completion/cancellation, and ticket
redemption can strand already-funded obligations when a university is suspended. The safe default
proposal is:

* block new listings, orders, tickets, payments, registrations, and reward redemptions
  immediately;
* allow only **refund/cancellation** settlement of pre-existing escrow and food orders while
  suspended, using immutable stored counterparties and codes;
* do not release money to a seller/merchant or complete a new benefit while suspended.

This is intentionally called out for approval; it balances the lockout requirement against the
need not to trap user funds.

## Redeployment and migration impact

This is a **full redeployment**, not an in-place upgrade. `CampusIdentity` storage and ABI change
from `Admin` plus `Profile(verified: bool, university_id)` to the registry/profile model above.
More importantly, retaining its current `upgrade` endpoint is incompatible with the Platform
Admin immutability requirement. Updating the old WASM at the same address would retain legacy
entries, cannot safely reinterpret them, and would weaken the guarantee.

Every current application contract must receive a new address:

1. **CampusIdentity** — new storage schema, API, immutable Platform Admin, and no upgrade entry.
2. **CampusToken** — removes duplicated role state and adds the immutable identity link and CAMP
   university guard.
3. **CampusService** — imports the new Identity and Token interfaces; removes legacy university
   storage; adds university fields/checks and the food module.

There is no new Food contract under the chosen design. The native XLM Stellar Asset Contract is a
network-provided contract and is not redeployed. The deployment order is: build all WASMs; deploy
all three; initialize Identity with the preflight-checked platform address; initialize Token and
Service with the new addresses; then verify all immutable links by read-only calls. Update
`contracts/campus-service/wasm/` imports before building Service and replace all frontend fallback
contract IDs and `.env.local` values.

Because a new CampusToken address means a new CAMP ledger, existing CAMP balances and allowances
do not move automatically. The Phase 1 implementation needs an explicit snapshot-and-mint
migration procedure, with a fixed snapshot ledger and an auditable allocation list, or a
documented testnet reset. No old profile should be copied as verified: every user must register
under an approved university and undergo the new verification flow before receiving usable
migrated CAMP.

## Open questions requiring product decision

1. Is the proposed University Admin treatment correct: their profile is `Verified` at claim time,
   but is unusable solely because the university is `PendingApproval`? Or should Platform Admin
   approval separately change that profile from `Pending` to `Verified`?
2. Are roles permanently single-role and immutable as planned, or must one wallet be able to hold
   multiple scoped roles (for example, Student plus Event Organizer)? The requested enum implies
   one role, but that materially changes the profile schema and authorization API.
3. Who may buy an event ticket: only a verified Student, or any verified university-scoped role?
   The plan currently enforces the university boundary but leaves this role decision open.
4. Should `Suspended` be terminal, or must Platform Admin be able to restore a university to
   `Approved`? If restoration is required, add an explicit `reinstate_university` transition;
   `approve_university` should not silently double as reinstatement.
5. Please confirm the proposed settlement exception for suspension: refunds/cancellations remain
   available for funds already held, while releases/completions are blocked. A strict "no action"
   policy can strand CAMP in escrow.
6. Confirm the food cancellation policy: student only while `Placed`; merchant at any
   non-completed stage; full on-chain CAMP refund. Do you need partial refunds, pickup windows,
   order notes, taxes, or merchant stock quantities in Phase 1?
7. Is Merchant's category truly single-valued, and is `FoodCanteen` the exact category name? If a
   merchant may be both retail and food, use a bounded category bitset/vector instead.
8. Do scholarships and utility rewards become university-owned as proposed, or are either meant
   to be platform-global? A platform-global benefit conflicts with the stated rule that all
   university-scoped actions reject cross-university interactions and needs an explicit exception.
9. Is CAMP-only enforcement sufficient for the application, with XLM restricted through the
   CampusChain Soroban payment route? Stellar cannot prevent a user from making an external raw
   Horizon XLM payment to any account.
10. For redeployment, should testnet reset all CAMP balances, or should Phase 1 include the
    snapshot-and-mint migration procedure described above?

No contract or frontend implementation should begin until these decisions are reviewed.
