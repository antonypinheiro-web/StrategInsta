/**
 * StrategInsta — AI Service
 * Chama a Edge Function `call-ai` (server-side) — chaves nunca expostas no frontend.
 * Fallback Gemini → OpenAI é feito no servidor.
 */

import { supabase } from '@/integrations/supabase/client';
import type {
  UserInput,
  GeneratedStrategy,
  ContentTableData,
  CalendarDay,
  ActionPlanItem,
  StoriesStrategyItem,
} from '../types';

// ─── Roteador principal (server-side) ────────────────────────────────────────

async function callAI(systemPrompt: string, userPrompt: string): Promise<string> {
  const { data: { session } } = await supabase.auth.getSession();
  if (!session?.access_token) throw new Error('Usuário não autenticado');

  const { data, error } = await supabase.functions.invoke('call-ai', {
    body: { systemPrompt, userPrompt },
    headers: { Authorization: `Bearer ${session.access_token}` },
  });

  if (error) throw new Error(error.message);
  if (data?.code === 'QUOTA_EXCEEDED') throw new Error('QUOTA_EXCEEDED');
  if (!data?.text) throw new Error('Resposta vazia da IA');
  return data.text as string;
}

// ─── Extração robusta de JSON ─────────────────────────────────────────────────

function extractJSON<T>(raw: string, isArray: boolean): T {
  // 1. Tenta extrair bloco markdown ```json ... ```
  const codeBlock = raw.match(/```(?:json)?\s*([\s\S]*?)\s*```/);
  const src = codeBlock ? codeBlock[1] : raw;

  // 2. Extração balanceada (não gulosa)
  const open = isArray ? '[' : '{';
  const close = isArray ? ']' : '}';
  const start = src.indexOf(open);
  if (start === -1) throw new Error(`${open} não encontrado`);

  let depth = 0;
  for (let i = start; i < src.length; i++) {
    if (src[i] === open) depth++;
    if (src[i] === close) {
      depth--;
      if (depth === 0) return JSON.parse(src.substring(start, i + 1)) as T;
    }
  }
  throw new Error('JSON não balanceado');
}

// ─── Contexto base do usuário ─────────────────────────────────────────────────

function buildUserContext(input: UserInput, strategy?: Partial<GeneratedStrategy>): string {
  const icpContext = strategy?.idealCustomerProfile
    ? `\nPERFIL DO CLIENTE IDEAL (gerado anteriormente — use como referência):\n${strategy.idealCustomerProfile.substring(0, 600)}`
    : '';

  return `
CONTEXTO DO NEGÓCIO:
- Nicho/Segmento: ${input.niche}
- Público-alvo: ${input.audience}
- Username no Instagram: @${input.username}
- Objetivos principais: ${input.goals}
- Tom de voz da marca: ${input.brandVoice || 'profissional e próximo'}
- Produtos/Serviços: ${input.productsAndServices || 'não especificado'}
- Pilares de conteúdo: ${input.contentPillars || 'educação, bastidores, prova social'}
- Foco do funil: ${input.funnelFocus}
- Frequência de postagem desejada: ${input.desiredPostingFrequency}
- Nível de experiência no Instagram: ${input.instagramProficiencyLevel}
- Concorrentes/Referências: ${input.competitorsAndInspirations || 'não especificado'}
- Insights de conteúdo anterior: ${input.existingContentInsights || 'não especificado'}
- Recursos disponíveis: ${input.availableResources || 'não especificado'}${icpContext}
`.trim();
}

// ─── System prompt base ───────────────────────────────────────────────────────

const BASE_SYSTEM = `Você é um estrategista de conteúdo sênior para Instagram com mais de 10 anos de experiência em marketing digital, copywriting e crescimento de marcas no Brasil.

Suas respostas devem ser:
- SEMPRE em português brasileiro
- Altamente personalizadas com base nos dados fornecidos
- Práticas, acionáveis e realistas
- Formatadas em Markdown claro e bem estruturado
- Adaptadas ao nível de experiência e tom de voz indicados
- Focadas no nicho específico, nunca genéricas

NUNCA use frases genéricas como "coloque aqui" ou "[adapte ao seu nicho]". Use sempre os dados fornecidos diretamente no texto.`;

// ─── 1. Perfil do Cliente Ideal ───────────────────────────────────────────────

