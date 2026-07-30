# CampusChain Testnet Demo Accounts

All accounts below are funded by Friendbot and have profiles registered on the deployed Testnet Identity contract. Their secret keys are deliberately not stored in this repository. They are local Testnet-only aliases used to seed and verify this environment.

| Name | Role | Department | Stellar public address |
| --- | --- | --- | --- |
| Aarav Shah | Admin | Administration | `GAU642FVTOBEGYEWZEMNJRBT2GCHNTRN53XGURKLIJLSU463MTJEIKKV` |
| Maya Patel | Merchant | Campus Store | `GDIQSPFWKQNEUFBTPPIBPWURL2MTQSYVVEI4M6RPUO7QI4ML46KPDGGW` |
| Rohan Mehta | Merchant | Electronics | `GDQ5WPHHWRUT2B463SSAIWF7CPPQP7LARIHDFCB4YEGVD4EVM4PBPE6N` |
| Priya Nair | Student (verified) | Computer Science | `GACQIDPAJS3AV6QO6XN2B35BNZT7ZBSTMG3LKQBR5TJFPCF35HM7GPCW` |
| Kabir Singh | Student | Mechanical Engineering | `GAD4TBADJYUBVEM3OK2KNZP362XUDO35AHHBFB4FNWUXFKUZMZGEEMUO` |
| Isha Verma | Student | Design | `GBLQMWJKII2WK4PXGMSRADYVQOQTQ7CSSO52H4WEPSOXK7GBBTRIYTTO` |
| Dev Kumar | Student | Economics | `GB2EJZYZIDDRVIXR34CEBWQOL2BMIVP25F6AZ5FOSCK4BQO7Y36LLEFF` |
| Zoya Khan | Student | Biotechnology | `GDIPTRUENOV6J2IQAONYKMMI6ZJB3NVPAS7RBYAN7L2MHTBFSJM3OOJC` |
| Neel Joshi | Student | Mathematics | `GDTBRUTAKEPCF2XOJPVTUZA7KZONRV3XXUFX6SI4W5ACP4MMLZITVZRS` |
| Ananya Bose | Student | Media Studies | `GDBRMPRZZEFSLF2TAX6TSW26FUZBYUTNM62CQFQ32JAFKNL74VOSEHPI` |

## Deployed Testnet contracts

| Contract | Address |
| --- | --- |
| CampusIdentity | `CDC7AN2SDMRCDXLSSPT4DTXPL25QYKDD45DQ3WB27KV2AJUDG5P3FUU7` |
| CampusToken | `CDZND4MZAJ56UKLAEQFPGZBTWHT4KNCT5D367EZHOTRP7UOXJMQGWC2F` |
| CampusService | `CBUV3KY32K3DF3RKDN3FTE3FWJDRDKQVCHQKPYD5K6Q6ET4ZALJ5RRDB` |

## Seeded on-chain content

- Marketplace listing 1: **Algorithms Textbook**, Merchant Maya Patel. It was purchased through escrow and released; it remains visible as sold with escrow `#1`.
- Marketplace listing 2: **Scientific Calculator**, Merchant Rohan Mehta. It remains active and escrow-enabled.
- Events: IDs `1` (paid, 5 CAMP, capacity 80) and `2` (free, capacity 120), hosted by the configured university administrator.
- Rewards: Campus Cafe Voucher and Library Print Credit.
- Scholarship: STEM Success Grant (100 CAMP, minimum GPA 3.50) with a real application from Priya Nair.

## Confirmed Testnet transactions

- CAMP payment, Priya → Kabir, 12.3 CAMP: [`ff91126ab7880cfcf59cd96743c7a7293a97b50a9fe363109474d0714db55c44`](https://stellar.expert/explorer/testnet/tx/ff91126ab7880cfcf59cd96743c7a7293a97b50a9fe363109474d0714db55c44)
- Marketplace escrow purchase, Priya → Algorithms Textbook: [`5af588b29d9b05c766364b0ab8f2fd6587602e0c1b96c3761ff5524b6eca9960`](https://stellar.expert/explorer/testnet/tx/5af588b29d9b05c766364b0ab8f2fd6587602e0c1b96c3761ff5524b6eca9960)
- Escrow release to Maya Patel: [`e4616ec308a3e51ffd165155e46a9f01150161579033bdd7eb137920f268d7d2`](https://stellar.expert/explorer/testnet/tx/e4616ec308a3e51ffd165155e46a9f01150161579033bdd7eb137920f268d7d2)

Testnet balances and Friendbot funding are ephemeral. The public addresses and the on-chain state above are safe to share; do not request or commit the associated secret keys.
