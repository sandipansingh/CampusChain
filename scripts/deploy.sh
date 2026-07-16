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
ADMIN_KEY="SA5..." # Replace with actual secret key or load from env

# Check if stellar CLI is installed
if ! command -v stellar &> /dev/null; then
    echo "ERROR: 'stellar' CLI is not installed. Please install it first."
    exit 1
fi

echo "Step 1: Compiling Soroban Contracts..."
cargo build --target wasm32-unknown-unknown --release

echo "Step 2: Optimizing WASM targets..."
stellar contract optimize --wasm target/wasm32-unknown-unknown/release/campus_token.wasm
stellar contract optimize --wasm target/wasm32-unknown-unknown/release/campus_service.wasm

echo "Step 3: Deploying Contracts to Network: $NETWORK..."

# Deploy CampusToken
echo "Installing CampusToken WASM..."
TOKEN_WASM_HASH=$(stellar contract install \
    --wasm target/wasm32-unknown-unknown/release/campus_token.optimized.wasm \
    --source-account "$ADMIN_KEY" \
    --network "$NETWORK")

echo "WASM Hash: $TOKEN_WASM_HASH"

echo "Instantiating CampusToken Contract..."
TOKEN_CONTRACT_ID=$(stellar contract deploy \
    --wasm-hash "$TOKEN_WASM_HASH" \
    --source-account "$ADMIN_KEY" \
    --network "$NETWORK")

echo "CampusToken Contract ID: $TOKEN_CONTRACT_ID"

# Initialize CampusToken (initialize method: admin, decimals, name, symbol)
echo "Initializing CampusToken..."
# Setup admin address (derived from ADMIN_KEY)
ADMIN_ADDRESS=$(stellar keys address "$ADMIN_KEY")

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

# Deploy CampusService
echo "Installing CampusService WASM..."
SERVICE_WASM_HASH=$(stellar contract install \
    --wasm target/wasm32-unknown-unknown/release/campus_service.optimized.wasm \
    --source-account "$ADMIN_KEY" \
    --network "$NETWORK")

echo "WASM Hash: $SERVICE_WASM_HASH"

echo "Instantiating CampusService Contract..."
SERVICE_CONTRACT_ID=$(stellar contract deploy \
    --wasm-hash "$SERVICE_WASM_HASH" \
    --source-account "$ADMIN_KEY" \
    --network "$NETWORK")

echo "CampusService Contract ID: $SERVICE_CONTRACT_ID"

# Initialize CampusService (initialize method: token_id)
echo "Initializing CampusService..."
stellar contract invoke \
    --id "$SERVICE_CONTRACT_ID" \
    --source-account "$ADMIN_KEY" \
    --network "$NETWORK" \
    -- \
    initialize \
    --token_id "$TOKEN_CONTRACT_ID"

echo "========================================================="
echo " DEPLOYMENT COMPLETED SUCCESSFULLY"
echo "========================================================="
echo "CampusToken ID: $TOKEN_CONTRACT_ID"
echo "CampusService ID: $SERVICE_CONTRACT_ID"
echo ""
echo "Updating frontend environment variables..."

ENV_FILE="frontend/.env.local"
echo "NEXT_PUBLIC_STELLAR_RPC_URL=\"$RPC_URL\"" > "$ENV_FILE"
echo "NEXT_PUBLIC_STELLAR_PASSPHRASE=\"$PASSPHRASE\"" >> "$ENV_FILE"
echo "NEXT_PUBLIC_CAMPUS_TOKEN_CONTRACT_ID=\"$TOKEN_CONTRACT_ID\"" >> "$ENV_FILE"
echo "NEXT_PUBLIC_CAMPUS_SERVICE_CONTRACT_ID=\"$SERVICE_CONTRACT_ID\"" >> "$ENV_FILE"

echo "Env file $ENV_FILE has been updated."
