#!/usr/bin/env bash
set -euo pipefail

echo "========================================="
echo " CAMPUSCHAIN - TESTNET CONTRACT DEPLOYMENT"
echo "========================================="

NETWORK="testnet"
REPO_ROOT="$(cd "$(dirname "${BASH_SOURCE[0]}")/.." && pwd)"
cd "$REPO_ROOT"

if [ -z "${CAMPUSCHAIN_ADMIN_KEY:-}" ]; then
    echo "Usage: CAMPUSCHAIN_ADMIN_KEY=<key-alias-or-secret> NEXT_PUBLIC_CAMPUS_ADMIN_ADDRESS=<G...> ./deploy/testnet.sh"
    exit 1
fi
if [ -z "${NEXT_PUBLIC_CAMPUS_ADMIN_ADDRESS:-}" ]; then
    echo "ERROR: NEXT_PUBLIC_CAMPUS_ADMIN_ADDRESS must identify the immutable Platform Admin."
    exit 1
fi
if ! command -v stellar >/dev/null 2>&1; then
    echo "ERROR: 'stellar' CLI is not installed."
    exit 1
fi

ADMIN_ADDRESS=$(stellar keys address "$CAMPUSCHAIN_ADMIN_KEY")
if [ "$ADMIN_ADDRESS" != "$NEXT_PUBLIC_CAMPUS_ADMIN_ADDRESS" ]; then
    echo "ERROR: deploy signer does not match NEXT_PUBLIC_CAMPUS_ADMIN_ADDRESS."
    exit 1
fi

echo "Platform Admin: $ADMIN_ADDRESS"
echo "Building, deploying, and initializing Identity -> Token -> Service..."

# scripts/deploy.sh is the canonical testnet pipeline. It builds imported WASM
# interfaces in dependency order and initializes every immutable contract link.
exec ./scripts/deploy.sh
