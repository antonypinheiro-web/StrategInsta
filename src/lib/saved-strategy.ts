import { z } from 'zod';
import type { GeneratedStrategy, HistoryItem, UserInput } from '../types';

const stories = z.array(z.object({ dayOfWeek: z.string(), objective: z.string(), contentType: z.string(), example: z.string(), tips: z.string() }));
const contentItems = z.array(z.object({ type: z.string(), description: z.string(), example: z.string(), frequency: z.string() }));
const contentTable = z.object({ topOfFunnel: contentItems, middleOfFunnel: contentItems, bottomOfFunnel: contentItems });
export const calendarSchema = z.array(z.object({ day: z.number(), weekday: z.string(), contentType: z.string(), topic: z.string(), caption: z.string(), hashtags: z.array(z.string()), stories: z.array(z.string()).optional() }));
export const actionPlanSchema = z.array(z.object({ week: z.number(), tasks: z.array(z.object({ task: z.string(), description: z.string(), priority: z.enum(['high', 'medium', 'low']), completed: z.boolean().optional() })) }));
// Strategies can be saved part-way (e.g. only the profile, monetization and the workspace), so every section is optional.
const strategySchema = z.object({ idealCustomerProfile: z.string(), monetizationIdeas: z.string(), instagramBio: z.string(), storiesStrategy: stories, contentTable, editorialCalendar: calendarSchema, actionPlan: actionPlanSchema }).partial();
const historyItemSchema = z.object({ id: z.string(), title: z.string(), type: z.enum(['idealCustomerProfile', 'monetizationIdeas', 'instagramBio', 'storiesStrategy', 'contentTable', 'editorialCalendar', 'actionPlan', 'contentGenerator']), content: z.union([z.string(), stories, contentTable, calendarSchema, actionPlanSchema]), createdAt: z.coerce.date(), prompt: z.string().optional() });

export interface SavedStrategy {
  id: string;
  name: string;
  input: UserInput;
  strategy: Partial<GeneratedStrategy>;
  history: HistoryItem[];
  workspace?: import('../types/workspace').PilotWorkspaceData;
  businessId?: string;
  generationId?: string;
}

export function parseSavedStrategy(row: Record<string, unknown>, userId: string): SavedStrategy {
  if (row.user_id !== userId) throw new Error('Estratégia indisponível para esta conta.');
  const raw = row.generated_strategy && typeof row.generated_strategy === 'object' && !Array.isArray(row.generated_strategy) ? row.generated_strategy as Record<string, unknown> : undefined;
  const input = row.user_input;
  if (!raw || !input || typeof input !== 'object' || Array.isArray(input) || typeof row.id !== 'string' || typeof row.name !== 'string') {
    throw new Error('Esta estratégia tem dados incompletos. Contate o suporte para recuperá-la.');
  }
  // A malformed section is dropped instead of blocking the whole strategy; the rest still opens.
  const sections = Object.fromEntries(Object.entries(strategySchema.shape).flatMap(([key, schema]) => {
    const parsed = schema.safeParse(raw[key]);
    return parsed.success && parsed.data !== undefined ? [[key, parsed.data]] : [];
  })) as Partial<GeneratedStrategy>;
  const history = Array.isArray(row.history) ? row.history.flatMap(item => {
    const parsed = historyItemSchema.safeParse(item);
    return parsed.success ? [parsed.data as HistoryItem] : [];
  }) : [];
  const workspace = raw.pilotWorkspace && typeof raw.pilotWorkspace === 'object' && (raw.pilotWorkspace as Record<string, unknown>).schemaVersion === 1
    ? raw.pilotWorkspace as import('../types/workspace').PilotWorkspaceData : undefined;
  return { id: row.id, name: row.name, input: input as UserInput, strategy: sections, history, workspace,
    businessId: typeof raw.businessId === 'string' ? raw.businessId : undefined,
    generationId: typeof raw.generationId === 'string' ? raw.generationId : undefined };
}
