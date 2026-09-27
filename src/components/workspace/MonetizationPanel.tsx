import { useState } from 'react';
import { StrategyText } from '@/components/strategy/StrategyText';
import { Button } from '@/components/ui/button';
import { Check, Sparkles } from 'lucide-react';
import { CostButton, ManualEditor } from './WorkspaceControls';
import type { MonetizationAnalysis } from '@/types/workspace';

export interface MonetizationPanelProps {
  analysis?: MonetizationAnalysis; selectedIds: string[]; plan?: string;
  legacy?: string; busy?: boolean; planStale?: boolean;
  onSelectionChange: (ids: string[]) => Promise<void>;
  onGeneratePlan: () => Promise<unknown>;
  onGenerateAnalysis: () => Promise<unknown>;
  onEditAnalysis?: (analysis: MonetizationAnalysis) => Promise<void>;
  onEditPlan?: (plan: string) => Promise<void>;
}
export function MonetizationPanel({ analysis, selectedIds, plan, legacy, busy, planStale, onSelectionChange, onGeneratePlan, onGenerateAnalysis, onEditAnalysis, onEditPlan }: MonetizationPanelProps) {
  const [pending, setPending] = useState(false);
  const [error, setError] = useState('');
  const [saved, setSaved] = useState(false);
  const execute = async (action: () => Promise<unknown>) => { setPending(true); setError(''); setSaved(false); try { await action(); } catch (reason) { setError(reason instanceof Error ? reason.message : 'Não foi possível concluir.'); } finally { setPending(false); } };
  const validSelection = !!analysis && selectedIds.length > 0 && selectedIds.every(id => analysis.ideas.some(idea => idea.id === id));
  const unavailable = busy || pending;
  return <section className="space-y-6" aria-label="Potencial de monetização">
    <div><p className="text-xs font-medium uppercase tracking-wider text-primary">Oportunidades para o seu negócio</p><h2 className="mt-2 text-2xl font-semibold">Potencial de monetização</h2><p className="mt-2 text-sm text-muted-foreground">Escolha as oportunidades que fazem sentido. O plano será desenvolvido a partir da sua seleção.</p></div>
    {error && <p role="alert" className="rounded-lg border border-destructive/40 p-3 text-sm text-destructive">{error}</p>}
    {analysis ? <>
      <div className="rounded-xl border bg-card p-5"><StrategyText content={analysis.potential} /><div className="mt-4 border-t pt-4"><p className="text-sm font-medium">Base da análise</p><ul className="mt-2 list-disc space-y-1 pl-5 text-sm text-muted-foreground">{analysis.basis.map((basis, index) => <li key={index}>{basis}</li>)}</ul></div></div>
      {selectedIds.some(id => !analysis.ideas.some(idea => idea.id === id)) && <p role="status" className="rounded-lg border border-amber-500/40 p-3 text-sm">A análise mudou. Revise sua seleção antes de desenvolver outro plano.</p>}
      <div className="grid gap-4 lg:grid-cols-3">{analysis.ideas.map((idea, index) => {
        const selected = selectedIds.includes(idea.id);
        return <article key={idea.id} className={`flex flex-col rounded-xl border bg-card p-5 ${selected ? 'border-primary ring-1 ring-primary/30' : ''}`}><div className="flex items-start justify-between gap-3"><span className="rounded-full bg-primary/10 px-2.5 py-1 text-xs font-medium text-primary">Ideia {index + 1}</span><input type="checkbox" aria-label={`Selecionar ${idea.title}`} checked={selected} disabled={unavailable} className="h-5 w-5 accent-purple-600" onChange={() => execute(async () => { const next = selected ? selectedIds.filter(id => id !== idea.id) : [...selectedIds.filter(id => analysis.ideas.some(candidate => candidate.id === id)), idea.id]; await onSelectionChange(next); setSaved(true); })} /></div><h3 className="mb-3 mt-4 text-lg font-semibold">{idea.title}</h3><p className="text-sm leading-relaxed">{idea.offer}</p><dl className="mt-4 space-y-3 text-sm">{[['Para quem', idea.audience], ['Por que faz sentido', idea.basis], ['Recursos necessários', idea.resources], ['Risco a considerar', idea.risks], ['Hipótese para validar', idea.hypothesis]].map(([label, value]) => <div key={label}><dt className="font-medium">{label}</dt><dd className="mt-1 whitespace-pre-wrap text-muted-foreground">{value}</dd></div>)}</dl></article>;
      })}</div>
      <div className="flex flex-wrap items-center justify-between gap-3 rounded-xl border bg-muted/20 p-4"><div><p className="text-sm font-medium">{selectedIds.filter(id => analysis.ideas.some(idea => idea.id === id)).length} de 3 ideias selecionadas</p><p className="mt-1 text-xs text-muted-foreground">Selecionar é gratuito. Mudar a seleção não gera novas respostas automaticamente.</p>{saved && <p role="status" className="mt-1 flex items-center text-xs text-primary"><Check className="mr-1 h-3 w-3" />Seleção salva</p>}</div><CostButton credits={5} busy={unavailable} disabled={!validSelection} onClick={() => execute(onGeneratePlan)}>Desenvolver plano das escolhidas</CostButton></div>
      <div className="flex flex-wrap gap-2"><Button variant="ghost" disabled={unavailable} onClick={() => execute(async () => { await onSelectionChange([]); setSaved(true); })}>Manter apenas minha oferta atual</Button><CostButton variant="outline" busy={unavailable} onClick={() => execute(onGenerateAnalysis)}>Cotar nova análise</CostButton>{onEditAnalysis && <ManualEditor title="Revisar análise de monetização" disabled={unavailable} fields={[{ key: 'potential', label: 'Análise do potencial', value: analysis.potential, maxLength: 6000 }]} onSave={values => onEditAnalysis({ ...analysis, potential: values.potential })} />}</div>
      {plan && planStale && <p role="status" className="rounded-lg border border-amber-500/40 p-3 text-sm">Este plano usa escolhas anteriores. Confira as ideias selecionadas antes de atualizar o plano.</p>}
      {plan && onEditPlan && <ManualEditor title="Editar plano de monetização" disabled={unavailable} fields={[{ key: 'plan', label: 'Plano das oportunidades escolhidas', value: plan, maxLength: 18000 }]} onSave={values => onEditPlan(values.plan)} />}
      {plan && <div className="rounded-xl border bg-card p-5"><h3 className="mb-4 text-xl font-semibold">Plano das oportunidades escolhidas</h3><StrategyText content={plan} /><div className="mt-6 border-t pt-4"><p className="text-sm font-medium">Apoio para colocar em prática</p><p className="mt-2 text-sm text-muted-foreground">Antony Pinheiro Soluções em Marketing pode apoiar o planejamento completo com consultoria e mentoria, além da execução coordenada com parceiros conforme o escopo. A contratação é opcional e separada da assinatura do app.</p></div></div>}
    </> : <div className="space-y-4 rounded-xl border bg-card p-5"><p className="text-sm text-muted-foreground">{legacy ? 'Esta análise foi criada na versão anterior. Gere uma análise estruturada para selecionar oportunidades e desenvolver o plano.' : 'A análise vai relacionar as oportunidades às informações do seu negócio.'}</p>{legacy && <details><summary className="cursor-pointer text-sm font-medium">Ver análise anterior</summary><StrategyText content={legacy} /></details>}<CostButton busy={unavailable} onClick={() => execute(onGenerateAnalysis)}><Sparkles className="mr-2 h-4 w-4" />Cotar análise de potencial</CostButton></div>}
  </section>;
}
