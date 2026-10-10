# Piloto do StrategInsta para empreendedores

**Revisão 1.1, 10/09/2026. Implementação aprovada por Antony; retomada em 27/09/2026.**

Checkpoint de execução: Antony confirmou “gosto do que trouxe no plano. está
aprovado. Se precisar ajustamos depois”. As propostas deste documento são a base
do piloto local e podem ser ajustadas com os testes. Trechos abaixo que indicam
discussão ou aprovação pendente descrevem o estado anterior a essa confirmação.
Preços comerciais, contratação de serviços e publicação continuam separados.
Andamento e evidências: `docs/stories/PILOT-001-piloto-empreendedores.md`.

Atualização: 10/09/2026. Público confirmado por Antony: empreendedores usando o
app no próprio negócio. Arquivos prioritários confirmados: PDF, DOCX, TXT e imagens.
Este documento distingue implementação local, evidência remota e trabalho pendente.
Não constitui publicação nem aprovação de preços ou contratação de serviços.
Esta revisão é documental: não autoriza implementar o novo escopo antes de
concluir a discussão. Antony informou que já resetou os créditos pelo admin;
não solicitar novamente concessão de créditos. Saldo pós-reset ainda não revalidado.

As perguntas do onboarding, unidades de consumo e ofertas abaixo são propostas
para decisão conjunta, não escolhas já aprovadas. Requisitos adicionais detalhados
nas seções 12 a 17.

## 1. Decisão de escopo

Concluir um piloto acompanhado antes de ampliar a distribuição. A proposta é
começar com 5 a 10 empreendedores de negócios diferentes e medir se conseguem
entender, revisar e executar as recomendações. Esse número é uma proposta de
recrutamento, não uma amostra que comprove demanda ou resultados comerciais.

A prioridade anterior de social medias foi substituída para o primeiro piloto.
Não adicionar gestão de equipes/agências nesta etapa. Não alterar a identidade
original já aprovada. Consultoria estratégica e operação do SaaS têm escopos distintos.

## 2. O que foi feito neste lote

| Área | Entrega local | Evidência / limite |
| --- | --- | --- |
| Conclusão | Correção do UPDATE de uso sem solicitar colunas protegidas; mesma função para Salvar e Pular | Save autenticado concluído; um registro com sete seções; uso passou de 1 para 2 |
| Recuperação | Lista de estratégias da própria conta e reabertura após recarga | Resultado real reaberto; consulta não alterou o consumo |
| Apresentação | Títulos, listas, tabelas e destaques renderizados como componentes seguros | Conteúdo antigo permanece antigo, ainda que melhor formatado |
| ICP | Prompt exige evidências dos inputs e separação de hipóteses | Qualidade do novo prompt ainda requer geração real e revisão |
| Monetização | Prompt passa a pedir potencial e três ideias, sem plano de conteúdo, projeções ou preços inventados | Seleção interativa e plano derivado ainda pendentes |
| Bio | Três opções concisas com limite total de 150 caracteres solicitado | Validação automática da contagem e cópia individual ainda pendentes |
| Contexto final | Matriz, calendário e plano passam a usar as etapas revisadas, em sequência | Testes de dependência, falha e retomada; nova geração real ainda pendente |
| Falha de IA | Respostas JSON inválidas não são substituídas por conteúdo genérico | Validação de estrutura, quantidade e dias/semanas únicos |
| Briefing | Linguagem de negócio próprio; aviso de que @ não consulta Instagram | Anexos continuam sem processamento |
| Admin | Integrações sem verificação deixam de aparecer como confirmadas | Seletor de modelos ainda não implementado |

A versão antiga inspecionada inventou características da persona, valores de
ofertas, taxas de conversão, projeções e sugestões de prova social sem evidência.
Não é uma amostra aprovada de qualidade. O novo prompt não altera esse registro
nem prova por si só a ausência de alucinações em novas respostas.

## 3. Ordem de implementação e aceite

1. **P0, base confiável e histórico:** corrigir o botão Histórico reportado pelo usuário,
   persistir toda operação/versão por conta e unificar o saldo de IA; concluir medição server-side e SEC-002, registrar modelo
   efetivo, retirar Gemini indisponível da rota ativa, testar geração inteira com
   dois briefings distintos e casos de falha. Reservar/debitar/estornar por operação,
   impedir consumo duplicado, limitar refinamentos e concorrência.
2. **P1, edição controlada e decisão de monetização:** inputs versionados e
   refinamento pós-save com escopo e custo visíveis; análise estruturada, seleção persistente de
   ideias e plano amplo somente após escolha. Contexto escolhido alimenta o restante.
