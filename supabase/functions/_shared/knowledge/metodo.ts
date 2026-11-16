// Método E.A.E. e funil 3A3R para o motor. Fonte: docs/METODO-NO-MOTOR.md v1.1, seções 4 a 7,
// aprovado por Antony em 11/10/2026. Cada operação recebe só o trecho que usa.
// Fase e etapa são de uso interno: os ids em inglês nunca aparecem em texto visível.
export const PHASES = ['structure', 'acceleration', 'scale'] as const;
export const FUNNEL_STAGES = ['assimilation', 'acquisition', 'activation', 'retention', 'revenue', 'referral'] as const;

const PRIVACY = 'USO INTERNO: a fase do negócio e a etapa prioritária servem para decidir, não para exibir. Não escreva em texto visível as siglas do método, os nomes das fases nem os nomes das etapas do funil; explique em linguagem simples do dia a dia. Exceção: quando o próprio briefing trouxer esses nomes como parte do negócio do usuário. Os ids internos só aparecem nos campos method e funnelStage.';
const CONTEXT = 'Se previousOutputs.workspace.method existir, use a fase e a etapa prioritária registradas ali; se não existir, deduza as duas pelo briefing antes de responder.';
const PHASE_RULES = 'FASE DO NEGÓCIO (ids internos). Princípio: estrutura antes de acelerar, acelerar antes de escalar. structure = montar a base antes de buscar volume: oferta clara, perfil que explica o negócio e caminho de contato funcionando. acceleration = com a base pronta, aumentar o volume de conteúdo e acelerar o que já dá sinal positivo. scale = com canais validados e capacidade, ampliar o que funciona e abrir novos canais. Classifique pelo briefing: momento do negócio, capacidade de atender, provas disponíveis e resultados observados. Na dúvida, escolha a fase mais baixa. Sem capacidade de atender, nunca scale. O trabalho é em ciclos mensais de conteúdo; não prometa resultado em 30 dias.';
const FUNNEL_RULES = 'FUNIL (ids internos). assimilation = as pessoas certas conhecem e entendem o negócio? Sinais: alcance qualificado, visualizações, seguidores do nicho. acquisition = quem conhece entra em contato? Sinais: contatos e taxa de contato. activation = quem entra em contato compra? Sinal: conversão de contato em cliente. retention = o cliente continua e tem boa experiência? Sinais: permanência e satisfação. revenue = o cliente compra mais? Sinais: ticket médio e recompra. referral = o cliente indica? Sinais: indicações e avaliações. Escolha UMA etapa prioritária a partir do obstáculo e da medição inicial informados, sempre como hipótese. O conteúdo do mês dá mais peso à etapa prioritária, sem abandonar as demais. O Instagram atua principalmente em assimilation, acquisition e activation; retention, revenue e referral aparecem como conteúdo para quem já é cliente e como ideias de monetização.';
const CLASSIFY = 'Classifique a fase e a etapa prioritária e devolva as duas no campo method, cada uma com justificativa curta ligada ao briefing. No texto do perfil, sem nomear fase nem etapa, oriente as recomendações por elas e inclua um trecho curto com o título "O que observar", dizendo em linguagem simples quais sinais o usuário deve acompanhar para confirmar ou rever essa hipótese.';
const MATRIX_RULES = 'Cada ideia traz funnelStage com a etapa do funil que ela apoia. Dê mais peso à etapa prioritária e mantenha coerência com a fase: em structure, ideias que constroem a base antes de buscar volume.';
const SALE_RULES = 'Finalidade sale (oferta e venda): apresente a oferta com as condições reais informadas no briefing e um caminho de compra explícito. Sem escassez, urgência, prazo, bônus ou desconto inventados.';
const PLAN_RULES = 'Calendário e plano de ação priorizam a etapa prioritária e respeitam a fase: em structure, menos volume e mais base (oferta clara, perfil que explica o negócio, caminho de contato funcionando); em acceleration, mais volume do que já dá sinal positivo; em scale, ampliar o que funciona e abrir novos canais.';
const MONETIZATION_RULES = 'Ligue as ideias às etapas revenue (o cliente compra mais) e referral (o cliente indica), respeitando a capacidade real de entrega.';

const BY_KIND: Record<string, string[]> = {
  idealCustomerProfile: [PHASE_RULES, FUNNEL_RULES, CLASSIFY],
  monetizationIdeas: [FUNNEL_RULES, MONETIZATION_RULES],
  monetization_plan: [FUNNEL_RULES, MONETIZATION_RULES],
  contentMatrix: [PHASE_RULES, FUNNEL_RULES, MATRIX_RULES, SALE_RULES],
  contentTable: [PHASE_RULES, FUNNEL_RULES, MATRIX_RULES, SALE_RULES],
  final: [PHASE_RULES, FUNNEL_RULES, MATRIX_RULES, SALE_RULES, PLAN_RULES],
  editorialCalendar: [PHASE_RULES, FUNNEL_RULES, PLAN_RULES],
  actionPlan: [PHASE_RULES, FUNNEL_RULES, PLAN_RULES],
  idea: [FUNNEL_RULES, MATRIX_RULES, SALE_RULES],
  variation: [FUNNEL_RULES, MATRIX_RULES, SALE_RULES],
  script: [SALE_RULES],
};

/** Method text for one output kind; empty when the kind does not use the method. */
export function methodKnowledge(kind: string): string {
  const rules = BY_KIND[kind];
  if (!rules) return '';
  const context = kind === 'idealCustomerProfile' || kind === 'script' ? [] : [CONTEXT];
  return ['MÉTODO:', PRIVACY, ...context, ...rules].join(' ');
}

const clip = (value: unknown) => typeof value === 'string' ? value.trim().slice(0, 600) : '';
const enumOf = (value: unknown, values: readonly string[]) => {
  const text = typeof value === 'string' ? value.trim().toLowerCase() : '';
  return values.includes(text) ? text : undefined;
};

/** Keeps only a valid phase and priority stage. A missing or malformed method never fails a paid stage: the engine infers it again. */
export function sanitizeMethod(raw: unknown): Record<string, string> | undefined {
  if (!raw || typeof raw !== 'object' || Array.isArray(raw)) return undefined;
  const value = raw as Record<string, unknown>;
  const phase = enumOf(value.phase, PHASES);
  const bottleneck = enumOf(value.bottleneck, FUNNEL_STAGES);
  if (!phase || !bottleneck) return undefined;
  return { phase, phaseReason: clip(value.phaseReason), bottleneck, bottleneckReason: clip(value.bottleneckReason) };
}
