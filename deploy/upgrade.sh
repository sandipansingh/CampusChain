#!/usr/bin/env bash
set -e

if [ "$#" -ne 4 ]; then
    echo "Usage: ./deploy/upgrade.sh <CONTRACT_ID> <NEW_WASM_PATH> <IDENTITY> <NETWORK>"
    exit 1
fi

CONTRACT_ID="$1"
WASM_PATH="$2"
IDENTITY="$3"
NETWORK="$4"

echo "========================================="
echo " CAMPUSCHAIN - CONTRACT UPGRADE SCRIPT"
echo "========================================="

echo "Installing new WASM code..."
NEW_WASM_HASH=$(stellar contract install \
    --wasm "$WASM_PATH" \
    --source-account "$IDENTITY" \
    --network "$NETWORK")

echo "New WASM Hash: $NEW_WASM_HASH"

echo "Invoking upgrade() on contract $CONTRACT_ID..."
stellar contract invoke \
    --id "$CONTRACT_ID" \
    --source "$IDENTITY" \
    --network "$NETWORK" \
    -- \
    upgrade \
    --new_wasm_hash "$NEW_WASM_HASH"

echo "========================================="
echo "UPGRADE COMPLETE!"
echo "========================================="
