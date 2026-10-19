import React, { useCallback, useEffect, useMemo, useRef, useState } from 'react';
import { Navigate } from 'react-router-dom';
import {
  Activity,
  BarChart3,
  Coins,
  Download,
  FileText,
  LayoutDashboard,
  MessageSquare,
  Loader2,
  Lock,
  RefreshCw,
  Search,
  Settings,
  Shield,
  SlidersHorizontal,
  UserPlus,
  Users,
} from 'lucide-react';
import { toast } from 'sonner';
import { Button } from '@/components/ui/button';
import { Badge } from '@/components/ui/badge';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Input } from '@/components/ui/input';
import { Textarea } from '@/components/ui/textarea';
import { useSession } from '@/components/SessionContextProvider';
import { adminService } from '@/services/adminService';
import { AccountViewSwitch } from '@/components/AccountViewSwitch';
import { AdminModelSettings } from '@/components/AdminModelSettings';
import { useAskDialog } from '@/components/AskDialog';
import { AdminFeedbackTable } from '@/components/AdminFeedbackTable';
import type {
  AdminAuditLogRow,
  AdminOverview,
  AdminRange,
  AdminStrategyRow,
  AdminUserRow,
  AdminCreditGrant,
  AdminCreditReset,
  UsageEventRow,
} from '@/types/admin';

const planLabels: Record<string, string> = {
  free: 'Free',
  individual: 'Individual',
  professional: 'Professional',
  agency: 'Agency',
  all: 'Todos',
};

const navItems = [
  { id: 'overview', label: 'Visão Geral', icon: LayoutDashboard },
  { id: 'users', label: 'Usuários', icon: Users },
  { id: 'strategies', label: 'Estratégias', icon: FileText },
  { id: 'events', label: 'Eventos', icon: Activity },
  { id: 'feedback', label: 'Feedbacks', icon: MessageSquare },
  { id: 'logs', label: 'Logs', icon: Shield },
  { id: 'settings', label: 'Configurações', icon: Settings },
] as const;

type AdminSection = typeof navItems[number]['id'];
type CreditAttempt = { action: 'grantCredits'; payload: AdminCreditGrant; key: string } | { action: 'resetUsage'; payload: AdminCreditReset; key: string };
const isCreditAttempt = (value: unknown): value is CreditAttempt => {
  if (!value || typeof value !== 'object') return false;
  const item = value as Partial<CreditAttempt>;
  return typeof item.key === 'string' && /^[a-f0-9-]{36}$/i.test(item.key) && typeof item.payload?.userId === 'string'
    && (item.action === 'resetUsage' || item.action === 'grantCredits' && Number.isSafeInteger(item.payload.amount) && item.payload.amount > 0);
};

function formatDate(value?: string | null) {
  if (!value) return 'Não informado';
  return new Date(value).toLocaleString('pt-BR', { dateStyle: 'short', timeStyle: 'short' });
}

function toCurrency(value: number) {
  return value.toLocaleString('pt-BR', { style: 'currency', currency: 'BRL' });
}

function exportCsv(filename: string, rows: Record<string, unknown>[]) {
  const headers = Array.from(rows.reduce((set, row) => {
    Object.keys(row).forEach((key) => set.add(key));
    return set;
  }, new Set<string>()));

  const escapeCell = (value: unknown) => {
    const text = typeof value === 'object' && value !== null ? JSON.stringify(value) : String(value ?? '');
    return `"${text.replace(/"/g, '""')}"`;
  };

  const csv = [headers.join(','), ...rows.map((row) => headers.map((header) => escapeCell(row[header])).join(','))].join('\n');
  const blob = new Blob([csv], { type: 'text/csv;charset=utf-8' });
  const url = URL.createObjectURL(blob);
  const link = document.createElement('a');
  link.href = url;
  link.download = filename;
  document.body.appendChild(link);
  link.click();
  document.body.removeChild(link);
  URL.revokeObjectURL(url);
}

const MetricCard: React.FC<{ title: string; value: string | number; hint?: string; icon: React.ReactNode }> = ({ title, value, hint, icon }) => (
  <Card className="rounded-lg">
    <CardContent className="p-4">
      <div className="flex items-start justify-between gap-3">
        <div>
          <p className="text-xs font-medium text-muted-foreground">{title}</p>
          <p className="mt-1 text-2xl font-bold text-foreground">{value}</p>
          {hint && <p className="mt-1 text-xs text-muted-foreground">{hint}</p>}
        </div>
        <div className="rounded-md bg-primary/10 p-2 text-primary">{icon}</div>
      </div>
    </CardContent>
  </Card>
);

