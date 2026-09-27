import React, { useEffect, useRef, useState } from 'react';
import { ArrowLeft, ArrowRight, Check, Save, Sparkles } from 'lucide-react';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Textarea } from '@/components/ui/textarea';
import { funnelOptions, postingFrequencyOptions, proficiencyLevelOptions } from '../types';
import type { UserInput } from '../types';
import { normalizeBriefing, objectives, readBriefingDraft, saveBriefingDraft, selectObjective, toStrategyInput, validateBriefingStep } from '@/lib/briefing';
import type { BriefingData } from '@/lib/briefing';
import type { BriefingAttachmentService } from '@/types/briefing';
import { AttachmentsPanel } from '@/components/briefing/AttachmentsPanel';
import { ProfileBaselineEditor } from '@/components/briefing/ProfileBaselineEditor';
import logo from '@/assets/logo.png';

interface Props {
  onStart: (data: UserInput) => void | Promise<void>;
  initialValues?: UserInput | null;
  error?: string | null;
  isAuthenticated: boolean;
  userId?: string;
  toolbar?: React.ReactNode;
  onLogout?: () => void | Promise<void>;
  planLoading?: boolean;
  planError?: string | null;
  creditsRemaining?: number;
  canGenerate?: boolean;
  onUpgrade?: () => void;
  previewMode?: boolean;
  generationCost?: number;
  attachmentService?: BriefingAttachmentService;
  submitLabel?: string;
  onInputChange?: (input: UserInput) => void;
}
type TextFieldKey = Exclude<keyof BriefingData, 'baseline' | 'attachments'>;
const steps = ['Negócio', 'Situação', 'Objetivo', 'Recursos', 'Revisão'];
const titles = ['Vamos conhecer seu negócio.', 'Onde o negócio está hoje?', 'Qual é a prioridade deste ciclo?', 'O que é possível colocar em prática?', 'Revise antes de gerar.'];
const subtitles = ['Comece pelo negócio. O restante da estratégia parte daqui.', 'Conte o que você sabe. As lacunas também ajudam a orientar a estratégia.', 'Escolha um objetivo principal para orientar a estratégia.', 'Um plano útil precisa caber na rotina de quem vai executar.', 'Confira as respostas e os limites do seu plano antes de continuar.'];
const help = [
  ['O negócio vem primeiro', 'O que a marca oferece e para quem ela existe orientam as próximas decisões. O perfil do Instagram é opcional.'],
  ['Contexto, não adivinhação', 'Resultados observados são diferentes de expectativas. Se ainda não houver dados, sinalize isso em vez de estimar.'],
  ['Uma decisão por vez', 'O objetivo define o foco. Os recursos disponíveis ajudam a ajustar o plano à realidade do seu negócio.'],
  ['Consistência possível', 'Informe tempo, equipe e disponibilidade para gravar. A estratégia deve se adaptar aos recursos, não o contrário.'],
  ['Você mantém o controle', 'As recomendações da IA precisam de revisão. Informações não definidas são lacunas, não fatos.'],
];

