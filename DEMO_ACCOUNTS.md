# CampusChain Testnet Demo Accounts

All accounts below are Friendbot-funded Testnet aliases. Their secret keys are deliberately not stored in this repository. The profile, university, and menu state was seeded against the active university-scoped deployment on 2026-07-30.

| Name | Role | University code | Verification | Stellar public address |
| --- | --- | --- | --- | --- |
| Aarav Shah | University Admin — Registrar | NIT | Active (university approved) | `GAU642FVTOBEGYEWZEMNJRBT2GCHNTRN53XGURKLIJLSU463MTJEIKKV` |
| Maya Patel | Merchant — Food/Canteen | NIT | Verified | `GDIQSPFWKQNEUFBTPPIBPWURL2MTQSYVVEI4M6RPUO7QI4ML46KPDGGW` |
| Rohan Mehta | Merchant — Retail | NIT | Verified | `GDQ5WPHHWRUT2B463SSAIWF7CPPQP7LARIHDFCB4YEGVD4EVM4PBPE6N` |
| Priya Nair | University Admin — Dean | IITM | Active (university approved) | `GACQIDPAJS3AV6QO6XN2B35BNZT7ZBSTMG3LKQBR5TJFPCF35HM7GPCW` |
| Kabir Singh | Student | NIT | Verified | `GAD4TBADJYUBVEM3OK2KNZP362XUDO35AHHBFB4FNWUXFKUZMZGEEMUO` |
| Isha Verma | Student | NIT | Pending | `GBLQMWJKII2WK4PXGMSRADYVQOQTQ7CSSO52H4WEPSOXK7GBBTRIYTTO` |
| Dev Kumar | Student | NIT | Pending | `GB2EJZYZIDDRVIXR34CEBWQOL2BMIVP25F6AZ5FOSCK4BQO7Y36LLEFF` |
| Zoya Khan | Student | IITM | Verified | `GDIPTRUENOV6J2IQAONYKMMI6ZJB3NVPAS7RBYAN7L2MHTBFSJM3OOJC` |
| Neel Joshi | Event Organizer | NIT | Verified | `GDTBRUTAKEPCF2XOJPVTUZA7KZONRV3XXUFX6SI4W5ACP4MMLZITVZRS` |
| Ananya Bose | Student | IITM | Verified | `GDBRMPRZZEFSLF2TAX6TSW26FUZBYUTNM62CQFQ32JAFKNL74VOSEHPI` |

## Active Testnet contracts

| Contract | Address |
| --- | --- |
| CampusIdentity / University Registry | `CBSP6PGVKP3OHV7CHFIVNYA6GA3WQ2VGWMGW4YTG7IF6FBEKUVFKNH6Q` |
| CampusToken | `CCNX6UK6XNBXG63I75R5EVRHXQKD23ECUUJSH6NPV32OWJWJL72ZQCP2` |
| CampusService | `CATHDHIUADXXENVYN7Z2ABSERDYUGK7OQMWFODBW7I66HS43WSUZNGLL` |

## Seeded university state

- **NIT** — National Institute of Technology; University Admin Aarav Shah. Registered in [`29bec359…`](https://stellar.expert/explorer/testnet/tx/29bec3591ce2a7891611d5decb073dcab3f54c57451e175e2b32c1c2fa6df9ce) and approved by the immutable Platform Admin in [`04683cb1…`](https://stellar.expert/explorer/testnet/tx/04683cb10152c4c333679799a4a15423bcbb8f6e535e787128301b2ba2670f3b).
- **IITM** — Indian Institute of Technology Madras; University Admin Priya Nair. Registered in [`c9bb6ba4…`](https://stellar.expert/explorer/testnet/tx/c9bb6ba4f7044109901767022931623d8a6e374b7882d64ae7daaa20ee2419a0) and approved in [`578948c5…`](https://stellar.expert/explorer/testnet/tx/578948c576d3fb87709362abd8ffd5f5ae4992992d4b595b1920aed65104583e).

University Admin verification transactions include Maya [`83802d4b…`](https://stellar.expert/explorer/testnet/tx/83802d4b189e79ce76b0df482c58926656dc87d355e55376adc0378f9c2bea7d), Rohan [`ce09aa46…`](https://stellar.expert/explorer/testnet/tx/ce09aa46db3030b7146954e9962d89a10db6bec8ad7e493c0ca67a47256dea85), Kabir [`844e0eec…`](https://stellar.expert/explorer/testnet/tx/844e0eec3d48994a5b1b9943350e6d2ffb280779e69da21a0c430db64be82f07), Zoya [`e8d2fa6d…`](https://stellar.expert/explorer/testnet/tx/e8d2fa6d89de2d33cb2aadbf552ab4da6c0a95b3d1280f022e0ed6ad67fad5a2), Neel [`19cb1648…`](https://stellar.expert/explorer/testnet/tx/19cb16480f7005fd236fb4c8b996d157e1d22a4c24b0cb7ef300e45dbb77db9f), and Ananya [`d3852a12…`](https://stellar.expert/explorer/testnet/tx/d3852a1214b09a947eb596a658ad1118319efea41bdddbd5c9bcde6446ac0dff).

## Food ordering seed

Maya Patel is a verified Food/Canteen merchant at NIT. The canonical CampusService contract has two available menu items:

- `#1` Masala Dosa — 35 CAMP, published in [`a6ea05d3…`](https://stellar.expert/explorer/testnet/tx/a6ea05d368a49a267599651462d5deb81a28cbb51d071bbc70c493dc2528394c)
- `#2` Filter Coffee — 15 CAMP, published in [`54502809…`](https://stellar.expert/explorer/testnet/tx/54502809ff90d6ad8c2be9880030fffbc3d50e77791561e1ca072918a75bdef4)

Only verified NIT students can place orders from these items. Testnet balances and Friendbot funding are ephemeral; public addresses and this on-chain state are safe to share.
