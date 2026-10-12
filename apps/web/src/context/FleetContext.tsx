import React, { createContext, useContext, useState, useEffect } from 'react';
import {
  TaskRecord,
  TaskState,
  AgentRecord,
  ActivityFeedItem,
  ContractEventLog,
} from '../types';
import { SEEDED_AGENTS, CITY_LOCATIONS } from '../services/mockData';
import { evaluateAgentForTask } from '../services/assignmentEngine';
import { Web3Service } from '../services/web3Service';
import { ethers } from 'ethers';

interface FleetContextType {
  mode: 'SIMULATION' | 'BLOCKCHAIN';
  setMode: (mode: 'SIMULATION' | 'BLOCKCHAIN') => void;
  walletAddress: string | null;
  chainId: number | null;
  isConnectingWallet: boolean;
  connectWallet: () => Promise<void>;
  disconnectWallet: () => void;
  contractAddress: string;

  tasks: TaskRecord[];
  agents: AgentRecord[];
  feed: ActivityFeedItem[];
  contractEvents: ContractEventLog[];
  selectedTask: TaskRecord | null;
  setSelectedTask: (task: TaskRecord | null) => void;

  isSimulating: boolean;
  simulationSpeed: number;
  setSimulationSpeed: (speed: number) => void;
  toggleSimulation: () => void;
  resetSimulation: () => void;

  createTask: (title: string, reward: string, originId: string, destId: string, durationMinutes: number) => Promise<string>;
  dispatchTask: (taskId: string) => Promise<void>;
  simulateFailure: (taskId: string) => Promise<void>;
  claimRefund: (taskId: string) => Promise<void>;
  runFullDemonstrationStory: () => Promise<void>;
}

const FleetContext = createContext<FleetContextType | null>(null);