export const generateIdealCustomerProfile = async (
  input: UserInput,
  refinementPrompt?: string
): Promise<string> => {
  const system = `${BASE_SYSTEM}

Sua tarefa é criar um Perfil do Cliente Ideal (ICP) detalhado e estratégico para uso em estratégia de conteúdo no Instagram.`;

  const user = `
${buildUserContext(input)}
${refinementPrompt ? `\nSOLICITAÇÃO DE REFINAMENTO: ${refinementPrompt}` : ''}

Crie um Perfil do Cliente Ideal completo e detalhado para o nicho "${input.niche}", incluindo:

## 1. Quem é esta pessoa
- Nome fictício e dados demográficos (idade, gênero, localização, renda estimada, ocupação)
- Situação de vida atual relacionada ao nicho
- Relação com o Instagram e consumo de conteúdo digital

## 2. Dores e Frustrações
- 3 dores profundas e específicas relacionadas ao nicho "${input.niche}"
- O que a mantém acordada à noite
- O que ela já tentou sem sucesso (soluções anteriores que falharam)

## 3. Desejos e Aspirações
- O que ela realmente quer alcançar no nicho "${input.niche}"
- Como seria a vida dela após a transformação
- Qual resultado rápido (quick win) ela busca primeiro

## 4. Comportamento no Instagram
- Tipo de conteúdo que consome, salva e compartilha
- Horários recomendados de engajamento para este perfil (baseado em comportamento típico do nicho)
- O que a faz seguir uma conta — gatilhos específicos para "${input.niche}"
- O que a faz deixar de seguir (red flags)

## 5. Gatilhos de Decisão
- O que a convence a comprar ou contratar em "${input.niche}"
- Principais objeções antes da compra
- Linguagem, palavras e expressões que ressoam com ela

## 6. Como se Comunicar com ela
- Tom e abordagem ideal baseados em "${input.brandVoice || 'profissional e próximo'}"
- Formatos de conteúdo mais eficientes para este perfil
- CTAs que funcionam com este público específico
- O que NÃO fazer ao se comunicar com ela
`;

  return callAI(system, user);
};

// ─── 2. Ideias de Monetização ─────────────────────────────────────────────────

export const generateMonetizationIdeas = async (
  input: UserInput,
  refinementPrompt?: string,
  strategy?: Partial<GeneratedStrategy>
): Promise<string> => {
  const system = `${BASE_SYSTEM}

Sua tarefa é criar um plano de monetização estratégico, realista e baseado em dados do mercado para o Instagram.`;

  const user = `
${buildUserContext(input, strategy)}
${refinementPrompt ? `\nSOLICITAÇÃO DE REFINAMENTO: ${refinementPrompt}` : ''}

Crie um plano de monetização completo e personalizado para o nicho "${input.niche}" com:

## 1. Análise do Potencial de Monetização
- Avaliação do mercado de "${input.niche}" no Brasil (estimativa de tamanho e aquecimento)
- Modelo predominante no nicho: B2C ou B2B? Digital ou físico? Recorrente ou pontual?
- Oportunidades imediatas (0-30 dias) vs. de médio prazo (60-90 dias)
- Formato mais adequado ao foco de funil declarado: ${input.funnelFocus}
- Como se diferenciar de: ${input.competitorsAndInspirations || 'concorrentes diretos do nicho'}

## 2. Top 3 Fontes de Receita Recomendadas
Para cada fonte, inclua: descrição, como implementar no Instagram passo a passo, ticket médio estimado para "${input.niche}", tempo para primeiro resultado e nível de esforço (baixo/médio/alto).

### Fonte 1: [a mais rápida de implementar para "${input.niche}"]
### Fonte 2: [complementar, média dificuldade]
### Fonte 3: [escalável, médio/longo prazo]

## 3. Estratégia de Lançamento pelo Instagram
- Sequência de conteúdo (7 posts) para apresentar cada oferta organicamente
- Tipo de post mais eficiente por fonte de receita no nicho "${input.niche}"
- Como usar stories para converter: sequência de aquecimento → oferta → urgência

## 4. Pricing e Posicionamento
- Faixa de preço sugerida baseada em: "${input.productsAndServices || 'produto/serviço a definir'}" no mercado "${input.niche}"
- Como comunicar valor antes de apresentar preço (3 etapas)
- Estratégias de upsell e cross-sell específicas para este nicho

## 5. Metas de Receita (baseadas em taxas típicas do nicho)
- Taxa de conversão realista para "${input.niche}": [pesquise o benchmark]
- Seguidores necessários para cada meta de receita
- Projeção de 30, 60 e 90 dias com base em conversão conservadora
`;

  return callAI(system, user);
};

