import React, { useState, useCallback, useEffect, useRef } from 'react';
import { OnboardingWizard } from '../components/OnboardingWizard';
import { LoadingSpinner } from '../components/LoadingSpinner';
import { StrategyDashboard } from '../components/StrategyDashboard';
import type { UserInput, GeneratedStrategy, ContentTableData, CalendarDay, ActionPlanItem, HistoryItem, StoriesStrategyItem } from '../types';
import { 
    generateIdealCustomerProfile,
    generateMonetizationIdeas,
    generateInstagramBio,
    generateContentTable,
    generateWeeklyStoriesStrategy,
    generateEditorialCalendar,
    generateActionPlan,
} from '../services/geminiService';
import { SidebarNav, NavItem } from '../components/SidebarNav';
import { HistoryPanel } from '../components/HistoryPanel';
import { User, DollarSign, Instagram, BookOpen, Calendar, Target, Rocket, Grid, History } from 'lucide-react';

// Type Definitions
export type GenerationStep = keyof Omit<GeneratedStrategy, 'editorialCalendar' | 'contentTable' | 'actionPlan'>;
type AppPhase = 'onboarding' | GenerationStep | 'dashboard';
type GenerationState = 'idle' | 'generating' | 'reviewing' | 'refining';

export const generationOrder: GenerationStep[] = ['idealCustomerProfile', 'monetizationIdeas', 'instagramBio', 'storiesStrategy'];
export const generationTitles: Record<GenerationStep | 'contentTable' | 'editorialCalendar' | 'actionPlan' | 'contentGenerator', string> = {
  idealCustomerProfile: 'Perfil de Cliente Ideal',
  monetizationIdeas: 'Ideias de Monetização',
  instagramBio: 'Bio para Instagram',
  storiesStrategy: 'Estratégia de Stories',
  contentTable: 'Matriz de Conteúdo',
  editorialCalendar: 'Calendário Editorial',
  actionPlan: 'Plano de Ação',
  contentGenerator: 'Gerador de Conteúdo'
};

const navItems: NavItem[] = [
    { id: 'idealCustomerProfile', label: 'Perfil de Cliente Ideal', icon: <User className="w-5 h-5" /> },
    { id: 'monetizationIdeas', label: 'Ideias de Monetização', icon: <DollarSign className="w-5 h-5" /> },
    { id: 'instagramBio', label: 'Bio para Instagram', icon: <Instagram className="w-5 h-5" /> },
    { id: 'storiesStrategy', label: 'Estratégia de Stories', icon: <BookOpen className="w-5 h-5" /> },
    { id: 'contentTable', label: 'Matriz de Conteúdo', icon: <Grid className="w-5 h-5" /> },
    { id: 'contentGenerator', label: 'Gerador de Conteúdo', icon: <BookOpen className="w-5 h-5" /> },
    { id: 'editorialCalendar', label: 'Calendário Editorial', icon: <Calendar className="w-5 h-5" /> },
    { id: 'actionPlan', label: 'Plano de Ação', icon: <Rocket className="w-5 h-5" /> },
];

// Theme Switcher Component
type Theme = 'light' | 'dark' | 'system';

const ThemeSwitcher: React.FC<{ theme: Theme; setTheme: (theme: Theme) => void; }> = ({ theme, setTheme }) => {
  const themes: { name: Theme; icon: React.ReactNode }[] = [
    { name: 'light', icon: '☀️' }, 
    { name: 'dark', icon: '🌙' }, 
    { name: 'system', icon: '💻' },
  ];
  return (
    <div className="flex items-center p-1 space-x-1 rounded-full bg-card border border-border">
      {themes.map((t) => (
        <button 
          key={t.name} 
          onClick={() => setTheme(t.name)} 
          className={`p-2 rounded-full transition-colors ${ 
            theme === t.name ? 'bg-primary text-white' : 'text-foreground/60 hover:text-foreground hover:bg-border' 
          }`} 
          aria-label={`Switch to ${t.name} theme`}
        >
          {t.icon}
        </button>
      ))}
    </div>
  );
};

