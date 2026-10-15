import { useEffect, useRef, useState } from 'react';
import { Button } from '@/components/ui/button';
import { Textarea } from '@/components/ui/textarea';
import { StrategyText } from '@/components/strategy/StrategyText';
import { EditorialCalendarDisplay } from '@/components/strategy/EditorialCalendarDisplay';
import { ActionPlanDisplay } from '@/components/strategy/ActionPlanDisplay';
import type { CalendarDay, GeneratedStrategy } from '@/types';
import type { PilotWorkspaceProps, PilotWorkspaceData, ContentOrigin, ContentStatus, WorkspaceOperation, WorkspaceGenerationPayload, WorkspaceChange, GeneratedContent } from '@/types/workspace';
import { calendarFormat, replaceWorkspaceItem, scriptSchema } from './workspace-model';
import { CostButton, ManualEditor } from './WorkspaceControls';
import { ContentMatrixPanel } from './ContentMatrixPanel';
import { ContentGeneratorPanel } from './ContentGeneratorPanel';
import { ContentLibraryPanel } from './ContentLibraryPanel';
import type { GeneratorSource } from './ContentGeneratorPanel';
import { StoriesPanel } from './StoriesPanel';
import { MonetizationPanel } from './MonetizationPanel';
import { BioPanel } from './BioPanel';

const sections = [
  ['idealCustomerProfile', 'Cliente ideal'], ['monetizationIdeas', 'Monetização'],
  ['instagramBio', 'Bio'], ['contentTable', 'Matriz'], ['storiesStrategy', 'Stories'],
  ['editorialCalendar', 'Calendário'], ['contentLibrary', 'Conteúdos'], ['actionPlan', 'Plano de ação'],
] as const;
const sectionNames: Record<string, string> = { ...Object.fromEntries(sections), contentGenerator: 'Gerador' };
const FORMAT_NAMES = { reel: 'Reel', carousel: 'Carrossel', static: 'Post estático', stories: 'Stories' } as const;
const calendarFormatName = (value: string) => { const format = calendarFormat(value); return format ? FORMAT_NAMES[format] : value; };
function resolveSource(source: GeneratorSource | undefined, data: PilotWorkspaceData, calendar: CalendarDay[] = []): GeneratorSource | undefined {
  if (!source) return undefined;
  const { origin } = source;
  if (origin.kind === 'calendar') { const day = calendar.find(item => `calendar-day-${item.day}` === origin.id); return day ? { origin, item: day } : source; }
  if (origin.kind === 'idea') { const idea = data.matrix?.cells.find(cell => cell.id === origin.cellId)?.ideas.find(item => item.id === origin.id); return idea ? { origin, item: idea } : source; }
  const week = data.storiesWeek;
  if (origin.kind === 'week' && week?.id === origin.id) return { origin, item: week };
  const day = week?.days.find(item => item.id === origin.dayId);
  if (origin.kind === 'day' && day) return { origin, item: day };
  const story = day?.stories.find(item => item.id === origin.id);
  return story ? { origin, item: story } : source;
}

