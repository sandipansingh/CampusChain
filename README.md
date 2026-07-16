# <p align="center">CAMPUSCHAIN – UNIFIED CAMPUS ECONOMY</p>

CampusChain is a unified, decentralized campus economy platform that replaces disconnected cash and manual-verification payment portals with a single secure, Stellar-powered payment, escrow, and ticketing portal.

---

## 🚀 Live Demo & Deployments

> [!NOTE]
> The links below are placeholders for deployment and will be finalized upon network activation.

* **Live Demo Portal**: `https://campuschain-demo.vercel.app`
* **Demo Video Tour**: `https://youtube.com/watch?v=campuschain-demo`
* **CampusToken Contract Address**: `CD2LH66FJ4UWSKAFB3AD2I6WHKDZ4KGZIQCN47HW2Y3IYLCRJHLX5HAL`
* **CampusService Contract Address**: `CBPX6MKVPO3WJWUS2RSN4CZPTH45GYMEEAXIOUZ6RA2RTBV42Y35WX5R`
* **CampusToken Deploy Tx Hash**: [957146cd6d61d97126b6209fb59e68f671adc1a416013437a4cd9ccd19eb024b](https://stellar.expert/explorer/testnet/tx/957146cd6d61d97126b6209fb59e68f671adc1a416013437a4cd9ccd19eb024b)
* **CampusToken Init Tx Hash**: [5c066f3caac1d1c8b0daf279621bcb3360484e55f5cdefeef67d3fea91b89825](https://stellar.expert/explorer/testnet/tx/5c066f3caac1d1c8b0daf279621bcb3360484e55f5cdefeef67d3fea91b89825)
* **CampusService Deploy Tx Hash**: [7e52be17cd7b8a0da2e1c3ac395a1a6ee7730de403609594ad550f24a147c380](https://stellar.expert/explorer/testnet/tx/7e52be17cd7b8a0da2e1c3ac395a1a6ee7730de403609594ad550f24a147c380)
* **CampusService Init Tx Hash**: [9fa9b170c1d28216d61546fd3c35d87e5192dc6d25eb0c0c8f53d29c3008ceb6](https://stellar.expert/explorer/testnet/tx/9fa9b170c1d28216d61546fd3c35d87e5192dc6d25eb0c0c8f53d29c3008ceb6)

### Screenshots
* **Mobile Responsive UI Layout**:
  ![Mobile Responsive Layout](https://placehold.co/600x400/09090b/fafafa?text=MOBILE+RESPONSIVE+LAYOUT)
* **CI/CD Test Runner Execution**:
  ![CI/CD pipeline running](https://placehold.co/600x400/09090b/fafafa?text=CI/CD+PIPELINE+RUNNING)
* **Vitest + Cargo Test Outputs**:
  ![Test outputs showing 3+ passing tests](https://placehold.co/600x400/09090b/fafafa?text=VITEST+AND+CARGO+PASSING+TESTS)

---

## 1. System Architecture

The following diagrams illustrate the CampusChain platform architecture and transaction sequence. For complete details, see [System Architecture & Diagrams](./docs/architecture.md).

### Component Architecture
```mermaid
graph TD
    %% Styling Definitions
    classDef frontend fill:#2563EB,stroke:#1D4ED8,stroke-width:2px,color:#FFFFFF;
    classDef contract fill:#D97706,stroke:#B45309,stroke-width:2px,color:#FFFFFF;
    classDef stellar fill:#059669,stroke:#047857,stroke-width:2px,color:#FFFFFF;
    classDef state fill:#7C3AED,stroke:#6D28D9,stroke-width:2px,color:#FFFFFF;

    subgraph Client ["Client Application (Next.js 15)"]
        UI["Visual UI Components<br/>(Landing, Dashboard, Pages)"]
        SWK["StellarWalletsKit<br/>(Freighter / Albedo / RWallet)"]
        Zustand["Zustand Stores<br/>(Local Wallet/Tx State)"]
        ReactQuery["React Query<br/>(Cached Ledger Data)"]
    end

    subgraph StellarNetwork ["Stellar / Soroban Ledger Layer"]
        RPC["Soroban RPC Server<br/>(Transaction Ingestion & Events)"]
        Horizon["Stellar Horizon API<br/>(Classic Balance & History)"]
        
        subgraph SorobanContracts ["On-Chain Contracts"]
            Token["CampusToken Contract<br/>(Custom ERC-20 / RBAC)"]
            Service["CampusService Contract<br/>(Escrow & Ticket Sales)"]
        end
    end

    %% Interactions
    UI --> SWK
    UI --> Zustand
    UI --> ReactQuery
    ReactQuery --> RPC
    ReactQuery --> Horizon
    SWK -.-> |Sign & Submit| RPC
    RPC --> SorobanContracts
    
    Service --> |C2C Call: transfer_from / transfer| Token

    %% Assigning Classes
    class UI,SWK frontend;
    class Zustand,ReactQuery state;
    class RPC,Horizon stellar;
    class Token,Service contract;
```

### Ticket Purchase Sequence (C2C Calls & Events)
```mermaid
sequenceDiagram
    autonumber
    actor User as Student/User
    participant UI as Next.js Client (SWK)
    participant RPC as Soroban RPC
    participant SC as CampusService Contract
    participant TC as CampusToken Contract

    User->>UI: Select Buy Ticket (Event ID)
    UI->>RPC: Send Approve Tx (Spender: CampusService, Amount)
    RPC-->>UI: Transaction Confirmed
    UI->>RPC: Send Buy Ticket Tx (Event ID, Buyer)
    RPC->>SC: Invoke buy_ticket(event_id, buyer)
    SC->>SC: Query event price & checks
    SC->>TC: C2C Call: transfer_from(buyer, host, price)
    TC-->>SC: Success
    SC->>SC: Mint ticket & save
    SC-->>RPC: Emits TicketBought Event
    RPC-->>UI: Event Confirmed
    UI-->>User: Show Confirmed Ticket Pass
```

---

## 2. Tech Stack

[![Tech Stack](https://skillicons.dev/icons?i=nextjs,ts,tailwind,react,rust,postgres,redis,nodejs,git,github&perline=10)](https://skillicons.dev)

![Stellar](https://img.shields.io/badge/Stellar-7D00FF?style=for-the-badge&logo=stellar&logoColor=white)
![Soroban](https://img.shields.io/badge/Soroban-000000?style=for-the-badge)
![Zustand](https://img.shields.io/badge/Zustand-593D88?style=for-the-badge)
![React Query](https://img.shields.io/badge/React_Query-FF4154?style=for-the-badge&logo=reactquery&logoColor=white)
![shadcn/ui](https://img.shields.io/badge/shadcn%2Fui-000000?style=for-the-badge)
![Vitest](https://img.shields.io/badge/Vitest-6E9F18?style=for-the-badge&logo=vitest&logoColor=white)
![GitHub Actions](https://img.shields.io/badge/GitHub_Actions-2088FF?style=for-the-badge&logo=githubactions&logoColor=white)

- **Smart Contracts**: Rust & Soroban SDK
- **Frontend**: Next.js 15 (App Router), TypeScript, Tailwind CSS v4, Zustand, TanStack React Query v5
- **Wallet Integrations**: StellarWalletsKit
- **Testing**: Vitest & React Testing Library (Frontend), native cargo test harness (Contracts)
- **CI/CD**: GitHub Actions

---

## 3. Quick Start

### Smart Contracts Workspace
To compile and test the contracts, run:
```bash
cargo build --target wasm32-unknown-unknown --release
cargo test
```

### Frontend Workspace
To launch the development server:
```bash
cd frontend
npm install
npm run test
npm run dev
```

---

## 4. Documentation Index

Detailed engineering guides are located in the `/docs` directory:
- [System Architecture & Diagrams](./docs/architecture.md)
- [Smart Contract Specifications](./docs/CONTRACTS.md)
- [Security Practices & Threat Modeling](./docs/SECURITY.md)
- [Deployment & Upgrade Guide](./docs/DEPLOYMENT.md)
- [Frontend API & Hooks Schema](./docs/API.md)
