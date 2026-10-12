import React, { useState } from 'react';
import { useFleet } from '../../context/FleetContext';
import { CITY_LOCATIONS } from '../../services/mockData';
import {
  Play,
  Pause,
  RotateCcw,
  Zap,
  Navigation,
  Battery,
  AlertTriangle,
  CheckCircle2,
  Cpu,
  MapPin,
  Clock,
  ArrowRight,
} from 'lucide-react';
import { TaskState } from '../../types';

export const CitySimulation: React.FC = () => {
  const {
    agents,
    tasks,
    selectedTask,
    setSelectedTask,
    isSimulating,
    toggleSimulation,
    resetSimulation,
    simulationSpeed,
    setSimulationSpeed,
    dispatchTask,
    simulateFailure,
  } = useFleet();

  const [hoveredAgent, setHoveredAgent] = useState<string | null>(null);

  // Active moving route
  const activeTask = tasks.find(
    (t) => t.state === TaskState.InProgress || t.state === TaskState.Assigned
  );

  return (
    <div className="grid grid-cols-1 lg:grid-cols-4 gap-6">
      {/* 2D City Canvas & Control Deck */}
      <div className="lg:col-span-3 space-y-4">
        {/* Controls Header */}
        <div className="flex flex-wrap items-center justify-between gap-3 p-3 bg-surface border border-surfaceBorder rounded-lg">
          <div className="flex items-center space-x-2">
            <span className="w-2.5 h-2.5 rounded-full bg-cyanAccent animate-ping" />
            <span className="font-mono text-sm font-semibold text-white">
              Tactical Urban Grid | Neo-Metropolis Sector 4
            </span>
          </div>

          <div className="flex items-center space-x-2">
            {/* Speed Toggle */}
            <div className="flex items-center space-x-1 bg-surfaceLight border border-surfaceBorder rounded px-1.5 py-0.5 text-xs font-mono">
              <span className="text-gray-400 mr-1 text-[11px]">Speed:</span>
              {[1, 2, 4].map((spd) => (
                <button
                  key={spd}
                  onClick={() => setSimulationSpeed(spd)}
                  className={`px-1.5 py-0.5 rounded text-[11px] ${
                    simulationSpeed === spd
                      ? 'bg-cyanAccent/20 text-cyanAccent font-bold'
                      : 'text-gray-400 hover:text-gray-200'
                  }`}
                >
                  {spd}x
                </button>
              ))}
            </div>

            {/* Play/Pause */}
            <button
              onClick={toggleSimulation}
              className="flex items-center space-x-1 px-2.5 py-1 rounded bg-surfaceLight border border-surfaceBorder text-gray-300 text-xs font-mono hover:text-white"
            >
              {isSimulating ? <Pause className="w-3.5 h-3.5" /> : <Play className="w-3.5 h-3.5" />}
              <span>{isSimulating ? 'Pause' : 'Resume'}</span>
            </button>

            {/* Reset */}
            <button
              onClick={resetSimulation}
              className="p-1 rounded bg-surfaceLight border border-surfaceBorder text-gray-400 hover:text-white"
              title="Reset Robot Coordinates"
            >
              <RotateCcw className="w-3.5 h-3.5" />
            </button>
          </div>
        </div>

        {/* 2D Smart City Map Box */}
        <div className="relative w-full aspect-[16/9] bg-[#070b12] rounded-xl border border-surfaceBorder overflow-hidden shadow-2xl">
          {/* Cyberpunk Grid Background */}
          <div
            className="absolute inset-0 opacity-20 pointer-events-none"
            style={{
              backgroundImage:
                'linear-gradient(to right, #233354 1px, transparent 1px), linear-gradient(to bottom, #233354 1px, transparent 1px)',
              backgroundSize: '40px 40px',
            }}
          />

          {/* Radar Sweep Animation */}
          <div className="absolute top-1/2 left-1/2 -translate-x-1/2 -translate-y-1/2 w-[700px] h-[700px] rounded-full radar-sweep pointer-events-none opacity-40" />

          {/* Road Network Lines */}
          <svg className="absolute inset-0 w-full h-full pointer-events-none">
            {/* Grid Interconnect Arterials */}
            <line x1="20%" y1="30%" x2="50%" y2="50%" stroke="#1e293b" strokeWidth="3" strokeDasharray="6,6" />
            <line x1="80%" y1="25%" x2="50%" y2="50%" stroke="#1e293b" strokeWidth="3" strokeDasharray="6,6" />
            <line x1="25%" y1="75%" x2="50%" y2="50%" stroke="#1e293b" strokeWidth="3" strokeDasharray="6,6" />
            <line x1="75%" y1="80%" x2="50%" y2="50%" stroke="#1e293b" strokeWidth="3" strokeDasharray="6,6" />
            <line x1="55%" y1="20%" x2="80%" y2="25%" stroke="#1e293b" strokeWidth="3" strokeDasharray="6,6" />

            {/* Active Mission Trajectory */}
            {activeTask && (
              <line
                x1={`${activeTask.originCoords.x}%`}
                y1={`${activeTask.originCoords.y}%`}
                x2={`${activeTask.destCoords.x}%`}
                y2={`${activeTask.destCoords.y}%`}
                stroke="#00f0ff"
                strokeWidth="2.5"
                strokeDasharray="8,4"
                className="animate-pulse"
              />
            )}
          </svg>

          {/* City Nodes */}
          {CITY_LOCATIONS.map((loc) => (
            <div
              key={loc.id}
              style={{ left: `${loc.x}%`, top: `${loc.y}%` }}
              className="absolute -translate-x-1/2 -translate-y-1/2 group cursor-pointer"
            >
              <div className="w-7 h-7 rounded-lg bg-surface/90 border border-surfaceBorder flex items-center justify-center group-hover:border-cyanAccent transition-all shadow-md">
                <MapPin className="w-4 h-4 text-gray-400 group-hover:text-cyanAccent" />
              </div>
              <div className="absolute top-8 left-1/2 -translate-x-1/2 whitespace-nowrap bg-background/90 border border-surfaceBorder px-2 py-0.5 rounded text-[10px] font-mono text-gray-300 pointer-events-none opacity-80 group-hover:opacity-100 group-hover:border-cyanAccent transition-all">
                {loc.name}
              </div>
            </div>
          ))}

          {/* Autonomous Robot Markers */}
          {agents.map((agent) => (
            <div
              key={agent.id}
              style={{
                left: `${agent.currentLocation.x}%`,
                top: `${agent.currentLocation.y}%`,
                transition: 'left 0.5s ease-out, top 0.5s ease-out',
              }}
              onMouseEnter={() => setHoveredAgent(agent.id)}
              onMouseLeave={() => setHoveredAgent(null)}
              className="absolute -translate-x-1/2 -translate-y-1/2 z-20 cursor-pointer"
            >
              {/* Pulsing ring when moving */}
              {agent.status === 'moving' && (
                <div
                  className="absolute -inset-2 rounded-full animate-ping opacity-60"
                  style={{ backgroundColor: agent.color }}
                />
              )}

              <div
                className="relative w-8 h-8 rounded-full border-2 flex items-center justify-center bg-surface shadow-lg"
                style={{
                  borderColor: agent.color,
                  boxShadow: `0 0 12px ${agent.color}55`,
                }}
              >
                <Cpu className="w-4 h-4" style={{ color: agent.color }} />
              </div>

              {/* Robot Badge */}
              <div className="absolute -bottom-5 left-1/2 -translate-x-1/2 whitespace-nowrap bg-surface/95 border border-surfaceBorder px-1.5 py-0.5 rounded text-[9px] font-mono text-white flex items-center space-x-1">
                <span>{agent.id}</span>
                <span className="text-gray-400 font-semibold">{agent.battery}%</span>
              </div>

              {/* Hover Tooltip Telemetry */}
              {hoveredAgent === agent.id && (
                <div className="absolute bottom-10 left-1/2 -translate-x-1/2 w-48 p-2.5 rounded-lg bg-surface/95 border border-surfaceBorder text-xs font-mono shadow-xl z-30 pointer-events-none">
                  <div className="text-white font-bold mb-1">{agent.name}</div>
                  <div className="text-[10px] text-gray-400 mb-1">Status: <span className="text-cyanAccent uppercase">{agent.status}</span></div>
                  <div className="text-[10px] text-gray-400 mb-1">Battery: {agent.battery}% | Speed: {agent.speed} km/h</div>
                  <div className="text-[10px] text-gray-400">Reputation: {agent.offChainReputation}/100</div>
                </div>
              )}
            </div>
          ))}
        </div>
      </div>

      {/* Side Deck: Active Mission Telemetry & Actions */}
      <div className="space-y-4">
        <div className="p-4 bg-surface border border-surfaceBorder rounded-lg space-y-4">
          <div className="flex items-center justify-between border-b border-surfaceBorder pb-2">
            <span className="font-mono text-xs font-semibold text-gray-300 uppercase">
              Mission Control
            </span>
            <span className="text-[10px] font-mono px-1.5 py-0.5 rounded bg-surfaceBorder text-cyanAccent">
              TELEMETRY BUS
            </span>
          </div>

          {selectedTask ? (
            <div className="space-y-3 font-mono text-xs">
              <div>
                <span className="text-gray-400 text-[11px]">Active Task:</span>
                <div className="text-white font-bold">{selectedTask.title}</div>
                <div className="text-[10px] text-gray-500 font-mono">{selectedTask.taskId.slice(0, 18)}...</div>
              </div>

              <div className="p-2.5 rounded bg-surfaceLight border border-surfaceBorder space-y-1.5">
                <div className="flex justify-between text-[11px]">
                  <span className="text-gray-400">Escrow Reward:</span>
                  <span className="text-cyanAccent font-bold">{selectedTask.reward} ETH</span>
                </div>
                <div className="flex justify-between text-[11px]">
                  <span className="text-gray-400">Origin:</span>
                  <span className="text-gray-200">{selectedTask.origin}</span>
                </div>
                <div className="flex justify-between text-[11px]">
                  <span className="text-gray-400">Destination:</span>
                  <span className="text-gray-200">{selectedTask.destination}</span>
                </div>
                <div className="flex justify-between text-[11px]">
                  <span className="text-gray-400">Current State:</span>
                  <span
                    className={`font-bold ${
                      selectedTask.state === TaskState.Completed
                        ? 'text-emerald-400'
                        : selectedTask.state === TaskState.Disputed
                        ? 'text-rose-400'
                        : selectedTask.state === TaskState.InProgress
                        ? 'text-amber-400 animate-pulse'
                        : 'text-cyanAccent'
                    }`}
                  >
                    {TaskState[selectedTask.state]}
                  </span>
                </div>
              </div>

              {/* Action Buttons */}
              <div className="space-y-2 pt-2">
                {selectedTask.state === TaskState.Created && (
                  <button
                    onClick={() => dispatchTask(selectedTask.taskId)}
                    className="w-full flex items-center justify-center space-x-2 py-2 rounded bg-cyanAccent/20 border border-cyanAccent/40 text-cyanAccent text-xs font-mono font-bold hover:bg-cyanAccent/30 transition-all glow-cyan"
                  >
                    <Navigation className="w-3.5 h-3.5" />
                    <span>Evaluate & Dispatch Agent</span>
                  </button>
                )}

                {/* Simulate Failure Button */}
                {(selectedTask.state === TaskState.Created ||
                  selectedTask.state === TaskState.InProgress) && (
                  <button
                    onClick={() => simulateFailure(selectedTask.taskId)}
                    className="w-full flex items-center justify-center space-x-1.5 py-1.5 rounded bg-rose-500/10 border border-rose-500/30 text-rose-400 text-xs font-mono hover:bg-rose-500/20 transition-all"
                  >
                    <AlertTriangle className="w-3.5 h-3.5" />
                    <span>Simulate Route Failure</span>
                  </button>
                )}
              </div>
            </div>
          ) : (
            <div className="text-center py-6 text-gray-500 font-mono text-xs">
              Select or create a task from the marketplace to track navigation.
            </div>
          )}
        </div>

        {/* Quick Fleet Health */}
        <div className="p-4 bg-surface border border-surfaceBorder rounded-lg space-y-3">
          <span className="font-mono text-xs font-semibold text-gray-300 uppercase block">
            Agent Status Overview
          </span>
          <div className="space-y-2 font-mono text-xs">
            {agents.map((a) => (
              <div key={a.id} className="p-2 rounded bg-surfaceLight border border-surfaceBorder flex items-center justify-between">
                <div>
                  <div className="text-white font-semibold flex items-center space-x-1">
                    <span className="w-2 h-2 rounded-full" style={{ backgroundColor: a.color }} />
                    <span>{a.id}</span>
                  </div>
                  <div className="text-[10px] text-gray-400">{a.status}</div>
                </div>
                <div className="text-right">
                  <div className="text-cyanAccent">{a.battery}%</div>
                  <div className="text-[10px] text-gray-500">{a.tasksCompleted} jobs</div>
                </div>
              </div>
            ))}
          </div>
        </div>
      </div>
    </div>
  );
};