const Admin: React.FC = () => {
  const { user, isLoading: sessionLoading } = useSession();
  const [isCheckingAdmin, setIsCheckingAdmin] = useState(true);
  const [isAdmin, setIsAdmin] = useState(false);
  const [activeSection, setActiveSection] = useState<AdminSection>('overview');
  const [range, setRange] = useState<AdminRange>('30d');
  const [planFilter, setPlanFilter] = useState('all');
  const [statusFilter, setStatusFilter] = useState('active');
  const [search, setSearch] = useState('');
  const [isLoading, setIsLoading] = useState(false);
  const [overview, setOverview] = useState<AdminOverview | null>(null);
  const [users, setUsers] = useState<AdminUserRow[]>([]);
  const [strategies, setStrategies] = useState<AdminStrategyRow[]>([]);
  const [events, setEvents] = useState<UsageEventRow[]>([]);
  const [logs, setLogs] = useState<AdminAuditLogRow[]>([]);
  const [newUserEmail, setNewUserEmail] = useState('');
  const [newUserPassword, setNewUserPassword] = useState('');
  const [newUserPlan, setNewUserPlan] = useState('free');
  const { ask, dialog } = useAskDialog();
  const [creditBusy, setCreditBusy] = useState<string | null>(null);
  const creditLock = useRef(false);
  const creditAttempts = useRef<Record<string, CreditAttempt>>({});
  const [pendingCredits, setPendingCredits] = useState<Record<string, CreditAttempt>>({});
  const creditStorageKey = user?.id ? `strateginsta:admin-credit-attempts:${user.id}` : null;

  useEffect(() => {
    let restored: Record<string, CreditAttempt> = {};
    if (creditStorageKey) {
      try {
        const saved: unknown = JSON.parse(sessionStorage.getItem(creditStorageKey) ?? '{}');
        if (saved && typeof saved === 'object' && !Array.isArray(saved)) restored = Object.fromEntries(Object.entries(saved).filter(([key, attempt]) => isCreditAttempt(attempt) && key === `${attempt.action}:${attempt.payload.userId}`));
      } catch { /* A missing or invalid local cache cannot initiate a mutation. */ }
    }
    creditAttempts.current = restored;
    setPendingCredits(restored);
  }, [creditStorageKey]);

  const rememberCreditAttempts = (attempts: Record<string, CreditAttempt>) => {
    creditAttempts.current = attempts;
    setPendingCredits(attempts);
    if (creditStorageKey) {
      try { sessionStorage.setItem(creditStorageKey, JSON.stringify(attempts)); }
      catch { /* Retries in this mounted view still retain their exact key. */ }
    }
  };

  const refreshOverview = useCallback(async () => {
    const data = await adminService.overview(range);
    setOverview(data);
  }, [range]);

  const refreshUsers = useCallback(async () => {
    const data = await adminService.listUsers({ search, perPage: 100 });
    setUsers(data.users);
  }, [search]);

  const refreshStrategies = useCallback(async () => {
    const data = await adminService.listStrategies({ search, range, planType: planFilter, status: statusFilter });
    setStrategies(data.strategies);
  }, [planFilter, range, search, statusFilter]);

  const refreshEvents = useCallback(async () => {
    const data = await adminService.listEvents({ range });
    setEvents(data.events);
  }, [range]);

  const refreshLogs = useCallback(async () => {
    const data = await adminService.listAuditLogs();
    setLogs(data.logs);
  }, []);

  const refreshAll = useCallback(async () => {
    setIsLoading(true);
    try {
      await Promise.all([refreshOverview(), refreshUsers(), refreshStrategies(), refreshEvents(), refreshLogs()]);
    } catch (error) {
      toast.error(error instanceof Error ? error.message : 'Erro ao carregar admin');
    } finally {
      setIsLoading(false);
    }
  }, [refreshEvents, refreshLogs, refreshOverview, refreshStrategies, refreshUsers]);

  useEffect(() => {
    if (!sessionLoading && user) {
      adminService.me()
        .then(() => setIsAdmin(true))
        .catch(() => setIsAdmin(false))
        .finally(() => setIsCheckingAdmin(false));
    } else if (!sessionLoading) {
      setIsCheckingAdmin(false);
    }
  }, [sessionLoading, user]);

  useEffect(() => {
    if (isAdmin) refreshAll();
  }, [isAdmin, refreshAll]);

  const createUser = async () => {
    if (!newUserEmail || !newUserPassword) {
      toast.warning('Informe email e senha do usuário.');
      return;
    }

    setIsLoading(true);
    try {
      await adminService.createUser({ email: newUserEmail, password: newUserPassword, planType: newUserPlan });
      setNewUserEmail('');
      setNewUserPassword('');
      toast.success('Usuário criado.');
      await refreshUsers();
    } catch (error) {
      toast.error(error instanceof Error ? error.message : 'Erro ao criar usuário');
    } finally {
      setIsLoading(false);
    }
  };

  const changePlan = async (row: AdminUserRow) => {
    const answer = await ask({
      title: 'Alterar plano',
      description: row.email ?? row.id,
      fields: [{ name: 'planType', label: 'Plano', defaultValue: row.planType, options: ['free', 'individual', 'professional', 'agency'].map(value => ({ value, label: planLabels[value] })) }],
      confirmLabel: 'Salvar plano',
    });
    if (!answer) return;

    await adminService.setPlan({ userId: row.id, planType: answer.planType });
    toast.success('Plano atualizado.');
    await refreshAll();
  };

  const runCreditAction = async (action: CreditAttempt['action'], row: AdminUserRow) => {
    if (creditLock.current) return;
    creditLock.current = true;
    const slot = `${action}:${row.id}`;
    try {
      let attempt = creditAttempts.current[slot];
      if (!attempt) {
        if (action === 'grantCredits') {
          const answer = await ask({
            title: 'Adicionar TPs',
            description: `${row.email ?? row.id}. Cada estratégia completa usa 20 TPs.`,
            fields: [
              { name: 'amount', label: 'Quantidade', type: 'number', defaultValue: '30' },
              { name: 'reason', label: 'Motivo (fica no extrato)', defaultValue: 'Recarga manual admin' },
            ],
            confirmLabel: 'Adicionar TPs',
          });
          if (!answer) return;
          const amount = Number(answer.amount);
          if (!Number.isSafeInteger(amount) || amount <= 0) { toast.warning('Informe uma quantidade inteira maior que zero.'); return; }
          if (!await ask({ title: 'Confirmar adição de TPs', description: `Adicionar ${amount.toLocaleString('pt-BR')} TPs para ${row.email ?? row.id}? Fica registrado no extrato e não pode ser desfeito pelo painel.`, confirmLabel: `Confirmar ${amount.toLocaleString('pt-BR')} TPs` })) return;
          attempt = { action, payload: { userId: row.id, amount, reason: answer.reason.trim() || 'Recarga manual admin' }, key: crypto.randomUUID() };
        } else {
          if (!await ask({ title: 'Restaurar saldo do piloto', description: `Restaurar o saldo de IA de ${row.email ?? row.id} para 30 TPs? Isso substitui o saldo atual e fica registrado no extrato.`, confirmLabel: 'Restaurar saldo', destructive: true })) return;
          attempt = { action, payload: { userId: row.id }, key: crypto.randomUUID() };
        }
        rememberCreditAttempts({ ...creditAttempts.current, [slot]: attempt });
      }
      setCreditBusy(slot);
      const result = attempt.action === 'grantCredits'
        ? await adminService.grantCredits(attempt.payload, attempt.key)
        : await adminService.resetUsage(attempt.payload, attempt.key);
      // Only the confirmed server response clears the key. A transport error retains
      // the exact action/payload for retry, including after a reload of this tab.
      const remaining = { ...creditAttempts.current }; delete remaining[slot];
      rememberCreditAttempts(remaining);
      if (result.wallet) setUsers(current => current.map(userRow => userRow.id === row.id ? { ...userRow, aiWallet: result.wallet } : userRow));
      toast.success(action === 'grantCredits' ? 'TPs confirmados na carteira.' : 'Saldo do piloto restaurado.');
      const refreshes = await Promise.allSettled([refreshUsers(), refreshOverview(), refreshLogs()]);
      if (refreshes.some(result => result.status === 'rejected')) toast.warning('A alteração foi confirmada, mas a lista ainda não foi atualizada por completo. Use Atualizar; não é necessário repetir a recarga.');
    } catch (error) {
      toast.error(`${error instanceof Error ? error.message : 'Não foi possível confirmar a operação.'} Use Retomar para consultar ou concluir a mesma tentativa.`);
    } finally {
      creditLock.current = false;
      setCreditBusy(null);
    }
  };

  const grantCredits = (row: AdminUserRow) => runCreditAction('grantCredits', row);

  const blockUser = async (row: AdminUserRow) => {
    const blocked = !row.isBlocked;
    let reason: string | undefined;
    if (blocked) {
      const answer = await ask({ title: `Bloquear ${row.email ?? row.id}?`, fields: [{ name: 'reason', label: 'Motivo do bloqueio', defaultValue: 'Bloqueio manual admin' }], confirmLabel: 'Bloquear', destructive: true });
      if (!answer) return;
      reason = answer.reason.trim() || 'Bloqueio manual admin';
    }

    await adminService.setUserBlocked({ userId: row.id, blocked, reason });
    toast.success(blocked ? 'Usuário bloqueado.' : 'Usuário desbloqueado.');
    await refreshAll();
  };

  const resetUsage = (row: AdminUserRow) => runCreditAction('resetUsage', row);

  // Kept until the bulk grant succeeds, so a retry reuses it and nobody is credited twice.
  const bulkKey = useRef<{ key: string; amount: number }>();
  const grantAll = async () => {
    const answer = await ask({ title: 'Adicionar TPs para todos', fields: [
      { name: 'amount', label: 'TPs para cada usuário', type: 'number', defaultValue: '30' },
      { name: 'reason', label: 'Motivo (fica no extrato de cada um)', defaultValue: 'Recarga para todos (admin)' },
    ], confirmLabel: 'Ver quantas pessoas recebem' });
    if (!answer) return;
    const amount = Number(answer.amount);
    if (!Number.isSafeInteger(amount) || amount <= 0 || amount > 1000) { toast.warning('Informe de 1 a 1.000 TPs por usuário.'); return; }
    const reason = answer.reason.trim() || 'Recarga para todos (admin)';
    try {
      const preview = await adminService.grantCreditsAll({ amount, reason, dryRun: true });
      if (!await ask({ title: 'Confirmar adição para todos', description: `Adicionar ${amount.toLocaleString('pt-BR')} TPs para cada um dos ${preview.users} usuários${preview.blocked ? ` (${preview.blocked} bloqueados ficam de fora)` : ''}, total de ${preview.total.toLocaleString('pt-BR')} TPs? Fica registrado no extrato de cada um e não pode ser desfeito pelo painel.`, confirmLabel: `Confirmar para ${preview.users} usuários`, destructive: true })) return;
      setCreditBusy('grantAll');
      if (bulkKey.current?.amount !== amount) bulkKey.current = { key: crypto.randomUUID(), amount };
      const result = await adminService.grantCreditsAll({ amount, reason, idempotencyKey: bulkKey.current.key });
      bulkKey.current = undefined;
      toast.success(`${result.total.toLocaleString('pt-BR')} TPs adicionados para ${result.users} usuários.`);
      await refreshUsers();
    } catch (error) { toast.error(error instanceof Error ? error.message : 'Não foi possível concluir a recarga.'); }
    finally { setCreditBusy(null); }
  };

  const sendPasswordReset = async (row: AdminUserRow) => {
    if (!await ask({ title: 'Enviar link de nova senha?', description: `${row.email ?? row.id} vai receber um e-mail com um link para criar uma nova senha. A senha atual continua valendo até ela trocar.`, confirmLabel: 'Enviar e-mail' })) return;
    try {
      const result = await adminService.sendPasswordReset({ userId: row.id });
      toast.success(`Link enviado para ${result.email}. Peça para conferir também a caixa de spam.`);
    } catch (error) { toast.error(error instanceof Error ? error.message : 'Não foi possível enviar o link.'); }
  };

  const saveNotes = async (row: AdminUserRow) => {
    const answer = await ask({ title: 'Observação interna', description: row.email ?? row.id, fields: [{ name: 'notes', label: 'Observação', type: 'textarea', defaultValue: row.adminNotes ?? '' }], confirmLabel: 'Salvar' });
    if (!answer) return;
    await adminService.updateAdminNotes({ userId: row.id, notes: answer.notes });
    toast.success('Observação salva.');
    await refreshUsers();
  };

  const archiveStrategy = async (row: AdminStrategyRow) => {
    const isArchived = Boolean(row.generated_strategy?.archived);
    if (!await ask({ title: `${isArchived ? 'Reativar' : 'Arquivar'} a estratégia "${row.name}"?`, confirmLabel: isArchived ? 'Reativar' : 'Arquivar' })) return;
    await adminService.archiveStrategy({ strategyId: row.id, archived: !isArchived });
    toast.success(isArchived ? 'Estratégia reativada.' : 'Estratégia arquivada.');
    await refreshStrategies();
  };

  const filteredUsers = useMemo(() => users.filter((row) => planFilter === 'all' || row.planType === planFilter), [planFilter, users]);

  if (sessionLoading || isCheckingAdmin) {
    return <div className="flex min-h-screen items-center justify-center bg-background"><Loader2 className="h-7 w-7 animate-spin text-primary" /></div>;
  }

  if (!user) return <Navigate to="/login" replace />;

  if (!isAdmin) {
    return (
      <div className="flex min-h-screen items-center justify-center bg-background p-6">
        <Card className="max-w-md rounded-lg">
          <CardContent className="p-8 text-center">
            <Lock className="mx-auto mb-4 h-10 w-10 text-destructive" />
            <h1 className="text-xl font-bold">Acesso restrito</h1>
            <p className="mt-2 text-sm text-muted-foreground">Sua conta não possui permissão de administrador.</p>
            <Button asChild variant="outline" className="mt-4"><a href="/app">Voltar ao app</a></Button>
          </CardContent>
        </Card>
      </div>
    );
  }

  const metrics = overview?.metrics;

  return (
    <div className="min-h-screen bg-background text-foreground">
      {dialog}
      <div className="grid min-h-screen grid-cols-1 lg:grid-cols-[260px_1fr]">
        <aside className="border-r border-border bg-card/50 p-4 lg:sticky lg:top-0 lg:h-screen">
          <div className="mb-6 flex items-center gap-2 px-2">
            <Shield className="h-6 w-6 text-primary" />
            <div>
              <p className="font-bold">StrategInsta Admin</p>
              <p className="text-xs text-muted-foreground">Operação do SaaS</p>
            </div>
          </div>

          <nav className="space-y-1">
            {navItems.map((item) => {
              const Icon = item.icon;
              return (
                <button
                  key={item.id}
                  onClick={() => setActiveSection(item.id)}
                  className={`flex w-full items-center gap-2 rounded-md px-3 py-2 text-sm transition ${activeSection === item.id ? 'bg-primary text-primary-foreground' : 'text-muted-foreground hover:bg-muted hover:text-foreground'}`}
                >
                  <Icon className="h-4 w-4" />
                  {item.label}
                </button>
              );
            })}
          </nav>
        </aside>

        <main className="p-4 lg:p-6">
          <div className="mb-4"><AccountViewSwitch current="admin" /></div>
          <header className="mb-6 flex flex-col gap-4 border-b border-border pb-4 md:flex-row md:items-center md:justify-between">
            <div>
              <h1 className="text-2xl font-bold">Painel administrativo</h1>
              <p className="text-sm text-muted-foreground">Usuários, TPs, uso, estratégias e eventos do app.</p>
            </div>
            <div className="flex flex-wrap items-center gap-2">
              <select value={range} onChange={(event) => setRange(event.target.value as AdminRange)} className="h-10 rounded-md border border-input bg-background px-3 text-sm">
                <option value="7d">7 dias</option>
                <option value="30d">30 dias</option>
                <option value="90d">90 dias</option>
              </select>
              <select value={planFilter} onChange={(event) => setPlanFilter(event.target.value)} className="h-10 rounded-md border border-input bg-background px-3 text-sm">
                <option value="all">Todos os planos</option>
                <option value="free">Free</option>
                <option value="individual">Individual</option>
                <option value="professional">Professional</option>
                <option value="agency">Agency</option>
              </select>
              <Button onClick={refreshAll} disabled={isLoading} variant="outline">
                {isLoading ? <Loader2 className="mr-2 h-4 w-4 animate-spin" /> : <RefreshCw className="mr-2 h-4 w-4" />}
                Atualizar
              </Button>
            </div>
          </header>

          <div className="mb-5 flex flex-col gap-2 md:flex-row md:items-center">
            <div className="relative w-full md:max-w-md">
              <Search className="absolute left-3 top-1/2 h-4 w-4 -translate-y-1/2 text-muted-foreground" />
              <Input value={search} onChange={(event) => setSearch(event.target.value)} placeholder="Buscar email, ID, nome ou estratégia" className="pl-9" />
            </div>
            {activeSection === 'strategies' && (
              <select value={statusFilter} onChange={(event) => setStatusFilter(event.target.value)} className="h-10 rounded-md border border-input bg-background px-3 text-sm">
                <option value="active">Ativas</option>
                <option value="archived">Arquivadas</option>
              </select>
            )}
          </div>

          {activeSection === 'overview' && (
            <section className="space-y-5">
              <div className="grid gap-3 sm:grid-cols-2 xl:grid-cols-4">
                <MetricCard title="Usuários totais" value={metrics?.totalUsers ?? 0} hint={`${metrics?.newUsers ?? 0} novos no período`} icon={<Users className="h-5 w-5" />} />
                <MetricCard title="Estratégias" value={metrics?.totalStrategies ?? 0} hint={`${metrics?.strategiesInRange ?? 0} no período`} icon={<FileText className="h-5 w-5" />} />
                <MetricCard title="MRR estimado" value={metrics?.estimatedMrr == null ? 'Sem medição' : toCurrency(metrics.estimatedMrr)} hint={metrics ? `${metrics.freeToPaidRate}% das contas têm plano pago cadastrado; isso não comprova receita.` : 'Aguardando dados de planos e receita.'} icon={<BarChart3 className="h-5 w-5" />} />
                <MetricCard title="Custo de IA registrado (USD)" value={metrics?.estimatedAiCostUsd == null ? 'Sem medição' : metrics.estimatedAiCostUsd.toLocaleString('pt-BR', { style: 'currency', currency: 'USD', maximumFractionDigits: 4 })} hint={`${metrics?.aiCostMeasuredOperations ?? 0} operações medidas · ${metrics?.aiCostUnpricedOperations ?? 0} sem preço validado`} icon={<Coins className="h-5 w-5" />} />
              </div>

              <div className="grid gap-4 lg:grid-cols-2">
                <Card className="rounded-lg">
                  <CardHeader><CardTitle className="text-base">Distribuição por plano</CardTitle></CardHeader>
                  <CardContent className="space-y-3">
                    {Object.entries(overview?.planCounts ?? {}).map(([plan, count]) => (
                      <div key={plan}>
                        <div className="mb-1 flex justify-between text-sm"><span>{planLabels[plan] ?? plan}</span><span>{count}</span></div>
                        <div className="h-2 rounded bg-muted"><div className="h-2 rounded bg-primary" style={{ width: `${Math.min(100, count * 10)}%` }} /></div>
                      </div>
                    ))}
                  </CardContent>
                </Card>

                <Card className="rounded-lg">
                  <CardHeader><CardTitle className="text-base">Eventos recentes</CardTitle></CardHeader>
                  <CardContent className="space-y-2">
                    {(overview?.recentEvents ?? []).slice(0, 8).map((event) => (
                      <div key={event.id} className="flex items-center justify-between rounded-md border border-border p-2 text-sm">
                        <span>{event.event_name}</span>
                        <span className="text-xs text-muted-foreground">{formatDate(event.created_at)}</span>
                      </div>
                    ))}
                  </CardContent>
                </Card>
              </div>
            </section>
          )}

          {activeSection === 'users' && (
            <section className="space-y-4">
              <Card className="rounded-lg">
                <CardContent className="flex flex-wrap items-center justify-between gap-3 pt-6">
                  <div><p className="text-sm font-medium">Adicionar TPs para todos</p><p className="text-xs text-muted-foreground">Mesma quantidade para cada usuário não bloqueado. Você confirma o número de pessoas antes de enviar.</p></div>
                  <Button variant="outline" disabled={isLoading || !!creditBusy} onClick={() => void grantAll()}>Adicionar para todos</Button>
                </CardContent>
              </Card>
              <Card className="rounded-lg">
                <CardHeader><CardTitle className="flex items-center gap-2 text-base"><UserPlus className="h-4 w-4" /> Criar usuário</CardTitle></CardHeader>
                <CardContent className="grid gap-3 md:grid-cols-[1fr_180px_160px_auto]">
                  <Input value={newUserEmail} onChange={(event) => setNewUserEmail(event.target.value)} placeholder="email@cliente.com" />
                  <Input value={newUserPassword} onChange={(event) => setNewUserPassword(event.target.value)} placeholder="senha temporária" type="password" />
                  <select value={newUserPlan} onChange={(event) => setNewUserPlan(event.target.value)} className="h-10 rounded-md border border-input bg-background px-3 text-sm">
                    <option value="free">Free</option>
                    <option value="individual">Individual</option>
                    <option value="professional">Professional</option>
                    <option value="agency">Agency</option>
                  </select>
                  <Button onClick={createUser} disabled={isLoading}>Criar</Button>
                </CardContent>
              </Card>

              <AdminTableHeader title="Usuários" count={filteredUsers.length} onExport={() => exportCsv('strateginsta-users.csv', filteredUsers as unknown as Record<string, unknown>[])} />
              <p className="text-xs text-muted-foreground">Os TPs vêm da carteira atual. A contagem anterior de estratégias e extras é histórica e não é somada a esse saldo.</p>
              <div className="overflow-x-auto rounded-lg border border-border">
                <table className="w-full min-w-[1450px] text-sm">
                  <thead className="bg-muted/60 text-left"><tr><th className="p-3">Usuário</th><th>Plano</th><th>Disponível (IA)</th><th>Reservado</th><th>Saldo total</th><th>Uso anterior</th><th>Último acesso</th><th>Status</th><th className="text-right pr-3">Ações</th></tr></thead>
                  <tbody>
                    {filteredUsers.map((row) => (
                      <tr key={row.id} className="border-t border-border">
                        <td className="p-3"><p className="font-medium">{row.email}</p><p className="text-xs text-muted-foreground">{row.id}</p>{row.adminNotes && <p className="mt-1 text-xs text-amber-500">{row.adminNotes}</p>}</td>
                        <td><Badge variant="outline">{planLabels[row.planType]}</Badge></td>
                        <td className="font-semibold">{row.aiWallet?.available ?? <span className="font-normal text-muted-foreground">Sem carteira</span>}</td>
                        <td>{row.aiWallet?.reserved ?? <span className="text-muted-foreground">Não medido</span>}</td>
                        <td>{row.aiWallet?.balance ?? <span className="text-muted-foreground">Não medido</span>}</td>
                        <td className="text-xs text-muted-foreground"><p>{row.strategiesUsed} estratégias</p><p>{row.extraCredits} extras antigos</p></td>
                        <td>{formatDate(row.lastSignInAt)}</td>
                        <td>{row.isBlocked ? <Badge variant="destructive">Bloqueado</Badge> : <Badge variant="outline">Ativo</Badge>}</td>
                        <td className="space-x-2 pr-3 text-right">
                          <Button size="sm" variant="outline" disabled={isLoading || !!creditBusy} onClick={() => changePlan(row)}>Plano</Button>
                          <Button size="sm" variant="outline" disabled={isLoading || !!creditBusy || !!pendingCredits[`resetUsage:${row.id}`]} onClick={() => grantCredits(row)}>{creditBusy === `grantCredits:${row.id}` && <Loader2 className="mr-1 h-3 w-3 animate-spin" />}{pendingCredits[`grantCredits:${row.id}`] ? 'Retomar TP' : 'TPs'}</Button>
                          <Button size="sm" variant="outline" disabled={isLoading || !!creditBusy || !!pendingCredits[`grantCredits:${row.id}`]} onClick={() => resetUsage(row)}>{creditBusy === `resetUsage:${row.id}` && <Loader2 className="mr-1 h-3 w-3 animate-spin" />}{pendingCredits[`resetUsage:${row.id}`] ? 'Retomar reset' : 'Reset'}</Button>
                          <Button size="sm" variant="outline" disabled={isLoading || !!creditBusy} onClick={() => saveNotes(row)}>Nota</Button>
                          <Button size="sm" variant="outline" disabled={isLoading || !!creditBusy} onClick={() => void sendPasswordReset(row)}>Link de nova senha</Button>
                          <Button size="sm" disabled={isLoading || !!creditBusy} variant={row.isBlocked ? 'outline' : 'destructive'} onClick={() => blockUser(row)}>{row.isBlocked ? 'Desbloquear' : 'Bloquear'}</Button>
                        </td>
                      </tr>
                    ))}
                  </tbody>
                </table>
              </div>
            </section>
          )}

          {activeSection === 'strategies' && (
            <section className="space-y-4">
              <AdminTableHeader title="Estratégias" count={strategies.length} onExport={() => exportCsv('strateginsta-strategies.csv', strategies as unknown as Record<string, unknown>[])} />
              <div className="overflow-x-auto rounded-lg border border-border">
                <table className="w-full min-w-[1000px] text-sm">
                  <thead className="bg-muted/60 text-left"><tr><th className="p-3">Estratégia</th><th>Usuário</th><th>Plano</th><th>Criada</th><th>Nicho</th><th className="text-right pr-3">Ações</th></tr></thead>
                  <tbody>
                    {strategies.map((row) => (
                      <tr key={row.id} className="border-t border-border">
                        <td className="p-3"><p className="font-medium">{row.name}</p><p className="text-xs text-muted-foreground">{row.id}</p></td>
                        <td className="text-xs">{row.user_id}</td>
                        <td><Badge variant="outline">{planLabels[row.planType]}</Badge></td>
                        <td>{formatDate(row.created_at)}</td>
                        <td>{String(row.user_input?.niche ?? '—')}</td>
                        <td className="space-x-2 pr-3 text-right"><Button size="sm" variant="outline" onClick={() => archiveStrategy(row)}>{row.generated_strategy?.archived ? 'Reativar' : 'Arquivar'}</Button></td>
                      </tr>
                    ))}
                  </tbody>
                </table>
              </div>
            </section>
          )}

          {activeSection === 'events' && <EventTable events={events} />}
          {activeSection === 'feedback' && <AdminFeedbackTable emails={Object.fromEntries(users.map(row => [row.id, row.email ?? undefined]))} />}
          {activeSection === 'logs' && <AuditTable logs={logs} />}
          {activeSection === 'settings' && <AdminModelSettings />}
        </main>
      </div>
    </div>
  );
};

