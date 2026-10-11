# Método no motor de geração

Versão 1.0 (proposta) • 11/10/2026 • Autor: Claude Code, para aprovação de Antony
Status: **aguardando aprovação**. Nada deste documento foi implementado, exceto a camada 1
(regras da plataforma), publicada na `call-ai` v11 em 11/10/2026.

## 1. Objetivo

Fazer o motor gerar estratégias fundamentadas no método de Antony (E.A.E. + funil 3A3R),
operacionalizado pela Mentoria de Instagram, em vez de estratégias genéricas bem escritas.
Decisão de Antony em 09/10/2026 (H1: incluir o método no motor) e 10/10/2026 (matriz 5×5).

O usuário do piloto é o empreendedor no próprio negócio, o mesmo público da Mentoria. Por
isso a Mentoria é a camada operacional, e o E.A.E./3A3R é a estrutura de decisão por trás.

## 2. Fontes canônicas

| Camada | Fonte | Uso no motor |
| --- | --- | --- |
| Método | `0.Antony-Pinheiro--minha-empresa/empresa/01-METODO-EAE-BASE.md` (v2.0.1) | Fases E.A.E., funil 3A3R, previsibilidade |
| Operação no Instagram | `mentoria-instagram/template-generico-v2/revisao-rc3/01` a `04-manual.md` | Perfil, funções, ciclo, convites, conversas, leitura de resultados |
| Estratégias por etapa | `empresa/banco-3a3r/09-BANCO-ESTRATEGIAS-3A3R.md` (jul/2026) | Repertório consultável por gargalo |
| Plataforma | `auditoria/muse/` conferido em 10/10/2026 | Regras da Meta (já no motor, v11) |

Regra: o motor não cita fontes nem obras ao usuário e não inventa nada além delas. Quando a
fonte não cobre, o motor trata como hipótese.

## 3. Arquitetura em camadas

1. **Regras da plataforma** (feito, v11): hashtags, convites, engagement bait,
   originalidade, Reels, Stories, segmentos sensíveis, leitura por taxas.
2. **Método** (este documento): diagnóstico de fase E.A.E., gargalo 3A3R, matriz 5×5, ciclo
   de seis peças, perfil, Stories, roteiro, convites, ajuste de rota.
3. **Repertório do banco 3A3R**: versão curada e resumida, em arquivo de dados versionado,
   com só 1 a 2 estratégias injetadas por etapa conforme o gargalo (para não inflar tokens).
4. **Futuro**: princípios extraídos da biblioteca de Antony (skill extratora), uso interno.

O texto do método vai para um arquivo de conhecimento versionado
(`supabase/functions/_shared/knowledge/metodo.ts`), não espalhado no prompt. Cada operação
recebe só os blocos que usa.

## 4. Diagnóstico da fase E.A.E.

O motor classifica o negócio em uma fase, com justificativa ligada ao briefing. Linguagem
para o usuário (sem jargão):

| Fase | Nome para o usuário | Sinais no briefing | Foco da estratégia |
| --- | --- | --- | --- |
| Estruturação | **Organizar a base** | oferta pouco clara, perfil sem caminho de contato, publicação esporádica, sem registro de resultados | frase de oferta, perfil (3 perguntas), caminho de contato, 1 conteúdo de teste, ciclo pequeno |
| Aceleração | **Ganhar ritmo** | base clara, publica com alguma constância, já recebe contatos | ciclo de seis peças, testes de um elemento por vez, conversas e CRM simples |
| Escala | **Ampliar o que funciona** | padrão de resultado observado, capacidade de atender mais | repetir o que funciona, collab, distribuição, mídia paga com critério |

Regras:
- "Estrutura antes de acelerar. Acelerar antes de escalar." Na dúvida, a fase mais baixa.
- Capacidade de atender (`capacityToServe`) limita a fase: sem capacidade, não recomendar
  Escala.
- Sem dados, não inventar fase avançada.

## 5. Gargalo 3A3R

O motor escolhe **uma** etapa prioritária (Mentoria: uma prioridade com evidência), a partir
do obstáculo informado e da linha de base:

| Sinal | Etapa provável | Ênfase das funções |
| --- | --- | --- |
| Pouca audiência nova | Assimilação | Crescimento, com originalidade e busca |
| Audiência nova sem demanda | Aquisição | Autoridade, conexão e clareza da oferta |
| Demanda sem compra | Ativação | Quebra de objeção, oferta, conversa no Direct |
| Compra sem continuidade | Retenção / Receita / Recomendação | pós-venda, recompra, indicação |

