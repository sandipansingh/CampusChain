# CampusChain Deployment Guide

This document outlines the step-by-step instructions for compiling, deploying, initializing, and upgrading the CampusChain smart contracts on local test environments and the Stellar Testnet.

---

## 1. Prerequisites

Ensure you have the following tools installed locally:
- **Rust Toolchain**: `rustup target add wasm32-unknown-unknown`
- **Stellar CLI (>= 22.0)**: Install instructions at [developers.stellar.org/docs/tools/cli](https://developers.stellar.org/docs/tools/cli).
- **Docker**: Needed for running a local standalone Stellar network node.
- **Stellar Wallet**: freighter browser extension or equivalent to test the frontend locally.

---

## 2. Environment Variables

The deployment scripts read and write environment variables across these files:

### Root `.env` (Server-Side & Deploy Tooling)
Used by the local deployment and upgrade shell scripts. Create this file from `.env.example`:
```bash
# Admin keypair alias or secret key used by deploy scripts
# NEVER commit a real S... key.
CAMPUSCHAIN_ADMIN_KEY=campuschain-admin

# Stellar CLI network configuration
STELLAR_NETWORK=testnet
STELLAR_RPC_URL=https://soroban-testnet.stellar.org
STELLAR_NETWORK_PASSPHRASE="Test SDF Network ; September 2015"

# Deployed Contract IDs (Automatically updated by scripts/deploy.sh)
CAMPUS_IDENTITY_CONTRACT_ID=CCEFENQ6XHDVM5GHX63MFN3NBR5NCYRFBGEINDKYLQBESMV63OOTSUTQ
CAMPUS_TOKEN_CONTRACT_ID=CDHANNZGZKXEMKM5T2AF2EIHF3FLUCVLK57F4UX7ILQTUPR7NXF6THEN
CAMPUS_SERVICE_CONTRACT_ID=CD6FIIDFFTCJAJDN5ES57KGOXLI7VT64RRXL5ZB6WLSKQ2TPNUELMGFR

# Platform Admin account (public key only)
CAMPUS_ADMIN_ADDRESS=GDLYWFB7IOMPWZTFYPTQZND4VCKUDEBXRDHL3DBQHRNV2GVILMNZXRAC
```

### Frontend `.env.local`
Automatically written and updated by `./scripts/deploy.sh` to configure the Next.js client application with the latest contract IDs and network parameters.

---

## 3. Local standalone Deployment (Docker Standalone)

For local development without Stellar Testnet, run a standalone network:

1. **Start the local Docker container**:
   ```bash
   docker run --rm -it \
     -p 8000:8000 \
     --name stellar-standalone \
     stellar/quickstart:latest \
     --standalone \
     --enable-soroban-rpc
   ```

2. **Run the local deployment pipeline**:
   In another terminal, run:
   ```bash
   ./deploy/local.sh
   ```
   *This script generates a local key alias, funds it from the local friendbot, compiles the contracts, and deploys them to the local node.*

3. **Initialize the contracts**:
   At the end of `./deploy/local.sh`, it prints the contract IDs. Use them to initialize the contracts:
   ```bash
   ./deploy/init.sh <TOKEN_ID> <SERVICE_ID> <IDENTITY_ID> campuschain-local local
   ```

---

## 4. Stellar Testnet Deployment (Repeatable Pipeline)

Contract deployment, initialization, and environment synchronization are fully automated in the testnet deployment pipeline.

To deploy all contracts to Testnet and auto-update configuration files:

1. **Generate your Admin Key** in Stellar CLI (this automatically creates and funds a new testnet account):
   ```bash
   stellar keys generate campuschain-admin --network testnet
   ```
   *(Alternative: If you already have a secret key from Freighter, you can import it instead: `stellar keys add --secret-key S_SECRET_KEY campuschain-admin`)*

2. **Execute the deployment script**:
   ```bash
   CAMPUSCHAIN_ADMIN_KEY=campuschain-admin ./deploy/testnet.sh
   ```

### What `./deploy/testnet.sh` does automatically:
- Builds and optimizes contracts in dependency order: `CampusIdentity` -> `CampusToken` -> `CampusService` (using `stellar contract build --optimize`).
- Uploads optimized WASM files to Stellar Testnet.
- Initializes all contracts (Identity, Token, Service) with immutable platform admin and cross-contract link addresses.
- Extracts contract IDs, WASM hashes, and transaction hashes for upload, instantiation, and initialization.
- **Updates configuration files automatically**:
  - Writes new contract addresses and transaction logs to root `.env`, `.env.example`, `frontend/.env.example`, and `frontend/.env.local`.
  - Rewrites the Contract Addresses & Verification tables inside `README.md` and this `DEPLOYMENT.md` with the new transaction details.

---

## 5. Deployed Contracts (Testnet)

This is the current active deployment state updated by the deploy script:

| Contract | Address | Explorer |
|---|---|---|
| **CampusIdentity** | `CCEFENQ6XHDVM5GHX63MFN3NBR5NCYRFBGEINDKYLQBESMV63OOTSUTQ` | [StellarExpert ↗](https://stellar.expert/explorer/testnet/contract/CCEFENQ6XHDVM5GHX63MFN3NBR5NCYRFBGEINDKYLQBESMV63OOTSUTQ) |
| **CampusToken** (CAMP) | `CDHANNZGZKXEMKM5T2AF2EIHF3FLUCVLK57F4UX7ILQTUPR7NXF6THEN` | [StellarExpert ↗](https://stellar.expert/explorer/testnet/contract/CDHANNZGZKXEMKM5T2AF2EIHF3FLUCVLK57F4UX7ILQTUPR7NXF6THEN) |
| **CampusService** | `CD6FIIDFFTCJAJDN5ES57KGOXLI7VT64RRXL5ZB6WLSKQ2TPNUELMGFR` | [StellarExpert ↗](https://stellar.expert/explorer/testnet/contract/CD6FIIDFFTCJAJDN5ES57KGOXLI7VT64RRXL5ZB6WLSKQ2TPNUELMGFR) |

#### CampusIdentity

| Action | Transaction Hash | Explorer |
|---|---|---|
| WASM Upload | `` | [View ↗](https://stellar.expert/explorer/testnet/tx/) |
| Contract Instantiate | `06a3b6bedfdc4983af2f38011b96f08616e27536f769f306a531415404976119` | [View ↗](https://stellar.expert/explorer/testnet/tx/06a3b6bedfdc4983af2f38011b96f08616e27536f769f306a531415404976119) |
| `initialize()` | `93583ba2de99520370c697a414db410b30d42d6bef8d5cecd3bfa08ff9980b24` | [View ↗](https://stellar.expert/explorer/testnet/tx/93583ba2de99520370c697a414db410b30d42d6bef8d5cecd3bfa08ff9980b24) |

#### CampusToken

| Action | Transaction Hash | Explorer |
|---|---|---|
| WASM Upload | `` | [View ↗](https://stellar.expert/explorer/testnet/tx/) |
| Contract Instantiate | `82654bcdfe15c8477fd48c3c9dd2b9a46c6f3fd36026fbeeebc5c073155c2da5` | [View ↗](https://stellar.expert/explorer/testnet/tx/82654bcdfe15c8477fd48c3c9dd2b9a46c6f3fd36026fbeeebc5c073155c2da5) |
| `initialize()` | `ecab4ab809bad100233af114f69fa24c9ae361bc67495679c990a41fcd68a3b4` | [View ↗](https://stellar.expert/explorer/testnet/tx/ecab4ab809bad100233af114f69fa24c9ae361bc67495679c990a41fcd68a3b4) |

#### CampusService

| Action | Transaction Hash | Explorer |
|---|---|---|
| WASM Upload | `c8f40d109c8f4c1e820cf7839f8b1b5bb5badf29c9798d7ee6da5086e870af5b` | [View ↗](https://stellar.expert/explorer/testnet/tx/c8f40d109c8f4c1e820cf7839f8b1b5bb5badf29c9798d7ee6da5086e870af5b) |
| Contract Instantiate | `c212e3ebfce9375485588ce5b98b29320baed37cc4a10cf42435ae32716b8b50` | [View ↗](https://stellar.expert/explorer/testnet/tx/c212e3ebfce9375485588ce5b98b29320baed37cc4a10cf42435ae32716b8b50) |
| `initialize()` | `aa714d423ec540d8f1d1e306af4c1d1847974bf8ac2ac745c8f850aa9f73ae3c` | [View ↗](https://stellar.expert/explorer/testnet/tx/aa714d423ec540d8f1d1e306af4c1d1847974bf8ac2ac745c8f850aa9f73ae3c) |

### WASM Hashes

| Contract | WASM Hash |
|---|---|
| CampusIdentity | `06a3b6bedfdc4983af2f38011b96f08616e27536f769f306a531415404976119` |
| CampusToken | `82654bcdfe15c8477fd48c3c9dd2b9a46c6f3fd36026fbeeebc5c073155c2da5` |
| CampusService | `c212e3ebfce9375485588ce5b98b29320baed37cc4a10cf42435ae32716b8b50` |

---

## 6. Upgrading or Redeploying on Code Changes

When you make changes to the smart contract Rust code, you have two options to deploy those changes:

### Approach A: Fresh Redeployment (New Contract IDs)
If you want to start with a completely fresh database state, or if your changes broke storage layout compatibility (which makes upgrades impossible), perform a fresh redeployment.

Simply run the deployment script again:
```bash
CAMPUSCHAIN_ADMIN_KEY=campuschain-admin ./deploy/testnet.sh
```
**What this does automatically:**
- Compiles the updated Rust contracts.
- Deploys brand new contract instances (generating new contract IDs).
- Re-runs the initialization sequence.
- Updates all environment configuration files (`.env`, `frontend/.env.local`) and documentation with the new addresses and transaction hashes.

---

### Approach B: In-Place Upgrade (Preserving State & Contract IDs)
If you want to update contract logic while keeping the same contract addresses and preserving existing on-chain user state, perform an in-place upgrade (supported by `CampusToken` and `CampusService`).

1. **Build updated WASM targets**:
   ```bash
   stellar contract build --optimize
   ```
2. **Install the new WASM on Testnet** (this registers the new code and returns a Wasm Hash):
   ```bash
   stellar contract upload --wasm target/wasm32v1-none/release/campus_token.wasm --source campuschain-admin --network testnet
   ```
3. **Execute the upgrade** (invokes the `upgrade` method on-chain to point the existing contract ID to the new WASM code):
   ```bash
   ./deploy/upgrade.sh <CONTRACT_ID> <NEW_WASM_PATH> campuschain-admin testnet
   ```

---

## 7. Onboarding Demo & Setup

To quickly set up and test the RBAC onboarding workflow on Stellar Testnet, you can run the provided demo onboarding script. 

The script will automatically:
1. Load contract IDs from your `.env` configuration file.
2. Generate and fund demo keys: `demo-univ-admin` and `demo-student`.
3. Register and approve a demo university (`DEMO-UNI`).
4. Register a student profile for the demo student (`demo-student`).
5. Verify the student profile using the university admin key (`demo-univ-admin`).
6. Query the verified student profile using the student key, proving the verified status on-chain.

To execute the onboarding demo:
```bash
./scripts/onboard_demo.sh
```

---

## 8. Feedback & Responses

We value your feedback on the CampusChain platform! Please use the links below to submit feedback or view the responses:

*   📝 **Submit Feedback:** [Google Form ↗](https://forms.gle/u2BEwqcTnCpGBBUg8)
*   📊 **View Responses:** [Google Sheets Responses Dashboard ↗](https://docs.google.com/spreadsheets/d/1HNzt2QfXsF_n4LzUpJnpaSk4cKBfVsngAfEyxHbXqkU/edit?usp=sharing)

