# CampusChain — Testnet Deployment Record

This document records the official smart contract deployment details on the Stellar Testnet.

## Deployed Identity

*   **Identity Name**: `CAMPUSCHAIN_TESTNET`
*   **Stellar Public Address**: `GBPVICMAESR2O4LJRDAV2YGGIQDAEY6ANCAF3GLIXEYRAIDDXM7WQP7X`
*   **StellarExpert Account Link**: [StellarExpert Account Details](https://stellar.expert/explorer/testnet/account/GBPVICMAESR2O4LJRDAV2YGGIQDAEY6ANCAF3GLIXEYRAIDDXM7WQP7X)

---

## Contract Deployments

### 1. CampusToken (CAMP)
*   **Contract Address**: `CDGMOVTFKTMHVDZSQRSH3O4Y3FXFLORCJW3JM2YXNXQTLCBMZVKXQXJP`
*   **StellarExpert Explorer Link**: [CampusToken on StellarExpert](https://stellar.expert/explorer/testnet/contract/CDGMOVTFKTMHVDZSQRSH3O4Y3FXFLORCJW3JM2YXNXQTLCBMZVKXQXJP)
*   **WASM Hash**: `d4c216fe541eeb748a27b2a49f217f5f266b60d96acc61ba5e1893b5106a2fd7`
*   **Transactions**:
    *   **WASM Upload (Install)**: `10b3920f7f404c540bce1fa5297016fb4e76056afb599af00e5bec323ebaaf41` — [WASM Upload Tx Details](https://stellar.expert/explorer/testnet/tx/10b3920f7f404c540bce1fa5297016fb4e76056afb599af00e5bec323ebaaf41)
    *   **Contract Instantiate**: `16945cc3fdc5dfe1c0a4e481b07b792d662e24186cf2d19221692919c9ec7b9f` — [Instantiate Tx Details](https://stellar.expert/explorer/testnet/tx/16945cc3fdc5dfe1c0a4e481b07b792d662e24186cf2d19221692919c9ec7b9f)
    *   **initialize() invoke**: `6cb8941b97330ea87be549a3d485a133b0e613eb8bd06ec5ce44dcdf3cc1fa5f` — [Initialize Tx Details](https://stellar.expert/explorer/testnet/tx/6cb8941b97330ea87be549a3d485a133b0e613eb8bd06ec5ce44dcdf3cc1fa5f)
    *   **set_service_contract() invoke**: `c24bd02b8fe6e1a5420755094d1ef8fc5892de32289c7f7c4a82632b9066e754` — [Set Service Tx Details](https://stellar.expert/explorer/testnet/tx/c24bd02b8fe6e1a5420755094d1ef8fc5892de32289c7f7c4a82632b9066e754)

### 2. CampusService
*   **Contract Address**: `CDTJ56RPMPE2VNYLCV7CFPS3IHUVR4UZIRC4JJ2RWCE5WDHB6BVAYSSM`
*   **StellarExpert Explorer Link**: [CampusService on StellarExpert](https://stellar.expert/explorer/testnet/contract/CDTJ56RPMPE2VNYLCV7CFPS3IHUVR4UZIRC4JJ2RWCE5WDHB6BVAYSSM)
*   **WASM Hash**: `ef7cf31ac1f6df0b0a4a553abd1f1dd76ce09e67ee8b938db9d13281370556e6`
*   **Transactions**:
    *   **WASM Upload (Install)**: `f2f166634dcb3260eb80645e257662a3a840518199e3c6a8cd301700b814eed7` — [WASM Upload Tx Details](https://stellar.expert/explorer/testnet/tx/f2f166634dcb3260eb80645e257662a3a840518199e3c6a8cd301700b814eed7)
    *   **Contract Instantiate**: `910045a92044d2b15b159202b85ed79c9e8c4a0aa5faf94e68d61184bd97a723` — [Instantiate Tx Details](https://stellar.expert/explorer/testnet/tx/910045a92044d2b15b159202b85ed79c9e8c4a0aa5faf94e68d61184bd97a723)
    *   **initialize() invoke**: `9eaa7ea3110a210193051547090e6e04407960de140b8139bdcdf6cfa2dc7762` — [Initialize Tx Details](https://stellar.expert/explorer/testnet/tx/9eaa7ea3110a210193051547090e6e04407960de140b8139bdcdf6cfa2dc7762)
    *   **set_native_token() invoke**: `b390a82caf94a26eae62f21e3ecce144a953266a37e0ab0d963452502e7d04a8` — [Set Native Token Tx Details](https://stellar.expert/explorer/testnet/tx/b390a82caf94a26eae62f21e3ecce144a953266a37e0ab0d963452502e7d04a8)

### 3. Native Stellar Asset Contract (XLM Wrapper)
*   **Contract Address**: `CDLZFC3SYJYDZT7K67VZ75HPJVIEUVNIXF47ZG2FB2RMQQVU2HHGCYSC`
*   **StellarExpert Explorer Link**: [Native XLM Contract on StellarExpert](https://stellar.expert/explorer/testnet/contract/CDLZFC3SYJYDZT7K67VZ75HPJVIEUVNIXF47ZG2FB2RMQQVU2HHGCYSC)

---

## Repeatable Deployment Pipeline

The pipeline is automated via scripts located under the `deploy/` directory:

1.  **Deploy WASM and Instantiate Contracts**:
    ```bash
    ./deploy/testnet.sh
    ```
    This generates the `CAMPUSCHAIN_TESTNET` keys, funds them via Friendbot, adds the network to CLI config, and deploys both contract WASMs, displaying their contract IDs.
2.  **Initialize and Wire Contracts**:
    ```bash
    ./deploy/init.sh <TOKEN_CONTRACT_ID> <SERVICE_CONTRACT_ID> CAMPUSCHAIN_TESTNET testnet
    ```
    This initializes metadata, sets the cross-contract links (`set_service_contract`), and binds the native XLM token address.
3.  **Upgrade Contract WASM**:
    ```bash
    ./deploy/upgrade.sh <CONTRACT_ID> <NEW_WASM_PATH> CAMPUSCHAIN_TESTNET testnet
    ```
    This uploads the new WASM binary and triggers the `upgrade()` method on the contract.
