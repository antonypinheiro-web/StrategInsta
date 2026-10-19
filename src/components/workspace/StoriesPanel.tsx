import { useEffect, useState } from 'react';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Textarea } from '@/components/ui/textarea';
import { ArrowRight, CalendarDays } from 'lucide-react';
import { StoriesStrategyDisplay } from '@/components/strategy/StoriesStrategyDisplay';
import type { StoriesStrategyItem } from '@/types';
import type { StoriesWeek, StoriesDay, StoryFrame, ContentOrigin, WorkspaceOperation, WorkspaceGenerationPayload, ContentFeedback } from '@/types/workspace';
import { addDays, draftWeek, storiesCredits } from './workspace-model';
import { CostButton } from './WorkspaceControls';
import { StoriesWeekView } from './StoriesWeekView';

interface StoriesPanelProps {
  week?: StoriesWeek; savedAgenda?: StoriesWeek; legacy?: StoriesStrategyItem[]; busy?: boolean;
  onSaveAgenda: (week: StoriesWeek) => Promise<void>;
  onGenerate: (operation: WorkspaceOperation, payload?: Partial<WorkspaceGenerationPayload>) => Promise<unknown>;
  onOpenGenerator: (origin: ContentOrigin, item: StoryFrame | StoriesDay | StoriesWeek) => void;
  onEdit: (origin: ContentOrigin, story: StoryFrame) => Promise<void>;
  onFeedback?: (feedback: ContentFeedback) => Promise<void>;
}
const shortDate = (value: string) => new Date(`${value}T12:00:00`).toLocaleDateString('pt-BR', { day: '2-digit', month: '2-digit' });
const prettyDate = (value: string) => new Date(`${value}T12:00:00`).toLocaleDateString('pt-BR', { weekday: 'long', day: '2-digit', month: '2-digit' });
function localToday() { const now = new Date(); return `${now.getFullYear()}-${String(now.getMonth() + 1).padStart(2, '0')}-${String(now.getDate()).padStart(2, '0')}`; }
export function StoriesPanel({ week, savedAgenda, legacy, busy, onSaveAgenda, onGenerate, onOpenGenerator, onEdit, onFeedback }: StoriesPanelProps) {
  const [agenda, setAgenda] = useState<StoriesWeek>(() => savedAgenda ?? week ?? draftWeek(localToday()));
  const [error, setError] = useState('');
  const [notice, setNotice] = useState('');
  const [pending, setPending] = useState(false);
  const [routineOpen, setRoutineOpen] = useState(!week);
  const [newStart, setNewStart] = useState(localToday);
  useEffect(() => { if (savedAgenda ?? week) setAgenda(savedAgenda ?? week!); }, [savedAgenda, week]);
  const updateDay = (id: string, patch: Partial<StoriesDay>) => setAgenda(current => ({ ...current, days: current.days.map(day => day.id === id ? { ...day, ...patch } : day) }));
  const changed = JSON.stringify(agenda) !== JSON.stringify(savedAgenda ?? week);
  const total = agenda.days.reduce((sum, day) => sum + day.requestedCount, 0);
  const ready = agenda.days.every(day => day.requestedCount === 0 || day.routine.trim().length >= 3);
  const unavailable = busy || pending;
  const execute = async (action: () => Promise<unknown>) => { setPending(true); setError(''); setNotice(''); try { await action(); } catch (reason) { setError(reason instanceof Error ? reason.message : 'Não foi possível concluir. Sua rotina foi preservada.'); } finally { setPending(false); } };
  const generate = (operation: 'stories_day' | 'stories_week', day?: StoriesDay) => execute(async () => { await onSaveAgenda(agenda); await onGenerate(operation, { week: agenda, day, previousWeek: week && week.id !== agenda.id ? week : undefined, origin: { kind: day ? 'day' : 'week', id: day?.id ?? agenda.id, weekId: agenda.id, dayId: day?.id } }); });
  return <section className="space-y-6" aria-label="Estratégia de Stories"><div><p className="text-xs font-medium uppercase tracking-wider text-primary">Sua rotina vira uma sequência</p><h2 className="mt-2 text-2xl font-semibold">Stories com intenção</h2><p className="mt-2 text-sm text-muted-foreground">Conte como será cada dia. A sequência combina retenção, conversa e conversão com os conteúdos de feed.</p></div>
    {error && <p role="alert" className="rounded-md border border-destructive/40 p-3 text-sm text-destructive">{error}</p>}{notice && <p role="status" className="text-sm text-primary">{notice}</p>}
    {week && <div className="flex flex-wrap items-end justify-between gap-3 rounded-xl border bg-card p-4">
      <div><p className="text-xs font-medium uppercase tracking-wider text-muted-foreground">Semana atual</p><p className="mt-1 text-sm font-semibold">{shortDate(week.weekStart)} a {shortDate(addDays(week.weekStart, 6))}</p></div>
      <div className="flex flex-wrap items-end gap-2">
        <label className="space-y-1 text-xs font-medium">Planejar nova semana a partir de<Input type="date" value={newStart} disabled={unavailable} onChange={event => { if (event.target.value) setNewStart(event.target.value); }} /></label>
        <Button variant="outline" disabled={unavailable} onClick={() => { setAgenda(draftWeek(newStart, week)); setRoutineOpen(true); setNotice(`Nova semana de ${shortDate(newStart)} a ${shortDate(addDays(newStart, 6))}. Conte a rotina de cada dia e gere só os dias que quiser.`); }}>Planejar</Button>
      </div>
    </div>}
    <details open={routineOpen} onToggle={event => setRoutineOpen(event.currentTarget.open)} className="group rounded-xl border bg-card p-4 sm:p-5"><summary className="cursor-pointer list-none text-sm font-semibold"><span className="flex flex-wrap items-center justify-between gap-2"><span>Rotina da semana · {total} stories</span><span className="text-xs font-normal text-muted-foreground group-open:hidden">Editar rotina</span></span></summary><div className="mt-4"><div className="flex flex-wrap items-end justify-between gap-4"><label className="space-y-2 text-sm font-medium">Primeiro dia da semana<Input type="date" value={agenda.weekStart} disabled={unavailable} onChange={event => { if (!event.target.value) return; const start = event.target.value; setAgenda(current => ({ ...current, weekStart: start, days: current.days.map((day, index) => ({ ...day, date: addDays(start, index) })) })); }} /></label>{week && <Button variant="outline" disabled={unavailable} onClick={() => { setAgenda(draftWeek(addDays(week.weekStart, 7), week)); setNotice('Próxima semana preparada. Conte a nova rotina e o que realmente aconteceu na anterior.'); }}><ArrowRight className="mr-2 h-4 w-4" />Planejar a próxima semana</Button>}</div>
      {agenda.previousWeekId && <div className="mt-4 rounded-lg bg-primary/5 p-3"><p className="text-sm font-medium">Continuação da semana anterior</p><label className="mt-3 block text-sm">O que você publicou e o que percebeu?<Textarea className="mt-2" rows={2} maxLength={3000} disabled={unavailable} placeholder="Conte o que foi executado e o resultado que observou. Deixe em branco se ainda não publicou." value={agenda.executionFeedback ?? ''} onChange={event => setAgenda(current => ({ ...current, executionFeedback: event.target.value }))} /></label></div>}
      <div className="mt-5 space-y-3">{agenda.days.map(day => <div key={day.id} className="rounded-lg border p-3"><div className="flex flex-wrap items-center justify-between gap-3"><h3 className="text-sm font-semibold capitalize">{prettyDate(day.date)}</h3><label className="flex items-center gap-2 text-xs">Quantos stories?<Input aria-label={`Quantidade de stories em ${prettyDate(day.date)}`} className="w-20" type="number" min={0} max={15} step={1} disabled={unavailable} value={day.requestedCount} onChange={event => updateDay(day.id, { requestedCount: Math.min(15, Math.max(0, Math.round(Number(event.target.value) || 0))) })} /></label></div>{day.requestedCount ? <div className="mt-3 grid gap-3 sm:grid-cols-2"><label className="text-xs text-muted-foreground sm:col-span-2">Como será o seu dia?<Textarea className="mt-1" rows={2} maxLength={3000} value={day.routine} disabled={unavailable} onChange={event => updateDay(day.id, { routine: event.target.value })} placeholder="Ex.: de manhã vou preparar os pedidos; à tarde mostro os bastidores do atendimento." /></label><label className="text-xs text-muted-foreground">Oferta ou evento real (opcional)<Input className="mt-1" maxLength={1000} value={day.offerOrEvent ?? ''} disabled={unavailable} onChange={event => updateDay(day.id, { offerOrEvent: event.target.value })} /></label><label className="text-xs text-muted-foreground">Limites ou recursos (opcional)<Input className="mt-1" maxLength={1000} value={day.restrictions ?? ''} disabled={unavailable} onChange={event => updateDay(day.id, { restrictions: event.target.value })} placeholder="Ex.: sem aparecer; 15 minutos para gravar" /></label><div className="sm:col-span-2"><CostButton size="sm" variant="outline" credits={storiesCredits([day], 'day')} busy={unavailable} disabled={day.routine.trim().length < 3} onClick={() => generate('stories_day', day)}>Gerar somente este dia</CostButton></div></div> : <p className="mt-2 text-xs text-muted-foreground">Dia sem publicação. Não será gerado nenhum story.</p>}</div>)}</div>
      <div className="mt-5 flex flex-wrap items-center justify-between gap-3"><div><p className="text-sm font-medium">{total} stories nesta semana</p><p className="mt-1 text-xs text-muted-foreground">Editar a rotina não altera os roteiros automaticamente.</p></div><div className="flex flex-wrap gap-2"><CostButton variant="outline" credits={0} busy={unavailable} disabled={!changed} onClick={() => execute(async () => { await onSaveAgenda(agenda); setNotice('Rotina salva. Gere apenas o dia ou a semana que deseja atualizar.'); })}>Salvar rotina</CostButton><CostButton credits={storiesCredits(agenda.days, 'week')} busy={unavailable} disabled={!ready || !total} onClick={() => generate('stories_week')}><CalendarDays className="mr-2 h-4 w-4" />Gerar semana</CostButton></div></div>
    </div></details>
    {week ? <div className="space-y-4"><div className="flex flex-wrap items-center justify-between gap-3"><h3 className="text-xl font-semibold">Sequência de {new Date(`${week.weekStart}T12:00:00`).toLocaleDateString('pt-BR')}</h3><Button variant="outline" size="sm" disabled={unavailable} onClick={() => onOpenGenerator({ kind: 'week', id: week.id, weekId: week.id }, week)}>Abrir semana no gerador</Button></div>{week.continuationSummary && <p className="rounded-lg bg-muted/30 p-4 text-sm">{week.continuationSummary}</p>}<StoriesWeekView week={week} unavailable={unavailable} onOpenGenerator={onOpenGenerator} onEdit={onEdit} onFeedback={onFeedback} /></div> : legacy?.length ? <details className="rounded-xl border p-4"><summary className="cursor-pointer text-sm font-medium">Ver semana da versão anterior</summary><p className="my-3 text-sm text-muted-foreground">A versão anterior não contém rotina nem uma sequência individual de stories. Sua nova rotina acima será usada na próxima geração.</p><StoriesStrategyDisplay content={legacy} /></details> : null}
  </section>;
}
