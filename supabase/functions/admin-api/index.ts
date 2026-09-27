import { serve } from 'https://deno.land/std@0.168.0/http/server.ts';
import { createClient } from 'https://esm.sh/@supabase/supabase-js@2';
import { AccessDeniedError, requireActiveAdmin } from '../_shared/admin-auth.ts';
import { listProviderModels, PilotError, runModel, TARGET_MODELS, validateModel } from '../_shared/pilot-models.ts';
import { object, uuid } from '../_shared/pilot-content.ts';

const SUPABASE_URL = Deno.env.get('SUPABASE_URL')!;
const SUPABASE_SERVICE_ROLE_KEY = Deno.env.get('SUPABASE_SERVICE_ROLE_KEY')!;

function createAdminClient() {
  return createClient(SUPABASE_URL, SUPABASE_SERVICE_ROLE_KEY);
}

const corsHeaders = {
  'Access-Control-Allow-Origin': '*',
  'Access-Control-Allow-Headers': 'authorization, x-client-info, apikey, content-type',
};

type AdminAction =
  | 'me'
  | 'overview'
  | 'listUsers'
  | 'createUser'
  | 'setUserBlocked'
  | 'setPlan'
  | 'grantCredits'
  | 'resetUsage'
  | 'listStrategies'
  | 'archiveStrategy'
  | 'listEvents'
  | 'listAuditLogs'
  | 'getAiConfig'
  | 'listAiModels'
  | 'testAiModel'
  | 'applyAiConfig'
  | 'rollbackAiConfig'
  | 'updateAdminNotes';

interface AdminRequestBody {
  action: AdminAction;
  payload?: Record<string, unknown>;
}

function json(data: unknown, status = 200) {
  return new Response(JSON.stringify(data), {
    status,
    headers: { ...corsHeaders, 'Content-Type': 'application/json' },
  });
}

function toInt(value: unknown, fallback: number) {
  const parsed = Number(value);
  return Number.isFinite(parsed) ? parsed : fallback;
}

function startDateFromRange(range: string | undefined) {
  const days = range === '7d' ? 7 : range === '90d' ? 90 : 30;
  const date = new Date();
  date.setDate(date.getDate() - days);
  return date.toISOString();
}

async function authenticate(req: Request, supabase: ReturnType<typeof createAdminClient>) {
  const authHeader = req.headers.get('Authorization');
  if (!authHeader) throw new AccessDeniedError('Nao autorizado');

  const token = authHeader.replace('Bearer ', '');
  const { data: { user }, error } = await supabase.auth.getUser(token);
  if (error || !user) throw new AccessDeniedError('Usuario invalido');
  return user;
}

async function ensureAdmin(supabase: ReturnType<typeof createAdminClient>, user: { id: string; email?: string }) {
  const { data: admin, error } = await supabase
    .from('admin_users')
    .select('user_id, email, role, active')
    .eq('user_id', user.id)
    .maybeSingle();

  if (error) throw error;
  // Membership is provisioned explicitly, never recreated during login.
  return requireActiveAdmin(admin, user.id);
}

async function logAdminAction(
  supabase: ReturnType<typeof createAdminClient>,
  adminUserId: string,
  action: string,
  metadata: Record<string, unknown> = {},
) {
  await supabase.from('admin_audit_logs').insert({
    admin_user_id: adminUserId,
    action,
    target_type: metadata.targetType as string | undefined,
    target_id: metadata.targetId ? String(metadata.targetId) : undefined,
    target_user_id: metadata.targetUserId as string | undefined,
    metadata,
  });
}

async function getPlanRows(supabase: ReturnType<typeof createAdminClient>, userIds: string[]) {
  if (userIds.length === 0) return new Map<string, Record<string, unknown>>();

  const { data } = await supabase
    .from('user_plans')
    .select('*')
    .in('user_id', userIds);

  return new Map((data ?? []).map((row: Record<string, unknown>) => [row.user_id as string, row]));
}

