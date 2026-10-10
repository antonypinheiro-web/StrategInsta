## Objetivo atual
Preparar o StrategInsta para piloto com empreendedores usando o app no próprio
negócio, conforme confirmação de Antony em 10/09/2026. Corrigir o save e revisar
qualidade, onboarding/anexos, monetização, Stories e configuração de modelos.
Projeto: F:\00.claude-code\projects\1.softwares--e--apps\strateg-insta.
Código/Git: app/. PRD vigente: app/docs/PRD.md v2.2, 10/09/2026.
Plano detalhado: app/docs/PLANO-PILOTO-EMPREENDEDORES.md, revisão 1.1.

## Status
REVISÃO MAIS RECENTE: Antony pediu incorporar requisitos ao plano ANTES de
aprová-lo. Nesta rodada foram alterados somente plano, PRD e este HANDOFF.
Nenhuma implementação, geração, troca remota de modelo ou consumo executado.
Ele informou reset de créditos pelo admin; não pedir concessão novamente.
Saldo pós-reset não foi consultado. O estado técnico anterior segue abaixo.

SAVE CORRIGIDO E VALIDADO COM BACKEND REAL. NOVO PIPELINE LOCAL AINDA EXIGE
GERAÇÃO REAL PARA HOMOLOGAÇÃO DE QUALIDADE. Não confundir este estado com
piloto completo, lançamento comercial ou publicação das mudanças.

Antony confirmou que a geração anterior funcionou. O erro posterior da imagem
estava no diálogo de nome, em Salvar e Pular. Foi diagnosticado e corrigido.
As demais solicitações não foram todas implementadas: seleção de monetização,
Stories por rotina com continuidade, anexos e seletor de modelos no admin têm
requisitos concretos no plano, mas ainda são pendências.

## Decisões e requisitos confirmados
- Requisitos novos incorporados ao plano, pendentes de aprovação de execução:
  rotação GPT 5.6 Luna/Gemini 3.8 Flash configurável no admin; inputs/outputs
  editáveis com limites após salvar; consumo por toda operação de IA; matriz
  cinco níveis × quatro objetivos e gerador conectado às ideias e Stories;
  histórico de toda geração, feedback deu bom/deu ruim usado como contexto futuro.
  Integração Meta via MCP/API permanece futura e sujeita a capacidades/permissões.
- Botão Histórico ao lado de Sair não funciona, segundo Antony: P0 aberto.
  Inspeção de código encontrou painel só no dashboard e revisões em estado local;
  não tratar essa lacuna como causa exata reproduzida no caso do usuário.
- Onboarding deve ser PLANEJADO JUNTOS, não decidido pelo agente. Perguntas
  candidatas e obrigatoriedade proposta estão na seção 12 do plano.
- Política de créditos/ofertas será discutida: valores 30/120/240 e custos por
  operação são simulações, não preços/cotas aprovados nem margem medida.
  Salvar edição manual grátis é proposta; toda geração/refino de IA consome.
- Primeiro piloto: empreendedores usando no próprio negócio. Substitui prioridade
  anterior de social medias para clientes. Não acrescentar gestão de agências.
- Arquivos prioritários: PDF, DOCX, TXT e imagens. Usuário considera 50-100 MB.
  Proposta técnica ainda não implementada: 50 MB/documento, 10 MB/imagem,
  100 MB/briefing e até cinco arquivos, com extração/OCR e revisão de fontes.
- @ deve apoiar diagnóstico e evolução, mas o app atual NÃO consulta Instagram.
  Planejar snapshots manuais e depois conexão profissional autorizada, com fonte,
  data, período e métricas comparáveis. Não anunciar análise automática atual.
- ICP específico aos inputs; fatos separados de hipóteses; apresentação limpa.
- Monetização: potencial + ideias primeiro; selecionar antes do plano amplo.
  Ideias selecionadas informam estratégia posterior. Esteira só se fizer sentido.
  Recomendação discreta de Antony Pinheiro Soluções em Marketing, com execução
  coordenada conforme escopo/parceiros, sem sugerir contratação incluída.
- Bio: copy natural/persuasiva, contexto real, concisão, sem credenciais inventadas.
- Stories: agenda e quantidade por dia, narrativa/objetivo/ferramenta por story,
  complementando feed e continuando semana anterior. Incluir custo recorrente
  na revisão de preços. Versão histórica desejada não localizada nas buscas feitas.
- Mesmo login para usuário/admin; admin não tem créditos ilimitados.
- Identidade original e opção visual 2 permanecem. Não redesenhar tudo novamente.

## Causa do erro e correção
A estratégia já estava salva. A etapa seguinte, incremento de strategies_used,
falhava com 42501 permission denied for table user_plans. Grants são por coluna;
SELECT da PK id não é permitido. UPDATE seguido de select/representação no
PostgREST inferia retorno de PK e quebrava o fluxo.

