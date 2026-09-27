import { useCallback, useEffect, useRef, useState } from 'react';
import { Dialog, DialogContent, DialogHeader, DialogTitle, DialogDescription } from '@/components/ui/dialog';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { pilotService } from '@/services/pilotService';
import type { GenerationRecord, HistoryRequest, HistoryResponse, RevisionRecord } from '@/services/pilotService';

const operationNames: Record<string, string> = { full_strategy: 'Estratégia completa', section: 'Seção da estratégia', idea: 'Nova ideia', variation: 'Variação de formato', refine_short: 'Refinamento', script: 'Roteiro', stories_day: 'Stories do dia', stories_week: 'Stories da semana', monetization_plan: 'Plano de monetização', attachment_ocr: 'Leitura de imagem' };
const statuses: Record<string, string> = { reserved: 'Reservada', processing: 'Processando', awaiting_input: 'Aguardando sua revisão', completed: 'Concluída', failed: 'Falhou', canceled: 'Cancelada' };
const ledgerNames: Record<string, string> = { allowance: 'Créditos iniciais', grant: 'Créditos adicionados', reserve: 'Reserva', release: 'Reserva liberada', charge: 'Consumo confirmado', adjustment: 'Ajuste' };
const PAGE_SIZE = 30;
const emptyHistory: HistoryResponse = { generations: [], revisions: [], ledger: [] };
type HistoryTab = 'generations' | 'revisions' | 'ledger';

