# CAMPUSCHAIN – UNIFIED CAMPUS ECONOMY

[![Tech Stack](https://skillicons.dev/icons?i=nextjs,ts,tailwind,react,rust,postgres,redis,nodejs,git,github&perline=10)](https://skillicons.dev)

![Stellar](https://img.shields.io/badge/Stellar-7D00FF?style=for-the-badge&logo=stellar&logoColor=white)
![Soroban](https://img.shields.io/badge/Soroban-000000?style=for-the-badge)
![Zustand](https://img.shields.io/badge/Zustand-593D88?style=for-the-badge)
![React Query](https://img.shields.io/badge/React_Query-FF4154?style=for-the-badge&logo=reactquery&logoColor=white)
![shadcn/ui](https://img.shields.io/badge/shadcn%2Fui-000000?style=for-the-badge)
![Vitest](https://img.shields.io/badge/Vitest-6E9F18?style=for-the-badge&logo=vitest&logoColor=white)
![GitHub Actions](https://img.shields.io/badge/GitHub_Actions-2088FF?style=for-the-badge&logo=githubactions&logoColor=white)

CampusChain is a unified, decentralized campus economy platform that replaces disconnected cash and manual-verification payment portals with a single secure, Stellar-powered payment, escrow, and ticketing portal.

---

## 🚀 Live Demo & Deployments

<!-- PLACEHOLDER_START -->
> [!NOTE]
> The links below are placeholders for deployment and will be finalized upon network activation.

* **Live Demo Portal**: `https://campuschain-demo.vercel.app` (Placeholder)
* **Demo Video Tour**: `https://youtube.com/watch?v=campuschain-demo` (Placeholder - 1-2 min walkthrough)
* **CampusToken Contract Address**: `CDP3PGBJ3E7D3F6JNE27PDUWUX2VGDLOMFGBQZ2L24LGTDTKCS5G6AMP`
* **CampusService Contract Address**: `CA5W44S3S7WTRHPHHY5W7RPHHY5W7RPHHY5W7RPHHY5W7RPHHY5W7RPH`
* **Sample Escrow Interaction Hash**: `4ff73bd91223e7fde89182ab9128f9d0cba768d9018bcdef786e34ac12dfae7a` (Placeholder)
<!-- PLACEHOLDER_END -->

### Screenshots
<!-- PLACEHOLDER_SCREENSHOTS_START -->
* **Mobile Responsive UI Layout**:
  ![Mobile Responsive Layout](https://placehold.co/600x400/09090b/fafafa?text=MOBILE+RESPONSIVE+LAYOUT)
* **CI/CD Test Runner Execution**:
  ![CI/CD pipeline running](https://placehold.co/600x400/09090b/fafafa?text=CI/CD+PIPELINE+RUNNING)
* **Vitest + Cargo Test Outputs**:
  ![Test outputs showing 3+ passing tests](https://placehold.co/600x400/09090b/fafafa?text=VITEST+AND+CARGO+PASSING+TESTS)
<!-- PLACEHOLDER_SCREENSHOTS_END -->

---

## 1. System Architecture

The following diagram illustrates the interaction between the Next.js frontend app, the state layer (Zustand, React Query), and the Stellar/Soroban ledger layer.

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

---

## 2. Tech Stack

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
- [System Architecture & Diagrams](file:///home/sandipansingh/Projects/CampusChain/docs/architecture.md)
- [Smart Contract Specifications](file:///home/sandipansingh/Projects/CampusChain/docs/CONTRACTS.md)
- [Security Practices & Threat Modeling](file:///home/sandipansingh/Projects/CampusChain/docs/SECURITY.md)
- [Deployment & Upgrade Guide](file:///home/sandipansingh/Projects/CampusChain/docs/DEPLOYMENT.md)
- [Frontend API & Hooks Schema](file:///home/sandipansingh/Projects/CampusChain/docs/API.md)
