import React from 'react';
import type { GeneratedStrategy, UserInput, HistoryItem, StoriesStrategyItem, ContentTableData, CalendarDay, ActionPlanItem } from '../types';
import { IdealCustomerProfileDisplay } from '@/components/strategy/IdealCustomerProfileDisplay';
import { MonetizationIdeasDisplay } from '@/components/strategy/MonetizationIdeasDisplay';
import { InstagramBioDisplay } from '@/components/strategy/InstagramBioDisplay';
import { StoriesStrategyDisplay } from '@/components/strategy/StoriesStrategyDisplay';
import { ContentTableDisplay } from '@/components/strategy/ContentTableDisplay';
import { EditorialCalendarDisplay } from '@/components/strategy/EditorialCalendarDisplay';
import { ActionPlanDisplay } from '@/components/strategy/ActionPlanDisplay';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Sparkles } from 'lucide-react';
import { generationTitles } from '@/pages/Index'; // Importar generationTitles

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
  viewingHistoryItem,
}) => {
  const contentToDisplay = viewingHistoryItem ? viewingHistoryItem.content : strategy[activeSection as keyof GeneratedStrategy];
  const titleToDisplay = viewingHistoryItem ? viewingHistoryItem.title : generationTitles[activeSection as keyof typeof generationTitles];

  const renderContent = () => {
    if (!contentToDisplay) {
      return (
        <div className="flex flex-col items-center justify-center h-64 text-subtle-content">
          <Sparkles className="w-12 h-12 mb-4" />
          <p className="text-lg">Nenhum conteúdo gerado para esta seção ainda.</p>
          <p className="text-sm mt-2">Comece a gerar sua estratégia para ver os resultados aqui!</p>
        </div>
      );
    }

    switch (activeSection) {
      case 'idealCustomerProfile':
        return <IdealCustomerProfileDisplay content={contentToDisplay as string} />;
      case 'monetizationIdeas':
        return <MonetizationIdeasDisplay content={contentToDisplay as string} />;
      case 'instagramBio':
        return <InstagramBioDisplay content={contentToDisplay as string} />;
      case 'storiesStrategy':
        return <StoriesStrategyDisplay content={contentToDisplay as StoriesStrategyItem[]} />;
      case 'contentTable':
        return <ContentTableDisplay content={contentToDisplay as ContentTableData} />;
      case 'editorialCalendar':
        return <EditorialCalendarDisplay content={contentToDisplay as CalendarDay[]} />;
      case 'actionPlan':
        return <ActionPlanDisplay content={contentToDisplay as ActionPlanItem[]} />;
      default:
        return (
          <Card className="card-flat p-4">
            <h3 className="font-semibold mb-2">Conteúdo da Estratégia</h3>
            <p className="text-sm text-foreground/70">
              Selecione uma seção na barra lateral para visualizar o conteúdo gerado.
            </p>
          </Card>
        );
    }
  };

  return (
    <div className="card-elevated p-6 sm:p-8 w-full animate-fade-in">
      <h2 className="text-2xl font-bold text-foreground mb-4">{titleToDisplay}</h2>
      <p className="text-foreground/70 mb-6">
        {viewingHistoryItem ? `Visualizando item do histórico: ${viewingHistoryItem.title}` : `Conteúdo gerado para ${titleToDisplay}.`}
      </p>
      <div className="mt-6 space-y-4">
        {renderContent()}
      </div>
    </div>
  );
};