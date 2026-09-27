import { useState } from 'react';
import { Button } from '@/components/ui/button';
import { Copy, Check, Instagram } from 'lucide-react';
import { StrategyText } from '@/components/strategy/StrategyText';
import type { BioOption, ContentOrigin, WorkspaceOperation, WorkspaceGenerationPayload } from '@/types/workspace';
import { bioLength } from './workspace-model';
import { CostButton, ManualEditor, RefinementBox } from './WorkspaceControls';

interface BioPanelProps {
  bios?: BioOption[]; legacy?: string; username?: string; busy?: boolean;
  onGenerate: (operation: WorkspaceOperation, payload?: Partial<WorkspaceGenerationPayload>) => Promise<unknown>;
  onEdit: (origin: ContentOrigin, bio: BioOption) => Promise<void>;
}
export function BioPanel({ bios, legacy, username, busy, onGenerate, onEdit }: BioPanelProps) {
  const [copied, setCopied] = useState<string>();
  const [error, setError] = useState('');
  const [refining, setRefining] = useState<string>();
  const copy = async (bio: BioOption) => { setError(''); try { await navigator.clipboard.writeText(bio.text); setCopied(bio.id); } catch { setError('Não foi possível copiar. Selecione o texto da bio e copie manualmente.'); } };
  return <section className="space-y-5" aria-label="Bio para Instagram"><div><p className="text-xs font-medium uppercase tracking-wider text-primary">Clareza no primeiro contato</p><h2 className="mt-2 text-2xl font-semibold">Bio para Instagram</h2><p className="mt-2 text-sm text-muted-foreground">Compare as opções, ajuste sua voz e copie a que melhor representa seu negócio.</p></div>{error && <p role="alert" className="text-sm text-destructive">{error}</p>}
    {bios?.length ? <div className="grid items-start gap-4 lg:grid-cols-3">{bios.map((bio, index) => { const origin: ContentOrigin = { kind: 'bio', id: bio.id }; const count = bioLength(bio.text); return <article key={bio.id} className="space-y-4 rounded-xl border bg-card p-5"><div className="flex items-center justify-between"><span className="text-xs font-medium text-primary">Opção {index + 1}</span><span className={`text-xs ${count > 150 ? 'font-semibold text-destructive' : 'text-muted-foreground'}`}>{count}/150 caracteres</span></div><div className="rounded-xl border bg-background p-4"><div className="mb-3 flex items-center gap-3"><div className="rounded-full bg-primary/10 p-2"><Instagram className="h-5 w-5 text-primary" /></div><span className="min-w-0 truncate text-sm font-medium">{username ? `@${username.replace(/^@/, '')}` : 'Seu perfil'}</span></div><p className="mb-2 text-sm font-semibold">{bio.name}</p><p className="whitespace-pre-wrap text-sm leading-6">{bio.text}</p></div>{bio.recommendation && <p className="text-xs leading-5 text-muted-foreground">{bio.recommendation}</p>}<div className="flex flex-wrap gap-2"><Button size="sm" disabled={count > 150} onClick={() => copy(bio)}>{copied === bio.id ? <Check className="mr-1 h-3.5 w-3.5" /> : <Copy className="mr-1 h-3.5 w-3.5" />}{copied === bio.id ? 'Copiada' : 'Copiar bio'}</Button><ManualEditor title="Editar bio" disabled={busy} fields={[{ key: 'name', label: 'Campo Nome do perfil', value: bio.name, maxLength: 64, required: false }, { key: 'text', label: 'Bio', value: bio.text, maxLength: 150 }]} onSave={values => onEdit(origin, { ...bio, ...values })} /><Button size="sm" variant="ghost" disabled={busy} onClick={() => setRefining(refining === bio.id ? undefined : bio.id)}>Refinar</Button></div>{refining === bio.id && <RefinementBox disabled={busy} label="Como esta opção pode ficar mais sua?" onRefine={instruction => onGenerate('item_refine', { origin, item: bio, instruction })} />}</article>; })}</div> : <div className="space-y-4 rounded-xl border p-5"><p className="text-sm text-muted-foreground">{legacy ? 'Esta bio foi criada no formato anterior. Gere três opções para comparar, editar e copiar cada uma com a contagem de caracteres.' : 'As opções vão usar sua oferta, seu tom de voz e o próximo passo desejado.'}</p>{legacy && <details><summary className="cursor-pointer text-sm font-medium">Ver bio anterior</summary><StrategyText content={legacy} /></details>}<CostButton busy={busy} onClick={async () => { setError(''); try { await onGenerate('bio_generate'); } catch (reason) { setError(reason instanceof Error ? reason.message : 'Não foi possível gerar as opções.'); } }}>Cotar três opções de bio</CostButton></div>}
  </section>;
}
