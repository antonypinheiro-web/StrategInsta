import { useEffect, useState } from 'react';
import { invokeAdmin } from '@/services/adminService';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import { toast } from 'sonner';

interface ModelCandidate { provider: 'openai'|'gemini'; model: string; weight: number; reasoning: 'low'|'medium'|'high'; inputPricePerMillion?: number | null; outputPricePerMillion?: number | null; priceVerifiedAt?: string; priceExpiresAt?: string; }
interface Revision { id: number; models: ModelCandidate[]; created_at: string; }
interface ConfigResponse { active: Revision | null; revisions: Revision[]; suggested: ModelCandidate[]; tests: { id: string; candidate: ModelCandidate; success: boolean; code?: string; created_at: string }[]; }
const initialModels: ModelCandidate[] = [{ provider: 'openai', model: 'gpt-5.6-luna', weight: 50, reasoning: 'medium' }, { provider: 'gemini', model: 'gemini-3.8-flash', weight: 50, reasoning: 'medium' }];

export function AdminModelSettings() {
  const [config, setConfig] = useState<ConfigResponse>(); const [models, setModels] = useState(initialModels);
  const [catalog, setCatalog] = useState<Partial<Record<'openai'|'gemini', string[]>>>({});
  const [tested, setTested] = useState<string[]>([]); const [busy, setBusy] = useState(false); const [error, setError] = useState('');
  const load = async () => { const data = await invokeAdmin<ConfigResponse>('getAiConfig'); setConfig(data); setModels(data.active?.models ?? data.suggested ?? initialModels); setTested([]); };
  useEffect(() => { setBusy(true); load().catch(e => setError(e.message)).finally(() => setBusy(false)); }, []);
  const run = async (action: () => Promise<void>) => { setBusy(true); setError(''); try { await action(); } catch (e) { setError(e instanceof Error ? e.message : 'Não foi possível concluir.'); } finally { setBusy(false); } };
  const update = (index: number, changes: Partial<ModelCandidate>) => { setModels(prev => prev.map((value, i) => i === index ? { ...value, ...changes } : value)); setTested([]); };
  const test = async (candidate: ModelCandidate) => {
    const result = await invokeAdmin<{ success: boolean; code?: string }>('testAiModel', { candidate });
    if (!result.success) throw new Error('O modelo não passou no teste: ' + (result.code ?? 'resposta inválida'));
    setTested(prev => [...prev, JSON.stringify(candidate)]); toast.success('Modelo testado com a chave do servidor.');
  };
  const ready = models.length > 0 && models.every(model => tested.includes(JSON.stringify(model))) && models.reduce((sum, model) => sum + model.weight, 0) === 100;
  return <section className="space-y-6">
    <div><h2 className="text-xl font-semibold">Modelos e raciocínio da IA</h2><p className="mt-2 text-sm text-muted-foreground">A rotação escolhe um modelo por operação. Todas as etapas de uma estratégia usam a mesma configuração. Em falha transitória, o servidor pode usar o outro modelo sem uma segunda cobrança de créditos.</p></div>
    <div className="rounded-xl border p-4"><p className="font-medium">Configuração ativa</p>{config?.active ? <><p className="text-sm">Revisão {config.active.id} · {new Date(config.active.created_at).toLocaleString('pt-BR')}</p>{config.active.models.map(model => <p key={model.provider + model.model} className="mt-2 text-sm">{model.model} · participação {model.weight}% · raciocínio {model.reasoning}</p>)}</> : <p className="mt-2 text-sm text-muted-foreground">Nenhuma configuração ativa foi confirmada.</p>}</div>
    {error && <p role="alert" className="rounded-lg border border-destructive/30 p-3 text-sm text-destructive">{error}</p>}
    <div className="grid gap-4 xl:grid-cols-2">{models.map((model, index) => <div className="space-y-4 rounded-xl border p-5" key={index}><h3 className="font-semibold">{model.provider === 'openai' ? 'OpenAI' : 'Google Gemini'}</h3>
      <div className="space-y-2"><Label htmlFor={'model-' + index}>ID do modelo</Label><Input id={'model-' + index} list={'catalog-' + index} disabled={busy} value={model.model} onChange={e => update(index, { model: e.target.value.trim() })} /><datalist id={'catalog-' + index}>{catalog[model.provider]?.map(id => <option key={id} value={id} />)}</datalist><Button size="sm" variant="outline" disabled={busy} onClick={() => void run(async () => { const result = await invokeAdmin<{ models: string[] }>('listAiModels', { provider: model.provider }); setCatalog(prev => ({ ...prev, [model.provider]: result.models })); toast.info(result.models.length + ' modelos compatíveis encontrados na conta.'); })}>Consultar modelos disponíveis</Button></div>
      <div className="grid grid-cols-2 gap-3"><label className="space-y-2 text-sm">Participação (%)<Input type="number" min={1} max={100} disabled={busy} value={model.weight} onChange={e => update(index, { weight: Number(e.target.value) })} /></label><label className="space-y-2 text-sm">Raciocínio<select className="mt-2 h-10 w-full rounded-md border bg-background px-3" disabled={busy} value={model.reasoning} onChange={e => update(index, { reasoning: e.target.value as ModelCandidate['reasoning'] })}><option value="low">Baixo</option><option value="medium">Médio</option><option value="high">Alto</option></select></label></div>
      <details className="text-sm"><summary className="cursor-pointer">Custo de referência em USD por milhão de tokens</summary><p className="my-2 text-muted-foreground">Use valores atuais da documentação do provedor. Isso estima custo; não altera preços dos planos.</p><div className="grid grid-cols-2 gap-3"><label>Entrada<Input type="number" min={0} step="0.01" value={model.inputPricePerMillion ?? ''} onChange={e => update(index, { inputPricePerMillion: e.target.value === '' ? null : Number(e.target.value) })} /></label><label>Saída<Input type="number" min={0} step="0.01" value={model.outputPricePerMillion ?? ''} onChange={e => update(index, { outputPricePerMillion: e.target.value === '' ? null : Number(e.target.value) })} /></label><label>Verificado em<Input type="date" value={model.priceVerifiedAt ?? ''} onChange={e => update(index, { priceVerifiedAt: e.target.value })} /></label><label>Válido até<Input type="date" value={model.priceExpiresAt ?? ''} onChange={e => update(index, { priceExpiresAt: e.target.value })} /></label></div></details>
      <Button variant="outline" disabled={busy} onClick={() => void run(() => test(model))}>{tested.includes(JSON.stringify(model)) ? 'Testado nesta configuração' : 'Testar modelo'}</Button>
    </div>)}</div>
    <p className="text-sm text-muted-foreground">Testar faz uma pequena chamada real, cobrada pelo provedor. Não usa créditos do usuário. Alterar qualquer campo exige novo teste antes da ativação. As chaves permanecem no servidor.</p>
    <Button disabled={busy || !ready} onClick={() => void run(async () => { await invokeAdmin('applyAiConfig', { models }); await load(); toast.success('Configuração ativada e registrada na auditoria.'); })}>Ativar configuração testada</Button>
    <section className="space-y-3"><h3 className="font-semibold">Revisões anteriores</h3>{config?.revisions.map(revision => <div className="flex flex-wrap items-center justify-between gap-3 rounded-lg border p-3" key={revision.id}><div><p>Revisão {revision.id} · {new Date(revision.created_at).toLocaleString('pt-BR')}</p><p className="text-xs text-muted-foreground">{revision.models.map(model => model.model).join(' + ')}</p></div><Button variant="outline" disabled={busy || config.active?.id === revision.id} onClick={() => { setModels(revision.models); setTested([]); toast.info('Configuração carregada. Teste os modelos e ative para registrar uma nova revisão.'); }}>Carregar para revisar</Button></div>)}</section>
  </section>;
}
