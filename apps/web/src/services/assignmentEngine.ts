import { AgentRecord, TaskRecord } from '../types';

export interface AssignmentScore {
  agentId: string;
  totalScore: number;
  batteryScore: number;
  distanceScore: number;
  capabilityScore: number;
  availabilityScore: number;
  explanation: string[];
}

export function evaluateAgentForTask(agent: AgentRecord, task: TaskRecord): AssignmentScore {
  const explanation: string[] = [];

  // Availability factor
  let availabilityScore = 0;
  if (agent.status === 'idle') {
    availabilityScore = 30;
    explanation.push('Agent is free and ready for deployment (+30)');
  } else if (agent.status === 'recharging') {
    availabilityScore = 5;
    explanation.push('Agent is engaged in active recharge cycle (+5)');
  } else {
    availabilityScore = 0;
    explanation.push('Agent is currently committed to another mission (+0)');
  }

  // Battery factor
  let batteryScore = 0;
  if (agent.battery >= 80) {
    batteryScore = 25;
    explanation.push(`Optimal battery charge (${agent.battery}%) (+25)`);
  } else if (agent.battery >= 50) {
    batteryScore = 15;
    explanation.push(`Moderate battery charge (${agent.battery}%) (+15)`);
  } else {
    batteryScore = 5;
    explanation.push(`Low battery telemetry (${agent.battery}%) - higher risk (+5)`);
  }

  // Distance / Euclidean proximity factor
  const dx = agent.currentLocation.x - task.originCoords.x;
  const dy = agent.currentLocation.y - task.originCoords.y;
  const distance = Math.sqrt(dx * dx + dy * dy);
  let distanceScore = Math.max(0, Math.round(25 - (distance / 100) * 20));
  explanation.push(`Proximity distance: ${distance.toFixed(1)} km to origin (+${distanceScore})`);

  // Capability matching
  let capabilityScore = 20;
  if (task.title.toLowerCase().includes('heavy') || task.title.toLowerCase().includes('cargo')) {
    if (agent.capabilities.includes('Heavy Cargo')) {
      capabilityScore = 20;
      explanation.push('Matches Heavy Cargo specifications (+20)');
    } else {
      capabilityScore = 5;
      explanation.push('Lacks heavy payload capacity (+5)');
    }
  } else {
    explanation.push('Standard freight requirements met (+20)');
  }

  const totalScore = availabilityScore + batteryScore + distanceScore + capabilityScore;

  return {
    agentId: agent.id,
    totalScore,
    batteryScore,
    distanceScore,
    capabilityScore,
    availabilityScore,
    explanation,
  };
}
