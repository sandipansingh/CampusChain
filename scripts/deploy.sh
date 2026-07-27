#!/usr/bin/env bash

# Exit immediately if a command exits with a non-zero status
set -e

echo "========================================================="
echo " CAMPUSCHAIN - SOROBAN SMART CONTRACT DEPLOYMENT PIPELINE"
echo "========================================================="

# Defaults
NETWORK="testnet"
RPC_URL="https://soroban-testnet.stellar.org"
PASSPHRASE="Test SDF Network ; September 2015"
NATIVE_TOKEN="CDLZFC3SYJYDZT7K67VZ75HPJVIEUVNIXF47ZG2FB2RMQQVU2HHGCYSC"

if [ -z "$CAMPUSCHAIN_ADMIN_KEY" ]; then
    echo "Usage: CAMPUSCHAIN_ADMIN_KEY=<secret_key_or_name> ./scripts/deploy.sh"
    echo "  Or export CAMPUSCHAIN_ADMIN_KEY in your shell profile."
    exit 1
fi
ADMIN_KEY="$CAMPUSCHAIN_ADMIN_KEY"

# Check if stellar CLI is installed
if ! command -v stellar &> /dev/null; then
    echo "ERROR: 'stellar' CLI is not installed. Please install it first."
    exit 1
fi

echo "Step 1: Compiling Soroban Contracts..."
cargo build --target wasm32-unknown-unknown --release

echo "Step 2: Optimizing WASM targets..."
stellar contract optimize --wasm target/wasm32-unknown-unknown/release/campus_identity.wasm
stellar contract optimize --wasm target/wasm32-unknown-unknown/release/campus_token.wasm
stellar contract optimize --wasm target/wasm32-unknown-unknown/release/campus_service.wasm

# Copy optimized WASMs back to campus-service imports directory (just in case)
cp target/wasm32-unknown-unknown/release/campus_identity.optimized.wasm contracts/campus-service/wasm/campus_identity.wasm
cp target/wasm32-unknown-unknown/release/campus_token.optimized.wasm contracts/campus-service/wasm/campus_token.wasm

echo "Step 3: Deploying Contracts to Network: $NETWORK..."
ADMIN_ADDRESS=$(stellar keys address "$ADMIN_KEY")
echo "Admin Address: $ADMIN_ADDRESS"

# ── Deploy CampusIdentity ──
echo "Installing CampusIdentity WASM..."
IDENTITY_WASM_HASH=$(stellar contract install \
    --wasm target/wasm32-unknown-unknown/release/campus_identity.optimized.wasm \
    --source-account "$ADMIN_KEY" \
    --network "$NETWORK")
echo "CampusIdentity WASM Hash: $IDENTITY_WASM_HASH"

echo "Instantiating CampusIdentity Contract..."
IDENTITY_CONTRACT_ID=$(stellar contract deploy \
    --wasm-hash "$IDENTITY_WASM_HASH" \
    --source-account "$ADMIN_KEY" \
    --network "$NETWORK")
echo "CampusIdentity Contract ID: $IDENTITY_CONTRACT_ID"

echo "Initializing CampusIdentity..."
stellar contract invoke \
    --id "$IDENTITY_CONTRACT_ID" \
    --source-account "$ADMIN_KEY" \
    --network "$NETWORK" \
    -- \
    initialize \
    --admin "$ADMIN_ADDRESS" \
    --full_name "University Admin" \
    --university_id "ADMIN" \
    --department "Administration"

# ── Deploy CampusToken ──
echo "Installing CampusToken WASM..."
TOKEN_WASM_HASH=$(stellar contract install \
    --wasm target/wasm32-unknown-unknown/release/campus_token.optimized.wasm \
    --source-account "$ADMIN_KEY" \
    --network "$NETWORK")
echo "CampusToken WASM Hash: $TOKEN_WASM_HASH"

echo "Instantiating CampusToken Contract..."
TOKEN_CONTRACT_ID=$(stellar contract deploy \
    --wasm-hash "$TOKEN_WASM_HASH" \
    --source-account "$ADMIN_KEY" \
    --network "$NETWORK")
