#!/usr/bin/env python3
import sys
import os
import re
import argparse

def update_file(filepath, args):
    if not os.path.exists(filepath):
        print(f"File not found: {filepath}", file=sys.stderr)
        return

    with open(filepath, 'r', encoding='utf-8') as f:
        content = f.read()

    original = content

    # 1. Update contract addresses in env configurations and tables
    if args.identity_id:
        # Match env config: NEXT_PUBLIC_CAMPUS_IDENTITY_CONTRACT_ID=...
        content = re.sub(
            r'(NEXT_PUBLIC_CAMPUS_IDENTITY_CONTRACT_ID=)[A-Z0-9]{56}',
            rf'\1{args.identity_id}',
            content
        )
        content = re.sub(
            r'(CAMPUS_IDENTITY_CONTRACT_ID=)[A-Z0-9]{56}',
            rf'\1{args.identity_id}',
            content
        )
        # Match markdown table: | **CampusIdentity** | `CBSP...` | [StellarExpert ↗](https://.../contract/CBSP...) |
        content = re.sub(
            r'(\|\s*\*\*CampusIdentity\*\*\s*\|\s*`)[A-Z0-9]{56}(`\s*\|\s*\[StellarExpert ↗\]\(https://stellar\.expert/explorer/testnet/contract/)[A-Z0-9]{56}(\)\s*\|)',
            rf'\1{args.identity_id}\2{args.identity_id}\3',
            content
        )

    if args.token_id:
        content = re.sub(
            r'(NEXT_PUBLIC_CAMPUS_TOKEN_CONTRACT_ID=)[A-Z0-9]{56}',
            rf'\1{args.token_id}',
            content
        )
        content = re.sub(
            r'(CAMPUS_TOKEN_CONTRACT_ID=)[A-Z0-9]{56}',
            rf'\1{args.token_id}',
            content
        )
        content = re.sub(
            r'(\|\s*\*\*CampusToken\*\* \(CAMP\)\s*\|\s*`)[A-Z0-9]{56}(`\s*\|\s*\[StellarExpert ↗\]\(https://stellar\.expert/explorer/testnet/contract/)[A-Z0-9]{56}(\)\s*\|)',
            rf'\1{args.token_id}\2{args.token_id}\3',
            content
        )

    if args.service_id:
        content = re.sub(
            r'(NEXT_PUBLIC_CAMPUS_SERVICE_CONTRACT_ID=)[A-Z0-9]{56}',
            rf'\1{args.service_id}',
            content
        )
        content = re.sub(
            r'(CAMPUS_SERVICE_CONTRACT_ID=)[A-Z0-9]{56}',
            rf'\1{args.service_id}',
            content
        )
        content = re.sub(
            r'(\|\s*\*\*CampusService\*\*\s*\|\s*`)[A-Z0-9]{56}(`\s*\|\s*\[StellarExpert ↗\]\(https://stellar\.expert/explorer/testnet/contract/)[A-Z0-9]{56}(\)\s*\|)',
            rf'\1{args.service_id}\2{args.service_id}\3',
            content
        )

    if args.admin_address:
        content = re.sub(
            r'(NEXT_PUBLIC_CAMPUS_ADMIN_ADDRESS=)[A-Z0-9]{56}',
            rf'\1{args.admin_address}',
            content
        )
        content = re.sub(
            r'(CAMPUS_ADMIN_ADDRESS=)[A-Z0-9]{56}',
            rf'\1{args.admin_address}',
            content
        )

    # 2. Update WASM hashes
    if args.identity_wasm:
        content = re.sub(
            r'(\|\s*CampusIdentity\s*\|\s*`)[a-f0-9]{64}(`\s*\|)',
            rf'\1{args.identity_wasm}\2',
            content
        )
        # Also in Deployed Contracts table (Explorer column / WASM column in DEPLOYMENT.md)
        content = re.sub(
            r'(\|\s*\*\*CampusIdentity\*\*\s*\|\s*`[A-Z0-9]{56}`\s*\|\s*`)[a-f0-9]{64}(`\s*\|)',
            rf'\1{args.identity_wasm}\2',
            content
        )

    if args.token_wasm:
        content = re.sub(
            r'(\|\s*CampusToken\s*\|\s*`)[a-f0-9]{64}(`\s*\|)',
            rf'\1{args.token_wasm}\2',
            content
        )
        content = re.sub(
            r'(\|\s*\*\*CampusToken\*\* \(CAMP\)\s*\|\s*`[A-Z0-9]{56}`\s*\|\s*`)[a-f0-9]{64}(`\s*\|)',
            rf'\1{args.token_wasm}\2',
            content
        )

    if args.service_wasm:
        content = re.sub(
            r'(\|\s*CampusService\s*\|\s*`)[a-f0-9]{64}(`\s*\|)',
            rf'\1{args.service_wasm}\2',
            content
        )
        content = re.sub(
            r'(\|\s*\*\*CampusService\*\*\s*\|\s*`[A-Z0-9]{56}`\s*\|\s*`)[a-f0-9]{64}(`\s*\|)',
            rf'\1{args.service_wasm}\2',
            content
        )

    # 3. Update Transaction hashes in README.md tables
    # Helper to replace table rows for actions
    def replace_tx_row(section_hdr, action_lbl, tx_hash):
        nonlocal content
        if not tx_hash:
            return
        
        # Regex to locate the section and then replace the row
        # Matches: | Action | `tx_hash` | [View ↗](https://.../tx/tx_hash) |
        pattern = rf'(\|\s*{action_lbl}\s*\|\s*`)[a-f0-9]{{64}}(`\s*\|\s*\[View ↗\]\(https://stellar\.expert/explorer/testnet/tx/)[a-f0-9]{{64}}(\)\s*\|)'
        
        # We find the block under the section_hdr (CampusIdentity, CampusToken, CampusService)
        # to ensure we replace inside the correct contract's table
        section_pattern = rf'(###+ {section_hdr}.*?\n)(.*?)(?=\n###+ |\Z)'
        
        def subst(match):
            header = match.group(1)
            table_body = match.group(2)
            # Replace within this table body
            updated_body = re.sub(pattern, rf'\1{tx_hash}\2{tx_hash}\3', table_body)
            return header + updated_body

        content = re.sub(section_pattern, subst, content, flags=re.DOTALL)

    replace_tx_row("CampusIdentity", "WASM Upload", args.identity_install_tx)
    replace_tx_row("CampusIdentity", "Contract Instantiate", args.identity_deploy_tx)
    replace_tx_row("CampusIdentity", "`initialize\\(\\)`", args.identity_init_tx)

    replace_tx_row("CampusToken", "WASM Upload", args.token_install_tx)
    replace_tx_row("CampusToken", "Contract Instantiate", args.token_deploy_tx)
    replace_tx_row("CampusToken", "`initialize\\(\\)`", args.token_init_tx)

    replace_tx_row("CampusService", "WASM Upload", args.service_install_tx)
    replace_tx_row("CampusService", "Contract Instantiate", args.service_deploy_tx)
    replace_tx_row("CampusService", "`initialize\\(\\)`", args.service_init_tx)

    if content != original:
        with open(filepath, 'w', encoding='utf-8') as f:
            f.write(content)
        print(f"Updated: {filepath}")
    else:
        print(f"No changes needed for: {filepath}")

def main():
    parser = argparse.ArgumentParser(description="Auto-update documentation variables.")
    parser.add_argument("--identity-id")
    parser.add_argument("--token-id")
    parser.add_argument("--service-id")
    parser.add_argument("--admin-address")
    
    parser.add_argument("--identity-wasm")
    parser.add_argument("--token-wasm")
    parser.add_argument("--service-wasm")
    
    parser.add_argument("--identity-install-tx")
    parser.add_argument("--identity-deploy-tx")
    parser.add_argument("--identity-init-tx")
    
    parser.add_argument("--token-install-tx")
    parser.add_argument("--token-deploy-tx")
    parser.add_argument("--token-init-tx")
    
    parser.add_argument("--service-install-tx")
    parser.add_argument("--service-deploy-tx")
    parser.add_argument("--service-init-tx")

    args = parser.parse_args()

    # Update both README.md and DEPLOYMENT.md
    update_file("README.md", args)
    update_file("DEPLOYMENT.md", args)

if __name__ == "__main__":
    main()
