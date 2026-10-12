import { AgentRecord } from '../types';

export interface LocationNode {
  id: string;
  name: string;
  type: 'hub' | 'warehouse' | 'station' | 'hospital' | 'port' | 'residential';
  x: number; // 0 to 100 percentage
  y: number; // 0 to 100 percentage
  description: string;
}

export const CITY_LOCATIONS: LocationNode[] = [
  { id: 'LOC-HUB', name: 'Fleet Central Terminal', type: 'hub', x: 20, y: 30, description: 'Command & Charging Station Alpha' },
  { id: 'LOC-PORT', name: 'Deep Harbor Logistics', type: 'port', x: 80, y: 25, description: 'Maritime freight container yard' },
  { id: 'LOC-MED', name: 'Apex Medical Center', type: 'hospital', x: 25, y: 75, description: 'Emergency pharma delivery bay' },
  { id: 'LOC-WARE', name: 'Sector 7 Industrial Depot', type: 'warehouse', x: 75, y: 80, description: 'Autonomous manufacturing hub' },
  { id: 'LOC-STN', name: 'Grid Supercharger Beta', type: 'station', x: 50, y: 50, description: 'High-voltage inductive pad' },
  { id: 'LOC-RES', name: 'Skyline Residential Towers', type: 'residential', x: 55, y: 20, description: 'Micro-courier drone perch' },
];

// Seeded autonomous agents with verified test keys/addresses
export const SEEDED_AGENTS: AgentRecord[] = [
  {
    id: 'HAULER-02',
    name: 'Titan Hauler II',
    type: 'Heavy Hauler',
    // Hardhat Account #2
    address: '0x70997970C51812dc3A010C7d01b50e0d17dc79C8',
    capabilities: ['Heavy Cargo', 'High Torque', 'All-Weather', 'Secure Container'],
    battery: 92,
    speed: 35, // km/h
    capacityKg: 150,
    currentLocation: { x: 20, y: 30, label: 'Fleet Central Terminal' },
    status: 'idle',
    currentTaskId: null,
    tasksCompleted: 48,
    tasksFailed: 1,
    offChainReputation: 98,
    color: '#00f0ff', // Cyan
    history: ['Delivered 80kg lithium batteries to Sector 7', 'Escrow settlement verified on-chain'],
  },
  {
    id: 'SCOUT-01',
    name: 'Vanguard Scout I',
    type: 'Precision Drone',
    // Hardhat Account #3
    address: '0x3C44CdDdB6a900fa2b585dd299e03d12FA4293BC',
    capabilities: ['Rapid Transit', 'Aerial LiDAR', 'Bio-Medical Safe'],
    battery: 32, // Lower battery: explains why Hauler-02 is favored for distant tasks!
    speed: 75,
    capacityKg: 15,
    currentLocation: { x: 25, y: 75, label: 'Apex Medical Center' },
    status: 'idle',
    currentTaskId: null,
    tasksCompleted: 84,
    tasksFailed: 3,
    offChainReputation: 94,
    color: '#f59e0b', // Amber
    history: ['Completed priority serum route to Skyline Towers', 'Low battery warning logged'],
  },
  {
    id: 'COURIER-03',
    name: 'Hermes Quad-Runner',
    type: 'Rapid Courier',
    // Hardhat Account #4
    address: '0x90F79bf6EB2c4f870365E785982E1f101E93b906',
    capabilities: ['Urban Agility', 'High Speed', 'Tamper Seal'],
    battery: 88,
    speed: 55,
    capacityKg: 30,
    currentLocation: { x: 80, y: 25, label: 'Deep Harbor Logistics' },
    status: 'recharging', // Currently busy recharging
    currentTaskId: null,
    tasksCompleted: 112,
    tasksFailed: 2,
    offChainReputation: 97,
    color: '#a855f7', // Purple
    history: ['Scheduled inductive charge cycle in progress'],
  },
];