async function getExtraCreditsMap(supabase: ReturnType<typeof createAdminClient>, userIds: string[]) {
  if (userIds.length === 0) return new Map<string, number>();

  const { data } = await supabase
    .from('credit_grants')
    .select('user_id, amount, used_amount, expires_at')
    .in('user_id', userIds);

  const map = new Map<string, number>();
  const now = Date.now();
  for (const grant of data ?? []) {
    const expiresAt = grant.expires_at ? new Date(grant.expires_at as string).getTime() : null;
    if (expiresAt && expiresAt < now) continue;
    const remaining = Math.max(0, Number(grant.amount ?? 0) - Number(grant.used_amount ?? 0));
    map.set(grant.user_id as string, (map.get(grant.user_id as string) ?? 0) + remaining);
  }
  return map;
}

async function listUsers(supabase: ReturnType<typeof createAdminClient>, payload: Record<string, unknown> = {}) {
  const page = Math.max(1, toInt(payload.page, 1));
  const perPage = Math.min(100, Math.max(10, toInt(payload.perPage, 50)));
  const search = String(payload.search ?? '').trim().toLowerCase();

  const { data, error } = await supabase.auth.admin.listUsers({ page, perPage });
  if (error) throw error;

  let users = data.users ?? [];
  if (search) {
    users = users.filter((user) =>
      user.id.toLowerCase().includes(search) ||
      (user.email ?? '').toLowerCase().includes(search) ||
      JSON.stringify(user.user_metadata ?? {}).toLowerCase().includes(search)
    );
  }

  const userIds = users.map((user) => user.id);
  const plans = await getPlanRows(supabase, userIds);
  const credits = await getExtraCreditsMap(supabase, userIds);
  const { data: walletRows, error: walletError } = userIds.length
    ? await supabase.from('ai_wallets').select('user_id,balance,reserved').in('user_id', userIds)
    : { data: [], error: null };
  if (walletError) throw walletError;
  const wallets = new Map((walletRows ?? []).map(row => [row.user_id, { balance: row.balance, reserved: row.reserved, available: row.balance - row.reserved }]));

  const enriched = users.map((user) => {
    const plan = plans.get(user.id);
    const bannedUntil = 'banned_until' in user && typeof user.banned_until === 'string' ? user.banned_until : null;
    return {
      id: user.id,
      email: user.email,
      createdAt: user.created_at,
      lastSignInAt: user.last_sign_in_at,
      bannedUntil,
      userMetadata: user.user_metadata,
      planType: plan?.plan_type ?? 'free',
      strategiesUsed: plan?.strategies_used ?? 0,
      periodStart: plan?.period_start ?? null,
      isBlocked: Boolean(plan?.is_blocked) || (bannedUntil !== null && Date.parse(bannedUntil) > Date.now()),
      blockedReason: plan?.blocked_reason ?? null,
      adminNotes: plan?.admin_notes ?? '',
      extraCredits: credits.get(user.id) ?? 0,
      aiWallet: wallets.get(user.id) ?? null,
      stripeCustomerId: plan?.stripe_customer_id ?? null,
      stripeSubscriptionId: plan?.stripe_subscription_id ?? null,
    };
  });

  return { users: enriched, page, perPage, totalApprox: data.total };
}

