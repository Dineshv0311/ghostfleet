import React from 'react';
import { useFleet } from '../../context/FleetContext';
import {
  ExternalLink,
  ShieldCheck,
  Coins,
  Cpu,
  Layers,
  Clock,
  CheckCircle2,
} from 'lucide-react';

export const TransactionExplorer: React.FC = () => {
  const { contractEvents, contractAddress, mode } = useFleet();

  return (
    <div className="space-y-6 font-mono">
      <div className="p-4 bg-surface border border-surfaceBorder rounded-lg flex flex-col sm:flex-row sm:items-center justify-between gap-3">
        <div>
          <h2 className="text-base font-bold text-white flex items-center space-x-2">
            <span>Machine Settlement Ledger Explorer</span>
            <span className="text-xs px-2 py-0.5 rounded bg-surfaceLight text-cyanAccent border border-cyanAccent/30">
              {contractEvents.length} Events
            </span>
          </h2>
          <p className="text-xs text-gray-400 mt-0.5">
            Real-time smart contract events, escrow state changes, and transaction hashes.
          </p>
        </div>

        <div className="text-right text-xs">
          <span className="text-gray-500 block text-[10px]">CONTRACT ADDRESS:</span>
          <span className="text-cyanAccent select-all text-[11px]">{contractAddress}</span>
        </div>
      </div>

      <div className="space-y-3">
        {contractEvents.length === 0 ? (
          <div className="p-12 text-center rounded-xl bg-surface border border-surfaceBorder text-gray-500 text-xs">
            No on-chain or simulated contract events recorded yet. Post or complete a task to populate the ledger.
          </div>
        ) : (
          contractEvents.map((evt) => (
            <div
              key={evt.id}
              className="p-4 rounded-lg bg-surface border border-surfaceBorder hover:border-gray-600 transition-all text-xs space-y-2"
            >
              <div className="flex flex-wrap items-center justify-between gap-2 border-b border-surfaceBorder/60 pb-2">
                <div className="flex items-center space-x-2">
                  <span
                    className={`px-2 py-0.5 rounded text-[10px] font-bold ${
                      evt.eventName === 'TaskCompleted'
                        ? 'bg-emerald-500/20 text-emerald-400 border border-emerald-500/30'
                        : evt.eventName === 'TaskCreated'
                        ? 'bg-cyanAccent/20 text-cyanAccent border border-cyanAccent/30'
                        : evt.eventName === 'TaskRefunded'
                        ? 'bg-purple-500/20 text-purple-400 border border-purple-500/30'
                        : 'bg-amberAccent/20 text-amberAccent border border-amberAccent/30'
                    }`}
                  >
                    {evt.eventName}
                  </span>
                  <span className="text-white font-semibold">{evt.summary}</span>
                </div>

                <div className="flex items-center space-x-2 text-[11px] text-gray-400">
                  <Clock className="w-3 h-3 text-gray-500" />
                  <span>{new Date(evt.timestamp).toLocaleTimeString()}</span>
                  <span className="text-gray-600">•</span>
                  <span className="text-gray-500">{evt.isLocal ? 'LOCAL_LEDGER' : 'SEPOLIA'}</span>
                </div>
              </div>

              <div className="grid grid-cols-1 md:grid-cols-2 gap-2 text-[11px]">
                <div>
                  <span className="text-gray-500">Transaction Hash: </span>
                  <span className="text-cyanAccent break-all select-all">{evt.txHash}</span>
                </div>
                <div>
                  <span className="text-gray-500">Task Reference: </span>
                  <span className="text-gray-300 break-all select-all">{evt.taskId.slice(0, 24)}...</span>
                </div>
              </div>

              {evt.params && Object.keys(evt.params).length > 0 && (
                <div className="p-2 rounded bg-background/50 border border-surfaceBorder/40 text-[10px] text-gray-400">
                  <span className="text-gray-500 block mb-0.5">Parameters:</span>
                  <div className="flex flex-wrap gap-x-4 gap-y-1">
                    {Object.entries(evt.params).map(([k, v]) => (
                      <div key={k}>
                        <span className="text-gray-400">{k}:</span>{' '}
                        <span className="text-gray-200">{String(v)}</span>
                      </div>
                    ))}
                  </div>
                </div>
              )}
            </div>
          ))
        )}
      </div>
    </div>
  );
};