// ─── 3. Bio do Instagram ──────────────────────────────────────────────────────

export const generateInstagramBio = async (
  input: UserInput,
  strategy: Partial<GeneratedStrategy>,
  refinementPrompt?: string
): Promise<string> => {
  const system = `${BASE_SYSTEM}

Sua tarefa é criar opções de bio para Instagram que sejam magnéticas, estratégicas e otimizadas para conversão.`;

  const icpSnippet = strategy?.idealCustomerProfile
    ? `\nAs 3 principais dores do cliente ideal (use para personalizar o CTA):\n${strategy.idealCustomerProfile.substring(0, 300)}`
    : '';

  const user = `
${buildUserContext(input, strategy)}
${icpSnippet}
${refinementPrompt ? `\nSOLICITAÇÃO DE REFINAMENTO: ${refinementPrompt}` : ''}

Crie 4 opções de bio para o Instagram de @${input.username} no nicho "${input.niche}".

Para cada opção entregue:
- Texto completo da bio (máximo 150 caracteres por linha, até 5 linhas)
- Emojis estratégicos com JUSTIFICATIVA (por que este emoji para "${input.niche}")
- Linha de CTA com sugestão de link na bio baseado no foco: ${input.funnelFocus}
- Breve explicação da estratégia usada

---

### Opção 1: Autoridade + Transformação
[Mostra expertise E o resultado que "${input.niche}" entrega — ideal para conversão]

### Opção 2: Direto ao Ponto + CTA Forte
[Máxima clareza, foco em conversão imediata — recomendado se funnelFocus = conversão]

### Opção 3: Conexão Humana + Comunidade
[Cria identificação com "${input.audience}" — ideal para crescimento orgânico]

### Opção 4: Storytelling Compacto
[Micro-história que gera curiosidade e autoridade ao mesmo tempo]

---

## Otimização do Campo "Nome" (não @username)
- 3 sugestões de nome com palavras-chave para ranqueamento em "${input.niche}"
- Exemplo: em vez de "Nome Sobrenome", usar "Nome | [keyword do nicho] | [resultado]"

## Estratégia de Link na Bio
- Estrutura recomendada baseado no foco ${input.funnelFocus}: página de captura, Linktree, WhatsApp, etc.
- O que NÃO colocar no link (erro comum em "${input.niche}")
`;

  return callAI(system, user);
};

// ─── 4. Estratégia de Stories ─────────────────────────────────────────────────

export const generateWeeklyStoriesStrategy = async (
  input: UserInput,
  refinementPrompt?: string
): Promise<StoriesStrategyItem[]> => {
  const system = `${BASE_SYSTEM}

Sua tarefa é criar uma estratégia de stories para 7 dias altamente personalizada e pronta para execução.
Responda EXCLUSIVAMENTE em formato JSON válido, sem markdown, sem texto fora do JSON.`;

  const user = `
${buildUserContext(input)}
${refinementPrompt ? `\nSOLICITAÇÃO DE REFINAMENTO: ${refinementPrompt}` : ''}

Crie uma estratégia de stories para 7 dias. Responda APENAS com um array JSON válido:

[
  {
    "dayOfWeek": "Segunda-feira",
    "objective": "objetivo estratégico específico (ex: aquecer audiência para oferta de quinta, gerar engajamento com enquete)",
    "contentType": "tipo de story (ex: Bastidores, Tutorial Rápido, Enquete, Depoimento, Pergunta Aberta, Countdown)",
    "example": "descrição detalhada de 3 frames: Frame 1: [o que mostra, texto na tela, duração]. Frame 2: [idem]. Frame 3: [idem com CTA]",
    "tips": "recursos do Instagram a usar (Enquete/Quiz/Countdown/Link), melhor horário para postar, tom específico para este dia"
  }
]

Regras:
- Exatamente 7 objetos (segunda a domingo)
- Use os pilares: ${input.contentPillars || 'educação, bastidores, prova social'}
- Adapte ao foco de funil: ${input.funnelFocus}
- Tom: ${input.brandVoice || 'profissional e próximo'}
- Cada dia deve ter objetivo DIFERENTE (não repita "engajamento" todos os dias)
- Inclua pelo menos 2 dias com CTA direto para ${input.productsAndServices || 'oferta principal'}
`;

  const raw = await callAI(system, user);

  try {
    return extractJSON<StoriesStrategyItem[]>(raw, true);
  } catch {
    return parseStoriesFallback(raw, input);
  }
};