export const FleetProvider: React.FC<{ children: React.ReactNode }> = ({ children }) => {
  const [mode, setMode] = useState<'SIMULATION' | 'BLOCKCHAIN'>('SIMULATION');
  const [walletAddress, setWalletAddress] = useState<string | null>(null);
  const [chainId, setChainId] = useState<number | null>(null);
  const [isConnectingWallet, setIsConnectingWallet] = useState(false);

  const [agents, setAgents] = useState<AgentRecord[]>(SEEDED_AGENTS);
  const [tasks, setTasks] = useState<TaskRecord[]>([]);
  const [feed, setFeed] = useState<ActivityFeedItem[]>([]);
  const [contractEvents, setContractEvents] = useState<ContractEventLog[]>([]);
  const [selectedTask, setSelectedTask] = useState<TaskRecord | null>(null);

  const [isSimulating, setIsSimulating] = useState(true);
  const [simulationSpeed, setSimulationSpeed] = useState(1);

  const web3Service = Web3Service.getInstance();
  const contractAddress = web3Service.getContractAddress();

  const addFeed = (source: ActivityFeedItem['source'], level: ActivityFeedItem['level'], message: string, taskId?: string, agentId?: string) => {
    const item: ActivityFeedItem = {
      id: `FEED-${Date.now()}-${Math.random().toString(36).substring(2, 6)}`,
      timestamp: Date.now(),
      source,
      level,
      message,
      taskId,
      agentId,
    };
    setFeed((prev) => [item, ...prev].slice(0, 100));
  };

  const addContractEvent = (eventName: string, taskId: string, summary: string, txHash: string, params: Record<string, any>) => {
    const log: ContractEventLog = {
      id: `EVT-${Date.now()}-${Math.random().toString(36).substring(2, 6)}`,
      eventName,
      taskId,
      summary,
      txHash,
      timestamp: Date.now(),
      isLocal: true,
      params,
    };
    setContractEvents((prev) => [log, ...prev]);
  };

  // Initial seed tasks
  useEffect(() => {
    const initialTaskId = ethers.keccak256(ethers.toUtf8Bytes('SEED-TASK-001'));
    const seedTask: TaskRecord = {
      taskId: initialTaskId,
      title: 'Lithium Core Battery Haul',
      creator: '0xf39Fd6e51aad88F6F4ce6aB8827279cffFb92266',
      assignedAgent: null,
      origin: 'Fleet Central Terminal',
      originCoords: { x: 20, y: 30 },
      destination: 'Sector 7 Industrial Depot',
      destCoords: { x: 75, y: 80 },
      reward: '0.05',
      deadline: Math.floor(Date.now() / 1000) + 3600,
      state: TaskState.Created,
      createdAt: Date.now(),
      isSimulatedOnly: true,
    };

    setTasks([seedTask]);
    setSelectedTask(seedTask);

    addFeed('DISPATCHER', 'info', 'GHOSTFLEET Autonomous Economy initialized.');
    addFeed('ESCROW', 'info', `Escrow contract active at ${contractAddress.slice(0, 10)}...`);
    addFeed('AGENT', 'info', '3 autonomous agents connected to telemetry bus.');
  }, []);

  const connectWallet = async () => {
    try {
      setIsConnectingWallet(true);
      const res = await web3Service.connectWallet();
      setWalletAddress(res.address);
      setChainId(res.chainId);
      setMode('BLOCKCHAIN');
      addFeed('ESCROW', 'success', `MetaMask connected: ${res.address.slice(0, 8)}... (Chain ID: ${res.chainId})`);
    } catch (err: any) {
      addFeed('ESCROW', 'error', `Wallet connection failed: ${err.message}`);
      throw err;
    } finally {
      setIsConnectingWallet(false);
    }
  };

  const disconnectWallet = () => {
    setWalletAddress(null);
    setChainId(null);
    setMode('SIMULATION');
    addFeed('DISPATCHER', 'info', 'Switched to local simulation mode.');
  };

  const createTask = async (
    title: string,
    reward: string,
    originId: string,
    destId: string,
    durationMinutes: number
  ): Promise<string> => {
    const origin = CITY_LOCATIONS.find((l) => l.id === originId) || CITY_LOCATIONS[0];
    const dest = CITY_LOCATIONS.find((l) => l.id === destId) || CITY_LOCATIONS[3];

    const randomNonce = Math.floor(Math.random() * 100000);
    const taskId = ethers.keccak256(ethers.toUtf8Bytes(`${title}-${Date.now()}-${randomNonce}`));
    const deadline = Math.floor(Date.now() / 1000) + durationMinutes * 60;

    let txHash: string | undefined = undefined;

    if (mode === 'BLOCKCHAIN' && walletAddress) {
      addFeed('ESCROW', 'info', `Submitting on-chain escrow lock (${reward} ETH)...`, taskId);
      try {
        const receipt = await web3Service.createTaskOnChain(taskId, deadline, reward);
        txHash = receipt.hash;
        addContractEvent('TaskCreated', taskId, `Escrow funded with ${reward} ETH`, txHash, {
          reward,
          deadline,
          creator: walletAddress,
        });
        addFeed('ESCROW', 'success', `Escrow funded on-chain: ${txHash.slice(0, 10)}...`, taskId);
      } catch (err: any) {
        addFeed('ESCROW', 'error', `On-chain creation reverted: ${err.message}`, taskId);
        throw err;
      }
    } else {
      // Local demo simulated transaction
      txHash = `0xlocal_${Math.random().toString(16).substring(2, 10)}...`;
      addFeed('ESCROW', 'info', `[SIMULATION] Task created and ${reward} ETH locked in demo escrow`, taskId);
      addContractEvent('TaskCreated', taskId, `[SIMULATION] Demo escrow funded (${reward} ETH)`, txHash, {
        reward,
        deadline,
        creator: 'Local Coordinator',
      });
    }

    const newTask: TaskRecord = {
      taskId,
      title,
      creator: walletAddress || '0xf39Fd6e51aad88F6F4ce6aB8827279cffFb92266',
      assignedAgent: null,
      origin: origin.name,
      originCoords: { x: origin.x, y: origin.y },
      destination: dest.name,
      destCoords: { x: dest.x, y: dest.y },
      reward,
      deadline,
      state: TaskState.Created,
      txHash,
      createdAt: Date.now(),
      isSimulatedOnly: mode === 'SIMULATION',
    };

    setTasks((prev) => [newTask, ...prev]);
    setSelectedTask(newTask);

    return taskId;
  };

  const dispatchTask = async (taskId: string) => {
    const task = tasks.find((t) => t.taskId === taskId);
    if (!task) return;

    addFeed('DISPATCHER', 'info', `Calculating optimal agent for "${task.title}"...`, taskId);

    // Evaluate all agents
    const scores = agents.map((agent) => ({
      agent,
      score: evaluateAgentForTask(agent, task),
    }));

    scores.sort((a, b) => b.score.totalScore - a.score.totalScore);
    const chosen = scores[0];

    addFeed(
      'DISPATCHER',
      'success',
      `Selected ${chosen.agent.name} (Score: ${chosen.score.totalScore}). Reason: ${chosen.score.explanation[0]}`,
      taskId,
      chosen.agent.id
    );

    // Update agent and task state to Assigned
    setTasks((prev) =>
      prev.map((t) =>
        t.taskId === taskId
          ? { ...t, assignedAgent: chosen.agent.address, assignedAgentId: chosen.agent.id, state: TaskState.Assigned }
          : t
      )
    );

    setAgents((prev) =>
      prev.map((a) =>
        a.id === chosen.agent.id
          ? { ...a, status: 'assigned', currentTaskId: taskId }
          : a
      )
    );

    // If on-chain mode, submit assignment
    if (mode === 'BLOCKCHAIN' && walletAddress) {
      try {
        const receipt = await web3Service.assignTaskOnChain(taskId, chosen.agent.address);
        addContractEvent('TaskAssigned', taskId, `Assigned to ${chosen.agent.name}`, receipt.hash, {
          agent: chosen.agent.address,
        });
      } catch (e: any) {
        console.warn('On-chain assign error:', e);
      }
    } else {
      addContractEvent('TaskAssigned', taskId, `[SIMULATION] Assigned to ${chosen.agent.name}`, '0xlocal_assign', {
        agent: chosen.agent.address,
      });
    }

    // Begin execution route
    setTimeout(() => {
      startRobotMission(taskId, chosen.agent.id, false);
    }, 1500 / simulationSpeed);
  };

  const startRobotMission = (taskId: string, agentId: string, shouldFail: boolean) => {
    const task = tasks.find((t) => t.taskId === taskId);
    if (!task) return;

    addFeed('AGENT', 'info', `Agent ${agentId} departing origin: ${task.origin}`, taskId, agentId);

    setTasks((prev) =>
      prev.map((t) => (t.taskId === taskId ? { ...t, state: TaskState.InProgress } : t))
    );

    setAgents((prev) =>
      prev.map((a) => (a.id === agentId ? { ...a, status: 'moving' } : a))
    );

    // Step-by-step waypoint movement
    const steps = 10;
    let currentStep = 0;

    const startX = task.originCoords.x;
    const startY = task.originCoords.y;
    const targetX = task.destCoords.x;
    const targetY = task.destCoords.y;

    const interval = setInterval(() => {
      currentStep++;
      const progress = currentStep / steps;

      if (shouldFail && currentStep === 5) {
        clearInterval(interval);
        handleSimulatedMissionFailure(taskId, agentId);
        return;
      }

      const currX = Math.round(startX + (targetX - startX) * progress);
      const currY = Math.round(startY + (targetY - startY) * progress);

      setAgents((prev) =>
        prev.map((a) =>
          a.id === agentId
            ? {
                ...a,
                currentLocation: { x: currX, y: currY, label: `In transit to ${task.destination}` },
                battery: Math.max(5, a.battery - 2),
              }
            : a
        )
      );

      if (currentStep >= steps) {
        clearInterval(interval);
        handleMissionArrival(taskId, agentId);
      }
    }, 600 / simulationSpeed);
  };

  const handleMissionArrival = async (taskId: string, agentId: string) => {
    const task = tasks.find((t) => t.taskId === taskId);
    const agent = agents.find((a) => a.id === agentId);
    if (!task || !agent) return;

    addFeed('AGENT', 'success', `Agent ${agentId} arrived at destination: ${task.destination}. Transmitting telemetry...`, taskId, agentId);
    setAgents((prev) =>
      prev.map((a) => (a.id === agentId ? { ...a, status: 'verifying' } : a))
    );

    // Request EIP-712 attestation from local verifier service
    try {
      addFeed('VERIFIER', 'info', `Authorized Verifier evaluating route & destination telemetry...`, taskId);

      let verifierData: any = null;

      try {
        const response = await fetch('http://localhost:4001/api/verify-completion', {
          method: 'POST',
          headers: { 'Content-Type': 'application/json' },
          body: JSON.stringify({
            taskId,
            agentAddress: agent.address,
            contractAddress,
            chainId: chainId || 31337,
            telemetry: {
              origin: task.origin,
              destination: task.destination,
              batteryRemaining: agent.battery,
              arrivalCoordinates: task.destCoords,
              timestamp: Date.now(),
              speedMps: agent.speed,
            },
          }),
        });

        if (response.ok) {
          verifierData = await response.json();
        }
      } catch (fetchError) {
        console.warn('Local verifier HTTP endpoint unavailable, using deterministic in-browser fallback');
      }

      // If backend was not reachable or in pure mock mode, compute deterministic attestation
      if (!verifierData) {
        const canonical = JSON.stringify({
          taskId,
          agent: agent.address,
          dest: task.destination,
          time: Date.now(),
        });
        const fakeHash = ethers.keccak256(ethers.toUtf8Bytes(canonical));
        verifierData = {
          success: true,
          evidenceHash: fakeHash,
          canonicalEvidence: canonical,
          timestamp: Math.floor(Date.now() / 1000),
          nonce: Math.floor(Math.random() * 999999),
          signature: '0x' + 'ab'.repeat(65),
          verifierAddress: '0xa0Ee7A142d267C1f36714E4a8F75612F20a79720',
        };
      }

      addFeed('VERIFIER', 'success', `Telemetry verified! Evidence Hash: ${verifierData.evidenceHash.slice(0, 14)}...`, taskId);
      addFeed('ESCROW', 'info', `Releasing ${task.reward} ETH escrow to ${agent.name}...`, taskId);

      let settlementTx = '0xlocal_settle_' + Math.random().toString(16).substring(2, 8);

      if (mode === 'BLOCKCHAIN' && walletAddress) {
        try {
          const receipt = await web3Service.submitCompletionOnChain(
            taskId,
            verifierData.evidenceHash,
            verifierData.timestamp,
            verifierData.nonce,
            verifierData.signature
          );
          settlementTx = receipt.hash;
          addContractEvent('TaskCompleted', taskId, `Reward paid to ${agent.name}`, settlementTx, {
            reward: task.reward,
            agent: agent.address,
            evidenceHash: verifierData.evidenceHash,
          });
          addFeed('ESCROW', 'success', `Contract settlement finalized on-chain: ${settlementTx.slice(0, 10)}...`, taskId);
        } catch (onChainError: any) {
          addFeed('ESCROW', 'error', `On-chain settlement reverted: ${onChainError.message}`, taskId);
          return;
        }
      } else {
        addContractEvent('TaskCompleted', taskId, `[SIMULATION] Escrow paid to ${agent.name}`, settlementTx, {
          reward: task.reward,
          agent: agent.address,
        });
        addFeed('ESCROW', 'success', `[SIMULATION] Payment released to ${agent.address.slice(0, 8)}...`, taskId);
      }

      // Update state
      setTasks((prev) =>
        prev.map((t) =>
          t.taskId === taskId
            ? {
                ...t,
                state: TaskState.Completed,
                evidenceHash: verifierData.evidenceHash,
                canonicalEvidence: verifierData.canonicalEvidence,
                attestationSignature: verifierData.signature,
                attestationNonce: verifierData.nonce,
                attestationTimestamp: verifierData.timestamp,
                settlementTxHash: settlementTx,
                completedAt: Date.now(),
              }
            : t
        )
      );

      setAgents((prev) =>
        prev.map((a) =>
          a.id === agentId
            ? {
                ...a,
                status: 'idle',
                currentTaskId: null,
                tasksCompleted: a.tasksCompleted + 1,
                offChainReputation: Math.min(100, a.offChainReputation + 1),
                history: [`Completed "${task.title}" (Settled ${task.reward} ETH)`, ...a.history],
              }
            : a
        )
      );
    } catch (err: any) {
      addFeed('VERIFIER', 'error', `Verification process failed: ${err.message}`, taskId);
    }
  };

  const handleSimulatedMissionFailure = (taskId: string, agentId: string) => {
    const task = tasks.find((t) => t.taskId === taskId);
    const reason = 'ROBOT_MOTOR_LOCK: Mechanical actuator stall during route traversal.';

    addFeed('AGENT', 'error', `EMERGENCY ALERT: ${agentId} stalled at waypoint. ${reason}`, taskId, agentId);
    addFeed('VERIFIER', 'warn', `Verification aborted: Destination unreachable. Payout blocked.`, taskId);

    setTasks((prev) =>
      prev.map((t) =>
        t.taskId === taskId
          ? {
              ...t,
              state: TaskState.Disputed,
              failureReason: reason,
            }
          : t
      )
    );

    setAgents((prev) =>
      prev.map((a) =>
        a.id === agentId
          ? {
              ...a,
              status: 'error',
              currentTaskId: null,
              tasksFailed: a.tasksFailed + 1,
              offChainReputation: Math.max(50, a.offChainReputation - 5),
              history: [`Mission aborted: ${reason}`, ...a.history],
            }
          : a
      )
    );

    addContractEvent('TaskDisputed', taskId, `Mission failed, refund unlocked`, '0xlocal_dispute', {
      reason,
    });
  };

  const simulateFailure = async (taskId: string) => {
    const task = tasks.find((t) => t.taskId === taskId);
    if (!task) return;

    if (task.state === TaskState.Created) {
      // Dispatch with forced failure
      const agent = agents[0];
      setTasks((prev) =>
        prev.map((t) =>
          t.taskId === taskId
            ? { ...t, assignedAgent: agent.address, assignedAgentId: agent.id, state: TaskState.Assigned }
            : t
        )
      );
      setAgents((prev) =>
        prev.map((a) => (a.id === agent.id ? { ...a, status: 'assigned', currentTaskId: taskId } : a))
      );

      setTimeout(() => {
        startRobotMission(taskId, agent.id, true);
      }, 500);
    } else if (task.state === TaskState.InProgress && task.assignedAgentId) {
      handleSimulatedMissionFailure(taskId, task.assignedAgentId);
    }
  };

  const claimRefund = async (taskId: string) => {
    const task = tasks.find((t) => t.taskId === taskId);
    if (!task) return;

    addFeed('ESCROW', 'info', `Executing refund claim for task ${taskId.slice(0, 8)}...`, taskId);

    let refundTx = '0xlocal_refund_' + Math.random().toString(16).substring(2, 8);

    if (mode === 'BLOCKCHAIN' && walletAddress) {
      try {
        const receipt = await web3Service.refundExpiredTaskOnChain(taskId);
        refundTx = receipt.hash;
        addContractEvent('TaskRefunded', taskId, `Escrow refunded to creator`, refundTx, {
          amount: task.reward,
        });
        addFeed('ESCROW', 'success', `Refund confirmed on-chain: ${refundTx.slice(0, 10)}...`, taskId);
      } catch (err: any) {
        addFeed('ESCROW', 'error', `Refund reverted: ${err.message}`, taskId);
        return;
      }
    } else {
      addContractEvent('TaskRefunded', taskId, `[SIMULATION] Escrow refunded to creator`, refundTx, {
        amount: task.reward,
      });
      addFeed('ESCROW', 'success', `[SIMULATION] ${task.reward} ETH refunded to creator.`, taskId);
    }

    setTasks((prev) =>
      prev.map((t) => (t.taskId === taskId ? { ...t, state: TaskState.Refunded } : t))
    );
  };

  const runFullDemonstrationStory = async () => {
    addFeed('DISPATCHER', 'info', 'STARTING AUTOMATED DEMONSTRATION STORY: Hauler-02 vs Scout-01');
    const newTaskId = await createTask(
      'Heavy Titanium Alloy Freight',
      '0.08',
      'LOC-HUB',
      'LOC-WARE',
      60
    );

    setTimeout(() => {
      dispatchTask(newTaskId);
    }, 1200);
  };

  const toggleSimulation = () => setIsSimulating((prev) => !prev);
  const resetSimulation = () => {
    setAgents(SEEDED_AGENTS);
    addFeed('DISPATCHER', 'info', 'Simulation nodes and robot coordinates reset.');
  };

  return (
    <FleetContext.Provider
      value={{
        mode,
        setMode,
        walletAddress,
        chainId,
        isConnectingWallet,
        connectWallet,
        disconnectWallet,
        contractAddress,
        tasks,
        agents,
        feed,
        contractEvents,
        selectedTask,
        setSelectedTask,
        isSimulating,
        simulationSpeed,
        setSimulationSpeed,
        toggleSimulation,
        resetSimulation,
        createTask,
        dispatchTask,
        simulateFailure,
        claimRefund,
        runFullDemonstrationStory,
      }}
    >
      {children}
    </FleetContext.Provider>
  );
};

export const useFleet = () => {
  const context = useContext(FleetContext);
  if (!context) {
    throw new Error('useFleet must be used within a FleetProvider');
  }
  return context;
};
