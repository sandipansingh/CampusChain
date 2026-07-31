#!/usr/bin/env bash

# Exit immediately if a command exits with a non-zero status
set -e

echo "========================================================="
echo " CAMPUSCHAIN - DEMO ONBOARDING & SETUP SCRIPT"
echo "========================================================="

# Load existing environment variables
if [ -f .env ]; then
    source .env
fi

# Configuration defaults
NETWORK="${STELLAR_NETWORK:-testnet}"
RPC_URL="${STELLAR_RPC_URL:-https://soroban-testnet.stellar.org}"
PASSPHRASE="${STELLAR_NETWORK_PASSPHRASE:-Test SDF Network ; September 2015}"

IDENTITY_ID="${CAMPUS_IDENTITY_CONTRACT_ID}"
TOKEN_ID="${CAMPUS_TOKEN_CONTRACT_ID}"
SERVICE_ID="${CAMPUS_SERVICE_CONTRACT_ID}"

# Check if contract IDs are resolved
if [ -z "$IDENTITY_ID" ] || [ -z "$TOKEN_ID" ] || [ -z "$SERVICE_ID" ]; then
    echo "ERROR: Contract IDs are not set in .env. Please run deploy.sh first."
    exit 1
fi

echo "Using Contracts:"
echo " - Identity: $IDENTITY_ID"
echo " - Token:    $TOKEN_ID"
echo " - Service:  $SERVICE_ID"
echo ""

# Helper to generate and fund a key if it does not exist
setup_account() {
    local key_alias="$1"
    echo "Setting up account for '$key_alias'..."
    if ! stellar keys address "$key_alias" &>/dev/null; then
        echo "Generating key alias '$key_alias'..."
        stellar keys generate "$key_alias" --network "$NETWORK"
    fi
    local address
    address=$(stellar keys address "$key_alias")
    echo "Address for '$key_alias': $address"
    
    # Fund via Friendbot
    if [ "$NETWORK" = "testnet" ]; then
        echo "Checking if account is funded on Testnet..."
        if curl -s -f "https://horizon-testnet.stellar.org/accounts/$address" >/dev/null; then
            echo "Account is already funded."
        else
            echo "Account not found on-chain. Funding via Friendbot..."
            if curl -s -f "https://friendbot.stellar.org/?addr=$address" >/dev/null; then
                echo "Account successfully funded! Waiting 8 seconds for ledger close..."
                sleep 8
            else
                echo "WARNING: Failed to fund account via Friendbot."
            fi
        fi
    fi
    echo "$address"
}

# 1. Setup keys
ADMIN_KEY="${CAMPUSCHAIN_ADMIN_KEY:-campuschain-admin}"
ADMIN_ADDR=$(stellar keys address "$ADMIN_KEY")

UNIV_ADMIN_KEY="demo-univ-admin"
UNIV_ADDR=$(setup_account "$UNIV_ADMIN_KEY")

STUDENT_KEY="demo-student"
STUDENT_ADDR=$(setup_account "$STUDENT_KEY")

echo ""
echo "Step 1: Registering University 'DEMO-UNI'..."
# Register university
stellar contract invoke \
    --id "$IDENTITY_ID" \
    --source-account "$ADMIN_KEY" \
    --network "$NETWORK" \
    -- \
    register_university \
    --admin_address "$UNIV_ADDR" \
    --code "DEMO-UNI" \
    --name "Demo State University" \
    --physical_address "456 Learning Blvd" \
    --registrar_name "Demo Registrar"

echo "Step 2: Approving University 'DEMO-UNI'..."
# Approve university
stellar contract invoke \
    --id "$IDENTITY_ID" \
    --source-account "$ADMIN_KEY" \
    --network "$NETWORK" \
    -- \
    approve_university \
    --code "DEMO-UNI"

echo "Step 3: Registering Student Profile..."
# Details structure for Student in JSON format
# Note: student_identifier_hash must be a 32-byte hex string (BytesN<32>).
# We generate a dummy 32-byte hex string.
DUMMY_HASH="0101010101010101010101010101010101010101010101010101010101010101"
DETAILS_JSON="{\"Student\":{\"student_identifier_hash\":\"$DUMMY_HASH\",\"department\":\"Engineering\",\"program\":\"Computer Science\",\"graduation_year\":2027}}"

# Register student profile
stellar contract invoke \
    --id "$IDENTITY_ID" \
    --source-account "$STUDENT_KEY" \
    --network "$NETWORK" \
    -- \
    register_profile \
    --address "$STUDENT_ADDR" \
    --full_name "Demo Student" \
    --university_code "DEMO-UNI" \
    --role 1 \
    --details "$DETAILS_JSON"

echo "Step 4: Verifying Student Profile..."
# Verify student profile (by University Admin)
stellar contract invoke \
    --id "$IDENTITY_ID" \
    --source-account "$UNIV_ADMIN_KEY" \
    --network "$NETWORK" \
    -- \
    verify_profile \
    --address "$STUDENT_ADDR"

echo "Step 5: Querying verified student profile..."
# Get student profile (passing caller)
stellar contract invoke \
    --id "$IDENTITY_ID" \
    --source-account "$STUDENT_KEY" \
    --network "$NETWORK" \
    -- \
    get_profile \
    --address "$STUDENT_ADDR" \
    --caller "$STUDENT_ADDR"

echo "========================================================="
echo " ONBOARDING DEMO COMPLETED SUCCESSFULLY!"
echo "========================================================="
