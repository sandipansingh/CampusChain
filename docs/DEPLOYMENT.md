# CampusChain Deployment Guide

This document outlines instructions for compiling, deploying, initializing, and upgrading the CampusChain smart contracts on local test environments and the Stellar Testnet.

---

## 1. Prerequisites

Ensure you have the following tools installed locally:
- **Rust Toolchain**: `rustup target add wasm32-unknown-unknown`
- **Stellar CLI**: Follow installation instructions at [developers.stellar.org](https://developers.stellar.org/docs/tools/cli).
- **Docker**: Needed for running a local standalone Stellar network node.

---

## 2. Environment Variables

Create a `.env` file in the root directory based on `.env.example`:

```bash
# Network Settings
STELLAR_NETWORK="testnet"
STELLAR_RPC_URL="https://soroban-testnet.stellar.org"
STELLAR_NETWORK_PASSPHRASE="Test SDF Network ; September 2015"

# Accounts
ADMIN_SECRET_KEY="S..."
ADMIN_PUBLIC_KEY="G..."

# Deployed Contract Addresses (Populated after deployment)
CAMPUS_TOKEN_CONTRACT_ID=""
CAMPUS_SERVICE_CONTRACT_ID=""
```

---

## 3. Local Development Deployment (Standalone)

Start a local sandbox network:
```bash
docker run --rm -it \
  -p 8000:8000 \
  --name stellar-standalone \
  stellar/quickstart:latest \
  --standalone \
  --enable-soroban-rpc
```

### Steps to Deploy Locally
1. **Configure local network in Stellar CLI**:
   ```bash
   stellar network add --rpc-url http://localhost:8000/soroban/rpc --passphrase "Standalone Network ; Latitude 0.0" standalone
   ```
2. **Generate admin identity**:
   ```bash
   stellar keys generate --network standalone admin
   ```
3. **Build smart contracts**:
   ```bash
   stellar contract build
   ```
4. **Deploy contracts**:
   ```bash
   stellar contract deploy --wasm target/wasm32-unknown-unknown/release/campus_token.wasm --source admin --network standalone
   stellar contract deploy --wasm target/wasm32-unknown-unknown/release/campus_service.wasm --source admin --network standalone
   ```

---

## 4. Stellar Testnet Deployment

1. **Configure testnet in Stellar CLI**:
   ```bash
   stellar network add --rpc-url https://soroban-testnet.stellar.org --passphrase "Test SDF Network ; September 2015" testnet
   ```
2. **Configure your Deployer Key**:
   - Save your secret key to Stellar CLI keys database:
     ```bash
     stellar keys add --secret-key ADMIN_SECRET_KEY deployer
     ```
3. **Build the contracts**:
   ```bash
   stellar contract build
   ```
4. **Deploy `CampusToken`**:
   ```bash
   stellar contract deploy --wasm target/wasm32-unknown-unknown/release/campus_token.wasm --source deployer --network testnet
   ```
   *Record the printed contract ID (e.g. `CC...`). This is `CAMPUS_TOKEN_CONTRACT_ID`.*
5. **Deploy `CampusService`**:
   ```bash
   stellar contract deploy --wasm target/wasm32-unknown-unknown/release/campus_service.wasm --source deployer --network testnet
   ```
   *Record the printed contract ID (e.g. `CS...`). This is `CAMPUS_SERVICE_CONTRACT_ID`.*

---

## 5. Initialization Flow

After deployment, the contracts must be initialized.

### 1. Initialize `CampusToken`
```bash
stellar contract invoke \
  --id CAMPUS_TOKEN_CONTRACT_ID \
  --source deployer \
  --network testnet \
  -- \
  initialize \
  --admin G_ADMIN_PUBLIC_KEY \
  --name "CampusChain Token" \
  --symbol "CAMP" \
  --decimals 7
```

### 2. Initialize `CampusService`
```bash
stellar contract invoke \
  --id CAMPUS_SERVICE_CONTRACT_ID \
  --source deployer \
  --network testnet \
  -- \
  initialize \
  --admin G_ADMIN_PUBLIC_KEY \
  --token_contract CAMPUS_TOKEN_CONTRACT_ID
```

---

## 6. Upgrading a Contract

1. **Build the updated Wasm**:
   ```bash
   stellar contract build
   ```
2. **Install the new Wasm onto the network**:
   ```bash
   stellar contract install --wasm target/wasm32-unknown-unknown/release/campus_token.wasm --source deployer --network testnet
   ```
   *This outputs the new 32-byte Wasm Hash.*
3. **Call `upgrade`**:
   ```bash
   stellar contract invoke \
     --id CAMPUS_TOKEN_CONTRACT_ID \
     --source deployer \
     --network testnet \
     -- \
     upgrade \
     --new_wasm_hash NEW_WASM_HASH
   ```
