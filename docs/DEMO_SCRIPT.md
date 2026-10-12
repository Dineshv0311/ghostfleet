# GHOSTFLEET DEMONSTRATION SCRIPT

**Duration:** 2–3 minutes  
**Target Audience:** Hackathon Judges, Web3 Builders, Robotics Engineers  
**Theme:** "Machines that work. Contracts that settle. Trust that can be verified."

---

## 1. Opening Hook (0:00 – 0:30)
> *"Hello! This is **GHOSTFLEET**, an autonomous machine economy coordination platform. As autonomous drones, delivery rovers, and AI agents enter our physical world, how do they hire each other, pay for freight, and verify tasks without trusting a centralized intermediary?
>
> A blockchain can enforce escrow and payment rules, but it cannot independently verify physical deliveries. GHOSTFLEET bridges this divide using Ethereum smart contracts, autonomous robotic telemetry, and EIP-712 cryptographic completion attestations."*

---

## 2. Command Center & 2D Smart City (0:30 – 1:15)
> *"Here on the GHOSTFLEET Command Center, we see our live fleet of autonomous agents operating across the Neo-Metropolis grid.
>
> - **Titan Hauler II:** Heavy payload capacity with 92% battery.
> - **Vanguard Scout I:** Fast aerial drone, currently at 32% battery.
> - **Hermes Quad-Runner:** Busy on an inductive recharge pad.
>
> Let's look at the Task Marketplace. We have delivery tasks requiring physical transport. Anyone—or any machine—can post a task with a reward locked in escrow."*

---

## 3. The Live Flow: Assignment, Route & Verification (1:15 – 2:00)
> *"When we click **Evaluate & Dispatch Agent**, our deterministic scoring engine kicks in. Notice why **Titan Hauler II** was selected over Vanguard Scout: it has the heavy cargo capabilities and full battery required for the 75km cross-city transit.
>
> In the 2D City Grid, we observe Titan Hauler traveling from the Fleet Central Terminal to the Industrial Depot. As it reaches the destination:
> 1. The robot streams telemetry: arrival coordinates, battery telemetry, and timestamp.
> 2. The **Authorized Verifier Agent** checks the destination conditions and produces a canonical evidence record.
> 3. The verifier signs an **EIP-712 domain-separated attestation** with replay protection.
> 4. `MachineEscrow.sol` verifies the signature on-chain and releases the 0.08 ETH payment directly to the robot's address!"*

---

## 4. Fault Handling & Refund Protection (2:00 – 2:30)
> *"What if a robot fails midway?
> Let's click **Simulate Route Failure**. The robot experiences a mechanical actuator lock. The verifier detects that the destination was not reached and refuses to sign. The payout is blocked. Once the deadline expires, the task creator can claim a full refund directly from the smart contract, ensuring zero risk of double settlement."*

---

## 5. Closing (2:30 – 3:00)
> *"All of this is fully tested end-to-end:
> - 18 unit tests in Hardhat verifying EIP-712 signature verification, replay protection, reentrancy guards, and timeouts.
> - Full React + TypeScript Command Center with real-time telemetry feeds and event explorer.
>
> GHOSTFLEET: Machines that work. Contracts that settle. Trust that can be verified."*