async function overview(supabase: ReturnType<typeof createAdminClient>, adminUserId: string, payload: Record<string, unknown> = {}) {
  const range = String(payload.range ?? '30d');
  const since = startDateFromRange(range);

  const [usersRes, plansRes, strategiesRes, eventsRes, usageRes] = await Promise.all([
    supabase.auth.admin.listUsers({ page: 1, perPage: 1000 }),
    supabase.from('user_plans').select('*'),
    supabase.from('strategies').select('id, user_id, name, created_at, updated_at'),
    supabase.from('usage_events').select('*').gte('created_at', since).order('created_at', { ascending: false }).limit(500),
    supabase.rpc('pilot_admin_usage_metrics', { p_admin: adminUserId, p_since: since }),
  ]);

  if (usersRes.error) throw usersRes.error;
  for (const response of [plansRes, strategiesRes, eventsRes, usageRes]) {
    if (response.error) throw response.error;
  }

  const users = usersRes.data.users ?? [];
  const plans = plansRes.data ?? [];
  const strategies = strategiesRes.data ?? [];
  const events = eventsRes.data ?? [];
  const usage = object(usageRes.data ?? {});

  const paidPlans = plans.filter((plan: Record<string, unknown>) => plan.plan_type && plan.plan_type !== 'free');
  const planCounts: Record<string, number> = plans.reduce((acc: Record<string, number>, plan: Record<string, unknown>) => {
    const key = String(plan.plan_type ?? 'free');
    acc[key] = (acc[key] ?? 0) + 1;
    return acc;
  }, {});


  const eventCounts = events.reduce((acc: Record<string, number>, event: Record<string, unknown>) => {
    const key = String(event.event_name);
    acc[key] = (acc[key] ?? 0) + 1;
    return acc;
  }, {});

  return {
    metrics: {
      totalUsers: users.length,
      newUsers: users.filter((user) => new Date(user.created_at).toISOString() >= since).length,
      totalStrategies: strategies.length,
      strategiesInRange: strategies.filter((strategy: Record<string, unknown>) => String(strategy.created_at) >= since).length,
      ...usage,
      freeToPaidRate: users.length ? Math.round((paidPlans.length / users.length) * 1000) / 10 : 0,
      estimatedMrr: null,
      mostUsedPlan: Object.entries(planCounts).sort((a, b) => b[1] - a[1])[0]?.[0] ?? 'free',
      blockedByLimit: eventCounts.quota_exceeded ?? 0,
    },
    planCounts,
    eventCounts,
    recentEvents: events.slice(0, 25),
    recentStrategies: strategies.slice(0, 25),
  };
}

async function createUser(supabase: ReturnType<typeof createAdminClient>, payload: Record<string, unknown>) {
  const email = String(payload.email ?? '').trim();
  const password = String(payload.password ?? '').trim();
  const planType = String(payload.planType ?? 'free');
  if (!email || !password) throw new Error('Email e senha sao obrigatorios');

  const { data, error } = await supabase.auth.admin.createUser({
    email,
    password,
    email_confirm: true,
    user_metadata: { created_from_admin: true },
  });
  if (error) throw error;

  await supabase.from('user_plans').upsert({
    user_id: data.user.id,
    plan_type: planType,
    strategies_used: 0,
    period_start: new Date().toISOString(),
  }, { onConflict: 'user_id' });

  return { user: { id: data.user.id, email: data.user.email } };
}

async function setPlan(supabase: ReturnType<typeof createAdminClient>, payload: Record<string, unknown>) {
  const userId = String(payload.userId ?? '');
  const planType = String(payload.planType ?? 'free');
  if (!userId) throw new Error('userId obrigatorio');

  const { error } = await supabase.from('user_plans').upsert({
    user_id: userId,
    plan_type: planType,
    period_start: new Date().toISOString(),
  }, { onConflict: 'user_id' });
  if (error) throw error;
  return { ok: true };
}

async function grantCredits(supabase: ReturnType<typeof createAdminClient>, adminUserId: string, payload: Record<string, unknown>) {
  const userId = String(payload.userId ?? '');
  const amount = toInt(payload.amount, 0);
  const reason = String(payload.reason ?? 'Credito manual admin');
  if (!userId || amount <= 0) throw new Error('userId e amount valido sao obrigatorios');

  if (payload.expiresAt) throw new PilotError('PILOT_GRANTS_DO_NOT_EXPIRE');
  const { data, error } = await supabase.rpc('pilot_admin_credits', {
    p_admin: adminUserId, p_user: uuid(userId), p_amount: amount,
    p_reference: `admin-grant:${uuid(payload.idempotencyKey)}`, p_reason: reason, p_reset: false,
  });
  if (error) throw error;
  return { wallet: data };
}