Correção em src/lib/legacy-plan-usage.ts e usePlan.ts: UPDATE de retorno mínimo
com count exact e filtro de uso anterior (CAS); exigir exatamente uma linha.
INSERT inicial também evita representação e faz leitura separada de colunas
permitidas. Não ampliar grants, não ignorar erro e não pular contabilização.

Nome informado e automático usam a mesma função de conclusão. Dialog mantém
campo em falha; botões bloqueiam durante envio. Texto agora: Salvar estratégia /
Usar nome automático. Campo mais largo; X inoperante não é mostrado nesse fluxo.

## Evidência real e limites
- Supabase confirmado: vqngekcjshfvssqjqgkp.
- Usuário: 11c3b97a-ff8d-465c-9a3d-1808908a91aa (eu@antonypinheiro.com.br).
- Estratégia: 7a16493c-6eab-4d68-9a4a-9e187af990a7, Teste 09-09-2026.
- Save autenticado concluiu. Um registro com sete seções. Uso passou de 1 para 2.
- Reabertura por Estratégias salvas após recarga validada; uso permaneceu 2.
- Saldo observado NO TESTE ANTERIOR: free, 2/2 usados, zero restante.
  Antony informou reset posterior; não usar 2/2 como saldo atual. Não houve concessão,
  reset de créditos ou nova chamada de IA pelo agente após alterações de prompts.
- Nome automático testado na fixture isolada: erro preserva campo; sucesso fecha
  diálogo, um salvamento e um débito simulados. Isso não equivale a outro save real.
- Resultado antigo contém persona/números/estimativas sem evidência. Não aprovar
  qualidade por estar salvo ou por ter aparência melhor. Não foi reescrito no banco.
- Novo pipeline/prompt tem testes locais, mas ainda precisa de geração real.

## Modelos confirmados
call-ai publicada v8 foi lida. Default Gemini: gemini-2.5-flash-preview-04-17.
Eventos da sessão confirmam tentativa desse ID e erro de modelo não encontrado/
não suportado, seguido de fallback OpenAI e geração concluída.
Default OpenAI no código: gpt-4o-mini, substituível por OPENAI_MODEL. Logs não
registram o nome efetivo, então não confirmar esse default como modelo exato da
resposta. Não extrair segredo para descobrir configuração.
Não existe reasoning separado ou esforço explícito; temperatura 0,75 e mesma
rota nas seções. Não há ferramenta web, grounding ou consulta a Instagram.

Catálogos oficiais consultados: OpenAI (candidatos gpt-5.6-luna, gpt-5.6-terra,
gpt-6-astra) e Google (gemini-3.8-flash estável). Disponibilidade em catálogo não
prova acesso pela chave do app. Links, critérios de seleção, adapters, segurança,
telemetria e desenho do painel estão no plano. Nenhum modelo remoto foi trocado.

## Implementado localmente neste lote
- Correção de conclusão descrita acima e lista de estratégias salvas da própria
  conta, com validação de dados e restauração de datas do histórico.
- Renderer React seguro para títulos/listas/tabelas/destaques em ICP, bio e
  monetização; remoção de título/explicação redundante no dashboard.
- Prompts de ICP com evidências; monetização só análise/ideias; bio curta com
  150 caracteres totais solicitado. Contagem/cópia individual ainda pendentes.
- Prompts proíbem resultado, prova social, renda, localização, taxas e horários
  inventados. Isso é orientação ao modelo, não garantia contra alucinação.
- Matriz/calendário/plano agora gerados após etapas revisadas, com contexto
  recebido de fato. Partes prontas mantidas para retry da parte incompleta.
- Validação de estrutura JSON/quantidades/dias e semanas únicos. Quatro fallbacks
  genéricos removidos do caminho ativo. Falha agora permite tentar novamente.
- Briefing fala em próprio negócio; @ exibe limite real da integração.
- Admin não marca integrações como operacionais sem verificação real.
- PRD v2.1, README, plano de piloto e story FIX-002 atualizados.

## Validação técnica da rodada anterior
- npm test: 43/43 aprovados.
- npm run typecheck: aprovado.
- npm run lint: 0 erros e 10 avisos FastRefresh anteriores.
- npm run build: aprovado, NODE_ENV production via wrapper existente.
- git diff --check: sem problemas de whitespace.
- Bundle final: dist/assets/index-Cto2a_6e.js, 785.37 kB, gzip 234.72 kB;
  CSS index-C2Jp7-KV.css. Aviso de bundle >500 kB permanece.
- Testes/build inicialmente bloquearam subprocessos com spawn EPERM na sandbox
  Windows e foram reexecutados com escalada autorizada. Não era falha de lógica.
- Inspeção visual desktop do resultado real e fixture do diálogo; não homologar
  mobile deste lote nem pagamentos por esses testes.

