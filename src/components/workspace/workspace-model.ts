import { z } from 'zod';
import { awarenessLevels, contentPurposes } from '../../types/workspace.ts';
import type { PilotWorkspaceData, WorkspaceOperation, WorkspaceGenerationPayload, WorkspaceGenerationResult, StoriesDay, StoriesWeek, ContentOrigin, ContentIdea, ContentMatrix, StoryFrame, MonetizationAnalysis, BioOption, GeneratedContent } from '../../types/workspace.ts';

const text = z.string().trim().min(1).max(12000);
const optionalText = z.string().max(12000).optional();
const id = z.string().min(1).max(200);
const format = z.enum(['reel', 'carousel', 'static', 'stories']);
const awareness = z.enum(['unaware', 'problem', 'solution', 'offer', 'decision']);
const purpose = z.enum(['growth', 'engagement', 'authority', 'objection']);
const date = z.string().regex(/^\d{4}-\d{2}-\d{2}$/).refine(v => { const parsed = new Date(`${v}T12:00:00Z`); return !Number.isNaN(parsed.getTime()) && parsed.toISOString().slice(0, 10) === v; }, 'Data inválida');
const uniqueIds = (items: { id?: string }[]) => new Set(items.map(item => item.id)).size === items.length;
export const ideaSchema = z.object({ id, title: text, angle: text, format, briefingBasis: text, proofNeeded: optionalText, cta: optionalText, versionId: id.optional() }) as z.ZodType<ContentIdea>;
export const matrixSchema = z.object({ id, cells: z.array(z.object({ id, awareness, purpose, ideas: z.array(ideaSchema).max(30).refine(uniqueIds), rationale: optionalText }).refine(cell => cell.ideas.length > 0 || !!cell.rationale?.trim(), 'Célula vazia precisa de justificativa')).length(20) }).refine(matrix => new Set(matrix.cells.map(cell => `${cell.awareness}:${cell.purpose}`)).size === 20 && uniqueIds(matrix.cells), 'A matriz precisa das vinte células distintas') as z.ZodType<ContentMatrix>;
export const storySchema = z.object({ id, position: z.number().int().min(1).max(15), goal: z.enum(['retain', 'engage', 'convert']), narrative: text, scene: text, speech: z.string().max(12000), onScreen: z.string().max(1000), tool: text, cta: optionalText, feedConnection: optionalText, effort: optionalText, versionId: id.optional() }) as z.ZodType<StoryFrame>;
export const daySchema = z.object({ id, date, routine: z.string().max(3000), requestedCount: z.number().int().min(0).max(15), offerOrEvent: optionalText, restrictions: optionalText, stories: z.array(storySchema).max(15) }).refine(day => day.stories.length === day.requestedCount && uniqueIds(day.stories) && day.stories.every((story, index) => story.position === index + 1), 'A quantidade e a sequência precisam corresponder ao dia solicitado') as z.ZodType<StoriesDay>;
export const weekSchema = z.object({ id, weekStart: date, previousWeekId: id.optional(), continuationSummary: optionalText, executionFeedback: optionalText, days: z.array(daySchema).length(7) }).refine(week => uniqueIds(week.days) && week.days.every((day, index) => day.date === addDays(week.weekStart, index)), 'A semana precisa de sete dias consecutivos') as z.ZodType<StoriesWeek>;
export const monetizationSchema = z.object({ id, potential: text, basis: z.array(text).min(1).max(10), ideas: z.array(z.object({ id, title: text, offer: text, audience: text, basis: text, resources: text, risks: text, hypothesis: text })).length(3).refine(uniqueIds) }) as z.ZodType<MonetizationAnalysis>;
export const bioSchema = z.object({ id, name: z.string().max(64), text: text.refine(value => bioLength(value) <= 150, 'A bio excede 150 caracteres'), recommendation: optionalText, versionId: id.optional() }) as z.ZodType<BioOption>;
export const biosSchema = z.array(bioSchema).length(3).refine(uniqueIds) as z.ZodType<BioOption[]>;
export const originSchema = z.object({ kind: z.enum(['idea', 'story', 'day', 'week', 'bio', 'section']), id, cellId: id.optional(), weekId: id.optional(), dayId: id.optional(), awareness: awareness.optional(), purpose: purpose.optional() }) as z.ZodType<ContentOrigin>;
export const scriptSchema = z.object({ id, title: text, format, origin: originSchema, objective: text, cta: z.string().max(2000), blocks: z.array(z.object({ id, label: text, action: optionalText, speech: optionalText, onScreen: optionalText, text: optionalText })).min(1).max(30).refine(uniqueIds), caption: optionalText, note: optionalText, versionId: id.optional(), createdAt: z.string().optional() }) as z.ZodType<GeneratedContent>;

