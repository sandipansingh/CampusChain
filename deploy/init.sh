#!/usr/bin/env bash
set -e

if [ "$#" -ne 5 ]; then
    echo "Usage: ./deploy/init.sh <TOKEN_CONTRACT_ID> <SERVICE_CONTRACT_ID> <IDENTITY_CONTRACT_ID> <IDENTITY> <NETWORK>"
    exit 1
fi

TOKEN_CONTRACT_ID="$1"
SERVICE_CONTRACT_ID="$2"
IDENTITY_CONTRACT_ID="$3"
IDENTITY="$4"
NETWORK="$5"

echo "========================================="
echo " CAMPUSCHAIN - CONTRACT INITIALIZATION & WIRING"
echo "========================================="

ADMIN_ADDRESS=$(stellar keys address "$IDENTITY")
echo "Admin Address: $ADMIN_ADDRESS"
echo "Network: $NETWORK"

echo "Step 1: Initializing CampusIdentity..."
stellar contract invoke \
    --id "$IDENTITY_CONTRACT_ID" \
    --source "$IDENTITY" \
    --network "$NETWORK" \
    -- \
    initialize \
    --admin "$ADMIN_ADDRESS" \
    --full_name "University Admin" \
    --university_id 1 \
    --department "Administration"

echo "Step 2: Initializing CampusToken..."
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

echo "Step 3: Initializing CampusService..."
stellar contract invoke \
    --id "$SERVICE_CONTRACT_ID" \
    --source "$IDENTITY" \
    --network "$NETWORK" \
    -- \
    initialize \
    --admin "$ADMIN_ADDRESS" \
    --token_contract "$TOKEN_CONTRACT_ID"

echo "Step 4: Setting Service Contract inside CampusToken..."
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

echo "Step 5: Setting Native Token ($NATIVE_TOKEN_ID) inside CampusService..."
stellar contract invoke \
    --id "$SERVICE_CONTRACT_ID" \
    --source "$IDENTITY" \
    --network "$NETWORK" \
    -- \
    set_native_token \
    --admin "$ADMIN_ADDRESS" \
    --native_token "$NATIVE_TOKEN_ID"

echo "Step 6: Setting Identity Contract ($IDENTITY_CONTRACT_ID) inside CampusService..."
stellar contract invoke \
    --id "$SERVICE_CONTRACT_ID" \
    --source "$IDENTITY" \
    --network "$NETWORK" \
    -- \
    set_identity_contract \
    --admin "$ADMIN_ADDRESS" \
    --identity_contract "$IDENTITY_CONTRACT_ID"

echo "========================================="
echo "INITIALIZATION & WIRING COMPLETE!"
echo "========================================="