const AdminTableHeader: React.FC<{ title: string; count: number; onExport: () => void }> = ({ title, count, onExport }) => (
  <div className="flex items-center justify-between gap-3">
    <div><h2 className="font-semibold">{title}</h2><p className="text-sm text-muted-foreground">{count} registros encontrados</p></div>
    <Button variant="outline" onClick={onExport}><Download className="mr-2 h-4 w-4" /> CSV</Button>
  </div>
);

const EventTable: React.FC<{ events: UsageEventRow[] }> = ({ events }) => (
  <section className="space-y-4">
    <AdminTableHeader title="Eventos de uso" count={events.length} onExport={() => exportCsv('strateginsta-events.csv', events as unknown as Record<string, unknown>[])} />
    <div className="overflow-x-auto rounded-lg border border-border">
      <table className="w-full min-w-[900px] text-sm">
        <thead className="bg-muted/60 text-left"><tr><th className="p-3">Evento</th><th>Tipo</th><th>Usuário</th><th>Data</th><th>Metadata</th></tr></thead>
        <tbody>{events.map((row) => <tr key={row.id} className="border-t border-border"><td className="p-3 font-medium">{row.event_name}</td><td>{row.event_type}</td><td className="text-xs">{row.user_id}</td><td>{formatDate(row.created_at)}</td><td className="max-w-md truncate text-xs">{JSON.stringify(row.metadata ?? {})}</td></tr>)}</tbody>
      </table>
    </div>
  </section>
);

