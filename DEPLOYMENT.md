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
CAMPUSCHAIN_ADMIN_KEY=deployer

# Stellar CLI network configuration
STELLAR_NETWORK=testnet
STELLAR_RPC_URL=https://soroban-testnet.stellar.org
STELLAR_NETWORK_PASSPHRASE="Test SDF Network ; September 2015"

# Deployed Contract IDs (Automatically updated by scripts/deploy.sh)
CAMPUS_IDENTITY_CONTRACT_ID=CBSP6PGVKP3OHV7CHFIVNYA6GA3WQ2VGWMGW4YTG7IF6FBEKUVFKNH6Q
CAMPUS_TOKEN_CONTRACT_ID=CCNX6UK6XNBXG63I75R5EVRHXQKD23ECUUJSH6NPV32OWJWJL72ZQCP2
CAMPUS_SERVICE_CONTRACT_ID=CATHDHIUADXXENVYN7Z2ABSERDYUGK7OQMWFODBW7I66HS43WSUZNGLL

# Platform Admin account (public key only)
CAMPUS_ADMIN_ADDRESS=GC6BMAHRKAWHPPI6T67QZV2CQIWG7DVJT47ZNZQUYF3L625G3OPNBBSQ
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
   ./deploy/init.sh <TOKEN_ID> <SERVICE_ID> <IDENTITY_ID> CAMPUSCHAIN_LOCAL local
   ```

---

## 4. Stellar Testnet Deployment (Repeatable Pipeline)

Contract deployment, initialization, and environment synchronization are fully automated in the testnet deployment pipeline.

To deploy all contracts to Testnet and auto-update configuration files:

1. **Configure your Admin Key** in Stellar CLI:
   ```bash
   stellar keys add --secret-key S_ADMIN_SECRET_KEY deployer
   ```

2. **Execute the deployment script**:
   ```bash
   CAMPUSCHAIN_ADMIN_KEY=deployer \
   NEXT_PUBLIC_CAMPUS_ADMIN_ADDRESS=GC6BMAHRKAWHPPI6T67QZV2CQIWG7DVJT47ZNZQUYF3L625G3OPNBBSQ \
   ./deploy/testnet.sh
   ```

### What `./deploy/testnet.sh` does automatically:
- Builds contracts in dependency order: `CampusIdentity` -> `CampusToken` -> `CampusService` (so cross-contract client imports are compiled with correct ABIs).
- Optimizes WASMs using `stellar contract optimize`.
- Deploys optimized WASM files to Stellar Testnet.
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
| **CampusIdentity** | `CBSP6PGVKP3OHV7CHFIVNYA6GA3WQ2VGWMGW4YTG7IF6FBEKUVFKNH6Q` | [StellarExpert ↗](https://stellar.expert/explorer/testnet/contract/CBSP6PGVKP3OHV7CHFIVNYA6GA3WQ2VGWMGW4YTG7IF6FBEKUVFKNH6Q) |
| **CampusToken** (CAMP) | `CCNX6UK6XNBXG63I75R5EVRHXQKD23ECUUJSH6NPV32OWJWJL72ZQCP2` | [StellarExpert ↗](https://stellar.expert/explorer/testnet/contract/CCNX6UK6XNBXG63I75R5EVRHXQKD23ECUUJSH6NPV32OWJWJL72ZQCP2) |
| **CampusService** | `CATHDHIUADXXENVYN7Z2ABSERDYUGK7OQMWFODBW7I66HS43WSUZNGLL` | [StellarExpert ↗](https://stellar.expert/explorer/testnet/contract/CATHDHIUADXXENVYN7Z2ABSERDYUGK7OQMWFODBW7I66HS43WSUZNGLL) |

---

## 6. Upgrading a Contract

`CampusToken` and `CampusService` contracts can be upgraded in-place without changing their contract IDs:

1. **Build updated WASM targets**:
   ```bash
   cargo build --target wasm32-unknown-unknown --release
   ```
2. **Install the new WASM on Testnet**:
   ```bash
   stellar contract install --wasm target/wasm32-unknown-unknown/release/campus_token.wasm --source deployer --network testnet
   ```
   *This outputs the new 32-byte Wasm Hash.*
3. **Execute the upgrade**:
   ```bash
   ./deploy/upgrade.sh <CONTRACT_ID> <NEW_WASM_PATH> deployer testnet
   ```
