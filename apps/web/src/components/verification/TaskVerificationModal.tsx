import React from 'react';
import { useFleet } from '../../context/FleetContext';
import {
  ShieldCheck,
  Key,
  FileCheck,
  AlertOctagon,
  ExternalLink,
  Lock,
  Layers,
  CheckCircle2,
} from 'lucide-react';
import { TaskState } from '../../types';

export const TaskVerificationModal: React.FC = () => {
  const { selectedTask, contractAddress } = useFleet();

  if (!selectedTask) return null;

  return (
    <div className="p-6 bg-surface border border-surfaceBorder rounded-xl font-mono space-y-6">
      <div className="flex items-center justify-between border-b border-surfaceBorder pb-3">
        <div className="flex items-center space-x-2">
          <ShieldCheck className="w-5 h-5 text-cyanAccent" />
          <h2 className="text-base font-bold text-white">
            Task Cryptographic Verification & Settlement Engine
          </h2>
        </div>
        <span
          className={`px-2.5 py-0.5 rounded text-xs font-bold uppercase ${
            selectedTask.state === TaskState.Completed
              ? 'bg-emerald-500/20 text-emerald-400 border border-emerald-500/40'
              : 'bg-cyanAccent/20 text-cyanAccent border border-cyanAccent/40'
          }`}
        >
          {TaskState[selectedTask.state]}
        </span>
      </div>

      {/* Trust & Architecture Explainer */}
      <div className="p-4 rounded-lg bg-surfaceLight border border-surfaceBorder text-xs space-y-2">
        <div className="text-cyanAccent font-bold flex items-center space-x-1.5">
          <Lock className="w-3.5 h-3.5" />
          <span>Why is this trusted? (Blockchain vs Off-Chain Guarantees)</span>
        </div>
        <p className="text-gray-300 leading-relaxed text-[11px]">
          Ethereum smart contracts enforce payment custody, valid signatures, replay prevention,
          and timeout rules. However, smart contracts cannot independently inspect physical robot LiDAR or GPS.
          GHOSTFLEET bridges this with a dedicated <strong className="text-white">Authorized Verifier Agent</strong> that
          validates off-chain robot telemetry and produces an <strong className="text-white">EIP-712 domain-separated cryptographic attestation</strong> to authorize escrow release.
        </p>
      </div>

      <div className="grid grid-cols-1 md:grid-cols-2 gap-4 text-xs">
        {/* Task Identity */}
        <div className="p-3.5 rounded bg-background/60 border border-surfaceBorder space-y-2">
          <span className="text-[10px] text-gray-500 uppercase tracking-wider block font-bold">
            Task State & Identity
          </span>
          <div>
            <span className="text-gray-400 text-[10px]">Title:</span>
            <div className="text-white font-semibold">{selectedTask.title}</div>
          </div>
          <div>
            <span className="text-gray-400 text-[10px]">Task ID (bytes32):</span>
            <div className="text-gray-300 break-all text-[10px] select-all font-mono">
              {selectedTask.taskId}
            </div>
          </div>
          <div>
            <span className="text-gray-400 text-[10px]">Escrow Contract:</span>
            <div className="text-cyanAccent break-all text-[10px] select-all font-mono">
              {contractAddress}
            </div>
          </div>
          <div className="flex justify-between text-[11px] pt-1">
            <span className="text-gray-400">Escrow Value:</span>
            <span className="text-white font-bold">{selectedTask.reward} ETH</span>
          </div>
        </div>

        {/* Verification Record */}
        <div className="p-3.5 rounded bg-background/60 border border-surfaceBorder space-y-2">
          <span className="text-[10px] text-gray-500 uppercase tracking-wider block font-bold">
            EIP-712 Attestation Record
          </span>

          {selectedTask.evidenceHash ? (
            <div className="space-y-2 text-[11px]">
              <div>
                <span className="text-gray-400 text-[10px]">Evidence Hash:</span>
                <div className="text-emerald-400 break-all text-[10px] select-all">
                  {selectedTask.evidenceHash}
                </div>
              </div>

              <div>
                <span className="text-gray-400 text-[10px]">Attestation Nonce:</span>
                <div className="text-gray-200 text-[10px]">{selectedTask.attestationNonce} (Replay Guarded)</div>
              </div>

              <div>
                <span className="text-gray-400 text-[10px]">Verifier Signature:</span>
                <div className="text-gray-300 break-all text-[9px] select-all">
                  {selectedTask.attestationSignature}
                </div>
              </div>

              <div>
                <span className="text-gray-400 text-[10px]">Settlement Tx:</span>
                <div className="text-cyanAccent break-all text-[10px] select-all">
                  {selectedTask.settlementTxHash}
                </div>
              </div>
            </div>
          ) : (
            <div className="py-6 text-center text-gray-500 text-xs">
              Attestation pending. Once the robot completes its waypoint route, telemetry will be verified.
            </div>
          )}
        </div>
      </div>

      {/* Canonical Telemetry JSON (if available) */}
      {selectedTask.canonicalEvidence && (
        <div className="space-y-1.5">
          <span className="text-[10px] text-gray-400 uppercase tracking-wider block">
            Canonical Telemetry Payload:
          </span>
          <pre className="p-3 rounded bg-black/60 border border-surfaceBorder text-[10px] text-emerald-300 overflow-x-auto">
            {selectedTask.canonicalEvidence}
          </pre>
        </div>
      )}
    </div>
  );
};