const AuditTable: React.FC<{ logs: AdminAuditLogRow[] }> = ({ logs }) => (
  <section className="space-y-4">
    <AdminTableHeader title="Auditoria admin" count={logs.length} onExport={() => exportCsv('strateginsta-admin-logs.csv', logs as unknown as Record<string, unknown>[])} />
    <div className="overflow-x-auto rounded-lg border border-border">
      <table className="w-full min-w-[900px] text-sm">
        <thead className="bg-muted/60 text-left"><tr><th className="p-3">Ação</th><th>Admin</th><th>Alvo</th><th>Data</th><th>Metadata</th></tr></thead>
        <tbody>{logs.map((row) => <tr key={row.id} className="border-t border-border"><td className="p-3 font-medium">{row.action}</td><td className="text-xs">{row.admin_user_id}</td><td className="text-xs">{row.target_user_id ?? row.target_id}</td><td>{formatDate(row.created_at)}</td><td className="max-w-md truncate text-xs">{JSON.stringify(row.metadata ?? {})}</td></tr>)}</tbody>
      </table>
    </div>
  </section>
);

const SettingsPanel: React.FC = () => (
  <section className="grid gap-4 lg:grid-cols-2">
    <Card className="rounded-lg">
      <CardHeader><CardTitle className="flex items-center gap-2 text-base"><SlidersHorizontal className="h-4 w-4" /> Integrações</CardTitle></CardHeader>
      <CardContent className="space-y-3 text-sm">
        <StatusRow label="Supabase Auth" />
        <StatusRow label="Supabase Database" />
        <StatusRow label="Edge Function admin-api" />
        <StatusRow label="Stripe" />
        <StatusRow label="Multi-AI server-side" />
      </CardContent>
    </Card>
    <Card className="rounded-lg">
      <CardHeader><CardTitle className="text-base">Configurações operacionais</CardTitle></CardHeader>
      <CardContent className="space-y-3">
        <p className="text-sm leading-6 text-muted-foreground">Os modelos ainda são configurados no servidor. Este painel não verifica a disponibilidade das integrações nem permite trocar modelos.</p><p className="text-sm leading-6 text-muted-foreground">A seleção de modelos por tarefa, com teste de conexão e histórico de alterações, está prevista para o piloto. Chaves de API não devem ser inseridas neste painel.</p>
      </CardContent>
    </Card>
  </section>
);

const StatusRow: React.FC<{ label: string }> = ({ label }) => (
  <div className="flex items-center justify-between rounded-md border border-border p-3">
    <span>{label}</span>
    <span className="text-xs text-muted-foreground">Não verificado</span>
  </div>
);

export default Admin;
