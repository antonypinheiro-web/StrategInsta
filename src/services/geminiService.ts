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

  return `**Perfil do Cliente Ideal para ${input.niche}**

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
- **Dores Profundas:** ${input.audience.split(',')[0] || 'Falta de tempo para organizar a vida'}, ${input.audience.split(',')[1] || 'dificuldade em encontrar informações confiáveis'}.
- **Desejos Mais Profundos:** ${input.goals.split(',')[0] || 'Melhorar qualidade de vida'}, ${input.goals.split(',')[1] || 'otimizar tempo e recursos'}.

**3. Objetivos e Desejos**
- Melhorar qualidade de vida
- Otimizar tempo e recursos
- Sentir-se parte de uma comunidade
- Alcançar objetivos pessoais relacionados a ${input.niche.toLowerCase()}

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

  return `**Estratégias de Monetização para ${input.niche}**

**Opção 1: Produtos Digitais**
- Curso online sobre ${input.niche.toLowerCase()}
- E-books e guias práticos
- Templates e ferramentas
- Webinars e workshops
- *Considerando seus produtos/serviços: ${input.productsAndServices || 'Nenhum produto/serviço específico mencionado.'}*

**Opção 2: Serviços de Consultoria**
- Mentoria 1:1
- Consultoria estratégica
- Análise e auditoria
- Planos personalizados

**Opção 3: Afiliações e Parcerias**
- Produtos relacionados ao nicho
- Ferramentas e softwares
- Livros e cursos de terceiros
- Parcerias com outras marcas

**Opção 4: Comunidade Premium**
- Membership site
- Grupo VIP no Telegram/Discord
- Acesso exclusivo a conteúdos
- Eventos e networking`;
};

export const generateInstagramBio = async (
  input: UserInput,
  strategy: Partial<GeneratedStrategy>,
  refinementPrompt?: string
): Promise<string> => {
  await delay(1500);
  
  // Conceitualmente, a IA usaria os novos campos aqui:
  // - input.brandVoice: para adaptar o tom da bio.
  // - input.productsAndServices: para incluir chamadas para ação específicas.
  // - input.goals: para focar a bio nos objetivos do usuário.
  // - input.funnelFocus: para otimizar a bio para o topo, meio ou fundo de funil.

  return `**Opções de Bio para ${input.username}**

**Opção 1: Profissional e Direta (Tom: ${input.brandVoice || 'Padrão'})**
🎯 Especialista em ${input.niche}
💡 Ajudo você a ${input.goals.toLowerCase()}
📚 Conteúdo exclusivo ↓
🔗 Link na bio para [seu produto principal: ${input.productsAndServices.split(';')[0] || 'seu melhor recurso'}]

**Opção 2: Pessoal e Conectiva (Tom: ${input.brandVoice || 'Padrão'})**
Oi, eu sou [seu nome]! 👋
🌟 Apaixonada por ${input.niche.toLowerCase()}
💬 Aqui você encontra dicas práticas
📩 DM aberta para trocar ideias
🎁 Freebie no link da bio

