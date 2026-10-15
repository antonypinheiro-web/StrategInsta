import { useMemo, useState } from 'react';
import { Button } from '@/components/ui/button';
import type { ContentStatus, GeneratedContent } from '@/types/workspace';
import { FORMAT_NAMES, scriptToText, scriptsToText } from '@/lib/content-text';
import { CopyButton } from './CopyButton';

type Filter = 'all' | ContentStatus;
const FILTERS: { id: Filter; label: string }[] = [{ id: 'all', label: 'Todos' }, { id: 'generated', label: 'Gerados' }, { id: 'posted', label: 'Postados' }];
const ORIGIN_NAMES: Record<string, string> = { idea: 'Matriz', calendar: 'Calendário', story: 'Stories', day: 'Stories', week: 'Stories', bio: 'Bio', section: 'Estratégia' };
const statusOf = (script: GeneratedContent): ContentStatus => script.status ?? 'generated';
const shortDate = (value?: string) => value ? new Date(value).toLocaleDateString('pt-BR', { day: '2-digit', month: '2-digit' }) : undefined;

interface ContentLibraryPanelProps {
  scripts: GeneratedContent[]; busy?: boolean;
  onOpen: (script: GeneratedContent) => void;
  onSetStatus: (script: GeneratedContent, status: ContentStatus) => Promise<void>;
}

/** Every generated content in one place, with its production status and copy shortcuts. */
export function ContentLibraryPanel({ scripts, busy, onOpen, onSetStatus }: ContentLibraryPanelProps) {
  const [filter, setFilter] = useState<Filter>('all');
  const ordered = useMemo(() => [...scripts].reverse(), [scripts]);
  const visible = ordered.filter(script => filter === 'all' || statusOf(script) === filter);
  const counts = { all: scripts.length, generated: scripts.filter(s => statusOf(s) === 'generated').length, posted: scripts.filter(s => statusOf(s) === 'posted').length };
  return <section className="space-y-5" aria-label="Conteúdos gerados">
    <div><p className="text-xs font-medium uppercase tracking-wider text-primary">Sua produção</p><h2 className="mt-2 text-2xl font-semibold">Conteúdos</h2><p className="mt-2 text-sm text-muted-foreground">Tudo o que você gerou, com o status de cada conteúdo. Copie para usar na sua ferramenta de criação.</p></div>
    {!scripts.length ? <p className="rounded-xl border p-5 text-sm text-muted-foreground">Nenhum conteúdo gerado ainda. Use "Criar conteúdo" na matriz ou no calendário.</p> : <>
      <div className="flex flex-wrap items-center justify-between gap-3">
        <div role="tablist" aria-label="Filtrar por status" className="flex flex-wrap gap-2">{FILTERS.map(item => <Button key={item.id} role="tab" aria-selected={filter === item.id} size="sm" variant={filter === item.id ? 'default' : 'outline'} onClick={() => setFilter(item.id)}>{item.label} · {counts[item.id]}</Button>)}</div>
        {visible.length > 0 && <CopyButton label={`Copiar ${visible.length === 1 ? 'conteúdo' : `todos (${visible.length})`}`} getText={() => scriptsToText(visible)} />}
      </div>
      {!visible.length ? <p className="rounded-xl border p-5 text-sm text-muted-foreground">Nenhum conteúdo com esse status.</p> : <ul className="space-y-2">{visible.map(script => {
        const status = statusOf(script);
        return <li key={script.id} className="flex flex-wrap items-center justify-between gap-3 rounded-xl border bg-card p-4">
          <div className="min-w-0">
            <div className="flex flex-wrap items-center gap-2 text-xs"><span className={`rounded-full px-2 py-0.5 font-medium ${status === 'posted' ? 'bg-emerald-500/15 text-emerald-600 dark:text-emerald-400' : 'bg-primary/10 text-primary'}`}>{status === 'posted' ? `Postado${script.postedAt ? ` em ${shortDate(script.postedAt)}` : ''}` : 'Gerado'}</span><span className="text-muted-foreground">{FORMAT_NAMES[script.format] ?? script.format} · {ORIGIN_NAMES[script.origin.kind] ?? 'Estratégia'}{script.createdAt ? ` · ${shortDate(script.createdAt)}` : ''}</span></div>
            <p className="mt-1 truncate font-medium">{script.title}</p>
          </div>
          <div className="flex flex-wrap gap-2">
            <Button size="sm" variant="ghost" onClick={() => onOpen(script)}>Abrir</Button>
            <CopyButton getText={() => scriptToText(script)} ariaLabel={`Copiar ${script.title}`} />
            <Button size="sm" variant={status === 'posted' ? 'ghost' : 'secondary'} disabled={busy} onClick={() => void onSetStatus(script, status === 'posted' ? 'generated' : 'posted')}>{status === 'posted' ? 'Desmarcar postado' : 'Marcar como postado'}</Button>
          </div>
        </li>;
      })}</ul>}
    </>}
  </section>;
}
