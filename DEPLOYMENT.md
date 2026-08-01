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
CAMPUS_IDENTITY_CONTRACT_ID=CDGOBO2XIZMTEZWSGF5JILPKD7RELJXS5AQSFYANM2QWUJQ7ETJJM3CJ
CAMPUS_TOKEN_CONTRACT_ID=CC37FOQRDHKUKERLWJZDHQ2ZYSRGQ3JY42RXRAPUA6G2S4X5774XZQEV
CAMPUS_SERVICE_CONTRACT_ID=CBLZQKQ3OBMNJX57YARH3MDFQLHS2X4VJO2XNJNFC6P2NXYDLLYTSF6Q

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
| **CampusIdentity** | `CDGOBO2XIZMTEZWSGF5JILPKD7RELJXS5AQSFYANM2QWUJQ7ETJJM3CJ` | [StellarExpert ↗](https://stellar.expert/explorer/testnet/contract/CDGOBO2XIZMTEZWSGF5JILPKD7RELJXS5AQSFYANM2QWUJQ7ETJJM3CJ) |
| **CampusToken** (CAMP) | `CC37FOQRDHKUKERLWJZDHQ2ZYSRGQ3JY42RXRAPUA6G2S4X5774XZQEV` | [StellarExpert ↗](https://stellar.expert/explorer/testnet/contract/CC37FOQRDHKUKERLWJZDHQ2ZYSRGQ3JY42RXRAPUA6G2S4X5774XZQEV) |
| **CampusService** | `CBLZQKQ3OBMNJX57YARH3MDFQLHS2X4VJO2XNJNFC6P2NXYDLLYTSF6Q` | [StellarExpert ↗](https://stellar.expert/explorer/testnet/contract/CBLZQKQ3OBMNJX57YARH3MDFQLHS2X4VJO2XNJNFC6P2NXYDLLYTSF6Q) |

#### CampusIdentity

| Action | Transaction Hash | Explorer |
|---|---|---|
| WASM Upload | `ed1359c549f97a672c52e7bc579dfa7122e1f353e1c41a5e4e71a4d6dcfa5f22` | [View ↗](https://stellar.expert/explorer/testnet/tx/ed1359c549f97a672c52e7bc579dfa7122e1f353e1c41a5e4e71a4d6dcfa5f22) |
| Contract Instantiate | `b280460c61117776f7f81869ddc8810b64141aaeaf172c554d77d575b52c0790` | [View ↗](https://stellar.expert/explorer/testnet/tx/b280460c61117776f7f81869ddc8810b64141aaeaf172c554d77d575b52c0790) |
| `initialize()` | `8c2cacca2fbfa456bff8c726d22b9d465fd41238e695d570c1b888a247910de9` | [View ↗](https://stellar.expert/explorer/testnet/tx/8c2cacca2fbfa456bff8c726d22b9d465fd41238e695d570c1b888a247910de9) |

#### CampusToken

| Action | Transaction Hash | Explorer |
|---|---|---|
| WASM Upload | `8dbff51ae775973ab146b692a464007f02270d2e245a143a4e2221455265f92b` | [View ↗](https://stellar.expert/explorer/testnet/tx/8dbff51ae775973ab146b692a464007f02270d2e245a143a4e2221455265f92b) |
| Contract Instantiate | `9ba86932646865334c612dcb37c8f1804b3354a331f15b273d9cdde36b8f5eb8` | [View ↗](https://stellar.expert/explorer/testnet/tx/9ba86932646865334c612dcb37c8f1804b3354a331f15b273d9cdde36b8f5eb8) |
| `initialize()` | `8bc4e0d5139050bec8c063e91f7347dd97c7e567fc22dcfdf36b97080f75a42d` | [View ↗](https://stellar.expert/explorer/testnet/tx/8bc4e0d5139050bec8c063e91f7347dd97c7e567fc22dcfdf36b97080f75a42d) |

#### CampusService

| Action | Transaction Hash | Explorer |
|---|---|---|
| WASM Upload | `a9671a8e4a281fbff345ab6bc8b1cc1e35cf7e9bd3d69aa556c38fc95731b74c` | [View ↗](https://stellar.expert/explorer/testnet/tx/a9671a8e4a281fbff345ab6bc8b1cc1e35cf7e9bd3d69aa556c38fc95731b74c) |
| Contract Instantiate | `0ce93e2d1507814f0c5553c39bdcc1f5ba0d50f3be6cf8fb698e85b2a781fa90` | [View ↗](https://stellar.expert/explorer/testnet/tx/0ce93e2d1507814f0c5553c39bdcc1f5ba0d50f3be6cf8fb698e85b2a781fa90) |
| `initialize()` | `96f09b30998d4cfa6c36a6e5acd33150956c7100a72f7fda5cd7bd54cf0b2a8a` | [View ↗](https://stellar.expert/explorer/testnet/tx/96f09b30998d4cfa6c36a6e5acd33150956c7100a72f7fda5cd7bd54cf0b2a8a) |

### WASM Hashes

| Contract | WASM Hash |
|---|---|
| CampusIdentity | `06a3b6bedfdc4983af2f38011b96f08616e27536f769f306a531415404976119` |
| CampusToken | `82654bcdfe15c8477fd48c3c9dd2b9a46c6f3fd36026fbeeebc5c073155c2da5` |
| CampusService | `ad651b95b8e16b63cb5e3f25895cfa7730b264d5ab0d73b718933847870cf69c` |

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

