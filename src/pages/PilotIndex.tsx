import { useCallback, useEffect, useMemo, useRef, useState } from 'react';
import { History, Plus, RefreshCw } from 'lucide-react';
import { toast } from 'sonner';
import { OnboardingWizard } from '@/components/OnboardingWizard';
import { LoadingSpinner } from '@/components/LoadingSpinner';
import { PilotWorkspace } from '@/components/workspace/PilotWorkspace';
import { emptyWorkspace, applyWorkspaceResult, draftWeek } from '@/components/workspace/workspace-model';
import { PilotHistoryDialog } from '@/components/PilotHistoryDialog';
import { AccountViewSwitch } from '@/components/AccountViewSwitch';
import { SavedStrategiesDialog } from '@/components/SavedStrategiesDialog';
import { InputDialog } from '@/components/InputDialog';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Textarea } from '@/components/ui/textarea';
import { Dialog, DialogContent, DialogDescription, DialogHeader, DialogTitle } from '@/components/ui/dialog';
import { useSession } from '@/components/SessionContextProvider';
import { supabase } from '@/integrations/supabase/client';
import { pilotService, businessIdForAccount, workspaceRequest } from '@/services/pilotService';
import type { GenerationRecord, GenerationRequest, PilotOutput, RevisionRecord, Wallet } from '@/services/pilotService';
import { saveBriefingDraft } from '@/lib/briefing';
import { stampEditedVersion } from '@/lib/pilot-revisions';
import { createBriefingAttachmentService } from '@/services/briefingAttachmentService';
import type { SavedStrategy } from '@/lib/saved-strategy';
import type { GeneratedStrategy, UserInput } from '@/types';
import type { PilotWorkspaceData, WorkspaceChange, WorkspaceGenerationPayload, WorkspaceGenerationResult, WorkspaceOperation } from '@/types/workspace';
import logo from '@/assets/logo.png';

const stages = ['idealCustomerProfile', 'monetizationIdeas', 'instagramBio', 'storiesStrategy', 'final'] as const;
type Stage = typeof stages[number];
type Phase = 'onboarding'|'dashboard'|Stage;
interface Snapshot extends PilotOutput { input: UserInput; source?: WorkspaceChange['source']; generationId?: string; }
interface FullJob { idempotencyKey: string; generationId?: string; input: UserInput; stage: Stage; }
interface QuoteConfirmation { credits: number; before: number; after: number; resolve: (value: boolean) => void; }
const message = (error: unknown) => error instanceof Error ? error.message : 'Não foi possível concluir. Seu rascunho foi preservado.';
function isSnapshot(value: unknown): value is Snapshot { return !!value && typeof value === 'object' && 'strategy' in value && 'workspace' in value && 'input' in value; }

