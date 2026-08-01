#!/usr/bin/env bash
set -euo pipefail

# Check if arguments are supplied
if [ "$#" -lt 4 ]; then
    echo "Usage: $0 <IDENTITY_ID> <TOKEN_ID> <SERVICE_ID> <ADMIN_ADDRESS> [IDENTITY_WASM] [TOKEN_WASM] [SERVICE_WASM] [IDENTITY_INSTALL_TX] [IDENTITY_DEPLOY_TX] [IDENTITY_INIT_TX] [TOKEN_INSTALL_TX] [TOKEN_DEPLOY_TX] [TOKEN_INIT_TX] [SERVICE_INSTALL_TX] [SERVICE_DEPLOY_TX] [SERVICE_INIT_TX]"
    exit 1
fi

IDENTITY_ID="$1"
TOKEN_ID="$2"
SERVICE_ID="$3"
ADMIN_ADDRESS="$4"
IDENTITY_WASM="${5:-}"
TOKEN_WASM="${6:-}"
SERVICE_WASM="${7:-}"
IDENTITY_INSTALL_TX="${8:-}"
IDENTITY_DEPLOY_TX="${9:-}"
IDENTITY_INIT_TX="${10:-}"
TOKEN_INSTALL_TX="${11:-}"
TOKEN_DEPLOY_TX="${12:-}"
TOKEN_INIT_TX="${13:-}"
SERVICE_INSTALL_TX="${14:-}"
SERVICE_DEPLOY_TX="${15:-}"
SERVICE_INIT_TX="${16:-}"

