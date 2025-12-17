// Mock Gemini Service for development
// In production, this would integrate with the actual Google Gemini API

import type { UserInput, GeneratedStrategy, ContentTableData, CalendarDay, ActionPlanItem, StoriesStrategyItem } from '../types';

// Simulate API delay
const delay = (ms: number) => new Promise(resolve => setTimeout(resolve, ms));

export const generateIdealCustomerProfile = async (
  input: UserInput, 
  refinementPrompt?: string
): Promise<string> => {
  await delay(2000);
  
  // Conceitualmente, a IA usaria os novos campos aqui para criar um perfil mais detalhado:
  // - input.niche, input.audience, input.goals: já usados.
  // - input.brandVoice: influenciaria o tom da descrição do perfil.
  // - input.competitorsAndInspirations: ajudaria a identificar lacunas ou oportunidades no ICP.
  // - input.existingContentInsights: poderia refinar as dores e desejos com base no que já ressoou.
  // - input.instagramProficiencyLevel: poderia ajustar a complexidade da linguagem.

  return `**Perfil do Cliente Ideal para o Nicho de ${input.niche}**

**1. Demografia**
- Idade: 25-40 anos
- Gênero: Principalmente mulheres (70%)
- Localização: Grandes centros urbanos
- Renda: Classe média a alta

**2. Características Comportamentais**
- Ativo nas redes sociais, especialmente Instagram
- Busca por qualidade e autenticidade
- Valoriza experiências e aprendizado
- Influenciado por recomendações de pessoas de confiança
- Dores Profundas: ${input.audience.split(',')[0] || 'Falta de tempo para organizar a vida'}, ${input.audience.split(',')[1] || 'dificuldade em encontrar informações confiáveis'}.
- Desejos Mais Profundos: ${input.goals.split(',')[0] || 'Melhorar qualidade de vida'}, ${input.goals.split(',')[1] || 'otimizar tempo e recursos'}.

**3. Objetivos e Desejos**
- Melhorar qualidade de vida
- Otimizar tempo e recursos
- Sentir-se parte de uma comunidade
- Alcançar objetivos pessoais relacionados ao nicho.

**4. Onde Estão Online**
- Instagram (principal)
- YouTube para conteúdo educativo
- Pinterest para inspiração
- LinkedIn para networking profissional`;
};

export const generateMonetizationIdeas = async (
  input: UserInput,
  refinementPrompt?: string
): Promise<string> => {
  await delay(2000);
  
  // Conceitualmente, a IA usaria os novos campos aqui:
  // - input.productsAndServices: para sugerir monetização diretamente ligada ao que o usuário já oferece.
  // - input.goals: para alinhar as ideias de monetização com os objetivos principais.
  // - input.funnelFocus: para priorizar ideias de monetização que se encaixam no foco do funil.
  // - input.contentPillars: para criar produtos/serviços relacionados aos temas principais.

  return `**Estratégias de Monetização para o Nicho de ${input.niche}**

### Opção 1: Produtos Digitais
- Curso online sobre um tópico específico do seu nicho.
- E-books e guias práticos com soluções para dores da audiência.
- Templates e ferramentas digitais para otimização de processos.
- Webinars e workshops interativos.

### Opção 2: Serviços de Consultoria
- Mentoria individualizada (1:1) para resultados personalizados.
- Consultoria estratégica para negócios ou desenvolvimento pessoal.
- Análise e auditoria de perfis ou projetos.
- Planos personalizados de acompanhamento.

### Opção 3: Afiliações e Parcerias
- Promoção de produtos e serviços complementares ao seu nicho.
- Parcerias com ferramentas e softwares relevantes.
- Indicação de livros e cursos de terceiros.
- Colaborações com outras marcas para campanhas conjuntas.

### Opção 4: Comunidade Premium
- Criação de um membership site com conteúdo exclusivo.
- Grupo VIP no Telegram/Discord para interação e suporte.
- Acesso antecipado a lançamentos e eventos.
- Eventos e networking exclusivos para membros.`;
};

