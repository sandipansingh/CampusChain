# <p align="center">CAMPUSCHAIN – UNIFIED CAMPUS ECONOMY</p>

CampusChain is a unified, decentralized campus economy platform that replaces disconnected cash and manual-verification payment portals with a single secure, Stellar-powered payment, escrow, ticketing, and university registry portal.

---

## 🚀 Live Deployments (Soroban Testnet)

| Contract | Address |
|---|---|
| **CampusToken** | `CAKWHIJWM2PNGA2XPHGU3CWXHOASOYBFBOHWXLXBAXD777SPE4TIIVHN` |
| **CampusService** | `CCP2Z6E7DSOUJRFZOPII6UYVVLLW65F2EIULLLVRAYF4LHDIEM2ZLIZH` |

### Recent Transactions

| Action | Tx Hash |
|---|---|
| CampusToken deploy | [e289aef1aadd839debcab8af2b891a8e222e368cae06d0a13e1f50971333c11b](https://stellar.expert/explorer/testnet/tx/e289aef1aadd839debcab8af2b891a8e222e368cae06d0a13e1f50971333c11b) |
| CampusToken init | [dc8ad2ac26f355fb06bcf3d56a061bd0ccfdab82d002522ac19637f8abcff740](https://stellar.expert/explorer/testnet/tx/dc8ad2ac26f355fb06bcf3d56a061bd0ccfdab82d002522ac19637f8abcff740) |
| CampusService deploy | [1de75ab7059da06d193153943c0a61267bd56bb7c4727aaa7ab6a19373d78faf](https://stellar.expert/explorer/testnet/tx/1de75ab7059da06d193153943c0a61267bd56bb7c4727aaa7ab6a19373d78faf) |
| CampusService init | [ef48290b30413eadd78af8993c7f17227efdf8ad8c20e6a9ba3406263ab2baac](https://stellar.expert/explorer/testnet/tx/ef48290b30413eadd78af8993c7f17227efdf8ad8c20e6a9ba3406263ab2baac) |

---

## 1. System Architecture

### Component Architecture
```mermaid
graph TD
    classDef frontend fill:#2563EB,stroke:#1D4ED8,stroke-width:2px,color:#FFFFFF;
    classDef contract fill:#D97706,stroke:#B45309,stroke-width:2px,color:#FFFFFF;
    classDef stellar fill:#059669,stroke:#047857,stroke-width:2px,color:#FFFFFF;
    classDef state fill:#7C3AED,stroke:#6D28D9,stroke-width:2px,color:#FFFFFF;

    subgraph Client ["Next.js 15 Client"]
        UI["UI Components"]
        SWK["StellarWalletsKit"]
        Zustand["Zustand Stores"]
        ReactQuery["React Query v5"]
    end

    subgraph StellarNetwork ["Stellar / Soroban Testnet"]
        RPC["Soroban RPC"]
        Horizon["Horizon API"]
        subgraph SorobanContracts ["On-Chain Contracts"]
            Token["CampusToken<br/>(Fungible Token + RBAC + Faucet)"]
            Service["CampusService<br/>(Escrow + Events + University Registry)"]
        end
    end

    UI --> SWK
    UI --> Zustand
    UI --> ReactQuery
    ReactQuery --> RPC
    SWK -.-> |Sign & Submit| RPC
    RPC --> SorobanContracts
    Service --> |C2C Calls| Token

    class UI,SWK frontend;
    class Zustand,ReactQuery state;
    class RPC,Horizon stellar;
    class Token,Service contract;
```

### Key Flows

**University Registration & Membership**
```mermaid
sequenceDiagram
    autonumber
    actor Admin as University Admin
    actor Student as Student
    participant SC as CampusService
    participant TC as CampusToken

    Note over Admin: Must have role 4 (University Admin)
    Admin->>SC: register_university(name, location, desc)
    SC->>TC: get_role(admin) → must be 4
    SC-->>Admin: University ID

    Student->>SC: request_join(university_id)
    SC-->>Admin: Pending request visible

    Admin->>SC: invite_member(university_id, student_addr)
    Student->>SC: accept_invite(invite_id)
    SC-->>Student: Membership confirmed
```

**Token Faucet**
```mermaid
sequenceDiagram
    autonumber
    actor User as Any Account
    participant SC as CampusService
    participant TC as CampusToken

    User->>SC: claim_faucet()
    SC->>TC: faucet(user, 100 CAMP)
    TC->>TC: Check not already claimed
    TC-->>User: 100 CAMP minted
```

**Buy CAMP with XLM**
```mermaid
sequenceDiagram
    autonumber
    actor User as Any Account
    participant SC as CampusService
    participant TC as CampusToken

    User->>SC: buy_camp_tokens(recipient, xlm_amount_stroops)
    SC->>SC: xlm_amount >= 1 XLM minimum
    SC->>SC: camp_amount = xlm_amount * 100
    SC->>TC: mint_purchase(recipient, camp_amount)
    TC->>TC: Check amount > 0
    TC-->>User: CAMP tokens minted at rate 1 XLM = 100 CAMP
```

---

## 2. Smart Contracts

### CampusToken (`contracts/campus-token`)
- **Fungible token** (7 decimals, symbol: CAMP)
- **RBAC**: `set_role(address, role)` — self-registration (0=Guest, 1=Student, 2=Merchant, 3=Club Organizer, 4=University Admin)
- **Faucet**: `faucet(address, amount)` — one-time claim of 100 CAMP per address
- **Purchase Mint**: `mint_purchase(address, amount)` — called by CampusService to mint CAMP when users buy with XLM
- **Standard token ops**: `transfer`, `approve`, `transfer_from`, `mint`, `burn`, `balance`

### CampusService (`contracts/campus-service`)
- **University Registry**: `register_university`, `list_universities`, `get_university`
- **Membership**: `request_join`, `approve_member`, `deny_member`, `invite_member`, `accept_invite`, `leave_university`, `get_membership`, `list_pending_requests`
- **Escrow**: `create_escrow`, `get_escrow`, `release_escrow`, `refund_escrow`
- **Event Ticketing**: `create_event`, `get_event`, `buy_ticket`, `get_ticket`, `redeem_ticket`
- **Token Claim**: `claim_faucet`, `has_claimed_faucet`
- **Buy CAMP**: `buy_camp_tokens(recipient, xlm_amount)` — purchase rate 1 XLM = 100 CAMP (minimum 1 XLM)

---

## 3. Tech Stack

[![Tech Stack](https://skillicons.dev/icons?i=nextjs,ts,tailwind,react,rust,git,github&perline=7)](https://skillicons.dev)

![Stellar](https://img.shields.io/badge/Stellar-7D00FF?style=for-the-badge&logo=stellar&logoColor=white)
![Soroban](https://img.shields.io/badge/Soroban-000000?style=for-the-badge)
![Zustand](https://img.shields.io/badge/Zustand-593D88?style=for-the-badge)
![React Query](https://img.shields.io/badge/React_Query-FF4154?style=for-the-badge&logo=reactquery&logoColor=white)

- **Smart Contracts**: Rust & Soroban SDK v21
- **Frontend**: Next.js 15 (App Router), TypeScript, Tailwind CSS v4, Zustand, TanStack React Query v5
- **Wallet**: StellarWalletsKit (Freighter)
- **Testing**: `cargo test` (7 contract tests), Vitest (frontend)
- **CI/CD**: GitHub Actions

---

## 4. Quick Start

### Smart Contracts
```bash
cargo build --target wasm32-unknown-unknown --release
cargo test
```

### Frontend
```bash
cd frontend
npm install
npm run dev
```

### Deploy (Testnet)
```bash
CAMPUSCHAIN_ADMIN_KEY=<secret_key> ./scripts/deploy.sh
```

### Frontend Env
Copy `frontend/.env.local` with:
```
NEXT_PUBLIC_STELLAR_RPC_URL="https://soroban-testnet.stellar.org"
NEXT_PUBLIC_STELLAR_PASSPHRASE="Test SDF Network ; September 2015"
NEXT_PUBLIC_CAMPUS_TOKEN_CONTRACT_ID="CAKWHIJWM2PNGA2XPHGU3CWXHOASOYBFBOHWXLXBAXD777SPE4TIIVHN"
NEXT_PUBLIC_CAMPUS_SERVICE_CONTRACT_ID="CCP2Z6E7DSOUJRFZOPII6UYVVLLW65F2EIULLLVRAYF4LHDIEM2ZLIZH"
```

---

## 5. Documentation Index

- [System Architecture & Diagrams](./docs/architecture.md)
- [Smart Contract Specifications](./docs/CONTRACTS.md)
- [Security Practices & Threat Modeling](./docs/SECURITY.md)
- [Deployment & Upgrade Guide](./docs/DEPLOYMENT.md)
- [Frontend API & Hooks Schema](./docs/API.md)
