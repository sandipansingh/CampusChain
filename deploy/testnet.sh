#!/usr/bin/env bash
set -e

echo "========================================="
echo " CAMPUSCHAIN - TESTNET DEPLOYMENT SCRIPT"
echo "========================================="

NETWORK="testnet"
IDENTITY="CAMPUSCHAIN_TESTNET"

# Check if stellar CLI is installed
if ! command -v stellar &> /dev/null; then
    echo "ERROR: 'stellar' CLI is not installed."
    exit 1
fi

# Ensure identity exists, otherwise generate
if ! stellar keys address "$IDENTITY" &> /dev/null; then
    echo "Generating new identity: $IDENTITY..."
    stellar keys generate "$IDENTITY" --fund
else
    echo "Using existing identity: $IDENTITY"
fi

ADMIN_ADDRESS=$(stellar keys address "$IDENTITY")
echo "Admin Address: $ADMIN_ADDRESS"

# Add network if not exists
stellar network add testnet --rpc-url https://soroban-testnet.stellar.org \
    --network-passphrase "Test SDF Network ; September 2015" &> /dev/null || true

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
