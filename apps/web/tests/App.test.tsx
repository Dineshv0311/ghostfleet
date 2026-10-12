import { describe, it, expect } from 'vitest';
import { render, screen, fireEvent } from '@testing-library/react';
import React from 'react';
import App from '../src/App';
import { evaluateAgentForTask } from '../src/services/assignmentEngine';
import { SEEDED_AGENTS } from '../src/services/mockData';
import { TaskRecord, TaskState } from '../src/types';

describe('GHOSTFLEET Web Application & Engine', () => {
  it('renders command center dashboard and branding', () => {
    render(<App />);
    expect(screen.getByText('GHOSTFLEET')).toBeInTheDocument();
    expect(screen.getByText('GHOSTFLEET COMMAND CENTER')).toBeInTheDocument();
    expect(screen.getByText('SIMULATION MODE ACTIVE')).toBeInTheDocument();
  });

  it('navigates between command tabs', () => {
    render(<App />);
    const marketplaceTab = screen.getByText('Task Marketplace');
    fireEvent.click(marketplaceTab);
    expect(screen.getByText('Machine Task Marketplace')).toBeInTheDocument();

    const simulationTab = screen.getByText('City Simulation');
    fireEvent.click(simulationTab);
    expect(screen.getByText(/Tactical Urban Grid/i)).toBeInTheDocument();

    const agentsTab = screen.getByText('Agent Fleet');
    fireEvent.click(agentsTab);
    expect(screen.getByText(/Autonomous Robot Agent Fleet/i)).toBeInTheDocument();
  });

  it('transparently scores and selects the optimal agent based on capabilities and battery', () => {
    const mockHeavyTask: TaskRecord = {
      taskId: '0x123',
      title: 'Heavy Structural Steel Delivery',
      creator: '0x111',
      assignedAgent: null,
      origin: 'Central Hub',
      originCoords: { x: 20, y: 30 },
      destination: 'Sector 7 Depot',
      destCoords: { x: 75, y: 80 },
      reward: '0.08',
      deadline: Math.floor(Date.now() / 1000) + 3600,
      state: TaskState.Created,
      createdAt: Date.now(),
    };

    const haulerScore = evaluateAgentForTask(SEEDED_AGENTS[0], mockHeavyTask); // Titan Hauler II (92% battery, Heavy Cargo)
    const scoutScore = evaluateAgentForTask(SEEDED_AGENTS[1], mockHeavyTask); // Vanguard Scout I (32% battery, lacks Heavy Cargo)

    expect(haulerScore.totalScore).toBeGreaterThan(scoutScore.totalScore);
    expect(haulerScore.explanation).toContain('Matches Heavy Cargo specifications (+20)');
  });
});