export const generateInstagramBio = async (
  input: UserInput,
  strategy: Partial<GeneratedStrategy>,
  refinementPrompt?: string
): Promise<string> => {
  await delay(1500);
  
  // A IA interpreta os inputs para criar bios estratégicas e estruturadas.
  // O tom de voz, produtos/serviços e objetivos são usados para moldar as opções.

  return `**Opções de Bio para Instagram**

### Opção 1: Foco em Solução e Chamada para Ação
Transformo [DOR PRINCIPAL DO PÚBLICO] em [BENEFÍCIO PRINCIPAL].
Especialista em ${input.niche}.
Clique para [AÇÃO DESEJADA, ex: Conhecer meu curso / Baixar e-book] 👇
[Link na Bio]

---

### Opção 2: Autoridade e Conexão
Ajudo [PÚBLICO-ALVO] a alcançar [OBJETIVO PRINCIPAL] com estratégias de ${input.niche}.
Conteúdo que inspira, educa e transforma. ✨
Vamos juntos nessa jornada!

---

### Opção 3: Direta e Otimizada para Vendas
Seu guia para [RESULTADO ESPECÍFICO] no universo de ${input.niche}.
Criadora de [PRODUTO/SERVIÇO PRINCIPAL].
Garanta sua vaga/acesso agora! 🚀
[Link para Vendas]

---

### Opção 4: Pessoal e Engajadora
Olá! Sou [SEU NOME] e minha paixão é ${input.niche}.
Compartilho dicas práticas e inspirações para uma vida mais [QUALIDADE DE VIDA].
Conecte-se comigo nos Stories! 💬`;
};

export const generateWeeklyStoriesStrategy = async (
  input: UserInput,
  refinementPrompt?: string
): Promise<StoriesStrategyItem[]> => {
  await delay(2000);
  
  // A IA interpreta os inputs para criar uma estratégia de stories dinâmica e engajadora.
  // O tom de voz, pilares de conteúdo, frequência e nível de proficiência são considerados.

  return [
    {
      dayOfWeek: "Segunda-feira",
      objective: "Motivação e Planejamento Semanal",
      contentType: "Inspiracional + Dica Rápida",
      example: "Frase motivacional sobre recomeços + dica de como organizar a semana para o nicho.",
      tips: `Use enquetes para perguntar sobre os desafios da semana do público. Mantenha um tom ${input.brandVoice || 'inspirador'}.`
    },
    {
      dayOfWeek: "Terça-feira",
      objective: "Educação e Valor Profundo",
      contentType: "Mini-Tutorial ou 'Como Fazer'",
      example: "Demonstração rápida de uma técnica ou ferramenta relevante para o nicho.",
      tips: `Crie um senso de urgência para aplicar a dica. Use o pilar de conteúdo principal: ${input.contentPillars.split(',')[0] || 'Educação'}.`
    },
    {
      dayOfWeek: "Quarta-feira",
      objective: "Bastidores e Conexão Pessoal",
      contentType: "Dia a Dia / Processo de Trabalho",
      example: "Mostre um pouco da sua rotina, desafios ou processo de criação de conteúdo/produto.",
      tips: `Seja autêntico e vulnerável. Peça perguntas na caixinha para interação. Tom ${input.brandVoice || 'amigável'}.`
    },
    {
      dayOfWeek: "Quinta-feira",
      objective: "Engajamento e Construção de Comunidade",
      contentType: "Perguntas e Respostas / Quiz",
      example: "Abra uma caixinha de perguntas sobre um tópico do nicho ou faça um quiz divertido.",
      tips: `Responda as perguntas de forma estratégica, gerando mais valor. Foco em ${input.funnelFocus || 'conexão'}.`
    },
    {
      dayOfWeek: "Sexta-feira",
      objective: "Prova Social e Resultados",
      contentType: "Depoimento de Cliente / Case de Sucesso",
      example: "Compartilhe um print de feedback positivo ou um breve case de sucesso de um cliente.",
      tips: `Sempre peça permissão. Destaque o problema resolvido e o benefício. Relacione com ${input.productsAndServices.split(';')[0] || 'seu serviço'}.`
    },
    {
      dayOfWeek: "Sábado",
      objective: "Inspiração e Lifestyle",
      contentType: "Momento Relax / Reflexão",
      example: "Compartilhe um livro, um lugar, ou uma reflexão pessoal que se conecta com os valores do nicho.",
      tips: `Use músicas e visuais que transmitam a emoção desejada. Mantenha o tom ${input.brandVoice || 'inspirador'}.`
    },
    {
      dayOfWeek: "Domingo",
      objective: "Preparação e Chamada para Ação",
      contentType: "Preview da Semana / CTA",
      example: "Dê um spoiler do conteúdo da próxima semana ou faça uma chamada para ação para um recurso gratuito.",
      tips: `Crie expectativa. Use o link nos stories para direcionar tráfego. Frequência de postagem: ${input.desiredPostingFrequency}.`
    }
  ];
};

