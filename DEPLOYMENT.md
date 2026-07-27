# CampusChain — Testnet Deployment Record

This document records the official smart contract deployment details on the Stellar Testnet.

## Deployed Identity

*   **Identity Name**: `CAMPUSCHAIN_TESTNET`
*   **Stellar Public Address**: `GBPVICMAESR2O4LJRDAV2YGGIQDAEY6ANCAF3GLIXEYRAIDDXM7WQP7X`
*   **StellarExpert Account Link**: [StellarExpert Account Details](https://stellar.expert/explorer/testnet/account/GBPVICMAESR2O4LJRDAV2YGGIQDAEY6ANCAF3GLIXEYRAIDDXM7WQP7X)

---

## Contract Deployments

### 1. CampusIdentity
*   **Contract Address**: `CAICTPPKS7JOWZMPK2UHTJAEXDYWNEXLDBFLAPFSZURKDCRNYUCRHCSR`
*   **StellarExpert Explorer Link**: [CampusIdentity on StellarExpert](https://stellar.expert/explorer/testnet/contract/CAICTPPKS7JOWZMPK2UHTJAEXDYWNEXLDBFLAPFSZURKDCRNYUCRHCSR)
*   **WASM Hash**: `827b1a6d568ef124d72311a603a5ccfdcfe2ee6e87b5ac7f7af892fcde261351`
*   **Transactions**:
    *   **WASM Upload (Install)**: `31879a9aff3e285662250bf9d7681531fa26a9b29c13f4692256c5b0846e72da` — [WASM Upload Tx Details](https://stellar.expert/explorer/testnet/tx/31879a9aff3e285662250bf9d7681531fa26a9b29c13f4692256c5b0846e72da)
    *   **Contract Instantiate**: `925aecc01a4a9b79bb13dec6f417c1abaeac9cf73a1c525189b76edbc5479fe3` — [Instantiate Tx Details](https://stellar.expert/explorer/testnet/tx/925aecc01a4a9b79bb13dec6f417c1abaeac9cf73a1c525189b76edbc5479fe3)
    *   **initialize() invoke**: `48a93e71208bb0e8b82b7ac5feec41427e6fa87dbb3528d285bea41ad9cdcaca` — [Initialize Tx Details](https://stellar.expert/explorer/testnet/tx/48a93e71208bb0e8b82b7ac5feec41427e6fa87dbb3528d285bea41ad9cdcaca)

### 2. CampusToken (CAMP)
*   **Contract Address**: `CAODSL3PHLTCLATVT4FZWXNMSN6WVKZ4LLOSVLLE5OJSVAHAOG4UYEDZ`
*   **StellarExpert Explorer Link**: [CampusToken on StellarExpert](https://stellar.expert/explorer/testnet/contract/CAODSL3PHLTCLATVT4FZWXNMSN6WVKZ4LLOSVLLE5OJSVAHAOG4UYEDZ)
*   **WASM Hash**: `25b4ab1ea6331f976e7eac727251420b3ea00236cb1e4d1ba621afe0bf933e98`
*   **Transactions**:
    *   **WASM Upload (Install)**: `021d3e2547f36ce5012e395eec0683bf868e33e1691e2d13eaabd7d11a56bad3` — [WASM Upload Tx Details](https://stellar.expert/explorer/testnet/tx/021d3e2547f36ce5012e395eec0683bf868e33e1691e2d13eaabd7d11a56bad3)
    *   **Contract Instantiate**: `01b27783400d9bd3fc17772dca40dad4b589af593efd71da61f1b2e3684c6258` — [Instantiate Tx Details](https://stellar.expert/explorer/testnet/tx/01b27783400d9bd3fc17772dca40dad4b589af593efd71da61f1b2e3684c6258)
    *   **initialize() invoke**: `4cb97e4fed885d2eb6665be97c3252dd6f1ffa39308c40496a605fc8340c45f2` — [Initialize Tx Details](https://stellar.expert/explorer/testnet/tx/4cb97e4fed885d2eb6665be97c3252dd6f1ffa39308c40496a605fc8340c45f2)
    *   **set_service_contract() invoke**: `fee67281e8a837159d5d63d201a073da222b37e2b1a4a2e682502e81d891e6bf` — [Set Service Tx Details](https://stellar.expert/explorer/testnet/tx/fee67281e8a837159d5d63d201a073da222b37e2b1a4a2e682502e81d891e6bf)

### 3. CampusService
*   **Contract Address**: `CA4FLLDHACOF23QFI3CQILR44KJ6M6DXND77RUMAGCTRRG3KK4ZY7RJJ`
*   **StellarExpert Explorer Link**: [CampusService on StellarExpert](https://stellar.expert/explorer/testnet/contract/CA4FLLDHACOF23QFI3CQILR44KJ6M6DXND77RUMAGCTRRG3KK4ZY7RJJ)
*   **WASM Hash**: `6116b96e6bdbd09112d51a9b1a13576d584c0e3a027236beae619fdaee08466f`
*   **Transactions**:
    *   **WASM Upload (Install)**: `0cc33d1a16043d4ef7ff650fe04306068ce89e3cd32e15ee897f39d8459b8bf9` — [WASM Upload Tx Details](https://stellar.expert/explorer/testnet/tx/0cc33d1a16043d4ef7ff650fe04306068ce89e3cd32e15ee897f39d8459b8bf9)
    *   **Contract Instantiate**: `b6f49f1accc9add096000581b860e8d01e5f02869c41dd97f5ad21a0f23e4187` — [Instantiate Tx Details](https://stellar.expert/explorer/testnet/tx/b6f49f1accc9add096000581b860e8d01e5f02869c41dd97f5ad21a0f23e4187)
    *   **initialize() invoke**: `404c3f44c99b7f6b7cd8d06d5a9ba041b88b52d1f93b7e97bc0c081923b6ffc7` — [Initialize Tx Details](https://stellar.expert/explorer/testnet/tx/404c3f44c99b7f6b7cd8d06d5a9ba041b88b52d1f93b7e97bc0c081923b6ffc7)
    *   **set_native_token() invoke**: `51c3f39fd216f458cbd31c889c166cef23da232c274711c7635a9355cf42f058` — [Set Native Token Tx Details](https://stellar.expert/explorer/testnet/tx/51c3f39fd216f458cbd31c889c166cef23da232c274711c7635a9355cf42f058)
    *   **set_identity_contract() invoke**: `d88bd65790d4a72d16870b277b668753af54e417cf124a2457551e5fe82f9c3e` — [Set Identity Contract Tx Details](https://stellar.expert/explorer/testnet/tx/d88bd65790d4a72d16870b277b668753af54e417cf124a2457551e5fe82f9c3e)

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