echo "CampusToken Contract ID: $TOKEN_CONTRACT_ID"

echo "Initializing CampusToken..."
stellar contract invoke \
    --id "$TOKEN_CONTRACT_ID" \
    --source-account "$ADMIN_KEY" \
    --network "$NETWORK" \
    -- \
    initialize \
    --admin "$ADMIN_ADDRESS" \
    --decimals 7 \
    --name "CampusChain Token" \
    --symbol "CAMP"

# ── Deploy CampusService ──
echo "Installing CampusService WASM..."
SERVICE_WASM_HASH=$(stellar contract install \
    --wasm target/wasm32-unknown-unknown/release/campus_service.optimized.wasm \
    --source-account "$ADMIN_KEY" \
    --network "$NETWORK")
echo "CampusService WASM Hash: $SERVICE_WASM_HASH"

echo "Instantiating CampusService Contract..."
SERVICE_CONTRACT_ID=$(stellar contract deploy \
    --wasm-hash "$SERVICE_WASM_HASH" \
    --source-account "$ADMIN_KEY" \
    --network "$NETWORK")
echo "CampusService Contract ID: $SERVICE_CONTRACT_ID"

echo "Initializing CampusService..."
stellar contract invoke \
    --id "$SERVICE_CONTRACT_ID" \
    --source-account "$ADMIN_KEY" \
    --network "$NETWORK" \
    -- \
    initialize \
    --admin "$ADMIN_ADDRESS" \
    --token_contract "$TOKEN_CONTRACT_ID"

# ── Wire Inter-Contract Connections ──
echo "Wiring CampusToken service contract link..."
stellar contract invoke \
    --id "$TOKEN_CONTRACT_ID" \
    --source-account "$ADMIN_KEY" \
    --network "$NETWORK" \
    -- \
    set_service_contract \
    --admin "$ADMIN_ADDRESS" \
    --service_contract "$SERVICE_CONTRACT_ID"

echo "Wiring CampusService identity contract link..."
stellar contract invoke \
    --id "$SERVICE_CONTRACT_ID" \
    --source-account "$ADMIN_KEY" \
    --network "$NETWORK" \
    -- \
    set_identity_contract \
    --admin "$ADMIN_ADDRESS" \
    --identity_contract "$IDENTITY_CONTRACT_ID"

echo "Wiring CampusService native token link..."
stellar contract invoke \
    --id "$SERVICE_CONTRACT_ID" \
    --source-account "$ADMIN_KEY" \
    --network "$NETWORK" \
    -- \
    set_native_token \
    --admin "$ADMIN_ADDRESS" \
    --native_token "$NATIVE_TOKEN"

echo "========================================================="
echo " DEPLOYMENT COMPLETED SUCCESSFULLY"
echo "========================================================="
echo "CampusIdentity ID: $IDENTITY_CONTRACT_ID"
echo "CampusToken ID:    $TOKEN_CONTRACT_ID"
echo "CampusService ID:  $SERVICE_CONTRACT_ID"
echo ""
echo "Updating frontend environment variables..."

ENV_FILE="frontend/.env.local"
echo "NEXT_PUBLIC_STELLAR_RPC_URL=\"$RPC_URL\"" > "$ENV_FILE"
echo "NEXT_PUBLIC_STELLAR_PASSPHRASE=\"$PASSPHRASE\"" >> "$ENV_FILE"
echo "NEXT_PUBLIC_CAMPUS_IDENTITY_CONTRACT_ID=\"$IDENTITY_CONTRACT_ID\"" >> "$ENV_FILE"
echo "NEXT_PUBLIC_CAMPUS_TOKEN_CONTRACT_ID=\"$TOKEN_CONTRACT_ID\"" >> "$ENV_FILE"
echo "NEXT_PUBLIC_CAMPUS_SERVICE_CONTRACT_ID=\"$SERVICE_CONTRACT_ID\"" >> "$ENV_FILE"
echo "NEXT_PUBLIC_CAMPUS_ADMIN_ADDRESS=\"$ADMIN_ADDRESS\"" >> "$ENV_FILE"

echo "Env file $ENV_FILE has been updated."