async function setUserBlocked(supabase: ReturnType<typeof createAdminClient>, payload: Record<string, unknown>) {
  const userId = String(payload.userId ?? '');
  const blocked = Boolean(payload.blocked);
  const reason = String(payload.reason ?? 'Bloqueio manual admin');
  if (!userId) throw new Error('userId obrigatorio');

  await supabase.from('user_plans').upsert({
    user_id: userId,
    is_blocked: blocked,
    blocked_reason: blocked ? reason : null,
    blocked_at: blocked ? new Date().toISOString() : null,
  }, { onConflict: 'user_id' });

  const { error } = await supabase.auth.admin.updateUserById(userId, {
    ban_duration: blocked ? '876000h' : 'none',
  });
  if (error) throw error;
  return { ok: true };
}

async function resetUsage(supabase: ReturnType<typeof createAdminClient>, adminUserId: string, payload: Record<string, unknown>) {
  const userId = String(payload.userId ?? '');
  if (!userId) throw new Error('userId obrigatorio');

  const { data, error } = await supabase.rpc('pilot_admin_credits', {
    p_admin: adminUserId, p_user: uuid(userId), p_amount: toInt(payload.amount, 30),
    p_reference: `admin-reset:${uuid(payload.idempotencyKey)}`, p_reason: 'Reposição explícita da carteira piloto', p_reset: true,
  });
  if (error) throw error;
  return { ok: true, wallet: data };
}

async function getAiConfig(supabase: ReturnType<typeof createAdminClient>) {
  const [{ data: state, error: stateError }, { data: revisions, error: revisionError }, { data: tests, error: testError }, { data: health, error: healthError }] = await Promise.all([
    supabase.from('ai_model_state').select('config_id').eq('singleton', true).single(),
    supabase.from('ai_model_configs').select('*').order('id', { ascending: false }).limit(20),
    supabase.from('ai_model_tests').select('*').order('created_at', { ascending: false }).limit(30),
    supabase.from('ai_model_health').select('*'),
  ]);
  if (stateError || revisionError || testError || healthError) throw new PilotError('PERSISTENCE_FAILED', 500);
  return { active: (revisions ?? []).find(row => row.id === state?.config_id) ?? null, revisions, tests, health, suggested: TARGET_MODELS };
}

async function testAiModel(supabase: ReturnType<typeof createAdminClient>, adminUserId: string, payload: Record<string, unknown>) {
  const candidate = validateModel(payload.candidate);
  let success = false; let code: string | null = null; let metadata: Record<string, unknown> = {};
  try {
    const catalogue = await listProviderModels(candidate.provider, Deno.env.get);
    if (!catalogue.includes(candidate.model)) throw new PilotError('MODEL_NOT_IN_ACCOUNT_CATALOG');
    const response = await runModel(candidate, 'Retorne apenas JSON válido: {"ok":true}. Este é um teste técnico sem dados de usuário.', 'JSON de confirmação.', Deno.env.get, { maxOutputTokens: 2048 });
    const parsed = JSON.parse(response.text);
    if (parsed.ok !== true) throw new PilotError('MODEL_TEST_INVALID_OUTPUT');
    const { text: discardedText, ...usage } = response;
    metadata = usage; success = true;
  } catch (error) { code = error instanceof PilotError ? error.code : 'MODEL_TEST_FAILED'; }
  const { data, error } = await supabase.from('ai_model_tests').insert({ admin_user_id: adminUserId, candidate, success, code, metadata }).select('*').single();
  if (error) throw new PilotError('PERSISTENCE_FAILED', 500);
  if (success) {
    const { error: healthError } = await supabase.from('ai_model_health').upsert({ provider: candidate.provider, model: candidate.model, code: null, unavailable_until: null, updated_at: new Date().toISOString() });
    if (healthError) throw new PilotError('PERSISTENCE_FAILED', 500);
  }
  return { test: data, success, code };
}

