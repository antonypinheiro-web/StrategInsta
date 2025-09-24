// Types for the StrategInsta application

export interface UserInput {
  niche: string;
  audience: string;
  username: string;
  goals: string;
  funnelFocus: 'balanced' | 'top' | 'middle' | 'bottom';
  files?: File[];
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
  title: string;
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