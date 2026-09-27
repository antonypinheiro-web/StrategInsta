import type { UserInput } from '../types.ts';
import type { ApprovedAttachment, ProfileBaseline } from '../types/briefing.ts';

export type BriefingData = Omit<UserInput, 'files' | 'desiredPostingFrequency' | 'instagramProficiencyLevel'> & {
  desiredPostingFrequency: UserInput['desiredPostingFrequency'] | '';
  instagramProficiencyLevel: UserInput['instagramProficiencyLevel'] | '';
};

export const objectives = [
  { value: 'attract', label: 'Atrair potenciais clientes', description: 'Aumentar o alcance qualificado e atrair novas pessoas para o perfil.' },
  { value: 'leads', label: 'Gerar pedidos de orçamento', description: 'Atrair interessados com intenção de solicitar orçamento ou proposta.' },
  { value: 'sales', label: 'Vender uma oferta específica', description: 'Promover uma oferta, serviço ou produto com foco em conversão.' },
  { value: 'trust', label: 'Fortalecer a confiança na marca', description: 'Construir autoridade e credibilidade com conteúdo e relacionamento.' },
] as const;

export const emptyBriefing: BriefingData = {
  brandName: '', primaryObjective: '', successSignal: '', mainObstacle: '',
  niche: '', audience: '', username: '', goals: '', funnelFocus: 'balanced',
  brandVoice: '', productsAndServices: '', existingContentInsights: '',
  competitorsAndInspirations: '', contentPillars: '', desiredPostingFrequency: '',
  availableResources: '', instagramProficiencyLevel: '',
  businessStage: '', serviceArea: '', salesChannels: '', purchaseProcess: '',
  customerProblem: '', differentiators: '', availableProof: '', communicationRestrictions: '',
  conversionDestination: '', currentBio: '', weeklyTime: '', recordingComfort: '',
  capacityToServe: '', priceRange: '',
};

const datePattern = /^\d{4}-\d{2}-\d{2}$/;
const validDate = (value: unknown): value is string => typeof value === 'string' && datePattern.test(value)
  && Number.isFinite(Date.parse(value + 'T00:00:00Z')) && new Date(value + 'T00:00:00Z').toISOString().slice(0, 10) === value;
const metricKeys = ['followers', 'reach', 'profileVisits', 'websiteClicks', 'leads', 'sales'] as const;
export function normalizeBaseline(value: unknown): ProfileBaseline | undefined {
  if (!value || typeof value !== 'object') return undefined;
  const item = value as Record<string, unknown>;
  if (item.source !== 'manual' || !validDate(item.capturedAt)
    || typeof item.sourceDescription !== 'string' || !item.sourceDescription.trim()) return undefined;
  const metrics: ProfileBaseline['metrics'] = {};
  if (item.metrics && typeof item.metrics === 'object') for (const key of metricKeys) {
    const number = (item.metrics as Record<string, unknown>)[key];
    if (typeof number === 'number' && Number.isSafeInteger(number) && number >= 0) metrics[key] = number;
  }
  const periodStart = validDate(item.periodStart) ? item.periodStart : undefined;
  const periodEnd = validDate(item.periodEnd) ? item.periodEnd : undefined;
  if (!!periodStart !== !!periodEnd || (periodStart && periodEnd && periodStart > periodEnd)) return undefined;
  if (!periodStart && Object.keys(metrics).some((key) => key !== 'followers')) return undefined;
  return { source: 'manual', sourceDescription: item.sourceDescription.trim().slice(0, 500),
    capturedAt: item.capturedAt, periodStart, periodEnd,
    timezone: typeof item.timezone === 'string' ? item.timezone.slice(0, 100) : 'America/Sao_Paulo', metrics,
    notes: typeof item.notes === 'string' ? item.notes.slice(0, 2000) : undefined };
}

export function normalizeAttachmentReferences(value: unknown): ApprovedAttachment[] {
  if (!Array.isArray(value)) return [];
  return value.slice(0, 5).flatMap((item): ApprovedAttachment[] => {
    if (!item || typeof item !== 'object' || typeof item.id !== 'string' || typeof item.name !== 'string'
      || typeof item.summary !== 'string' || !item.summary.trim() || typeof item.storagePath !== 'string' || !item.storagePath
      || typeof item.sha256 !== 'string' || !/^[a-f0-9]{64}$/.test(item.sha256)
      || typeof item.reviewedAt !== 'string' || !Number.isFinite(Date.parse(item.reviewedAt))
      || !['pdf', 'docx', 'txt', 'jpeg', 'png', 'webp'].includes(item.kind)
      || !['text', 'ocr', 'manual'].includes(item.extraction) || !Number.isSafeInteger(item.size) || item.size <= 0) return [];
    const image = ['jpeg', 'png', 'webp'].includes(item.kind);
    if (item.size > (image ? 10 : 50) * 1024 * 1024) return [];
    return [{ id: item.id.slice(0, 100), name: item.name.slice(0, 255), summary: item.summary.trim().slice(0, 6000),
      storagePath: item.storagePath.slice(0, 1000), sha256: item.sha256, reviewedAt: item.reviewedAt,
      kind: item.kind, size: item.size, extraction: item.extraction, limited: item.limited === true,
      pages: Array.isArray(item.pages) ? item.pages.filter((n: unknown) => Number.isSafeInteger(n) && Number(n) > 0).slice(0, 100) : undefined,
      totalPages: Number.isSafeInteger(item.totalPages) && item.totalPages > 0 ? item.totalPages : undefined }];
  }).filter((item, index, all) => all.findIndex((other) => other.sha256 === item.sha256) === index);
}

