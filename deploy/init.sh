#!/usr/bin/env bash
set -e

if [ "$#" -ne 4 ]; then
    echo "Usage: ./deploy/init.sh <TOKEN_CONTRACT_ID> <SERVICE_CONTRACT_ID> <IDENTITY> <NETWORK>"
    exit 1
fi

TOKEN_CONTRACT_ID="$1"
SERVICE_CONTRACT_ID="$2"
IDENTITY="$3"
NETWORK="$4"

echo "========================================="
echo " CAMPUSCHAIN - CONTRACT INITIALIZATION & WIRING"
echo "========================================="

ADMIN_ADDRESS=$(stellar keys address "$IDENTITY")
echo "Admin Address: $ADMIN_ADDRESS"
echo "Network: $NETWORK"

echo "Step 1: Initializing CampusToken..."
stellar contract invoke \
    --id "$TOKEN_CONTRACT_ID" \
    --source "$IDENTITY" \
    --network "$NETWORK" \
    -- \
    initialize \
    --admin "$ADMIN_ADDRESS" \
    --decimals 7 \
    --name "CampusChain Token" \
    --symbol "CAMP"

echo "Step 2: Initializing CampusService..."
stellar contract invoke \
    --id "$SERVICE_CONTRACT_ID" \
    --source "$IDENTITY" \
    --network "$NETWORK" \
    -- \
    initialize \
    --admin "$ADMIN_ADDRESS" \
    --token_contract "$TOKEN_CONTRACT_ID"

echo "Step 3: Setting Service Contract inside CampusToken..."
stellar contract invoke \
    --id "$TOKEN_CONTRACT_ID" \
    --source "$IDENTITY" \
    --network "$NETWORK" \
    -- \
    set_service_contract \
    --admin "$ADMIN_ADDRESS" \
    --service_contract "$SERVICE_CONTRACT_ID"

# Register native token address
if [ "$NETWORK" = "testnet" ]; then
    # Testnet Native XLM contract ID
    NATIVE_TOKEN_ID="CDLZFC3SYJYDZT7K67VZ75HPJVIEUVNIXF47ZG2FB2RMQQVU2HHGCYSC"
else
    # Query/generate native token ID on local standalone network
    echo "Retrieving native token contract ID for local network..."
    NATIVE_TOKEN_ID=$(stellar contract id asset --asset native --network "$NETWORK" 2>/dev/null || echo "CDLZFC3SYJYDZT7K67VZ75HPJVIEUVNIXF47ZG2FB2RMQQVU2HHGCYSC")
fi

echo "Step 4: Setting Native Token ($NATIVE_TOKEN_ID) inside CampusService..."
stellar contract invoke \
    --id "$SERVICE_CONTRACT_ID" \
    --source "$IDENTITY" \
    --network "$NETWORK" \
    -- \
    set_native_token \
    --admin "$ADMIN_ADDRESS" \
    --native_token "$NATIVE_TOKEN_ID"

echo "========================================="
echo "INITIALIZATION & WIRING COMPLETE!"
echo "========================================="