update_file() {
    local file="$1"
    if [ ! -f "$file" ]; then
        echo "File not found: $file"
        return
    fi
    
    local tmp="${file}.tmp"
    
    local sed_cmds=()
    
    # Contract IDs and Admin env lines
    sed_cmds+=(-e 's/(NEXT_PUBLIC_CAMPUS_IDENTITY_CONTRACT_ID=)[A-Z0-9]{56}/\1'"$IDENTITY_ID"'/' )
    sed_cmds+=(-e 's/(CAMPUS_IDENTITY_CONTRACT_ID=)[A-Z0-9]{56}/\1'"$IDENTITY_ID"'/' )
    sed_cmds+=(-e 's/(NEXT_PUBLIC_CAMPUS_TOKEN_CONTRACT_ID=)[A-Z0-9]{56}/\1'"$TOKEN_ID"'/' )
    sed_cmds+=(-e 's/(CAMPUS_TOKEN_CONTRACT_ID=)[A-Z0-9]{56}/\1'"$TOKEN_ID"'/' )
    sed_cmds+=(-e 's/(NEXT_PUBLIC_CAMPUS_SERVICE_CONTRACT_ID=)[A-Z0-9]{56}/\1'"$SERVICE_ID"'/' )
    sed_cmds+=(-e 's/(CAMPUS_SERVICE_CONTRACT_ID=)[A-Z0-9]{56}/\1'"$SERVICE_ID"'/' )
    sed_cmds+=(-e 's/(NEXT_PUBLIC_CAMPUS_ADMIN_ADDRESS=)[A-Z0-9]{56}/\1'"$ADMIN_ADDRESS"'/' )
    sed_cmds+=(-e 's/(CAMPUS_ADMIN_ADDRESS=)[A-Z0-9]{56}/\1'"$ADMIN_ADDRESS"'/' )
    
    # Top badges in README
    sed_cmds+=(-e 's/(href="https:\/\/stellar\.expert\/explorer\/testnet\/contract\/)[A-Z0-9]{56}("><img [^>]*alt="CampusIdentity")/\1'"$IDENTITY_ID"'\2/' )
    sed_cmds+=(-e 's/(href="https:\/\/stellar\.expert\/explorer\/testnet\/contract\/)[A-Z0-9]{56}("><img [^>]*alt="CampusToken")/\1'"$TOKEN_ID"'\2/' )
    sed_cmds+=(-e 's/(href="https:\/\/stellar\.expert\/explorer\/testnet\/contract\/)[A-Z0-9]{56}("><img [^>]*alt="CampusService")/\1'"$SERVICE_ID"'\2/' )
    
    # Section 3 Contract Addresses
    sed_cmds+=(-e '/### 3.1 CampusIdentity/,/### 3.2/ s/(\*\*Address\*\*: \[`)[A-Z0-9]{56}(`\]\(https:\/\/stellar\.expert\/explorer\/testnet\/contract\/)[A-Z0-9]{56}(\))/\1'"$IDENTITY_ID"'\2'"$IDENTITY_ID"'\3/' )
    sed_cmds+=(-e '/### 3.2 CampusToken/,/### 3.3/ s/(\*\*Address\*\*: \[`)[A-Z0-9]{56}(`\]\(https:\/\/stellar\.expert\/explorer\/testnet\/contract\/)[A-Z0-9]{56}(\))/\1'"$TOKEN_ID"'\2'"$TOKEN_ID"'\3/' )
    sed_cmds+=(-e '/### 3.3 CampusService/,/### 3.4/ s/(\*\*Address\*\*: \[`)[A-Z0-9]{56}(`\]\(https:\/\/stellar\.expert\/explorer\/testnet\/contract\/)[A-Z0-9]{56}(\))/\1'"$SERVICE_ID"'\2'"$SERVICE_ID"'\3/' )
    
    # Section 10 Table
    sed_cmds+=(-e 's/(\|\s*\*\*CampusIdentity\*\*\s*\|\s*`)[A-Z0-9]{56}(`\s*\|\s*\[StellarExpert ↗\]\(https:\/\/stellar\.expert\/explorer\/testnet\/contract\/)[A-Z0-9]{56}(\)\s*\|)/\1'"$IDENTITY_ID"'\2'"$IDENTITY_ID"'\3/' )
    sed_cmds+=(-e 's/(\|\s*\*\*CampusToken\*\* \(CAMP\)\s*\|\s*`)[A-Z0-9]{56}(`\s*\|\s*\[StellarExpert ↗\]\(https:\/\/stellar\.expert\/explorer\/testnet\/contract\/)[A-Z0-9]{56}(\)\s*\|)/\1'"$TOKEN_ID"'\2'"$TOKEN_ID"'\3/' )
    sed_cmds+=(-e 's/(\|\s*\*\*CampusService\*\*\s*\|\s*`)[A-Z0-9]{56}(`\s*\|\s*\[StellarExpert ↗\]\(https:\/\/stellar\.expert\/explorer\/testnet\/contract\/)[A-Z0-9]{56}(\)\s*\|)/\1'"$SERVICE_ID"'\2'"$SERVICE_ID"'\3/' )

    if [ -n "$IDENTITY_WASM" ]; then
        sed_cmds+=(-e 's/(\|\s*CampusIdentity\s*\|\s*`)[a-f0-9]*(`\s*\|)/\1'"$IDENTITY_WASM"'\2/' )
        sed_cmds+=(-e 's/(\|\s*\*\*CampusIdentity\*\*\s*\|\s*`[A-Z0-9]{56}`\s*\|\s*`)[a-f0-9]*(`\s*\|)/\1'"$IDENTITY_WASM"'\2/' )
    fi
    if [ -n "$TOKEN_WASM" ]; then
        sed_cmds+=(-e 's/(\|\s*CampusToken\s*\|\s*`)[a-f0-9]*(`\s*\|)/\1'"$TOKEN_WASM"'\2/' )
        sed_cmds+=(-e 's/(\|\s*\*\*CampusToken\*\* \(CAMP\)\s*\|\s*`[A-Z0-9]{56}`\s*\|\s*`)[a-f0-9]*(`\s*\|)/\1'"$TOKEN_WASM"'\2/' )
    fi
    if [ -n "$SERVICE_WASM" ]; then
        sed_cmds+=(-e 's/(\|\s*CampusService\s*\|\s*`)[a-f0-9]*(`\s*\|)/\1'"$SERVICE_WASM"'\2/' )
        sed_cmds+=(-e 's/(\|\s*\*\*CampusService\*\*\s*\|\s*`[A-Z0-9]{56}`\s*\|\s*`)[a-f0-9]*(`\s*\|)/\1'"$SERVICE_WASM"'\2/' )
    fi

    if [ -n "$IDENTITY_INSTALL_TX" ]; then
        sed_cmds+=(-e '/#### CampusIdentity/,/####/ s/(\|\s*WASM Upload\s*\|\s*`)[a-f0-9]*(`\s*\|\s*\[View ↗\]\(https:\/\/stellar\.expert\/explorer\/testnet\/tx\/)[a-f0-9]*(\)\s*\|)/\1'"$IDENTITY_INSTALL_TX"'\2'"$IDENTITY_INSTALL_TX"'\3/' )
    fi
    if [ -n "$IDENTITY_DEPLOY_TX" ]; then
        sed_cmds+=(-e '/#### CampusIdentity/,/####/ s/(\|\s*Contract Instantiate\s*\|\s*`)[a-f0-9]*(`\s*\|\s*\[View ↗\]\(https:\/\/stellar\.expert\/explorer\/testnet\/tx\/)[a-f0-9]*(\)\s*\|)/\1'"$IDENTITY_DEPLOY_TX"'\2'"$IDENTITY_DEPLOY_TX"'\3/' )
    fi
    if [ -n "$IDENTITY_INIT_TX" ]; then
        sed_cmds+=(-e '/#### CampusIdentity/,/####/ s/(\|\s*`initialize\(\)`\s*\|\s*`)[a-f0-9]*(`\s*\|\s*\[View ↗\]\(https:\/\/stellar\.expert\/explorer\/testnet\/tx\/)[a-f0-9]*(\)\s*\|)/\1'"$IDENTITY_INIT_TX"'\2'"$IDENTITY_INIT_TX"'\3/' )
    fi

    if [ -n "$TOKEN_INSTALL_TX" ]; then
        sed_cmds+=(-e '/#### CampusToken/,/####/ s/(\|\s*WASM Upload\s*\|\s*`)[a-f0-9]*(`\s*\|\s*\[View ↗\]\(https:\/\/stellar\.expert\/explorer\/testnet\/tx\/)[a-f0-9]*(\)\s*\|)/\1'"$TOKEN_INSTALL_TX"'\2'"$TOKEN_INSTALL_TX"'\3/' )
    fi
    if [ -n "$TOKEN_DEPLOY_TX" ]; then
        sed_cmds+=(-e '/#### CampusToken/,/####/ s/(\|\s*Contract Instantiate\s*\|\s*`)[a-f0-9]*(`\s*\|\s*\[View ↗\]\(https:\/\/stellar\.expert\/explorer\/testnet\/tx\/)[a-f0-9]*(\)\s*\|)/\1'"$TOKEN_DEPLOY_TX"'\2'"$TOKEN_DEPLOY_TX"'\3/' )
    fi
    if [ -n "$TOKEN_INIT_TX" ]; then
        sed_cmds+=(-e '/#### CampusToken/,/####/ s/(\|\s*`initialize\(\)`\s*\|\s*`)[a-f0-9]*(`\s*\|\s*\[View ↗\]\(https:\/\/stellar\.expert\/explorer\/testnet\/tx\/)[a-f0-9]*(\)\s*\|)/\1'"$TOKEN_INIT_TX"'\2'"$TOKEN_INIT_TX"'\3/' )
    fi

    if [ -n "$SERVICE_INSTALL_TX" ]; then
        sed_cmds+=(-e '/#### CampusService/,/####/ s/(\|\s*WASM Upload\s*\|\s*`)[a-f0-9]*(`\s*\|\s*\[View ↗\]\(https:\/\/stellar\.expert\/explorer\/testnet\/tx\/)[a-f0-9]*(\)\s*\|)/\1'"$SERVICE_INSTALL_TX"'\2'"$SERVICE_INSTALL_TX"'\3/' )
    fi
    if [ -n "$SERVICE_DEPLOY_TX" ]; then
        sed_cmds+=(-e '/#### CampusService/,/####/ s/(\|\s*Contract Instantiate\s*\|\s*`)[a-f0-9]*(`\s*\|\s*\[View ↗\]\(https:\/\/stellar\.expert\/explorer\/testnet\/tx\/)[a-f0-9]*(\)\s*\|)/\1'"$SERVICE_DEPLOY_TX"'\2'"$SERVICE_DEPLOY_TX"'\3/' )
    fi
    if [ -n "$SERVICE_INIT_TX" ]; then
        sed_cmds+=(-e '/#### CampusService/,/####/ s/(\|\s*`initialize\(\)`\s*\|\s*`)[a-f0-9]*(`\s*\|\s*\[View ↗\]\(https:\/\/stellar\.expert\/explorer\/testnet\/tx\/)[a-f0-9]*(\)\s*\|)/\1'"$SERVICE_INIT_TX"'\2'"$SERVICE_INIT_TX"'\3/' )
    fi

    sed -E "${sed_cmds[@]}" "$file" > "$tmp"
    mv "$tmp" "$file"
    echo "Updated: $file"
}

update_file "README.md"
update_file "DEPLOYMENT.md"
