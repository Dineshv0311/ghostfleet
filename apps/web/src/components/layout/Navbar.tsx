import React from 'react';
import { useFleet } from '../../context/FleetContext';
import {
  ShieldAlert,
  Wallet,
  Cpu,
  Layers,
  Activity,
  PlayCircle,
  ExternalLink,
  RotateCcw,
} from 'lucide-react';

interface NavbarProps {
  currentTab: string;
  setCurrentTab: (tab: string) => void;
}

export const Navbar: React.FC<NavbarProps> = ({ currentTab, setCurrentTab }) => {
  const {
    mode,
    setMode,
    walletAddress,
    chainId,
    isConnectingWallet,
    connectWallet,
    disconnectWallet,
    runFullDemonstrationStory,
    contractAddress,
  } = useFleet();

  return (
    <header className="border-b border-surfaceBorder bg-surface/80 backdrop-blur-md sticky top-0 z-50">
      <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 h-16 flex items-center justify-between">
        {/* Brand */}
        <div className="flex items-center space-x-3">
          <div className="w-9 h-9 rounded bg-cyanAccent/10 border border-cyanAccent flex items-center justify-center glow-cyan">
            <Cpu className="w-5 h-5 text-cyanAccent" />
          </div>
          <div>
            <div className="flex items-center space-x-2">
              <span className="font-mono font-black text-lg tracking-wider text-white">GHOSTFLEET</span>
              <span className="text-[10px] uppercase font-mono px-1.5 py-0.5 rounded bg-surfaceBorder text-cyanAccent border border-cyanAccent/30">
                v1.0-RC
              </span>
            </div>
            <p className="text-[11px] text-gray-400 font-mono hidden sm:block">
              Autonomous Machine Economy & Escrow Settlement
            </p>
          </div>
        </div>

        {/* Navigation Tabs */}
        <nav className="hidden md:flex space-x-1">
          {[
            { id: 'dashboard', label: 'Command Center', icon: Activity },
            { id: 'simulation', label: 'City Simulation', icon: Layers },
            { id: 'marketplace', label: 'Task Marketplace', icon: Cpu },
            { id: 'agents', label: 'Agent Fleet', icon: ShieldAlert },
            { id: 'explorer', label: 'Ledger Explorer', icon: ExternalLink },
          ].map((tab) => {
            const Icon = tab.icon;
            const active = currentTab === tab.id;
            return (
              <button
                key={tab.id}
                onClick={() => setCurrentTab(tab.id)}
                className={`flex items-center space-x-2 px-3.5 py-1.5 rounded-md text-xs font-mono transition-all ${
                  active
                    ? 'bg-cyanAccent/15 text-cyanAccent border border-cyanAccent/40 shadow-sm'
                    : 'text-gray-400 hover:text-gray-200 hover:bg-surfaceLight'
                }`}
              >
                <Icon className="w-3.5 h-3.5" />
                <span>{tab.label}</span>
              </button>
            );
          })}
        </nav>

        {/* Mode switcher, Demo story trigger, and Wallet button */}
        <div className="flex items-center space-x-3">
          {/* 1-Click Demo Story */}
          <button
            onClick={runFullDemonstrationStory}
            title="Runs full delivery story: task creation, scoring, travel, verification, and payment release"
            className="hidden lg:flex items-center space-x-1.5 px-3 py-1.5 rounded bg-amberAccent/15 border border-amberAccent/40 text-amberAccent text-xs font-mono hover:bg-amberAccent/25 transition-all glow-amber"
          >
            <PlayCircle className="w-3.5 h-3.5" />
            <span>Run 1-Click Story</span>
          </button>

          {/* Mode Pill Indicator */}
          <div className="flex items-center bg-surfaceLight border border-surfaceBorder rounded p-0.5 text-[11px] font-mono">
            <button
              onClick={() => setMode('SIMULATION')}
              className={`px-2 py-0.5 rounded transition-all ${
                mode === 'SIMULATION'
                  ? 'bg-amberAccent/20 text-amberAccent font-bold'
                  : 'text-gray-400 hover:text-gray-200'
              }`}
            >
              SIMULATION
            </button>
            <button
              onClick={() => {
                if (!walletAddress) connectWallet();
                else setMode('BLOCKCHAIN');
              }}
              className={`px-2 py-0.5 rounded transition-all ${
                mode === 'BLOCKCHAIN'
                  ? 'bg-cyanAccent/20 text-cyanAccent font-bold'
                  : 'text-gray-400 hover:text-gray-200'
              }`}
            >
              ON-CHAIN
            </button>
          </div>

          {/* Wallet Connection */}
          {walletAddress ? (
            <div className="flex items-center space-x-2 bg-surfaceLight border border-surfaceBorder px-2.5 py-1 rounded text-xs font-mono">
              <span className="w-2 h-2 rounded-full bg-emerald-400 animate-pulse" />
              <span className="text-gray-300">
                {walletAddress.slice(0, 6)}...{walletAddress.slice(-4)}
              </span>
              <button
                onClick={disconnectWallet}
                className="text-[10px] text-gray-500 hover:text-red-400 ml-1"
                title="Disconnect"
              >
                ✕
              </button>
            </div>
          ) : (
            <button
              onClick={connectWallet}
              disabled={isConnectingWallet}
              className="flex items-center space-x-1.5 px-3 py-1.5 rounded bg-cyanAccent/20 border border-cyanAccent/50 text-cyanAccent text-xs font-mono hover:bg-cyanAccent/30 transition-all"
            >
              <Wallet className="w-3.5 h-3.5" />
              <span>{isConnectingWallet ? 'Connecting...' : 'Connect MetaMask'}</span>
            </button>
          )}
        </div>
      </div>
    </header>
  );
};
