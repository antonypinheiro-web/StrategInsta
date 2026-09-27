import { useState } from 'react';
import { Button } from '@/components/ui/button';
import { Dialog, DialogContent, DialogHeader, DialogTitle, DialogDescription } from '@/components/ui/dialog';
import { Label } from '@/components/ui/label';
import { Input } from '@/components/ui/input';
import { Textarea } from '@/components/ui/textarea';
import { Loader2, Pencil, MessageSquare } from 'lucide-react';
import type { ContentFeedback } from '@/types/workspace';

export function CostButton({ children, credits, busy, ...props }: React.ComponentProps<typeof Button> & { credits?: number; busy?: boolean }) {
  return <Button {...props} disabled={props.disabled || busy}>{busy && <Loader2 className="mr-2 h-4 w-4 animate-spin" />}{children}{credits !== undefined && <span className="ml-1 whitespace-nowrap">· {credits} {credits === 1 ? 'crédito' : 'créditos'}</span>}</Button>;
}
export interface EditField { key: string; label: string; value: string; maxLength: number; required?: boolean; }
export function ManualEditor({ title, fields, onSave, disabled }: { title: string; fields: EditField[]; onSave: (values: Record<string, string>) => Promise<void>; disabled?: boolean }) {
  const [open, setOpen] = useState(false);
  const [values, setValues] = useState<Record<string, string>>({});
  const [saving, setSaving] = useState(false);
  const [error, setError] = useState('');
  const changed = fields.some(field => (values[field.key] ?? field.value) !== field.value);
  const valid = fields.every(field => (field.required === false || (values[field.key] ?? field.value).trim().length > 0) && Array.from(values[field.key] ?? field.value).length <= field.maxLength);
  const save = async () => { setSaving(true); setError(''); try { await onSave(values); setOpen(false); } catch (reason) { setError(reason instanceof Error ? reason.message : 'Não foi possível salvar. Sua edição continua aqui.'); } finally { setSaving(false); } };
  return <>
    <Button size="sm" variant="outline" disabled={disabled} onClick={() => { setValues(Object.fromEntries(fields.map(field => [field.key, field.value]))); setError(''); setOpen(true); }}><Pencil className="mr-1 h-3.5 w-3.5" />Editar</Button>
    <Dialog open={open} onOpenChange={value => !saving && setOpen(value)}><DialogContent className="max-h-[90vh] max-w-3xl overflow-y-auto"><DialogHeader><DialogTitle>{title}</DialogTitle><DialogDescription>Salvar cria uma revisão. A edição manual usa 0 créditos.</DialogDescription></DialogHeader>
      <div className="space-y-5">{fields.map(field => <div key={field.key} className="space-y-2"><Label htmlFor={`edit-${field.key}`}>{field.label}</Label><div className="grid gap-3 sm:grid-cols-2"><div className="rounded-lg border bg-muted/30 p-3"><p className="mb-2 text-xs font-medium text-muted-foreground">Versão atual</p><p className="whitespace-pre-wrap text-sm">{field.value}</p></div><div><Textarea id={`edit-${field.key}`} value={values[field.key] ?? ''} onChange={event => setValues(current => ({ ...current, [field.key]: event.target.value }))} rows={5} /><p className={`mt-1 text-xs ${Array.from(values[field.key] ?? '').length > field.maxLength ? 'text-destructive' : 'text-muted-foreground'}`}>{Array.from(values[field.key] ?? '').length}/{field.maxLength}</p></div></div></div>)}</div>
      {error && <p role="alert" className="text-sm text-destructive">{error}</p>}<div className="flex justify-end gap-2"><Button variant="outline" disabled={saving} onClick={() => setOpen(false)}>Cancelar</Button><CostButton credits={0} busy={saving} disabled={!changed || !valid} onClick={save}>Salvar revisão</CostButton></div>
    </DialogContent></Dialog>
  </>;
}

