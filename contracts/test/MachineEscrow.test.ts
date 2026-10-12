import { expect } from "chai";
import { ethers } from "hardhat";
import { time } from "@nomicfoundation/hardhat-network-helpers";
import { SignerWithAddress } from "@nomicfoundation/hardhat-ethers/signers";

describe("MachineEscrow - Autonomous Agent Economy", function () {
  let machineEscrow: any;
  let owner: SignerWithAddress;
  let creator: SignerWithAddress;
  let agent: SignerWithAddress;
  let verifier: SignerWithAddress;
  let maliciousUser: SignerWithAddress;

  const reward = ethers.parseEther("0.05");
  let taskId: string;
  let deadline: number;

  async function createAttestationSignature(
    contractAddress: string,
    chainId: bigint,
    taskIdVal: string,
    agentAddress: string,
    evidenceHashVal: string,
    timestampVal: number,
    nonceVal: number,
    signer: SignerWithAddress
  ) {
    const domain = {
      name: "GHOSTFLEET_MachineEscrow",
      version: "1",
      chainId: chainId,
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
      taskId: taskIdVal,
      agent: agentAddress,
      evidenceHash: evidenceHashVal,
      timestamp: timestampVal,
      nonce: nonceVal,
    };

    return await signer.signTypedData(domain, types, value);
  }

  beforeEach(async function () {
    [owner, creator, agent, verifier, maliciousUser] = await ethers.getSigners();

    const MachineEscrowFactory = await ethers.getContractFactory("MachineEscrow");
    machineEscrow = await MachineEscrowFactory.deploy(verifier.address);
    await machineEscrow.waitForDeployment();

    taskId = ethers.keccak256(ethers.toUtf8Bytes("TASK-ALPHA-001"));
    const latestTime = await time.latest();
    deadline = latestTime + 3600; // 1 hour ahead
  });

  describe("Deployment & Configuration", function () {
    it("should set the authorized verifier and owner correctly", async function () {
      expect(await machineEscrow.owner()).to.equal(owner.address);
      expect(await machineEscrow.authorizedVerifier()).to.equal(verifier.address);
    });

    it("should allow owner to update verifier and prevent non-owner", async function () {
      await expect(
        machineEscrow.connect(maliciousUser).updateVerifier(maliciousUser.address)
      ).to.be.revertedWith("MachineEscrow: caller is not the owner");

      await expect(machineEscrow.connect(owner).updateVerifier(maliciousUser.address))
        .to.emit(machineEscrow, "VerifierUpdated")
        .withArgs(verifier.address, maliciousUser.address);

      expect(await machineEscrow.authorizedVerifier()).to.equal(maliciousUser.address);
    });
  });

  describe("Task Creation & Escrow Funding", function () {
    it("should create a task and lock escrow funds", async function () {
      await expect(
        machineEscrow.connect(creator).createTask(taskId, deadline, { value: reward })
      )
        .to.emit(machineEscrow, "TaskCreated")
        .withArgs(taskId, creator.address, reward, deadline);

      const task = await machineEscrow.getTask(taskId);
      expect(task.creator).to.equal(creator.address);
      expect(task.reward).to.equal(reward);
      expect(task.state).to.equal(0); // Created
      expect(await machineEscrow.getTaskCount()).to.equal(1);

      // Verify contract balance
      const contractBalance = await ethers.provider.getBalance(await machineEscrow.getAddress());
      expect(contractBalance).to.equal(reward);
    });

    it("should revert if reward is 0", async function () {
      await expect(
        machineEscrow.connect(creator).createTask(taskId, deadline, { value: 0 })
      ).to.be.revertedWith("MachineEscrow: reward must be > 0");
    });

    it("should revert if deadline is in the past", async function () {
      const pastTime = (await time.latest()) - 100;
      await expect(
        machineEscrow.connect(creator).createTask(taskId, pastTime, { value: reward })
      ).to.be.revertedWith("MachineEscrow: deadline must be future");
    });

    it("should prevent duplicate task creation with same taskId", async function () {
      await machineEscrow.connect(creator).createTask(taskId, deadline, { value: reward });
      await expect(
        machineEscrow.connect(creator).createTask(taskId, deadline, { value: reward })
      ).to.be.revertedWith("MachineEscrow: task already exists");
    });
  });

  describe("Task Assignment and Start", function () {
    beforeEach(async function () {
      await machineEscrow.connect(creator).createTask(taskId, deadline, { value: reward });
    });

    it("should allow agent or creator to assign task", async function () {
      await expect(machineEscrow.connect(agent).assignTask(taskId, agent.address))
        .to.emit(machineEscrow, "TaskAssigned")
        .withArgs(taskId, agent.address);

      const task = await machineEscrow.getTask(taskId);
      expect(task.assignedAgent).to.equal(agent.address);
      expect(task.state).to.equal(1); // Assigned
    });

    it("should reject unauthorized third party assigning arbitrary agents", async function () {
      await expect(
        machineEscrow.connect(maliciousUser).assignTask(taskId, agent.address)
      ).to.be.revertedWith("MachineEscrow: unauthorized assignment");
    });

    it("should allow assigned agent to start task", async function () {
      await machineEscrow.connect(agent).assignTask(taskId, agent.address);
      await expect(machineEscrow.connect(agent).startTask(taskId))
        .to.emit(machineEscrow, "TaskStarted")
        .withArgs(taskId, agent.address);

      const task = await machineEscrow.getTask(taskId);
      expect(task.state).to.equal(2); // InProgress
    });
  });

  describe("Completion Verification and Payout Settlement", function () {
    let evidenceHash: string;
    let attestationTime: number;
    let nonce: number;
    let chainId: bigint;
    let contractAddress: string;

    beforeEach(async function () {
      await machineEscrow.connect(creator).createTask(taskId, deadline, { value: reward });
      await machineEscrow.connect(agent).assignTask(taskId, agent.address);
      await machineEscrow.connect(agent).startTask(taskId);

      evidenceHash = ethers.keccak256(ethers.toUtf8Bytes("TELEMETRY_LAT_40.71_LNG_-74.00_SUCCESS"));
      attestationTime = await time.latest();
      nonce = 1001;
      const network = await ethers.provider.getNetwork();
      chainId = network.chainId;
      contractAddress = await machineEscrow.getAddress();
    });

    it("should successfully verify authorized EIP-712 attestation and release payment", async function () {
      const signature = await createAttestationSignature(
        contractAddress,
        chainId,
        taskId,
        agent.address,
        evidenceHash,
        attestationTime,
        nonce,
        verifier
      );

      const agentBalanceBefore = await ethers.provider.getBalance(agent.address);

      await expect(
        machineEscrow.connect(agent).submitCompletion(
          taskId,
          evidenceHash,
          attestationTime,
          nonce,
          signature
        )
      )
        .to.emit(machineEscrow, "TaskCompleted")
        .withArgs(taskId, agent.address, reward, evidenceHash);

      const agentBalanceAfter = await ethers.provider.getBalance(agent.address);
      expect(agentBalanceAfter).to.be.gt(agentBalanceBefore);

      const task = await machineEscrow.getTask(taskId);
      expect(task.state).to.equal(3); // Completed
      expect(task.evidenceHash).to.equal(evidenceHash);
      expect(await machineEscrow.usedNonces(nonce)).to.equal(true);
    });

    it("should reject completion with signature from an unauthorized entity", async function () {
      const forgedSignature = await createAttestationSignature(
        contractAddress,
        chainId,
        taskId,
        agent.address,
        evidenceHash,
        attestationTime,
        nonce,
        maliciousUser // Not the authorized verifier
      );

      await expect(
        machineEscrow.connect(agent).submitCompletion(
          taskId,
          evidenceHash,
          attestationTime,
          nonce,
          forgedSignature
        )
      ).to.be.revertedWith("MachineEscrow: invalid verifier signature");
    });

    it("should reject attestation signed for a different task ID", async function () {
      const wrongTaskId = ethers.keccak256(ethers.toUtf8Bytes("TASK-OTHER-999"));
      const signatureWithWrongTaskId = await createAttestationSignature(
        contractAddress,
        chainId,
        wrongTaskId,
        agent.address,
        evidenceHash,
        attestationTime,
        nonce,
        verifier
      );

      await expect(
        machineEscrow.connect(agent).submitCompletion(
          taskId,
          evidenceHash,
          attestationTime,
          nonce,
          signatureWithWrongTaskId
        )
      ).to.be.revertedWith("MachineEscrow: invalid verifier signature");
    });

    it("should reject replay of already used nonce", async function () {
      const signature = await createAttestationSignature(
        contractAddress,
        chainId,
        taskId,
        agent.address,
        evidenceHash,
        attestationTime,
        nonce,
        verifier
      );

      await machineEscrow.connect(agent).submitCompletion(
        taskId,
        evidenceHash,
        attestationTime,
        nonce,
        signature
      );

      // Attempt second submission
      await expect(
        machineEscrow.connect(agent).submitCompletion(
          taskId,
          evidenceHash,
          attestationTime,
          nonce,
          signature
        )
      ).to.be.revertedWith("MachineEscrow: task not active");
    });

    it("should prevent double settlement", async function () {
      const signature = await createAttestationSignature(
        contractAddress,
        chainId,
        taskId,
        agent.address,
        evidenceHash,
        attestationTime,
        nonce,
        verifier
      );

      await machineEscrow.submitCompletion(taskId, evidenceHash, attestationTime, nonce, signature);

      // Verify cannot refund completed task
      await time.increase(4000); // Past deadline
      await expect(
        machineEscrow.connect(creator).refundExpiredTask(taskId)
      ).to.be.revertedWith("MachineEscrow: cannot refund in current state");
    });
  });

  describe("Timeout & Refund Protections", function () {
    beforeEach(async function () {
      await machineEscrow.connect(creator).createTask(taskId, deadline, { value: reward });
      await machineEscrow.connect(agent).assignTask(taskId, agent.address);
      await machineEscrow.connect(agent).startTask(taskId);
    });

    it("should revert refund before deadline is reached", async function () {
      await expect(
        machineEscrow.connect(creator).refundExpiredTask(taskId)
      ).to.be.revertedWith("MachineEscrow: deadline not reached");
    });

    it("should allow creator to refund expired task after deadline", async function () {
      await time.increaseTo(deadline + 10);

      const balanceBefore = await ethers.provider.getBalance(creator.address);

      await expect(machineEscrow.connect(creator).refundExpiredTask(taskId))
        .to.emit(machineEscrow, "TaskRefunded")
        .withArgs(taskId, creator.address, reward);

      const balanceAfter = await ethers.provider.getBalance(creator.address);
      expect(balanceAfter).to.be.gt(balanceBefore);

      const task = await machineEscrow.getTask(taskId);
      expect(task.state).to.equal(5); // Refunded
    });

    it("should reject completion submission after task is refunded", async function () {
      await time.increaseTo(deadline + 10);
      await machineEscrow.connect(creator).refundExpiredTask(taskId);

      const evidenceHash = ethers.keccak256(ethers.toUtf8Bytes("LATE_SUBMISSION"));
      const network = await ethers.provider.getNetwork();
      const signature = await createAttestationSignature(
        await machineEscrow.getAddress(),
        network.chainId,
        taskId,
        agent.address,
        evidenceHash,
        await time.latest(),
        999,
        verifier
      );

      await expect(
        machineEscrow.connect(agent).submitCompletion(
          taskId,
          evidenceHash,
          await time.latest(),
          999,
          signature
        )
      ).to.be.revertedWith("MachineEscrow: task not active");
    });

    it("should prevent non-creator from triggering refund", async function () {
      await time.increaseTo(deadline + 10);
      await expect(
        machineEscrow.connect(maliciousUser).refundExpiredTask(taskId)
      ).to.be.revertedWith("MachineEscrow: only creator can claim refund");
    });
  });
});
