// Mock Gemini Service for development
// In production, this would integrate with the actual Google Gemini API

import type { UserInput, GeneratedStrategy, ContentTableData, CalendarDay, ActionPlanItem, StoriesStrategyItem } from '../types';

// Simulate API delay
const delay = (ms: number) => new Promise(resolve => setTimeout(resolve, ms));

// Helper para capitalizar a primeira letra
const capitalize = (s: string) => s.charAt(0).toUpperCase() + s.slice(1);

export const generateIdealCustomerProfile = async (
  input: UserInput, 
  refinementPrompt?: string
): Promise<string> => {
  await delay(2000);
  
  const niche = capitalize(input.niche);
  const audience = input.audience;
  const goals = input.goals;
  const brandVoice = input.brandVoice || 'profissional e amigável';
  const existingContentInsights = input.existingContentInsights || 'sem insights específicos';

  let profileDescription = `**Perfil do Cliente Ideal para o Nicho de ${niche}**

Este perfil foi construído para maximizar seus objetivos de "${goals}" e ressoar com seu público-alvo: "${audience}".

**1. Demografia e Contexto**
- Idade: Varia conforme o público, mas geralmente entre 25-45 anos.
- Gênero: Adaptado ao seu público, por exemplo, "Principalmente mulheres" ou "Misto".
- Localização: Foco em áreas urbanas ou com acesso digital.
- Renda: Média a alta, dependendo do valor percebido dos seus produtos/serviços.
- Ocupação: Profissionais, empreendedores ou indivíduos buscando desenvolvimento pessoal/profissional em ${niche}.

**2. Características Comportamentais e Psicográficas**
- Interesses: Busca ativa por soluções, aprendizado e melhoria em áreas relacionadas a ${niche}.
- Consumo de Conteúdo: Engaja-se com tutoriais, dicas práticas, histórias de sucesso e conteúdo inspirador.
- Dores Profundas: Baseado em "${audience}", pode incluir:
  - ${audience.split(',')[0] || 'Falta de clareza sobre como alcançar seus objetivos.'}
  - ${audience.split(',')[1] || 'Dificuldade em encontrar informações confiáveis e aplicáveis.'}
  - ${audience.split(',')[2] || 'Sentimento de estagnação ou sobrecarga.'}
- Desejos Mais Profundos: Alinhado com "${goals}", pode incluir:
  - ${goals.split(',')[0] || 'Alcançar resultados tangíveis e duradouros.'}
  - ${goals.split(',')[1] || 'Sentir-se capacitado e confiante.'}
  - ${goals.split(',')[2] || 'Fazer parte de uma comunidade de apoio.'}
- Insights de Conteúdo: Considerando "${existingContentInsights}", o público reage bem a [tipo de conteúdo que funcionou] e busca [tipo de solução].

**3. Onde Estão Online**
- Instagram: Principal plataforma para descoberta, engajamento e consumo de conteúdo visual.
- YouTube: Para tutoriais mais aprofundados e conteúdo de formato longo.
- Blogs/Artigos: Para leitura e pesquisa detalhada.
- Grupos e Comunidades Online: Para interação e busca de suporte.

**4. Tom de Voz Preferido**
- O cliente ideal responde melhor a um tom de voz que seja ${brandVoice}, transmitindo confiança, empatia e expertise.

${refinementPrompt ? `\n**Refinamento Adicional:**\nCom base na sua solicitação de refinamento ("${refinementPrompt}"), o perfil foi ajustado para enfatizar [detalhe do ajuste].` : ''}
`;
  return profileDescription;
};