3. **P1, matriz e gerador:** matriz 5 × 4, ideias por célula, roteiro por formato,
   variações cobradas e histórico de todas as versões.
4. **P1, Stories recorrentes:** agenda por dia, quantidade escolhida, passos de cada
   story e continuidade entre semanas; uso recorrente contabilizado separadamente.
5. **P1, onboarding e anexos:** perguntas progressivas, upload privado com leitura,
   fontes identificadas e revisão do resumo antes da geração.
6. **P2, evolução do perfil:** primeira medição declarada pelo usuário e, depois,
   conexão autorizada com API. Não depender da integração para entrevistar o piloto.
7. **Liberação acompanhada:** nova geração aceita, salvar/reabrir, limites,
   privacidade e suporte verificados. Publicação exige o lote concreto e autorização.

Os itens acima são requisitos pendentes, não funcionalidades disponibilizadas.
Para aprender cedo, entrevistas e teste de usabilidade podem acontecer antes de
todos eles. Não anunciar monitoramento automático, upload funcional ou Stories
com continuidade enquanto essas entregas não passarem pelos respectivos aceites.

## 4. Onboarding: o que perguntar e por quê

**Decisão pendente de discussão conjunta.** As cinco etapas atuais são a base de
trabalho, não um novo questionário aprovado. As perguntas candidatas, sua função
e obrigatoriedade proposta estão na seção 12. Usar perguntas condicionais. Permitir “ainda não sei” onde houver
incerteza. Não pedir ao empreendedor que saiba montar um ICP ou escolher um funil.

| Momento | Informação | Utilidade |
| --- | --- | --- |
| Negócio | Marca, segmento, oferta prioritária, estágio e região/alcance de atendimento | Evitar plano para negócio, oferta ou local incompatível |
| Cliente | Quem compra, qual problema resolve e como a compra acontece | Distinguir comprador, usuário e decisor quando aplicável |
| Diferenciação | Por que escolhem sua oferta; provas que pode usar; restrições do setor | Copy específica sem inventar autoridade, depoimento ou promessa |
| Situação | @, bio atual, tentativas anteriores, resultado observado e principal obstáculo | Contexto e ponto inicial verificável |
| Objetivo | Prioridade do ciclo e ação esperada de quem chega ao perfil | Alinhar bio, conteúdo e conversão à oferta existente |
| Recursos | Tempo, equipe, capacidade de atender, frequência e disponibilidade para gravar | Plano executável e ideias de monetização proporcionais |
| Revisão | Resumo, fontes, lacunas, anexos lidos/pendentes e custo da operação | Usuário corrige fatos antes de gastar IA |

Estágio, área atendida, diferencial/provas e destino do CTA precisam de campos
próprios. Ticket/faixa de preço é opcional e só aparece quando influencia uma
decisão de oferta. Receita, seguidores e dados de clientes não são requisitos para
usar o app. Uma marca sem perfil pode começar normalmente.

## 5. Uploads: proposta técnica e limite

Proposta: **50 MB por documento, 10 MB por imagem, 100 MB por briefing, até cinco
arquivos**. Formatos iniciais: PDF, DOCX, TXT UTF-8, JPEG, PNG e WebP. Não prometer
que qualquer imagem ou documento protegido será lido. DOC, ZIP e vídeo ficam fora.

