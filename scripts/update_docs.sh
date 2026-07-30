#!/usr/bin/env bash
set -euo pipefail

# Check if arguments are supplied
if [ "$#" -lt 16 ]; then
    echo "Usage: $0 <IDENTITY_ID> <TOKEN_ID> <SERVICE_ID> <ADMIN_ADDRESS> <IDENTITY_WASM> <TOKEN_WASM> <SERVICE_WASM> <IDENTITY_INSTALL_TX> <IDENTITY_DEPLOY_TX> <IDENTITY_INIT_TX> <TOKEN_INSTALL_TX> <TOKEN_DEPLOY_TX> <TOKEN_INIT_TX> <SERVICE_INSTALL_TX> <SERVICE_DEPLOY_TX> <SERVICE_INIT_TX>"
    exit 1
fi

IDENTITY_ID="$1"
TOKEN_ID="$2"
SERVICE_ID="$3"
ADMIN_ADDRESS="$4"
IDENTITY_WASM="$5"
TOKEN_WASM="$6"
SERVICE_WASM="$7"
IDENTITY_INSTALL_TX="$8"
IDENTITY_DEPLOY_TX="$9"
IDENTITY_INIT_TX="${10}"
TOKEN_INSTALL_TX="${11}"
TOKEN_DEPLOY_TX="${12}"
TOKEN_INIT_TX="${13}"
SERVICE_INSTALL_TX="${14}"
SERVICE_DEPLOY_TX="${15}"
SERVICE_INIT_TX="${16}"