async function applyAiConfig(supabase: ReturnType<typeof createAdminClient>, adminUserId: string, payload: Record<string, unknown>, rollback = false) {
  let models: unknown = payload.models; let rollbackOf: number | null = null;
  if (rollback) {
    rollbackOf = Number(payload.revision);
    if (!Number.isSafeInteger(rollbackOf) || rollbackOf < 1) throw new PilotError('INVALID_REVISION');
    const { data, error } = await supabase.from('ai_model_configs').select('models').eq('id', rollbackOf).single();
    if (error || !data) throw new PilotError('INVALID_REVISION');
    models = data.models;
  }
  if (!Array.isArray(models) || models.length < 1 || models.length > 4) throw new PilotError('INVALID_CONFIG');
  const validated = models.map(validateModel);
  if (new Set(validated.map(m => `${m.provider}:${m.model}`)).size !== validated.length) throw new PilotError('DUPLICATE_MODEL');
  const { data, error } = await supabase.rpc('pilot_apply_model_config', { p_admin: adminUserId, p_models: validated, p_rollback: rollbackOf });
  if (error) throw new PilotError(error.message === 'MODEL_TEST_REQUIRED' ? 'MODEL_TEST_REQUIRED' : 'CONFIG_APPLY_FAILED', 409);
  return data;
}

async function updateAdminNotes(supabase: ReturnType<typeof createAdminClient>, payload: Record<string, unknown>) {
  const userId = String(payload.userId ?? '');
  const notes = String(payload.notes ?? '');
  if (!userId) throw new Error('userId obrigatorio');

  const { error } = await supabase.from('user_plans').upsert({
    user_id: userId,
    admin_notes: notes,
  }, { onConflict: 'user_id' });
  if (error) throw error;
  return { ok: true };
}

async function listStrategies(supabase: ReturnType<typeof createAdminClient>, payload: Record<string, unknown> = {}) {
  const search = String(payload.search ?? '').trim();
  const status = String(payload.status ?? 'active');
  const planType = String(payload.planType ?? 'all');
  const since = startDateFromRange(String(payload.range ?? '30d'));

  let query = supabase
    .from('strategies')
    .select('id, user_id, name, user_input, generated_strategy, created_at, updated_at')
    .gte('created_at', since)
    .order('created_at', { ascending: false })
    .limit(200);

  if (status === 'archived') query = query.eq('generated_strategy->>archived', 'true');
  if (search) query = query.or(`name.ilike.%${search}%,user_id.eq.${search}`);

  const { data, error } = await query;
  if (error) throw error;

  const userIds = Array.from(new Set((data ?? []).map((row: Record<string, unknown>) => row.user_id as string)));
  const plans = await getPlanRows(supabase, userIds);

  const rows = (data ?? []).filter((row: Record<string, unknown>) => {
    if (planType === 'all') return true;
    return plans.get(row.user_id as string)?.plan_type === planType;
  }).map((row: Record<string, unknown>) => ({
    ...row,
    planType: plans.get(row.user_id as string)?.plan_type ?? 'free',
  }));

  return { strategies: rows };
}

async function archiveStrategy(supabase: ReturnType<typeof createAdminClient>, payload: Record<string, unknown>) {
  const strategyId = String(payload.strategyId ?? '');
  const archived = Boolean(payload.archived);
  if (!strategyId) throw new Error('strategyId obrigatorio');

  const { data: existing, error: fetchError } = await supabase
    .from('strategies')
    .select('generated_strategy')
    .eq('id', strategyId)
    .single();
  if (fetchError) throw fetchError;

  const generated = (existing?.generated_strategy ?? {}) as Record<string, unknown>;
  const { error } = await supabase
    .from('strategies')
    .update({ generated_strategy: { ...generated, archived } })
    .eq('id', strategyId);
  if (error) throw error;
  return { ok: true };
}

async function listEvents(supabase: ReturnType<typeof createAdminClient>, payload: Record<string, unknown> = {}) {
  const since = startDateFromRange(String(payload.range ?? '30d'));
  const eventName = String(payload.eventName ?? 'all');
  let query = supabase.from('usage_events').select('*').gte('created_at', since).order('created_at', { ascending: false }).limit(300);
  if (eventName !== 'all') query = query.eq('event_name', eventName);
  const { data, error } = await query;
  if (error) throw error;
  return { events: data ?? [] };
}

