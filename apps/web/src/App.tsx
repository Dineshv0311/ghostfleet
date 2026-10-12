import React, { useState } from 'react';
import { FleetProvider } from './context/FleetContext';
import { Navbar } from './components/layout/Navbar';
import { CommandDashboard } from './components/dashboard/CommandDashboard';
import { CitySimulation } from './components/simulation/CitySimulation';
import { TaskMarketplace } from './components/marketplace/TaskMarketplace';
import { AgentProfiles } from './components/agents/AgentProfiles';
import { TransactionExplorer } from './components/explorer/TransactionExplorer';
import { TaskVerificationModal } from './components/verification/TaskVerificationModal';

export const AppContent: React.FC = () => {
  const [currentTab, setCurrentTab] = useState('dashboard');

  return (
    <div className="min-h-screen bg-background text-gray-100 flex flex-col font-sans selection:bg-cyanAccent selection:text-background">
      <Navbar currentTab={currentTab} setCurrentTab={setCurrentTab} />

      <main className="flex-1 max-w-7xl w-full mx-auto px-4 sm:px-6 lg:px-8 py-6 space-y-6">
        {currentTab === 'dashboard' && <CommandDashboard onNavigate={setCurrentTab} />}
        {currentTab === 'simulation' && <CitySimulation />}
        {currentTab === 'marketplace' && <TaskMarketplace />}
        {currentTab === 'agents' && <AgentProfiles />}
        {currentTab === 'explorer' && <TransactionExplorer />}

        {/* Global Verification Details View (when a task is selected) */}
        <TaskVerificationModal />
      </main>

      <footer className="border-t border-surfaceBorder bg-surface/50 py-4 text-center text-xs font-mono text-gray-500">
        GHOSTFLEET Autonomous Machine Economy • Ethereum Smart Contracts + Robotics Attestation
      </footer>
    </div>
  );
};

export default function App() {
  return (
    <FleetProvider>
      <AppContent />
    </FleetProvider>
  );
}