update_file() {
    local file="$1"
    if [ ! -f "$file" ]; then
        echo "File not found: $file"
        return
    fi
    
    local tmp="${file}.tmp"
    
    # Run sed transformations
    # Use range matching '/#### Contract/,/####/' to isolate substitutions to the correct contract section.
    # Note: range matches are compatible with all standard POSIX sed engines.
    sed -E \
        -e 's/(NEXT_PUBLIC_CAMPUS_IDENTITY_CONTRACT_ID=)[A-Z0-9]{56}/\1'"$IDENTITY_ID"'/' \
        -e 's/(CAMPUS_IDENTITY_CONTRACT_ID=)[A-Z0-9]{56}/\1'"$IDENTITY_ID"'/' \
        -e 's/(NEXT_PUBLIC_CAMPUS_TOKEN_CONTRACT_ID=)[A-Z0-9]{56}/\1'"$TOKEN_ID"'/' \
        -e 's/(CAMPUS_TOKEN_CONTRACT_ID=)[A-Z0-9]{56}/\1'"$TOKEN_ID"'/' \
        -e 's/(NEXT_PUBLIC_CAMPUS_SERVICE_CONTRACT_ID=)[A-Z0-9]{56}/\1'"$SERVICE_ID"'/' \
        -e 's/(CAMPUS_SERVICE_CONTRACT_ID=)[A-Z0-9]{56}/\1'"$SERVICE_ID"'/' \
        -e 's/(NEXT_PUBLIC_CAMPUS_ADMIN_ADDRESS=)[A-Z0-9]{56}/\1'"$ADMIN_ADDRESS"'/' \
        -e 's/(CAMPUS_ADMIN_ADDRESS=)[A-Z0-9]{56}/\1'"$ADMIN_ADDRESS"'/' \
        \
        -e 's/(\|\s*\*\*CampusIdentity\*\*\s*\|\s*`)[A-Z0-9]{56}(`\s*\|\s*\[StellarExpert ↗\]\(https:\/\/stellar\.expert\/explorer\/testnet\/contract\/)[A-Z0-9]{56}(\)\s*\|)/\1'"$IDENTITY_ID"'\2'"$IDENTITY_ID"'\3/' \
        -e 's/(\|\s*\*\*CampusToken\*\* \(CAMP\)\s*\|\s*`)[A-Z0-9]{56}(`\s*\|\s*\[StellarExpert ↗\]\(https:\/\/stellar\.expert\/explorer\/testnet\/contract\/)[A-Z0-9]{56}(\)\s*\|)/\1'"$TOKEN_ID"'\2'"$TOKEN_ID"'\3/' \
        -e 's/(\|\s*\*\*CampusService\*\*\s*\|\s*`)[A-Z0-9]{56}(`\s*\|\s*\[StellarExpert ↗\]\(https:\/\/stellar\.expert\/explorer\/testnet\/contract\/)[A-Z0-9]{56}(\)\s*\|)/\1'"$SERVICE_ID"'\2'"$SERVICE_ID"'\3/' \
        \
        -e 's/(\|\s*CampusIdentity\s*\|\s*`)[a-f0-9]{64}(`\s*\|)/\1'"$IDENTITY_WASM"'\2/' \
        -e 's/(\|\s*\*\*CampusIdentity\*\*\s*\|\s*`[A-Z0-9]{56}`\s*\|\s*`)[a-f0-9]{64}(`\s*\|)/\1'"$IDENTITY_WASM"'\2/' \
        -e 's/(\|\s*CampusToken\s*\|\s*`)[a-f0-9]{64}(`\s*\|)/\1'"$TOKEN_WASM"'\2/' \
        -e 's/(\|\s*\*\*CampusToken\*\* \(CAMP\)\s*\|\s*`[A-Z0-9]{56}`\s*\|\s*`)[a-f0-9]{64}(`\s*\|)/\1'"$TOKEN_WASM"'\2/' \
        -e 's/(\|\s*CampusService\s*\|\s*`)[a-f0-9]{64}(`\s*\|)/\1'"$SERVICE_WASM"'\2/' \
        -e 's/(\|\s*\*\*CampusService\*\*\s*\|\s*`[A-Z0-9]{56}`\s*\|\s*`)[a-f0-9]{64}(`\s*\|)/\1'"$SERVICE_WASM"'\2/' \
        \
        -e '/#### CampusIdentity/,/####/ s/(\|\s*WASM Upload\s*\|\s*`)[a-f0-9]{64}(`\s*\|\s*\[View ↗\]\(https:\/\/stellar\.expert\/explorer\/testnet\/tx\/)[a-f0-9]{64}(\)\s*\|)/\1'"$IDENTITY_INSTALL_TX"'\2'"$IDENTITY_INSTALL_TX"'\3/' \
        -e '/#### CampusIdentity/,/####/ s/(\|\s*Contract Instantiate\s*\|\s*`)[a-f0-9]{64}(`\s*\|\s*\[View ↗\]\(https:\/\/stellar\.expert\/explorer\/testnet\/tx\/)[a-f0-9]{64}(\)\s*\|)/\1'"$IDENTITY_DEPLOY_TX"'\2'"$IDENTITY_DEPLOY_TX"'\3/' \
        -e '/#### CampusIdentity/,/####/ s/(\|\s*`initialize\(\)`\s*\|\s*`)[a-f0-9]{64}(`\s*\|\s*\[View ↗\]\(https:\/\/stellar\.expert\/explorer\/testnet\/tx\/)[a-f0-9]{64}(\)\s*\|)/\1'"$IDENTITY_INIT_TX"'\2'"$IDENTITY_INIT_TX"'\3/' \
        \
        -e '/#### CampusToken/,/####/ s/(\|\s*WASM Upload\s*\|\s*`)[a-f0-9]{64}(`\s*\|\s*\[View ↗\]\(https:\/\/stellar\.expert\/explorer\/testnet\/tx\/)[a-f0-9]{64}(\)\s*\|)/\1'"$TOKEN_INSTALL_TX"'\2'"$TOKEN_INSTALL_TX"'\3/' \
        -e '/#### CampusToken/,/####/ s/(\|\s*Contract Instantiate\s*\|\s*`)[a-f0-9]{64}(`\s*\|\s*\[View ↗\]\(https:\/\/stellar\.expert\/explorer\/testnet\/tx\/)[a-f0-9]{64}(\)\s*\|)/\1'"$TOKEN_DEPLOY_TX"'\2'"$TOKEN_DEPLOY_TX"'\3/' \
        -e '/#### CampusToken/,/####/ s/(\|\s*`initialize\(\)`\s*\|\s*`)[a-f0-9]{64}(`\s*\|\s*\[View ↗\]\(https:\/\/stellar\.expert\/explorer\/testnet\/tx\/)[a-f0-9]{64}(\)\s*\|)/\1'"$TOKEN_INIT_TX"'\2'"$TOKEN_INIT_TX"'\3/' \
        \
        -e '/#### CampusService/,/####/ s/(\|\s*WASM Upload\s*\|\s*`)[a-f0-9]{64}(`\s*\|\s*\[View ↗\]\(https:\/\/stellar\.expert\/explorer\/testnet\/tx\/)[a-f0-9]{64}(\)\s*\|)/\1'"$SERVICE_INSTALL_TX"'\2'"$SERVICE_INSTALL_TX"'\3/' \
        -e '/#### CampusService/,/####/ s/(\|\s*Contract Instantiate\s*\|\s*`)[a-f0-9]{64}(`\s*\|\s*\[View ↗\]\(https:\/\/stellar\.expert\/explorer\/testnet\/tx\/)[a-f0-9]{64}(\)\s*\|)/\1'"$SERVICE_DEPLOY_TX"'\2'"$SERVICE_DEPLOY_TX"'\3/' \
        -e '/#### CampusService/,/####/ s/(\|\s*`initialize\(\)`\s*\|\s*`)[a-f0-9]{64}(`\s*\|\s*\[View ↗\]\(https:\/\/stellar\.expert\/explorer\/testnet\/tx\/)[a-f0-9]{64}(\)\s*\|)/\1'"$SERVICE_INIT_TX"'\2'"$SERVICE_INIT_TX"'\3/' \
        "$file" > "$tmp"
        
    mv "$tmp" "$file"
    echo "Updated: $file"
}

update_file "README.md"
update_file "DEPLOYMENT.md"
