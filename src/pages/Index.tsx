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
import { User, DollarSign, Instagram, BookOpen, Calendar, Target, Rocket, Grid, History, RefreshCcw, CheckCircle2, XCircle, Sparkles } from 'lucide-react';
import { useSession } from '@/components/SessionContextProvider';
import { supabase } from '@/integrations/supabase/client';
import { Button } from '@/components/ui/button';
import { Textarea } from '@/components/ui/textarea';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { toast } from 'sonner';
import { InputDialog } from '@/components/InputDialog';
import logo from "@/assets/logo.png"; // Importar a logo

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

const MarkdownRenderer: React.FC<{ content: string | StoriesStrategyItem[] }> = ({ content }) => {
    if (Array.isArray(content)) {
        // Renderizar StoriesStrategyItem[]
        return (
            <div className="space-y-6">
                {content.map((item, index) => (
                    <Card key={index} className="shadow-sm">
                        <CardHeader>
                            <CardTitle className="text-lg font-semibold text-primary">{item.dayOfWeek}</CardTitle>
                        </CardHeader>
                        <CardContent className="space-y-2 text-foreground/80">
                            <p><strong>Objetivo:</strong> {item.objective}</p>
                            <p><strong>Tipo de Conteúdo:</strong> {item.contentType}</p>
                            <p><strong>Exemplo:</strong> {item.example}</p>
                            <p><strong>Dicas:</strong> {item.tips}</p>
                        </CardContent>
                    </Card>
                ))}
            </div>
        );
    }

    // Renderizar string Markdown
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

const LOCAL_STORAGE_KEY = 'strateginsta_user_input';

const Index: React.FC = () => {
  const { user, isLoading: isSessionLoading } = useSession();
  const [appPhase, setAppPhase] = useState<AppPhase>('onboarding');
  const [dashboardSection, setDashboardSection] = useState<string>('idealCustomerProfile');
  const [generationState, setGenerationState] = useState<GenerationState>('idle');
  // Initialize userInput with data from localStorage if available
  const [userInput, setUserInput] = useState<UserInput | null>(() => {
    if (typeof window !== 'undefined') { // Ensure localStorage is available (client-side)
      try {
        const storedInput = localStorage.getItem(LOCAL_STORAGE_KEY);
        if (storedInput) {
          const parsedInput = JSON.parse(storedInput);
          // Ensure files are not persisted, as they are not JSON serializable
          return { ...parsedInput, files: undefined };
        }
      } catch (e) {
        console.error("Failed to parse user input from localStorage", e);
      }
    }
    return null;
  });
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
  const [showNameStrategyDialog, setShowNameStrategyDialog] = useState(false); // Novo estado para o diálogo
  const isCancelledRef = useRef(false);

  useEffect(() => {
    const root = window.document.documentElement;
    const isDark = theme === 'dark' || (theme === 'system' && window.matchMedia('(prefers-color-scheme: dark)').matches);
    root.classList.toggle('dark', isDark);
  }, [theme]);

  const handleLogout = useCallback(async () => {
    await supabase.auth.signOut();
    setUserInput(null);
    setStrategy({});
    setHistory([]);
    setCompletedSteps(new Set());
    setAppPhase('onboarding');
    localStorage.removeItem(LOCAL_STORAGE_KEY); // Clear stored input on logout
    toast.success("Você foi desconectado com sucesso!");
  }, []);

  const handleSidebarClick = useCallback((id: string) => {
    if (appPhase === 'dashboard') {
      setDashboardSection(id);
      setViewingHistoryItem(null); // Limpa a visualização do histórico ao navegar no dashboard
    } else {
      // Lógica para navegação entre as etapas de geração, se necessário
      // Por enquanto, a navegação é linear via "Confirmar e Continuar"
    }
  }, [appPhase]);

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
    // A verificação de autenticação agora é feita no OnboardingWizard antes de chamar handleStart
    // A fase do aplicativo deve ser uma das etapas de geração, não 'onboarding' ou 'dashboard'
    if (!userInput || typeof appPhase !== 'string' || appPhase === 'dashboard' || !generationOrder.includes(appPhase as GenerationStep)) {
      setError('Dados iniciais ausentes ou fase do aplicativo inválida para geração.');
      toast.error("Erro: Dados iniciais ausentes ou fase do aplicativo inválida para geração.");
      return;
    }
    
    isCancelledRef.current = false;
    setGenerationState(refinementPrompt ? 'refining' : 'generating');
    setError(null);
    toast.info(refinementPrompt ? "Refinando sua estratégia..." : "Gerando sua estratégia...");

    try {
      const result = await generateStrategyPart(appPhase as GenerationStep, userInput, strategy, refinementPrompt);
      if (isCancelledRef.current) return;
      setStrategy(prev => ({ ...prev, [appPhase]: result }));
      setGenerationState('reviewing');
      setIsFirstGeneration(false);
      toast.success("Seção gerada com sucesso!");

      // Adicionar ao histórico
      setHistory(prev => [
        {
          id: crypto.randomUUID(),
          type: appPhase as GenerationStep,
          title: generationTitles[appPhase as GenerationStep],
          content: result,
          createdAt: new Date(),
          prompt: refinementPrompt || JSON.stringify(userInput),
        },
        ...prev,
      ]);

    } catch (err) {
      if (isCancelledRef.current) return;
      console.error(err);
      setError('Ocorreu um erro ao gerar esta seção. Por favor, tente novamente.');
      setGenerationState('reviewing');
      toast.error("Ocorreu um erro ao gerar esta seção.");
    }
  }, [userInput, appPhase, strategy, generateStrategyPart]);

  useEffect(() => {
    if(generationState === 'generating' && isFirstGeneration){
        executeGeneration();
    }
  }, [generationState, isFirstGeneration, executeGeneration]);
  
  const handleStart = useCallback((input: UserInput) => {
    if (!user?.id) {
      setError('Erro interno: Usuário não autenticado ao iniciar a estratégia.');
      toast.error("Erro interno: Usuário não autenticado ao iniciar a estratégia.");
      return;
    }
    isCancelledRef.current = false;
    setUserInput(input);
    // Save input to localStorage, excluding files as they are not JSON serializable
    const inputToStore = { ...input, files: undefined };
    try {
      localStorage.setItem(LOCAL_STORAGE_KEY, JSON.stringify(inputToStore));
    } catch (e) {
      console.error("Failed to save user input to localStorage", e);
    }

    setStrategy({});
    setError(null);
    setIsFirstGeneration(true);
    setGenerationState('generating');
    setCompletedSteps(new Set());
    setHistory([]);
    setAppPhase(generationOrder[0]); // <--- AQUI: Define a fase do aplicativo para a primeira etapa de geração
    // console.log("handleStart called. Current user:", user); // Removido o console.log de depuração

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
            toast.error("Falha ao gerar os conteúdos finais em segundo plano.");
            throw err;
        }
    })();
    setFinalAssetsPromise(promise);
  }, [user?.id]);

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
    setShowNameStrategyDialog(false); // Resetar o estado do diálogo
    toast.info("Estratégia resetada. Comece novamente!");
  }, []);

  const handleStopGeneration = useCallback(() => {
    isCancelledRef.current = true;
    setError(null);
    toast.warning("Geração interrompida.");

    const currentIndex = generationOrder.indexOf(appPhase as GenerationStep);
    if (currentIndex === 0) {
        handleReset();
    } else if (currentIndex > 0) {
        setAppPhase(generationOrder[currentIndex - 1]);
        setGenerationState('reviewing');
    }
  }, [appPhase, handleReset]);

  const saveStrategyToSupabase = useCallback(async (strategyName: string) => {
    if (!user?.id || !userInput || !strategy) {
      toast.error("Não foi possível salvar a estratégia: dados incompletos.");
      return;
    }

    try {
      const { data, error } = await supabase
        .from('strategies')
        .insert({
          user_id: user.id,
          name: strategyName,
          user_input: userInput,
          generated_strategy: strategy,
          history: history, // Salvar o histórico junto com a estratégia
        })
        .select();

      if (error) throw error;
      toast.success("Estratégia salva com sucesso!");
      console.log("Estratégia salva:", data);
    } catch (error) {
      console.error("Erro ao salvar estratégia no Supabase:", error);
      toast.error("Erro ao salvar a estratégia.");
    }
  }, [user?.id, userInput, strategy, history]);

  const handleConfirmAndContinue = useCallback(async () => {
    const currentStepId = appPhase;
    setCompletedSteps(prev => new Set(prev).add(currentStepId));
    const currentIndex = generationOrder.indexOf(appPhase as GenerationStep);

    if (currentIndex < generationOrder.length - 1) {
        setAppPhase(generationOrder[currentIndex + 1]);
        setGenerationState('generating');
        setIsFirstGeneration(true);
        toast.info("Continuando para a próxima etapa...");
    } else {
        setGenerationState('generating');
        toast.info("Finalizando a geração da estratégia completa...");
        try {
            if (!finalAssetsPromise) throw new Error("Promise dos conteúdos finais não encontrada.");
            const finalAssets = await finalAssetsPromise;
            setStrategy(prev => ({ ...prev, ...finalAssets }));
            
            const allSteps = new Set<string>(generationOrder);
            ['contentTable', 'editorialCalendar', 'actionPlan'].forEach(step => allSteps.add(step));
            setCompletedSteps(allSteps);
            
            toast.success("Estratégia completa gerada com sucesso!");
            setShowNameStrategyDialog(true); // Abrir o diálogo para nomear a estratégia
        } catch (err) {
             setError('Falha ao gerar as etapas finais. Por favor, reinicie.');
             toast.error("Falha ao gerar as etapas finais. Por favor, reinicie.");
        } finally {
            setGenerationState('idle');
        }
    }
  }, [appPhase, finalAssetsPromise]);
  
  const handleNameStrategyConfirm = useCallback((name: string) => {
    saveStrategyToSupabase(name);
    setAppPhase('dashboard'); // Mover para o dashboard após nomear e salvar
  }, [saveStrategyToSupabase]);

  const handleNameStrategySkip = useCallback(() => {
    saveStrategyToSupabase(`Estratégia ${new Date().toLocaleDateString()}`); // Salvar com nome padrão
    setAppPhase('dashboard'); // Mover para o dashboard
  }, [saveStrategyToSupabase]);

  const handleRegenerate = () => {
      executeGeneration();
      toast.info("Regerando a seção atual...");
  };

  const handleRefine = (e: React.FormEvent) => {
      e.preventDefault();
      if(!refinementInput.trim()) {
        toast.warning("Por favor, digite um prompt de refinamento.");
        return;
      }
      executeGeneration(refinementInput);
      setRefinementInput('');
  };

  const handleViewHistoryItem = (item: HistoryItem) => {
    setViewingHistoryItem(item);
    setDashboardSection(item.type);
    setIsHistoryPanelOpen(false); // Fecha o painel de histórico ao visualizar um item
  };

  const handleDeleteHistoryItem = (itemId: string) => {
    setHistory(prev => prev.filter(item => item.id !== itemId));
    if (viewingHistoryItem?.id === itemId) {
        setViewingHistoryItem(null);
    }
    toast.success("Item do histórico excluído.");
  };

  const handleRenameHistoryItem = (itemId: string, newTitle: string) => {
    setHistory(prev => prev.map(item => item.id === itemId ? { ...item, title: newTitle } : item));
    if (viewingHistoryItem?.id === itemId) {
        setViewingHistoryItem(prev => prev ? { ...prev, title: newTitle } : null);
    }
    toast.success("Item do histórico renomeado.");
  };

  const renderGenerationStep = useCallback(() => {
    const currentStep = appPhase as GenerationStep;
    const currentTitle = generationTitles[currentStep];
    const currentContent = strategy[currentStep];

    return (
      <Card className="bg-card/50 backdrop-blur-sm border border-border p-6 sm:p-8 rounded-2xl shadow-lg w-full animate-fade-in">
        <CardHeader className="px-0 pt-0">
          <CardTitle className="text-2xl font-bold text-foreground mb-2">{currentTitle}</CardTitle>
          <p className="text-foreground/70">
            {generationState === 'generating' && "Gerando conteúdo para esta seção..."}
            {generationState === 'refining' && "Refinando o conteúdo com base na sua solicitação..."}
            {generationState === 'reviewing' && "Revise o conteúdo gerado abaixo. Você pode refinar ou confirmar para continuar."}
          </p>
        </CardHeader>
        <CardContent className="px-0 pb-0">
          {generationState === 'generating' || generationState === 'refining' ? (
            <div className="flex flex-col items-center justify-center h-64">
              <LoadingSpinner message={generationState === 'generating' ? "A IA está trabalhando duro para criar sua estratégia..." : "Ajustando os detalhes para você..."} />
              <Button variant="outline" onClick={handleStopGeneration} className="mt-8">
                <XCircle className="w-4 h-4 mr-2" /> Parar Geração
              </Button>
            </div>
          ) : error ? (
            <div className="bg-red-500/10 border border-red-500/30 text-red-400 p-4 rounded-md mb-6 flex items-center gap-2">
              <XCircle className="w-5 h-5" />
              <span>{error}</span>
            </div>
          ) : currentContent ? (
            <div className="space-y-6">
              <MarkdownRenderer content={currentContent} />
              <form onSubmit={handleRefine} className="space-y-4 mt-8">
                <Textarea
                  placeholder="O que você gostaria de refinar ou mudar nesta seção? Ex: 'Torne a bio mais focada em vendas', 'Adicione mais ideias para stories de engajamento'."
                  value={refinementInput}
                  onChange={(e) => setRefinementInput(e.target.value)}
                  rows={3}
                />
                <div className="flex justify-end gap-2">
                  <Button type="button" variant="outline" onClick={handleRegenerate}>
                    <RefreshCcw className="w-4 h-4 mr-2" /> Regenerar
                  </Button>
                  <Button type="submit" disabled={!refinementInput.trim()}>
                    <Sparkles className="w-4 h-4 mr-2" /> Refinar
                  </Button>
                </div>
              </form>
              <div className="flex justify-end mt-6">
                <Button onClick={handleConfirmAndContinue}>
                  <CheckCircle2 className="w-4 h-4 mr-2" /> Confirmar e Continuar
                </Button>
              </div>
            </div>
          ) : (
            <div className="text-center text-foreground/60 py-10">
              Nenhum conteúdo gerado para esta seção ainda.
            </div>
          )}
        </CardContent>
      </Card>
    );
  }, [appPhase, generationState, strategy, error, refinementInput, handleRefine, handleRegenerate, handleConfirmAndContinue, handleStopGeneration]);


  if (isSessionLoading) {
    return (
      <div className="min-h-screen flex items-center justify-center bg-background">
        <LoadingSpinner message="Verificando sessão..." />
      </div>
    );
  }

  return (
    <div className="min-h-screen bg-background text-foreground selection:bg-secondary selection:text-white">
      <div className="relative isolate">
        <div className="absolute inset-x-0 -top-40 -z-10 transform-gpu overflow-hidden blur-3xl sm:-top-80" aria-hidden="true">
          <div className="relative left-[calc(50%-11rem)] aspect-[1155/678] w-[36.125rem] -translate-x-1/2 rotate-[30deg] bg-gradient-to-tr from-[var(--gradient-from)] to-[var(--gradient-to)] opacity-30 dark:opacity-20 sm:left-[calc(50%-30rem)] sm:w-[72.1875rem]" style={{clipPath: 'polygon(74.1% 44.1%, 100% 61.6%, 97.5% 26.9%, 85.5% 0.1%, 80.7% 2%, 72.5% 32.5%, 60.2% 62.4%, 52.4% 68.1%, 47.5% 58.3%, 45.2% 34.5%, 27.5% 76.7%, 0.1% 64.9%, 17.9% 100%, 27.6% 76.8%, 76.1% 97.7%, 74.1% 44.1%)'}}></div>
        </div>
        
        <header className="py-8 text-center relative mb-8 max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
            <div className="absolute top-8 right-8 flex items-center gap-4">
              {user && (
                <button onClick={handleLogout} className="p-2 rounded-full transition-colors text-foreground/60 hover:text-foreground hover:bg-border" aria-label="Sair">
                    Sair
                </button>
              )}
              {appPhase !== 'onboarding' && (
                <button onClick={() => setIsHistoryPanelOpen(!isHistoryPanelOpen)} className="p-2 rounded-full transition-colors text-foreground/60 hover:text-foreground hover:bg-border" aria-label="Toggle history panel">
                    <History className="w-6 h-6" />
                </button>
              )}
              <ThemeSwitcher theme={theme} setTheme={setTheme} />
            </div>
            <div className="flex items-center justify-center gap-4">
              {/* Substituindo o h1 pelo img da logo */}
              <img
                src={logo}
                alt="StrategInsta Logo"
                className="h-10 sm:h-12 md:h-14 lg:h-16 w-auto logo-theme-aware"
              />
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
              <OnboardingWizard onStart={handleStart} initialValues={userInput} error={error} isAuthenticated={!!user?.id} />
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
                    onRenameItem={handleRenameHistoryItem} // Passar a função de renomear
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
      {/* Diálogo para nomear a estratégia */}
      <InputDialog
        isOpen={showNameStrategyDialog}
        onClose={() => setShowNameStrategyDialog(false)}
        onConfirm={handleNameStrategyConfirm}
        title="Nomear sua Estratégia"
        description="Dê um nome à sua nova estratégia para facilitar a organização no histórico."
        label="Nome da Estratégia"
        placeholder="Ex: Estratégia de Lançamento do Curso X"
        confirmText="Salvar e Ir para Dashboard"
        cancelText="Pular e Ir para Dashboard"
      />
    </div>
  );
};

export default Index;