export function emptyWorkspace(): PilotWorkspaceData { return { schemaVersion: 1, selectedMonetizationIds: [], scripts: [] }; }
export function bioLength(value: string) { return Array.from(value).length; }
export function addDays(value: string, amount: number) { const day = new Date(`${value}T12:00:00Z`); day.setUTCDate(day.getUTCDate() + amount); return day.toISOString().slice(0, 10); }
export function draftWeek(weekStart: string, previousWeek?: StoriesWeek): StoriesWeek {
  return { id: crypto.randomUUID(), weekStart, previousWeekId: previousWeek?.id, days: Array.from({ length: 7 }, (_, index) => ({ id: crypto.randomUUID(), date: addDays(weekStart, index), routine: '', requestedCount: 5, stories: [] })) };
}
export function storiesCredits(days: Pick<StoriesDay, 'requestedCount'>[], scope: 'day' | 'week') {
  const total = days.reduce((sum, day) => sum + day.requestedCount, 0);
  return total === 0 ? 0 : Math.ceil(total / (scope === 'day' ? 5 : 35)) * (scope === 'day' ? 2 : 10);
}
export function visibleIdeas<T>(ideas: T[]) { return ideas.slice(-3); }
export function allCellKeys() { return awarenessLevels.flatMap(level => contentPurposes.map(item => `${level.id}:${item.id}`)); }

/** Apply only the requested scope. Generated data must pass structure and count validation. */
export function applyWorkspaceResult(data: PilotWorkspaceData, operation: WorkspaceOperation, payload: WorkspaceGenerationPayload, result: WorkspaceGenerationResult): PilotWorkspaceData {
  const parsedOutput = typeof result.output === 'string' && !['monetization_plan', 'section_regenerate'].includes(operation) ? parseJson(result.output) : result.output;
  const version = <T extends object>(value: T): T & { versionId?: string } => result.versionId ? { ...value, versionId: result.versionId } : value;
  const next: PilotWorkspaceData = { ...data };
  if (operation === 'matrix_generate') { const matrix = matrixSchema.parse(parsedOutput); next.matrix = { ...matrix, cells: matrix.cells.map(cell => ({ ...cell, ideas: cell.ideas.map(version) })) }; }
  else if (operation === 'monetization_analyze') {
    next.monetization = monetizationSchema.parse(parsedOutput);
    // Preserve the explicit selection so a new analysis cannot select different offers silently.
    next.staleSections = [...new Set([...(data.staleSections ?? []), 'monetizationSelection'])];
  } else if (operation === 'monetization_plan') {
    const selected = payload.selectedMonetizationIds ?? data.selectedMonetizationIds;
    if (!selected.length || selected.length > 3 || selected.some(value => !data.monetization?.ideas.some(idea => idea.id === value))) throw new Error('Selecione até três ideias válidas antes de desenvolver o plano.');
    next.monetizationPlan = text.max(40000).parse(parsedOutput);
    next.staleSections = (data.staleSections ?? []).filter(section => section !== 'monetizationPlan');
  } else if (operation === 'bio_generate') next.bios = biosSchema.parse(parsedOutput).map(version);
  else if (operation === 'stories_week') {
    const week = weekSchema.parse(parsedOutput);
    if (payload.week && (week.weekStart !== payload.week.weekStart || week.days.some((day, index) => day.requestedCount !== payload.week!.days[index].requestedCount))) throw new Error('A resposta não corresponde à semana e à quantidade solicitadas.');
    next.storiesWeek = { ...week, previousWeekId: payload.week?.previousWeekId ?? payload.previousWeek?.id ?? week.previousWeekId, days: week.days.map(day => ({ ...day, stories: day.stories.map(version) })) };
    next.storiesAgenda = next.storiesWeek;
  } else if (operation === 'stories_day') {
    const day = daySchema.parse(parsedOutput);
    const week = data.storiesWeek && (!payload.week || payload.week.id === data.storiesWeek.id) ? data.storiesWeek : payload.week;
    if (!week || !payload.day || !week.days.some(current => current.id === payload.day!.id) || day.date !== payload.day.date || day.requestedCount !== payload.day.requestedCount) throw new Error('A resposta não corresponde ao dia e à quantidade solicitados.');
    next.storiesWeek = { ...week, days: week.days.map(current => current.id === payload.day!.id ? { ...day, id: current.id, stories: day.stories.map(version) } : current) };
    const agenda = payload.week ?? week;
    next.storiesAgenda = { ...agenda, days: agenda.days.map(current => current.id === payload.day!.id ? next.storiesWeek!.days.find(generated => generated.id === current.id)! : current) };
  } else if (operation === 'content_script') {
    const script = version(scriptSchema.parse(parsedOutput));
    next.scripts = [...data.scripts, { ...script, origin: payload.origin ?? script.origin }];
  } else if (operation === 'idea_generate' || operation === 'format_variation') {
    const idea = version(ideaSchema.parse(parsedOutput));
    if (!data.matrix || !payload.cell || !data.matrix.cells.some(cell => cell.id === payload.cell!.id)) throw new Error('A célula de origem não está disponível.');
    next.matrix = { ...data.matrix, cells: data.matrix.cells.map(cell => cell.id === payload.cell!.id ? { ...cell, ideas: [...cell.ideas, idea] } : cell) };
  } else if (operation === 'item_refine') {
    return replaceWorkspaceItem(data, payload.origin, parsedOutput, result.versionId);
  } else if (operation === 'section_regenerate') {
    if (!payload.section) throw new Error('Escolha a seção a atualizar.');
    const content = text.max(40000).parse(parsedOutput);
    next.overrides = { ...data.overrides, [payload.section]: content };
    next.staleSections = (data.staleSections ?? []).filter(section => section !== payload.section);
  }
  const updatedSection: Partial<Record<WorkspaceOperation, string>> = { matrix_generate: 'contentTable', bio_generate: 'instagramBio', stories_week: 'storiesStrategy' };
  if (updatedSection[operation]) next.staleSections = (next.staleSections ?? []).filter(section => section !== updatedSection[operation]);
  return next;
}

