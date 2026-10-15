import { useEffect, useState } from 'react';
import { toast } from 'sonner';
import { Bug, Coins, HelpCircle, History, LogOut, Moon, Palette, Sparkles, Sun, TrendingUp } from 'lucide-react';
import { Button } from '@/components/ui/button';
import { Dialog, DialogContent, DialogDescription, DialogHeader, DialogTitle } from '@/components/ui/dialog';
import { DropdownMenu, DropdownMenuContent, DropdownMenuItem, DropdownMenuLabel, DropdownMenuSeparator, DropdownMenuTrigger } from '@/components/ui/dropdown-menu';
import { Textarea } from '@/components/ui/textarea';
import { supabase } from '@/integrations/supabase/client';
import { pilotService } from '@/services/pilotService';
import { formatTps } from '@/lib/credit-packs';
import { BRAND_PROFILE_LIMITS, EMPTY_BRAND_PROFILE, parseBrandProfile, setCurrentBrandProfile } from '@/lib/brand-profile';
import type { BrandProfile } from '@/lib/brand-profile';
import { APP_VERSION, CHANGELOG } from '@/lib/changelog';
import { summarizeUsage } from '@/lib/usage';
import type { UsageSummary } from '@/lib/usage';

type Panel = 'usage' | 'brand' | 'news' | 'help' | 'feedback';
interface AccountMenuProps {
  email?: string; userMetadata?: Record<string, unknown>; available?: number; dark: boolean;
  onBuy: () => void; onHistory: () => void; onToggleTheme: () => void; onSignOut: () => void;
}

const monthName = (key: string) => { const [year, month] = key.split('-').map(Number); const name = new Date(year, month - 1, 1).toLocaleDateString('pt-BR', { month: 'long', year: 'numeric' }); return name.charAt(0).toUpperCase() + name.slice(1); };
const HELP = [
  ['O que são TPs?', 'TPs são a moeda do app. Cada geração mostra quantos TPs usa antes de você confirmar. Se uma geração falhar ou for cancelada, os TPs voltam para o saldo. TPs não expiram.'],
  ['Como crio um conteúdo?', 'Na Matriz, escolha uma ideia e clique em "Criar conteúdo"; você escolhe o formato. No Calendário, o formato do dia já vem definido. O app entrega o passo a passo de produção e a legenda.'],
  ['Como uso o conteúdo em outras ferramentas?', 'Use "Copiar" em cada parte ou "Copiar tudo". O texto sai pronto para colar no Canva, CapCut, Notion ou onde preferir.'],
  ['Como acompanho o que já postei?', 'Em Conteúdos, marque cada um como postado. O status também aparece no calendário.'],
  ['O app publica no meu Instagram?', 'Ainda não. O app não acessa sua conta do Instagram; ele prepara o conteúdo para você publicar.'],
  ['Meus dados ficam seguros?', 'Seu briefing e suas estratégias ficam na sua conta. Os anexos são privados e só você acessa.'],
];

