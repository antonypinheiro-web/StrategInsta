import { useState } from 'react';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Textarea } from '@/components/ui/textarea';
import type { ProfileBaseline } from '@/types/briefing';

const metrics = [ ['followers', 'Seguidores na data'], ['reach', 'Contas alcançadas no período'],
  ['profileVisits', 'Visitas ao perfil no período'], ['websiteClicks', 'Cliques no link no período'],
  ['leads', 'Contatos comerciais no período'], ['sales', 'Vendas observadas no período'] ] as const;

export function ProfileBaselineEditor({ value, onChange }: { value?: ProfileBaseline; onChange: (value?: ProfileBaseline) => void }) {
  const [draft, setDraft] = useState(() => ({ sourceDescription: value?.sourceDescription ?? '',
    capturedAt: value?.capturedAt ?? '', periodStart: value?.periodStart ?? '', periodEnd: value?.periodEnd ?? '',
    timezone: value?.timezone ?? Intl.DateTimeFormat().resolvedOptions().timeZone,
    notes: value?.notes ?? '', metrics: Object.fromEntries(metrics.map(([key]) => [key, value?.metrics[key] === undefined ? '' : String(value.metrics[key])])) }));
  const [message, setMessage] = useState('');
  const [dirty, setDirty] = useState(false);
  function update(key: string, text: string) { setDraft((previous) => ({ ...previous, [key]: text })); setDirty(true); setMessage(''); }
  function save() {
    if (!draft.sourceDescription.trim() || !draft.capturedAt) { setMessage('Informe a fonte e a data da captura para registrar esta medição.'); return; }
    if (!!draft.periodStart !== !!draft.periodEnd || draft.periodStart > draft.periodEnd) { setMessage('Preencha início e fim do mesmo período, em ordem.'); return; }
    const parsed: ProfileBaseline['metrics'] = {};
    for (const [key] of metrics) {
      const text = draft.metrics[key].trim();
      if (text === '') continue;
      const number = Number(text);
      if (!/^\d+$/.test(text) || !Number.isSafeInteger(number) || number < 0) { setMessage('Use números inteiros a partir de zero; deixe vazio quando não souber.'); return; }
      parsed[key] = number;
    }
    if (Object.keys(parsed).some((key) => key !== 'followers') && (!draft.periodStart || !draft.periodEnd)) {
      setMessage('Informe o período a que os resultados se referem. Seguidores pode ser registrado apenas na data.'); return;
    }
    onChange({ source: 'manual', sourceDescription: draft.sourceDescription.trim(), capturedAt: draft.capturedAt,
      periodStart: draft.periodStart || undefined, periodEnd: draft.periodEnd || undefined, timezone: draft.timezone,
      metrics: parsed, notes: draft.notes.trim() || undefined });
    setDirty(false); setMessage('Medição incluída no briefing. Ela será guardada junto à estratégia.');
  }
  return <details className="rounded-xl border border-border p-4">
    <summary className="cursor-pointer text-sm font-medium">Ponto de partida do Instagram (opcional){value ? ' · registrado' : ''}</summary>
    <div className="mt-5 space-y-5">
      <p className="text-sm leading-6 text-muted-foreground">Registre os dados que você consultou para comparar períodos equivalentes depois. O @ não conecta a conta nem consulta métricas automaticamente. Campos vazios continuam sem informação.</p>
      <label className="block space-y-2 text-sm font-medium">De onde vêm os dados?
        <Input value={draft.sourceDescription} onChange={(event) => update('sourceDescription', event.target.value)} placeholder="Ex.: Insights do Instagram, print de 10/09 ou planilha de vendas" maxLength={500} /></label>
      <div className="grid gap-4 sm:grid-cols-3">
        {[['capturedAt', 'Data da captura'], ['periodStart', 'Período: início'], ['periodEnd', 'Período: fim']].map(([key, label]) =>
          <label key={key} className="block space-y-2 text-sm font-medium">{label}<Input type="date" value={draft[key]} onChange={(event) => update(key, event.target.value)} /></label>)}
      </div>
      <p className="text-xs text-muted-foreground">Fuso da medição: {draft.timezone}. Mantenha a mesma fonte e duração ao comparar.</p>
      <div className="grid gap-4 sm:grid-cols-2">{metrics.map(([key, label]) => <label key={key} className="block space-y-2 text-sm font-medium">{label}
        <Input inputMode="numeric" value={draft.metrics[key]} onChange={(event) => { setDraft((previous) => ({ ...previous, metrics: { ...previous.metrics, [key]: event.target.value } })); setDirty(true); setMessage(''); }} placeholder="Não informado" maxLength={15} /></label>)}</div>
      <label className="block space-y-2 text-sm font-medium">Observações sobre o resultado<Textarea value={draft.notes} maxLength={2000} onChange={(event) => update('notes', event.target.value)} placeholder="Ações realizadas, mudanças no período e limites dos dados. Seguidores não comprovam vendas." /></label>
      <div className="flex flex-wrap items-center gap-3"><Button variant="outline" onClick={save}>{value ? 'Atualizar medição no briefing' : 'Incluir medição no briefing'}</Button>
        {value && <Button variant="ghost" onClick={() => { onChange(undefined); setMessage('Medição removida deste rascunho.'); setDirty(false); }}>Retirar do briefing</Button>}</div>
      {dirty && <p className="text-xs text-muted-foreground">As mudanças desta medição ainda precisam ser incluídas no briefing.</p>}
      {message && <p role="status" className="text-sm">{message}</p>}
    </div>
  </details>;
}
