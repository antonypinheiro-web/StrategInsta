/**
 * StrategInsta — Multi-AI Engine
 * Primary: Google Gemini 2.5 Flash
 * Fallback: OpenAI GPT-4o mini
 *
 * Roteamento inteligente: tenta Gemini primeiro.
 * Em caso de falha (rate limit, indisponibilidade), faz fallback para OpenAI.
 */

import { GoogleGenerativeAI } from '@google/generative-ai';
import OpenAI from 'openai';
import type {
  UserInput,
  GeneratedStrategy,
  ContentTableData,
  CalendarDay,
  ActionPlanItem,
  StoriesStrategyItem,
} from '../types';

// ─── Clientes ────────────────────────────────────────────────────────────────

const geminiClient = new GoogleGenerativeAI(
  import.meta.env.VITE_GEMINI_API_KEY ?? ''
);

const openaiClient = new OpenAI({
  apiKey: import.meta.env.VITE_OPENAI_API_KEY ?? '',
  dangerouslyAllowBrowser: true,
});

const GEMINI_MODEL = import.meta.env.VITE_GEMINI_MODEL ?? 'gemini-2.5-flash';
const OPENAI_MODEL = import.meta.env.VITE_OPENAI_MODEL ?? 'gpt-4o-mini';

// ─── Roteador principal ───────────────────────────────────────────────────────

async function callAI(systemPrompt: string, userPrompt: string): Promise<string> {
  // Tenta Gemini primeiro
  try {
    const model = geminiClient.getGenerativeModel({
      model: GEMINI_MODEL,
      systemInstruction: systemPrompt,
    });
    const result = await model.generateContent(userPrompt);
    const text = result.response.text();
    if (!text || text.trim().length < 50) throw new Error('Resposta Gemini insuficiente');
    return text;
  } catch (geminiError) {
    console.warn('[StrategInsta] Gemini indisponível, usando OpenAI como fallback.', geminiError);

    // Fallback OpenAI
    const completion = await openaiClient.chat.completions.create({
      model: OPENAI_MODEL,
      messages: [
        { role: 'system', content: systemPrompt },
        { role: 'user', content: userPrompt },
      ],
      temperature: 0.75,
    });
    const text = completion.choices[0]?.message?.content ?? '';
    if (!text || text.trim().length < 50) throw new Error('Resposta OpenAI insuficiente');
    return text;
  }
}

// ─── Contexto base do usuário ─────────────────────────────────────────────────

function buildUserContext(input: UserInput): string {
  return `
CONTEXTO DO NEGÓCIO:
- Nicho/Segmento: ${input.niche}
- Público-alvo: ${input.audience}
- Username no Instagram: @${input.username}
- Objetivos principais: ${input.goals}
- Tom de voz da marca: ${input.brandVoice || 'profissional e próximo'}
- Produtos/Serviços: ${input.productsAndServices || 'não especificado'}
- Pilares de conteúdo: ${input.contentPillars || 'não especificado'}
- Foco do funil: ${input.funnelFocus}
- Frequência de postagem: ${input.desiredPostingFrequency}
- Nível de experiência no Instagram: ${input.instagramProficiencyLevel}
- Concorrentes/Referências: ${input.competitorsAndInspirations || 'não especificado'}
- Insights de conteúdo anterior: ${input.existingContentInsights || 'não especificado'}
- Recursos disponíveis: ${input.availableResources || 'não especificado'}
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

Crie um Perfil do Cliente Ideal completo e detalhado, incluindo:

## 1. Quem é esta pessoa
- Nome fictício e dados demográficos (idade, gênero, localização, renda, ocupação)
- Situação de vida atual
- Relação com o Instagram e consumo de conteúdo digital

## 2. Dores e Frustrações
- 3 dores profundas relacionadas ao nicho "${input.niche}"
- O que a mantém acordada à noite
- O que ela já tentou sem sucesso

## 3. Desejos e Aspirações
- O que ela realmente quer alcançar
- Como seria a vida dela após a transformação
- Qual resultado rápido ela busca primeiro

## 4. Comportamento no Instagram
- Tipo de conteúdo que consome e salva
- Horários de maior engajamento
- O que a faz seguir uma conta
- O que a faz deixar de seguir

## 5. Gatilhos de Decisão
- O que a convence a comprar ou contratar
- Principais objeções
- Linguagem e palavras que ressoam com ela

## 6. Como se Comunicar com ela
- Tom e abordagem ideal baseados em "${input.brandVoice || 'profissional e próximo'}"
- Formatos de conteúdo mais eficientes para este perfil
- CTAs que funcionam com este público
`;

  return callAI(system, user);
};

