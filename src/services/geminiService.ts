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

**3. Dores e Desafios**
- Falta de tempo para organizar ${input.niche.toLowerCase()}
- Dificuldade em encontrar informações confiáveis
- Busca por resultados práticos e aplicáveis

**4. Objetivos e Desejos**
- Melhorar qualidade de vida
- Otimizar tempo e recursos
- Sentir-se parte de uma comunidade
- Alcançar objetivos pessoais relacionados a ${input.niche.toLowerCase()}

**5. Onde Estão Online**
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
  
  return `**Estratégias de Monetização para ${input.niche}**

**Opção 1: Produtos Digitais**
- Curso online sobre ${input.niche.toLowerCase()}
- E-books e guias práticos
- Templates e ferramentas
- Webinars e workshops

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
  
  return `**Opções de Bio para ${input.username}**

**Opção 1: Profissional e Direta**
🎯 Especialista em ${input.niche}
💡 Ajudo você a ${input.goals.toLowerCase()}
📚 Conteúdo exclusivo ↓
🔗 Link na bio para [seu produto principal]

**Opção 2: Pessoal e Conectiva**
Oi, eu sou [seu nome]! 👋
🌟 Apaixonada por ${input.niche.toLowerCase()}
💬 Aqui você encontra dicas práticas
📩 DM aberta para trocar ideias
🎁 Freebie no link da bio

**Opção 3: Baseada em Resultados**
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
  
  return [
    {
      dayOfWeek: "Segunda-feira",
      objective: "Motivação e Planejamento",
      contentType: "Inspiracional + Dica",
      example: "Frase motivacional + dica rápida sobre planejamento semanal",
      tips: "Use sticker de enquete para engajar"
    },
    {
      dayOfWeek: "Terça-feira",
      objective: "Educação e Valor",
      contentType: "Tutorial/Dica",
      example: "Tutorial rápido relacionado ao seu nicho",
      tips: "Salve nos destaques para referência futura"
    },
    {
      dayOfWeek: "Quarta-feira",
      objective: "Bastidores e Conexão",
      contentType: "Pessoal/Bastidores",
      example: "Mostre seu processo de trabalho ou rotina",
      tips: "Seja autêntica, pessoas conectam com humanidade"
    },
    {
      dayOfWeek: "Quinta-feira",
      objective: "Engajamento e Comunidade",
      contentType: "Pergunta/Enquete",
      example: "Faça uma pergunta relacionada ao seu nicho",
      tips: "Responda todos os comentários para aumentar engajamento"
    },
    {
      dayOfWeek: "Sexta-feira",
      objective: "Resultados e Prova Social",
      contentType: "Depoimento/Resultado",
      example: "Compartilhe resultado de cliente ou seu próprio",
      tips: "Sempre peça permissão antes de compartilhar"
    },
    {
      dayOfWeek: "Sábado",
      objective: "Inspiração e Lifestyle",
      contentType: "Pessoal/Inspiração",
      example: "Conte uma história pessoal inspiradora",
      tips: "Conecte com os valores da sua marca"
    },
    {
      dayOfWeek: "Domingo",
      objective: "Reflexão e Preparação",
      contentType: "Reflexão/Preview",
      example: "Reflexão da semana + preview do que vem",
      tips: "Crie expectativa para a próxima semana"
    }
  ];
};

export const generateContentTable = async (input: UserInput): Promise<ContentTableData> => {
  await delay(3000);
  
  return {
    topOfFunnel: [
      {
        type: "Carrossel Educativo",
        description: "Dicas básicas sobre o nicho",
        example: "5 erros comuns em [nicho]",
        frequency: "2x/semana"
      },
      {
        type: "Mitos vs Verdades",
        description: "Desmistificar conceitos do nicho",
        example: "Mito: [conceito falso] | Verdade: [conceito correto]",
        frequency: "1x/semana"
      }
    ],
    middleOfFunnel: [
      {
        type: "Tutorial Detalhado",
        description: "Passo a passo prático",
        example: "Como fazer [processo] em 7 passos",
        frequency: "2x/semana"
      },
      {
        type: "Comparação de Métodos",
        description: "Análise comparativa de abordagens",
        example: "Método A vs Método B: qual escolher?",
        frequency: "1x/semana"
      }
    ],
    bottomOfFunnel: [
      {
        type: "Case de Sucesso",
        description: "Histórias de transformação",
        example: "Como [cliente] conseguiu [resultado]",
        frequency: "1x/semana"
      },
      {
        type: "Chamada para Ação",
        description: "Convite direto para produto/serviço",
        example: "Vagas abertas para [programa/consultoria]",
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
  
  for (let day = 1; day <= 30; day++) {
    const weekdayIndex = (day - 1) % 7;
    calendar.push({
      day,
      weekday: weekdays[weekdayIndex],
      contentType: day % 3 === 0 ? "Carrossel" : day % 5 === 0 ? "Vídeo" : "Imagem",
      topic: `Tópico do dia ${day} sobre ${input.niche.toLowerCase()}`,
      caption: `Legenda engajante para o dia ${day} sobre ${input.niche.toLowerCase()}. Esta é uma prévia do conteúdo que seria gerado com base na sua estratégia personalizada.`,
      hashtags: [`#${input.niche.toLowerCase()}`, '#dica', '#motivação', '#estratégia'],
      stories: [`Story 1 para dia ${day}`, `Story 2 para dia ${day}`]
    });
  }
  
  return calendar;
};

export const generateActionPlan = async (
  input: UserInput,
  strategy: Partial<GeneratedStrategy>
): Promise<ActionPlanItem[]> => {
  await delay(2000);
  
  return [
    {
      week: 1,
      tasks: [
        {
          task: "Otimizar Bio do Instagram",
          description: "Implementar uma das bios sugeridas na estratégia",
          priority: "high"
        },
        {
          task: "Criar Destaques",
          description: "Organizar stories em destaques temáticos",
          priority: "medium"
        },
        {
          task: "Planejar Primeiros Posts",
          description: "Criar conteúdo para os primeiros 7 dias",
          priority: "high"
        }
      ]
    },
    {
      week: 2,
      tasks: [
        {
          task: "Implementar Estratégia de Stories",
          description: "Seguir o calendário de stories planejado",
          priority: "high"
        },
        {
          task: "Engajar com Comunidade",
          description: "Responder comentários e interagir com outros perfis",
          priority: "medium"
        },
        {
          task: "Analisar Métricas",
          description: "Verificar alcance e engajamento dos primeiros posts",
          priority: "low"
        }
      ]
    }
  ];
};