**Opção 3: Baseada em Resultados (Tom: ${input.brandVoice || 'Padrão'})**
✨ ${input.niche} que transforma vidas
🏆 +[X] pessoas impactadas
📖 Método comprovado em [área específica]
🔥 Stories com bastidores
⬇️ Comece aqui`;
};

export const generateWeeklyStoriesStrategy = async (
  input: UserInput,
  refinementPrompt?: string
): Promise<StoriesStrategyItem[]> => {
  await delay(2000);
  
  // Conceitualmente, a IA usaria os novos campos aqui:
  // - input.brandVoice: para sugerir o estilo dos stories.
  // - input.contentPillars: para gerar ideias de stories alinhadas aos pilares.
  // - input.desiredPostingFrequency: para ajustar a quantidade de stories por dia/semana.
  // - input.instagramProficiencyLevel: para sugerir dicas mais básicas ou avançadas.

  return [
    {
      dayOfWeek: "Segunda-feira",
      objective: "Motivação e Planejamento",
      contentType: "Inspiracional + Dica",
      example: "Frase motivacional + dica rápida sobre planejamento semanal",
      tips: `Use sticker de enquete para engajar. (Tom: ${input.brandVoice || 'Padrão'})`
    },
    {
      dayOfWeek: "Terça-feira",
      objective: "Educação e Valor",
      contentType: "Tutorial/Dica",
      example: "Tutorial rápido relacionado ao seu nicho",
      tips: `Salve nos destaques para referência futura. (Pilar: ${input.contentPillars.split(',')[0] || 'Educação'})`
    },
    {
      dayOfWeek: "Quarta-feira",
      objective: "Bastidores e Conexão",
      contentType: "Pessoal/Bastidores",
      example: "Mostre seu processo de trabalho ou rotina",
      tips: `Seja autêntica, pessoas conectam com humanidade. (Tom: ${input.brandVoice || 'Padrão'})`
    },
    {
      dayOfWeek: "Quinta-feira",
      objective: "Engajamento e Comunidade",
      contentType: "Pergunta/Enquete",
      example: "Faça uma pergunta relacionada ao seu nicho",
      tips: `Responda todos os comentários para aumentar engajamento. (Foco: ${input.funnelFocus})`
    },
    {
      dayOfWeek: "Sexta-feira",
      objective: "Resultados e Prova Social",
      contentType: "Depoimento/Resultado",
      example: "Compartilhe resultado de cliente ou seu próprio",
      tips: `Sempre peça permissão antes de compartilhar. (Produto: ${input.productsAndServices.split(';')[0] || 'Seu serviço'})`
    },
    {
      dayOfWeek: "Sábado",
      objective: "Inspiração e Lifestyle",
      contentType: "Pessoal/Inspiração",
      example: "Conte uma história pessoal inspiradora",
      tips: `Conecte com os valores da sua marca. (Tom: ${input.brandVoice || 'Padrão'})`
    },
    {
      dayOfWeek: "Domingo",
      objective: "Reflexão e Preparação",
      contentType: "Reflexão/Preview",
      example: "Reflexão da semana + preview do que vem",
      tips: `Crie expectativa para a próxima semana. (Frequência: ${input.desiredPostingFrequency})`
    }
  ];
};

export const generateContentTable = async (input: UserInput): Promise<ContentTableData> => {
  await delay(3000);
  
  // Conceitualmente, a IA usaria os novos campos aqui:
  // - input.funnelFocus: para priorizar tipos de conteúdo em cada funil.
  // - input.contentPillars: para sugerir tópicos dentro dos pilares.
  // - input.existingContentInsights: para focar no que já funciona.
  // - input.competitorsAndInspirations: para identificar formatos de sucesso.
  // - input.desiredPostingFrequency: para ajustar a frequência sugerida.

  return {
    topOfFunnel: [
      {
        type: "Carrossel Educativo",
        description: `Dicas básicas sobre o nicho (${input.contentPillars.split(',')[0] || 'Pilar 1'})`,
        example: `5 erros comuns em ${input.niche.toLowerCase()}`,
        frequency: "2x/semana"
      },
      {
        type: "Mitos vs Verdades",
        description: `Desmistificar conceitos do nicho (${input.contentPillars.split(',')[1] || 'Pilar 2'})`,
        example: `Mito: [conceito falso] | Verdade: [conceito correto]`,
        frequency: "1x/semana"
      }
    ],
    middleOfFunnel: [
      {
        type: "Tutorial Detalhado",
        description: `Passo a passo prático (${input.contentPillars.split(',')[0] || 'Pilar 1'})`,
        example: `Como fazer [processo] em 7 passos`,
        frequency: "2x/semana"
      },
      {
        type: "Comparação de Métodos",
        description: `Análise comparativa de abordagens (${input.contentPillars.split(',')[2] || 'Pilar 3'})`,
        example: `Método A vs Método B: qual escolher?`,
        frequency: "1x/semana"
      }
    ],
    bottomOfFunnel: [
      {
        type: "Case de Sucesso",
        description: `Histórias de transformação (${input.productsAndServices.split(';')[0] || 'Seu produto'})`,
        example: `Como [cliente] conseguiu [resultado]`,
        frequency: "1x/semana"
      },
      {
        type: "Chamada para Ação",
        description: `Convite direto para produto/serviço (${input.goals})`,
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
  const baseHashtags = [`#${input.niche.toLowerCase()}`, '#dica', '#motivação', '#estratégia'];

  // Conceitualmente, a IA usaria os novos campos aqui:
  // - input.desiredPostingFrequency: para ajustar a densidade do calendário.
  // - input.contentPillars: para variar os tópicos.
  // - input.brandVoice: para o estilo das legendas.
  // - input.instagramProficiencyLevel: para ajustar a complexidade das sugestões.

  for (let day = 1; day <= 30; day++) {
    const weekdayIndex = (day - 1) % 7;
    const currentPillar = contentPillars[day % contentPillars.length] || input.niche.toLowerCase();
    
    calendar.push({
      day,
      weekday: weekdays[weekdayIndex],
      contentType: day % 3 === 0 ? "Carrossel" : day % 5 === 0 ? "Vídeo" : "Imagem",
      topic: `Tópico do dia ${day} sobre ${currentPillar}`,
      caption: `Legenda engajante para o dia ${day} sobre ${currentPillar}. Esta é uma prévia do conteúdo que seria gerado com base na sua estratégia personalizada e no seu tom de voz (${input.brandVoice || 'padrão'}).`,
      hashtags: [...baseHashtags, `#${currentPillar.replace(/\s/g, '')}`],
      stories: [`Story 1 para dia ${day} (${currentPillar})`, `Story 2 para dia ${day} (${input.funnelFocus})`]
    });
  }
  
  return calendar;
};

