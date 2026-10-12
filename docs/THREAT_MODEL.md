# GHOSTFLEET THREAT MODEL & SECURITY SPECIFICATION

## Product Overview
GHOSTFLEET is a trust-minimized machine economy coordination system. Autonomous AI agents and robotic entities create jobs, accept delivery tasks, lock funds into Ethereum smart contracts (`MachineEscrow.sol`), navigate physical/simulated paths, and settle upon verifiable completion.

---

## 1. Trust Boundaries & Core Assumptions

| Component | Trust Level | Security Boundary / Guarantee |
| :--- | :--- | :--- |
| **MachineEscrow.sol** | **Trust-minimized** | Enforces atomic payment custody, valid signatures, replay protection, timeout refunds, and state transitions. |
| **Authorized Verifier** | **Trusted Oracle** | Validates off-chain robot telemetry and issues EIP-712 attestations. The contract trusts the verifier's key to attest real-world completion. |
| **Robot Agents** | **Untrusted / Adversarial** | Agents may misreport coordinates, fail midway, run out of battery, or attempt double payout claims. |
| **Task Creators** | **Untrusted / Economic Actors** | Creators fund rewards, specify deadlines, and may seek refunds if deadlines expire without completion. |

---

## 2. Threat Analysis & Mitigations

### 2.1 Malicious or Rogue Robot Agents
- **Threat:** A compromised robot claims it delivered cargo without physically visiting the destination, or attempts to claim escrow for another robot's mission.
- **Mitigation:**
  1. The contract checks `task.assignedAgent == agentAddress`. Only the designated agent can receive funds.
  2. The verifier checks waypoint telemetry, battery consumption, and destination coordinates before signing.
  3. The EIP-712 struct binds the specific `agent` address, `taskId`, and `evidenceHash`.

### 2.2 Forged Completion Reports & Signature Replay
- **Threat:** An adversary copies a valid signature from a previous task or attempts to use it on another network/contract.
- **Mitigation:**
  1. **EIP-712 Domain Separation:** Includes contract address, chain ID, and contract name.
  2. **Monotonic Nonce Tracking:** `MachineEscrow.sol` enforces `usedNonces[nonce] == false` and records nonces upon verification.
  3. **Task State Machine:** Tasks transition to `Completed` atomically during payout; subsequent attempts revert with `"MachineEscrow: task not active"`.

### 2.3 Double Settlement and Race Conditions
- **Threat:** An attacker tries to trigger both a refund and a payout simultaneously, draining escrow funds twice.
- **Mitigation:**
  1. **Checks-Effects-Interactions:** Task state is updated before any native ETH `.call` is performed.
  2. **OpenZeppelin ReentrancyGuard:** Guard applied to `createTask`, `submitCompletion`, and `refundExpiredTask`.
  3. **Mutex Transitions:** Completed tasks cannot be refunded; refunded tasks cannot be completed.

### 2.4 Compromised Verifier Key
- **Threat:** An attacker obtains the private key of the authorized verifier and signs unauthorized completions.
- **Mitigation:**
  1. The contract owner can invoke `updateVerifier(newVerifier)` to revoke a compromised key.
  2. Verifier secrets are kept strictly on the backend and are never bundled into the Vite frontend build.
  3. In production, verifier signing would use a hardware enclave (TEE) or threshold multi-signature scheme.

### 2.5 Expired Tasks & Denial of Service
- **Threat:** A robot accepts a task but halts, locking the creator's test ETH indefinitely.
- **Mitigation:**
  1. Creators set an explicit `deadline`.
  2. If `block.timestamp > task.deadline`, the creator can invoke `refundExpiredTask(taskId)` to reclaim the escrowed amount.

---

## 3. Residual Risks & Future Work
- **Physical Sensor Spoofing:** A compromised robot could simulate hardware LiDAR or GPS sensor outputs. Production implementations should incorporate cryptographic TEE sensor attestation (e.g. Intel SGX / ARM TrustZone) or multi-party zero-knowledge spatial proofs.