// ─── 2. Ideias de Monetização ─────────────────────────────────────────────────

export const generateMonetizationIdeas = async (
  input: UserInput,
  refinementPrompt?: string
): Promise<string> => {
  const system = `${BASE_SYSTEM}

Sua tarefa é criar um plano de monetização estratégico e realista para o Instagram, baseado no negócio e momento atual do usuário.`;

  const user = `
${buildUserContext(input)}
${refinementPrompt ? `\nSOLICITAÇÃO DE REFINAMENTO: ${refinementPrompt}` : ''}

Crie um plano de monetização completo e personalizado com:

## 1. Análise do Potencial de Monetização
- Avaliação do nicho "${input.niche}" no contexto do Instagram
- Oportunidades imediatas vs. de médio prazo
- Formato mais adequado ao foco de funil: ${input.funnelFocus}

## 2. Fontes de Receita Recomendadas
Para cada fonte, inclua: o que é, como implementar no Instagram, ticket médio estimado e tempo para ver resultado.

### Fonte 1: [principal, mais rápida de implementar]
### Fonte 2: [complementar, média dificuldade]
### Fonte 3: [escalável, médio/longo prazo]

## 3. Estratégia de Lançamento pelo Instagram
- Sequência de conteúdo para apresentar cada oferta
- Tipo de post mais eficiente por fonte de receita
- Como usar stories para converter

## 4. Pricing e Posicionamento
- Sugestão de faixa de preço para cada produto/serviço baseado em "${input.productsAndServices || 'soluções a definir'}"
- Como comunicar valor antes de apresentar preço
- Estratégias de upsell e cross-sell

## 5. Metas Realistas de Receita
- Projeção de 30, 60 e 90 dias
- Quantos seguidores/leads são necessários por meta
- Taxa de conversão realista para o nicho
`;

  return callAI(system, user);
};

// ─── 3. Bio do Instagram ──────────────────────────────────────────────────────

export const generateInstagramBio = async (
  input: UserInput,
  _strategy: Partial<GeneratedStrategy>,
  refinementPrompt?: string
): Promise<string> => {
  const system = `${BASE_SYSTEM}

Sua tarefa é criar opções de bio para Instagram que sejam magnéticas, estratégicas e otimizadas para conversão.`;

  const user = `
${buildUserContext(input)}
${refinementPrompt ? `\nSOLICITAÇÃO DE REFINAMENTO: ${refinementPrompt}` : ''}

Crie 4 opções de bio para o Instagram de @${input.username}, cada uma com uma abordagem diferente.

Para cada opção, entregue:
- O texto completo da bio (máximo 150 caracteres por linha, 5 linhas)
- Emojis estratégicos quando aplicável
- Linha de CTA com sugestão do que colocar no link
- Breve explicação da estratégia usada nessa opção

---

### Opção 1: Autoridade + Transformação
[Foco em mostrar expertise e o resultado que entrega]

### Opção 2: Direto ao Ponto + CTA Forte
[Foco em conversão imediata]

### Opção 3: Conexão Humana + Comunidade
[Foco em criar identificação e pertencimento]

### Opção 4: Storytelling Compacto
[Foco em contar uma micro-história que gera curiosidade]

---

## Dicas de Otimização do Perfil
- Nome (campo de nome, não @username): sugestão de palavras-chave para ranqueamento
- Foto de perfil: orientação baseada no posicionamento
- Link na bio: estrutura recomendada (Linktree, página de captura, etc.)
`;

  return callAI(system, user);
};

