#!/usr/bin/env bash
set -euo pipefail

echo "========================================="
echo " CAMPUSCHAIN - TESTNET CONTRACT DEPLOYMENT"
echo "========================================="

REPO_ROOT="$(cd "$(dirname "${BASH_SOURCE[0]}")/.." && pwd)"
cd "$REPO_ROOT"

if ! command -v stellar >/dev/null 2>&1; then
    echo "ERROR: 'stellar' CLI is not installed."
    exit 1
fi

# Default admin key alias to campuschain-admin if not set
export CAMPUSCHAIN_ADMIN_KEY="${CAMPUSCHAIN_ADMIN_KEY:-campuschain-admin}"

# Automatically derive the admin address from the key alias
if ! ADMIN_ADDRESS=$(stellar keys address "$CAMPUSCHAIN_ADMIN_KEY" 2>/dev/null); then
    echo "ERROR: Could not get address for key alias '$CAMPUSCHAIN_ADMIN_KEY'."
    echo "Please ensure the key is generated/added first: stellar keys generate $CAMPUSCHAIN_ADMIN_KEY --network testnet"
    exit 1
fi

# Set the platform admin address (defaulting to the derived address if not overridden)
export NEXT_PUBLIC_CAMPUS_ADMIN_ADDRESS="${NEXT_PUBLIC_CAMPUS_ADMIN_ADDRESS:-$ADMIN_ADDRESS}"

echo "Using Admin Key Alias:  $CAMPUSCHAIN_ADMIN_KEY"
echo "Platform Admin Address: $NEXT_PUBLIC_CAMPUS_ADMIN_ADDRESS"
echo "Building, deploying, and initializing Identity -> Token -> Service..."

# scripts/deploy.sh is the canonical testnet pipeline. It builds imported WASM
# interfaces in dependency order and initializes every immutable contract link.
exec ./scripts/deploy.sh