export function OnboardingWizard({ onStart, initialValues, error, isAuthenticated, userId, toolbar, onLogout,
  planLoading = false, planError, creditsRemaining, canGenerate = true, onUpgrade, previewMode = false,
  generationCost = 20, attachmentService, submitLabel, onInputChange }: Props) {
  const [initial] = useState(() => {
    let draft = null;
    try { draft = readBriefingDraft(window.localStorage, userId); } catch { /* Storage may be disabled. */ }
    return initialValues ? { data: normalizeBriefing(initialValues), step: 0 } : draft ?? { data: normalizeBriefing(null), step: 0 };
  });
  const [data, setData] = useState<BriefingData>(initial.data);
  const [previewDraft, setPreviewDraft] = useState(() => {
    if (!import.meta.env.DEV || import.meta.env.MODE !== 'development' || previewMode || !isAuthenticated) return null;
    try { return readBriefingDraft(window.localStorage, 'local-ui-fixture'); } catch { return null; }
  });
  const [step, setStep] = useState<number>(initial.step);
  const [errors, setErrors] = useState<Partial<Record<keyof BriefingData, string>>>({});
  const [message, setMessage] = useState('');
  const [paused, setPaused] = useState(false);
  const [busy, setBusy] = useState(false);
  const [pendingAttachments, setPendingAttachments] = useState(false);
  const [lastSaved, setLastSaved] = useState(JSON.stringify(initial.data));
  const heading = useRef<HTMLHeadingElement>(null);
  const submitted = useRef(false);
  const dirty = JSON.stringify(data) !== lastSaved;
  useEffect(() => {
    if (!onInputChange) return;
    try { onInputChange(toStrategyInput(data)); } catch { /* Incomplete steps are not generation context. */ }
  }, [data, onInputChange]);
  useEffect(() => {
    if (!dirty) return;
    const warn = (event: BeforeUnloadEvent) => { event.preventDefault(); event.returnValue = ''; };
    window.addEventListener('beforeunload', warn);
    return () => window.removeEventListener('beforeunload', warn);
  }, [dirty]);
  useEffect(() => { heading.current?.focus(); }, [step, paused]);
  function update(key: TextFieldKey, value: string) {
    setData((previous) => ({ ...previous, [key]: value }));
    setErrors((previous) => ({ ...previous, [key]: undefined })); setMessage('');
  }
  function move(target: number) {
    if (target > step) {
      for (let index = 0; index < target; index++) {
        const issues = validateBriefingStep(data, index);
        if (Object.keys(issues).length) {
          setStep(index); setErrors(issues); setMessage('Confira os campos indicados antes de continuar.'); return;
        }
      }
    }
    setErrors({}); setMessage(''); setStep(target);
  }
  function choose(value: string) { setData(selectObjective(data, value)); setErrors({}); setMessage(''); }
  function saveAndExit() {
    try {
      saveBriefingDraft(window.localStorage, userId ?? '', data, step);
      setLastSaved(JSON.stringify(data)); setPaused(true); setMessage('');
    } catch { setMessage('Não foi possível salvar neste navegador. Suas respostas continuam nesta tela.'); }
  }
  function requestLogout() {
    if (dirty && !window.confirm('Sair sem salvar as respostas? Cancele e use "Salvar e sair" para guardar o briefing neste navegador.')) return;
    void onLogout?.();
  }
  function importPreview() {
    if (!previewDraft || !isAuthenticated) return;
    if (!window.confirm('Carregar as respostas da prévia nesta tela para revisão? As respostas atuais da tela serão substituídas. Nenhum crédito será consumido.')) return;
    setData(previewDraft.data); setStep(previewDraft.step); setPaused(false);
    setErrors({}); setPreviewDraft(null);
    setMessage('Respostas da prévia carregadas. Revise, salve na sua conta e confira o saldo antes de gerar.');
  }
  async function generate() {
    if (submitted.current || !isAuthenticated || !canGenerate || planLoading || planError) return;
    if (pendingAttachments) { setMessage('Aprove ou retire os anexos pendentes antes de gerar.'); return; }
    try {
      const input = toStrategyInput(data); submitted.current = true; setBusy(true); await onStart(input);
    } catch (failure) { setMessage(failure instanceof Error ? failure.message : 'Não foi possível iniciar. Suas respostas foram mantidas.'); }
    finally { submitted.current = false; setBusy(false); }
  }
  function field(key: TextFieldKey, label: string, placeholder: string, multiline = false) {
    const Component = multiline ? Textarea : Input;
    return <div className="space-y-2" key={key}>
      <label htmlFor={'briefing-' + key} className="block text-sm font-semibold">{label}</label>
      <Component id={'briefing-' + key} value={data[key] ?? ''} onChange={(event) => update(key, event.target.value)}
        placeholder={placeholder} maxLength={5000} aria-invalid={!!errors[key]} aria-describedby={errors[key] ? 'error-' + key : undefined}
        className={'rounded-xl border-border bg-muted/20 text-base ' + (multiline ? 'min-h-[100px] resize-y' : 'h-12')} />
      {errors[key] && <p id={'error-' + key} className="text-sm text-destructive">{errors[key]}</p>}
    </div>;
  }
  function select(key: TextFieldKey, label: string, options: { value: string; label: string }[]) {
    return <div className="space-y-2">
      <label htmlFor={'briefing-' + key} className="block text-sm font-semibold">{label}</label>
      <select id={'briefing-' + key} value={data[key]} onChange={(event) => update(key, event.target.value)} aria-invalid={!!errors[key]}
        aria-describedby={errors[key] ? 'error-' + key : undefined}
        className="h-12 w-full rounded-xl border border-input bg-background px-3 text-base focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-ring">
        <option value="">Selecione uma opção</option>
        {options.map((option) => <option key={option.value} value={option.value}>{option.label}</option>)}
      </select>
      {errors[key] && <p id={'error-' + key} className="text-sm text-destructive">{errors[key]}</p>}
    </div>;
  }
  const review: [string, string, number][] = [
    ['Negócio', [data.brandName || data.username, data.niche, data.productsAndServices, data.businessStage, data.serviceArea,
      data.differentiators && 'Diferencial: ' + data.differentiators, data.availableProof && 'Provas disponíveis: ' + data.availableProof,
      data.communicationRestrictions && 'Restrições: ' + data.communicationRestrictions].filter(Boolean).join('\n'), 0],
    ['Situação', [data.audience, data.customerProblem && 'Problema: ' + data.customerProblem, data.mainObstacle && 'Obstáculo: ' + data.mainObstacle,
      data.purchaseProcess && 'Compra: ' + data.purchaseProcess, data.currentBio && 'Bio atual: ' + data.currentBio,
      data.existingContentInsights && 'Tentativas e resultados: ' + data.existingContentInsights].filter(Boolean).join('\n'), 1],
    ['Objetivo', [data.goals, data.conversionDestination && 'Próximo passo: ' + data.conversionDestination,
      data.successSignal && 'Sinal de avanço: ' + data.successSignal].filter(Boolean).join('\n'), 2],
    ['Recursos', [(data.desiredPostingFrequency === 'personalizado' ? 'Definir com a estratégia' : postingFrequencyOptions.find((item) => item.value === data.desiredPostingFrequency)?.label ?? 'Não definido'),
      data.weeklyTime, data.availableResources, data.recordingComfort, data.capacityToServe].filter(Boolean).join('\n'), 3],
  ];
  return <section className="briefing-workspace min-h-screen bg-background text-foreground">
    <header className="border-b border-border">
      <div className="mx-auto flex max-w-[1440px] flex-wrap items-center justify-between gap-4 px-5 py-5 sm:px-12">
        <div className="flex items-center gap-5"><img src={logo} alt="StrategInsta" className="logo-theme-aware h-8 w-auto sm:h-9" />
          <span className="hidden border-l border-border pl-5 text-sm text-muted-foreground sm:inline">Briefing do negócio</span></div>
        <div className="flex flex-wrap items-center gap-2">{toolbar}{onLogout && <Button variant="ghost" onClick={requestLogout} disabled={busy}>Sair</Button>}{!paused && <Button variant="ghost" onClick={saveAndExit} disabled={!isAuthenticated || busy}><Save className="mr-2 h-4 w-4" />Salvar e sair</Button>}</div>
      </div>
    </header>
    {previewDraft && <div className="mx-auto my-5 max-w-[1096px] rounded-xl border border-primary/30 bg-muted/30 p-5 text-sm">
      <p className="font-semibold">Há um briefing salvo na prévia deste navegador.</p>
      <p className="mt-2 break-words text-muted-foreground">Marca: {previewDraft.data.brandName || previewDraft.data.username || 'não informada'}. A importação só preenche o formulário, sem gerar ou gastar créditos.</p>
      <Button className="mt-3" variant="outline" onClick={importPreview}>Trazer respostas da prévia</Button>
    </div>}
    {paused ? <div className="mx-auto max-w-xl px-5 py-24">
      <h1 ref={heading} tabIndex={-1} className="text-3xl font-bold outline-none">Seu rascunho está salvo.</h1>
      <p className="mt-4 leading-7 text-muted-foreground">Ele fica neste navegador, associado à sua conta. Não está sincronizado com outros dispositivos. Você pode fechar esta aba ou continuar agora.</p>
      <Button variant="gradient" className="mt-8" onClick={() => setPaused(false)}>Continuar briefing<ArrowRight className="ml-2 h-4 w-4" /></Button>
    </div> : <div className="mx-auto max-w-[1160px] px-5 pb-10 sm:px-8">
      <nav aria-label="Etapas do briefing" className="py-6"><ol className="grid grid-cols-5">
        {steps.map((label, index) => <li key={label} className="relative text-center">
          <button type="button" onClick={() => move(index)} aria-current={index === step ? 'step' : undefined}
            className="relative z-10 flex w-full flex-col items-center gap-3 rounded-md px-1 py-2 text-xs focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-ring sm:text-sm">
            <span className={index <= step ? 'font-medium text-foreground' : 'text-muted-foreground'}>{label}</span>
            <span style={index < step ? { background: 'var(--btn-gradient)' } : undefined} className={'flex h-8 w-8 items-center justify-center rounded-full border-2 bg-background font-semibold ' + (index < step ? 'border-transparent text-white' : index === step ? 'border-primary text-primary' : 'border-border text-muted-foreground')}>
              {index < step ? <Check className="h-4 w-4" aria-hidden="true" /> : index + 1}</span>
          </button>
          {index < 4 && <span aria-hidden="true" className={'absolute left-1/2 top-[55px] h-px w-full sm:top-[57px] ' + (index < step ? 'bg-primary' : 'bg-border')} />}
        </li>)}
      </ol></nav>
      <div className="grid gap-8 lg:grid-cols-[minmax(0,2fr)_minmax(220px,0.85fr)] lg:gap-14">
        <div className="min-w-0">
          <h1 ref={heading} tabIndex={-1} className="text-2xl font-bold tracking-tight outline-none sm:text-[32px] sm:leading-tight">{previewMode && step === 4 ? 'Salve antes de ir para o app real.' : step === 4 && generationCost === 0 ? 'Revise antes de salvar.' : titles[step]}</h1>
          <p className="mb-8 mt-3 text-sm leading-6 text-muted-foreground sm:text-base">{previewMode && step === 4 ? 'Você pode aproveitar estas respostas no app real após entrar na sua conta.' : subtitles[step]}</p>
          <div className="space-y-6">
            {step === 0 && <>
              {field('brandName', 'Nome da marca', 'Como sua marca se apresenta?')}
              {field('username', 'Instagram (opcional)', '@perfil')}
              <p className="text-xs leading-5 text-muted-foreground">O @ identifica seu perfil no briefing. A consulta automática ao Instagram ainda não está conectada. Inclua resultados observados na próxima etapa.</p>
              {field('niche', 'Segmento do negócio', 'Ex.: cerâmica artesanal para casa')}
              {field('productsAndServices', 'O que a marca oferece?', 'Produtos, serviços e a oferta que merece prioridade.', true)}
              <Button variant="link" className="h-auto p-0" onClick={() => update('productsAndServices', 'Ainda vou lançar. A oferta precisa ser validada antes de ampliar o negócio.')}>Ainda vou lançar minha oferta</Button>
              {field('differentiators', 'Por que alguém escolheria sua oferta?', 'Diferenciais que consegue demonstrar, sem precisar ser algo exclusivo.', true)}
              <Button variant="link" className="h-auto p-0" onClick={() => update('differentiators', 'Preciso descobrir meu diferencial. Tratar sugestões como hipóteses para validar.')}>Preciso descobrir meu diferencial</Button>
              <details className="rounded-xl border border-border p-4"><summary className="cursor-pointer text-sm font-medium">Momento do negócio, atendimento e provas (opcional)</summary><div className="mt-5 space-y-5">
                {select('businessStage', 'Em que momento está o negócio?', [
                  { value: 'Ainda vou lançar a primeira oferta', label: 'Vou lançar a primeira oferta' },
                  { value: 'Começando, com primeiras vendas', label: 'Começando, com primeiras vendas' },
                  { value: 'Já vendo regularmente', label: 'Já vendo regularmente' },
                  { value: 'Negócio estabelecido, lançando uma nova oferta', label: 'Lançando uma nova oferta em negócio existente' }])}
                {field('serviceArea', 'Onde e como atende?', 'Ex.: presencial em Curitiba; online em todo o Brasil.')}
                {field('availableProof', 'Que provas você pode usar?', 'Credenciais, demonstrações ou depoimentos com autorização. Deixe vazio se não houver.', true)}
                {field('communicationRestrictions', 'Há restrições de comunicação?', 'Promessas que deve evitar, regras do setor ou informações confidenciais.', true)}
              </div></details>
            </>}
            {step === 1 && <>
              {field('audience', 'Quem compra ou você pretende alcançar?', 'Descreva o público com base no que você sabe.', true)}
              <Button variant="link" className="h-auto p-0" onClick={() => update('audience', 'Público ainda não definido. Validar as hipóteses da estratégia.')}>Ainda não conheço o público</Button>
              {field('customerProblem', 'Qual problema você ajuda essa pessoa a resolver?', 'Descreva a situação que leva alguém a procurar sua oferta.', true)}
              <Button variant="link" className="h-auto p-0" onClick={() => update('customerProblem', 'Problema do cliente ainda não validado. Preciso de hipóteses para investigar.')}>Ainda não sei definir o problema</Button>
              {field('mainObstacle', 'Qual é o principal obstáculo?', 'O que dificulta o avanço hoje?', true)}
              <Button variant="link" className="h-auto p-0" onClick={() => update('mainObstacle', 'Ainda não sei qual é o principal obstáculo. Preciso investigar antes de concluir.')}>Ainda não sei o que dificulta o avanço</Button>
              {field('existingContentInsights', 'O que já foi tentado? (opcional)', 'Ações realizadas e resultados observados, se houver.', true)}
              <details className="rounded-xl border border-border p-4"><summary className="cursor-pointer text-sm font-medium">Como a compra acontece e bio atual (opcional)</summary><div className="mt-5 space-y-5">
                {field('purchaseProcess', 'Como a pessoa decide e compra?', 'Quem usa, quem decide e quanto precisa conversar antes de comprar.', true)}
                {field('salesChannels', 'Por onde vende hoje?', 'Ex.: WhatsApp, loja física, site, indicação.')}
                {field('currentBio', 'Bio atual do Instagram', 'Cole o texto como está no perfil.', true)}
              </div></details>
              <ProfileBaselineEditor value={data.baseline} onChange={(baseline) => setData((previous) => ({ ...previous, baseline }))} />
              <details className="rounded-xl border border-border p-4"><summary className="cursor-pointer text-sm font-medium">Tom de voz, referências e temas (opcional)</summary><div className="mt-5 space-y-5">
                {field('brandVoice', 'Tom de voz', 'Como a marca deve se comunicar?')}
                {field('competitorsAndInspirations', 'Concorrentes e referências', 'Perfis e o que você observa neles.', true)}
                {field('contentPillars', 'Temas já trabalhados', 'Deixe em branco se espera sugestões da estratégia.')}
              </div></details>
            </>}
            {step === 2 && <>
              <fieldset aria-label="Objetivo principal" className="overflow-hidden rounded-xl border border-border bg-muted/10">
                {objectives.map((option) => <label key={option.value} className="flex cursor-pointer gap-4 border-b border-border px-5 py-5 last:border-0 hover:bg-muted/30 focus-within:bg-muted/30">
                  <input type="radio" name="primaryObjective" value={option.value} checked={data.primaryObjective === option.value} onChange={() => choose(option.value)} className="mt-1 h-5 w-5 shrink-0 accent-[hsl(var(--primary))]" />
                  <span><span className="block text-base font-semibold">{option.label}</span><span className="mt-1 block text-sm leading-6 text-muted-foreground">{option.description}</span></span>
                </label>)}
              </fieldset>
              {errors.goals && <p role="alert" className="text-sm text-destructive">{errors.goals}</p>}
              {data.primaryObjective === 'custom' && field('goals', 'Descreva seu objetivo', 'O que você precisa alcançar?', true)}
              {field('successSignal', 'Como você vai reconhecer esse avanço? (opcional)', 'Ex.: mais pedidos de orçamento qualificados.', true)}
              {select('conversionDestination', 'O que a pessoa deve fazer depois de conhecer seu perfil?', [
                { value: 'Conversar pelo Direct', label: 'Conversar pelo Direct' },
                { value: 'Chamar no WhatsApp', label: 'Chamar no WhatsApp' },
                { value: 'Visitar o site ou loja online', label: 'Visitar o site ou loja online' },
                { value: 'Pedir orçamento ou agendar atendimento', label: 'Pedir orçamento ou agendar atendimento' },
                { value: 'Visitar o espaço físico', label: 'Visitar o espaço físico' },
                { value: 'Seguir para conhecer melhor a marca', label: 'Seguir para conhecer melhor a marca' },
                { value: 'Próximo passo ainda indefinido. Recomendar como hipótese.', label: 'Preciso de uma sugestão' }])}
              <div className="flex flex-wrap gap-x-6 gap-y-3">
                <Button variant="link" className="h-auto p-0" onClick={() => choose('undecided')}>Ainda não sei definir</Button>
                <Button variant="link" className="h-auto p-0 text-muted-foreground" onClick={() => choose('custom')}>Tenho outro objetivo</Button>
              </div>
              {data.primaryObjective === 'undecided' && <p role="status" className="rounded-lg border border-border p-3 text-sm text-muted-foreground">Objetivo em aberto. A IA deverá propor hipóteses para você validar.</p>}
            </>}
            {step === 3 && <>
              {select('weeklyTime', 'Quanto tempo consegue dedicar ao conteúdo por semana?', [
                { value: 'Até 1 hora por semana', label: 'Até 1 hora' },
                { value: 'De 1 a 3 horas por semana', label: 'De 1 a 3 horas' },
                { value: 'De 3 a 5 horas por semana', label: 'De 3 a 5 horas' },
                { value: 'Mais de 5 horas por semana', label: 'Mais de 5 horas' },
                { value: 'Tempo disponível ainda não definido. Começar com um volume pequeno para validar.', label: 'Ainda não sei; começar com pouco' }])}
              {select('desiredPostingFrequency', 'Qual frequência é viável para o feed?', postingFrequencyOptions.map((item) => item.value === 'personalizado' ? { ...item, label: 'Definir com a estratégia' } : item))}
              {field('availableResources', 'Equipe e recursos disponíveis (opcional)', 'Apoio de design, equipamentos, materiais e outras condições da rotina.', true)}
              {select('recordingComfort', 'Como se sente gravando vídeos? (opcional)', [
                { value: 'À vontade para aparecer e falar', label: 'À vontade para aparecer e falar' },
                { value: 'Prefiro gravar mãos, produtos ou bastidores', label: 'Prefiro produtos, mãos ou bastidores' },
                { value: 'Posso narrar, mas prefiro não aparecer', label: 'Posso narrar, mas prefiro não aparecer' },
                { value: 'Ainda preciso testar e ganhar confiança', label: 'Ainda preciso testar' }])}
              {field('capacityToServe', 'Consegue atender mais pessoas hoje? (opcional)', 'Conte limites de agenda, produção, estoque ou atendimento.', true)}
              {select('instagramProficiencyLevel', 'Seu nível de experiência no Instagram', proficiencyLevelOptions)}
              <details className="rounded-xl border border-border p-4"><summary className="cursor-pointer text-sm font-medium">Foco do funil (opcional)</summary><div className="mt-4">{select('funnelFocus', 'Como distribuir os conteúdos?', funnelOptions)}</div></details>
            </>}
            {step === 4 && <>
              <dl className="divide-y divide-border rounded-xl border border-border px-5">
                {review.map(([label, value, index]) => <div key={label} className="flex items-start justify-between gap-4 py-5"><div className="min-w-0"><dt className="text-sm font-semibold">{label}</dt><dd className="mt-2 whitespace-pre-wrap break-words text-sm leading-6 text-muted-foreground">{value}</dd></div><Button variant="link" size="sm" onClick={() => move(index)} aria-label={'Editar ' + label}>Editar</Button></div>)}
              </dl>
              <div className="rounded-xl border border-border p-5 text-sm leading-6">
                {previewMode ? <p>Esta prévia não gera estratégias nem consulta seu saldo. Salve as respostas abaixo e abra o app real para entrar na sua conta, importar o briefing e conferir os créditos.</p> : planLoading ? 'Consultando seu plano...' : planError ? <p role="alert" className="text-destructive">{planError}</p> : <>
                  <p className="font-semibold">{generationCost === 0 ? 'Salvar esta revisão do briefing é gratuito.' : `Gerar a estratégia completa consome ${generationCost} créditos.`}</p>
                  {creditsRemaining !== undefined && <p className="text-muted-foreground">Saldo disponível: {creditsRemaining} créditos. {creditsRemaining >= generationCost && `Após gerar: ${creditsRemaining - generationCost} créditos.`}</p>}
                  <p className="mt-2 text-muted-foreground">Revisar o briefing é gratuito. Novas gerações e refinamentos com IA têm o custo indicado em cada ação.</p>
                  {!canGenerate && <p className="mt-2 text-muted-foreground">Seu saldo não permite uma nova estratégia. Você pode salvar o briefing e voltar depois.</p>}
                </>}
              </div>
              {data.baseline && <div className="rounded-xl border border-border p-4 text-sm"><p className="font-semibold">Ponto de partida declarado</p><p className="mt-2 text-muted-foreground">Fonte: {data.baseline.sourceDescription}. Captura: {data.baseline.capturedAt}. {data.baseline.periodStart ? `Período: ${data.baseline.periodStart} a ${data.baseline.periodEnd}.` : 'Sem período de resultados informado.'}</p><Button variant="link" className="px-0" onClick={() => move(1)}>Revisar medição</Button></div>}
              <div className="rounded-xl bg-muted/30 p-4 text-sm leading-6"><p className="font-semibold">O que ainda precisa ser validado</p><p className="mt-2 text-muted-foreground">{[!data.availableProof && 'Nenhuma prova ou credencial fornecida.', !data.baseline && 'Sem medição inicial do Instagram.', !data.serviceArea && 'Área de atendimento não informada.', !data.capacityToServe && 'Capacidade de atendimento não informada.'].filter(Boolean).join(' ') || 'As informações fornecidas orientam a estratégia. Recomendações continuam sendo hipóteses até serem testadas.'} A IA deverá sinalizar hipóteses e não inventar resultados.</p></div>
            </>}
            <div hidden={step !== 4}><AttachmentsPanel value={data.attachments} service={attachmentService}
              onChange={(attachments) => setData((previous) => ({ ...previous, attachments }))} onPendingChange={setPendingAttachments} disabled={busy} /></div>
          </div>
        </div>
        <aside className="border-t border-border pt-6 lg:border-l lg:border-t-0 lg:pl-10 lg:pt-24"><h2 className="text-base font-semibold text-primary">{help[step][0]}</h2><p className="mt-5 max-w-sm text-sm leading-7 text-muted-foreground">{help[step][1]}</p></aside>
      </div>
      {(message || error) && <p role="alert" className="mt-6 rounded-xl border border-destructive/40 p-4 text-sm">{message || error}</p>}
      <footer className="mt-10 flex flex-wrap items-center justify-between gap-4 border-t border-border pt-6 sm:mt-14">
        <Button variant="outline" onClick={() => move(step - 1)} disabled={step === 0 || busy}><ArrowLeft className="mr-2 h-4 w-4" />Voltar</Button>
        {step < 4 ? <Button variant="gradient" className="min-h-12 w-full rounded-xl px-8 sm:w-[420px]" onClick={() => move(step + 1)}>{step === 3 ? 'Revisar briefing' : 'Continuar para ' + ['situação', 'objetivo', 'recursos'][step]}<ArrowRight className="ml-3 h-4 w-4" /></Button>
          : !canGenerate && !planError && !planLoading && onUpgrade ? <Button variant="gradient" onClick={onUpgrade}>Ver planos</Button>
          : <Button variant="gradient" className="min-h-12 rounded-xl px-8" onClick={generate} disabled={!isAuthenticated || !canGenerate || planLoading || !!planError || busy || pendingAttachments}><Sparkles className="mr-2 h-4 w-4" />{busy ? 'Aguarde...' : submitLabel || (previewMode ? 'Salvar briefing para o app real' : `Gerar estratégia · ${generationCost} créditos`)}</Button>}
      </footer>
    </div>}
  </section>;
}
