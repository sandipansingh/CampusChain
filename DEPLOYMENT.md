# CampusChain — Testnet Deployment Record

This document records the official smart contract deployment details on the Stellar Testnet.

## Deployed Identity

*   **Identity Name**: `CAMPUSCHAIN_TESTNET`
*   **Stellar Public Address**: `GBPVICMAESR2O4LJRDAV2YGGIQDAEY6ANCAF3GLIXEYRAIDDXM7WQP7X`
*   **StellarExpert Account Link**: [StellarExpert Account Details](https://stellar.expert/explorer/testnet/account/GBPVICMAESR2O4LJRDAV2YGGIQDAEY6ANCAF3GLIXEYRAIDDXM7WQP7X)

---

## Contract Deployments

### 1. CampusIdentity
*   **Contract Address**: `CBDU4NVTNNWFCGQEXE4MJDB62QQ4XTACSH3NPLNPGUY2HWSJBS2L2LTJ`
*   **StellarExpert Explorer Link**: [CampusIdentity on StellarExpert](https://stellar.expert/explorer/testnet/contract/CBDU4NVTNNWFCGQEXE4MJDB62QQ4XTACSH3NPLNPGUY2HWSJBS2L2LTJ)
*   **WASM Hash**: `78dd41930dfdb88384ec6c0d9827b35e573bf18d7d396a4af7d7c1f72ec62529`
*   **Transactions**:
    *   **WASM Upload (Install)**: `8bad1cb61b841a8ef03c54cc502a353241feea2d48107bf4adbdc6f40dfd0317` — [WASM Upload Tx Details](https://stellar.expert/explorer/testnet/tx/8bad1cb61b841a8ef03c54cc502a353241feea2d48107bf4adbdc6f40dfd0317)
    *   **Contract Instantiate**: `93afa3e2308a8ec323728ac41b10f381ddc37f9dd63064886e8905a95a733675` — [Instantiate Tx Details](https://stellar.expert/explorer/testnet/tx/93afa3e2308a8ec323728ac41b10f381ddc37f9dd63064886e8905a95a733675)
    *   **initialize() invoke**: `4e7be04979a7fab6814c287caa2e43aaf2d9638509e19f365b78c8d2ab665281` — [Initialize Tx Details](https://stellar.expert/explorer/testnet/tx/4e7be04979a7fab6814c287caa2e43aaf2d9638509e19f365b78c8d2ab665281)

### 2. CampusToken (CAMP)
*   **Contract Address**: `CAVSOYND5FJRRLEPSSVTRRKFEZ2KTX6WR7LZP5GLCLFDXNYUNPERKDXJ`
*   **StellarExpert Explorer Link**: [CampusToken on StellarExpert](https://stellar.expert/explorer/testnet/contract/CAVSOYND5FJRRLEPSSVTRRKFEZ2KTX6WR7LZP5GLCLFDXNYUNPERKDXJ)
*   **WASM Hash**: `d4c216fe541eeb748a27b2a49f217f5f266b60d96acc61ba5e1893b5106a2fd7`
*   **Transactions**:
    *   **Contract Instantiate**: `e40bb4b3762010ac60f974929dd63467c1b62fbb1e458ce79cd19d538ba08fea` — [Instantiate Tx Details](https://stellar.expert/explorer/testnet/tx/e40bb4b3762010ac60f974929dd63467c1b62fbb1e458ce79cd19d538ba08fea)
    *   **initialize() invoke**: `2a66548fd7853a86cd766a210dbfca281b816852eeac2c3831a40010bb35491b` — [Initialize Tx Details](https://stellar.expert/explorer/testnet/tx/2a66548fd7853a86cd766a210dbfca281b816852eeac2c3831a40010bb35491b)
    *   **set_service_contract() invoke**: `adfa0905e0916ad58c2694f77a05a56b42475c1d9e630eef2254b4ffd6c711c4` — [Set Service Tx Details](https://stellar.expert/explorer/testnet/tx/adfa0905e0916ad58c2694f77a05a56b42475c1d9e630eef2254b4ffd6c711c4)

### 3. CampusService
*   **Contract Address**: `CCNGBCJIUTWFJAFHXYSNLABXHC3MXLMK7TEZYKY5Z4DFCWHLIIBGCJMO`
*   **StellarExpert Explorer Link**: [CampusService on StellarExpert](https://stellar.expert/explorer/testnet/contract/CCNGBCJIUTWFJAFHXYSNLABXHC3MXLMK7TEZYKY5Z4DFCWHLIIBGCJMO)
*   **WASM Hash**: `a11f140bf31a433282e99aa8b85937e263bb3e0584bf40b76db69831c9847453`
*   **Transactions**:
    *   **WASM Upload (Install)**: `5664bd23921a9f983573835f915b20f86624b258d9590ec5a2a6b3efc823558d` — [WASM Upload Tx Details](https://stellar.expert/explorer/testnet/tx/5664bd23921a9f983573835f915b20f86624b258d9590ec5a2a6b3efc823558d)
    *   **Contract Instantiate**: `6b9a3f72c8b7ee3fc788cb39083b3f05e62dfd47577f9bd38528db4e2f960450` — [Instantiate Tx Details](https://stellar.expert/explorer/testnet/tx/6b9a3f72c8b7ee3fc788cb39083b3f05e62dfd47577f9bd38528db4e2f960450)
    *   **initialize() invoke**: `37fdc984517801a18cabf409e04c7c1b35d5c6f437304a352166a5e134c4e8e3` — [Initialize Tx Details](https://stellar.expert/explorer/testnet/tx/37fdc984517801a18cabf409e04c7c1b35d5c6f437304a352166a5e134c4e8e3)
    *   **set_native_token() invoke**: `c9f744dc505c9b2717107962f9b4872f4b83e79d584941185b87f60ff0fd690a` — [Set Native Token Tx Details](https://stellar.expert/explorer/testnet/tx/c9f744dc505c9b2717107962f9b4872f4b83e79d584941185b87f60ff0fd690a)
    *   **set_identity_contract() invoke**: `8ad6c64219bea86e668cc5e0c5b931298b410a114c629f6481649c4a2dc5f014` — [Set Identity Contract Tx Details](https://stellar.expert/explorer/testnet/tx/8ad6c64219bea86e668cc5e0c5b931298b410a114c629f6481649c4a2dc5f014)

### 4. Native Stellar Asset Contract (XLM Wrapper)
*   **Contract Address**: `CDLZFC3SYJYDZT7K67VZ75HPJVIEUVNIXF47ZG2FB2RMQQVU2HHGCYSC`
*   **StellarExpert Explorer Link**: [Native XLM Contract on StellarExpert](https://stellar.expert/explorer/testnet/contract/CDLZFC3SYJYDZT7K67VZ75HPJVIEUVNIXF47ZG2FB2RMQQVU2HHGCYSC)

---

## Repeatable Deployment Pipeline

The pipeline is automated via scripts located under the `deploy/` directory:

1.  **Deploy WASM and Instantiate Contracts**:
    ```bash
    ./deploy/testnet.sh
    ```
    This generates the `CAMPUSCHAIN_TESTNET` keys, funds them via Friendbot, adds the network to CLI config, and deploys all three contract WASMs, displaying their contract IDs.
2.  **Initialize and Wire Contracts**:
    ```bash
    ./deploy/init.sh <TOKEN_CONTRACT_ID> <SERVICE_CONTRACT_ID> <IDENTITY_CONTRACT_ID> CAMPUSCHAIN_TESTNET testnet
    ```
    This initializes metadata, sets the cross-contract links, and binds the native XLM token and identity addresses.
3.  **Upgrade Contract WASM**:
    ```bash
    ./deploy/upgrade.sh <CONTRACT_ID> <NEW_WASM_PATH> CAMPUSCHAIN_TESTNET testnet
    ```
    This uploads the new WASM binary and triggers the `upgrade()` method on the contract.
