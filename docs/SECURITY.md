# CampusChain Security Policy & Threat Model

This document outlines the security practices, threat model, and smart contract audit checklists implemented in the CampusChain platform.

---

## 1. Threat Model

We identify the following attack vectors and detail our mitigation strategies:

### Reentrancy & Contract Interaction Risks
* **Threat**: A malicious contract intercepts control flow during cross-contract calls to drain funds or corrupt state.
* **Mitigation**: Soroban contracts execute sequentially; there is no concurrent reentrancy. We enforce strict state updates *before* triggering any cross-contract calls. Balance updates occur within isolated transaction boundaries.

### Front-Running & Transaction Manipulation
* **Threat**: Malicious nodes or users intercept a pending transaction (e.g. ticket purchase or escrow release) and execute their own transaction beforehand to hijack the state.
* **Mitigation**: We use unique transaction nonces, strict authorization signatures, and validation of expiration ledgers. All ticket sales and escrow requests include maximum price limits or expiration checks to prevent exploitation of stale states.

### Unauthorized Token Minting
* **Threat**: An unauthorized user mints campus reward tokens or modifies student roles.
* **Mitigation**: We enforce strict administrative access checks. Role modifications and token minting require authorization from the primary university admin address (`admin.require_auth()`).

### Denial of Service (DoS) via Unbounded Storage
* **Threat**: Storing transaction histories or user-generated data in contract `Instance` storage causes storage size to grow unbounded, making the contract exceed ledger limits and lock up.
* **Mitigation**: We store all unbounded lists (balances, individual escrows, tickets) in `Persistent` storage. The `Instance` storage contains only static configuration and global counters.

---

## 2. Smart Contract Audit Checklist

Before deploying any Soroban smart contracts, verify each item in this checklist:

### Authorization
- [ ] Every state-changing function verifies authority (`require_auth()`) of the correct address.
- [ ] Inter-contract calls verify signatures of the calling contract/user if the calling contract acts on behalf of the user.

### Storage & State Management
- [ ] No unbounded collections are stored inside `Instance` storage.
- [ ] Storage keys are defined using typed `enum`s with `#[contracttype]` to avoid key collisions.
- [ ] Transient and Temporary storage types are only used for data that can expire safely.
- [ ] TTL (Time-To-Live) extension is handled for persistent entries to prevent accidental archival.

### Math & Overflow Checks
- [ ] All token calculations use `i128` (or `u128`) values.
- [ ] Arithmetic operations use checked math (`checked_add`, `checked_sub`, `checked_mul`) or result in panic on overflow.

### Upgrade Mechanism
- [ ] The `upgrade` function is strictly locked behind `Admin` authorization.
- [ ] The upgrade script has been tested to verify that existing state is preserved.
