import React from 'react';
import type { GeneratedStrategy, UserInput, HistoryItem } from '../types';

interface StrategyDashboardProps {
  strategy: GeneratedStrategy;
  setStrategy: (strategy: GeneratedStrategy) => void;
  userInput: UserInput;
  activeSection: string;
  setActiveSection: (section: string) => void;
  onRegenerate: (step: any, input: UserInput, strategy: any, refinement?: string) => Promise<any>;
  setHistory: (history: HistoryItem[]) => void;
  viewingHistoryItem: HistoryItem | null;
}

export const StrategyDashboard: React.FC<StrategyDashboardProps> = ({
  strategy,
  activeSection,
}) => {
  return (
    <div className="bg-card/50 backdrop-blur-sm border border-border p-6 sm:p-8 rounded-2xl shadow-lg w-full animate-fade-in">
      <h2 className="text-2xl font-bold text-foreground mb-4">Dashboard da Estratégia</h2>
      <p className="text-foreground/70">
        Seção ativa: {activeSection}
      </p>
      <div className="mt-6 space-y-4">
        <div className="p-4 bg-muted/50 rounded-lg">
          <h3 className="font-semibold mb-2">Estratégia Gerada</h3>
          <p className="text-sm text-foreground/70">
            Sua estratégia personalizada está sendo carregada...
          </p>
        </div>
      </div>
    </div>
  );
};