// ─── 4. Estratégia de Stories ─────────────────────────────────────────────────

export const generateWeeklyStoriesStrategy = async (
  input: UserInput,
  refinementPrompt?: string
): Promise<StoriesStrategyItem[]> => {
  const system = `${BASE_SYSTEM}

Sua tarefa é criar uma estratégia de stories para 7 dias (segunda a domingo), altamente personalizada e pronta para ser executada.
Responda EXCLUSIVAMENTE em formato JSON válido, sem markdown, sem texto fora do JSON.`;

  const user = `
${buildUserContext(input)}
${refinementPrompt ? `\nSOLICITAÇÃO DE REFINAMENTO: ${refinementPrompt}` : ''}

Crie uma estratégia completa de stories para 7 dias. Responda APENAS com um array JSON válido no seguinte formato:

[
  {
    "dayOfWeek": "Segunda-feira",
    "objective": "objetivo estratégico do dia (ex: gerar engajamento, aquecer audiência, converter)",
    "contentType": "tipo de story (ex: Bastidores, Tutorial Rápido, Enquete, Depoimento)",
    "example": "descrição detalhada e específica do que postar, usando os dados do negócio. Mínimo 3 frames descritos.",
    "tips": "dicas práticas de execução: recursos do Instagram a usar, melhor horário, tom de linguagem, hashtags se aplicável"
  }
]

Crie exatamente 7 objetos, um para cada dia da semana (segunda a domingo).
Use os pilares de conteúdo: ${input.contentPillars || 'educação, bastidores, prova social'}.
Adapte ao foco de funil: ${input.funnelFocus}.
Tom de voz: ${input.brandVoice || 'profissional e próximo'}.
`;

  const raw = await callAI(system, user);

  try {
    // Extrai o JSON mesmo que venha com texto ao redor
    const match = raw.match(/\[[\s\S]*\]/);
    if (!match) throw new Error('JSON não encontrado na resposta');
    return JSON.parse(match[0]) as StoriesStrategyItem[];
  } catch {
    // Fallback estruturado se o JSON vier malformado
    return parseStoriesFallback(raw, input);
  }
};

function parseStoriesFallback(raw: string, input: UserInput): StoriesStrategyItem[] {
  const days = ['Segunda-feira', 'Terça-feira', 'Quarta-feira', 'Quinta-feira', 'Sexta-feira', 'Sábado', 'Domingo'];
  return days.map((day) => ({
    dayOfWeek: day,
    objective: 'Engajamento e conexão com a audiência',
    contentType: 'Conteúdo estratégico',
    example: `Story personalizado para ${input.niche} — ${day}. Resposta bruta disponível nos logs.`,
    tips: raw.substring(0, 200),
  }));
}

// ─── 5. Matriz de Conteúdo ────────────────────────────────────────────────────

export const generateContentTable = async (input: UserInput): Promise<ContentTableData> => {
  const system = `${BASE_SYSTEM}

Sua tarefa é criar uma Matriz de Conteúdo estratégica para Instagram, organizada por etapa do funil de vendas.
Responda EXCLUSIVAMENTE em formato JSON válido, sem markdown, sem texto fora do JSON.`;

  const user = `
${buildUserContext(input)}

Crie uma matriz de conteúdo completa com pelo menos 3 ideias por etapa do funil.
Responda APENAS com o seguinte JSON:

{
  "topOfFunnel": [
    {
      "type": "formato do post (ex: Reel, Carrossel, Foto, Vídeo)",
      "description": "descrição estratégica do conteúdo e por que funciona para atração",
      "example": "título/ideia específica usando dados do nicho ${input.niche}",
      "frequency": "sugestão de frequência (ex: 2x/semana)"
    }
  ],
  "middleOfFunnel": [...mesma estrutura, foco em relacionamento e autoridade...],
  "bottomOfFunnel": [...mesma estrutura, foco em conversão e vendas...]
}

Use os pilares: ${input.contentPillars || 'educação, bastidores, prova social, entretenimento'}.
Produtos/serviços a promover: ${input.productsAndServices || 'a definir'}.
`;

  const raw = await callAI(system, user);

  try {
    const match = raw.match(/\{[\s\S]*\}/);
    if (!match) throw new Error('JSON não encontrado');
    return JSON.parse(match[0]) as ContentTableData;
  } catch {
    return buildContentTableFallback(input);
  }
};