export const generateMonetizationIdeas = async (
  input: UserInput,
  refinementPrompt?: string
): Promise<string> => {
  await delay(2000);
  
  const niche = capitalize(input.niche);
  const productsAndServices = input.productsAndServices || 'sem produtos/serviços específicos mencionados';
  const goals = input.goals;
  const funnelFocus = input.funnelFocus;

  let ideas = `**Estratégias de Monetização para o Nicho de ${niche}**

Estas ideias são projetadas para alinhar-se com seus objetivos de "${goals}" e seu foco de funil em "${funnelFocus}".

### Opção 1: Produtos Digitais de Alto Valor
- **Curso Online Completo:** Um programa aprofundado sobre um aspecto chave do seu nicho, como "Domine a [Habilidade Específica] em 30 Dias".
- **E-books e Guias Premium:** Conteúdo detalhado que resolve uma dor específica, por exemplo, "O Guia Definitivo para [Desafio Comum]".
- **Templates e Ferramentas Exclusivas:** Recursos práticos que economizam tempo e esforço para seu público, como "Pack de Templates para [Tipo de Conteúdo]".
- **Webinars e Workshops Pagos:** Sessões interativas ao vivo ou gravadas com foco em resultados práticos.

### Opção 2: Serviços de Consultoria e Mentoria Personalizada
- **Mentoria Individual (1:1):** Ofereça acompanhamento personalizado para clientes que buscam resultados acelerados em ${niche}.
- **Consultoria Estratégica:** Ajude negócios ou indivíduos a desenvolverem planos de ação específicos, por exemplo, "Consultoria de Estratégia de Conteúdo para Instagram".
- **Programas de Acompanhamento em Grupo:** Uma opção mais acessível que a mentoria individual, mas com o benefício da comunidade.

### Opção 3: Assinaturas e Comunidades Exclusivas
- **Clube de Membros:** Crie uma área de membros com conteúdo exclusivo, aulas mensais, Q&A e networking.
- **Newsletter Premium:** Ofereça uma versão paga da sua newsletter com insights mais aprofundados e acesso antecipado a conteúdos.
- **Comunidade VIP:** Um grupo fechado (Telegram, Discord) para interação direta, suporte e conteúdo bônus.

### Opção 4: Afiliações e Parcerias Estratégicas
- **Marketing de Afiliados:** Promova produtos ou serviços complementares de outras marcas que você confia, ganhando comissão.
- **Parcerias com Marcas:** Colabore com empresas relevantes para seu nicho em campanhas patrocinadas ou criação de conteúdo conjunto.
- **Venda de Produtos Físicos (se aplicável):** Se você tiver produtos físicos relacionados a ${niche}, explore a venda direta ou através de e-commerce.

${refinementPrompt ? `\n**Refinamento Adicional:**\nCom base na sua solicitação de refinamento ("${refinementPrompt}"), as ideias foram ajustadas para focar em [detalhe do ajuste].` : ''}
`;
  return ideas;
};

export const generateInstagramBio = async (
  input: UserInput,
  strategy: Partial<GeneratedStrategy>,
  refinementPrompt?: string
): Promise<string> => {
  await delay(1500);
  
  const niche = capitalize(input.niche);
  const audience = input.audience.split(',')[0] || 'seu público';
  const goals = input.goals.split(',')[0] || 'seus objetivos';
  const brandVoice = input.brandVoice || 'inspirador e direto';
  const productsAndServices = input.productsAndServices.split(';')[0] || 'soluções inovadoras';
  const funnelFocus = input.funnelFocus;

  let bioOptions = `**Opções de Bio para Instagram - Tom ${brandVoice}**

Estas opções foram criadas para atrair "${audience}" e impulsionar "${goals}", com foco em "${funnelFocus}".

### Opção 1: Foco em Transformação e CTA Direto
Transformo ${audience} de [DOR ESPECÍFICA] em [BENEFÍCIO PRINCIPAL].
Especialista em ${niche}.
Clique para [AÇÃO DESEJADA, ex: Conhecer meu curso / Baixar e-book] 👇
[Link na Bio]

---

### Opção 2: Autoridade e Conexão com Valor
Ajudo ${audience} a alcançar ${goals} com estratégias comprovadas em ${niche}.
Conteúdo que inspira, educa e gera resultados. ✨
Vamos juntos nessa jornada de sucesso!

---

### Opção 3: Otimizada para Vendas e Soluções
Seu guia para [RESULTADO ESPECÍFICO] no universo de ${niche}.
Criadora de ${productsAndServices}.
Garanta sua vaga/acesso agora e transforme sua realidade! 🚀
[Link para Vendas]

---

### Opção 4: Pessoal, Engajadora e com Chamada para Comunidade
Olá! Sou [SEU NOME] e minha paixão é ${niche}.
Compartilho dicas práticas e inspirações para uma vida mais [QUALIDADE DE VIDA DESEJADA PELO PÚBLICO].
Conecte-se comigo nos Stories e faça parte da nossa comunidade! 💬

${refinementPrompt ? `\n**Refinamento Adicional:**\nCom base na sua solicitação de refinamento ("${refinementPrompt}"), as bios foram ajustadas para [detalhe do ajuste].` : ''}
`;
  return bioOptions;
};