São hipóteses para investigar, não diagnóstico automático (Mentoria, encontro 2). O motor
mostra a hipótese e o que o usuário deve observar para confirmá-la.

## 6. Matriz 5×5

**Linhas: nível de consciência do público** (Schwartz; banco 3A3R, A1.11):

| Código | Nome para o usuário |
| --- | --- |
| unaware | Ainda não percebe o problema |
| problem | Sente o problema |
| solution | Procura soluções |
| offer | Conhece a sua oferta |
| decision | Pronto para decidir |

**Colunas: função da peça** (Mentoria, encontro 2):

| Código | Nome para o usuário |
| --- | --- |
| growth | Crescimento |
| authority | Autoridade |
| engagement | Engajamento e conexão |
| objection | Quebra de objeção |
| sale | **Oferta e venda** (nova) |

25 células, uma ideia semente por célula. Cada ideia passa a ter a ficha da Mentoria:

| Campo | Conteúdo |
| --- | --- |
| `intention` | Descobrir e entender, Confiar, Próximo passo ou Pós-venda |
| `funnelStage` | etapa 3A3R apoiada (não precisa coincidir com a função) |
| `pillar` | território de assunto do negócio |
| `frame` | quadro repetível (ex.: pergunta recebida e resposta demonstrada) |
| `format` | reel, carrossel, imagem, Stories |
| `title`, `angle` | tema da peça e ângulo |
| `ctaType` | nenhum, salvar/enviar, aprofundar, pergunta, Direct/WhatsApp, compra, palavra-chave |
| `cta` | texto do convite |
| `proofNeeded` | só prova real necessária |
| `briefingBasis` | input que sustenta a ideia |

Regras:
- Coluna "Oferta e venda" com oferta explícita, condições reais e caminho de compra; sem
  escassez ou urgência inventadas.
- Células com encaixe fraco (ex.: oferta para quem ainda não percebe o problema) recebem a
  ideia mais útil possível e a justificativa diz o limite.
- A matriz mostra a ênfase do gargalo (seção 5) e da fase (seção 4).

## 7. Calendário: ciclo de seis peças

- Base: 2 Crescimento, 1 Autoridade, 1 Engajamento e conexão, 1 Quebra de objeção, 1 Oferta
  e venda (Mentoria). Não é regra do Instagram nem frequência obrigatória.
- Volume pelo tempo disponível (`weeklyTime`, `desiredPostingFrequency`). Menos peças bem
  feitas antes de mais peças.
- O gargalo ajusta a proporção (ex.: Ativação ganha uma peça de objeção a mais).
- Convites seguem as regras da camada 1: tipo pela função, palavra-chave no máximo uma a
  cada seis peças e só com automação informada, sem repetir o tipo em peças seguidas.
- Primeira peça do calendário sugerida como conteúdo de teste (Mentoria, encontro 1); para
  contas elegíveis, mencionar Reels de teste.

## 8. Perfil (substitui o módulo "bio" isolado)

- Frase de trabalho da oferta: "ofereço [o quê] para [quem ou situação], com [forma de
  entrega ou condição]".
- Diagnóstico pelas 3 perguntas de quem visita: estou no lugar certo? entendi o que oferece?
  o que faço agora?
- Saída: nome e bio (até 150 caracteres, com palavras de busca e cidade se for local), até 3
  fixados, destaques como "menu de dúvidas", caminho de contato compatível com a forma de
  venda (tabela do encontro 1), links (até 5) e WhatsApp.
- Lembrar o Status da conta antes de tudo (elegibilidade para recomendação).

## 9. Stories

- Só chegam a quem já segue: relacionamento, confiança e conversão.
- Sequência contexto → valor → direção (Mentoria, encontro 3); nem toda sequência precisa
  de oferta; recursos (enquete, caixa de perguntas) só quando a resposta orienta algo útil.
- Mantém a mecânica atual (0 a 15 por dia, até 35 na primeira semana).

## 10. Roteiros

- Estruturas: dúvida → resposta → exemplo → convite; situação → critério → demonstração →
  próximo passo; opção A → opção B → quando cada uma faz sentido.
