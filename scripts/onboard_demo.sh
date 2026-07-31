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

# Helper to verify key alias exists and get address
get_account_address() {
    local key_alias="$1"
    if ! address=$(stellar keys address "$key_alias" 2>/dev/null); then
        echo "ERROR: Key alias '$key_alias' not found in Stellar CLI."
        echo "Please generate it first using: stellar keys generate $key_alias --network $NETWORK"
        exit 1
    fi
    echo "$address"
}

# 1. Resolve keys
ADMIN_KEY="${CAMPUSCHAIN_ADMIN_KEY:-campuschain-admin}"
ADMIN_ADDR=$(get_account_address "$ADMIN_KEY")

UNIV_ADMIN_KEY="demo-univ-admin"
UNIV_ADDR=$(get_account_address "$UNIV_ADMIN_KEY")

STUDENT_KEY="demo-student"
STUDENT_ADDR=$(get_account_address "$STUDENT_KEY")

# Fund them if needed
fund_if_needed() {
    local address="$1"
    if [ "$NETWORK" = "testnet" ]; then
        if ! curl -s -f "https://horizon-testnet.stellar.org/accounts/$address" >/dev/null; then
            echo "Account $address not found on-chain. Funding via Friendbot..."
            if curl -s -f "https://friendbot.stellar.org/?addr=$address" >/dev/null; then
                echo "Account successfully funded! Waiting 8 seconds for ledger close..."
                sleep 8
            else
                echo "WARNING: Failed to fund account via Friendbot."
            fi
        fi
    fi
}

fund_if_needed "$ADMIN_ADDR"
fund_if_needed "$UNIV_ADDR"
fund_if_needed "$STUDENT_ADDR"

echo ""
echo "Step 1: Registering University 'DEMO-UNI'..."
# Register university
# Signature: register_university(admin, code, name, address, title)
# Requires authentication of the university administrator, so we sign with UNIV_ADMIN_KEY.
stellar contract invoke \
    --id "$IDENTITY_ID" \
    --source-account "$UNIV_ADMIN_KEY" \
    --network "$NETWORK" \
    -- \
    register_university \
    --admin "$UNIV_ADDR" \
    --code "DEMO-UNI" \
    --name "Demo State University" \
    --address "456 Learning Blvd" \
    --title "Demo Registrar"

echo "Step 2: Approving University 'DEMO-UNI'..."
# Approve university
# Signature: approve_university(caller, code)
# Requires platform admin authentication, so we sign with ADMIN_KEY.
stellar contract invoke \
    --id "$IDENTITY_ID" \
    --source-account "$ADMIN_KEY" \
    --network "$NETWORK" \
    -- \
    approve_university \
    --caller "$ADMIN_ADDR" \
    --code "DEMO-UNI"

echo "Step 3: Registering Student Profile..."
# Details structure for Student in JSON format
DUMMY_HASH="0101010101010101010101010101010101010101010101010101010101010101"
DETAILS_JSON="{\"Student\":{\"student_identifier_hash\":\"$DUMMY_HASH\",\"department\":\"Engineering\",\"program\":\"Computer Science\",\"graduation_year\":2027}}"

# Register student profile
# Signature: register_profile(address, full_name, university_code, role, details)
# Requires profile address authentication, so we sign with STUDENT_KEY.
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
# Signature: verify_profile(caller, target_address)
# Requires university admin authentication, so we sign with UNIV_ADMIN_KEY.
stellar contract invoke \
    --id "$IDENTITY_ID" \
    --source-account "$UNIV_ADMIN_KEY" \
    --network "$NETWORK" \
    -- \
    verify_profile \
    --caller "$UNIV_ADDR" \
    --target_address "$STUDENT_ADDR"

echo "Step 5: Querying verified student profile..."
# Get student profile (passing caller)
# Signature: get_profile(address, caller)
# Requires caller authentication, so we sign with STUDENT_KEY.
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
