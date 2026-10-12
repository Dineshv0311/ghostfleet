import { ethers } from "ethers";
import MachineEscrowArtifact from "../contracts/MachineEscrow.json";
import { TaskRecord, TaskState, ContractEventLog } from "../types";

export class Web3Service {
  private static instance: Web3Service;
  private provider: ethers.BrowserProvider | ethers.JsonRpcProvider | null = null;
  private signer: ethers.Signer | null = null;
  private contract: ethers.Contract | null = null;
  private contractAddress: string = MachineEscrowArtifact.address || "0x5FbDB2315678afecb367f032d93F642f64180aa3";
  private rpcUrl: string = "http://127.0.0.1:8545";

  private constructor() {}

  public static getInstance(): Web3Service {
    if (!Web3Service.instance) {
      Web3Service.instance = new Web3Service();
    }
    return Web3Service.instance;
  }

  public getContractAddress(): string {
    return this.contractAddress;
  }

  public async getReadOnlyContract(): Promise<ethers.Contract> {
    if (this.contract) return this.contract;

    try {
      const rpcProvider = new ethers.JsonRpcProvider(this.rpcUrl);
      this.contract = new ethers.Contract(this.contractAddress, MachineEscrowArtifact.abi, rpcProvider);
      return this.contract;
    } catch (e) {
      console.warn("Unable to connect read-only RPC provider:", e);
      throw e;
    }
  }

  public async connectWallet(): Promise<{ address: string; chainId: number }> {
    if (typeof window === "undefined" || !(window as any).ethereum) {
      throw new Error("No Web3 wallet detected. Please install MetaMask or use Local Demo mode.");
    }

    const browserProvider = new ethers.BrowserProvider((window as any).ethereum);
    await browserProvider.send("eth_requestAccounts", []);
    this.provider = browserProvider;
    this.signer = await browserProvider.getSigner();

    const network = await browserProvider.getNetwork();
    const address = await this.signer.getAddress();

    this.contract = new ethers.Contract(this.contractAddress, MachineEscrowArtifact.abi, this.signer);

    return {
      address,
      chainId: Number(network.chainId),
    };
  }

  public async switchOrAddLocalNetwork(): Promise<void> {
    if (typeof window === "undefined" || !(window as any).ethereum) return;

    try {
      await (window as any).ethereum.request({
        method: "wallet_switchEthereumChain",
        params: [{ chainId: "0x7a69" }], // 31337 in hex
      });
    } catch (switchError: any) {
      // Chain not added, try adding it
      if (switchError.code === 4902) {
        await (window as any).ethereum.request({
          method: "wallet_addEthereumChain",
          params: [
            {
              chainId: "0x7a69",
              chainName: "Hardhat Localhost (GHOSTFLEET)",
              rpcUrls: ["http://127.0.0.1:8545"],
              nativeCurrency: {
                name: "Test ETH",
                symbol: "tETH",
                decimals: 18,
              },
            },
          ],
        });
      } else {
        throw switchError;
      }
    }
  }

  public async createTaskOnChain(
    taskId: string,
    deadlineSeconds: number,
    rewardEth: string
  ): Promise<ethers.ContractTransactionReceipt> {
    if (!this.contract || !this.signer) {
      throw new Error("Wallet not connected. Connect wallet or use simulation mode.");
    }

    const rewardWei = ethers.parseEther(rewardEth);
    const tx = await this.contract.createTask(taskId, deadlineSeconds, { value: rewardWei });
    const receipt = await tx.wait();
    return receipt;
  }

  public async assignTaskOnChain(taskId: string, agentAddress: string): Promise<ethers.ContractTransactionReceipt> {
    if (!this.contract || !this.signer) {
      throw new Error("Wallet not connected.");
    }
    const tx = await this.contract.assignTask(taskId, agentAddress);
    return await tx.wait();
  }

  public async submitCompletionOnChain(
    taskId: string,
    evidenceHash: string,
    timestamp: number,
    nonce: number,
    signature: string
  ): Promise<ethers.ContractTransactionReceipt> {
    if (!this.contract || !this.signer) {
      throw new Error("Wallet not connected.");
    }

    const tx = await this.contract.submitCompletion(taskId, evidenceHash, timestamp, nonce, signature);
    return await tx.wait();
  }

  public async refundExpiredTaskOnChain(taskId: string): Promise<ethers.ContractTransactionReceipt> {
    if (!this.contract || !this.signer) {
      throw new Error("Wallet not connected.");
    }
    const tx = await this.contract.refundExpiredTask(taskId);
    return await tx.wait();
  }
}