export default function PilotIndex() {
  const { user, isLoading: sessionLoading } = useSession();
  const [phase, setPhase] = useState<Phase>('onboarding');
  const [input, setInput] = useState<UserInput | null>(null);
  const [strategy, setStrategy] = useState<Partial<GeneratedStrategy>>({});
  const [workspace, setWorkspace] = useState<PilotWorkspaceData>(emptyWorkspace);
  const [wallet, setWallet] = useState<Wallet>(); const [walletLoading, setWalletLoading] = useState(true);
  const [error, setError] = useState(''); const [walletError, setWalletError] = useState('');
  const [busy, setBusy] = useState(false); const lock = useRef(false);
  const [historyOpen, setHistoryOpen] = useState(false); const [nameOpen, setNameOpen] = useState(false);
  const [strategyId, setStrategyId] = useState<string>(); const [strategyName, setStrategyName] = useState('');
  const [businessId, setBusinessId] = useState(''); const [generationId, setGenerationId] = useState<string>();
  const [job, setJob] = useState<FullJob>(); const [initialAgenda, setInitialAgenda] = useState(false);
  const [editingInput, setEditingInput] = useState(false); const [viewingVersion, setViewingVersion] = useState(false);
  const [reviewSection, setReviewSection] = useState<string>();
  const briefingRef = useRef<UserInput | null>(null);
  const [dark, setDark] = useState(() => window.matchMedia('(prefers-color-scheme: dark)').matches);
  useEffect(() => { document.documentElement.classList.toggle('dark', dark); }, [dark]);
  const [quote, setQuote] = useState<QuoteConfirmation>();
  const operationKeys = useRef(new Map<string, string>());
  const refreshWallet = useCallback(async () => {
    if (!user?.id) return; setWalletLoading(true);
    try { const result = await pilotService.wallet(); setWallet(result.wallet); setWalletError(''); }
    catch (e) { setWalletError(message(e)); } finally { setWalletLoading(false); }
  }, [user?.id]);
  const attachmentService = useMemo(() => user?.id && businessId
    ? createBriefingAttachmentService(businessId, user.id, () => briefingRef.current ?? input, () => { void refreshWallet(); }) : undefined,
    [user?.id, businessId, input, refreshWallet]);
  useEffect(() => { if (user?.id) { setBusinessId(businessIdForAccount(user.id)); void refreshWallet(); } }, [user?.id, refreshWallet]);
  useEffect(() => {
    if (!busy) return;
    const warn = (event: BeforeUnloadEvent) => { event.preventDefault(); event.returnValue = ''; };
    window.addEventListener('beforeunload', warn); return () => window.removeEventListener('beforeunload', warn);
  }, [busy]);
  const confirmQuote = async (request: GenerationRequest) => {
    const result = await pilotService.quote(request); setWallet(result.wallet);
    if (result.availableAfter < 0) throw new Error('Saldo insuficiente para esta operação. Seu rascunho foi preservado.');
    const approved = await new Promise<boolean>(resolve => setQuote({ credits: result.credits, before: result.wallet.available, after: result.availableAfter, resolve }));
    if (!approved) throw new Error('Geração não iniciada. Nenhum crédito foi reservado.');
  };
  const settleQuote = (approved: boolean) => { quote?.resolve(approved); setQuote(undefined); };
  const withLock = async <T,>(action: () => Promise<T>): Promise<T> => {
    if (lock.current) throw new Error('Aguarde a operação atual.'); lock.current = true; setBusy(true); setError('');
    try { return await action(); } finally { lock.current = false; setBusy(false); void refreshWallet(); }
  };
  const persistActive = async (name: string, snapshot: Snapshot, id: string) => {
    if (!user?.id) throw new Error('Entre na sua conta para salvar.');
    const { error: saveError } = await supabase.from('strategies').upsert({ id, user_id: user.id, name,
      user_input: snapshot.input, generated_strategy: { ...snapshot.strategy, pilotWorkspace: snapshot.workspace, businessId, generationId },
    }, { onConflict: 'id' });
    if (saveError) throw new Error('A versão está no histórico, mas não foi possível atualizar a estratégia. Tente salvar novamente.');
  };
  const saveSnapshot = async (snapshot: Snapshot, kind: 'input'|'manual_edit'|'selection'|'agenda', title: string) => {
    const result = await pilotService.saveRevision({ businessId, strategyId, kind, title, content: { ...snapshot, generationId } });
    if (strategyId) await persistActive(strategyName, snapshot, strategyId);
    return result.revision.id;
  };
  const saveChange = async (change: WorkspaceChange) => withLock(async () => {
    if (!input || viewingVersion) throw new Error('Abra a versão atual para editar.');
    const versionId = await saveSnapshot({ input, strategy, workspace: change.data, source: change.source }, change.kind === 'generation' ? 'manual_edit' : change.kind, change.title);
    const next = stampEditedVersion(change.data, change.source, versionId);
    if (strategyId) await persistActive(strategyName, { input, strategy, workspace: next }, strategyId);
    setWorkspace(next);
  });
  const generateWorkspace = async (operation: WorkspaceOperation, payload: WorkspaceGenerationPayload): Promise<WorkspaceGenerationResult> => withLock(async () => {
    if (viewingVersion) throw new Error('Abra a versão atual para gerar conteúdo.');
    const signature = JSON.stringify({ operation, payload });
    const key = operationKeys.current.get(signature) ?? crypto.randomUUID(); operationKeys.current.set(signature, key);
    const request = workspaceRequest(operation, payload, { businessId, strategyId, idempotencyKey: key, parentGenerationId: generationId });
    await confirmQuote(request);
    const result = await pilotService.generate({ ...request, retry: true }); setWallet(result.wallet);
    const output = { output: result.generation.output, versionId: result.generation.versionId ?? result.versionId };
    const next = applyWorkspaceResult(workspace, operation, payload, output);
    await saveSnapshot({ input: payload.userInput, strategy, workspace: next }, 'manual_edit', 'Aplicação de conteúdo gerado');
    setWorkspace(next); operationKeys.current.delete(signature); return output;
  });
  const runStage = async (nextJob: FullJob, context = workspace) => withLock(async () => {
    const request: GenerationRequest = { operation: 'full_strategy', idempotencyKey: nextJob.idempotencyKey, businessId,
      input: nextJob.input, retry: true, parameters: { stage: nextJob.stage, workspace: context,
        selectedMonetizationIds: context.selectedMonetizationIds, ...(context.storiesAgenda ? { week: context.storiesAgenda } : {}) } };
    if (!nextJob.generationId) await confirmQuote(request);
    setJob(nextJob); setPhase(nextJob.stage); setInput(nextJob.input);
    const result = await pilotService.generate(request); setWallet(result.wallet); setGenerationId(result.generation.id);
    const nextState = result.generation.output as PilotOutput;
    if (!nextState.strategy || !nextState.workspace) throw new Error('Resposta incompleta. Consulte o histórico para recuperar as partes salvas.');
    setStrategy(nextState.strategy); setWorkspace(nextState.workspace);
    setJob({ ...nextJob, generationId: result.generation.id }); setInitialAgenda(false);
    if (nextJob.stage === 'final') { setPhase('dashboard'); setNameOpen(true); }
  });
  const start = async (newInput: UserInput) => {
    if (editingInput) {
      const next = { ...workspace, staleSections: ['idealCustomerProfile','monetizationIdeas','instagramBio','storiesStrategy','contentTable','editorialCalendar','actionPlan'] };
      await saveSnapshot({ input: newInput, strategy, workspace: next }, 'input', 'Revisão do briefing');
      setInput(newInput); setWorkspace(next); setEditingInput(false); setPhase('dashboard'); return;
    }
    if (!user?.id) throw new Error('Entre na sua conta.');
    saveBriefingDraft(localStorage, user.id, newInput, 4);
    setReviewSection(undefined); setStrategyId(undefined); setStrategyName(''); setGenerationId(undefined); setViewingVersion(false);
    setStrategy({}); setWorkspace(emptyWorkspace());
    try { await runStage({ input: newInput, stage: 'idealCustomerProfile', idempotencyKey: crypto.randomUUID() }, emptyWorkspace()); }
    catch (e) { setError(message(e)); throw e; }
  };
  const continueGeneration = async () => {
    if (!job) return;
    const nextStage = stages[Math.min(stages.indexOf(phase as Stage) + 1, stages.length - 1)];
    if (nextStage === 'storiesStrategy' && !initialAgenda) {
      setWorkspace(prev => ({ ...prev, storiesAgenda: prev.storiesAgenda ?? draftWeek(new Date().toLocaleDateString('en-CA')) }));
      setInitialAgenda(true); return;
    }
    try { await runStage({ ...job, stage: nextStage }); } catch (e) { setError(message(e)); }
  };
  const saveNamed = async (name: string) => {
    if (!input) throw new Error('Briefing indisponível.');
    const id = strategyId ?? crypto.randomUUID(); setStrategyId(id);
    await persistActive(name, { input, strategy, workspace }, id);
    await pilotService.saveRevision({ businessId, strategyId: id, kind: 'manual_edit', title: name, content: { input, strategy, workspace } });
    setStrategyName(name); setPhase('dashboard'); toast.success('Estratégia salva. Salvar não consome créditos.');
  };
  const openSaved = (saved: SavedStrategy) => {
    if (lock.current) { toast.info('Aguarde a operação atual antes de trocar de estratégia.'); return; }
    setReviewSection(undefined);
    setInput(saved.input); setStrategy(saved.strategy); setWorkspace(saved.workspace ?? emptyWorkspace());
    setBusinessId(saved.businessId ?? businessIdForAccount(user!.id)); setGenerationId(saved.generationId);
    setStrategyId(saved.id); setStrategyName(saved.name); setPhase('dashboard'); setJob(undefined); setError(''); setViewingVersion(false);
  };
  const openGeneration = (record: GenerationRecord) => {
    setReviewSection(undefined);
    setHistoryOpen(false); setError(''); setBusinessId(record.business_id); setGenerationId(record.id); setInput(record.input);
    setStrategyId(record.strategy_id); setStrategyName(''); setInitialAgenda(false);
    if (record.operation === 'full_strategy') {
      const output = record.output as Partial<PilotOutput>;
      setStrategy(output.strategy ?? {}); setWorkspace(output.workspace ?? emptyWorkspace());
      if (record.status === 'completed') { setPhase('dashboard'); setJob(undefined); setViewingVersion(true); }
      else {
        const nextStage = stages.find(value => value === 'final' || !output.strategy?.[value]) ?? 'final';
        setJob({ idempotencyKey: record.idempotency_key, generationId: record.id, input: record.input, stage: nextStage });
        setPhase(nextStage); setViewingVersion(false); setError('Geração recuperada. Retome a etapa pendente ou encerre a reserva.');
      }
    } else {
      setPhase('dashboard'); setViewingVersion(true); setJob(undefined);
      const p = record.parameters as unknown as WorkspaceGenerationPayload;
      const reverse: Record<string, WorkspaceOperation> = { idea: 'idea_generate', variation: 'format_variation', refine_short: 'item_refine', script: 'content_script', stories_day: 'stories_day', stories_week: 'stories_week', monetization_plan: 'monetization_plan' };
      const operation = record.operation === 'section' ? p.section === 'contentTable' ? 'matrix_generate' : p.section === 'instagramBio' ? 'bio_generate' : p.section === 'monetizationIdeas' ? 'monetization_analyze' : 'section_regenerate' : reverse[record.operation];
      setStrategy(p.strategy ?? {});
      try { setWorkspace(operation && record.status === 'completed' ? applyWorkspaceResult(p.workspace ?? emptyWorkspace(), operation, p, { output: record.output, versionId: record.versionId }) : p.workspace ?? emptyWorkspace()); }
      catch { setWorkspace(p.workspace ?? emptyWorkspace()); setError('O registro foi recuperado, mas esta saída precisa ser revisada pelo suporte.'); }
    }
  };
  const openRevision = async (record: RevisionRecord) => {
    if (!isSnapshot(record.content)) {
      if (!record.generation_id) { toast.error('Esta versão precisa de revisão pelo suporte.'); return; }
      try {
        const result = await pilotService.history({ generationId: record.generation_id });
        const parent = result.generations.find(item => item.id === record.generation_id);
        if (!parent) throw new Error('Geração de origem não encontrada.');
        if (parent.operation !== 'full_strategy') { openGeneration({ ...parent, output: record.content, status: 'completed', versionId: record.id }); return; }
        const output = parent.output as PilotOutput;
        const section = record.title.split(': ').at(-1);
        let nextWorkspace = { ...(output.workspace ?? emptyWorkspace()), overrides: { ...(output.workspace?.overrides ?? {}) } };
        if (section) delete nextWorkspace.overrides[section as keyof GeneratedStrategy];
        let nextStrategy = { ...output.strategy };
        if (section === 'idealCustomerProfile' && typeof record.content === 'string') nextStrategy.idealCustomerProfile = record.content;
        else if (section === 'monetizationIdeas') nextWorkspace = { ...nextWorkspace, monetization: record.content as PilotWorkspaceData['monetization'] };
        else if (section === 'instagramBio') nextWorkspace = { ...nextWorkspace, bios: record.content as PilotWorkspaceData['bios'] };
        else if (section === 'storiesStrategy') nextWorkspace = { ...nextWorkspace, storiesWeek: record.content as PilotWorkspaceData['storiesWeek'] };
        else if (section === 'final' && record.content && typeof record.content === 'object') {
          const final = record.content as { matrix: PilotWorkspaceData['matrix']; editorialCalendar: GeneratedStrategy['editorialCalendar']; actionPlan: GeneratedStrategy['actionPlan'] };
          nextWorkspace = { ...nextWorkspace, matrix: final.matrix };
          nextStrategy = { ...nextStrategy, editorialCalendar: final.editorialCalendar, actionPlan: final.actionPlan };
        }
        openGeneration({ ...parent, status: 'completed', output: { strategy: nextStrategy, workspace: nextWorkspace } });
        setReviewSection(section === 'final' ? 'contentTable' : section);
      } catch (e) { toast.error(message(e)); }
      return;
    }
    const content = record.content;
    setReviewSection(undefined);
    setInput(content.input); setStrategy(content.strategy); setWorkspace(stampEditedVersion(content.workspace, content.source, record.id)); setBusinessId(record.business_id);
    setStrategyId(record.strategy_id); setStrategyName(''); setGenerationId(record.generation_id ?? content.generationId); setPhase('dashboard'); setHistoryOpen(false); setJob(undefined); setViewingVersion(true); setError('');
  };
  const toolbar = <><Button variant="outline" disabled={busy} onClick={() => setHistoryOpen(true)}><History className="mr-2 h-4 w-4" />Histórico</Button><SavedStrategiesDialog userId={user?.id} onOpen={openSaved} /><AccountViewSwitch current="user" compact /><Button variant="ghost" onClick={() => setDark(value => !value)}>{dark ? 'Tema claro' : 'Tema escuro'}</Button></>;
  const protectedGenerate = async (op: WorkspaceOperation, payload: WorkspaceGenerationPayload) => { try { return await generateWorkspace(op, payload); } finally { void refreshWallet(); } };
  const totalStories = workspace.storiesAgenda?.days.reduce((total, day) => total + day.requestedCount, 0) ?? 0;
  if (sessionLoading) return <LoadingSpinner message="Verificando sessão..." />;
  return <div className="min-h-screen bg-background text-foreground">
    {phase !== 'onboarding' && <header className="mx-auto flex max-w-screen-2xl flex-wrap items-center justify-between gap-4 px-4 py-6 sm:px-8"><img src={logo} alt="StrategInsta" className="h-11 w-auto logo-theme-aware" /><div className="flex flex-wrap items-center gap-2">{toolbar}<Button variant="ghost" disabled={busy} onClick={() => void supabase.auth.signOut()}>Sair</Button></div></header>}
    {phase === 'onboarding' ? <OnboardingWizard key={String(user?.id) + editingInput} userId={user?.id} isAuthenticated={!!user} onStart={start}
      initialValues={input} error={error} toolbar={toolbar} onLogout={() => supabase.auth.signOut().then(() => {})} planLoading={editingInput ? false : walletLoading} planError={editingInput ? null : walletError}
      canGenerate={editingInput || !!wallet && wallet.available >= 20} creditsRemaining={wallet?.available} generationCost={editingInput ? 0 : 20}
      submitLabel={editingInput ? 'Salvar revisão do briefing' : undefined} attachmentService={attachmentService}
      onInputChange={value => { briefingRef.current = value; }}
      onUpgrade={() => toast.info('As ofertas do piloto estão em revisão. Consulte o administrador para ajustar sua cota.')} />
    : <main className="mx-auto max-w-screen-2xl space-y-6 px-4 pb-12 sm:px-8">
      <div className="flex flex-wrap items-center justify-between gap-3 rounded-xl border bg-card p-4"><div><h1 className="text-xl font-semibold">{strategyName || input?.brandName || 'Sua estratégia'}</h1><p className="text-sm text-muted-foreground">{wallet ? wallet.available + ' créditos disponíveis · ' + wallet.reserved + ' reservados' : 'Consultando saldo'}{walletError && ' · ' + walletError}</p></div><div className="flex flex-wrap gap-2"><Button variant="ghost" size="sm" onClick={() => void refreshWallet()} aria-label="Atualizar saldo"><RefreshCw className="h-4 w-4" /></Button>{phase === 'dashboard' && <><Button variant="outline" disabled={busy || viewingVersion} onClick={() => { setEditingInput(true); setPhase('onboarding'); }}>Editar briefing · 0 créditos</Button><Button disabled={busy || viewingVersion} onClick={() => setNameOpen(true)}>Salvar estratégia</Button></>}<Button variant="outline" disabled={busy || !!job && phase !== 'dashboard'} onClick={() => { setPhase('onboarding'); setEditingInput(false); setJob(undefined); setViewingVersion(false); setError(''); }}><Plus className="mr-1 h-4 w-4" />Nova estratégia</Button></div></div>
      {viewingVersion && <div className="flex flex-wrap items-center justify-between gap-3 rounded-xl border border-primary/40 p-4"><p>Você está consultando uma versão do histórico.</p><Button onClick={() => { setReviewSection(undefined); setViewingVersion(false); setStrategyId(undefined); setStrategyName('Cópia revisada'); }}>Usar como base para ajustes</Button></div>}
      {error && <div role="alert" className="space-y-3 rounded-xl border border-destructive/40 p-4"><p>{error}</p>{job && !busy && <div className="flex gap-2"><Button onClick={async () => { try { await runStage(job); } catch (e) { setError(message(e)); } }}>Retomar etapa</Button>{job.generationId && <Button variant="outline" onClick={async () => { try { const result = await pilotService.cancel(job.generationId!); setWallet(result.wallet); setJob(undefined); setPhase('dashboard'); setError('Reserva encerrada. As versões prontas continuam no histórico.'); } catch (e) { setError(message(e)); } }}>Encerrar reserva</Button>}</div>}</div>}
      {busy && <div className="rounded-xl border p-10"><LoadingSpinner message="Preparando sua estratégia. As etapas concluídas ficam no histórico." /></div>}{initialAgenda && workspace.storiesAgenda ? <section className="space-y-5 rounded-xl border p-5"><h2 className="text-xl font-semibold">Como será sua semana?</h2><p className="text-sm text-muted-foreground">A primeira semana inclui até 35 Stories no custo da estratégia. Conte a rotina real e escolha de 0 a 15 por dia.</p>{workspace.storiesAgenda.days.map(day => <div key={day.id} className="grid gap-3 rounded-lg border p-3 sm:grid-cols-[130px_1fr_110px]"><label className="text-sm">{new Date(day.date + 'T12:00:00').toLocaleDateString('pt-BR', { weekday: 'short', day: 'numeric', month: 'short' })}</label><Textarea aria-label={'Rotina ' + day.date} maxLength={3000} value={day.routine} placeholder="Compromissos, bastidores, oferta ou evento. Pode deixar em branco." onChange={e => setWorkspace(prev => ({ ...prev, storiesAgenda: { ...prev.storiesAgenda!, days: prev.storiesAgenda!.days.map(d => d.id === day.id ? { ...d, routine: e.target.value } : d) } }))} /><label className="text-sm">Quantidade<Input type="number" min={0} max={15} value={day.requestedCount} onChange={e => setWorkspace(prev => ({ ...prev, storiesAgenda: { ...prev.storiesAgenda!, days: prev.storiesAgenda!.days.map(d => d.id === day.id ? { ...d, requestedCount: Math.max(0, Math.min(15, Number(e.target.value))) } : d) } }))} /></label></div>)}<p>{totalStories}/35 Stories incluídos</p><Button disabled={totalStories > 35} onClick={() => void continueGeneration()}>Gerar semana incluída</Button></section>
      : input && <fieldset disabled={busy}><PilotWorkspace strategy={strategy} userInput={input} data={workspace} savedStrategyId={strategyId}
        activeSection={phase === 'dashboard' || phase === 'final' ? reviewSection : phase} balance={wallet?.available} readOnly={viewingVersion}
        onGenerate={protectedGenerate} onSaveVersion={saveChange}
        onFeedback={async feedback => { await pilotService.feedback({ ...feedback, businessId }); toast.success('Avaliação salva nesta versão.'); }} /></fieldset>}
      {!busy && !error && !initialAgenda && job && phase !== 'dashboard' && <div className="flex justify-end"><Button onClick={() => void continueGeneration()}>{phase === 'storiesStrategy' ? 'Concluir matriz, calendário e plano' : 'Confirmar e continuar'}</Button></div>}
    </main>}
    <PilotHistoryDialog open={historyOpen} onClose={() => setHistoryOpen(false)} onOpenGeneration={openGeneration} onOpenRevision={openRevision} />
    <InputDialog isOpen={nameOpen} onClose={() => setNameOpen(false)} onConfirm={saveNamed} onCancel={() => saveNamed('Estratégia ' + new Date().toLocaleDateString('pt-BR'))} title="Nomear sua estratégia" description="A geração já está no histórico. Escolha um nome para organizá-la; salvar usa 0 créditos." label="Nome da estratégia" placeholder="Ex.: Setembro da minha marca" initialValue={strategyName} confirmText="Salvar estratégia" cancelText="Usar nome automático" />
    <Dialog open={!!quote} onOpenChange={open => { if (!open) settleQuote(false); }}><DialogContent><DialogHeader><DialogTitle>Confirmar geração</DialogTitle><DialogDescription>Esta ação usa IA e será registrada no histórico.</DialogDescription></DialogHeader><p className="text-lg font-semibold">{quote?.credits} créditos</p><p>Saldo disponível: {quote?.before}. Após a operação: {quote?.after}.</p><p className="text-sm text-muted-foreground">O saldo fica reservado durante a geração. Em falha técnica, consulte a liberação no extrato antes de tentar novamente.</p><div className="flex justify-end gap-2"><Button variant="outline" onClick={() => settleQuote(false)}>Voltar</Button><Button onClick={() => settleQuote(true)}>Confirmar e gerar</Button></div></DialogContent></Dialog>
  </div>;
}