/** Account menu in the header: balance, purchases, usage, brand personalization, news, help and feedback. */
export function AccountMenu({ email, userMetadata, available, dark, onBuy, onHistory, onToggleTheme, onSignOut }: AccountMenuProps) {
  const [panel, setPanel] = useState<Panel>();
  const initial = (email ?? '?').trim().charAt(0).toUpperCase();
  useEffect(() => { setCurrentBrandProfile(parseBrandProfile(userMetadata?.brandProfile)); }, [userMetadata]);
  return <>
    <DropdownMenu>
      <DropdownMenuTrigger asChild>
        <Button variant="outline" size="icon" className="h-10 w-10 rounded-full font-semibold" aria-label="Menu da conta">{initial}</Button>
      </DropdownMenuTrigger>
      <DropdownMenuContent align="end" className="w-64">
        <DropdownMenuLabel className="font-normal"><p className="truncate text-sm font-medium">{email ?? 'Sua conta'}</p><p className="mt-1 text-xs text-muted-foreground">Saldo: {available === undefined ? 'consultando' : formatTps(available)}</p></DropdownMenuLabel>
        <DropdownMenuItem onSelect={onBuy}><Coins className="mr-2 h-4 w-4" />Comprar TPs</DropdownMenuItem>
        <DropdownMenuItem onSelect={() => setPanel('usage')}><TrendingUp className="mr-2 h-4 w-4" />Uso</DropdownMenuItem>
        <DropdownMenuItem onSelect={onHistory}><History className="mr-2 h-4 w-4" />Histórico e extrato</DropdownMenuItem>
        <DropdownMenuSeparator />
        <DropdownMenuItem onSelect={() => setPanel('brand')}><Palette className="mr-2 h-4 w-4" />Personalização da empresa</DropdownMenuItem>
        <DropdownMenuItem onSelect={onToggleTheme}>{dark ? <Sun className="mr-2 h-4 w-4" /> : <Moon className="mr-2 h-4 w-4" />}{dark ? 'Tema claro' : 'Tema escuro'}</DropdownMenuItem>
        <DropdownMenuSeparator />
        <DropdownMenuItem onSelect={() => setPanel('news')}><Sparkles className="mr-2 h-4 w-4" />Novidades</DropdownMenuItem>
        <DropdownMenuItem onSelect={() => setPanel('help')}><HelpCircle className="mr-2 h-4 w-4" />Ajuda</DropdownMenuItem>
        <DropdownMenuItem onSelect={() => setPanel('feedback')}><Bug className="mr-2 h-4 w-4" />Feedback e bugs</DropdownMenuItem>
        <DropdownMenuSeparator />
        <DropdownMenuItem onSelect={onSignOut}><LogOut className="mr-2 h-4 w-4" />Sair</DropdownMenuItem>
        <p className="px-2 pb-1 pt-2 text-[11px] text-muted-foreground">Versão {APP_VERSION}</p>
      </DropdownMenuContent>
    </DropdownMenu>
    <Dialog open={!!panel} onOpenChange={open => { if (!open) setPanel(undefined); }}>
      <DialogContent className="max-h-[85vh] overflow-y-auto sm:max-w-lg">
        {panel === 'usage' && <UsagePanel onHistory={() => { setPanel(undefined); onHistory(); }} />}
        {panel === 'brand' && <BrandPanel initial={parseBrandProfile(userMetadata?.brandProfile)} onDone={() => setPanel(undefined)} />}
        {panel === 'news' && <><DialogHeader><DialogTitle>Novidades</DialogTitle><DialogDescription>O que mudou no app.</DialogDescription></DialogHeader>
          <div className="space-y-4">{CHANGELOG.map(entry => <div key={entry.version}><p className="text-sm font-semibold">Versão {entry.version} · {new Date(`${entry.date}T12:00:00`).toLocaleDateString('pt-BR')}</p><ul className="mt-2 list-disc space-y-1 pl-5 text-sm text-muted-foreground">{entry.items.map(item => <li key={item}>{item}</li>)}</ul></div>)}</div></>}
        {panel === 'help' && <><DialogHeader><DialogTitle>Ajuda</DialogTitle><DialogDescription>Respostas rápidas. Não achou? Use "Feedback e bugs".</DialogDescription></DialogHeader>
          <div className="space-y-2">{HELP.map(([question, answer]) => <details key={question} className="rounded-lg border p-3"><summary className="cursor-pointer text-sm font-medium">{question}</summary><p className="mt-2 text-sm text-muted-foreground">{answer}</p></details>)}</div></>}
        {panel === 'feedback' && <FeedbackPanel onDone={() => setPanel(undefined)} />}
      </DialogContent>
    </Dialog>
  </>;
}

function UsagePanel({ onHistory }: { onHistory: () => void }) {
  const [months, setMonths] = useState<UsageSummary[]>();
  const [error, setError] = useState('');
  useEffect(() => {
    let active = true;
    const now = new Date(); const previous = new Date(now.getFullYear(), now.getMonth() - 1, 1);
    pilotService.history({ status: 'completed', from: previous.toISOString(), limit: 200 })
      .then(result => { if (active) setMonths([summarizeUsage(result.generations, now), summarizeUsage(result.generations, previous)]); })
      .catch(() => { if (active) setError('Não foi possível carregar o uso. Tente novamente.'); });
    return () => { active = false; };
  }, []);
  return <><DialogHeader><DialogTitle>Uso</DialogTitle><DialogDescription>TPs usados em gerações concluídas. Gerações que falharam não contam.</DialogDescription></DialogHeader>
    {error ? <p role="alert" className="text-sm text-destructive">{error}</p> : !months ? <p role="status" className="text-sm text-muted-foreground">Carregando...</p> : <div className="space-y-4">
      {months.map(month => <div key={month.month} className="rounded-xl border p-4">
        <div className="flex items-baseline justify-between gap-3"><p className="text-sm font-semibold">{monthName(month.month)}</p><p className="text-lg font-semibold">{formatTps(month.total)}</p></div>
        <p className="text-xs text-muted-foreground">{month.count} {month.count === 1 ? 'geração' : 'gerações'}</p>
        {month.byOperation.length > 0 && <ul className="mt-3 space-y-1 text-sm">{month.byOperation.map(item => <li key={item.name} className="flex justify-between gap-3"><span className="text-muted-foreground">{item.name} · {item.count}</span><span>{formatTps(item.credits)}</span></li>)}</ul>}
      </div>)}
      <Button variant="outline" onClick={onHistory}>Ver extrato completo</Button>
    </div>}
  </>;
}