- Estruturas internas por formato (falando para a câmera, narrado, tela dividida, react com
  análise, tutorial; carrossel passo a passo, comparação, pergunta e resposta, história).
- Checklist de qualidade da Mentoria aplicado pelo modelo antes de responder e exposto ao
  usuário: a abertura identifica o assunto? cumpre o que prometeu? o exemplo ajuda? o convite
  é adequado? texto, contraste, áudio e legenda permitem acompanhar?
- Demonstração identificada como demonstração; nunca caso fictício apresentado como real.

## 11. Conversas e oportunidades

- Respostas ao Direct seguem o roteiro do encontro 3: retomar o motivo, perguntar só o que
  muda a orientação, conferir adequação, apresentar condições reais, combinar avanço ou
  encerramento.
- Lead qualificado só com necessidade compatível, possibilidade de atendimento e interesse
  em avaliar o próximo passo.

## 12. Ajuste de rota (retenção do produto)

- Feedback no formato Executei → Observei → Uma hipótese é → Vou testar.
- Árvore de decisão do encontro 4 orienta a próxima estratégia (pouca execução, interesse
  sem contato, contatos adequados sem compra etc.).
- Comparação justa: mesma intenção, tempo parecido no ar, taxas por alcance; vazio diferente
  de zero; base zero não vira percentual.
- Renovação mensal = novo ciclo com base no que foi executado e observado.

## 13. Monetização

- Ideias e plano ligados às etapas Receita e Recomendação do 3A3R e ao banco (R2, R3).
- Sem promoção de consultoria ou mentoria (decisão de 09/10, já publicada).

## 14. Repertório do banco 3A3R

- Arquivo de dados com versão curada: por estratégia, título, quando usar, táticas, esforço,
  velocidade e se serve a pequeno negócio no Instagram. Estratégias de outros canais ou de
  empresa grande ficam fora ou marcadas.
- Seleção por gargalo e fase: 1 a 2 estratégias da etapa prioritária entram no prompt das
  etapas ICP, matriz e plano de ação.
- Curadoria inicial proposta por Claude e aprovada por Antony; o banco segue "vivo" e o
  arquivo é regerado quando ele mudar.

## 15. Mudanças técnicas do lote 2

| Área | Mudança | Impacto |
| --- | --- | --- |
| Briefing | campos novos: "tem resposta automática no Direct? o que entrega?", "segmento regulado?" (saúde, estética, finanças), "fase percebida" opcional | frontend + backend juntos |
| Backend | `knowledge/metodo.ts`, `knowledge/banco-3a3r.ts`; prompts por operação; schema da matriz 5×5 e ficha da ideia; diagnóstico de fase e gargalo na etapa ICP | contrato muda: subir com o frontend |
| Frontend | matriz com 5 colunas e nomes leigos; ficha da ideia; fase e gargalo visíveis; checklist do roteiro | build e deploy na Vercel |
| Custo | matriz +25% de saída; prompts maiores | medir na homologação; manter 20 créditos por estratégia até medir |
| Tempo | etapa final maior pode encostar no limite de ~150 s da função | separar a matriz em etapa própria se necessário |
| Testes | schema 5×5, ficha, fase/gargalo, convites, compatibilidade de estratégias salvas 5×4 | estratégias antigas continuam abrindo |

Compatibilidade: estratégias salvas com matriz 5×4 continuam legíveis (coluna nova vazia).

## 16. Avaliação

- Antes x depois: gerar com os mesmos 2 briefings no motor v11 (antes) e no lote 2 (depois).
- Avaliação cega por Antony com a rubrica da Mentoria e a pergunta "isto é o meu método?".
- Medir custo, tokens e tempo por etapa nos dois modelos ativos.

## 17. Fora do escopo

Multi-negócio por conta, geração de imagem e vídeo, publicação automática, acesso à conta do
Instagram, conhecimento da biblioteca, seletor de profundidade (registrados no PDR).

## 18. Decisões pendentes de Antony

1. Nomes leigos das linhas e colunas da matriz (tabelas da seção 6).
2. Mostrar a fase E.A.E. ao usuário com os nomes "Organizar a base / Ganhar ritmo / Ampliar o
   que funciona"?
3. Banco 3A3R: aprovar a curadoria inicial antes de entrar no motor (Claude prepara).
4. Separar a matriz em etapa própria, se a medição mostrar risco de tempo limite.