async function listAuditLogs(supabase: ReturnType<typeof createAdminClient>) {
  const { data, error } = await supabase
    .from('admin_audit_logs')
    .select('*')
    .order('created_at', { ascending: false })
    .limit(200);
  if (error) throw error;
  return { logs: data ?? [] };
}

serve(async (req) => {
  if (req.method === 'OPTIONS') return new Response('ok', { headers: corsHeaders });
  if (req.method !== 'POST') return json({ error: 'Metodo nao permitido' }, 405);

  const supabase = createClient(SUPABASE_URL, SUPABASE_SERVICE_ROLE_KEY);

  try {
    const user = await authenticate(req, supabase);
    const admin = await ensureAdmin(supabase, user);
    const { action, payload = {} } = (await req.json()) as AdminRequestBody;

    let result: unknown;
    switch (action) {
      case 'me':
        result = { admin };
        break;
      case 'overview':
        result = await overview(supabase, user.id, payload);
        break;
      case 'listUsers':
        result = await listUsers(supabase, payload);
        break;
      case 'createUser':
        result = await createUser(supabase, payload);
        await logAdminAction(supabase, user.id, action, { targetType: 'user', email: payload.email });
        break;
      case 'setUserBlocked':
        result = await setUserBlocked(supabase, payload);
        await logAdminAction(supabase, user.id, action, { targetType: 'user', targetUserId: payload.userId, blocked: payload.blocked });
        break;
      case 'setPlan':
        result = await setPlan(supabase, payload);
        await logAdminAction(supabase, user.id, action, { targetType: 'user_plan', targetUserId: payload.userId, planType: payload.planType });
        break;
      case 'grantCredits':
        result = await grantCredits(supabase, user.id, payload);
        await logAdminAction(supabase, user.id, action, { targetType: 'credit_grant', targetUserId: payload.userId, amount: payload.amount });
        break;
      case 'resetUsage':
        result = await resetUsage(supabase, user.id, payload);
        await logAdminAction(supabase, user.id, action, { targetType: 'user_plan', targetUserId: payload.userId });
        break;
      case 'updateAdminNotes':
        result = await updateAdminNotes(supabase, payload);
        await logAdminAction(supabase, user.id, action, { targetType: 'user_plan', targetUserId: payload.userId });
        break;
      case 'listStrategies':
        result = await listStrategies(supabase, payload);
        break;
      case 'archiveStrategy':
        result = await archiveStrategy(supabase, payload);
        await logAdminAction(supabase, user.id, action, { targetType: 'strategy', targetId: payload.strategyId, archived: payload.archived });
        break;
      case 'listEvents':
        result = await listEvents(supabase, payload);
        break;
      case 'listAuditLogs':
        result = await listAuditLogs(supabase);
        break;
      case 'getAiConfig':
        result = await getAiConfig(supabase);
        break;
      case 'listAiModels': {
        const provider = payload.provider;
        if (provider !== 'openai' && provider !== 'gemini') throw new PilotError('INVALID_PROVIDER');
        result = { provider, models: await listProviderModels(provider, Deno.env.get) };
        break;
      }
      case 'testAiModel':
        result = await testAiModel(supabase, user.id, payload);
        break;
      case 'applyAiConfig':
        result = await applyAiConfig(supabase, user.id, payload);
        break;
      case 'rollbackAiConfig':
        result = await applyAiConfig(supabase, user.id, payload, true);
        break;
      default:
        throw new Error('Acao admin invalida');
    }

    return json(result);
  } catch (err) {
    console.error('[admin-api]', err instanceof PilotError ? err.code : 'ADMIN_REQUEST_FAILED');
    if (err instanceof AccessDeniedError) return json({ error: err.message }, 403);
    if (err instanceof PilotError) return json({ error: 'Não foi possível concluir a operação administrativa.', code: err.code }, err.status);
    return json({ error: 'Nao foi possivel concluir a operacao administrativa.' }, 500);
  }
});
