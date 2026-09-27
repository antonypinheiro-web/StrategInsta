import type { GeneratedStrategy, UserInput } from '../types';

export const awarenessLevels = [
  { id: 'unaware', label: 'Não percebe o problema', approach: 'Descoberta e identificação' },
  { id: 'problem', label: 'Percebe o problema', approach: 'Dor e caminhos possíveis' },
  { id: 'solution', label: 'Conhece as soluções', approach: 'Critérios e alternativas' },
  { id: 'offer', label: 'Conhece sua oferta', approach: 'Diferenças e objeções' },
  { id: 'decision', label: 'Próximo da decisão', approach: 'Condições e próximo passo' },
] as const;
export const contentPurposes = [
  { id: 'growth', label: 'Crescimento' },
  { id: 'engagement', label: 'Engajamento e retenção' },
  { id: 'authority', label: 'Autoridade' },
  { id: 'objection', label: 'Quebra de objeção' },
] as const;
export type AwarenessLevel = typeof awarenessLevels[number]['id'];
export type ContentPurpose = typeof contentPurposes[number]['id'];
export type ContentFormat = 'reel' | 'carousel' | 'static' | 'stories';
export interface ContentIdea {
  id: string; title: string; angle: string; format: ContentFormat;
  briefingBasis: string; proofNeeded?: string; cta?: string; versionId?: string;
}
export interface MatrixCell {
  id: string; awareness: AwarenessLevel; purpose: ContentPurpose;
  ideas: ContentIdea[]; rationale?: string;
}
export interface ContentMatrix { id: string; cells: MatrixCell[]; }
export interface StoryFrame {
  id: string; position: number; goal: 'retain' | 'engage' | 'convert';
  narrative: string; scene: string; speech: string; onScreen: string; tool: string;
  cta?: string; feedConnection?: string; effort?: string; versionId?: string;
}
export interface StoriesDay {
  id: string; date: string; routine: string; requestedCount: number;
  offerOrEvent?: string; restrictions?: string; stories: StoryFrame[];
}
export interface StoriesWeek {
  id: string; weekStart: string; previousWeekId?: string;
  continuationSummary?: string; executionFeedback?: string; days: StoriesDay[];
}
export interface MonetizationIdea {
  id: string; title: string; offer: string; audience: string; basis: string;
  resources: string; risks: string; hypothesis: string;
}
export interface MonetizationAnalysis { id: string; potential: string; basis: string[]; ideas: MonetizationIdea[]; }
export interface BioOption { id: string; name: string; text: string; recommendation?: string; versionId?: string; }
export interface ContentOrigin {
  kind: 'idea' | 'story' | 'day' | 'week' | 'bio' | 'section';
  id: string; cellId?: string; weekId?: string; dayId?: string;
  awareness?: AwarenessLevel; purpose?: ContentPurpose;
}
export interface ContentBlock { id: string; label: string; action?: string; speech?: string; onScreen?: string; text?: string; }
export interface GeneratedContent {
  id: string; title: string; format: ContentFormat; origin: ContentOrigin;
  objective: string; cta: string; blocks: ContentBlock[]; caption?: string;
  note?: string; versionId?: string; createdAt?: string;
}
export interface PilotWorkspaceData {
  schemaVersion: 1; matrix?: ContentMatrix; storiesWeek?: StoriesWeek; storiesAgenda?: StoriesWeek;
  monetization?: MonetizationAnalysis; selectedMonetizationIds: string[];
  monetizationPlan?: string; bios?: BioOption[]; scripts: GeneratedContent[];
  overrides?: Partial<GeneratedStrategy>; staleSections?: string[];
}
export type WorkspaceOperation = 'matrix_generate' | 'idea_generate' | 'format_variation' |
  'item_refine' | 'content_script' | 'stories_day' | 'stories_week' |
  'monetization_analyze' | 'monetization_plan' | 'bio_generate' | 'section_regenerate';
export interface WorkspaceGenerationPayload {
  strategyId?: string; origin?: ContentOrigin; instruction?: string;
  format?: ContentFormat; section?: keyof GeneratedStrategy;
  cell?: MatrixCell; item?: ContentIdea | StoryFrame | BioOption | GeneratedContent;
  day?: StoriesDay; week?: StoriesWeek; previousWeek?: StoriesWeek;
  selectedMonetizationIds?: string[]; workspace: PilotWorkspaceData; userInput: UserInput;
  strategy?: Partial<GeneratedStrategy>;
}
export interface WorkspaceGenerationResult { output: unknown; versionId?: string; }
export interface WorkspaceChange {
  kind: 'manual_edit' | 'selection' | 'generation' | 'agenda'; title: string;
  data: PilotWorkspaceData; source?: ContentOrigin; versionId?: string;
  changedSections?: string[];
}
export interface ContentFeedback {
  versionId: string; contentId: string; rating: 'good' | 'bad' | 'unrated';
  goal: 'reach' | 'interaction' | 'retention' | 'conversion'; published: boolean;
  publishedAt?: string; period?: string; metrics?: string; notes?: string;
}
export interface PilotWorkspaceProps {
  strategy: Partial<GeneratedStrategy>; userInput: UserInput; savedStrategyId?: string;
  data: PilotWorkspaceData; activeSection?: string; balance?: number; readOnly?: boolean;
  onGenerate: (operation: WorkspaceOperation, payload: WorkspaceGenerationPayload) => Promise<WorkspaceGenerationResult>;
  onSaveVersion: (change: WorkspaceChange) => Promise<void>;
  onFeedback?: (feedback: ContentFeedback) => Promise<void>;
}