export function FeedbackButton({ contentId, versionId, onFeedback, disabled }: { contentId: string; versionId?: string; onFeedback?: (feedback: ContentFeedback) => Promise<void>; disabled?: boolean }) {
  const [open, setOpen] = useState(false);
  const [rating, setRating] = useState<ContentFeedback['rating']>('unrated');
  const [goal, setGoal] = useState<ContentFeedback['goal']>('interaction');
  const [published, setPublished] = useState(false);
  const [publishedAt, setPublishedAt] = useState('');
  const [metrics, setMetrics] = useState('');
  const [period, setPeriod] = useState('');
  const [notes, setNotes] = useState('');
  const [error, setError] = useState('');
  const [saving, setSaving] = useState(false);
  const save = async () => { if (!versionId || !onFeedback) return; setSaving(true); setError(''); try { await onFeedback({ contentId, versionId, rating, goal, published, publishedAt: published ? publishedAt : undefined, metrics: published ? metrics : undefined, period: published ? period : undefined, notes }); setOpen(false); } catch (reason) { setError(reason instanceof Error ? reason.message : 'Não foi possível salvar a avaliação.'); } finally { setSaving(false); } };
  return <><Button size="sm" variant="ghost" disabled={disabled || !versionId || !onFeedback} title={!versionId ? 'Salve uma versão para vinculá-la à avaliação' : 'Registrar avaliação desta versão'} onClick={() => setOpen(true)}><MessageSquare className="mr-1 h-3.5 w-3.5" />Avaliar</Button>
    <Dialog open={open} onOpenChange={value => !saving && setOpen(value)}><DialogContent className="max-h-[90vh] overflow-y-auto"><DialogHeader><DialogTitle>Como foi este conteúdo?</DialogTitle><DialogDescription>A avaliação fica vinculada a esta versão. Sua opinião e o resultado publicado são referências diferentes.</DialogDescription></DialogHeader>
      <fieldset className="space-y-2"><legend className="text-sm font-medium">Sua avaliação</legend><div className="flex flex-wrap gap-2">{([['good', 'Deu bom'], ['bad', 'Deu ruim'], ['unrated', 'Ainda não avaliei']] as const).map(([value, label]) => <Button type="button" size="sm" key={value} variant={rating === value ? 'default' : 'outline'} aria-pressed={rating === value} onClick={() => setRating(value)}>{label}</Button>)}</div></fieldset>
      <Label htmlFor="feedback-goal">Qual era o objetivo?</Label><select id="feedback-goal" className="h-10 rounded-md border bg-background px-3 text-sm" value={goal} onChange={event => setGoal(event.target.value as ContentFeedback['goal'])}><option value="reach">Alcance</option><option value="interaction">Interação</option><option value="retention">Retenção</option><option value="conversion">Conversão</option></select>
      <label className="flex items-center gap-2 text-sm"><input type="checkbox" checked={published} onChange={event => setPublished(event.target.checked)} />Publiquei esta versão</label>
      {published ? <><Label htmlFor="feedback-date">Data de publicação</Label><Input id="feedback-date" type="date" value={publishedAt} max={new Date().toLocaleDateString('en-CA')} onChange={event => setPublishedAt(event.target.value)} /><Label htmlFor="feedback-metrics">Métricas observadas (opcional)</Label><Textarea id="feedback-metrics" maxLength={1500} value={metrics} onChange={event => setMetrics(event.target.value)} placeholder="Ex.: 2.100 visualizações, 8 respostas. Informe somente dados que você viu." /><Label htmlFor="feedback-period">Período das métricas (opcional)</Label><Input id="feedback-period" value={period} maxLength={200} onChange={event => setPeriod(event.target.value)} placeholder="Ex.: primeiros 7 dias após a publicação" /></> : <p className="rounded-md bg-muted p-3 text-sm text-muted-foreground">Sem publicação, esta avaliação representa sua opinião sobre o texto.</p>}
      <Label htmlFor="feedback-notes">O que percebeu? (opcional)</Label><Textarea id="feedback-notes" maxLength={1500} value={notes} onChange={event => setNotes(event.target.value)} />{error && <p role="alert" className="text-sm text-destructive">{error}</p>}<CostButton busy={saving} credits={0} disabled={published && !publishedAt} onClick={save}>Salvar avaliação</CostButton>
    </DialogContent></Dialog></>;
}

export function RefinementBox({ onRefine, disabled, label = 'O que você quer ajustar?', credits = 1 }: { onRefine: (instruction: string) => Promise<unknown>; disabled?: boolean; label?: string; credits?: number }) {
  const [instruction, setInstruction] = useState('');
  const [error, setError] = useState('');
  const [busy, setBusy] = useState(false);
  const submit = async () => { setBusy(true); setError(''); try { await onRefine(instruction.trim()); setInstruction(''); } catch (reason) { setError(reason instanceof Error ? reason.message : 'Não foi possível concluir. Sua instrução continua aqui.'); } finally { setBusy(false); } };
  return <div className="space-y-2 rounded-lg border bg-muted/20 p-3"><label className="block text-sm font-medium">{label}<Textarea className="mt-2" rows={2} maxLength={1500} value={instruction} disabled={busy} placeholder="Ex.: manter a ideia, usar um tom mais direto e terminar com uma pergunta." onChange={event => setInstruction(event.target.value)} /></label><div className="flex items-center justify-between gap-3"><span className="text-xs text-muted-foreground">Somente este item · {instruction.length}/1500</span><CostButton size="sm" credits={credits} busy={busy} disabled={disabled || instruction.trim().length < 5} onClick={submit}>Refinar</CostButton></div>{error && <p role="alert" className="text-sm text-destructive">{error}</p>}</div>;
}
