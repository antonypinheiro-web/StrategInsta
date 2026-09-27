import { supabase } from '@/integrations/supabase/client';
import type { UserInput, GeneratedStrategy } from '@/types';
import type { PilotWorkspaceData, WorkspaceOperation, WorkspaceGenerationPayload } from '@/types/workspace';

export interface Wallet { balance: number; reserved: number; available: number; allowance?: number; }
export interface PilotOutput { strategy: Partial<GeneratedStrategy>; workspace: PilotWorkspaceData; }
export interface GenerationRecord {
  id: string; idempotency_key: string; business_id: string; strategy_id?: string; operation: string;
  status: 'reserved'|'processing'|'awaiting_input'|'completed'|'failed'|'canceled';
  input: UserInput; parameters: Record<string, unknown>; output: unknown; credits: number;
  created_at: string; updated_at: string; versionId?: string; error_code?: string;
  metadata: Record<string, unknown>; provider?: string; model?: string;
}
export interface RevisionRecord { id: string; business_id: string; strategy_id?: string; generation_id?: string; kind: string; title: string; content: unknown; created_at: string; }
export interface LedgerRecord { id: string; generation_id?: string; kind: string; amount: number; balance_after: number; reserved_after: number; created_at: string; }
export interface GenerationResponse { generation: GenerationRecord; wallet: Wallet; versionId?: string; }
export interface GenerationRequest { operation: string; idempotencyKey: string; businessId: string; strategyId?: string; input: UserInput; parameters: Record<string, unknown>; parentGenerationId?: string; retry?: boolean; }
export interface HistoryRequest {
  businessId?: string; generationId?: string; limit?: number; offset?: number;
  operation?: string; status?: GenerationRecord['status']; from?: string; to?: string;
}
export interface HistoryResponse {
  generations: GenerationRecord[]; revisions: RevisionRecord[]; ledger: LedgerRecord[];
  feedback?: { version_id: string; rating: string }[]; feedbackScope?: 'page' | 'recent';
  page?: number; pageSize?: number; total?: number; revisionsTotal?: number; ledgerTotal?: number; hasMore?: boolean;
}

const messages: Record<string, string> = {
  AUTH_REQUIRED: 'Sua sessão expirou. Entre novamente para continuar; seu conteúdo foi preservado.',
  INSUFFICIENT_CREDITS: 'Saldo insuficiente. Seu rascunho foi preservado.', QUOTA_EXCEEDED: 'Saldo insuficiente. Seu rascunho foi preservado.',
  MODEL_CONFIG_REQUIRED: 'A configuração de IA precisa ser testada e ativada pelo administrador.',
  MODEL_CONFIG_MISSING: 'A configuração de IA precisa ser testada e ativada pelo administrador.', MODEL_UNAVAILABLE: 'O modelo não está disponível. O administrador pode revisar a configuração.',
  PROVIDER_KEY_MISSING: 'O provedor de IA ainda precisa ser configurado no servidor.', GENERATION_BUSY: 'Esta geração ainda está em andamento. Consulte o histórico antes de tentar novamente.',
  IN_PROGRESS: 'Esta geração ainda está em andamento. Consulte o histórico antes de tentar novamente.', IDEMPOTENCY_CONFLICT: 'A tentativa mudou de contexto. Abra o histórico para recuperar a versão anterior.',
};
export class PilotRequestError extends Error { constructor(public code: string) { super(messages[code] ?? `Não foi possível concluir (${code}). Seu conteúdo anterior foi preservado.`); } }

export async function invokePilot<T>(action: string, payload: object = {}): Promise<T> {
  const { data: { session }, error: sessionError } = await supabase.auth.getSession();
  if (sessionError || !session?.access_token) throw new PilotRequestError('AUTH_REQUIRED');
  const { data, error } = await supabase.functions.invoke('call-ai', {
    body: { action, payload }, headers: { Authorization: `Bearer ${session.access_token}` },
  });
  if (error) {
    let code = 'SERVICE_UNAVAILABLE';
    if ('context' in error && error.context instanceof Response) {
      try { const body = await error.context.json(); code = typeof body.code === 'string' ? body.code : code; } catch { /* No server detail is exposed. */ }
    }
    throw new PilotRequestError(code);
  }
  if (data?.error || data?.code) throw new PilotRequestError(data.code ?? 'REQUEST_FAILED');
  if (action === 'generate' && data?.pending) throw new PilotRequestError('GENERATION_BUSY');
  if (action === 'generate' && ['failed', 'canceled'].includes(data?.generation?.status)) throw new PilotRequestError(data.generation.error_code ?? 'REQUEST_FAILED');
  return data as T;
}

export const pilotService = {
  wallet: () => invokePilot<{ wallet: Wallet }>('wallet'),
  quote: (request: GenerationRequest) => invokePilot<{ credits: number; wallet: Wallet; availableAfter: number }>('quote', request),
  generate: (request: GenerationRequest) => invokePilot<GenerationResponse>('generate', request),
  cancel: (generationId: string) => invokePilot<{ wallet: Wallet }>('cancel', { generationId }),
  history: (payload: HistoryRequest = {}) => invokePilot<HistoryResponse>('history', payload),
  saveRevision: (payload: object) => invokePilot<{ revision: RevisionRecord }>('saveRevision', payload),
  feedback: (payload: object) => invokePilot<{ ok: boolean }>('feedback', payload),
};

export function workspaceRequest(operation: WorkspaceOperation, payload: WorkspaceGenerationPayload,
  context: { businessId: string; strategyId?: string; idempotencyKey: string; parentGenerationId?: string }): GenerationRequest {
  const map: Record<WorkspaceOperation, string> = { matrix_generate: 'section', idea_generate: 'idea', format_variation: 'variation', item_refine: 'refine_short', content_script: 'script', stories_day: 'stories_day', stories_week: 'stories_week', monetization_analyze: 'section', monetization_plan: 'monetization_plan', bio_generate: 'section', section_regenerate: 'section' };
  const section = operation === 'matrix_generate' ? 'contentTable' : operation === 'monetization_analyze' ? 'monetizationIdeas' : operation === 'bio_generate' ? 'instagramBio' : payload.section;
  const { userInput, ...parameters } = payload;
  return { ...context, operation: map[operation], input: userInput, parameters: { ...parameters, ...(section ? { section } : {}) } };
}

export function businessIdForAccount(userId: string): string {
  const key = `strateginsta:business:${userId}`;
  const stored = localStorage.getItem(key);
  if (stored && /^[0-9a-f-]{36}$/i.test(stored)) return stored;
  // The pilot has one business per account. A stable default works across devices;
  // historical records can still explicitly restore their original business ID.
  const id = userId; localStorage.setItem(key, id); return id;
}