export function normalizeBriefing(value: unknown): BriefingData {
  const data = { ...emptyBriefing };
  if (!value || typeof value !== 'object') return data;
  for (const key of Object.keys(data)) {
    const text = (value as Record<string, unknown>)[key];
    if (typeof text === 'string') (data as Record<string, unknown>)[key] = text.slice(0, 5000);
  }
  if (!['balanced', 'top', 'middle', 'bottom'].includes(data.funnelFocus)) data.funnelFocus = 'balanced';
  if (!['diariamente', '3x_semana', '2x_semana', '1x_semana', 'personalizado'].includes(data.desiredPostingFrequency)) data.desiredPostingFrequency = '';
  if (!['iniciante', 'intermediario', 'avancado'].includes(data.instagramProficiencyLevel)) data.instagramProficiencyLevel = '';
  if (!['attract', 'leads', 'sales', 'trust', 'custom', 'undecided'].includes(data.primaryObjective)) data.primaryObjective = data.goals.trim() ? 'custom' : '';
  const incoming = value as Record<string, unknown>;
  data.baseline = normalizeBaseline(incoming.baseline);
  data.attachments = normalizeAttachmentReferences(incoming.attachments);
  return data;
}

export function selectObjective(data: BriefingData, value: string): BriefingData {
  const option = objectives.find((item) => item.value === value);
  return { ...data, primaryObjective: value, goals: option?.label ?? (value === 'undecided'
    ? 'Objetivo ainda não definido. Apresente uma recomendação como hipótese para validar.'
    : data.primaryObjective === 'custom' ? data.goals : '') };
}

export function validateBriefingStep(data: BriefingData, step: number): Partial<Record<keyof BriefingData, string>> {
  const errors: Partial<Record<keyof BriefingData, string>> = {};
  if (step === 0) {
    if (!data.brandName?.trim() && !data.username.trim().replace(/^@+/, '').trim()) errors.brandName = 'Informe a marca ou o perfil do Instagram.';
    if (!data.niche.trim()) errors.niche = 'Informe o segmento do negócio.';
    if (!data.productsAndServices.trim()) errors.productsAndServices = 'Descreva o que a marca oferece.';
    if (!data.differentiators?.trim()) errors.differentiators = 'Conte o diferencial ou indique que precisa descobri-lo.';
  }
  if (step === 1) {
    if (!data.audience.trim()) errors.audience = 'Descreva o público ou indique que ainda não sabe.';
    if (!data.customerProblem?.trim()) errors.customerProblem = 'Conte qual problema resolve ou indique que ainda não sabe.';
    if (!data.mainObstacle?.trim()) errors.mainObstacle = 'Conte o obstáculo ou indique que ainda não sabe.';
  }
  if (step === 2) {
    if (!data.primaryObjective || !data.goals.trim()) errors.goals = 'Escolha ou descreva o objetivo, ou indique que ainda não sabe.';
    if (!data.conversionDestination?.trim()) errors.conversionDestination = 'Escolha o próximo passo ou peça uma sugestão.';
  }
  if (step === 3) {
    if (!data.weeklyTime?.trim() && !data.availableResources.trim()) errors.weeklyTime = 'Selecione o tempo disponível ou conte seus recursos.';
    if (!data.desiredPostingFrequency) errors.desiredPostingFrequency = 'Escolha uma frequência ou a opção de definir depois.';
    if (!data.instagramProficiencyLevel) errors.instagramProficiencyLevel = 'Selecione seu nível de experiência.';
  }
  return errors;
}

export function toStrategyInput(data: BriefingData): UserInput {
  const normalized = normalizeBriefing(data);
  for (let step = 0; step < 4; step++) {
    if (Object.keys(validateBriefingStep(normalized, step)).length) throw new Error('Revise as informações obrigatórias do briefing.');
  }
  if ((normalized.attachments ?? []).reduce((total, file) => total + file.size, 0) > 100 * 1024 * 1024) throw new Error('Os anexos excedem 100 MB por briefing.');
  if (JSON.stringify(normalized).length > 80_000) throw new Error('O briefing ficou longo demais. Reduza os textos opcionais ou os resumos dos anexos antes de gerar.');
  return { ...normalized, username: normalized.username.trim().replace(/^@+/, '').trim(),
    desiredPostingFrequency: normalized.desiredPostingFrequency as UserInput['desiredPostingFrequency'],
    instagramProficiencyLevel: normalized.instagramProficiencyLevel as UserInput['instagramProficiencyLevel'] };
}

const draftKey = (userId: string) => `strateginsta_briefing_v1:${userId}`;
export function readBriefingDraft(storage: Pick<Storage, 'getItem'>, userId?: string) {
  if (!userId) return null;
  try {
    const draft = JSON.parse(storage.getItem(draftKey(userId)) ?? 'null');
    if (draft?.version !== 1 || draft.userId !== userId || !draft.data || typeof draft.data !== 'object') return null;
    return { data: normalizeBriefing(draft.data), step: Number.isInteger(draft.step) && draft.step >= 0 && draft.step < 5 ? draft.step : 0 };
  } catch { return null; }
}

export function saveBriefingDraft(storage: Pick<Storage, 'setItem'>, userId: string, data: BriefingData, step: number) {
  if (!userId) throw new Error('Entre na sua conta para salvar o rascunho.');
  storage.setItem(draftKey(userId), JSON.stringify({ version: 1, userId, data: normalizeBriefing(data), step }));
}