const MarkdownRenderer: React.FC<{ content: string }> = ({ content }) => {
    const renderLine = (line: string, index: number) => {
        if (line.match(/^\*\*Opção \d+.*?\*\*$/)) return <h3 key={index} className="text-xl font-bold mt-8 mb-4">{line.replace(/\*\*/g, '')}</h3>;
        if (line.match(/^\*\*\d[\d\.]*\s.*?\*\*$/)) return <h2 key={index} className="text-2xl font-bold mt-6 mb-3 pb-2 border-b border-border">{line.replace(/\*\*/g, '')}</h2>;
        if (line.match(/^\*\*.+?\*\*$/)) return <h3 key={index} className="text-xl font-semibold mt-4 mb-2">{line.replace(/\*\*/g, '')}</h3>;
        if (line.trim().startsWith('- ') || line.trim().startsWith('* ')) return <li key={index} className="ml-5 list-disc text-foreground/80">{line.trim().substring(2)}</li>;
        if (line.trim() === '---') return <hr key={index} className="my-6 border-border" />;
        if (line.trim() === '') return null;
        return <p key={index} className="text-foreground/80 mb-4 leading-relaxed">{line}</p>;
    };
    return <div className="prose prose-sm md:prose-base max-w-none">{content.split('\n').map(renderLine)}</div>;
};

