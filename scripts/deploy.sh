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

if [ -z "$NEXT_PUBLIC_CAMPUS_ADMIN_ADDRESS" ]; then
    echo "ERROR: NEXT_PUBLIC_CAMPUS_ADMIN_ADDRESS must be set to the immutable Platform Admin address."
    exit 1
fi
PLATFORM_ADMIN_ADDRESS="$NEXT_PUBLIC_CAMPUS_ADMIN_ADDRESS"

# Check if stellar CLI is installed
if ! command -v stellar &> /dev/null; then
    echo "ERROR: 'stellar' CLI is not installed. Please install it first."
    exit 1
fi

# Helper to run stellar CLI command, capture stdout/stderr, and extract transaction hashes
run_stellar_cmd() {
    local cmd_log="/tmp/stellar_cmd.log"
    rm -f "$cmd_log"
    
    # Run the command, capture stdout, redirect stderr to cmd_log
    # We temporarily disable 'set -e' to handle errors ourselves
    set +e
    local stdout
    stdout=$( "$@" 2> "$cmd_log" )
    local exit_code=$?
    set -e
    
    # Print stderr to terminal so the user still sees transaction progress
    cat "$cmd_log" >&2
    
    if [ $exit_code -ne 0 ]; then
        echo "ERROR: Command failed with exit code $exit_code: $*" >&2
        exit $exit_code
    fi
    
    # Extract transaction hash from cmd_log (any 64-char hex string)
    local tx_hash=""
    tx_hash=$(grep -oE '\b[0-9a-fA-F]{64}\b' "$cmd_log" | head -n 1 || true)
    
    # Output stdout and tx_hash separated by a pipe
    echo "$stdout|$tx_hash"
}

echo "Step 1: Compiling Soroban Contracts and refreshing inter-contract interfaces..."
# CampusToken imports Identity, and CampusService imports both. Build in dependency
# order so contractimport! always consumes the current ABI rather than a stale WASM.
cargo build -p campus-identity --target wasm32-unknown-unknown --release
cp target/wasm32-unknown-unknown/release/campus_identity.wasm contracts/campus-service/wasm/campus_identity.wasm
cargo build -p campus-token --target wasm32-unknown-unknown --release
cp target/wasm32-unknown-unknown/release/campus_token.wasm contracts/campus-service/wasm/campus_token.wasm
cargo build -p campus-service --target wasm32-unknown-unknown --release

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
if [ "$ADMIN_ADDRESS" != "$PLATFORM_ADMIN_ADDRESS" ]; then
    echo "ERROR: CAMPUSCHAIN_ADMIN_KEY address does not match NEXT_PUBLIC_CAMPUS_ADMIN_ADDRESS."
    exit 1
fi

# ── Deploy CampusIdentity ──
echo "Installing CampusIdentity WASM..."
res=$(run_stellar_cmd stellar contract install \
    --wasm target/wasm32-unknown-unknown/release/campus_identity.optimized.wasm \
    --source-account "$ADMIN_KEY" \
    --network "$NETWORK")
IDENTITY_WASM_HASH=$(echo "$res" | cut -d'|' -f1)
IDENTITY_INSTALL_TX=$(echo "$res" | cut -d'|' -f2)
echo "CampusIdentity WASM Hash: $IDENTITY_WASM_HASH"
echo "CampusIdentity Install Tx: $IDENTITY_INSTALL_TX"

echo "Instantiating CampusIdentity Contract..."
res=$(run_stellar_cmd stellar contract deploy \
    --wasm-hash "$IDENTITY_WASM_HASH" \
    --source-account "$ADMIN_KEY" \
    --network "$NETWORK")
IDENTITY_CONTRACT_ID=$(echo "$res" | cut -d'|' -f1)
IDENTITY_DEPLOY_TX=$(echo "$res" | cut -d'|' -f2)
echo "CampusIdentity Contract ID: $IDENTITY_CONTRACT_ID"
echo "CampusIdentity Deploy Tx: $IDENTITY_DEPLOY_TX"

echo "Initializing CampusIdentity..."
res=$(run_stellar_cmd stellar contract invoke \
    --id "$IDENTITY_CONTRACT_ID" \
    --source-account "$ADMIN_KEY" \
    --network "$NETWORK" \
    -- \
    initialize \
    --platform_admin "$PLATFORM_ADMIN_ADDRESS" \
    --platform_admin_name "CampusChain Platform Admin")
IDENTITY_INIT_TX=$(echo "$res" | cut -d'|' -f2)
echo "CampusIdentity Init Tx: $IDENTITY_INIT_TX"

# ── Deploy CampusToken ──
echo "Installing CampusToken WASM..."
res=$(run_stellar_cmd stellar contract install \
    --wasm target/wasm32-unknown-unknown/release/campus_token.optimized.wasm \
    --source-account "$ADMIN_KEY" \
    --network "$NETWORK")