function buildContentTableFallback(input: UserInput): ContentTableData {
  const n = input.niche;
  return {
    topOfFunnel: [
      { type: 'Reel Educativo', description: 'Dica rápida e valiosa sobre o nicho', example: `3 erros comuns em ${n} que impedem seu crescimento`, frequency: '2x/semana' },
      { type: 'Carrossel', description: 'Conteúdo educativo aprofundado', example: `Guia completo para iniciantes em ${n}`, frequency: '1x/semana' },
    ],
    middleOfFunnel: [
      { type: 'Bastidores', description: 'Humaniza a marca e cria conexão', example: `Como funciona meu processo de trabalho em ${n}`, frequency: '1x/semana' },
      { type: 'Tutorial', description: 'Demonstra expertise e gera salvamentos', example: `Passo a passo para [resultado] em ${n}`, frequency: '1x/semana' },
    ],
    bottomOfFunnel: [
      { type: 'Depoimento', description: 'Prova social que quebra objeções', example: `Resultado real de cliente em ${n}`, frequency: '1x/semana' },
      { type: 'Oferta Direta', description: 'CTA claro para produto/serviço', example: `Vagas abertas: ${input.productsAndServices || 'meu programa'}`, frequency: '1x/semana' },
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
    "contentType": "formato do post",
    "topic": "tópico específico e detalhado do post, usando dados do negócio",
    "caption": "sugestão de legenda completa e personalizada, pronta para usar (com emojis e CTA)",
    "hashtags": ["#hashtag1", "#hashtag2", "#hashtag3", "#hashtag4", "#hashtag5"],
    "stories": ["descrição do story 1 para complementar o post", "descrição do story 2"]
  }
]

Regras:
- 30 objetos, dias 1 a 30
- Distribua os tipos: Reels (40%), Carrosséis (30%), Fotos/Imagens (20%), outros (10%)
- Alterne entre topo, meio e fundo de funil conforme o foco: ${input.funnelFocus}
- Frequência de postagem: ${input.desiredPostingFrequency}
- Use os pilares: ${input.contentPillars || 'educação, bastidores, prova social'}
- Hashtags: misture nicho (#${input.niche.replace(/\s/g, '')}), tamanho médio e pequeno
- Legendas em tom: ${input.brandVoice || 'profissional e próximo'}
`;

  const raw = await callAI(system, user);

  try {
    const match = raw.match(/\[[\s\S]*\]/);
    if (!match) throw new Error('JSON não encontrado');
    return JSON.parse(match[0]) as CalendarDay[];
  } catch {
    return buildCalendarFallback(input);
  }
};

function buildCalendarFallback(input: UserInput): CalendarDay[] {
  const weekdays = ['Segunda-feira', 'Terça-feira', 'Quarta-feira', 'Quinta-feira', 'Sexta-feira', 'Sábado', 'Domingo'];
  const types = ['Reel Educativo', 'Carrossel', 'Foto com Pergunta', 'Reel Bastidores', 'Carrossel de Dicas', 'Reel Inspiracional', 'CTA Direto'];
  return Array.from({ length: 30 }, (_, i) => ({
    day: i + 1,
    weekday: weekdays[i % 7],
    contentType: types[i % 7],
    topic: `Conteúdo sobre ${input.niche} — Dia ${i + 1}`,
    caption: `Conteúdo estratégico para ${input.niche}. #${input.niche.replace(/\s/g, '')}`,
    hashtags: [`#${input.niche.replace(/\s/g, '')}`, '#Instagram', '#Marketing'],
    stories: ['Story de apoio ao post'],
  }));
}

