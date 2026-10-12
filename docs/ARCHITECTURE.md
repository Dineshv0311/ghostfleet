# GHOSTFLEET SYSTEM ARCHITECTURE & CONTRACT DESIGN

## 1. System Architecture Diagram

```mermaid
flowchart TD
    subgraph Frontend["GHOSTFLEET Web Application (React + Vite + Tailwind)"]
        UI[Command Center & 2D City Grid]
        Store[FleetContext State Engine]
        ScoreEngine[Deterministic Agent Evaluator]
        Web3[Ethers.js Web3 Service]
    end

    subgraph Blockchain["Ethereum Network (Hardhat Local / Sepolia)"]
        Contract[MachineEscrow.sol]
        EscrowStorage[(Task State & Balances)]
        EIP712[EIP-712 Attestation Verifier]
    end

    subgraph OffChain["Autonomous Infrastructure & Agents"]
        Robots[Simulated Robot Fleet: Hauler, Scout, Courier]
        VerifierService[Local Authorized Verifier Service (Port 4001)]
    end

    UI --> Store
    Store --> ScoreEngine
    Store --> Web3
    Web3 -->|createTask / assignTask / submitCompletion| Contract
    Contract --> EscrowStorage
    Contract --> EIP712

    Store -->|Dispatch Waypoints| Robots
    Robots -->|Telemetry & Arrival| VerifierService
    VerifierService -->|EIP-712 Signed Attestation| Store
    Store -->|submitCompletion with Sig| Contract
```

---

## 2. Smart Contract State Machine

```mermaid
stateDiagram-v2
    [*] --> Created : createTask(taskId, deadline) { value: reward }
    Created --> Assigned : assignTask(taskId, agent)
    Assigned --> InProgress : startTask(taskId)
    InProgress --> Completed : submitCompletion(taskId, evidenceHash, sig)
    InProgress --> Disputed : raiseDispute(taskId, reason)
    Assigned --> Disputed : raiseDispute(taskId, reason)
    Created --> Refunded : refundExpiredTask(taskId) [block.timestamp > deadline]
    Assigned --> Refunded : refundExpiredTask(taskId) [block.timestamp > deadline]
    InProgress --> Refunded : refundExpiredTask(taskId) [block.timestamp > deadline]
    Disputed --> Refunded : refundExpiredTask(taskId) [block.timestamp > deadline]
    Completed --> [*]
    Refunded --> [*]
```

---

## 3. End-to-End Sequence Diagram

```mermaid
sequenceDiagram
    autonumber
    actor Creator as Task Creator
    participant UI as GHOSTFLEET Command UI
    participant Escrow as MachineEscrow.sol
    participant Agent as Robot Agent (Hauler-02)
    participant Verifier as Authorized Verifier Service

    Creator->>UI: Create Task & Escrow Reward (0.08 ETH)
    UI->>Escrow: createTask(taskId, deadline) [Locks 0.08 ETH]
    Escrow-->>UI: Event: TaskCreated(taskId, 0.08 ETH)

    UI->>Agent: Evaluate Capabilities & Assign Task
    UI->>Escrow: assignTask(taskId, agentAddress)
    Escrow-->>UI: Event: TaskAssigned

    Agent->>UI: Start Navigation across 2D City Grid
    Agent->>Verifier: Arrival at Destination + Telemetry
    Verifier->>Verifier: Check Waypoints, Battery & Time
    Verifier->>Verifier: Compute Keccak256(CanonicalEvidence)
    Verifier->>UI: Return EIP-712 Signature & Nonce

    UI->>Escrow: submitCompletion(taskId, evidenceHash, nonce, sig)
    Escrow->>Escrow: Verify ECDSA Signer == authorizedVerifier
    Escrow->>Agent: Transfer 0.08 ETH to Agent Address
    Escrow-->>UI: Event: TaskCompleted
```
