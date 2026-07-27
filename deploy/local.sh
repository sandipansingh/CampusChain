#!/usr/bin/env bash
set -e

echo "========================================="
echo " CAMPUSCHAIN - LOCAL DEPLOYMENT SCRIPT"
echo "========================================="

NETWORK="local"
IDENTITY="CAMPUSCHAIN_LOCAL"

if ! command -v stellar &> /dev/null; then
    echo "ERROR: 'stellar' CLI is not installed."
    exit 1
fi

# Ensure identity exists
if ! stellar keys address "$IDENTITY" &> /dev/null; then
    echo "Generating local identity: $IDENTITY..."
    stellar keys generate "$IDENTITY"
else
    echo "Using existing identity: $IDENTITY"
fi

# Check network config
stellar network add local --rpc-url http://localhost:8000/soroban/rpc \
    --network-passphrase "Standalone Network ; Standalone" &> /dev/null || true

# Check if local network needs funding (can try friendbot)
ADMIN_ADDRESS=$(stellar keys address "$IDENTITY")
echo "Admin Address: $ADMIN_ADDRESS"
echo "Attempting to fund local account..."
curl -s "http://localhost:8000/friendbot?addr=$ADMIN_ADDRESS" &> /dev/null || true

echo "Building contracts..."
stellar contract build

echo "Deploying CampusToken..."
TOKEN_CONTRACT_ID=$(stellar contract deploy \
    --wasm target/wasm32v1-none/release/campus_token.wasm \
    --source "$IDENTITY" \
    --network "$NETWORK")
echo "Deployed CampusToken: $TOKEN_CONTRACT_ID"

echo "Deploying CampusService..."
SERVICE_CONTRACT_ID=$(stellar contract deploy \
    --wasm target/wasm32v1-none/release/campus_service.wasm \
    --source "$IDENTITY" \
    --network "$NETWORK")
echo "Deployed CampusService: $SERVICE_CONTRACT_ID"

echo "========================================="
echo "DEPLOYMENT COMPLETE"
echo "CampusToken ID: $TOKEN_CONTRACT_ID"
echo "CampusService ID: $SERVICE_CONTRACT_ID"
echo "========================================="

echo "To initialize and wire contracts, run:"
echo "./deploy/init.sh $TOKEN_CONTRACT_ID $SERVICE_CONTRACT_ID $IDENTITY $NETWORK"
