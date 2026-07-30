# CampusChain — Testnet Deployment Record

This is the active university-scoped RBAC deployment on Stellar Testnet, deployed on 2026-07-30.

## Platform Admin

- **Key alias:** `campuschain-phase1-admin`
- **Immutable Platform Admin:** [`GC6BMAHRKAWHPPI6T67QZV2CQIWG7DVJT47ZNZQUYF3L625G3OPNBBSQ`](https://stellar.expert/explorer/testnet/account/GC6BMAHRKAWHPPI6T67QZV2CQIWG7DVJT47ZNZQUYF3L625G3OPNBBSQ)

The Identity initializer stores this address as the sole Platform Admin profile. Token and Service initialization both verify this value through an inter-contract call before their immutable links are stored.

## Contract Deployments

| Contract | Address | WASM hash |
| --- | --- | --- |
| CampusIdentity / University Registry | [`CBSP6PGVKP3OHV7CHFIVNYA6GA3WQ2VGWMGW4YTG7IF6FBEKUVFKNH6Q`](https://stellar.expert/explorer/testnet/contract/CBSP6PGVKP3OHV7CHFIVNYA6GA3WQ2VGWMGW4YTG7IF6FBEKUVFKNH6Q) | `277d0f9d5c9c89e5682644519ddf23165736fbdf8a5ad3d9c45b9f9201c10f37` |
| CampusToken (CAMP) | [`CCNX6UK6XNBXG63I75R5EVRHXQKD23ECUUJSH6NPV32OWJWJL72ZQCP2`](https://stellar.expert/explorer/testnet/contract/CCNX6UK6XNBXG63I75R5EVRHXQKD23ECUUJSH6NPV32OWJWJL72ZQCP2) | `947105425fb113cbeb20ed057c97a855af8f2a4677e739e61c9ef160fbf7ee08` |
| CampusService (escrow, marketplace, events, payments, food ordering) | [`CATHDHIUADXXENVYN7Z2ABSERDYUGK7OQMWFODBW7I66HS43WSUZNGLL`](https://stellar.expert/explorer/testnet/contract/CATHDHIUADXXENVYN7Z2ABSERDYUGK7OQMWFODBW7I66HS43WSUZNGLL) | `7f7b3fc4b42ea26070f639f762dfbf66868b2d8bad34665ee239d2cab33cd331` |
| Native XLM SAC | [`CDLZFC3SYJYDZT7K67VZ75HPJVIEUVNIXF47ZG2FB2RMQQVU2HHGCYSC`](https://stellar.expert/explorer/testnet/contract/CDLZFC3SYJYDZT7K67VZ75HPJVIEUVNIXF47ZG2FB2RMQQVU2HHGCYSC) | Stellar Testnet native asset |

## Confirmed deployment transactions

| Contract | Upload | Instantiate | Initialize |
| --- | --- | --- | --- |
| CampusIdentity | [`c70e70bb…`](https://stellar.expert/explorer/testnet/tx/c70e70bb8cacf414df9a2f43d31237a5ce0c06da985277efcac17a965c5076af) | [`5c63922c…`](https://stellar.expert/explorer/testnet/tx/5c63922c7288f61b31d416c0bd6d90f98540495ffe8183bbcd488c35aa3af3dc) | [`2d486a0f…`](https://stellar.expert/explorer/testnet/tx/2d486a0f68b18bd38b6fbfcb56f8038f5ec505c520e93f9505146ff539f5f740) |
| CampusToken | [`c37439b7…`](https://stellar.expert/explorer/testnet/tx/c37439b75879fd883dd651c02671ee5c7b045f0b999942137e502851093f1f74) | [`ec665d64…`](https://stellar.expert/explorer/testnet/tx/ec665d6406dbdbee325ab57b83615df88e8ce8dc2215bb1ca65dd535daf11150) | [`724d059d…`](https://stellar.expert/explorer/testnet/tx/724d059daaef98122ada22e472f618e7635113dd0c3307e6e8d6967572db7b10) |
| CampusService | [`67ad28e4…`](https://stellar.expert/explorer/testnet/tx/67ad28e49911fb7eb0eee2bcf07479e97b5d995ff0cf22af0d8329e3671dcf06) | [`c919035f…`](https://stellar.expert/explorer/testnet/tx/c919035f65f72d9015740a178c02b85a3aa72facdaf1cc03a41ddc9d0c9c3767) | [`138ed001…`](https://stellar.expert/explorer/testnet/tx/138ed001e04bcf8e5448031966f23e781e24d84b2efbc3914b1dd40a631901ab) |

Initialization order was **Identity → Token → Service**. The resulting links were read back on-chain: Token and Service both point to the Identity above; Token points to Service; Service points to Token.

## Repeatable deployment pipeline

```bash
CAMPUSCHAIN_ADMIN_KEY=<key-alias-or-secret> \
NEXT_PUBLIC_CAMPUS_ADMIN_ADDRESS=<immutable-platform-admin-G-address> \
./deploy/testnet.sh
```

`deploy/testnet.sh` delegates to the canonical pipeline in `scripts/deploy.sh`. It builds imported WASM interfaces in dependency order and deploys and initializes Identity, Token, and Service. `deploy/init.sh` remains available when contracts have been instantiated manually; it requires the same `NEXT_PUBLIC_CAMPUS_ADMIN_ADDRESS` and rejects a signer that does not match it.

There is no `NEXT_PUBLIC_UNIVERSITY_REGISTRY_CONTRACT_ID`: the university registry is intentionally part of `CampusIdentity`.