TOKEN_WASM_HASH=$(echo "$res" | cut -d'|' -f1)
TOKEN_INSTALL_TX=$(echo "$res" | cut -d'|' -f2)
echo "CampusToken WASM Hash: $TOKEN_WASM_HASH"
echo "CampusToken Install Tx: $TOKEN_INSTALL_TX"

echo "Instantiating CampusToken Contract..."
res=$(run_stellar_cmd stellar contract deploy \
    --wasm-hash "$TOKEN_WASM_HASH" \
    --source-account "$ADMIN_KEY" \
    --network "$NETWORK")
TOKEN_CONTRACT_ID=$(echo "$res" | cut -d'|' -f1)
TOKEN_DEPLOY_TX=$(echo "$res" | cut -d'|' -f2)
echo "CampusToken Contract ID: $TOKEN_CONTRACT_ID"
echo "CampusToken Deploy Tx: $TOKEN_DEPLOY_TX"

# ── Deploy CampusService ──
echo "Installing CampusService WASM..."
res=$(run_stellar_cmd stellar contract install \
    --wasm target/wasm32-unknown-unknown/release/campus_service.optimized.wasm \
    --source-account "$ADMIN_KEY" \
    --network "$NETWORK")
SERVICE_WASM_HASH=$(echo "$res" | cut -d'|' -f1)
SERVICE_INSTALL_TX=$(echo "$res" | cut -d'|' -f2)
echo "CampusService WASM Hash: $SERVICE_WASM_HASH"
echo "CampusService Install Tx: $SERVICE_INSTALL_TX"

echo "Instantiating CampusService Contract..."
res=$(run_stellar_cmd stellar contract deploy \
    --wasm-hash "$SERVICE_WASM_HASH" \
    --source-account "$ADMIN_KEY" \
    --network "$NETWORK")
SERVICE_CONTRACT_ID=$(echo "$res" | cut -d'|' -f1)
SERVICE_DEPLOY_TX=$(echo "$res" | cut -d'|' -f2)
echo "CampusService Contract ID: $SERVICE_CONTRACT_ID"
echo "CampusService Deploy Tx: $SERVICE_DEPLOY_TX"

# Both contracts store immutable cross-contract addresses during initialization.
# Deploy first, then initialize in dependency order: Identity -> Token -> Service.
echo "Initializing CampusToken..."
res=$(run_stellar_cmd stellar contract invoke \
    --id "$TOKEN_CONTRACT_ID" \
    --source-account "$ADMIN_KEY" \
    --network "$NETWORK" \
    -- \
    initialize \
    --platform_admin "$PLATFORM_ADMIN_ADDRESS" \
    --identity_contract "$IDENTITY_CONTRACT_ID" \
    --service_contract "$SERVICE_CONTRACT_ID" \
    --decimals 7 \
    --name "CampusChain Token" \
    --symbol "CAMP")
TOKEN_INIT_TX=$(echo "$res" | cut -d'|' -f2)
echo "CampusToken Init Tx: $TOKEN_INIT_TX"

echo "Initializing CampusService..."
res=$(run_stellar_cmd stellar contract invoke \
    --id "$SERVICE_CONTRACT_ID" \
    --source-account "$ADMIN_KEY" \
    --network "$NETWORK" \
    -- \
    initialize \
    --platform_admin "$PLATFORM_ADMIN_ADDRESS" \
    --token_contract "$TOKEN_CONTRACT_ID" \
    --identity_contract "$IDENTITY_CONTRACT_ID" \
    --native_token_contract "$NATIVE_TOKEN")
SERVICE_INIT_TX=$(echo "$res" | cut -d'|' -f2)
echo "CampusService Init Tx: $SERVICE_INIT_TX"

echo "========================================================="
echo " DEPLOYMENT COMPLETED SUCCESSFULLY"
echo "========================================================="
echo "CampusIdentity ID: $IDENTITY_CONTRACT_ID"
echo "CampusToken ID:    $TOKEN_CONTRACT_ID"
echo "CampusService ID:  $SERVICE_CONTRACT_ID"
echo ""

# ── Update environment files automatically ──
echo "Updating environment files..."

# 1. Update frontend/.env.local
ENV_FILE="frontend/.env.local"
echo "NEXT_PUBLIC_STELLAR_RPC_URL=\"$RPC_URL\"" > "$ENV_FILE"
echo "NEXT_PUBLIC_STELLAR_PASSPHRASE=\"$PASSPHRASE\"" >> "$ENV_FILE"
echo "NEXT_PUBLIC_CAMPUS_IDENTITY_CONTRACT_ID=\"$IDENTITY_CONTRACT_ID\"" >> "$ENV_FILE"
echo "NEXT_PUBLIC_CAMPUS_TOKEN_CONTRACT_ID=\"$TOKEN_CONTRACT_ID\"" >> "$ENV_FILE"
echo "NEXT_PUBLIC_CAMPUS_SERVICE_CONTRACT_ID=\"$SERVICE_CONTRACT_ID\"" >> "$ENV_FILE"
echo "NEXT_PUBLIC_CAMPUS_ADMIN_ADDRESS=\"$ADMIN_ADDRESS\"" >> "$ENV_FILE"
echo "Updated $ENV_FILE"