export const generateWeeklyStoriesStrategy = async (
  input: UserInput,
  refinementPrompt?: string
): Promise<StoriesStrategyItem[]> => {
  await delay(2000);
  
  const niche = capitalize(input.niche);
  const brandVoice = input.brandVoice || 'inspirador e direto';
  const contentPillars = input.contentPillars.split(',').map(p => p.trim()).filter(Boolean);
  const funnelFocus = input.funnelFocus;
  const primaryPillar = contentPillars[0] || 'seu tema principal';
  const secondaryPillar = contentPillars[1] || 'um tópico relevante';

  return [
    {
      dayOfWeek: "Segunda-feira",
      objective: "Motivação e Planejamento Semanal",
      contentType: "Inspiracional + Dica Rápida",
      example: `Comece a semana com energia! Frase motivacional sobre ${primaryPillar} e 3 dicas rápidas para organizar a semana no nicho de ${niche}.`,
      tips: `Use enquetes para perguntar sobre os desafios da semana do público. Mantenha um tom ${brandVoice}. Foco em Topo de Funil (Atração).`
    },
    {
      dayOfWeek: "Terça-feira",
      objective: "Educação e Valor Profundo",
      contentType: "Mini-Tutorial ou 'Como Fazer'",
      example: `Demonstração rápida de uma técnica ou ferramenta essencial para ${secondaryPillar} em ${niche}. Ex: "Como criar [elemento] em 3 passos".`,
      tips: `Crie um senso de urgência para aplicar a dica. Use o pilar de conteúdo: ${primaryPillar}. Foco em Meio de Funil (Relacionamento/Autoridade).`
    },
    {
      dayOfWeek: "Quarta-feira",
      objective: "Bastidores e Conexão Pessoal",
      contentType: "Dia a Dia / Processo de Trabalho",
      example: `Mostre um pouco da sua rotina de criação de conteúdo ou um "dia na vida" relacionado a ${niche}. Ex: "Por trás das câmeras: como planejo meus posts".`,
      tips: `Seja autêntico e vulnerável. Peça perguntas na caixinha para interação. Tom ${brandVoice}. Foco em Meio de Funil (Relacionamento).`
    },
    {
      dayOfWeek: "Quinta-feira",
      objective: "Engajamento e Construção de Comunidade",
      contentType: "Perguntas e Respostas / Quiz",
      example: `Abra uma caixinha de perguntas sobre um tópico polêmico ou comum em ${niche}. Faça um quiz divertido sobre ${secondaryPillar}.`,
      tips: `Responda as perguntas de forma estratégica, gerando mais valor e autoridade. Foco em Meio de Funil (Autoridade/Relacionamento).`
    },
    {
      dayOfWeek: "Sexta-feira",
      objective: "Prova Social e Resultados",
      contentType: "Depoimento de Cliente / Case de Sucesso",
      example: `Compartilhe um print de feedback positivo ou um breve case de sucesso de um cliente que usou seus ${input.productsAndServices.split(';')[0] || 'serviços/produtos'}.`,
      tips: `Sempre peça permissão. Destaque o problema resolvido e o benefício. Foco em Fundo de Funil (Quebra de Objeção/Vendas).`
    },
    {
      dayOfWeek: "Sábado",
      objective: "Inspiração e Lifestyle",
      contentType: "Momento Relax / Reflexão",
      example: `Compartilhe um livro, um lugar, ou uma reflexão pessoal que se conecta com os valores de ${niche}. Ex: "Minha leitura do fim de semana para [crescimento pessoal]".`,
      tips: `Use músicas e visuais que transmitam a emoção desejada. Mantenha o tom ${brandVoice}. Foco em Topo de Funil (Atração/Inspiração).`
    },
    {
      dayOfWeek: "Domingo",
      objective: "Preparação e Chamada para Ação",
      contentType: "Preview da Semana / CTA",
      example: `Dê um spoiler do conteúdo da próxima semana ou faça uma chamada para ação para um recurso gratuito relacionado a ${primaryPillar}.`,
      tips: `Crie expectativa. Use o link nos stories para direcionar tráfego. Foco em Fundo de Funil (Vendas/Conversão).`
    },
    ...(refinementPrompt ? [{
      dayOfWeek: "Refinamento",
      objective: "Ajuste da Estratégia",
      contentType: "Feedback Aplicado",
      example: `A estratégia de stories foi ajustada com base na sua solicitação: "${refinementPrompt}".`,
      tips: "Verifique os dias específicos que foram modificados para refletir o feedback."
    }] : [])
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
  const weekdays = ['Segunda-feira', 'Terça-feira', 'Quarta-feira', 'Quinta-feira', 'Sexta-feira', 'Sábado', 'Domingo'];
  const contentPillars = input.contentPillars.split(',').map(p => p.trim()).filter(Boolean);
  const niche = capitalize(input.niche);
  const brandVoice = input.brandVoice || 'inspirador e direto';
  const funnelFocus = input.funnelFocus;
  const baseHashtags = [`#${niche.replace(/\s/g, '')}`, `#${niche.toLowerCase().split(' ')[0]}Dicas`, `#Estrategia${niche.replace(/\s/g, '')}`];

  for (let day = 1; day <= 30; day++) {
    const weekdayIndex = (day - 1) % 7;
    const currentPillar = contentPillars[day % contentPillars.length] || 'dicas gerais';
    
    let contentType = "Carrossel";
    let topic = `Explorando ${currentPillar} para o sucesso em ${niche}.`;
    let caption = `Legenda engajante e alinhada ao seu tom de voz ${brandVoice} para o conteúdo de hoje. Foco em ${funnelFocus}.`;
    let stories: string[] = [];

    // Lógica para variar o tipo de conteúdo e tópico com base no dia e foco do funil
    if (day % 7 === 1) { // Segunda-feira: Motivação/Atração
      contentType = "Reel Inspirador";
      topic = `Comece a semana com motivação para ${currentPillar} no seu nicho.`;
      caption = `Nova semana, novas oportunidades! ✨ Descubra como impulsionar seu ${currentPillar} e alcançar seus objetivos em ${niche}. #Motivacao #${niche.replace(/\s/g, '')}Sucesso`;
      stories = [`Enquete: Qual seu maior desafio com ${currentPillar} esta semana?`, `Dica rápida para superar o desafio.`];
    } else if (day % 7 === 2) { // Terça-feira: Educação/Relacionamento
      contentType = "Carrossel Educativo";
      topic = `Guia completo sobre ${currentPillar} para ${niche}.`;
      caption = `Desvende os segredos de ${currentPillar}! 📚 Neste carrossel, te guio passo a passo para dominar este tema em ${niche}. Salve para consultar depois! #${currentPillar.replace(/\s/g, '')} #Dicas${niche.replace(/\s/g, '')}`;
      stories = [`Mini-tutorial: Um passo do carrossel em vídeo.`, `Caixinha de perguntas sobre o tema.`];
    } else if (day % 7 === 3) { // Quarta-feira: Autoridade/Engajamento
      contentType = "Vídeo Curto (Reel/IGTV)";
      topic = `Mitos e verdades sobre ${currentPillar} em ${niche}.`;
      caption = `Será que você acredita em algum desses mitos sobre ${currentPillar}? 🤔 Desmisto tudo neste vídeo rápido! Compartilhe com um amigo! #MitosEVerdades #${niche.replace(/\s/g, '')}Expert`;
      stories = [`Quiz: Teste seus conhecimentos sobre ${currentPillar}.`, `Bastidores: Como pesquiso para desmistificar.`];
    } else if (day % 7 === 4) { // Quinta-feira: Conexão/Relacionamento
      contentType = "Imagem com Pergunta Aberta";
      topic = `Sua experiência com ${currentPillar} em ${niche}.`;
      caption = `Qual foi o maior aprendizado que você teve sobre ${currentPillar} até hoje? Compartilhe sua experiência nos comentários! 👇 Adoro ler vocês! #Comunidade${niche.replace(/\s/g, '')} #Compartilhe`;
      stories = [`Compartilhe sua história: Use o sticker de pergunta.`, `Reaja a algumas respostas dos seguidores.`];
    } else if (day % 7 === 5) { // Sexta-feira: Prova Social/Vendas
      contentType = "Carrossel de Case de Sucesso";
      topic = `Transformação de cliente com ${input.productsAndServices.split(';')[0] || 'seu produto/serviço'}.`;
      caption = `Inspire-se na jornada de [Nome do Cliente]! ✨ Descubra como [ele/ela] alcançou [resultado] com meu ${input.productsAndServices.split(';')[0] || 'produto/serviço'}. Arrasta para o lado e veja a transformação! #CaseDeSucesso #ResultadosReais`;
      stories = [`Depoimento em vídeo do cliente (se disponível).`, `CTA para o produto/serviço.`];
    } else if (day % 7 === 6) { // Sábado: Lifestyle/Inspiração
      contentType = "Foto de Lifestyle";
      topic = `Momento de relaxamento e inspiração em ${niche}.`;
      caption = `Pausa para recarregar as energias! ☕ Como você se desconecta e encontra inspiração para ${niche} no fim de semana? #Lifestyle #Inspiração #FimDeSemana`;
      stories = [`Compartilhe um livro/podcast inspirador.`, `Pergunte sobre os planos do público para o fim de semana.`];
    } else { // Domingo: Preparação/CTA
      contentType = "Reel de Preview";
      topic = `O que esperar da próxima semana em ${niche}.`;
      caption = `Preparados para uma semana incrível? 🔥 Fique de olho nos próximos conteúdos sobre ${currentPillar} e não perca as novidades! #Preview #ProximaSemana #${niche.replace(/\s/g, '')}`;
      stories = [`Spoiler do conteúdo da próxima semana.`, `CTA para um recurso gratuito ou link na bio.`];
    }

    calendar.push({
      day,
      weekday: weekdays[weekdayIndex],
      contentType,
      topic,
      caption,
      hashtags: [...baseHashtags, `#${currentPillar.replace(/\s/g, '')}`],
      stories
    });
  }
  
  return calendar;
};

export const generateActionPlan = async (
  input: UserInput,
  strategy: Partial<GeneratedStrategy>
): Promise<ActionPlanItem[]> => {
  await delay(2000);
  
  const niche = capitalize(input.niche);
  const goals = input.goals;
  const proficiencyLevel = input.instagramProficiencyLevel;
  const availableResources = input.availableResources.toLowerCase();
  const primaryProduct = input.productsAndServices.split(';')[0] || 'seu principal produto/serviço';
  const funnelFocus = input.funnelFocus;

  let adaptedTasks: { task: string; description: string; priority: 'high' | 'medium' | 'low'; }[] = [];

  // Tarefas base, adaptadas ao nível de proficiência e recursos
  if (proficiencyLevel === 'iniciante') {
    adaptedTasks.push(
      {
        task: "Configurar Perfil Profissional no Instagram",
        description: "Mudar para conta profissional, preencher informações de contato, categoria e link na bio com foco em conversão para " + primaryProduct + ".",
        priority: "high"
      },
      {
        task: "Otimizar Bio do Instagram",
        description: `Implementar a Bio sugerida na estratégia que melhor se alinha com seus objetivos de "${goals}" e o tom de voz "${input.brandVoice}".`,
        priority: "high"
      },
      {
        task: "Criar Destaques Essenciais",
        description: "Organizar stories em destaques temáticos como 'Sobre Mim', 'Serviços', 'Dicas Rápidas' para facilitar a navegação e educar o público sobre " + niche + ".",
        priority: "medium"
      },
      {
        task: "Planejar e Criar os Primeiros 7 Posts (Topo de Funil)",
        description: `Desenvolver conteúdo para a primeira semana, focando em atrair novos seguidores e educar sobre ${niche}, conforme as ideias da Matriz de Conteúdo (quando disponível).`,
        priority: "high"
      },
      {
        task: "Implementar Estratégia de Stories Diária (Básica)",
        description: `Seguir o calendário de stories planejado, com foco em engajamento simples e construção de relacionamento inicial.`,
        priority: "medium"
      },
      {
        task: "Engajar Ativamente com a Comunidade",
        description: "Responder comentários, interagir com DMs e visitar perfis de seguidores e potenciais clientes para construir comunidade e entender suas dores.",
        priority: "medium"
      }
    );
  } else if (proficiencyLevel === 'intermediario') {
    adaptedTasks.push(
      {
        task: "Revisar e Otimizar Bio e Destaques",
        description: `Ajustar a Bio e os Destaques com base nos primeiros resultados e no foco de funil "${funnelFocus}", garantindo clareza e CTA.`,
        priority: "high"
      },
      {
        task: "Planejar e Criar 15 Posts (Topo e Meio de Funil)",
        description: `Desenvolver conteúdo para as próximas duas semanas, equilibrando atração e relacionamento, com base nos pilares de conteúdo e nas ideias da Matriz de Conteúdo.`,
        priority: "high"
      },
      {
        task: "Implementar Estratégia de Stories Avançada",
        description: `Utilizar todos os recursos dos stories (enquetes, quizzes, caixas de pergunta, links) para maximizar o engajamento e direcionar tráfego para ${primaryProduct}.`,
        priority: "high"
      },
      {
        task: "Analisar Métricas de Engajamento e Alcance",
        description: "Verificar alcance, engajamento, salvamentos e compartilhamentos dos posts para identificar padrões e otimizar a estratégia.",
        priority: "medium"
      },
      {
        task: "Pesquisar e Testar Novas Hashtags",
        description: "Realizar pesquisa aprofundada de hashtags relevantes para o nicho e testar diferentes conjuntos para aumentar a descoberta orgânica.",
        priority: "medium"
      },
      {
        task: "Interagir com Perfis Estratégicos",
        description: "Engajar com outros criadores, influenciadores e marcas do nicho para construir networking e potenciais parcerias.",
        priority: "low"
      }
    );
  } else if (proficiencyLevel === 'avancado') {
    adaptedTasks.push(
      {
        task: "Otimizar Funil de Vendas no Instagram",
        description: `Mapear a jornada do cliente no Instagram e otimizar pontos de conversão, como links na bio, CTAs nos stories e posts de fundo de funil para ${primaryProduct}.`,
        priority: "high"
      },
      {
        task: "Desenvolver Conteúdo para Lançamentos/Vendas",
        description: `Criar uma sequência estratégica de posts e stories focada em um lançamento de ${primaryProduct} ou campanha de vendas específica.`,
        priority: "high"
      },
      {
        task: "Testar Novos Formatos e Tendências Virais",
        description: "Experimentar Reels com áudios em alta, Collabs com outros criadores ou Guias temáticos para diversificar e alcançar novas audiências e testar o que funciona melhor.",
        priority: "medium"
      },
      {
        task: "Analisar Métricas de Conversão e ROI",
        description: "Monitorar vendas, leads gerados e retorno sobre investimento das ações no Instagram para otimizar a estratégia de monetização.",
        priority: "high"
      },
      {
        task: "Estratégia de Parcerias e Collabs",
        description: "Identificar e abordar potenciais parceiros para colaborações estratégicas que ampliem o alcance e a autoridade no nicho.",
        priority: "medium"
      },
      {
        task: "Criação de Conteúdo Evergreen",
        description: "Desenvolver posts e vídeos que permaneçam relevantes por muito tempo, para atrair tráfego contínuo e construir autoridade a longo prazo.",
        priority: "low"
      }
    );
  }

  // Ajustar tarefas com base nos recursos disponíveis
  if (availableResources.includes('pouco tempo') || availableResources.includes('2-3 horas')) {
    adaptedTasks = adaptedTasks.filter(task => task.priority === 'high' || task.priority === 'medium').slice(0, 5); // Priorizar e limitar
    adaptedTasks.push({
      task: "Reutilizar Conteúdo Existente",
      description: "Transformar posts antigos de sucesso em novos formatos (ex: blog post em carrossel, vídeo longo em série de stories) para otimizar o tempo.",
      priority: "medium"
    });
  } else if (availableResources.includes('um dia inteiro')) {
    // Pode adicionar tarefas mais complexas ou de pesquisa
    adaptedTasks.push({
      task: "Pesquisa de Tendências e Concorrentes",
      description: "Dedicar tempo para analisar o que está em alta no nicho e o que os concorrentes estão fazendo para identificar oportunidades.",
      priority: "low"
    });
  }

  // Dividir em semanas
  const week1Tasks = adaptedTasks.slice(0, Math.ceil(adaptedTasks.length / 2));
  const week2Tasks = adaptedTasks.slice(Math.ceil(adaptedTasks.length / 2));

  return [
    {
      week: 1,
      tasks: week1Tasks
    },
    {
      week: 2,
      tasks: week2Tasks
    }
  ];
};