function parseStoriesFallback(raw: string, input: UserInput): StoriesStrategyItem[] {
  const days = ['Segunda-feira', 'Terça-feira', 'Quarta-feira', 'Quinta-feira', 'Sexta-feira', 'Sábado', 'Domingo'];
  const objectives = ['Conexão com audiência', 'Educação e valor', 'Prova social', 'Engajamento direto', 'Bastidores', 'Oferta suave', 'Recapitulação da semana'];
  return days.map((day, i) => ({
    dayOfWeek: day,
    objective: objectives[i],
    contentType: 'Conteúdo estratégico',
    example: `Story para ${input.niche} — ${day}: compartilhe um insight sobre ${input.niche} relevante para ${input.audience}.`,
    tips: 'Use recursos nativos do Instagram: enquete ou caixa de perguntas para engajamento.',
  }));
}

// ─── 5. Matriz de Conteúdo ────────────────────────────────────────────────────

export const generateContentTable = async (input: UserInput): Promise<ContentTableData> => {
  const system = `${BASE_SYSTEM}

Sua tarefa é criar uma Matriz de Conteúdo estratégica para Instagram, organizada por etapa do funil de vendas.
Responda EXCLUSIVAMENTE em formato JSON válido, sem markdown, sem texto fora do JSON.`;

  const user = `
${buildUserContext(input)}

Crie uma matriz de conteúdo com pelo menos 3 ideias por etapa do funil.
Responda APENAS com o seguinte JSON:

{
  "topOfFunnel": [
    {
      "type": "formato específico (ex: Reel Educativo — Dica Rápida 15s, Carrossel — Lista de Erros)",
      "description": "por que este formato funciona para atrair novos seguidores em '${input.niche}'",
      "example": "título/ideia específica usando linguagem do nicho ${input.niche} e dor de ${input.audience}",
      "frequency": "sugestão de frequência (ex: 2x/semana)"
    }
  ],
  "middleOfFunnel": [
    {
      "type": "formato específico para relacionamento e autoridade",
      "description": "por que funciona para aprofundar conexão com quem já segue",
      "example": "ideia específica para ${input.niche}",
      "frequency": "sugestão de frequência"
    }
  ],
  "bottomOfFunnel": [
    {
      "type": "formato específico para conversão",
      "description": "por que funciona para converter seguidores em clientes de ${input.productsAndServices || 'produto/serviço'}",
      "example": "ideia específica para ${input.niche}",
      "frequency": "sugestão de frequência"
    }
  ]
}

Use os pilares: ${input.contentPillars || 'educação, bastidores, prova social, entretenimento'}.
Diferenciação de concorrentes: ${input.competitorsAndInspirations || 'analise o mercado de ' + input.niche}.
`;

  const raw = await callAI(system, user);

  try {
    return extractJSON<ContentTableData>(raw, false);
  } catch {
    return buildContentTableFallback(input);
  }
};

function buildContentTableFallback(input: UserInput): ContentTableData {
  const n = input.niche;
  return {
    topOfFunnel: [
      { type: 'Reel Educativo (15-30s)', description: 'Dica rápida que atrai novos seguidores pelo valor imediato', example: `3 erros comuns em ${n} que impedem o crescimento`, frequency: '2x/semana' },
      { type: 'Carrossel de Lista', description: 'Conteúdo educativo aprofundado, gera salvamentos', example: `Guia completo para iniciantes em ${n}`, frequency: '1x/semana' },
      { type: 'Reel de Tendência', description: 'Aproveita formatos virais adaptados ao nicho', example: `O que ninguém te conta sobre ${n}`, frequency: '1x/semana' },
    ],
    middleOfFunnel: [
      { type: 'Bastidores (Reel ou Foto)', description: 'Humaniza a marca, cria conexão emocional', example: `Como funciona meu processo de trabalho em ${n}`, frequency: '1x/semana' },
      { type: 'Tutorial Detalhado', description: 'Demonstra expertise e posiciona como autoridade', example: `Passo a passo para ter resultado em ${n}`, frequency: '1x/semana' },
    ],
    bottomOfFunnel: [
      { type: 'Depoimento de Cliente', description: 'Prova social que quebra a principal objeção', example: `Resultado real de cliente em ${n}: antes e depois`, frequency: '1x/semana' },
      { type: 'Oferta com CTA Direto', description: 'Post focado em conversão com urgência', example: `Vagas abertas: ${input.productsAndServices || 'minha solução para ' + n}`, frequency: '1x/semana' },
    ],
  };
}

