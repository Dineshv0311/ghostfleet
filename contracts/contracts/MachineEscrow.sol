// SPDX-License-Identifier: MIT
pragma solidity 0.8.24;

import "@openzeppelin/contracts/utils/ReentrancyGuard.sol";
import "@openzeppelin/contracts/utils/cryptography/ECDSA.sol";
import "@openzeppelin/contracts/utils/cryptography/EIP712.sol";

/**
 * @title MachineEscrow
 * @author GHOSTFLEET Engineering Team
 * @notice Trust-minimized machine-to-machine escrow for autonomous agents.
 *         Settlement requires EIP-712 completion attestations signed by an authorized verifier.
 */
contract MachineEscrow is ReentrancyGuard, EIP712 {
    using ECDSA for bytes32;

    enum TaskState {
        Created,      // Task initialized with escrow funded
        Assigned,     // Agent assigned or accepted task
        InProgress,   // Agent started navigation/execution
        Completed,    // Completion attestation verified & payout released
        Disputed,     // Disputed by creator or agent
        Refunded      // Task expired or failed, refund returned to creator
    }

    struct Task {
        bytes32 taskId;
        address creator;
        address assignedAgent;
        uint256 reward;
        uint256 deadline;
        TaskState state;
        bytes32 evidenceHash;
        uint256 createdAt;
        uint256 completedAt;
    }

    // Typehash for EIP-712 Completion Attestation
    // struct CompletionAttestation {
    //     bytes32 taskId;
    //     address agent;
    //     bytes32 evidenceHash;
    //     uint256 timestamp;
    //     uint256 nonce;
    // }
    bytes32 public constant ATTESTATION_TYPEHASH = keccak256(
        "CompletionAttestation(bytes32 taskId,address agent,bytes32 evidenceHash,uint256 timestamp,uint256 nonce)"
    );

    address public owner;
    address public authorizedVerifier;
    
    // Nonce replay tracking for attestations
    mapping(uint256 => bool) public usedNonces;
    
    // Task storage
    mapping(bytes32 => Task) public tasks;
    bytes32[] public taskIds;

    // Events
    event VerifierUpdated(address indexed previousVerifier, address indexed newVerifier);
    event TaskCreated(bytes32 indexed taskId, address indexed creator, uint256 reward, uint256 deadline);
    event TaskAssigned(bytes32 indexed taskId, address indexed agent);
    event TaskStarted(bytes32 indexed taskId, address indexed agent);
    event TaskCompleted(bytes32 indexed taskId, address indexed agent, uint256 reward, bytes32 evidenceHash);
    event TaskDisputed(bytes32 indexed taskId, address indexed reporter, string reason);
    event TaskRefunded(bytes32 indexed taskId, address indexed creator, uint256 amount);

    modifier onlyOwner() {
        require(msg.sender == owner, "MachineEscrow: caller is not the owner");
        _;
    }

    constructor(address _authorizedVerifier) EIP712("GHOSTFLEET_MachineEscrow", "1") {
        require(_authorizedVerifier != address(0), "MachineEscrow: invalid verifier");
        owner = msg.sender;
        authorizedVerifier = _authorizedVerifier;
    }

    /**
     * @notice Updates the authorized verifier key. Only callable by contract owner.
     */
    function updateVerifier(address _newVerifier) external onlyOwner {
        require(_newVerifier != address(0), "MachineEscrow: zero address verifier");
        emit VerifierUpdated(authorizedVerifier, _newVerifier);
        authorizedVerifier = _newVerifier;
    }

    /**
     * @notice Create a task and lock the reward in escrow.
     * @param taskId Unique identifier for the task.
     * @param deadline Unix timestamp after which task can be refunded if not completed.
     */
    function createTask(bytes32 taskId, uint256 deadline) external payable nonReentrant {
        require(taskId != bytes32(0), "MachineEscrow: invalid task ID");
        require(tasks[taskId].creator == address(0), "MachineEscrow: task already exists");
        require(msg.value > 0, "MachineEscrow: reward must be > 0");
        require(deadline > block.timestamp, "MachineEscrow: deadline must be future");

        tasks[taskId] = Task({
            taskId: taskId,
            creator: msg.sender,
            assignedAgent: address(0),
            reward: msg.value,
            deadline: deadline,
            state: TaskState.Created,
            evidenceHash: bytes32(0),
            createdAt: block.timestamp,
            completedAt: 0
        });

        taskIds.push(taskId);

        emit TaskCreated(taskId, msg.sender, msg.value, deadline);
    }

    /**
     * @notice Assigns an agent to a created task. Can be called by agent accepting or creator appointing.
     * @param taskId Identifier of the task.
     * @param agent Address of the autonomous agent robot.
     */
    function assignTask(bytes32 taskId, address agent) external {
        Task storage task = tasks[taskId];
        require(task.creator != address(0), "MachineEscrow: task does not exist");
        require(task.state == TaskState.Created, "MachineEscrow: task not in Created state");
        require(agent != address(0), "MachineEscrow: invalid agent address");
        // Agent accepts task or creator assigns it
        require(msg.sender == agent || msg.sender == task.creator, "MachineEscrow: unauthorized assignment");

        task.assignedAgent = agent;
        task.state = TaskState.Assigned;

        emit TaskAssigned(taskId, agent);
    }

    /**
     * @notice Marks task as InProgress when agent departs / starts execution.
     * @param taskId Identifier of the task.
     */
    function startTask(bytes32 taskId) external {
        Task storage task = tasks[taskId];
        require(task.creator != address(0), "MachineEscrow: task does not exist");
        require(task.state == TaskState.Assigned, "MachineEscrow: task not assigned");
        require(msg.sender == task.assignedAgent, "MachineEscrow: only assigned agent can start");

        task.state = TaskState.InProgress;

        emit TaskStarted(taskId, msg.sender);
    }

    /**
     * @notice Submits completion attestation signed by the authorized verifier and settles payment.
     * @param taskId Identifier of the task.
     * @param evidenceHash Cryptographic SHA256/Keccak256 hash of canonical sensor/mission telemetry.
     * @param timestamp Verification timestamp.
     * @param nonce Unique attestation nonce for replay protection.
     * @param signature EIP-712 signature produced by authorizedVerifier.
     */
    function submitCompletion(
        bytes32 taskId,
        bytes32 evidenceHash,
        uint256 timestamp,
        uint256 nonce,
        bytes calldata signature
    ) external nonReentrant {
        Task storage task = tasks[taskId];
        require(task.creator != address(0), "MachineEscrow: task does not exist");
        require(
            task.state == TaskState.InProgress || task.state == TaskState.Assigned,
            "MachineEscrow: task not active"
        );
        require(block.timestamp <= task.deadline, "MachineEscrow: task deadline exceeded");
        require(!usedNonces[nonce], "MachineEscrow: nonce already used");
        require(evidenceHash != bytes32(0), "MachineEscrow: empty evidence hash");

        // Verify EIP-712 signature
        bytes32 structHash = keccak256(
            abi.encode(
                ATTESTATION_TYPEHASH,
                taskId,
                task.assignedAgent,
                evidenceHash,
                timestamp,
                nonce
            )
        );

        bytes32 digest = _hashTypedDataV4(structHash);
        address signer = ECDSA.recover(digest, signature);
        require(signer == authorizedVerifier, "MachineEscrow: invalid verifier signature");

        // Mark nonce as used
        usedNonces[nonce] = true;

        // State change
        task.state = TaskState.Completed;
        task.evidenceHash = evidenceHash;
        task.completedAt = block.timestamp;
        uint256 rewardAmount = task.reward;

        // Interaction (Transfer reward to assigned agent)
        address payable agentPayable = payable(task.assignedAgent);
        (bool sent, ) = agentPayable.call{value: rewardAmount}("");
        require(sent, "MachineEscrow: reward transfer failed");

        emit TaskCompleted(taskId, task.assignedAgent, rewardAmount, evidenceHash);
    }

    /**
     * @notice Raise a dispute if there is an issue during execution.
     */
    function raiseDispute(bytes32 taskId, string calldata reason) external {
        Task storage task = tasks[taskId];
        require(task.creator != address(0), "MachineEscrow: task does not exist");
        require(
            task.state == TaskState.Assigned || task.state == TaskState.InProgress,
            "MachineEscrow: invalid state for dispute"
        );
        require(
            msg.sender == task.creator || msg.sender == task.assignedAgent,
            "MachineEscrow: unauthorized dispute"
        );

        task.state = TaskState.Disputed;
        emit TaskDisputed(taskId, msg.sender, reason);
    }

    /**
     * @notice Creator can refund escrow if deadline has expired and task not completed.
     */
    function refundExpiredTask(bytes32 taskId) external nonReentrant {
        Task storage task = tasks[taskId];
        require(task.creator != address(0), "MachineEscrow: task does not exist");
        require(msg.sender == task.creator, "MachineEscrow: only creator can claim refund");
        require(
            task.state == TaskState.Created ||
            task.state == TaskState.Assigned ||
            task.state == TaskState.InProgress ||
            task.state == TaskState.Disputed,
            "MachineEscrow: cannot refund in current state"
        );
        require(block.timestamp > task.deadline, "MachineEscrow: deadline not reached");

        task.state = TaskState.Refunded;
        uint256 refundAmount = task.reward;

        (bool sent, ) = payable(task.creator).call{value: refundAmount}("");
        require(sent, "MachineEscrow: refund transfer failed");

        emit TaskRefunded(taskId, task.creator, refundAmount);
    }

    /**
     * @notice Returns total number of tasks created.
     */
    function getTaskCount() external view returns (uint256) {
        return taskIds.length;
    }

    /**
     * @notice Returns task metadata.
     */
    function getTask(bytes32 taskId) external view returns (Task memory) {
        return tasks[taskId];
    }
}
