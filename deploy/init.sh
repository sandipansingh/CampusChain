#!/usr/bin/env bash
set -euo pipefail

if [ "$#" -ne 5 ]; then
    echo "Usage: NEXT_PUBLIC_CAMPUS_ADMIN_ADDRESS=<G...> ./deploy/init.sh <TOKEN_CONTRACT_ID> <SERVICE_CONTRACT_ID> <IDENTITY_CONTRACT_ID> <IDENTITY> <NETWORK>"
    exit 1
fi

TOKEN_CONTRACT_ID="$1"
SERVICE_CONTRACT_ID="$2"
IDENTITY_CONTRACT_ID="$3"
IDENTITY="$4"
NETWORK="$5"
PLATFORM_ADMIN_ADDRESS="${NEXT_PUBLIC_CAMPUS_ADMIN_ADDRESS:-}"

if [ -z "$PLATFORM_ADMIN_ADDRESS" ]; then
    echo "ERROR: NEXT_PUBLIC_CAMPUS_ADMIN_ADDRESS must identify the immutable Platform Admin."
    exit 1
fi

echo "========================================="
echo " CAMPUSCHAIN - CONTRACT INITIALIZATION"
echo "========================================="

ADMIN_ADDRESS=$(stellar keys address "$IDENTITY")
if [ "$ADMIN_ADDRESS" != "$PLATFORM_ADMIN_ADDRESS" ]; then
    echo "ERROR: init signer does not match NEXT_PUBLIC_CAMPUS_ADMIN_ADDRESS."
    exit 1
fi

if [ "$NETWORK" = "testnet" ]; then
    NATIVE_TOKEN_ID="CDLZFC3SYJYDZT7K67VZ75HPJVIEUVNIXF47ZG2FB2RMQQVU2HHGCYSC"
else
    NATIVE_TOKEN_ID=$(stellar contract id asset --asset native --network "$NETWORK")
fi

echo "Step 1: Initializing CampusIdentity with immutable Platform Admin..."
stellar contract invoke \
    --id "$IDENTITY_CONTRACT_ID" \
    --source-account "$IDENTITY" \
    --network "$NETWORK" \
    -- \
    initialize \
    --platform_admin "$PLATFORM_ADMIN_ADDRESS" \
    --full_name "CampusChain Platform Admin"

echo "Step 2: Initializing CampusToken with immutable contract links..."
stellar contract invoke \
    --id "$TOKEN_CONTRACT_ID" \
    --source-account "$IDENTITY" \
    --network "$NETWORK" \
    -- \
    initialize \
    --platform_admin "$PLATFORM_ADMIN_ADDRESS" \
    --identity_contract "$IDENTITY_CONTRACT_ID" \
    --service_contract "$SERVICE_CONTRACT_ID" \
    --decimals 7 \
    --name "CampusChain Token" \
    --symbol "CAMP"

echo "Step 3: Initializing CampusService with immutable contract links..."
stellar contract invoke \
    --id "$SERVICE_CONTRACT_ID" \
    --source-account "$IDENTITY" \
    --network "$NETWORK" \
    -- \
    initialize \
    --platform_admin "$PLATFORM_ADMIN_ADDRESS" \
    --token_contract "$TOKEN_CONTRACT_ID" \
    --identity_contract "$IDENTITY_CONTRACT_ID" \
    --native_token_contract "$NATIVE_TOKEN_ID"

echo "========================================="
echo "INITIALIZATION COMPLETE"
echo "========================================="