// ─── 6. Calendário Editorial ──────────────────────────────────────────────────

export const generateEditorialCalendar = async (
  input: UserInput,
  _strategy: Partial<GeneratedStrategy>
): Promise<CalendarDay[]> => {
  const system = `${BASE_SYSTEM}

Sua tarefa é criar um calendário editorial de 30 dias para Instagram, detalhado e pronto para execução.
Responda EXCLUSIVAMENTE em formato JSON válido, sem markdown, sem texto fora do JSON.`;

  const user = `
${buildUserContext(input)}

Crie um calendário editorial de 30 dias. Responda APENAS com um array JSON:

[
  {
    "day": 1,
    "weekday": "Segunda-feira",
    "contentType": "formato específico do post",
    "topic": "tópico detalhado e específico usando dados reais do nicho ${input.niche} e público ${input.audience}",
    "caption": "legenda completa: hook (1ª linha impactante, máx 125 chars), corpo (2-3 parágrafos curtos), CTA claro. Tom: ${input.brandVoice || 'profissional e próximo'}",
    "hashtags": ["#hashtag1", "#hashtag2", "#hashtag3", "#hashtag4", "#hashtag5"],
    "stories": ["story 1: descrição + recurso Instagram a usar", "story 2: descrição + CTA"]
  }
]

Regras obrigatórias:
- Exatamente 30 objetos (dias 1 a 30)
- Tipos: 40% Reels, 30% Carrosséis, 20% Fotos, 10% outros
- Frequência: ${input.desiredPostingFrequency} (ajuste a distribuição)
- Alterne ToFu/MoFu/BoFu conforme: ${input.funnelFocus}
- Pilares: ${input.contentPillars || 'educação, bastidores, prova social'}
- Hashtags: máx 6, misture nicho (#${input.niche.replace(/\s+/g, '')}), médio porte e pequeno nicho
- Captions: hook na 1ª linha, quebras de linha para respiração, CTA no final
`;

  const raw = await callAI(system, user);

  try {
    return extractJSON<CalendarDay[]>(raw, true);
  } catch {
    return buildCalendarFallback(input);
  }
};

function buildCalendarFallback(input: UserInput): CalendarDay[] {
  const weekdays = ['Segunda-feira', 'Terça-feira', 'Quarta-feira', 'Quinta-feira', 'Sexta-feira', 'Sábado', 'Domingo'];
  const types = ['Reel Educativo', 'Carrossel de Dicas', 'Foto com Pergunta', 'Reel Bastidores', 'Carrossel de Lista', 'Reel Inspiracional', 'Post de Oferta'];
  return Array.from({ length: 30 }, (_, i) => ({
    day: i + 1,
    weekday: weekdays[i % 7],
    contentType: types[i % 7],
    topic: `${types[i % 7]} sobre ${input.niche} — Dia ${i + 1}`,
    caption: `Conteúdo estratégico sobre ${input.niche} para ${input.audience}.\n\nSalve este post para consultar sempre que precisar!\n\n👇 Qual dica foi mais útil para você?`,
    hashtags: [`#${input.niche.replace(/\s+/g, '')}`, '#Instagram', '#MarketingDigital', '#Conteudo', '#Estrategia'],
    stories: ['Story de apoio: compartilhe o post nos stories com enquete', 'Story de CTA: direcione para o link na bio'],
  }));
}

// ─── 7. Plano de Ação ─────────────────────────────────────────────────────────

