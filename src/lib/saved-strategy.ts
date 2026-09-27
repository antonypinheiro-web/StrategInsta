import { z } from 'zod';
import type { GeneratedStrategy, HistoryItem, UserInput } from '../types';

const stories = z.array(z.object({ dayOfWeek: z.string(), objective: z.string(), contentType: z.string(), example: z.string(), tips: z.string() }));
const contentItems = z.array(z.object({ type: z.string(), description: z.string(), example: z.string(), frequency: z.string() }));
const contentTable = z.object({ topOfFunnel: contentItems, middleOfFunnel: contentItems, bottomOfFunnel: contentItems });
const calendar = z.array(z.object({ day: z.number(), weekday: z.string(), contentType: z.string(), topic: z.string(), caption: z.string(), hashtags: z.array(z.string()), stories: z.array(z.string()).optional() }));
const actionPlan = z.array(z.object({ week: z.number(), tasks: z.array(z.object({ task: z.string(), description: z.string(), priority: z.enum(['high', 'medium', 'low']), completed: z.boolean().optional() })) }));
const strategySchema = z.object({ idealCustomerProfile: z.string(), monetizationIdeas: z.string(), instagramBio: z.string(), storiesStrategy: stories, contentTable, editorialCalendar: calendar, actionPlan });
const historyItemSchema = z.object({ id: z.string(), title: z.string(), type: z.enum(['idealCustomerProfile', 'monetizationIdeas', 'instagramBio', 'storiesStrategy', 'contentTable', 'editorialCalendar', 'actionPlan', 'contentGenerator']), content: z.union([z.string(), stories, contentTable, calendar, actionPlan]), createdAt: z.coerce.date(), prompt: z.string().optional() });

export interface SavedStrategy {
  id: string;
  name: string;
  input: UserInput;
  strategy: GeneratedStrategy;
  history: HistoryItem[];
  workspace?: import('../types/workspace').PilotWorkspaceData;
  businessId?: string;
  generationId?: string;
}

export function parseSavedStrategy(row: Record<string, unknown>, userId: string): SavedStrategy {
  if (row.user_id !== userId) throw new Error('Estratégia indisponível para esta conta.');
  const strategy = strategySchema.safeParse(row.generated_strategy);
  const input = row.user_input;
  if (!strategy.success || !input || typeof input !== 'object' || Array.isArray(input) || typeof row.id !== 'string' || typeof row.name !== 'string') {
    throw new Error('Esta estratégia tem dados incompletos. Contate o suporte para recuperá-la.');
  }
  const history = Array.isArray(row.history) ? row.history.flatMap(item => {
    const parsed = historyItemSchema.safeParse(item);
    return parsed.success ? [parsed.data as HistoryItem] : [];
  }) : [];
  const raw = row.generated_strategy as Record<string, unknown>;
  const workspace = raw.pilotWorkspace && typeof raw.pilotWorkspace === 'object' && (raw.pilotWorkspace as Record<string, unknown>).schemaVersion === 1
    ? raw.pilotWorkspace as import('../types/workspace').PilotWorkspaceData : undefined;
  return { id: row.id, name: row.name, input: input as UserInput, strategy: strategy.data as GeneratedStrategy, history, workspace,
    businessId: typeof raw.businessId === 'string' ? raw.businessId : undefined,
    generationId: typeof raw.generationId === 'string' ? raw.generationId : undefined };
}