// ─── 7. Plano de Ação ─────────────────────────────────────────────────────────

export const generateActionPlan = async (
  input: UserInput,
  _strategy: Partial<GeneratedStrategy>
): Promise<ActionPlanItem[]> => {
  const system = `${BASE_SYSTEM}

Sua tarefa é criar um plano de ação semanal detalhado, adaptado ao nível de experiência e recursos disponíveis do usuário.
Responda EXCLUSIVAMENTE em formato JSON válido, sem markdown, sem texto fora do JSON.`;

  const user = `
${buildUserContext(input)}

Crie um plano de ação para 4 semanas. Responda APENAS com um array JSON:

[
  {
    "week": 1,
    "tasks": [
      {
        "task": "nome curto e claro da tarefa",
        "description": "descrição detalhada de como executar esta tarefa, específica para o negócio ${input.niche}",
        "priority": "high | medium | low",
        "completed": false
      }
    ]
  }
]

Regras:
- 4 objetos (semanas 1 a 4)
- Semana 1: fundação e configuração (4-5 tarefas high priority)
- Semana 2: criação de conteúdo e engajamento (4-5 tarefas)
- Semana 3: análise, otimização e primeiros resultados (4-5 tarefas)
- Semana 4: escala e monetização (4-5 tarefas)
- Adapte ao nível: ${input.instagramProficiencyLevel} (iniciante = mais básico, avançado = mais sofisticado)
- Considere recursos disponíveis: ${input.availableResources || 'tempo moderado'}
- Inclua tarefas específicas para promover: ${input.productsAndServices || 'produtos/serviços a definir'}
- Inclua métricas a acompanhar em cada semana
`;

  const raw = await callAI(system, user);

  try {
    const match = raw.match(/\[[\s\S]*\]/);
    if (!match) throw new Error('JSON não encontrado');
    return JSON.parse(match[0]) as ActionPlanItem[];
  } catch {
    return buildActionPlanFallback(input);
  }
};

function buildActionPlanFallback(input: UserInput): ActionPlanItem[] {
  return [
    {
      week: 1,
      tasks: [
        { task: 'Otimizar perfil do Instagram', description: `Atualizar bio, foto e destaques para o nicho ${input.niche}`, priority: 'high', completed: false },
        { task: 'Criar primeiros 7 posts', description: 'Usar o calendário editorial gerado como guia', priority: 'high', completed: false },
        { task: 'Implementar estratégia de stories', description: 'Seguir o plano de stories gerado diariamente', priority: 'high', completed: false },
      ],
    },
    {
      week: 2,
      tasks: [
        { task: 'Analisar métricas iniciais', description: 'Verificar alcance, engajamento e crescimento de seguidores', priority: 'high', completed: false },
        { task: 'Engajar com comunidade', description: 'Responder comentários e DMs diariamente', priority: 'medium', completed: false },
      ],
    },
    {
      week: 3,
      tasks: [
        { task: 'Ajustar estratégia com base em dados', description: 'Refinar o que funciona, pausar o que não funciona', priority: 'high', completed: false },
        { task: 'Iniciar captação de leads', description: `Criar um lead magnet relacionado a ${input.niche}`, priority: 'medium', completed: false },
      ],
    },
    {
      week: 4,
      tasks: [
        { task: 'Lançar primeira oferta', description: `Promover ${input.productsAndServices || 'seu produto/serviço'} para a audiência aquecida`, priority: 'high', completed: false },
        { task: 'Planejar próximo mês', description: 'Usar os insights do primeiro mês para o calendário seguinte', priority: 'medium', completed: false },
      ],
    },
  ];
}