const Index: React.FC = () => {
  const [appPhase, setAppPhase] = useState<AppPhase>('onboarding');
  const [dashboardSection, setDashboardSection] = useState<string>('idealCustomerProfile');
  const [generationState, setGenerationState] = useState<GenerationState>('idle');
  const [userInput, setUserInput] = useState<UserInput | null>(null);
  const [strategy, setStrategy] = useState<Partial<GeneratedStrategy>>({});
  const [error, setError] = useState<string | null>(null);
  const [refinementInput, setRefinementInput] = useState('');
  const [isFirstGeneration, setIsFirstGeneration] = useState(true);
  const [theme, setTheme] = useState<Theme>('system');
  const [finalAssetsPromise, setFinalAssetsPromise] = useState<Promise<{
    contentTable: ContentTableData;
    editorialCalendar: CalendarDay[];
    actionPlan: ActionPlanItem[];
  }> | null>(null);
  const [completedSteps, setCompletedSteps] = useState<Set<string>>(new Set());
  const [history, setHistory] = useState<HistoryItem[]>([]);
  const [isHistoryPanelOpen, setIsHistoryPanelOpen] = useState(false);
  const [viewingHistoryItem, setViewingHistoryItem] = useState<HistoryItem | null>(null);
  const isCancelledRef = useRef(false);

  useEffect(() => {
    const root = window.document.documentElement;
    const isDark = theme === 'dark' || (theme === 'system' && window.matchMedia('(prefers-color-scheme: dark)').matches);
    root.classList.toggle('dark', isDark);
  }, [theme]);

  const generateStrategyPart = useCallback(async (step: GenerationStep, input: UserInput, currentStrategy: Partial<GeneratedStrategy>, refinementPrompt?: string) => {
      switch(step) {
          case 'idealCustomerProfile':
              return generateIdealCustomerProfile(input, refinementPrompt);
          case 'monetizationIdeas':
              return generateMonetizationIdeas(input, refinementPrompt);
          case 'instagramBio':
              return generateInstagramBio(input, currentStrategy, refinementPrompt);
          case 'storiesStrategy':
              return generateWeeklyStoriesStrategy(input, refinementPrompt);
      }
  }, []);
  
  const executeGeneration = useCallback(async (refinementPrompt?: string) => {
    if (!userInput || typeof appPhase !== 'string' || appPhase === 'onboarding' || appPhase === 'dashboard') return;
    
    isCancelledRef.current = false;
    setGenerationState(refinementPrompt ? 'refining' : 'generating');
    setError(null);

    try {
      const result = await generateStrategyPart(appPhase as GenerationStep, userInput, strategy, refinementPrompt);
      if (isCancelledRef.current) return;
      setStrategy(prev => ({ ...prev, [appPhase]: result }));
      setGenerationState('reviewing');
      setIsFirstGeneration(false);
    } catch (err) {
      if (isCancelledRef.current) return;
      console.error(err);
      setError('Ocorreu um erro ao gerar esta seção. Por favor, tente novamente.');
      setGenerationState('reviewing');
    }
  }, [userInput, appPhase, strategy, generateStrategyPart]);

  useEffect(() => {
    if(generationState === 'generating' && isFirstGeneration){
        executeGeneration();
    }
  }, [generationState, isFirstGeneration, executeGeneration]);
  
  const handleStart = useCallback((input: UserInput) => {
    isCancelledRef.current = false;
    setUserInput(input);
    setAppPhase(generationOrder[0]);
    setStrategy({});
    setError(null);
    setIsFirstGeneration(true);
    setGenerationState('generating');
    setCompletedSteps(new Set());
    setHistory([]);

    const promise = (async () => {
        try {
            const contentTable = await generateContentTable(input);
            const tempStrategy: Partial<GeneratedStrategy> = { contentTable };
            const editorialCalendar = await generateEditorialCalendar(input, tempStrategy);
            tempStrategy.editorialCalendar = editorialCalendar;
            const actionPlan = await generateActionPlan(input, tempStrategy);
            return { contentTable, editorialCalendar, actionPlan };
        } catch (err) {
            console.error("Falha ao gerar os conteúdos finais em segundo plano:", err);
            throw err;
        }
    })();
    setFinalAssetsPromise(promise);
  }, []);

  const handleReset = useCallback(() => {
    setAppPhase('onboarding');
    setUserInput(prev => prev ? { ...prev, files: undefined } : null);
    setStrategy({});
    setError(null);
    setGenerationState('idle');
    setFinalAssetsPromise(null);
    setCompletedSteps(new Set());
    setIsHistoryPanelOpen(false);
    setViewingHistoryItem(null);
  }, []);

  const handleStopGeneration = useCallback(() => {
    isCancelledRef.current = true;
    setError(null);

    const currentIndex = generationOrder.indexOf(appPhase as GenerationStep);
    if (currentIndex === 0) {
        handleReset();
    } else if (currentIndex > 0) {
        setAppPhase(generationOrder[currentIndex - 1]);
        setGenerationState('reviewing');
    }
  }, [appPhase, handleReset]);

  const handleConfirmAndContinue = useCallback(async () => {
    const currentStepId = appPhase;
    setCompletedSteps(prev => new Set(prev).add(currentStepId));
    const currentIndex = generationOrder.indexOf(appPhase as GenerationStep);

    if (currentIndex < generationOrder.length - 1) {
        setAppPhase(generationOrder[currentIndex + 1]);
        setGenerationState('generating');
        setIsFirstGeneration(true);
    } else {
        setGenerationState('generating');
        try {
            if (!finalAssetsPromise) throw new Error("Promise dos conteúdos finais não encontrada.");
            const finalAssets = await finalAssetsPromise;
            setStrategy(prev => ({ ...prev, ...finalAssets }));
            setAppPhase('dashboard');
            const allSteps = new Set<string>(generationOrder);
            ['contentTable', 'editorialCalendar', 'actionPlan'].forEach(step => allSteps.add(step));
            setCompletedSteps(allSteps);
        } catch (err) {
             setError('Falha ao gerar as etapas finais. Por favor, reinicie.');
        } finally {
            setGenerationState('idle');
        }
    }
  }, [appPhase, finalAssetsPromise]);
  
  const handleRegenerate = () => {
      executeGeneration();
  };

  const handleRefine = (e: React.FormEvent) => {
      e.preventDefault();
      if(!refinementInput.trim()) return;
      executeGeneration(refinementInput);
      setRefinementInput('');
  };

  const handleViewHistoryItem = (item: HistoryItem) => {
    setViewingHistoryItem(item);
    setDashboardSection(item.type);
  };

  const handleDeleteHistoryItem = (itemId: string) => {
    setHistory(prev => prev.filter(item => item.id !== itemId));
    if (viewingHistoryItem?.id === itemId) {
        setViewingHistoryItem(null);
    }
  };

  const renderGenerationStep = () => {
    const isLoading = generationState === 'generating' || generationState === 'refining';
    const currentTitle = generationTitles[appPhase as GenerationStep];
    const currentContent = strategy[appPhase as GenerationStep] as string | StoriesStrategyItem[] | undefined;

    return (
        <div className="bg-card/50 backdrop-blur-sm border border-border p-6 sm:p-8 rounded-2xl shadow-lg w-full animate-fade-in">
            <h2 className="text-2xl font-bold text-foreground mb-4">{currentTitle}</h2>

            {isLoading ? (
                <div className="text-center">
                    <LoadingSpinner message={generationState === 'refining' ? `Ajustando ${currentTitle}...` : `Gerando ${currentTitle}...`} />
                    <button onClick={handleStopGeneration} className="mt-6 px-6 py-2 text-sm font-semibold rounded-lg bg-red-500/10 text-red-500 hover:bg-red-500/20 border border-red-500/20 transition-all transform hover:scale-105" aria-label="Parar geração de conteúdo">
                        Parar Geração
                    </button>
                </div>
            ) : (
                <>
                    {error && <div className="bg-red-500/10 border border-red-500/30 text-red-400 p-3 rounded-md my-4 text-sm">{error}</div>}
                    {typeof currentContent === 'string' && <div className="mb-8"><MarkdownRenderer content={currentContent} /></div>}

                    {generationState === 'reviewing' && (
                        <div className="space-y-4 pt-4 border-t border-border">
                            <form onSubmit={handleRefine}>
                                <label htmlFor="refinement" className="text-sm font-medium text-foreground/80 mb-2 block">Precisa de ajustes? Peça aqui.</label>
                                <div className="flex flex-col sm:flex-row gap-2">
                                    <input id="refinement" type="text" value={refinementInput} onChange={(e) => setRefinementInput(e.target.value)} placeholder="Ex: 'Deixe o tom mais divertido' ou 'Adicione uma opção focada em e-commerce'" className="block w-full rounded-md border-0 bg-card py-2 px-3 text-card-foreground shadow-sm ring-1 ring-inset ring-border focus:ring-2 focus:ring-inset focus:ring-primary sm:text-sm" />
                                    <button type="submit" className="px-4 py-2 text-sm font-semibold rounded-md bg-secondary/80 text-white hover:bg-secondary">Ajustar</button>
                                </div>
                            </form>
                            <div className="flex flex-col sm:flex-row items-center justify-between gap-4 pt-4">
                                <button onClick={handleRegenerate} className="flex items-center gap-2 text-sm text-foreground/70 hover:text-primary transition-colors">
                                   🔄 {isFirstGeneration ? 'Gerar Novamente' : 'Gerar Novas Opções'}
                                </button>
                                <button onClick={handleConfirmAndContinue} className="w-full sm:w-auto rounded-md bg-gradient-to-r from-primary to-secondary px-8 py-3 text-base font-bold text-white shadow-lg hover:shadow-primary/50 transition-all duration-300 transform hover:scale-[1.02]">
                                    Aprovar e Continuar &rarr;
                                </button>
                            </div>
                        </div>
                    )}
                </>
            )}
        </div>
    );
  };
  
  const handleSidebarClick = (id: string) => {
    if (appPhase === 'dashboard' && completedSteps.has(id)) {
        setDashboardSection(id);
        setViewingHistoryItem(null);
    }
  };

  return (
    <div className="min-h-screen bg-background text-foreground selection:bg-secondary selection:text-white">
      <div className="relative isolate">
        <div className="absolute inset-x-0 -top-40 -z-10 transform-gpu overflow-hidden blur-3xl sm:-top-80" aria-hidden="true">
          <div className="relative left-[calc(50%-11rem)] aspect-[1155/678] w-[36.125rem] -translate-x-1/2 rotate-[30deg] bg-gradient-to-tr from-[var(--gradient-from)] to-[var(--gradient-to)] opacity-30 dark:opacity-20 sm:left-[calc(50%-30rem)] sm:w-[72.1875rem]" style={{clipPath: 'polygon(74.1% 44.1%, 100% 61.6%, 97.5% 26.9%, 85.5% 0.1%, 80.7% 2%, 72.5% 32.5%, 60.2% 62.4%, 52.4% 68.1%, 47.5% 58.3%, 45.2% 34.5%, 27.5% 76.7%, 0.1% 64.9%, 17.9% 100%, 27.6% 76.8%, 76.1% 97.7%, 74.1% 44.1%)'}}></div>
        </div>
        
        <header className="py-8 text-center relative mb-8 max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
            <div className="absolute top-8 right-8 flex items-center gap-4">
              {appPhase !== 'onboarding' && (
                <button onClick={() => setIsHistoryPanelOpen(!isHistoryPanelOpen)} className="p-2 rounded-full transition-colors text-foreground/60 hover:text-foreground hover:bg-border" aria-label="Toggle history panel">
                    <History className="w-6 h-6" />
                </button>
              )}
              <ThemeSwitcher theme={theme} setTheme={setTheme} />
            </div>
            <div className="flex items-center justify-center gap-4">
              <h1 className="text-4xl font-bold tracking-tight sm:text-6xl bg-clip-text text-transparent bg-gradient-to-r from-primary to-secondary">
                StrategInsta
              </h1>
            </div>
            <h2 className="mt-4 text-2xl font-semibold tracking-tight text-foreground sm:text-3xl">
              Sua Estrategista de Conteúdo Pessoal, Potencializada por IA
            </h2>
             {appPhase === 'onboarding' && (
              <p className="mt-6 text-lg leading-8 text-foreground/70 max-w-3xl mx-auto">
                Transforme seu conhecimento em um ano de conteúdo magnético em minutos. Do perfil do seu cliente ideal ao plano de ação diário, nós criamos a estratégia para você focar em crescer.
              </p>
            )}
        </header>

        <main className="mx-auto max-w-screen-2xl px-4 sm:px-6 lg:px-8">
          {appPhase === 'onboarding' ? (
              <OnboardingWizard onStart={handleStart} initialValues={userInput} error={error} />
          ) : (
            <div className="grid grid-cols-1 lg:grid-cols-5 xl:grid-cols-6 gap-8 items-start">
              <aside className="lg:col-span-1 xl:col-span-1">
                <SidebarNav 
                  items={navItems} 
                  activeItem={appPhase === 'dashboard' ? dashboardSection : appPhase} 
                  setActiveItem={handleSidebarClick} 
                  completedSteps={completedSteps}
                  onReset={handleReset}
                  isDashboard={appPhase === 'dashboard'}
                />
              </aside>

              <div className={`transition-all duration-300 ${isHistoryPanelOpen ? 'lg:col-span-3 xl:col-span-4' : 'lg:col-span-4 xl:col-span-5'}`}>
                {appPhase !== 'dashboard' ? renderGenerationStep() : (
                  <StrategyDashboard
                    strategy={strategy as GeneratedStrategy}
                    setStrategy={(s) => setStrategy(s)}
                    userInput={userInput!}
                    activeSection={dashboardSection}
                    setActiveSection={setDashboardSection}
                    onRegenerate={generateStrategyPart}
                    setHistory={setHistory}
                    viewingHistoryItem={viewingHistoryItem}
                  />
                )}
              </div>

              {isHistoryPanelOpen && (
                <aside className="hidden lg:block lg:col-span-1 xl:col-span-1 animate-fade-in">
                  <HistoryPanel 
                    history={history} 
                    onClose={() => setIsHistoryPanelOpen(false)}
                    onViewItem={handleViewHistoryItem}
                    onDeleteItem={handleDeleteHistoryItem}
                  />
                </aside>
              )}
            </div>
          )}
        </main>
        
        <footer className="text-center py-8 mt-12 border-t border-border bg-card/50">
          <div className="flex items-center justify-center gap-4">
              <div className="text-sm text-foreground/60">
                <span>Desenvolvido com IA por </span>
                <a href="https://www.instagram.com/antonypinheiro.eu" target="_blank" rel="noopener noreferrer" className="font-semibold text-primary hover:underline inline-flex items-center gap-1.5">
                  Antony Pinheiro. Siga no Instagram
                  <Instagram className="w-4 h-4" />
                </a>
              </div>
            </div>
        </footer>
        <div className="absolute inset-x-0 top-[calc(100%-13rem)] -z-10 transform-gpu overflow-hidden blur-3xl sm:top-[calc(100%-30rem)]" aria-hidden="true">
          <div className="relative left-[calc(50%+3rem)] aspect-[1155/678] w-[36.125rem] -translate-x-1/2 bg-gradient-to-tr from-[var(--gradient-from)] to-[var(--gradient-to)] opacity-30 dark:opacity-20 sm:left-[calc(50%+36rem)] sm:w-[72.1875rem]" style={{clipPath: 'polygon(74.1% 44.1%, 100% 61.6%, 97.5% 26.9%, 85.5% 0.1%, 80.7% 2%, 72.5% 32.5%, 60.2% 62.4%, 52.4% 68.1%, 47.5% 58.3%, 45.2% 34.5%, 27.5% 76.7%, 0.1% 64.9%, 17.9% 100%, 27.6% 76.8%, 76.1% 97.7%, 74.1% 44.1%)'}}></div>
        </div>
      </div>
    </div>
  );
};

export default Index;