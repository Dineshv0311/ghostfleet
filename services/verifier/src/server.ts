import express, { Request, Response } from "express";
import cors from "cors";
import dotenv from "dotenv";
import { ethers } from "ethers";

dotenv.config();

const app = express();
app.use(cors());
app.use(express.json());

const PORT = process.env.PORT || 4001;
// Local demo verifier private key (Hardhat account #9)
const VERIFIER_KEY =
  process.env.VERIFIER_PRIVATE_KEY ||
  "0x2a871d0798f97d79848a013d4936a73bf4cc922c825d33c1cf7073dff6d409c6";

const verifierWallet = new ethers.Wallet(VERIFIER_KEY);

console.log("--------------------------------------------------");
console.log("   GHOSTFLEET LOCAL AUTHORIZED VERIFIER SERVICE    ");
console.log("--------------------------------------------------");
console.log("Verifier Signing Address:", verifierWallet.address);

interface VerificationRequest {
  taskId: string;
  agentAddress: string;
  contractAddress: string;
  chainId: number;
  telemetry: {
    origin: string;
    destination: string;
    batteryRemaining: number;
    arrivalCoordinates: { x: number; y: number };
    timestamp: number;
    speedMps: number;
  };
  forceFailure?: boolean;
}

// Global monotonic nonce for replay protection
let globalNonce = Math.floor(Date.now() / 1000);

app.get("/health", (req: Request, res: Response) => {
  res.json({
    status: "online",
    service: "GHOSTFLEET Verifier Agent",
    verifierAddress: verifierWallet.address,
    timestamp: Date.now(),
  });
});

app.post("/api/verify-completion", async (req: Request, res: Response) => {
  try {
    const { taskId, agentAddress, contractAddress, chainId, telemetry, forceFailure } =
      req.body as VerificationRequest;

    if (!taskId || !agentAddress || !contractAddress) {
      return res.status(400).json({ error: "Missing required verification fields." });
    }

    console.log(`[VERIFIER] Processing attestation request for Task: ${taskId}`);
    console.log(`[VERIFIER] Agent: ${agentAddress}`);

    // Off-chain verification checks:
    // 1. Telemetry completeness
    // 2. Battery remaining check (> 5%)
    // 3. Simulated destination proximity
    if (forceFailure) {
      console.warn(`[VERIFIER] REJECTED: Simulated failure flag triggered for ${taskId}`);
      return res.status(422).json({
        success: false,
        reason: "SIMULATED_MISSION_FAILURE: Robot reported mechanical stalling / incomplete route.",
      });
    }

    if (telemetry && telemetry.batteryRemaining <= 5) {
      console.warn(`[VERIFIER] REJECTED: Low battery critical failure for ${taskId}`);
      return res.status(422).json({
        success: false,
        reason: "BATTERY_DEPLETED: Agent battery dropped below emergency threshold before arrival.",
      });
    }

    // Canonical canonical evidence record representation
    const canonicalEvidence = JSON.stringify({
      taskId,
      agentAddress: agentAddress.toLowerCase(),
      origin: telemetry?.origin || "Central Hub",
      destination: telemetry?.destination || "Dropzone A",
      arrivalCoordinates: telemetry?.arrivalCoordinates || { x: 100, y: 100 },
      timestamp: telemetry?.timestamp || Date.now(),
      batteryRemaining: telemetry?.batteryRemaining ?? 78,
    });

    const evidenceHash = ethers.keccak256(ethers.toUtf8Bytes(canonicalEvidence));
    const attestationTime = Math.floor(Date.now() / 1000);
    const nonce = ++globalNonce;

    // EIP-712 Domain Separator
    const domain = {
      name: "GHOSTFLEET_MachineEscrow",
      version: "1",
      chainId: chainId || 31337,
      verifyingContract: contractAddress,
    };

    const types = {
      CompletionAttestation: [
        { name: "taskId", type: "bytes32" },
        { name: "agent", type: "address" },
        { name: "evidenceHash", type: "bytes32" },
        { name: "timestamp", type: "uint256" },
        { name: "nonce", type: "uint256" },
      ],
    };

    const value = {
      taskId,
      agent: agentAddress,
      evidenceHash,
      timestamp: attestationTime,
      nonce,
    };

    const signature = await verifierWallet.signTypedData(domain, types, value);

    console.log(`[VERIFIER] Attestation generated successfully! EvidenceHash: ${evidenceHash}`);
    console.log(`[VERIFIER] Nonce: ${nonce}, Signature: ${signature.slice(0, 18)}...`);

    return res.json({
      success: true,
      taskId,
      evidenceHash,
      canonicalEvidence,
      timestamp: attestationTime,
      nonce,
      signature,
      verifierAddress: verifierWallet.address,
    });
  } catch (error: any) {
    console.error("[VERIFIER ERROR]", error);
    return res.status(500).json({ error: error.message || "Internal verification error" });
  }
});

app.listen(PORT, () => {
  console.log(`Verifier service listening on http://localhost:${PORT}`);
});
