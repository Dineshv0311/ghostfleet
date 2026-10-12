import { ethers } from "hardhat";
import * as fs from "fs";
import * as path from "path";

async function main() {
  console.log("==========================================");
  console.log("   GHOSTFLEET CONTRACT DEPLOYMENT        ");
  console.log("==========================================");

  const [deployer] = await ethers.getSigners();
  console.log("Deploying contracts with account:", deployer.address);
  const balance = await ethers.provider.getBalance(deployer.address);
  console.log("Account balance:", ethers.formatEther(balance), "ETH");

  // Local dedicated verifier address (default Hardhat account #9 for demo verifier)
  // Private key: 0x2a871d0798f97d79848a013d4936a73bf4cc922c825d33c1cf7073dff6d409c6
  const verifierWallet = new ethers.Wallet(
    process.env.VERIFIER_PRIVATE_KEY || "0x2a871d0798f97d79848a013d4936a73bf4cc922c825d33c1cf7073dff6d409c6"
  );
  console.log("Authorized Verifier Address:", verifierWallet.address);

  const MachineEscrowFactory = await ethers.getContractFactory("MachineEscrow");
  const escrow = await MachineEscrowFactory.deploy(verifierWallet.address);
  await escrow.waitForDeployment();

  const escrowAddress = await escrow.getAddress();
  console.log("MachineEscrow deployed to:", escrowAddress);

  const network = await ethers.provider.getNetwork();
  console.log("Chain ID:", network.chainId);

  // Write deployment output for the frontend and verifier services
  const deploymentInfo = {
    address: escrowAddress,
    chainId: Number(network.chainId),
    verifierAddress: verifierWallet.address,
    networkName: network.name || "hardhat",
    timestamp: new Date().toISOString(),
  };

  const outputDir = path.join(__dirname, "..", "..", "apps", "web", "src", "contracts");
  if (!fs.existsSync(outputDir)) {
    fs.mkdirSync(outputDir, { recursive: true });
  }

  // Copy ABI and contract info
  const artifactPath = path.join(__dirname, "..", "artifacts", "contracts", "MachineEscrow.sol", "MachineEscrow.json");
  if (fs.existsSync(artifactPath)) {
    const artifact = JSON.parse(fs.readFileSync(artifactPath, "utf-8"));
    fs.writeFileSync(
      path.join(outputDir, "MachineEscrow.json"),
      JSON.stringify({ ...deploymentInfo, abi: artifact.abi }, null, 2)
    );
    console.log("Exported contract ABI and deployment metadata to apps/web/src/contracts/MachineEscrow.json");
  }

  // Also save deployment info to contracts directory
  fs.writeFileSync(
    path.join(__dirname, "..", "deployment.json"),
    JSON.stringify(deploymentInfo, null, 2)
  );

  console.log("Deployment completed successfully.");
}

main().catch((error) => {
  console.error(error);
  process.exitCode = 1;
});