export const generateActionPlan = async (
  input: UserInput,
  strategy: Partial<GeneratedStrategy>
): Promise<ActionPlanItem[]> => {
  await delay(2000);
  
  // Conceitualmente, a IA usaria os novos campos aqui:
  // - input.instagramProficiencyLevel: para adaptar as tarefas ao nível do usuário.
  // - input.availableResources: para ajustar a quantidade e complexidade das tarefas.
  // - input.goals: para priorizar tarefas que levam aos objetivos.
  // - input.funnelFocus: para incluir tarefas específicas do funil.

  const baseTasks = [
    {
      task: "Otimizar Bio do Instagram",
      description: `Implementar uma das bios sugeridas na estratégia, focando em ${input.goals}.`,
      priority: "high" as 'high' | 'medium' | 'low'
    },
    {
      task: "Criar Destaques",
      description: "Organizar stories em destaques temáticos para facilitar a navegação.",
      priority: "medium" as 'high' | 'medium' | 'low'
    },
    {
      task: "Planejar Primeiros Posts",
      description: `Criar conteúdo para os primeiros 7 dias, alinhado com seus pilares (${input.contentPillars.split(',')[0] || 'Pilar Principal'}).`,
      priority: "high" as 'high' | 'medium' | 'low'
    },
    {
      task: "Implementar Estratégia de Stories",
      description: `Seguir o calendário de stories planejado, com foco em ${input.funnelFocus}.`,
      priority: "high" as 'high' | 'medium' | 'low'
    },
    {
      task: "Engajar com Comunidade",
      description: "Responder comentários e interagir com outros perfis para construir comunidade.",
      priority: "medium" as 'high' | 'medium' | 'low'
    },
    {
      task: "Analisar Métricas",
      description: "Verificar alcance e engajamento dos primeiros posts para ajustar a estratégia.",
      priority: "low" as 'high' | 'medium' | 'low'
    }
  ];

  // Adaptação das tarefas com base no nível de proficiência
  let adaptedTasks = [...baseTasks];
  if (input.instagramProficiencyLevel === 'iniciante') {
    adaptedTasks = adaptedTasks.filter(task => task.priority !== 'low'); // Focar no essencial
    adaptedTasks.push({
      task: "Estudar o Básico do Instagram",
      description: "Dedicar tempo para entender as funcionalidades essenciais da plataforma.",
      priority: "high"
    });
  } else if (input.instagramProficiencyLevel === 'avancado') {
    adaptedTasks.push({
      task: "Testar Novos Formatos de Conteúdo",
      description: "Experimentar Reels, Collabs ou Guias para diversificar e alcançar novas audiências.",
      priority: "medium"
    });
    adaptedTasks.push({
      task: "Otimizar Hashtags e SEO",
      description: "Pesquisar e implementar estratégias avançadas de hashtags e palavras-chave para maior descoberta.",
      priority: "high"
    });
  }

  return [
    {
      week: 1,
      tasks: adaptedTasks.slice(0, 3)
    },
    {
      week: 2,
      tasks: adaptedTasks.slice(3, 6)
    }
  ];
};