import React from 'react';
import { useFleet } from '../../context/FleetContext';
import {
  Cpu,
  Layers,
  Activity,
  Coins,
  ShieldCheck,
  AlertTriangle,
  Play,
  ArrowRight,
  TrendingUp,
} from 'lucide-react';
import { TaskState } from '../../types';

export const CommandDashboard: React.FC<{ onNavigate: (tab: string) => void }> = ({ onNavigate }) => {
  const { tasks, agents, feed, mode, runFullDemonstrationStory } = useFleet();

  const totalAgents = agents.length;
  const availableAgents = agents.filter((a) => a.status === 'idle').length;
  const activeTasks = tasks.filter(
    (t) => t.state === TaskState.Created || t.state === TaskState.Assigned || t.state === TaskState.InProgress
  ).length;
  const completedTasks = tasks.filter((t) => t.state === TaskState.Completed).length;
  const disputedTasks = tasks.filter((t) => t.state === TaskState.Disputed || t.state === TaskState.Refunded).length;

  const totalEscrowEth = tasks
    .filter((t) => t.state === TaskState.Created || t.state === TaskState.Assigned || t.state === TaskState.InProgress)
    .reduce((acc, t) => acc + parseFloat(t.reward || '0'), 0)
    .toFixed(2);

  const totalSettledEth = tasks
    .filter((t) => t.state === TaskState.Completed)
    .reduce((acc, t) => acc + parseFloat(t.reward || '0'), 0)
    .toFixed(2);

  return (
    <div className="space-y-6 font-mono">
      {/* Hero / Quick Action Banner */}
      <div className="p-6 rounded-xl bg-gradient-to-r from-surface via-surfaceLight to-surface border border-surfaceBorder flex flex-col md:flex-row md:items-center justify-between gap-4 shadow-xl">
        <div className="space-y-1">
          <div className="flex items-center space-x-2">
            <span className="px-2 py-0.5 rounded bg-cyanAccent/20 text-cyanAccent text-[10px] font-bold border border-cyanAccent/30 uppercase">
              {mode} MODE ACTIVE
            </span>
            <span className="text-gray-400 text-xs">Autonomous Fleet Network</span>
          </div>
          <h1 className="text-xl sm:text-2xl font-bold text-white tracking-wide">
            GHOSTFLEET COMMAND CENTER
          </h1>
          <p className="text-xs text-gray-400 max-w-2xl leading-relaxed">
            Machines that work. Contracts that settle. Trust that can be verified.
            Autonomous AI robotics coordinating deliveries via trust-minimized Ethereum escrow.
          </p>
        </div>

        <div className="flex flex-wrap gap-2.5">
          <button
            onClick={runFullDemonstrationStory}
            className="flex items-center space-x-2 px-4 py-2.5 rounded-lg bg-amberAccent/20 border border-amberAccent/50 text-amberAccent text-xs font-bold hover:bg-amberAccent/30 glow-amber transition-all"
          >
            <Play className="w-4 h-4" />
            <span>Launch 1-Click Demo</span>
          </button>
          <button
            onClick={() => onNavigate('simulation')}
            className="flex items-center space-x-2 px-4 py-2.5 rounded-lg bg-cyanAccent/20 border border-cyanAccent/50 text-cyanAccent text-xs font-bold hover:bg-cyanAccent/30 glow-cyan transition-all"
          >
            <span>Inspect City Grid</span>
            <ArrowRight className="w-4 h-4" />
          </button>
        </div>
      </div>

      {/* Primary Telemetry Metrics */}
      <div className="grid grid-cols-2 md:grid-cols-4 lg:grid-cols-6 gap-3">
        {[
          { label: 'Total Fleet', value: totalAgents, sub: `${availableAgents} Ready`, icon: Cpu, color: 'text-cyanAccent' },
          { label: 'Active Missions', value: activeTasks, sub: 'In Escrow', icon: Activity, color: 'text-amberAccent' },
          { label: 'Locked Escrow', value: `${totalEscrowEth} ETH`, sub: 'Smart Contract', icon: Coins, color: 'text-white' },
          { label: 'Settled Value', value: `${totalSettledEth} ETH`, sub: 'Released Payout', icon: TrendingUp, color: 'text-emerald-400' },
          { label: 'Completed Jobs', value: completedTasks, sub: 'Verified', icon: ShieldCheck, color: 'text-emerald-400' },
          { label: 'Faults / Disputes', value: disputedTasks, sub: 'Refund Eligible', icon: AlertTriangle, color: 'text-rose-400' },
        ].map((metric, i) => {
          const Icon = metric.icon;
          return (
            <div key={i} className="p-3.5 rounded-lg bg-surface border border-surfaceBorder space-y-1">
              <div className="flex items-center justify-between text-gray-400">
                <span className="text-[10px] uppercase font-semibold">{metric.label}</span>
                <Icon className={`w-3.5 h-3.5 ${metric.color}`} />
              </div>
              <div className={`text-lg font-bold ${metric.color}`}>{metric.value}</div>
              <div className="text-[10px] text-gray-500">{metric.sub}</div>
            </div>
          );
        })}
      </div>

      {/* Main Grid: Live Activity Feed & Active Operations */}
      <div className="grid grid-cols-1 lg:grid-cols-3 gap-6">
        {/* Real-Time Telemetry Feed */}
        <div className="lg:col-span-2 p-5 rounded-xl bg-surface border border-surfaceBorder space-y-4">
          <div className="flex items-center justify-between border-b border-surfaceBorder pb-3">
            <div className="flex items-center space-x-2">
              <span className="w-2 h-2 rounded-full bg-cyanAccent animate-ping" />
              <h3 className="text-sm font-bold text-white uppercase tracking-wider">
                Autonomous Telemetry & Contract Feed
              </h3>
            </div>
            <span className="text-[10px] px-2 py-0.5 rounded bg-surfaceLight text-gray-400">
              LIVE BROADCAST
            </span>
          </div>

          <div className="space-y-2 max-h-[360px] overflow-y-auto pr-1">
            {feed.length === 0 ? (
              <div className="text-center py-10 text-gray-500 text-xs">
                Awaiting telemetry transmissions...
              </div>
            ) : (
              feed.map((item) => (
                <div
                  key={item.id}
                  className="p-2.5 rounded bg-surfaceLight/70 border border-surfaceBorder/60 flex items-start space-x-3 text-xs"
                >
                  <span
                    className={`px-1.5 py-0.5 rounded text-[9px] uppercase font-bold shrink-0 mt-0.5 ${
                      item.source === 'ESCROW'
                        ? 'bg-cyanAccent/20 text-cyanAccent border border-cyanAccent/30'
                        : item.source === 'VERIFIER'
                        ? 'bg-emerald-500/20 text-emerald-400 border border-emerald-500/30'
                        : item.source === 'AGENT'
                        ? 'bg-amberAccent/20 text-amberAccent border border-amberAccent/30'
                        : 'bg-purple-500/20 text-purple-400 border border-purple-500/30'
                    }`}
                  >
                    {item.source}
                  </span>

                  <div className="flex-1 space-y-0.5">
                    <div className="text-gray-200 text-[11px] leading-snug">{item.message}</div>
                    <div className="text-[9px] text-gray-500 flex items-center space-x-2">
                      <span>{new Date(item.timestamp).toLocaleTimeString()}</span>
                      {item.taskId && <span>• Task: {item.taskId.slice(0, 10)}...</span>}
                      {item.agentId && <span>• Agent: {item.agentId}</span>}
                    </div>
                  </div>
                </div>
              ))
            )}
          </div>
        </div>

        {/* Quick Fleet Quick Look */}
        <div className="p-5 rounded-xl bg-surface border border-surfaceBorder space-y-4">
          <div className="flex items-center justify-between border-b border-surfaceBorder pb-3">
            <h3 className="text-sm font-bold text-white uppercase tracking-wider">
              Fleet Status
            </h3>
            <button
              onClick={() => onNavigate('agents')}
              className="text-[10px] text-cyanAccent hover:underline"
            >
              View All →
            </button>
          </div>

          <div className="space-y-3">
            {agents.map((agent) => (
              <div
                key={agent.id}
                className="p-3 rounded-lg bg-surfaceLight border border-surfaceBorder space-y-2 text-xs"
              >
                <div className="flex items-center justify-between">
                  <span className="font-bold text-white flex items-center space-x-1.5">
                    <span className="w-2.5 h-2.5 rounded-full" style={{ backgroundColor: agent.color }} />
                    <span>{agent.name}</span>
                  </span>
                  <span className="text-[10px] text-gray-400 uppercase font-bold">{agent.status}</span>
                </div>
                <div className="flex justify-between text-[11px] text-gray-400">
                  <span>Battery: {agent.battery}%</span>
                  <span>Reputation: {agent.offChainReputation}/100</span>
                </div>
                <div className="w-full bg-background rounded-full h-1">
                  <div
                    className="h-full rounded-full"
                    style={{ width: `${agent.battery}%`, backgroundColor: agent.color }}
                  />
                </div>
              </div>
            ))}
          </div>
        </div>
      </div>
    </div>
  );
};