export const generateContentTable = async (input: UserInput): Promise<ContentTableData> => {
  await delay(3000);
  
  // Esta função será completamente reescrita no próximo passo para a nova estrutura da Matriz de Conteúdo.
  // Por enquanto, manteremos uma estrutura básica para evitar erros.
  return {
    topOfFunnel: [
      {
        type: "Carrossel Educativo",
        description: `Dicas básicas sobre o nicho`,
        example: `5 erros comuns em ${input.niche.toLowerCase()}`,
        frequency: "2x/semana"
      },
      {
        type: "Mitos vs Verdades",
        description: `Desmistificar conceitos do nicho`,
        example: `Mito: [conceito falso] | Verdade: [conceito correto]`,
        frequency: "1x/semana"
      }
    ],
    middleOfFunnel: [
      {
        type: "Tutorial Detalhado",
        description: `Passo a passo prático`,
        example: `Como fazer [processo] em 7 passos`,
        frequency: "2x/semana"
      },
      {
        type: "Comparação de Métodos",
        description: `Análise comparativa de abordagens`,
        example: `Método A vs Método B: qual escolher?`,
        frequency: "1x/semana"
      }
    ],
    bottomOfFunnel: [
      {
        type: "Case de Sucesso",
        description: `Histórias de transformação`,
        example: `Como [cliente] conseguiu [resultado]`,
        frequency: "1x/semana"
      },
      {
        type: "Chamada para Ação",
        description: `Convite direto para produto/serviço`,
        example: `Vagas abertas para [programa/consultoria]`,
        frequency: "1x/semana"
      }
    ]
  };
};

export const generateEditorialCalendar = async (
  input: UserInput,
  strategy: Partial<GeneratedStrategy>
): Promise<CalendarDay[]> => {
  await delay(4000);
  
  const calendar: CalendarDay[] = [];
  const weekdays = ['Segunda', 'Terça', 'Quarta', 'Quinta', 'Sexta', 'Sábado', 'Domingo'];
  const contentPillars = input.contentPillars.split(',').map(p => p.trim()).filter(Boolean);
  const baseHashtags = [`#${input.niche.toLowerCase().replace(/\s/g, '')}`, '#dica', '#motivação', '#estratégia'];

  // A IA interpreta os inputs para criar um calendário editorial coeso e estratégico.
  // Frequência, pilares, tom de voz e nível de proficiência são usados para gerar os detalhes.

  for (let day = 1; day <= 30; day++) {
    const weekdayIndex = (day - 1) % 7;
    const currentPillar = contentPillars[day % contentPillars.length] || input.niche.toLowerCase();
    
    calendar.push({
      day,
      weekday: weekdays[weekdayIndex],
      contentType: day % 3 === 0 ? "Carrossel" : day % 5 === 0 ? "Vídeo" : "Imagem",
      topic: `Tópico estratégico sobre ${currentPillar} para o dia ${day}.`,
      caption: `Legenda engajante e alinhada ao seu tom de voz (${input.brandVoice || 'padrão'}) para o conteúdo de hoje. Foco em ${input.funnelFocus || 'equilíbrio'}.`,
      hashtags: [...baseHashtags, `#${currentPillar.replace(/\s/g, '')}`],
      stories: [`Story do dia ${day}: Enquete sobre ${currentPillar}`, `Story do dia ${day}: Dica rápida sobre ${input.funnelFocus}`]
    });
  }
  
  return calendar;
};

