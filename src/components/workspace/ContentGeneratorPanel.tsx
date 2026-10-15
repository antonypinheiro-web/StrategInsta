import { useEffect, useState } from 'react';
import { Button } from '@/components/ui/button';
import { Label } from '@/components/ui/label';
import { Textarea } from '@/components/ui/textarea';
import { ArrowLeft } from 'lucide-react';
import type { ContentOrigin, ContentFormat, ContentStatus, ContentIdea, StoryFrame, StoriesDay, StoriesWeek, GeneratedContent, WorkspaceOperation, WorkspaceGenerationPayload, ContentFeedback } from '@/types/workspace';
import { CostButton, FeedbackButton, ManualEditor, RefinementBox } from './WorkspaceControls';
import { CopyButton } from './CopyButton';
import { blockToText, scriptToText } from '@/lib/content-text';
import { calendarFormat, storiesCredits } from './workspace-model';
import type { CalendarDay } from '@/types';

const FORMAT_OPTIONS: { value: ContentFormat; label: string; hint: string }[] = [
  { value: 'reel', label: 'Vídeo (Reel)', hint: 'cenas, fala e texto na tela' },
  { value: 'carousel', label: 'Carrossel', hint: 'slides e legenda' },
  { value: 'static', label: 'Post estático', hint: 'arte e legenda' },
  { value: 'stories', label: 'Stories', hint: 'sequência com recursos do Instagram' },
];
const formatLabel = (value: ContentFormat) => FORMAT_OPTIONS.find(option => option.value === value)?.label ?? value;

