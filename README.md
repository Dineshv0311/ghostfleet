# GHOSTFLEET 🛸

> **"Machines that work. Contracts that settle. Trust that can be verified."**

GHOSTFLEET is an autonomous machine economy platform coordinating AI agents, robotic fleets, and Ethereum smart contract escrow. It provides a transparent, verifiable solution for machine-to-machine coordination, trust-minimized escrow locks, off-chain robotic telemetry validation, and cryptographic EIP-712 payment settlements.

---

## 🚀 Key Features

1. **Smart Contract Escrow (`MachineEscrow.sol`)**:
   - Atomic lockup of rewards upon job creation.
   - Non-reentrant payout execution guarded against double claims.
   - EIP-712 domain-separated cryptographic attestation verification.
   - Replay protection with monotonic nonce verification.
   - Timeout and deadline enforcement with guaranteed creator refund paths.

2. **Autonomous Agent Fleet & 2D Urban Simulation**:
   - Simulated smart city featuring arterial routes, hubs, industrial parks, and hospitals.
   - Deterministic scoring engine evaluating agent battery levels, distance, and specialized payloads (e.g. heavy cargo vs speed).
   - Moving robot markers with live telemetry tracking (battery depletion, speed, waypoints).

3. **Cryptographic Verifier Service**:
   - Dedicated local verification agent acting as an oracle bridge.
   - Validates physical telemetry against route conditions.
   - Calculates canonical evidence hashes and signs EIP-712 typed data attestations.

4. **Command Center & Ledger Explorer**:
   - High-contrast cybernetic command interface.
   - Distinguishes **Simulation Mode** from **On-Chain Blockchain Mode**.
   - Real-time contract event logs and transaction telemetry feed.
   - 1-Click interactive demonstration story.

---

## 🛠️ Tech Stack

- **Contracts**: Solidity `0.8.24` (Cancun EVM target), Hardhat 2, OpenZeppelin Contracts v5, Ethers.js v6.
- **Frontend**: React 18, TypeScript (strict), Vite, Tailwind CSS, Lucide icons.
- **Verifier Service**: Node.js, Express, Ethers.js (EIP-712 signing).
- **Automated Testing**: Chai matchers, Vitest, Hardhat Network Helpers.

---

## 📦 Getting Started (Windows PowerShell)

### 1. Install & Build All Packages

From the `ghostfleet/` root:

```powershell
# Install contracts dependencies & run tests
cd contracts
npm install
npx hardhat test

# Deploy contracts locally
npx hardhat run scripts/deploy.ts
cd ..

# Install and build frontend
cd apps/web
npm install
npm run build
npm test
cd ..

# Install verifier service
cd services/verifier
npm install
cd ..
```

---

## 🎮 Running the Application

### Option A: Complete Local Full-Stack (3 Terminal Tabs)

**Terminal 1 — Local Hardhat Blockchain Node:**
```powershell
cd d:\Hackathon\EthGlobal\ghostfleet\contracts
npx hardhat node
```

**Terminal 2 — Deploy Contract & Start Verifier Service:**
```powershell
cd d:\Hackathon\EthGlobal\ghostfleet\contracts
npx hardhat run scripts/deploy.ts --network localhost

cd d:\Hackathon\EthGlobal\ghostfleet\services\verifier
npm start
```

**Terminal 3 — Start Vite Web Command Center:**
```powershell
cd d:\Hackathon\EthGlobal\ghostfleet\apps\web
npm run dev
```

Visit **`http://localhost:5173`** in your browser.

---

## 🧪 Automated Test Verification

### 1. Smart Contract Test Suite
Run the 18 automated contract test cases:
```powershell
cd d:\Hackathon\EthGlobal\ghostfleet\contracts
npx hardhat test
```
*Coverage includes:*
- Escrow funding & validation.
- Unauthorized state transitions.
- Invalid attestation signatures & wrong task IDs.
- Signature replay & nonce reuse prevention.
- Duplicate settlement prevention.
- Expiration timeouts and creator refund paths.

### 2. Frontend & Agent Scoring Engine Tests
```powershell
cd d:\Hackathon\EthGlobal\ghostfleet\apps\web
npx vitest run
```
*Coverage includes:*
- Dashboard & branding rendering.
- Tab navigation between Simulation, Marketplace, and Fleet.
- Transparent evaluation of agent capabilities and battery.

---

## 🎬 1-Click Demonstration Experience

1. Launch `http://localhost:5173`.
2. Click **"Run 1-Click Story"** on the top navigation bar.
3. Observe:
   - Task created: *"Heavy Titanium Alloy Freight"*.
   - Scoring engine chooses **Titan Hauler II** (high battery + heavy cargo capacity) over Scout-01.
   - Hauler-02 traverses the 2D grid toward Sector 7 Industrial Depot.
   - Upon arrival, the verifier computes the evidence hash and issues an EIP-712 signature.
   - Contract settles and releases the reward to the robot's address.
4. Test failure handling: Click **"Simulate Route Failure"** to trigger a mechanical actuator lock, aborting payout and enabling a refund.

---

## 🔐 Security & Threat Model

See complete details in [docs/THREAT_MODEL.md](docs/THREAT_MODEL.md) and [docs/ARCHITECTURE.md](docs/ARCHITECTURE.md).
