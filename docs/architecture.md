# CampusChain Architecture & System Design

This document details the system design, components, inter-contract relationships, transaction lifecycles, and data flows for the CampusChain platform.

---

## 1. System Architecture

The following diagram illustrates the interaction between the student/merchant frontend, the local/global state layers, the Stellar network nodes (RPC and Horizon), and the Soroban smart contracts.

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

## 2. Inter-Contract Communication Flow

This diagram outlines how the `CampusService` contract interacts with the `CampusToken` contract. The service contract acts as an escrow agent or ticket reseller, performing contract-to-contract (C2C) calls.

```mermaid
graph LR
    %% Styling Definitions
    classDef user fill:#2563EB,stroke:#1D4ED8,stroke-width:2px,color:#FFFFFF;
    classDef svc fill:#D97706,stroke:#B45309,stroke-width:2px,color:#FFFFFF;
    classDef tok fill:#7C3AED,stroke:#6D28D9,stroke-width:2px,color:#FFFFFF;

    Student["Student Account"]
    Service["CampusService Contract<br/>(Address B)"]
    Token["CampusToken Contract<br/>(Address A)"]

    Student --> |1. buy_ticket / create_escrow| Service
    Service --> |"2. C2C Call: transfer_from(Student, Service, Amount)"| Token
    Token --> |3. Validate Balance & Allowance| Token
    Token --> |4. Update Ledger State| Token
    Service --> |"5. C2C Call: transfer(Service, Seller, Amount)"| Token

    class Student user;
    class Service svc;
    class Token tok;
```

---

## 3. Transaction Lifecycle State Diagram

Soroban transactions follow a structured, asynchronous path from creation to confirmation. The client application tracks these states in real time.

```mermaid
stateDiagram-v2
    [*] --> Idle : User initiates action
    Idle --> PendingSignature : Build transaction & request wallet signature
    PendingSignature --> Submitting : Wallet signs & transaction submitted to RPC
    Submitting --> Processing : Transaction accepted; waiting for ledger ingestion
    Processing --> Confirmed : RPC returns SUCCESS (Status: CONFIRMED)
    Processing --> Failed : RPC returns ERROR (Status: FAILED / TIMEOUT)
    Failed --> Retrying : User triggers retry / adjust fee
    Retrying --> PendingSignature
    Confirmed --> [*]
```

---

## 4. Data Flow Sequence Diagram

This sequence diagram depicts the end-to-end flow from user authorization to transaction execution, settlement, and metadata archival.

```mermaid
sequenceDiagram
    autonumber
    actor Student
    participant UI as Next.js UI
    participant Wallet as StellarWalletsKit
    participant Query as React Query / Zustand
    participant RPC as Soroban RPC
    participant Token as CampusToken Contract
    participant Service as CampusService Contract

    Student->>UI: Connect Wallet
    UI->>Wallet: Initialize & Connect (Freighter)
    Wallet-->>UI: Wallet Address & Network Details
    UI->>Query: Store active address & network
    Student->>UI: Buy Event Ticket (CampusService.buy_ticket)
    UI->>RPC: Fetch fee estimation & build transaction
    UI->>Wallet: Sign transaction XDR
    Wallet-->>UI: Signed transaction envelope
    UI->>RPC: Submit transaction (sendTransaction)
    Note over RPC: Ingest transaction & simulate Soroban execution
    RPC->>Service: Execute buy_ticket()
    Service->>Token: C2C Call: transfer_from(student, service_escrow, price)
    Token-->>Service: Transfer Success
    Service-->>RPC: Emits Event: TicketPurchased
    RPC-->>UI: Return transaction hash & status: PENDING
    Note over UI: Poll getTransaction status
    RPC-->>UI: Status: SUCCESS + Transaction Result
    UI->>Query: Invalidate cache (triggers UI re-render)
    UI->>Student: Display success state & ticket QR
```