export interface GeneratorSource { origin: ContentOrigin; item: ContentIdea | StoryFrame | StoriesDay | StoriesWeek | CalendarDay; }
interface ContentGeneratorPanelProps {
  source?: GeneratorSource; scripts: GeneratedContent[]; week?: StoriesWeek; busy?: boolean;
  onBack: () => void;
  onGenerate: (operation: WorkspaceOperation, payload?: Partial<WorkspaceGenerationPayload>) => Promise<unknown>;
  onEditScript: (script: GeneratedContent) => Promise<void>;
  onFeedback?: (feedback: ContentFeedback) => Promise<void>;
  onSetStatus?: (script: GeneratedContent, status: ContentStatus) => Promise<void>;
}
export function ContentGeneratorPanel({ source, scripts, week, busy, onBack, onGenerate, onEditScript, onFeedback, onSetStatus }: ContentGeneratorPanelProps) {
  const [format, setFormat] = useState<ContentFormat | undefined>();
  const [instruction, setInstruction] = useState('');
  const [error, setError] = useState('');
  const sourceId = source?.origin.id;
  const sourceKind = source?.origin.kind;
  // Matrix ideas have no format: the user picks one. Calendar days bring their own format.
  const calendarItem = sourceKind === 'calendar' ? source!.item as CalendarDay : undefined;
  const fixedFormat = calendarItem ? calendarFormat(calendarItem.contentType) : undefined;
  const sourceFormat = fixedFormat ?? (sourceKind === 'idea' ? (source!.item as ContentIdea).format : undefined);
  const needsFormat = sourceKind === 'idea' || sourceKind === 'calendar';
  useEffect(() => { setFormat(sourceFormat); setInstruction(''); setError(''); }, [sourceId, sourceKind, sourceFormat]);
  const relevant = source ? scripts.filter(script => script.origin.id === source.origin.id) : scripts;
  const latest = relevant.at(-1);
  const prior = relevant.length > 1 ? relevant.at(-2) : undefined;
  const [compare, setCompare] = useState(false);
  const run = async () => {
    if (!source) return;
    setError('');
    try {
      if (source.origin.kind === 'day') await onGenerate('stories_day', { origin: source.origin, week, day: source.item as StoriesDay, instruction });
      else if (source.origin.kind === 'week') await onGenerate('stories_week', { origin: source.origin, week: source.item as StoriesWeek, instruction });
      else if (source.origin.kind === 'story') await onGenerate('item_refine', { origin: source.origin, item: source.item as StoryFrame, instruction });
      else {
        if (!format) { setError('Escolha o formato antes de gerar.'); return; }
        const item = calendarItem ? { id: source.origin.id, title: calendarItem.topic, angle: calendarItem.caption, briefingBasis: `Calendário, dia ${calendarItem.day}`, format } : source.item as ContentIdea;
        await onGenerate('content_script', { origin: source.origin, item, format, instruction });
      }
    } catch (reason) { setError(reason instanceof Error ? reason.message : 'Não foi possível gerar. Sua instrução continua aqui.'); }
  };
  const credits = source?.origin.kind === 'week' ? storiesCredits((source.item as StoriesWeek).days, 'week') : source?.origin.kind === 'day' ? storiesCredits([source.item as StoriesDay], 'day') : source?.origin.kind === 'story' ? 1 : 2;
  const renderScript = (script: GeneratedContent, previous = false) => <article className="space-y-4 rounded-xl border bg-card p-5" key={script.id}><div className="flex flex-wrap items-start justify-between gap-3"><div><p className="text-xs font-medium uppercase tracking-wide text-primary">{previous ? 'Versão anterior' : 'Roteiro atual'}</p><h3 className="mt-2 text-xl font-semibold">{script.title}</h3></div><div className="flex flex-wrap items-center gap-2">{!previous && <span className={`rounded-full px-2 py-0.5 text-xs font-medium ${script.status === 'posted' ? 'bg-emerald-500/15 text-emerald-600 dark:text-emerald-400' : 'bg-primary/10 text-primary'}`}>{script.status === 'posted' ? 'Postado' : 'Gerado'}</span>}{!previous && onSetStatus && <Button size="sm" variant="secondary" disabled={busy} onClick={() => void onSetStatus(script, script.status === 'posted' ? 'generated' : 'posted')}>{script.status === 'posted' ? 'Desmarcar postado' : 'Marcar como postado'}</Button>}<CopyButton label="Copiar tudo" getText={() => scriptToText(script)} /></div></div><p className="text-sm text-muted-foreground">{script.objective}</p><ol className="space-y-3">{script.blocks.map((block, index) => <li key={block.id} className="rounded-lg border p-4"><div className="flex items-start justify-between gap-2"><h4 className="text-sm font-semibold">{index + 1}. {block.label}</h4><CopyButton variant="ghost" ariaLabel={`Copiar ${block.label}`} getText={() => blockToText(block, index)} /></div><dl className="mt-3 space-y-3 text-sm">{[['O que fazer', block.action], ['Fala', block.speech], ['Texto na tela', block.onScreen], ['Texto', block.text]].filter(([, value]) => value).map(([label, value]) => <div key={label}><dt className="text-xs font-medium text-muted-foreground">{label}</dt><dd className="mt-1 whitespace-pre-wrap leading-6">{value}</dd></div>)}</dl>{!previous && <div className="mt-3"><ManualEditor title={`Editar ${block.label}`} disabled={busy} fields={[...(block.action ? [{ key: 'action', label: 'O que fazer', value: block.action, maxLength: 1500 }] : []), ...(block.speech ? [{ key: 'speech', label: 'Fala', value: block.speech, maxLength: 2000 }] : []), ...(block.onScreen ? [{ key: 'onScreen', label: 'Texto na tela', value: block.onScreen, maxLength: 500 }] : []), ...(block.text ? [{ key: 'text', label: 'Texto', value: block.text, maxLength: 2000 }] : [])]} onSave={values => onEditScript({ ...script, blocks: script.blocks.map(current => current.id === block.id ? { ...current, ...values } : current) })} /></div>}</li>)}</ol>{script.caption && <div className="rounded-lg bg-muted/30 p-4"><div className="flex items-center justify-between gap-2"><h4 className="text-sm font-medium">Legenda</h4><CopyButton variant="ghost" ariaLabel="Copiar legenda" getText={() => script.caption ?? ''} /></div><p className="mt-2 whitespace-pre-wrap text-sm leading-6">{script.caption}</p></div>}{script.cta && <p className="border-l-2 border-primary pl-3 text-sm"><strong>Próximo passo:</strong> {script.cta}</p>}{!previous && <div className="space-y-3"><FeedbackButton contentId={script.id} versionId={script.versionId} onFeedback={onFeedback} disabled={busy} /><RefinementBox disabled={busy} credits={2} onRefine={value => onGenerate('content_script', { origin: script.origin, item: script, format: script.format, instruction: value })} /></div>}</article>;
  return <section className="space-y-5" aria-label="Gerador de conteúdo"><Button size="sm" variant="ghost" onClick={onBack}><ArrowLeft className="mr-2 h-4 w-4" />Voltar à origem</Button><div><p className="text-xs font-medium uppercase tracking-wider text-primary">Pronto para você produzir</p><h2 className="mt-2 text-2xl font-semibold">Gerador de conteúdo</h2></div>{error && <p role="alert" className="text-sm text-destructive">{error}</p>}
    {source ? <div className="space-y-4 rounded-xl border bg-card p-5"><div className="rounded-lg bg-muted/30 p-3"><p className="text-xs font-medium text-muted-foreground">Origem preservada</p><p className="mt-1 text-sm font-semibold">{calendarItem ? `Dia ${calendarItem.day}: ${calendarItem.topic}` : 'title' in source.item ? source.item.title : 'narrative' in source.item ? source.item.narrative : 'date' in source.item ? `Dia ${source.item.date}` : `Semana ${(source.item as StoriesWeek).weekStart}`}</p>{calendarItem?.caption && <p className="mt-2 text-sm text-muted-foreground">{calendarItem.caption}</p>}{'briefingBasis' in source.item && <p className="mt-2 text-sm text-muted-foreground">{source.item.briefingBasis}</p>}{'routine' in source.item && <p className="mt-2 text-sm text-muted-foreground">{source.item.routine}</p>}</div>{needsFormat && (fixedFormat ? <p className="text-sm"><span className="text-muted-foreground">Formato definido no calendário:</span> <strong>{formatLabel(fixedFormat)}</strong></p> : <div><p id="generator-format" className="text-sm font-medium">Em que formato será este conteúdo?</p><div role="radiogroup" aria-labelledby="generator-format" className="mt-2 grid gap-2 sm:grid-cols-2">{FORMAT_OPTIONS.map(option => <button key={option.value} type="button" role="radio" aria-checked={format === option.value} disabled={busy} onClick={() => setFormat(option.value)} className={`rounded-lg border p-3 text-left text-sm transition-colors ${format === option.value ? 'border-primary bg-primary/10' : 'hover:bg-muted/40'}`}><span className="font-medium">{option.label}</span><span className="mt-1 block text-xs text-muted-foreground">{option.hint}</span></button>)}</div></div>)}<div><Label htmlFor="generator-instruction">{needsFormat ? 'Algum ajuste antes de gerar? (opcional)' : 'Qual ajuste você quer fazer neste escopo?'}</Label><Textarea className="mt-2" id="generator-instruction" maxLength={1500} rows={3} value={instruction} disabled={busy} onChange={event => setInstruction(event.target.value)} placeholder="Descreva o tom, a rotina ou a mudança que deseja. A oferta e as informações do seu negócio continuam no contexto." /></div><p className="text-xs text-muted-foreground">{source.origin.kind === 'story' ? 'Apenas este story será refinado. Confira depois a ligação com os stories vizinhos.' : source.origin.kind === 'day' ? 'Só este dia será atualizado; os demais dias permanecem como estão.' : source.origin.kind === 'week' ? 'A semana inteira será atualizada com as quantidades da rotina.' : 'Abrir e escolher o formato é gratuito. O storyboard entrega cena a cena (ou slide a slide), texto na tela e legenda pronta para você produzir.'}</p><CostButton credits={credits} busy={busy} disabled={(needsFormat ? !format : instruction.trim().length < 5) || credits === 0} onClick={run}>{needsFormat ? 'Gerar storyboard' : 'Aplicar ajuste'}</CostButton></div> : <p className="rounded-xl border p-5 text-sm text-muted-foreground">Escolha uma ideia na matriz, um dia do calendário ou uma sequência de Stories para abrir seu contexto aqui.</p>}
    {source && latest && <><div className="flex items-center justify-between"><h3 className="text-lg font-semibold">Seu roteiro</h3>{prior && <Button size="sm" variant="outline" onClick={() => setCompare(value => !value)}>{compare ? 'Fechar comparação' : 'Comparar com anterior'}</Button>}</div><div className={compare && prior ? 'grid gap-4 xl:grid-cols-2' : ''}>{compare && prior && renderScript(prior, true)}{renderScript(latest)}</div></>}
    {!source && scripts.length > 0 && <div className="space-y-4">{scripts.slice(-10).reverse().map(script => renderScript(script))}</div>}
  </section>;
}