export const generateActionPlan = async (
  input: UserInput,
  strategy: Partial<GeneratedStrategy>
): Promise<ActionPlanItem[]> => {
  const system = `${BASE_SYSTEM}

Sua tarefa é criar um plano de ação semanal detalhado, adaptado ao nível de experiência e recursos disponíveis do usuário.
Responda EXCLUSIVAMENTE em formato JSON válido, sem markdown, sem texto fora do JSON.`;

  const user = `
${buildUserContext(input, strategy)}

Crie um plano de ação para 4 semanas. Responda APENAS com um array JSON:

[
  {
    "week": 1,
    "tasks": [
      {
        "task": "nome curto e específico da tarefa",
        "description": "como executar passo a passo, específico para '${input.niche}'. Inclua ferramentas, tempo estimado e critério de sucesso.",
        "priority": "high | medium | low",
        "completed": false
      }
    ]
  }
]

Regras:
- 4 objetos (semanas 1 a 4)
- Semana 1: Fundação — otimizar perfil, criar primeiros conteúdos, configurar ferramentas (4-5 tarefas high)
- Semana 2: Execução — publicar calendário, estratégia de stories, engajar comunidade (4-5 tarefas)
- Semana 3: Análise — verificar métricas, ajustar estratégia, captar primeiros leads (4-5 tarefas)
- Semana 4: Monetização — lançar oferta, usar prova social, planejar próximo mês (4-5 tarefas)
- Nível de experiência: ${input.instagramProficiencyLevel} (iniciante = mais básico e detalhado, avançado = mais estratégico)
- Recursos disponíveis: ${input.availableResources || 'tempo moderado, smartphone'}
- Produto/serviço a promover: ${input.productsAndServices || 'definir na semana 3'}
- Inclua métricas a acompanhar (KPIs) em cada semana: seguidores, alcance, engajamento, leads, vendas
`;

  const raw = await callAI(system, user);

  try {
    return extractJSON<ActionPlanItem[]>(raw, true);
  } catch {
    return buildActionPlanFallback(input);
  }
};

function buildActionPlanFallback(input: UserInput): ActionPlanItem[] {
  return [
    {
      week: 1,
      tasks: [
        { task: 'Otimizar perfil do Instagram', description: `Implementar bio estratégica gerada, atualizar foto de perfil com fundo limpo, criar 4 destaques: Serviços, Resultados, Sobre e FAQ. Tempo: 2h.`, priority: 'high', completed: false },
        { task: 'Publicar primeiros 7 posts', description: 'Usar o calendário editorial gerado como guia. Agendar via Meta Business Suite.', priority: 'high', completed: false },
        { task: 'Implementar estratégia de stories', description: 'Seguir o plano de stories dia a dia. Usar enquetes e caixas de perguntas.', priority: 'high', completed: false },
        { task: 'Engajar com 10 perfis por dia', description: `Comentar em perfis do nicho ${input.niche} com insights genuínos. Não use emojis soltos.`, priority: 'medium', completed: false },
      ],
    },
    {
      week: 2,
      tasks: [
        { task: 'Analisar métricas da semana 1', description: 'Verificar alcance, engajamento e crescimento. Identificar post de maior performance.', priority: 'high', completed: false },
        { task: 'Responder todos os comentários e DMs', description: 'Criar conexão genuína. Tempo recomendado: 20 min pela manhã e 20 min à noite.', priority: 'high', completed: false },
        { task: 'Criar lead magnet', description: `Produzir PDF ou checklist gratuito relacionado a ${input.niche}. Postar call para o link na bio.`, priority: 'medium', completed: false },
      ],
    },
    {
      week: 3,
      tasks: [
        { task: 'Ajustar estratégia com base em dados', description: 'Dobrar o que performou bem. Pausar o que não engajou. Ajustar horários.', priority: 'high', completed: false },
        { task: 'Coletar depoimentos', description: `Pedir feedback de clientes ou seguidores sobre ${input.niche}. Usar como prova social.`, priority: 'medium', completed: false },
        { task: 'Preparar sequência de lançamento', description: `Criar 5 posts de aquecimento para ${input.productsAndServices || 'sua oferta principal'}.`, priority: 'high', completed: false },
      ],
    },
    {
      week: 4,
      tasks: [
        { task: 'Lançar oferta principal', description: `Executar sequência de lançamento para ${input.productsAndServices || 'produto/serviço'}. Stories + post + DM para leads quentes.`, priority: 'high', completed: false },
        { task: 'Analisar resultado do mês', description: 'Comparar com metas. Calcular CAC, taxa de conversão, crescimento de seguidores.', priority: 'high', completed: false },
        { task: 'Planejar próximo mês', description: 'Gerar nova estratégia com os dados coletados. Refinar ICP com base nos clientes reais.', priority: 'medium', completed: false },
      ],
    },
  ];
}