export function PilotHistoryDialog({ open, onClose, onOpenGeneration, onOpenRevision }: {
  open: boolean; onClose: () => void; onOpenGeneration: (record: GenerationRecord) => void;
  onOpenRevision: (record: RevisionRecord) => void;
}) {
  const [data, setData] = useState<HistoryResponse>(emptyHistory);
  const [loading, setLoading] = useState(false); const [error, setError] = useState('');
  const [status, setStatus] = useState('');
  const [kind, setKind] = useState(''); const [after, setAfter] = useState(''); const [rating, setRating] = useState('');
  const [tab, setTab] = useState<HistoryTab>('generations');
  const [pages, setPages] = useState<Record<HistoryTab, number>>({ generations: 0, revisions: 0, ledger: 0 });
  const requests = useRef(0);
  const page = pages[tab];
  const offset = page * PAGE_SIZE;
  function resetGenerationPage() { setPages((current) => ({ ...current, generations: 0 })); }
  const reload = useCallback(async () => {
    const requestId = ++requests.current;
    setLoading(true); setError(''); setData(emptyHistory);
    const payload: HistoryRequest = { limit: PAGE_SIZE, offset };
    if (tab === 'generations') {
      if (kind) payload.operation = kind;
      if (status) payload.status = status as GenerationRecord['status'];
      if (after) payload.from = new Date(`${after}T00:00:00`).toISOString();
    }
    try {
      const response = await pilotService.history(payload);
      if (requestId === requests.current) setData(response);
    }
    catch (e) { if (requestId === requests.current) setError(e instanceof Error ? e.message : 'Não foi possível carregar o histórico.'); }
    finally { if (requestId === requests.current) setLoading(false); }
  }, [offset, tab, kind, status, after]);
  useEffect(() => {
    if (open) void reload();
    return () => { requests.current += 1; };
  }, [open, reload]);
  const generations = data.generations.filter(record => {
    if (!rating) return true;
    const versionIds = new Set(data.revisions.filter(version => version.generation_id === record.id).map(version => version.id));
    if (record.versionId) versionIds.add(record.versionId);
    const evaluations = data.feedback?.filter(feedback => versionIds.has(feedback.version_id)) ?? [];
    if (rating === 'unrated' && data.feedbackScope === 'page') return evaluations.length === 0 || evaluations.every(feedback => feedback.rating === 'unrated');
    return evaluations.some(feedback => feedback.rating === rating);
  });
  const pageRecords = data[tab];
  const total = tab === 'generations' ? data.total : tab === 'revisions' ? data.revisionsTotal : data.ledgerTotal;
  // Older endpoints do not return an exact ledger count; a full page still permits advancing.
  const hasNext = typeof total === 'number' ? offset + pageRecords.length < total : pageRecords.length === PAGE_SIZE;
  return <Dialog open={open} onOpenChange={value => { if (!value) onClose(); }}><DialogContent className="max-h-[90vh] overflow-y-auto sm:max-w-4xl">
    <DialogHeader><DialogTitle>Histórico da sua conta</DialogTitle><DialogDescription>Gerações, versões e extrato. Consultar ou reabrir não consome créditos.</DialogDescription></DialogHeader>
    <div className="flex flex-wrap gap-2">{(['generations', 'revisions', 'ledger'] as const).map(value => <Button key={value} variant={tab === value ? 'default' : 'outline'} onClick={() => setTab(value)}>{value === 'generations' ? 'Gerações' : value === 'revisions' ? 'Versões e edições' : 'Extrato'}</Button>)}<Button variant="ghost" disabled={loading} onClick={() => void reload()}>Atualizar página</Button></div>
    {error && <p role="alert" className="text-sm text-destructive">{error}</p>}
    {loading && <p role="status">Carregando histórico...</p>}
    {tab === 'generations' && <><div className="grid gap-2 sm:grid-cols-4">
      <select aria-label="Filtrar todo o histórico de gerações por tipo" className="rounded-md border bg-background p-2" value={kind} onChange={e => { setKind(e.target.value); resetGenerationPage(); }}><option value="">Todos os tipos</option>{Object.entries(operationNames).map(([id, name]) => <option key={id} value={id}>{name}</option>)}</select>
      <select aria-label="Filtrar todo o histórico de gerações por status" className="rounded-md border bg-background p-2" value={status} onChange={e => { setStatus(e.target.value); resetGenerationPage(); }}><option value="">Todos os status</option>{Object.entries(statuses).map(([id, name]) => <option key={id} value={id}>{name}</option>)}</select>
      <Input type="date" aria-label="Buscar em todo o histórico a partir da data" value={after} onChange={e => { setAfter(e.target.value); resetGenerationPage(); }} />
      <select aria-label="Filtrar avaliações desta página" className="rounded-md border bg-background p-2" value={rating} onChange={e => setRating(e.target.value)}><option value="">Avaliações desta página</option><option value="good">Deu bom</option><option value="bad">Deu ruim</option><option value="unrated">Não avaliei</option></select>
    </div><p className="text-xs leading-5 text-muted-foreground">Tipo, status e data buscam em todo o histórico. A avaliação filtra somente os registros desta página.{data.feedbackScope !== 'page' && rating ? ' Nesta consulta, apenas avaliações já carregadas podem ser encontradas; ausência não significa que o conteúdo não foi avaliado.' : ''}</p>
    <div className="space-y-3">{generations.map(record => <article key={record.id} className="rounded-xl border p-4"><div className="flex flex-wrap items-center justify-between gap-3"><div><h3 className="font-semibold">{operationNames[record.operation] ?? record.operation}</h3><p className="text-sm text-muted-foreground">{record.input?.brandName || record.input?.niche} · {new Date(record.created_at).toLocaleString('pt-BR')}</p></div><Button variant="outline" onClick={() => onOpenGeneration(record)}>Abrir registro</Button></div><p className="mt-2 text-sm">{statuses[record.status]} · {record.credits} créditos {record.status === 'completed' ? 'consumidos' : record.status === 'failed' || record.status === 'canceled' ? '(confira a liberação no extrato)' : 'reservados'}</p>{record.model && <p className="mt-1 text-xs text-muted-foreground">Modelo: {record.model}</p>}{record.error_code && <p className="text-sm text-destructive">Código: {record.error_code}</p>}</article>)}{!loading && !error && !generations.length && <p className="py-6 text-muted-foreground">{rating ? 'Nenhuma geração com esta avaliação nesta página. Avance ou limpe o filtro de avaliação.' : page > 0 ? 'Não há mais gerações nesta página. Volte para consultar os registros anteriores.' : 'Nenhuma geração para os filtros selecionados.'}</p>}</div></>}
    {tab === 'revisions' && <div className="space-y-2">{data.revisions.map(record => <article key={record.id} className="flex items-center justify-between gap-3 rounded-xl border p-3"><div><p className="font-medium">{record.title}</p><p className="text-xs text-muted-foreground">{new Date(record.created_at).toLocaleString('pt-BR')}</p></div><Button variant="outline" onClick={() => onOpenRevision(record)}>Visualizar versão</Button></article>)}{!loading && !data.revisions.length && <p>Nenhuma versão salva ainda.</p>}</div>}
    {tab === 'ledger' && <div className="overflow-auto"><table className="w-full text-sm"><thead><tr className="border-b text-left"><th className="p-2">Movimento</th><th>Créditos</th><th>Saldo</th><th>Reservados</th><th>Data</th></tr></thead><tbody>{data.ledger.map(row => <tr className="border-b" key={row.id}><td className="p-2">{ledgerNames[row.kind] ?? row.kind}</td><td>{row.amount}</td><td>{row.balance_after}</td><td>{row.reserved_after}</td><td>{new Date(row.created_at).toLocaleString('pt-BR')}</td></tr>)}</tbody></table>{!loading && !error && !data.ledger.length && <p className="py-5 text-sm text-muted-foreground">Nenhuma movimentação nesta página.</p>}</div>}
    <nav aria-label="Paginação do histórico" className="flex flex-wrap items-center justify-between gap-3 border-t pt-4">
      <Button variant="outline" disabled={loading || page === 0} onClick={() => setPages(current => ({ ...current, [tab]: Math.max(0, current[tab] - 1) }))}>Página anterior</Button>
      <p role="status" className="text-sm text-muted-foreground">Página {page + 1}{!loading && !error && typeof total === 'number' ? ` · ${total} registro${total === 1 ? '' : 's'} no total` : ''}{tab === 'generations' && rating && !loading ? ` · ${generations.length} com a avaliação nesta página` : ''}</p>
      <Button variant="outline" disabled={loading || !!error || !hasNext} onClick={() => setPages(current => ({ ...current, [tab]: current[tab] + 1 }))}>Próxima página</Button>
    </nav>
  </DialogContent></Dialog>;
}
