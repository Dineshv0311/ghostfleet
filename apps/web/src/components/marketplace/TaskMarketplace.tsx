import React, { useState } from 'react';
import { useFleet } from '../../context/FleetContext';
import { CITY_LOCATIONS } from '../../services/mockData';
import {
  Plus,
  Clock,
  Coins,
  MapPin,
  CheckCircle,
  AlertCircle,
  ShieldCheck,
  Send,
  ExternalLink,
  RotateCcw,
} from 'lucide-react';
import { TaskState, TaskRecord } from '../../types';

export const TaskMarketplace: React.FC = () => {
  const {
    tasks,
    createTask,
    dispatchTask,
    selectedTask,
    setSelectedTask,
    simulateFailure,
    claimRefund,
    mode,
    walletAddress,
  } = useFleet();

  const [isModalOpen, setIsModalOpen] = useState(false);
  const [title, setTitle] = useState('');
  const [reward, setReward] = useState('0.05');
  const [originId, setOriginId] = useState('LOC-HUB');
  const [destId, setDestId] = useState('LOC-WARE');
  const [durationMinutes, setDurationMinutes] = useState(60);
  const [isSubmitting, setIsSubmitting] = useState(false);
  const [errorMessage, setErrorMessage] = useState('');

  const handleCreateTask = async (e: React.FormEvent) => {
    e.preventDefault();
    setErrorMessage('');

    if (!title.trim()) {
      setErrorMessage('Task title is required.');
      return;
    }

    const numReward = parseFloat(reward);
    if (isNaN(numReward) || numReward <= 0) {
      setErrorMessage('Reward must be greater than 0 ETH.');
      return;
    }

    if (originId === destId) {
      setErrorMessage('Origin and destination cannot be identical.');
      return;
    }

    try {
      setIsSubmitting(true);
      await createTask(title, reward, originId, destId, durationMinutes);
      setIsModalOpen(false);
      setTitle('');
    } catch (err: any) {
      setErrorMessage(err.message || 'Failed to initialize task.');
    } finally {
      setIsSubmitting(false);
    }
  };

  return (
    <div className="space-y-6">
      {/* Header and Create Button */}
      <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4 p-4 bg-surface border border-surfaceBorder rounded-lg">
        <div>
          <h2 className="text-base font-mono font-bold text-white flex items-center space-x-2">
            <span>Machine Task Marketplace</span>
            <span className="text-xs px-2 py-0.5 rounded bg-surfaceLight text-cyanAccent border border-cyanAccent/30">
              {tasks.length} Total
            </span>
          </h2>
          <p className="text-xs text-gray-400 font-mono mt-0.5">
            Decentralized task ordering, escrow locking, and agent dispatch.
          </p>
        </div>

        <button
          onClick={() => setIsModalOpen(true)}
          className="flex items-center space-x-2 px-4 py-2 rounded-md bg-cyanAccent/20 border border-cyanAccent/50 text-cyanAccent text-xs font-mono font-bold hover:bg-cyanAccent/30 transition-all glow-cyan self-start sm:self-auto"
        >
          <Plus className="w-4 h-4" />
          <span>Post Machine Task</span>
        </button>
      </div>

      {/* Task List Table / Grid */}
      <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-4">
        {tasks.map((task) => {
          const isSelected = selectedTask?.taskId === task.taskId;
          return (
            <div
              key={task.taskId}
              onClick={() => setSelectedTask(task)}
              className={`p-4 rounded-lg bg-surface border transition-all cursor-pointer font-mono text-xs flex flex-col justify-between ${
                isSelected
                  ? 'border-cyanAccent shadow-lg shadow-cyanAccent/10 bg-surfaceLight/60'
                  : 'border-surfaceBorder hover:border-gray-600'
              }`}
            >
              <div className="space-y-3">
                <div className="flex items-start justify-between">
                  <div className="space-y-1">
                    <span className="text-[10px] text-gray-500 uppercase tracking-wider block">
                      {task.isSimulatedOnly ? '[SIMULATION]' : '[ON-CHAIN ESCROW]'}
                    </span>
                    <h3 className="font-bold text-white text-sm">{task.title}</h3>
                  </div>

                  <span
                    className={`px-2 py-0.5 rounded text-[10px] uppercase font-bold ${
                      task.state === TaskState.Completed
                        ? 'bg-emerald-500/20 text-emerald-400 border border-emerald-500/30'
                        : task.state === TaskState.Disputed
                        ? 'bg-rose-500/20 text-rose-400 border border-rose-500/30'
                        : task.state === TaskState.InProgress
                        ? 'bg-amber-500/20 text-amber-400 border border-amber-500/30 animate-pulse'
                        : task.state === TaskState.Refunded
                        ? 'bg-purple-500/20 text-purple-400 border border-purple-500/30'
                        : 'bg-cyanAccent/20 text-cyanAccent border border-cyanAccent/30'
                    }`}
                  >
                    {TaskState[task.state]}
                  </span>
                </div>

                <div className="space-y-1.5 p-2.5 rounded bg-background/50 border border-surfaceBorder/60 text-[11px]">
                  <div className="flex justify-between">
                    <span className="text-gray-400">Escrow Reward:</span>
                    <span className="text-cyanAccent font-bold">{task.reward} ETH</span>
                  </div>
                  <div className="flex justify-between">
                    <span className="text-gray-400">Route:</span>
                    <span className="text-gray-300">
                      {task.origin.split(' ')[0]} → {task.destination.split(' ')[0]}
                    </span>
                  </div>
                  <div className="flex justify-between">
                    <span className="text-gray-400">Assigned Agent:</span>
                    <span className="text-gray-300">
                      {task.assignedAgentId || (task.assignedAgent ? `${task.assignedAgent.slice(0, 6)}...` : 'None')}
                    </span>
                  </div>
                </div>

                {task.evidenceHash && (
                  <div className="p-2 rounded bg-emerald-950/20 border border-emerald-500/30 text-[10px] text-emerald-300">
                    <span className="font-bold">EIP-712 Verified: </span>
                    {task.evidenceHash.slice(0, 16)}...
                  </div>
                )}

                {task.failureReason && (
                  <div className="p-2 rounded bg-rose-950/20 border border-rose-500/30 text-[10px] text-rose-300">
                    <span className="font-bold">Fault: </span>
                    {task.failureReason}
                  </div>
                )}
              </div>

              {/* Action Buttons */}
              <div className="pt-3 border-t border-surfaceBorder/60 flex items-center justify-between gap-2">
                {task.state === TaskState.Created && (
                  <button
                    onClick={(e) => {
                      e.stopPropagation();
                      dispatchTask(task.taskId);
                    }}
                    className="w-full py-1.5 rounded bg-cyanAccent/20 hover:bg-cyanAccent/30 text-cyanAccent text-[11px] font-bold border border-cyanAccent/40 transition-all"
                  >
                    Dispatch Agent
                  </button>
                )}

                {task.state === TaskState.Disputed && (
                  <button
                    onClick={(e) => {
                      e.stopPropagation();
                      claimRefund(task.taskId);
                    }}
                    className="w-full py-1.5 rounded bg-rose-500/20 hover:bg-rose-500/30 text-rose-300 text-[11px] font-bold border border-rose-500/40 transition-all"
                  >
                    Claim Escrow Refund
                  </button>
                )}

                {task.state === TaskState.Completed && (
                  <div className="w-full text-center py-1 text-emerald-400 text-[11px] font-bold">
                    ✓ Settled & Paid
                  </div>
                )}
              </div>
            </div>
          );
        })}
      </div>

      {/* Create Task Modal */}
      {isModalOpen && (
        <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-black/70 backdrop-blur-sm">
          <div className="w-full max-w-md bg-surface border border-surfaceBorder rounded-xl p-6 font-mono space-y-4 shadow-2xl">
            <div className="flex justify-between items-center border-b border-surfaceBorder pb-3">
              <h3 className="text-sm font-bold text-white flex items-center space-x-2">
                <Plus className="w-4 h-4 text-cyanAccent" />
                <span>Create Machine Escrow Task</span>
              </h3>
              <button
                onClick={() => setIsModalOpen(false)}
                className="text-gray-400 hover:text-white text-xs"
              >
                ✕
              </button>
            </div>

            {errorMessage && (
              <div className="p-2.5 rounded bg-rose-500/10 border border-rose-500/40 text-rose-400 text-xs">
                {errorMessage}
              </div>
            )}

            <form onSubmit={handleCreateTask} className="space-y-4 text-xs">
              <div>
                <label className="block text-gray-400 mb-1">Task Title / Mission Objective</label>
                <input
                  type="text"
                  value={title}
                  onChange={(e) => setTitle(e.target.value)}
                  placeholder="e.g. Critical Medical Serum Dispatch"
                  className="w-full p-2.5 rounded bg-surfaceLight border border-surfaceBorder text-white focus:outline-none focus:border-cyanAccent"
                />
              </div>

              <div>
                <label className="block text-gray-400 mb-1">Escrow Reward (ETH)</label>
                <input
                  type="number"
                  step="0.01"
                  min="0.001"
                  value={reward}
                  onChange={(e) => setReward(e.target.value)}
                  className="w-full p-2.5 rounded bg-surfaceLight border border-surfaceBorder text-white focus:outline-none focus:border-cyanAccent"
                />
              </div>

              <div className="grid grid-cols-2 gap-3">
                <div>
                  <label className="block text-gray-400 mb-1">Origin Node</label>
                  <select
                    value={originId}
                    onChange={(e) => setOriginId(e.target.value)}
                    className="w-full p-2.5 rounded bg-surfaceLight border border-surfaceBorder text-white focus:outline-none focus:border-cyanAccent text-[11px]"
                  >
                    {CITY_LOCATIONS.map((loc) => (
                      <option key={loc.id} value={loc.id}>
                        {loc.name}
                      </option>
                    ))}
                  </select>
                </div>

                <div>
                  <label className="block text-gray-400 mb-1">Destination Node</label>
                  <select
                    value={destId}
                    onChange={(e) => setDestId(e.target.value)}
                    className="w-full p-2.5 rounded bg-surfaceLight border border-surfaceBorder text-white focus:outline-none focus:border-cyanAccent text-[11px]"
                  >
                    {CITY_LOCATIONS.map((loc) => (
                      <option key={loc.id} value={loc.id}>
                        {loc.name}
                      </option>
                    ))}
                  </select>
                </div>
              </div>

              <div>
                <label className="block text-gray-400 mb-1">Escrow Expiry Deadline (Minutes)</label>
                <input
                  type="number"
                  value={durationMinutes}
                  onChange={(e) => setDurationMinutes(parseInt(e.target.value) || 60)}
                  className="w-full p-2.5 rounded bg-surfaceLight border border-surfaceBorder text-white focus:outline-none focus:border-cyanAccent"
                />
              </div>

              <div className="p-2.5 rounded bg-background border border-surfaceBorder text-[11px] text-gray-400">
                Mode: <span className="text-cyanAccent font-bold">{mode}</span>.
                {mode === 'BLOCKCHAIN'
                  ? ' This will prompt MetaMask to lock ETH in MachineEscrow.sol.'
                  : ' This will lock funds in the local simulated escrow sandbox.'}
              </div>

              <div className="flex justify-end space-x-2 pt-2">
                <button
                  type="button"
                  onClick={() => setIsModalOpen(false)}
                  className="px-3 py-2 rounded bg-surfaceLight border border-surfaceBorder text-gray-300 hover:text-white"
                >
                  Cancel
                </button>
                <button
                  type="submit"
                  disabled={isSubmitting}
                  className="px-4 py-2 rounded bg-cyanAccent/20 border border-cyanAccent/60 text-cyanAccent font-bold hover:bg-cyanAccent/30 glow-cyan transition-all"
                >
                  {isSubmitting ? 'Locking Escrow...' : 'Deploy & Lock Funds'}
                </button>
              </div>
            </form>
          </div>
        </div>
      )}
    </div>
  );
};