# 2. Update root .env
ROOT_ENV=".env"
echo "# Root .env — deploy scripts and Stellar CLI tooling" > "$ROOT_ENV"
echo "STELLAR_NETWORK=\"$NETWORK\"" >> "$ROOT_ENV"
echo "STELLAR_RPC_URL=\"$RPC_URL\"" >> "$ROOT_ENV"
echo "STELLAR_NETWORK_PASSPHRASE=\"$PASSPHRASE\"" >> "$ROOT_ENV"
echo "CAMPUS_IDENTITY_CONTRACT_ID=\"$IDENTITY_CONTRACT_ID\"" >> "$ROOT_ENV"
echo "CAMPUS_TOKEN_CONTRACT_ID=\"$TOKEN_CONTRACT_ID\"" >> "$ROOT_ENV"
echo "CAMPUS_SERVICE_CONTRACT_ID=\"$SERVICE_CONTRACT_ID\"" >> "$ROOT_ENV"
echo "CAMPUS_ADMIN_ADDRESS=\"$ADMIN_ADDRESS\"" >> "$ROOT_ENV"
echo "Updated $ROOT_ENV"

# 3. Update root .env.example
if [ -f .env.example ]; then
    sed -i "s/CAMPUS_IDENTITY_CONTRACT_ID=.*/CAMPUS_IDENTITY_CONTRACT_ID=$IDENTITY_CONTRACT_ID/" .env.example
    sed -i "s/CAMPUS_TOKEN_CONTRACT_ID=.*/CAMPUS_TOKEN_CONTRACT_ID=$TOKEN_CONTRACT_ID/" .env.example
    sed -i "s/CAMPUS_SERVICE_CONTRACT_ID=.*/CAMPUS_SERVICE_CONTRACT_ID=$SERVICE_CONTRACT_ID/" .env.example
    sed -i "s/CAMPUS_ADMIN_ADDRESS=.*/CAMPUS_ADMIN_ADDRESS=$ADMIN_ADDRESS/" .env.example
    echo "Updated .env.example"
fi

# 4. Update frontend/.env.example
if [ -f frontend/.env.example ]; then
    sed -i "s/NEXT_PUBLIC_CAMPUS_IDENTITY_CONTRACT_ID=.*/NEXT_PUBLIC_CAMPUS_IDENTITY_CONTRACT_ID=$IDENTITY_CONTRACT_ID/" frontend/.env.example
    sed -i "s/NEXT_PUBLIC_CAMPUS_TOKEN_CONTRACT_ID=.*/NEXT_PUBLIC_CAMPUS_TOKEN_CONTRACT_ID=$TOKEN_CONTRACT_ID/" frontend/.env.example
    sed -i "s/NEXT_PUBLIC_CAMPUS_SERVICE_CONTRACT_ID=.*/NEXT_PUBLIC_CAMPUS_SERVICE_CONTRACT_ID=$SERVICE_CONTRACT_ID/" frontend/.env.example
    sed -i "s/NEXT_PUBLIC_CAMPUS_ADMIN_ADDRESS=.*/NEXT_PUBLIC_CAMPUS_ADMIN_ADDRESS=$ADMIN_ADDRESS/" frontend/.env.example
    echo "Updated frontend/.env.example"
fi

# ── Update documentation files automatically ──
echo "Updating documentation files (README.md & DEPLOYMENT.md)..."
python3 scripts/update_docs.py \
    --identity-id "$IDENTITY_CONTRACT_ID" \
    --token-id "$TOKEN_CONTRACT_ID" \
    --service-id "$SERVICE_CONTRACT_ID" \
    --admin-address "$ADMIN_ADDRESS" \
    --identity-wasm "$IDENTITY_WASM_HASH" \
    --token-wasm "$TOKEN_WASM_HASH" \
    --service-wasm "$SERVICE_WASM_HASH" \
    --identity-install-tx "$IDENTITY_INSTALL_TX" \
    --identity-deploy-tx "$IDENTITY_DEPLOY_TX" \
    --identity-init-tx "$IDENTITY_INIT_TX" \
    --token-install-tx "$TOKEN_INSTALL_TX" \
    --token-deploy-tx "$TOKEN_DEPLOY_TX" \
    --token-init-tx "$TOKEN_INIT_TX" \
    --service-install-tx "$SERVICE_INSTALL_TX" \
    --service-deploy-tx "$SERVICE_DEPLOY_TX" \
    --service-init-tx "$SERVICE_INIT_TX"

echo "Documentation update completed."