50 MB é compatível com o teto por arquivo do Supabase Free. Isso não significa
que o projeto Supabase atual esteja nesse plano. Um arquivo de 100 MB exigiria
conferir plano e configuração. Acima de 6 MB, usar upload retomável TUS, conforme
a [documentação de limites](https://supabase.com/docs/guides/storage/uploads/file-limits)
e [orientação de uploads](https://supabase.com/docs/guides/storage/uploads/standard-uploads).

Fluxo: selecionar > validar assinatura real/tamanho > enviar a bucket privado
com isolamento por usuário > extrair texto/OCR em job > mostrar status e resumo
com páginas/fontes > usuário aprova o contexto > gerar. Não enviar base64 de 50 MB
em cada prompt, nem guardar arquivos em localStorage.

Limite de upload não é limite de processamento. Proposta inicial de processamento:
até 100 páginas de PDF por briefing e orçamento de 30 mil tokens extraídos antes
da síntese; acima disso, pedir seleção de trechos, sem truncar silenciosamente.
Medir e ajustar esses valores no piloto. PDF escaneado depende de OCR; imagens
entram como referência visual e texto extraído, sem prometer análise de identidade.

Rejeitar arquivo inválido/protegido, texto ilegível e descompressão excessiva de
DOCX. Mostrar quais fontes foram de fato usadas. Conteúdo de documento é referência,
nunca instrução para alterar regras do sistema. Definir retenção e exclusão por
conta e impedir acesso de outro usuário. Aceite inclui acesso negado entre contas,
upload interrompido/retomado, duplicado, limite excedido e falha de extração.

## 6. @, situação atual e evolução

Hoje o @ é uma identificação no prompt. Não há ferramenta de pesquisa, coleta
de métricas ou autorização de Instagram nessa chamada. Modelo mais recente não
ganha acesso ao perfil automaticamente.

Para o piloto: solicitar opcionalmente bio atual, print ou métricas declaradas.
Guardar origem, data da captura, período, fuso e campos ausentes. Um snapshot
público, quando disponível por mecanismo autorizado, pode apoiar diagnóstico
qualitativo, mas não revela alcance, retenção ou conversões privadas.

Etapa seguinte: conectar conta profissional com autorização pela API da Meta.
A rota de Facebook Login exige conta profissional vinculada a uma Página e não
acessa contas pessoais. Não generalizar esse requisito para todas as rotas de login.
Fonte: [coleção oficial da Meta](https://www.postman.com/meta/instagram/folder/u4g5a2a/instagram-api-with-facebook-login).

Guardar snapshots imutáveis. Comparar janelas equivalentes, por exemplo últimos
28 dias contra 28 dias anteriores, somente para métricas com mesma definição,
origem e cobertura. Não converter dado ausente em zero nem inferir vendas por
seguidores. Anotar ações realizadas para interpretar evolução sem atribuir
causalidade ao StrategInsta. Revogação de acesso deve interromper a coleta.

| Comunicação | Condição |
| --- | --- |
| “Transforme as informações do seu negócio em uma estratégia revisável para Instagram.” | Compatível com o produto, condicionado à geração validada |
| “Acompanhe seu ponto de partida com os dados que você fornecer.” | Só após formulário e snapshots persistidos |
| “Conecte seu Instagram profissional para acompanhar a evolução das métricas disponíveis.” | Só após API, permissões, coleta e comparações validadas |
| “Analisamos qualquer @” / “garantimos seguidores e vendas” | Não usar |

## 7. ICP, monetização e bio

ICP deve ter base da análise, recorte recomendado, dores/objeções, critérios de
compra, anti-público e perguntas de validação. Teste de qualidade: dois negócios
distintos não podem receber o mesmo perfil apenas trocando o nome. Cada afirmação
factual deve remontar a um input; hipóteses devem estar identificadas.

Monetização terá análise de potencial e cartões com ID estável, oferta, público,
justificativa ligada aos inputs, recursos, risco e hipótese a validar. Usuário
seleciona uma ou mais ideias ou escolhe manter apenas a oferta atual. Seleção
fica salva na estratégia e não pode mudar silenciosamente ao refinar a análise.

Após selecionar: botão “Desenvolver plano das ideias escolhidas”. Plano amplo
inclui proposta, entrega, operação, canais de venda, validação, recursos,
dependências, indicadores e fases. Não confundir esse plano comercial com
calendário de conteúdo. Avaliar esteira de entrada, principal e continuidade
somente quando houver capacidade e relação lógica entre ofertas.

Uma recomendação discreta apresenta Antony Pinheiro Soluções em Marketing para
planejamento completo e execução coordenada com parceiros conforme escopo.
Não é serviço incluído na assinatura nem contratação obrigatória; não inventar
link, preço, agenda ou resultado. Antony executa consultoria e mentoria;
design, tráfego, social media e landing pages podem envolver parceiros.

O restante da estratégia recebe briefing + ICP revisado + ideias selecionadas +
plano aprovado. Trocar a seleção sinaliza quais conteúdos ficaram desatualizados,
sem regenerar ou cobrar automaticamente. Preparar esse contrato antes de ampliar
as chamadas de IA.

Bio: três cartões com texto copiável, contagem real, limite de 150 caracteres,
campo Nome separado e uma frase de recomendação. Light copy deve comunicar
oferta, relevância e próximo passo com o tom da marca. Sem chamar algo de grátis
ou usar credenciais/provas não fornecidas. Preview não substitui teste no Instagram.

## 8. Stories: rotina e continuidade

Não foi localizada a versão desejada no histórico de Stories consultado. O código
atual gera sete cartões semanais com texto de três frames; não contém diário de
rotina nem continuidade persistida. Não afirmar que ela nunca existiu em outro branch.

Fluxo proposto: escolher semana > contar rotina por dia > escolher quantidade
(0 para não publicar; de 1 a 15 nos dias ativos, proposta inicial) > indicar oferta
ou evento real > gerar pacote revisável. Cada story contém:

- Posição na sequência e função: reter, engajar ou converter.
- Cena a gravar e orientação prática, fala sugerida e texto curto na tela.
- Ligação narrativa com o anterior e próximo, sem sequência artificial.
- Recurso do Instagram, pergunta/alternativas ou CTA, quando pertinente.
- Relação com o feed, esforço e material necessário; prova social só autorizada.

Salvar semana e agenda com `previous_week_id`. A próxima semana recebe resumo da
anterior, o que o usuário executou, feedback, métricas disponíveis e a nova agenda.
Não pressupor que tudo foi publicado ou que houve vendas. Evitar repetição literal.
Refinamento só do dia escolhido preserva outros dias. Validar a quantidade exata
de stories por dia, dias sem publicação e troca de fuso/semana.

## 9. Modelos: estado confirmado e alternativas

Leitura da função publicada `call-ai` v8 e eventos da sessão de teste:

| Papel atual | Configuração / evidência |
| --- | --- |
| Primeira tentativa | Default `gemini-2.5-flash-preview-04-17`; eventos confirmam tentativa desse ID e erro de modelo não encontrado/não suportado |
| Contingência | OpenAI Chat Completions; default `gpt-4o-mini`; eventos mostram fallback seguido de geração concluída |
| Modelo exato da resposta OpenAI | Não registrado. `OPENAI_MODEL` pode substituir o default; não foi lido um segredo para inferir o valor |
| Reasoning separado | Não existe; mesma rota para todas as seções, temperatura 0,75, sem controle explícito de esforço |
| Pesquisa / Instagram | Sem ferramenta de navegação, grounding ou API Instagram habilitada nessa chamada |

**Escolha solicitada por Antony nesta revisão:** atualizar para rotação entre
GPT 5.6 Luna e Gemini 3.8 Flash, com atualização pelo painel admin. Essa é a dupla
alvo do plano; Terra/Astra deixam de ser candidatos ao escopo atual. Não foi
alterada a função publicada nem o código nesta revisão documental.

IDs a validar na implementação: `gpt-5.6-luna` e `gemini-3.8-flash`.
O catálogo público não comprova acesso pela chave/projeto contratado.
Fontes já consultadas: [catálogo OpenAI](https://developers.openai.com/api/docs/models)
e [Gemini 3.8 Flash](https://ai.google.dev/gemini-api/docs/models/gemini-3.8-flash).

**Proposta de rotação, a aprovar:** distribuição 50/50 por nova operação lógica,
no servidor. Uma estratégia completa mantém o mesmo modelo nas suas partes;
revisões posteriores são novas operações e podem usar o outro modelo. Preservar
contexto estruturado para manter consistência. Rotação não significa executar os
dois modelos em cada pedido. Alternância exata ou ponderação ajustável é decisão
operacional do admin, com registros do modelo escolhido e efetivo.

Contingência é separada da rotação: indisponibilidade transitória/limite/erro
permite tentativa limitada no outro modelo. Não repetir erros de autenticação,
saldo do usuário ou pedido inválido como se fossem falha de modelo. Uma operação
com fallback não cobra duas vezes. Suspender temporariamente modelo indisponível,
mostrar alerta ao admin e registrar motivo; nunca retornar ao modelo antigo removido.

## 10. Configuração pelo admin e preço

Implementar rota server-side com allowlist de modelos/provedores e configuração
versionada por tarefa e política de rotação: análise estratégica, texto curto, Stories e leitura de
anexos. A tela exibe configuração ativa, data e resultado do último teste, sem
expor chaves. “Testar modelo” informa o possível custo; “Aplicar” valida acesso,
permissão de admin e registra auditoria atômica. Ter reversão à revisão anterior.

Não basta trocar uma string. Adaptar payload, limite de saída e parâmetros
permitidos por modelo. O Gemini 3.8 Flash, por exemplo, documenta thinking low,
medium e high, sem minimal. Não enviar temperatura/esforço incompatíveis por
herança. A rota deve retornar provedor/modelo efetivo, inclusive no fallback.

Registrar por operação: ID, tipo, estratégia, provedor, modelo, revisão do prompt,
tokens de entrada/saída/cache quando informados, duração, status, tentativas e
custo calculado com tabela versionada. Não registrar conteúdo do briefing em logs.
Não mostrar todos os serviços como operacionais sem consulta real.

Rever preço depois de medir estratégia inicial, refinamentos, semana de Stories,
OCR/síntese, armazenamento, falhas e suporte. Pacote de Stories é uso recorrente;
não oferecer ilimitado baseado apenas no custo de uma estratégia inicial.

Fórmula de trabalho: custo variável = IA + extração/OCR + armazenamento/transferência
+ pagamentos + suporte variável. Margem e preços são decisões posteriores à
medição. Não conservar as antigas margens ou volumes como se fossem validados.

## 11. Aceite do piloto e próxima ação

- Dois briefings diferentes, sem personagens/resultados inventados apresentados como fatos.
- Usuário entende a recomendação e consegue dizer qual input a fundamenta.
- Seleção de monetização, Stories e anexos são testados quando anunciados no piloto.
- Salvar e reabrir com nome e com nome padrão; testar falha/repetição/duplo clique.
- Ledger server-side protege crédito, conta e repetição antes da abertura sem supervisão.
- Registrar tempo até primeira estratégia salva, abandonos, erros, custo e necessidade de ajuda.
- Após uma semana, verificar ações realmente executadas; não apresentar intenção como resultado.

Próxima ação: discutir as perguntas de onboarding e a proposta de consumo/ofertas
nas seções seguintes antes da aprovação do plano. Antony informou que resetou
os créditos pelo painel admin. O estado 2/2 anterior é histórico, não saldo atual
confirmado. Não conceder créditos novamente nem iniciar gerações nesta revisão.

## 12. Perguntas de onboarding para planejarmos juntos

O objetivo desta lista é permitir escolher o mínimo útil e os aprofundamentos.
Não implementar todos os campos nem tornar todos obrigatórios sem essa discussão.
O questionário deve produzir um resumo editável com fatos, hipóteses e lacunas.

| Pergunta candidata | Obrigatoriedade proposta | Decisão que informa |
| --- | --- | --- |
| Como se chama seu negócio e em que segmento atua? | Essencial | Identidade e linguagem |
| O que você vende hoje e qual oferta quer priorizar? | Essencial; permitir “ainda vou lançar” | ICP, bio, monetização e CTA |
| Quem compra de você e qual problema quer resolver? | Essencial; permitir “ainda não sei” | Comprador e estágio de consciência |
| O que diferencia sua oferta das alternativas? | Essencial com opção “preciso descobrir” | Posicionamento e copy específica |
| Qual é a principal prioridade para os próximos 30 dias? | Essencial com opção de ajuda | Distribuição da matriz e Stories |
| O que mais dificulta esse avanço hoje? | Essencial com opção “não sei” | Foco e viabilidade |
| O que você quer que a pessoa faça após conhecer seu perfil? | Essencial com opção de ajuda | Destino do CTA: DM, WhatsApp, site, visita etc. |
| Quanto tempo, apoio e recursos consegue dedicar ao conteúdo? | Essencial; faixas e observação | Plano possível e formatos |
| Você já vende regularmente, está começando ou vai lançar uma oferta? | Condicional se a resposta sobre oferta não esclarecer | Não sugerir esteira prematura |
| Atende em qual região e de forma presencial, online ou ambas? | Condicional ao negócio | Recorte territorial e oferta |
| Por onde vende hoje e há capacidade para atender mais pessoas? | Aprofundamento recomendado | Canal e limite operacional |
| Tem um @? Qual bio usa e o que já testou no Instagram? | Opcional | Identificação, ponto inicial e evitar repetição |
| Que resultados observou, em qual período e de onde vêm esses dados? | Opcional; não exigir receita/seguidores | Baseline com origem e data |
| Tem depoimentos, provas, diferenciais verificáveis ou restrições de comunicação? | Opcional; ausência bloqueia alegações sem evidência | Autoridade responsável e objeções |
| Como sua marca fala? Há referências de que gosta ou não gosta? | Opcional, exemplos breves | Tom, formatos e preferências |
| Qual frequência é viável e você se sente à vontade gravando? | Proposta de aprofundamento em Recursos | Volume de feed e roteiros |
| Quais documentos/imagens ajudam a entender o negócio? | Opcional, após upload funcional | Fontes adicionais revisáveis |

Agenda de cada dia e quantidade de Stories ficam na aba Stories; não sobrecarregar
o primeiro onboarding. Preço/ticket pode ser perguntado ao desenvolver uma oferta,
se relevante. Não repetir perguntas respondidas claramente em anexos aprovados.

Decisões para nossa conversa: (1) briefing inicial essencial ou completo com
campos opcionais; (2) quais perguntas realmente mudam a estratégia; (3) onde
permitir “não sei” e fazer recomendação como hipótese. A decisão anterior sobre
empreendedor e formatos de arquivo já está confirmada e não será perguntada de novo.

## 13. Edição após salvar e refinamento com limites

Requisito: permitir ajustar inputs e outputs de estratégia salva. Não entregar
um chat irrestrito nem reescrever silenciosamente toda a estratégia.

- “Editar briefing” abre campos permitidos do negócio vinculado à estratégia.
  Salvar cria uma revisão; a anterior permanece recuperável. Mudança de negócio
  pode exigir nova estratégia, com aviso, em vez de contaminar o histórico atual.
- Antes de usar IA, mostrar inputs alterados e seções afetadas. Marcar resultados
  antigos como “Baseados no briefing anterior”; usuário escolhe quais atualizar.
- Cada aba oferece caixa “Refinar esta seção” e controles adequados: tom, tamanho,
  formato, CTA e instrução limitada ao conteúdo selecionado. Mostrar escopo e custo.
- Gerar alternativa cria nova versão, com comparação e escolha da versão ativa.
  Reabrir o original ou descartar a alternativa não remove histórico nem devolve
  crédito de uma geração válida já entregue. Falha técnica tem outra regra.
- Edição manual limitada: título, legenda, texto, CTA e campos da agenda, sem editar
  IDs, saldo, esquema ou conteúdo de outras contas. Proposta: salvar/corrigir texto
  manualmente é gratuito; aplicar IA a essa mudança consome créditos. Confirmar
  essa distinção com Antony antes de fechar a política de planos.
- Inputs grandes/anexos podem exigir nova síntese: informar o custo antes de gerar,
  preservando a versão anterior caso o usuário desista ou a operação falhe.

Aceite: edição/refino depois de recarga; nenhuma mudança oculta em outra seção;
mesmo conteúdo com versões preservadas; cancelamento e falha sem perda; saldo
validado pelo servidor em toda chamada, inclusive após salvar a estratégia.

## 14. Matriz de conteúdo e gerador conectado

Fonte fornecida por Antony, lida e inspecionada nas três páginas:
[BASE - Tabela de Conteúdos](<K:/Meu Drive/5. Projetos/Mentoria de IG/Template de ideias de Conteúdos/BASE - Tabela de Conteúdos para Crescimento, autoridade, engajamento e quebra de objeção para Instagram.pdf>).
É uma referência de estrutura e repertório, não instrução executável nem base
factual sobre um negócio. Não importar o catálogo inteiro ou tratar suas promessas
como verdade. A referência mistura formato, tema e objetivo; o app deve diferenciá-los.

**Contrato solicitado: cinco linhas por quatro colunas.** Colunas propostas a
partir da referência: Crescimento; Engajamento e Retenção; Autoridade; Quebra de
Objeção. A referência usa “Engajamento e Conexão”; validar o rótulo final juntos.
Retenção da audiência e retenção de clientes têm significados diferentes.

| Linha | Consciência do público | Tendência de abordagem, não regra rígida |
| --- | --- | --- |
| 1 | Ainda não percebe o problema | Descoberta e identificação, mais topo |
| 2 | Percebe o problema | Nomear a dor e apresentar caminhos, topo/meio |
| 3 | Conhece tipos de solução | Critérios e alternativas, mais meio |
| 4 | Conhece a oferta/marca | Diferenciação, prova e objeções, meio/fundo |
| 5 | Está mais próximo da decisão | Oferta, condições e próximo passo, mais fundo |

Esse é o mapeamento operacional proposto dos cinco níveis para o app. Não tratar
nível de consciência como diagnóstico automático de um seguidor, nem cada coluna
como etapa exclusiva do funil. Um conteúdo de autoridade pode existir no topo;
para público inconsciente, quebra de objeção deve começar por crenças sobre o
problema, sem presumir que já conhece a oferta. “Mais consciente” não significa
necessariamente cliente fiel. Validar essas adaptações com Antony.

Proposta inicial: uma ideia contextualizada por célula, até 20 ideias no pacote
inicial, com células pouco pertinentes explicitamente justificadas e sem preencher
por obrigação. Até três ideias visíveis por célula; demais versões ficam no histórico.
Não é limite de memória nem exclusão automática.

Cada ideia tem ID, nível, objetivo, tema/ângulo, formato sugerido, ligação ao
briefing/ICP/oferta e eventual prova necessária. Ações:

- “Criar roteiro”: abrir gerador já preenchido com ideia, célula e contexto; abrir
  é gratuito, solicitar a geração consome o valor exibido.
- “Nova ideia”: acrescentar alternativa na célula selecionada, sem refazer matriz.
- “Variar formato”: gerar adaptação para Reel, carrossel, post estático ou sequência
  pertinente. Trocar só uma seleção de formato não dispara IA nem cobrança.
- “Refinar”: ajustar a ideia/roteiro com instrução limitada; salvar versão.

Gerador entrega roteiro por formato: cenas/fala/texto na tela para Reel; slides e
legenda para carrossel; peça textual/legenda para estático. Não prometer produzir
vídeo ou arte final neste lote. Objetivo, nível e CTA acompanham o conteúdo até
histórico/feedback. Navegação de volta mantém célula e versões.

## 15. Stories no mesmo gerador

“Roteirizar/refinar” em um story, dia ou sequência abre o gerador com a origem
preservada. Usuário informa ou altera rotina, quantidade, oferta/evento e restrições.
Antes de gerar, escolhe apenas o story, o dia ou a semana e vê o custo correspondente.
Uma mudança pequena não deve disparar a semana inteira automaticamente.

Preservar função narrativa, stories vizinhos, contexto de feed e semana anterior.
Se ajustar um story quebrar a ligação da sequência, mostrar recomendação de revisão,
sem modificar ou cobrar os vizinhos automaticamente. Rotina fornecida não significa
que a atividade ocorreu. Feedback de publicação é vinculado à versão efetivamente usada.

## 16. Histórico persistente, botão atual e aprendizado por feedback

**Bug relatado por Antony:** botão de histórico ao lado de Sair não funciona.
Registrar como P0 e reproduzir antes de atribuir uma causa. Inspeção read-only do
código: botão altera estado, mas HistoryPanel só é renderizado no dashboard; usa
array de revisões da estratégia carregada. Isso é uma lacuna possível, não prova
isolada da causa no cenário do usuário. “Estratégias salvas” não substitui esse botão.

Histórico novo cobre TODA geração: estratégia, partes, matriz, ideia, roteiro,
Stories, plano de monetização, refinamento e nova versão. Persistir antes de
reportar sucesso, mesmo que o usuário feche a aba antes de concluir a estratégia.
Registrar tentativas falhas/canceladas com status, sem apresentar saída inválida
como conteúdo utilizável. Histórico não depende de React state/localStorage.

Contrato de dados: conta, negócio/estratégia, operação e origem, versão dos inputs,
versão anterior, instrução de refinamento, output, modelo efetivo, data, status e
crédito debitado/estornado. Inputs/outputs ficam em dados privados com RLS; logs
operacionais mantêm apenas metadados seguros. Não misturar negócios da mesma conta.

O botão abre painel visível na posição atual, no desktop e celular, com filtros
por estratégia/tipo/período/status/avaliação, loading/erro/vazio, pesquisa e paginação.
Permitir abrir, comparar, selecionar versão ativa e retomar conteúdo. Arquivar não
apaga a trilha de geração/consumo. Exclusão de conta/conteúdo segue política de
retenção e privacidade a definir, sem prometer guardar eternamente.

Feedback leve: “Deu bom”, “Deu ruim”, “Ainda não avaliei”. Ao avaliar, perguntar
qual objetivo (alcance, interação, retenção ou conversão), se publicou, quando e
opcionalmente o que observou/métricas/período. Permitir corrigir avaliação e
separar “gostei do texto” de “performou após publicar”. Esse sinal não prova ROI.

Próximas gerações consultam exemplos relevantes da própria conta/negócio, objetivo,
formato e período, incluindo sucessos e falhas com explicação. Peso menor para
opinião sem dados; não concluir que um formato é ruim por um único post. Preservar
variedade e testar hipóteses, sem repetir sempre um vencedor. Isso é recuperação
de contexto no produto, não retreinamento automático do modelo.

Conexão futura Meta via MCP/API: verificar capacidades, permissões e conta antes
de prometer coleta. Um conector não garante acesso a todos os dados. Vincular
métricas a media_id e versão publicada, preservar origem/período, separar orgânico
versus pago e manter avaliação manual. Nenhuma conexão Meta foi executada aqui.

## 17. Créditos, limites, avisos e desenho das ofertas

**Requisito confirmado:** toda chamada de geração/refinamento consome saldo do
plano. Substituir a lógica atual de contar apenas estratégias e as promessas de
refinamento ilimitado. Preços e cotas antigas não ficam automaticamente aprovados.

Proposta para discussão: carteira única de créditos de IA, com custo previsível
por operação e escopo. Mais simples que saldos separados para estratégia, Stories
e roteiros. Valor exibido antes da confirmação; modelo rotacionado não muda o preço
para o usuário naquela operação. Custos do fornecedor são medidos separadamente.

**Tabela ilustrativa, não preço/cota implementados ou margem validada:**

| Operação | Créditos propostos | Escopo da cotação |
| --- | --- | --- |
| Nova estratégia completa | 20 | Sete seções, matriz inicial até 20 ideias e primeira semana até 35 stories; sem roteiros completos de cada ideia |
| Nova ideia ou variação de formato na célula | 1 | Uma alternativa; roteiro completo não incluído |
| Refinar uma ideia, bio ou um roteiro curto | 1 | Um item delimitado, sem regenerar outras seções |
| Gerar roteiro de conteúdo | 2 | Um Reel/carrossel/post dentro do limite exibido |
| Gerar/refazer Stories de um dia | 2 por bloco de até 5 stories | 1-5: 2; 6-10: 4; 11-15: 6 |
| Gerar/refazer uma semana de Stories | 10 por bloco de até 35 stories | Até 35: 10; 36-70: 20; 71-105: 30 |
| Desenvolver plano das ideias de monetização selecionadas | 5 | Até três ideias e plano de extensão delimitada |
| Regenerar ICP, análise ou matriz inteira após mudar inputs | Cotação por seção a fechar | Não disfarçar trabalho amplo como refino de um item |
| Editar manualmente, salvar, abrir, copiar ou avaliar | 0, proposta | Nenhuma chamada de IA |

Esses números são unidades de produto para simular uso, não custos reais de Luna/
Gemini. Limites de texto, slides e contexto serão calibrados antes de aprovar a
oferta. Anexos/OCR precisam de cotação própria, ainda a decidir. Não cobrar novamente
os mesmos anexos já processados e inalterados a cada geração. Se escopo ultrapassar
limite, oferecer reduzir ou confirmar nova cotação antes de executar; sem truncar
ou cobrar excedente automaticamente.

Exemplo de pacote com 120 créditos: 1 estratégia (20), 4 novas semanas (40),
12 roteiros (24), 16 refinamentos curtos (16) e 20 novas ideias (20). Total: 120.
É demonstração de combinação; usuário pode distribuir a carteira de outra forma.

| Oferta candidata | Cota ilustrativa | Posição para discutir |
| --- | --- | --- |
| Experimentação | 30 uma vez | Uma estratégia + pequenas provas de uso; avaliar convite supervisionado vs trial público |
| Essencial | 120 por mês | Um negócio e uso regular, usando o exemplo acima |
| Continuidade | 240 por mês | Mais testes/refinos/Stories do mesmo negócio; não implica agências |
| Créditos extras | Pacote avulso, valor a definir | Reposição transparente sem assinatura adicional automática |
| App + apoio consultivo | Escopo e preço separados | Planejamento completo e execução coordenada por Antony/parceiros, sem confundir com assinatura do SaaS |

Decidir juntos: preço em reais após custo medido, renovação, acúmulo/expiração,
validade de extras, política de trial, perfis por plano e retenção do histórico.
Não lançar anual, “ilimitado”, white label ou API como benefício sem implementação.
Não apagar histórico por falta de saldo; distinguir cota de geração de retenção.

Avisos propostos no produto:

- Botão: “Gerar roteiro · 2 créditos”. Ao abrir gerador, nada é debitado.
- Confirmação contextual: “Saldo: 18. Esta geração usa 2. Após concluir: 16.”
- Alteração de briefing: “3 seções usam respostas anteriores. Escolha quais atualizar.”
- Saldo insuficiente: “Você tem 1 crédito; esta ação precisa de 2. Seu rascunho está salvo.”
- Falha técnica: “Não foi possível concluir. Nenhum crédito foi consumido.” Só exibir
  após confirmação de liberação/estorno no servidor; caso pendente, mostrar reconciliação.
- Expor extrato de uso com ação, data, modelo e crédito; sem jargão de tokens no fluxo comum.

Motor obrigatório: cotar > reservar atomicamente > gerar/validar > persistir versão
> confirmar débito. Uma chave por operação impede cobrança dupla em duplo clique,
recarga ou retry. Fallback técnico não cobra a mais; novo pedido voluntário válido
é nova operação. Falha antes de entregar libera reserva. Cancelamento/timeout tem
estado explícito e reconciliação para não cobrar nem gerar em duplicidade. Para
estratégia com partes, progresso persistido permite retomar sem cobrar partes duas
vezes; regra de abandono/entrega parcial precisa ser definida antes da oferta.

Novos aceites obrigatórios: consumo em todas as entradas do gerador, edição
pós-save, matriz/Stories abrindo origem correta, feedback persistido e usado sem
contaminação entre contas, histórico após recarga e desconto único sob concorrência.
Migração dos planos preserva saldo/contratos/histórico e requer política aprovada.