export const generateActionPlan = async (
  input: UserInput,
  strategy: Partial<GeneratedStrategy>
): Promise<ActionPlanItem[]> => {
  await delay(2000);
  
  // A IA interpreta os inputs para criar um plano de ação específico e adaptado ao nível do usuário.
  // Nível de proficiência, recursos disponíveis, objetivos e foco do funil são cruciais.

  const baseTasks = [
    {
      task: "Otimizar Bio do Instagram",
      description: `Implementar uma das bios sugeridas na estratégia, focando em ${input.goals.toLowerCase()} e no seu tom de voz.`,
      priority: "high" as 'high' | 'medium' | 'low'
    },
    {
      task: "Criar Destaques Essenciais",
      description: "Organizar stories em destaques temáticos como 'Sobre Mim', 'Serviços', 'Dicas Rápidas' para facilitar a navegação.",
      priority: "medium" as 'high' | 'medium' | 'low'
    },
    {
      task: "Planejar e Criar os Primeiros 7 Posts",
      description: `Desenvolver conteúdo para a primeira semana, alinhado com os pilares de conteúdo (${input.contentPillars.split(',')[0] || 'principal'}) e o foco do funil (${input.funnelFocus}).`,
      priority: "high" as 'high' | 'medium' | 'low'
    },
    {
      task: "Implementar Estratégia de Stories Diária",
      description: `Seguir o calendário de stories planejado, com foco em engajamento e construção de relacionamento.`,
      priority: "high" as 'high' | 'medium' | 'low'
    },
    {
      task: "Engajar Ativamente com a Comunidade",
      description: "Responder comentários, interagir com DMs e visitar perfis de seguidores e potenciais clientes para construir comunidade.",
      priority: "medium" as 'high' | 'medium' | 'low'
    },
    {
      task: "Analisar Métricas Básicas",
      description: "Verificar alcance, engajamento e salvamentos dos primeiros posts para identificar o que ressoa com o público.",
      priority: "low" as 'high' | 'medium' | 'low'
    }
  ];

  let adaptedTasks = [...baseTasks];

  if (input.instagramProficiencyLevel === 'iniciante') {
    adaptedTasks = adaptedTasks.filter(task => task.priority !== 'low'); // Focar no essencial
    adaptedTasks.unshift({
      task: "Configurar Perfil Profissional no Instagram",
      description: "Mudar para conta profissional, preencher informações de contato e categoria.",
      priority: "high"
    });
    adaptedTasks.push({
      task: "Estudar Formatos de Conteúdo Essenciais",
      description: "Dedicar tempo para entender como criar Carrosséis, Reels e Imagens estáticas eficazes.",
      priority: "medium"
    });
  } else if (input.instagramProficiencyLevel === 'avancado') {
    adaptedTasks.push({
      task: "Testar Novos Formatos e Tendências",
      description: "Experimentar Reels com áudios em alta, Collabs com outros criadores ou Guias temáticos para diversificar e alcançar novas audiências.",
      priority: "medium"
    });
    adaptedTasks.push({
      task: "Otimizar Estratégia de Hashtags e SEO",
      description: "Realizar pesquisa aprofundada de hashtags e palavras-chave para otimizar legendas e aumentar a descoberta orgânica.",
      priority: "high"
    });
    adaptedTasks.push({
      task: "Analisar Funil de Vendas no Instagram",
      description: "Mapear a jornada do cliente no Instagram e otimizar pontos de conversão, como links na bio e CTAs nos stories.",
      priority: "high"
    });
  }

  // Ajustar tarefas com base nos recursos disponíveis
  if (input.availableResources.toLowerCase().includes('pouco tempo')) {
    adaptedTasks = adaptedTasks.filter(task => task.priority === 'high'); // Priorizar apenas tarefas de alta prioridade
    adaptedTasks.push({
      task: "Reutilizar Conteúdo Existente",
      description: "Transformar posts antigos de sucesso em novos formatos (ex: blog post em carrossel, vídeo longo em série de stories).",
      priority: "medium"
    });
  }

  return [
    {
      week: 1,
      tasks: adaptedTasks.slice(0, Math.ceil(adaptedTasks.length / 2))
    },
    {
      week: 2,
      tasks: adaptedTasks.slice(Math.ceil(adaptedTasks.length / 2))
    }
  ];
};