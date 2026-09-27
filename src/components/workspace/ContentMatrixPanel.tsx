import { useState } from 'react';
import { Button } from '@/components/ui/button';
import { Plus, Film, ChevronDown } from 'lucide-react';
import { ContentTableDisplay } from '@/components/strategy/ContentTableDisplay';
import { awarenessLevels, contentPurposes } from '@/types/workspace';
import type { ContentMatrix, ContentIdea, ContentOrigin, ContentFormat, WorkspaceOperation, WorkspaceGenerationPayload, ContentFeedback } from '@/types/workspace';
import type { ContentTableData } from '@/types';
import { visibleIdeas } from './workspace-model';
import { CostButton, ManualEditor, RefinementBox, FeedbackButton } from './WorkspaceControls';

export interface ContentMatrixPanelProps {
  matrix?: ContentMatrix; legacy?: ContentTableData; busy?: boolean;
  onGenerate: (operation: WorkspaceOperation, payload?: Partial<WorkspaceGenerationPayload>) => Promise<unknown>;
  onEdit: (origin: ContentOrigin, idea: ContentIdea) => Promise<void>;
  onOpenGenerator: (origin: ContentOrigin, item: ContentIdea) => void;
  onFeedback?: (feedback: ContentFeedback) => Promise<void>;
}
export function ContentMatrixPanel({ matrix, legacy, busy, onGenerate, onEdit, onOpenGenerator, onFeedback }: ContentMatrixPanelProps) {
  const [refining, setRefining] = useState<string>();
  const [formats, setFormats] = useState<Record<string, ContentFormat>>({});
  const [error, setError] = useState('');
  const run = async (operation: WorkspaceOperation, payload?: Partial<WorkspaceGenerationPayload>) => { setError(''); try { return await onGenerate(operation, payload); } catch (reason) { setError(reason instanceof Error ? reason.message : 'Não foi possível concluir.'); } };
  return <section className="space-y-5" aria-label="Matriz de conteúdo"><div><p className="text-xs font-medium uppercase tracking-wider text-primary">Da descoberta à decisão</p><h2 className="mt-2 text-2xl font-semibold">Matriz de conteúdo</h2><p className="mt-2 max-w-3xl text-sm text-muted-foreground">Cruze o que seu público já sabe com o objetivo do conteúdo. Abra uma ideia no gerador para preparar o roteiro.</p></div>
    {error && <p role="alert" className="text-sm text-destructive">{error}</p>}
    {!matrix ? <div className="space-y-4 rounded-xl border p-5"><p className="text-sm text-muted-foreground">{legacy ? 'A matriz anterior organiza ideias por funil. Gere a nova matriz para trabalhar os cinco níveis de consciência e os quatro objetivos.' : 'A matriz será construída a partir do briefing, do perfil de cliente e das oportunidades escolhidas.'}</p>{legacy && <details><summary className="cursor-pointer text-sm font-medium">Ver matriz anterior</summary><ContentTableDisplay content={legacy} /></details>}<CostButton busy={busy} onClick={() => run('matrix_generate')}>Cotar matriz de 20 células</CostButton></div> : <>
      <div className="max-w-full overflow-x-auto rounded-xl border" tabIndex={0} role="region" aria-label="Tabela de ideias. Role horizontalmente para ver os objetivos."><table className="w-full min-w-[1280px] table-fixed border-collapse text-left"><caption className="sr-only">Cinco níveis de consciência e quatro objetivos. Até três ideias visíveis em cada célula; outras versões permanecem no histórico.</caption><thead className="bg-muted/70"><tr><th scope="col" className="w-44 p-4 text-sm">Consciência do público</th>{contentPurposes.map(purpose => <th key={purpose.id} scope="col" className="p-4 text-sm font-semibold">{purpose.label}</th>)}</tr></thead><tbody>{awarenessLevels.map((level, levelIndex) => <tr key={level.id} className="border-t"><th scope="row" className="align-top bg-muted/20 p-4"><span className="text-xs text-primary">Nível {levelIndex + 1}</span><p className="mt-2 text-sm font-semibold">{level.label}</p><p className="mt-2 text-xs font-normal text-muted-foreground">{level.approach}</p></th>{contentPurposes.map(purpose => {
        const cell = matrix.cells.find(candidate => candidate.awareness === level.id && candidate.purpose === purpose.id);
        return <td key={purpose.id} className="border-l p-3 align-top"><div className="space-y-3">{cell && visibleIdeas(cell.ideas).map(idea => {
          const origin: ContentOrigin = { kind: 'idea', id: idea.id, cellId: cell.id, awareness: level.id, purpose: purpose.id };
          return <article key={idea.id} className="space-y-3 rounded-lg border bg-card p-3"><span className="text-[11px] uppercase tracking-wide text-primary">{({ reel: 'Reel', carousel: 'Carrossel', static: 'Post estático', stories: 'Stories' })[idea.format]}</span><h3 className="text-sm font-semibold leading-6">{idea.title}</h3><p className="text-xs leading-5 text-muted-foreground">{idea.angle}</p><details className="text-xs"><summary className="cursor-pointer font-medium">Por que esta ideia?</summary><p className="mt-2 leading-5 text-muted-foreground">{idea.briefingBasis}</p>{idea.proofNeeded && <p className="mt-2 leading-5"><strong>Prova necessária:</strong> {idea.proofNeeded}</p>}</details><Button className="w-full" size="sm" variant="secondary" disabled={busy} onClick={() => onOpenGenerator(origin, idea)}><Film className="mr-1 h-3.5 w-3.5" />Criar roteiro</Button><div className="flex flex-wrap gap-1"><ManualEditor title="Editar ideia" disabled={busy} fields={[{ key: 'title', label: 'Título', value: idea.title, maxLength: 180 }, { key: 'angle', label: 'Abordagem', value: idea.angle, maxLength: 1500 }]} onSave={values => onEdit(origin, { ...idea, ...values })} /><Button variant="ghost" size="sm" disabled={busy} onClick={() => setRefining(refining === idea.id ? undefined : idea.id)}>Refinar<ChevronDown className="ml-1 h-3 w-3" /></Button><FeedbackButton contentId={idea.id} versionId={idea.versionId} onFeedback={onFeedback} disabled={busy} /></div>
            {refining === idea.id && <RefinementBox disabled={busy} onRefine={instruction => onGenerate('item_refine', { origin, item: idea, instruction })} />}
            <div className="flex flex-wrap gap-2 border-t pt-3"><select aria-label={`Novo formato de ${idea.title}`} className="min-w-0 flex-1 rounded-md border bg-background px-2 py-1 text-xs" value={formats[idea.id] ?? idea.format} onChange={event => setFormats(current => ({ ...current, [idea.id]: event.target.value as ContentFormat }))}><option value="reel">Reel</option><option value="carousel">Carrossel</option><option value="static">Post estático</option><option value="stories">Stories</option></select><CostButton size="sm" variant="outline" credits={1} busy={busy} onClick={() => run('format_variation', { origin, item: idea, cell, format: formats[idea.id] ?? idea.format })}>Variar</CostButton></div>
          </article>;
        })}{cell?.rationale && !cell.ideas.length && <p className="p-2 text-xs leading-5 text-muted-foreground">{cell.rationale}</p>}{cell && cell.ideas.length > 3 && <p className="text-xs text-muted-foreground">Mais {cell.ideas.length - 3} {cell.ideas.length - 3 === 1 ? 'ideia no histórico' : 'ideias no histórico'}.</p>}<CostButton variant="ghost" size="sm" credits={1} busy={busy} disabled={!cell} className="w-full" onClick={() => run('idea_generate', { cell, origin: { kind: 'idea', id: cell!.id, cellId: cell!.id, awareness: level.id, purpose: purpose.id } })}><Plus className="mr-1 h-3.5 w-3.5" />Nova ideia</CostButton></div></td>;
      })}</tr>)}</tbody></table></div><p className="text-xs text-muted-foreground">Os níveis orientam a abordagem. Um objetivo pode aparecer em diferentes momentos do funil.</p>
    </>}
  </section>;
}