function BrandPanel({ initial, onDone }: { initial: BrandProfile; onDone: () => void }) {
  const [profile, setProfile] = useState<BrandProfile>(initial ?? EMPTY_BRAND_PROFILE);
  const [saving, setSaving] = useState(false);
  const set = (key: keyof BrandProfile, value: string) => setProfile(current => ({ ...current, [key]: value }));
  const save = async () => {
    setSaving(true);
    try {
      const clean = parseBrandProfile(profile);
      const { error } = await supabase.auth.updateUser({ data: { brandProfile: clean } });
      if (error) throw error;
      setCurrentBrandProfile(clean); toast.success('Personalização salva. Vale a partir da próxima geração.'); onDone();
    } catch { toast.error('Não foi possível salvar. Tente novamente.'); }
    finally { setSaving(false); }
  };
  const field = (key: keyof typeof BRAND_PROFILE_LIMITS, label: string, hint: string, rows = 2) => <label className="block space-y-1.5 text-sm"><span className="font-medium">{label}</span><span className="block text-xs text-muted-foreground">{hint}</span><Textarea rows={rows} maxLength={BRAND_PROFILE_LIMITS[key]} value={profile[key]} onChange={event => set(key, event.target.value)} /></label>;
  return <><DialogHeader><DialogTitle>Personalização da empresa</DialogTitle><DialogDescription>Vale para todas as gerações desta conta, em todas as estratégias.</DialogDescription></DialogHeader>
    <div className="space-y-4">
      {field('voice', 'Tom de voz', 'Ex.: próximo e direto, sem jargão; firme quando falar de método.')}
      {field('wordsToUse', 'Palavras e expressões a usar', 'Ex.: estrutura antes de acelerar; previsibilidade.')}
      {field('wordsToAvoid', 'Palavras a evitar', 'Ex.: fórmula mágica, garantido, viralizar.')}
      <label className="block space-y-1.5 text-sm"><span className="font-medium">Emojis</span>
        <select className="h-10 w-full rounded-md border bg-background px-3 text-sm" value={profile.emojis} onChange={event => set('emojis', event.target.value)}>
          <option value="none">Não usar</option><option value="few">Poucos e pontuais</option><option value="free">À vontade</option>
        </select></label>
      {field('notes', 'Observações', 'Qualquer orientação de estilo que a IA deve seguir.', 3)}
      <div className="flex justify-end gap-2"><Button variant="outline" onClick={onDone} disabled={saving}>Cancelar</Button><Button onClick={() => void save()} disabled={saving}>{saving ? 'Salvando...' : 'Salvar'}</Button></div>
    </div>
  </>;
}

function FeedbackPanel({ onDone }: { onDone: () => void }) {
  const [kind, setKind] = useState<'bug' | 'idea' | 'other'>('bug');
  const [message, setMessage] = useState('');
  const [sending, setSending] = useState(false);
  const send = async () => {
    setSending(true);
    try {
      const { error } = await supabase.from('user_feedback' as never).insert({ kind, message: message.trim(), page: window.location.pathname.slice(0, 200), app_version: APP_VERSION } as never);
      if (error) throw error;
      toast.success('Recebemos sua mensagem. Obrigado!'); onDone();
    } catch { toast.error('Não foi possível enviar. Tente novamente.'); }
    finally { setSending(false); }
  };
  return <><DialogHeader><DialogTitle>Feedback e bugs</DialogTitle><DialogDescription>Conte o que deu errado ou o que você gostaria de ver no app.</DialogDescription></DialogHeader>
    <div className="space-y-4">
      <div role="radiogroup" aria-label="Tipo de mensagem" className="flex flex-wrap gap-2">{([['bug', 'Algo deu errado'], ['idea', 'Sugestão'], ['other', 'Outro']] as const).map(([value, label]) => <Button key={value} type="button" role="radio" aria-checked={kind === value} size="sm" variant={kind === value ? 'default' : 'outline'} onClick={() => setKind(value)}>{label}</Button>)}</div>
      <Textarea rows={5} maxLength={4000} value={message} onChange={event => setMessage(event.target.value)} placeholder={kind === 'bug' ? 'O que você estava fazendo e o que aconteceu?' : 'Conte sua ideia.'} />
      <div className="flex justify-end gap-2"><Button variant="outline" onClick={onDone} disabled={sending}>Cancelar</Button><Button onClick={() => void send()} disabled={sending || message.trim().length < 5}>{sending ? 'Enviando...' : 'Enviar'}</Button></div>
    </div>
  </>;
}