function parseJson(value: string): unknown { try { return JSON.parse(value.replace(/^```(?:json)?\s*/i, '').replace(/\s*```$/, '').trim()); } catch { throw new Error('A resposta não trouxe a estrutura esperada. O conteúdo anterior foi preservado.'); } }
export function replaceWorkspaceItem(data: PilotWorkspaceData, origin: ContentOrigin | undefined, output: unknown, versionId?: string): PilotWorkspaceData {
  if (!origin) throw new Error('A origem do conteúdo é necessária.');
  const stamp = <T extends { id: string }>(value: T) => ({ ...value, id: origin.id, versionId });
  if (origin.kind === 'idea') {
    const idea = stamp(ideaSchema.parse(output));
    if (!data.matrix?.cells.some(cell => cell.id === origin.cellId && cell.ideas.some(item => item.id === origin.id))) throw new Error('Ideia de origem não encontrada.');
    return { ...data, matrix: { ...data.matrix, cells: data.matrix.cells.map(cell => cell.id === origin.cellId ? { ...cell, ideas: cell.ideas.map(item => item.id === origin.id ? idea : item) } : cell) } };
  }
  if (origin.kind === 'bio') {
    if (!data.bios?.some(bio => bio.id === origin.id)) throw new Error('Bio de origem não encontrada.');
    const bio = stamp(bioSchema.parse(output));
    return { ...data, bios: data.bios.map(item => item.id === origin.id ? bio : item) };
  }
  if (origin.kind === 'story') {
    const story = stamp(storySchema.parse(output));
    if (!data.storiesWeek?.days.some(day => day.id === origin.dayId && day.stories.some(item => item.id === origin.id))) throw new Error('Story de origem não encontrado.');
    return { ...data, storiesWeek: { ...data.storiesWeek, days: data.storiesWeek.days.map(day => day.id === origin.dayId ? { ...day, stories: day.stories.map(item => item.id === origin.id ? { ...story, position: item.position } : item) } : day) } };
  }
  const script = data.scripts.find(item => item.id === origin.id);
  if (script) return { ...data, scripts: data.scripts.map(item => item.id === script.id ? stamp(scriptSchema.parse(output)) : item) };
  throw new Error('Conteúdo de origem não encontrado.');
}