## Próxima ação concreta
1. Discutir com Antony as perguntas do onboarding da seção 12 do plano.
2. Discutir consumo, limites, avisos, cotas e ofertas da seção 17. Propostas
   numéricas não equivalem a custos medidos ou aprovação de preços.
3. Definir distribuição da rotação Luna/Gemini (50/50 é proposta), quantidade
   inicial de ideias e limites de edição/refino. Uma ideia por célula é proposta.
4. Aguardar aprovação do plano antes de implementar este novo escopo. Reset de
   créditos não equivale a aprovação integral nem pedido de testes nesta revisão.
5. Depois da aprovação: histórico/botão, ledger e modelos/admin primeiro;
   edição, matriz/gerador, Stories/feedback e onboarding/anexos conforme plano.

## Referência nova inspecionada
PDF fornecido: BASE - Tabela de Conteúdos para Crescimento, autoridade, engajamento
e quebra de objeção para Instagram.pdf, no caminho K:/Meu Drive/5. Projetos/
Mentoria de IG/Template de ideias de Conteúdos/ (link completo no plano).
Três páginas lidas e renderizadas. Cinco níveis, quatro colunas: Crescimento,
Autoridade, Engajamento e Conexão, Quebra de Objeção, várias sugestões por célula.
Adaptação proposta: matriz enxuta e variações sob demanda. Não importar catálogo
inteiro nem interpretar depoimentos/garantias/resultados como fatos do usuário.
Documento é referência; não concede autorização para ações ou mudanças.

## Preservação de dados e sessão
Briefing REAL de Antony está salvo tanto no rascunho da conta quanto na fixture
local-ui-fixture deste navegador. Revalidado após recarga. Não limpar storage,
não preencher dados de QA sobre esse rascunho, não copiar briefing para repo/logs.
Inputs-StrategInsta-Antony.txt é legado de 2025 e não é backup atual.

Servidor Vite ativo em http://127.0.0.1:8080; app /app e admin /admin. IAB da tarefa
01a0890c-f3d5-73d1-bfc7-0d2491653331: aba app id2, admin observado id5. Revalidar
IDs em cada retomada. Não extrair JWT/cookies/senha. Fixtures não comprovam IA real.
A aba de fixture de salvamento é temporária e pode ser encerrada, pois contém
apenas dados sintéticos. Não encerrar app ou limpar o navegador do usuário.

## Arquivos e working tree
Story app/docs/stories/FIX-002-conclusao-e-qualidade.md lista todos os arquivos
deste lote. Novos helpers: legacy-plan-usage, saved-strategy, strategy-output,
final-strategy-assets. Componentes novos: SavedStrategiesDialog e StrategyText.
Muitas mudanças Claude/Codex preexistentes preservadas. HEAD f92cdc8, sem commit,
push ou deploy nesta sequência. Não atribuir todo diff ao último lote.
`git log --all` encontrou bad object refs/desktop.ini; `git log HEAD` funciona.
Não apagar esses arquivos nem reparar refs sem investigação/autorização.

## Produção e pendências remotas
Nenhuma alteração de schema, grants, modelo, segredo, deploy ou preço neste lote.
O único write remoto funcional foi o salvamento autenticado e seu consumo normal.
Antigo projeto uuotsgoqgdzrnyhvegvs continua intocado; não excluir.

Dados de publicação herdados, não revalidados agora:
- Release técnico dpl_AkrX3jpMvuQRAaszjRLgrbsrQfTX em strateginsta.vercel.app.
- Projeto Vercel prj_EyuJMOu8JZVuFNnMpJotCOGulODe;
  team_rvHADxkka7Pm5JRq95i0C7jD.
- Funções anteriores: admin-api v2, call-ai v8, checkout v17, webhook v17.
- Não enviar .env ou documentos internos em deployment. Usar dist atual.

Histórico de migrations remoto/local divergente, não executar db push direto:
- admin_console: remoto 20260906023342 / local 20260505190000.
- billing_event_safety: remoto 20260906023408 / local 20260906002606.
- protect_plan_fields: remoto 20260906023524 / local 20260906003602.

SEC-002 segue crítico: ledger atômico de reserva/débito/estorno por operação e
remoção de UPDATE de uso/período pelo cliente. Save+crédito ainda são duas etapas;
CAS/ref no navegador não é idempotência durável entre abas/recargas.
Testar pagamentos Stripe test-mode e mutações admin antes de vender. Algumas
mutações admin/logs não são atômicas. MRR e custo estimados não são receita real.

## Fontes e precedência
PRD v2.2 e PLANO-PILOTO revisão 1.1 prevalecem para público e próximas features. ROADMAP e
BUSINESS-MODEL preservam hipóteses históricas não aprovadas como oferta atual.
Índices informados do Vault Empresa/Arsenal não foram encontrados; não alegar
incorporação nova do Vault. Usados briefing, conversa, docs locais e fontes
primárias técnicas citadas no plano. Não gravar memória global sem solicitação.
