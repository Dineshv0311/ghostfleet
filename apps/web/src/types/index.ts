export enum TaskState {
  Created = 0,
  Assigned = 1,
  InProgress = 2,
  Completed = 3,
  Disputed = 4,
  Refunded = 5,
}

export interface TaskRecord {
  taskId: string; // bytes32 hex
  title: string;
  creator: string;
  assignedAgent: string | null;
  assignedAgentId?: string;
  origin: string;
  originCoords: { x: number; y: number };
  destination: string;
  destCoords: { x: number; y: number };
  reward: string; // In ETH
  rewardWei?: bigint;
  deadline: number; // Unix timestamp in seconds
  state: TaskState;
  evidenceHash?: string;
  canonicalEvidence?: string;
  attestationSignature?: string;
  attestationNonce?: number;
  attestationTimestamp?: number;
  txHash?: string;
  settlementTxHash?: string;
  createdAt: number;
  completedAt?: number;
  failureReason?: string;
  isSimulatedOnly?: boolean; // Clearly marks demo-only vs on-chain tasks
}

export type AgentStatus = 'idle' | 'assigned' | 'moving' | 'verifying' | 'recharging' | 'error';

export interface AgentRecord {
  id: string; // e.g. "HAULER-02"
  name: string;
  type: 'Heavy Hauler' | 'Rapid Courier' | 'Precision Drone' | 'Inspector Scout';
  address: string;
  capabilities: string[];
  battery: number; // 0 - 100
  speed: number;
  capacityKg: number;
  currentLocation: { x: number; y: number; label: string };
  status: AgentStatus;
  currentTaskId: string | null;
  tasksCompleted: number;
  tasksFailed: number;
  offChainReputation: number; // 0 - 100
  color: string;
  history: string[];
}

export interface VerificationTelemetry {
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

export interface VerificationResponse {
  success: boolean;
  taskId: string;
  evidenceHash: string;
  canonicalEvidence: string;
  timestamp: number;
  nonce: number;
  signature: string;
  verifierAddress: string;
  reason?: string;
}

export interface ContractEventLog {
  id: string;
  eventName: string;
  taskId: string;
  summary: string;
  txHash: string;
  blockNumber?: number;
  timestamp: number;
  isLocal: boolean;
  params: Record<string, any>;
}

export interface ActivityFeedItem {
  id: string;
  timestamp: number;
  source: 'AGENT' | 'ESCROW' | 'VERIFIER' | 'DISPATCHER';
  level: 'info' | 'success' | 'warn' | 'error';
  message: string;
  taskId?: string;
  agentId?: string;
}
