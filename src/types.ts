// Types for the StrategInsta application

export type ProficiencyLevel = 'iniciante' | 'intermediario' | 'avancado';
export type PostingFrequency = 'diariamente' | '3x_semana' | '2x_semana' | '1x_semana' | 'personalizado';

export interface UserInput {
  niche: string;
  audience: string;
  username: string;
  goals: string;
  funnelFocus: 'balanced' | 'top' | 'middle' | 'bottom';
  files?: File[];
  
  // Novos campos para a base de conhecimento expandida
  brandVoice: string; // Ex: formal, divertido, inspirador, técnico
  productsAndServices: string; // Descrição dos principais produtos/serviços
  existingContentInsights: string; // O que funcionou/não funcionou no passado
  competitorsAndInspirations: string; // Perfis de referência ou concorrentes
  contentPillars: string; // Temas principais de conteúdo
  desiredPostingFrequency: PostingFrequency; // Frequência de postagem desejada
  availableResources: string; // Tempo/recursos disponíveis para criação de conteúdo
  instagramProficiencyLevel: ProficiencyLevel; // Nível de experiência do usuário no Instagram
}

export interface GeneratedStrategy {
  idealCustomerProfile: string;
  monetizationIdeas: string;
  instagramBio: string;
  storiesStrategy: StoriesStrategyItem[];
  contentTable: ContentTableData;
  editorialCalendar: CalendarDay[];
  actionPlan: ActionPlanItem[];
}

export interface StoriesStrategyItem {
  dayOfWeek: string;
  objective: string;
  contentType: string;
  example: string;
  tips: string;
}

export interface ContentTableData {
  topOfFunnel: ContentItem[];
  middleOfFunnel: ContentItem[];
  bottomOfFunnel: ContentItem[];
}

export interface ContentItem {
  type: string;
  description: string;
  example: string;
  frequency: string;
}

export interface CalendarDay {
  day: number;
  weekday: string;
  contentType: string;
  topic: string;
  caption: string;
  hashtags: string[];
  stories?: string[];
}

export interface ActionPlanItem {
  week: number;
  tasks: {
    task: string;
    description: string;
    priority: 'high' | 'medium' | 'low';
    completed?: boolean;
  }[];
}

export interface HistoryItem {
  id: string;
  type: keyof GeneratedStrategy | 'contentGenerator';
  title: string; // Agora pode ser editado pelo usuário
  content: string | StoriesStrategyItem[] | ContentTableData | CalendarDay[] | ActionPlanItem[];
  createdAt: Date;
  prompt?: string;
}

export type FunnelFocus = 'balanced' | 'top' | 'middle' | 'bottom';

export const funnelOptions = [
  {
    value: 'balanced' as const,
    label: 'Estratégia Balanceada',
    description: 'Equilibrio entre crescimento, autoridade e vendas'
  },
  {
    value: 'top' as const,
    label: 'Topo de Funil (Crescimento)',
    description: 'Foco em atrair novos seguidores e aumentar alcance'
  },
  {
    value: 'middle' as const,
    label: 'Meio de Funil (Conexão e Autoridade)',
    description: 'Criar conexão, educar e construir autoridade'
  },
  {
    value: 'bottom' as const,
    label: 'Fundo de Funil (Vendas e Objeções)',
    description: 'Converter seguidores em clientes e vender produtos'
  }
];

export const proficiencyLevelOptions = [
  { value: 'iniciante' as const, label: 'Iniciante', description: 'Estou começando no Instagram e preciso de orientações básicas.' },
  { value: 'intermediario' as const, label: 'Intermediário', description: 'Já uso o Instagram, mas quero melhorar minha estratégia e resultados.' },
  { value: 'avancado' as const, label: 'Avançado', description: 'Tenho experiência e busco otimização e novas táticas.' },
];

export const postingFrequencyOptions = [
  { value: 'diariamente' as const, label: 'Diariamente', description: 'Postar todos os dias (7x por semana).' },
  { value: '3x_semana' as const, label: '3x por Semana', description: 'Postar em dias alternados.' },
  { value: '2x_semana' as const, label: '2x por Semana', description: 'Postar duas vezes na semana.' },
  { value: '1x_semana' as const, label: '1x por Semana', description: 'Postar uma vez na semana.' },
  { value: 'personalizado' as const, label: 'Personalizado', description: 'Tenho uma frequência específica em mente.' },
];