/** The host owns persistence, quotes and charging. This surface edits only the explicit scope. */
export function PilotWorkspace({ strategy, userInput, savedStrategyId, data, activeSection, balance, readOnly = false, onGenerate, onSaveVersion, onFeedback }: PilotWorkspaceProps) {
  const [section, setSection] = useState(activeSection ?? 'idealCustomerProfile');
  const [source, setSource] = useState<GeneratorSource>();
  const [returnSection, setReturnSection] = useState('contentTable');
  const [pending, setBusy] = useState(false);
  const busy = pending || readOnly;
  const lock = useRef(false);
  const [error, setError] = useState('');
  const [instruction, setInstruction] = useState('');
  useEffect(() => { if (activeSection) { setSection(activeSection); setInstruction(''); } }, [activeSection]);
  const runExclusive = async <T,>(action: () => Promise<T>): Promise<T> => {
    if (readOnly) throw new Error('Esta versão está aberta somente para consulta. Use uma cópia para fazer ajustes.');
    if (lock.current) throw new Error('Aguarde a operação em andamento.');
    lock.current = true; setBusy(true); setError('');
    try { return await action(); } catch (reason) { const message = reason instanceof Error ? reason.message : 'Não foi possível concluir. Seu conteúdo anterior continua disponível.'; setError(message); throw reason; } finally { lock.current = false; setBusy(false); }
  };
  const generate = (operation: WorkspaceOperation, payload: Partial<WorkspaceGenerationPayload> = {}) => runExclusive(() => onGenerate(operation, { ...payload, strategyId: savedStrategyId, workspace: data, userInput, strategy: { ...strategy, ...data.overrides }, selectedMonetizationIds: payload.selectedMonetizationIds ?? data.selectedMonetizationIds }));
  const save = (change: WorkspaceChange) => runExclusive(() => onSaveVersion(change));
  const editItem = (origin: ContentOrigin, value: unknown) => save({ kind: 'manual_edit', title: 'Edição manual de conteúdo', source: origin, data: replaceWorkspaceItem(data, origin, value) });
  const editScript = (script: GeneratedContent) => save({ kind: 'manual_edit', title: `Edição de ${script.title}`, source: { kind: 'section', id: script.id }, data: { ...data, scripts: data.scripts.map(item => item.id === script.id ? { ...scriptSchema.parse(script), versionId: undefined } : item) } });
  const openGenerator: (origin: ContentOrigin, item: GeneratorSource['item']) => void = (origin, item) => { setReturnSection(section); setSource({ origin, item }); setSection('contentGenerator'); };
  const setScriptStatus = (script: GeneratedContent, status: ContentStatus) => save({ kind: 'manual_edit', title: status === 'posted' ? `Postado: ${script.title}` : `Voltou para gerado: ${script.title}`, source: { kind: 'section', id: script.id }, data: { ...data, scripts: data.scripts.map(item => item.id === script.id ? { ...item, status, postedAt: status === 'posted' ? new Date().toISOString() : undefined } : item) } });
  // Opens a content from the library; when its origin no longer exists, the content itself is the context.
  const openScript = (script: GeneratedContent) => { const resolved = resolveSource({ origin: script.origin, item: { id: script.origin.id, title: script.title, angle: script.objective, briefingBasis: '', format: script.format } }, data, selectedStrategy.editorialCalendar); openGenerator(script.origin, resolved!.item); };
  const updateSelection = (selectedMonetizationIds: string[]) => save({ kind: 'selection', title: 'Seleção de oportunidades', changedSections: ['instagramBio', 'contentTable', 'storiesStrategy', 'editorialCalendar', 'actionPlan', 'monetizationPlan'], data: { ...data, selectedMonetizationIds, staleSections: [...new Set([...(data.staleSections ?? []).filter(item => item !== 'monetizationSelection'), 'instagramBio', 'contentTable', 'storiesStrategy', 'editorialCalendar', 'actionPlan', 'monetizationPlan'])] } });
  const selectedStrategy = { ...strategy, ...data.overrides };
  const saveSection = (key: keyof GeneratedStrategy, output: GeneratedStrategy[keyof GeneratedStrategy], title: string) => save({ kind: 'manual_edit', title, source: { kind: 'section', id: key }, data: { ...data, overrides: { ...data.overrides, [key]: output }, staleSections: (data.staleSections ?? []).filter(item => item !== key) } });
  const renderContent = () => {
    if (section === 'contentTable') return <ContentMatrixPanel matrix={data.matrix} legacy={strategy.contentTable} busy={busy} onGenerate={generate} onEdit={editItem} onOpenGenerator={openGenerator} onFeedback={onFeedback} />;
    if (section === 'monetizationIdeas') return <MonetizationPanel analysis={data.monetization} selectedIds={data.selectedMonetizationIds} plan={data.monetizationPlan} planStale={data.staleSections?.includes('monetizationPlan')} onEditAnalysis={analysis => save({ kind: 'manual_edit', title: 'Edição da análise de monetização', data: { ...data, monetization: analysis, staleSections: [...new Set([...(data.staleSections ?? []), 'monetizationPlan', 'contentTable', 'storiesStrategy'])] } })} onEditPlan={plan => save({ kind: 'manual_edit', title: 'Edição do plano de monetização', data: { ...data, monetizationPlan: plan } })} legacy={strategy.monetizationIdeas} busy={busy} onSelectionChange={updateSelection} onGeneratePlan={() => generate('monetization_plan')} onGenerateAnalysis={() => generate('monetization_analyze')} />;
    if (section === 'instagramBio') return <BioPanel bios={data.bios} legacy={strategy.instagramBio} username={userInput.username} busy={busy} onGenerate={generate} onEdit={editItem} />;
    if (section === 'storiesStrategy') return <StoriesPanel week={data.storiesWeek} savedAgenda={data.storiesAgenda} legacy={strategy.storiesStrategy} busy={busy} onSaveAgenda={week => save({ kind: 'agenda', title: `Rotina da semana ${week.weekStart}`, data: { ...data, storiesAgenda: week } })} onGenerate={generate} onOpenGenerator={openGenerator} onEdit={editItem} onFeedback={onFeedback} />;
    if (section === 'contentLibrary') return <ContentLibraryPanel scripts={data.scripts} busy={busy} onOpen={openScript} onSetStatus={setScriptStatus} />;
    if (section === 'contentGenerator') return <ContentGeneratorPanel onSetStatus={setScriptStatus} source={resolveSource(source, data, selectedStrategy.editorialCalendar)} scripts={data.scripts} week={data.storiesWeek} busy={busy} onBack={() => setSection(returnSection)} onGenerate={generate} onEditScript={editScript} onFeedback={onFeedback} />;
    if (section === 'editorialCalendar') return <div className="space-y-5"><EditorialCalendarDisplay content={selectedStrategy.editorialCalendar ?? []} />{!!selectedStrategy.editorialCalendar?.length && <div className="rounded-xl border p-4"><h3 className="text-sm font-semibold">Criar o conteúdo de um dia</h3><p className="mt-1 text-xs text-muted-foreground">O formato sugerido pelo calendário já vem definido. Abrir é gratuito; o custo aparece antes de gerar.</p><div className="mt-3 grid gap-2 sm:grid-cols-2">{selectedStrategy.editorialCalendar.map(day => <div key={day.day} className="flex items-center justify-between gap-3 rounded-lg border p-3"><p className="min-w-0 text-sm"><span className="text-xs font-medium uppercase text-primary">Dia {day.day} · {calendarFormatName(day.contentType)}</span><span className="mt-1 block truncate">{day.topic}</span></p><Button size="sm" variant="secondary" disabled={busy} onClick={() => openGenerator({ kind: 'calendar', id: `calendar-day-${day.day}` }, day)}>Criar conteúdo</Button></div>)}</div></div>}<details className="rounded-xl border p-4"><summary className="cursor-pointer text-sm font-medium">Editar um dia do calendário · 0 TPs</summary><div className="mt-4 grid gap-3 sm:grid-cols-2">{selectedStrategy.editorialCalendar?.map(day => <div key={day.day} className="flex items-center justify-between gap-3 rounded-lg border p-3"><p className="text-sm">Dia {day.day}: {day.topic}</p><ManualEditor title={`Editar dia ${day.day}`} disabled={busy} fields={[{ key: 'topic', label: 'Tema', value: day.topic, maxLength: 500 }, { key: 'caption', label: 'Legenda', value: day.caption, maxLength: 2200 }]} onSave={values => saveSection('editorialCalendar', selectedStrategy.editorialCalendar!.map(current => current.day === day.day ? { ...current, ...values } : current), `Calendário: dia ${day.day}`)} /></div>)}</div></details></div>;
    if (section === 'actionPlan') return <div className="space-y-5"><ActionPlanDisplay content={selectedStrategy.actionPlan ?? []} /><details className="rounded-xl border p-4"><summary className="cursor-pointer text-sm font-medium">Editar uma tarefa · 0 TPs</summary><div className="mt-4 space-y-3">{selectedStrategy.actionPlan?.flatMap(week => week.tasks.map((task, index) => <div key={`${week.week}-${index}`} className="flex items-center justify-between gap-3 rounded-lg border p-3"><p className="text-sm">Semana {week.week}: {task.task}</p><ManualEditor title="Editar tarefa do plano" disabled={busy} fields={[{ key: 'task', label: 'Tarefa', value: task.task, maxLength: 300 }, { key: 'description', label: 'Como fazer', value: task.description, maxLength: 2500 }]} onSave={values => saveSection('actionPlan', selectedStrategy.actionPlan!.map(current => current.week === week.week ? { ...current, tasks: current.tasks.map((item, taskIndex) => taskIndex === index ? { ...item, ...values } : item) } : current), `Plano de ação: semana ${week.week}`)} /></div>))}</div></details></div>;
    const content = selectedStrategy.idealCustomerProfile;
    return <section className="space-y-5"><div><p className="text-xs font-medium uppercase tracking-wider text-primary">Quem seu negócio pode atender melhor</p><h2 className="mt-2 text-2xl font-semibold">Perfil de cliente ideal</h2><p className="mt-2 text-sm text-muted-foreground">Revise os fatos usados e valide as hipóteses com seus clientes.</p></div>{content ? <><div className="rounded-xl border bg-card p-5 sm:p-7"><StrategyText content={content} /></div><ManualEditor title="Editar perfil de cliente ideal" disabled={busy} fields={[{ key: 'text', label: 'Perfil e hipóteses', value: content, maxLength: 12000 }]} onSave={values => saveSection('idealCustomerProfile', values.text, 'Edição do perfil de cliente ideal')} /></> : <p className="rounded-xl border p-5 text-sm text-muted-foreground">O perfil será construído com base no briefing do seu negócio.</p>}<div className="space-y-3 rounded-xl border bg-muted/20 p-4"><label className="block text-sm font-medium">O que você quer revisar no perfil?<Textarea className="mt-2" rows={3} maxLength={1500} value={instruction} disabled={busy} onChange={event => setInstruction(event.target.value)} placeholder="Ex.: concentrar o perfil na oferta principal e revisar a objeção de preço." /></label><CostButton busy={busy} disabled={!!content && instruction.trim().length < 5} onClick={async () => { try { await generate('section_regenerate', { section: 'idealCustomerProfile', instruction }); setInstruction(''); } catch { /* The operation error is displayed above and the draft remains. */ } }}>Cotar atualização do perfil</CostButton></div></section>;
  };
  return <div className="min-w-0 space-y-5">{!activeSection && <nav className="flex flex-wrap gap-2" aria-label="Seções da estratégia">{sections.map(([key, label]) => <Button key={key} size="sm" variant={section === key ? 'default' : 'outline'} onClick={() => setSection(key)}>{label}</Button>)}</nav>}
    {balance !== undefined && <p className="text-right text-xs text-muted-foreground">Saldo de IA: {balance} {balance === 1 ? 'TP' : 'TPs'}. O custo final é confirmado antes de gerar.</p>}
    {error && <p role="alert" className="rounded-xl border border-destructive/40 p-3 text-sm text-destructive">{error}</p>}
    {data.staleSections?.includes(section) && <div role="status" className="rounded-xl border border-amber-500/40 bg-amber-500/5 p-4 text-sm">{sectionNames[section] ?? 'Este conteúdo'} usa respostas ou escolhas anteriores. Revise antes de publicar. Atualizar é uma nova geração com custo informado.</div>}
    {renderContent()}
  </div>;
}
