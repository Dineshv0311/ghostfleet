import React from 'react';
import { useFleet } from '../../context/FleetContext';
import {
  Cpu,
  Battery,
  ShieldCheck,
  Award,
  Zap,
  Activity,
  CheckCircle,
  XCircle,
} from 'lucide-react';

export const AgentProfiles: React.FC = () => {
  const { agents } = useFleet();

  return (
    <div className="space-y-6">
      <div className="p-4 bg-surface border border-surfaceBorder rounded-lg">
        <h2 className="text-base font-mono font-bold text-white flex items-center space-x-2">
          <span>Autonomous Robot Agent Fleet</span>
          <span className="text-xs px-2 py-0.5 rounded bg-surfaceLight text-cyanAccent border border-cyanAccent/30">
            {agents.length} Online
          </span>
        </h2>
        <p className="text-xs text-gray-400 font-mono mt-0.5">
          Inspecting autonomous agents, physical capabilities, telemetry, and off-chain reputation scores.
        </p>
      </div>

      <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
        {agents.map((agent) => (
          <div
            key={agent.id}
            className="p-5 rounded-xl bg-surface border border-surfaceBorder font-mono space-y-4 hover:border-cyanAccent/40 transition-all shadow-xl"
          >
            {/* Agent Header */}
            <div className="flex items-start justify-between border-b border-surfaceBorder pb-3">
              <div className="flex items-center space-x-3">
                <div
                  className="w-10 h-10 rounded-lg flex items-center justify-center border"
                  style={{
                    backgroundColor: `${agent.color}15`,
                    borderColor: `${agent.color}50`,
                  }}
                >
                  <Cpu className="w-5 h-5" style={{ color: agent.color }} />
                </div>
                <div>
                  <h3 className="font-bold text-white text-sm">{agent.name}</h3>
                  <div className="text-[10px] text-gray-400 uppercase tracking-wide">
                    {agent.type} • {agent.id}
                  </div>
                </div>
              </div>

              <span
                className={`px-2 py-0.5 rounded text-[10px] uppercase font-bold ${
                  agent.status === 'idle'
                    ? 'bg-emerald-500/20 text-emerald-400 border border-emerald-500/30'
                    : agent.status === 'moving'
                    ? 'bg-cyanAccent/20 text-cyanAccent border border-cyanAccent/30 animate-pulse'
                    : agent.status === 'recharging'
                    ? 'bg-purple-500/20 text-purple-400 border border-purple-500/30'
                    : 'bg-rose-500/20 text-rose-400 border border-rose-500/30'
                }`}
              >
                {agent.status}
              </span>
            </div>

            {/* Address */}
            <div className="p-2 rounded bg-background/50 border border-surfaceBorder/60 text-[11px] text-gray-400">
              <span className="text-gray-500 block text-[9px] uppercase">Ethereum Agent Address:</span>
              <span className="text-gray-300 select-all font-mono">{agent.address}</span>
            </div>

            {/* Telemetry Metrics */}
            <div className="grid grid-cols-2 gap-2 text-xs">
              <div className="p-2 rounded bg-surfaceLight border border-surfaceBorder">
                <div className="text-[10px] text-gray-400 flex items-center space-x-1">
                  <Battery className="w-3 h-3 text-cyanAccent" />
                  <span>Battery</span>
                </div>
                <div className="text-base font-bold text-white mt-0.5">{agent.battery}%</div>
              </div>

              <div className="p-2 rounded bg-surfaceLight border border-surfaceBorder">
                <div className="text-[10px] text-gray-400 flex items-center space-x-1">
                  <Zap className="w-3 h-3 text-amberAccent" />
                  <span>Speed / Payload</span>
                </div>
                <div className="text-sm font-bold text-white mt-0.5">
                  {agent.speed} km/h • {agent.capacityKg}kg
                </div>
              </div>
            </div>

            {/* Off-chain Reputation & Task Stats */}
            <div className="p-3 rounded bg-surfaceLight border border-surfaceBorder space-y-2">
              <div className="flex justify-between items-center text-xs">
                <span className="text-gray-400 flex items-center space-x-1">
                  <Award className="w-3.5 h-3.5 text-amberAccent" />
                  <span>Off-Chain Reputation:</span>
                </span>
                <span className="text-amberAccent font-bold">{agent.offChainReputation} / 100</span>
              </div>
              <div className="w-full bg-background rounded-full h-1.5 overflow-hidden">
                <div
                  className="bg-amberAccent h-full rounded-full"
                  style={{ width: `${agent.offChainReputation}%` }}
                />
              </div>
              <div className="text-[10px] text-gray-500 italic">
                *Reputation is an application-defined score aggregated from verified completion telemetry.
              </div>
            </div>

            {/* Capabilities */}
            <div>
              <span className="text-[10px] text-gray-400 uppercase tracking-wide block mb-1.5">
                Physical Capabilities:
              </span>
              <div className="flex flex-wrap gap-1.5">
                {agent.capabilities.map((cap) => (
                  <span
                    key={cap}
                    className="px-2 py-0.5 rounded bg-surfaceLight text-gray-300 text-[10px] border border-surfaceBorder"
                  >
                    {cap}
                  </span>
                ))}
              </div>
            </div>

            {/* Mission Log */}
            <div>
              <span className="text-[10px] text-gray-400 uppercase tracking-wide block mb-1.5">
                Telemetry Log:
              </span>
              <div className="space-y-1 max-h-24 overflow-y-auto text-[10px] text-gray-300">
                {agent.history.map((h, i) => (
                  <div key={i} className="p-1 rounded bg-background/40 border border-surfaceBorder/40">
                    • {h}
                  </div>
                ))}
              </div>
            </div>
          </div>
        ))}
      </div>
    </div>
  );
};
