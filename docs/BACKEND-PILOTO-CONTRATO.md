# Contrato do backend do piloto

Implementação local em 27/09/2026. Nenhuma migração, função ou configuração foi
aplicada remotamente por este trabalho. As funções antigas não atendem este contrato.

## Autenticação e ativação

`call-ai` recebe POST autenticado `{action, payload}`. Identidade vem do token
validado pelo Supabase, nunca de `userId` no corpo. Prompts livres de clientes são
rejeitados. SQL privilegiado tem EXECUTE apenas para `service_role`; tabelas novas
têm leitura RLS da própria conta. Escrita de `strategies_used` e `period_start`
por cliente deixa de ser permitida.

Aplicar migrações incrementais ledger e arquivos privados, publicar ambas as
funções e cliente em um lote coordenado. Não usar `db push` sem reconciliar os
timestamps antigos registrados no HANDOFF. O primeiro modelo só fica ativo após
teste autenticado no provedor e aplicação explícita pelo admin.

## Geração e consumo

Payload de `quote` e `generate`:

```ts
{
  operation: 'full_strategy' | 'idea' | 'variation' | 'refine_short' | 'script' |
    'stories_day' | 'stories_week' | 'monetization_plan' | 'section' | 'attachment_ocr',
  idempotencyKey: UUID, businessId: UUID, strategyId?: UUID,
  input: UserInput, parameters: object, parentGenerationId?: UUID, retry?: boolean
}
```

`quote` retorna `{credits,totalCredits,wallet,availableAfter}`. `credits` é a
reserva adicional necessária: zero para tentativa já reservada/concluída.
`generate` retorna `{generation,wallet}`; `generation.versionId` identifica a
revisão persistida. `generation.output` é o resultado estruturado. Falhas retornam
`code` seguro; `creditsReleased` só é verdadeiro após confirmação de liberação.
Pedido concorrente retorna `pending:true`; cliente não deve interpretar como saída.

Estratégia completa usa a mesma chave e briefing original nas cinco etapas:
`idealCustomerProfile`, `monetizationIdeas`, `instagramBio`, `storiesStrategy`,
`final`. A última gera matriz, calendário e plano de ação. `parameters.stage`
escolhe etapa; `parameters.workspace` leva seleção, edições, plano de monetização
e agenda aprovados. Contexto e revisões anteriores ficam preservados. Alterar
briefing original exige nova operação; refino voluntário tem sua operação paga.

Primeira etapa reserva 20 créditos. Cada saída válida é persistida antes de
retornar; somente a etapa final confirma o débito único. Falha/cancelamento
libera a reserva, preservando resultados anteriores. Repetir com a mesma chave
e `retry:true` reabre reserva e reutiliza etapas concluídas. Cada etapa tem lease
de seis minutos, proteção contra conclusão tardia e contra worker antigo que
tente liberar a reserva de uma tentativa nova. Reserva abandonada expira em 24h,
reconciliada na próxima consulta/geração. Até três novos bundles por 24h, três
operações pendentes e doze novas operações/minuto por conta.

| Operação | Créditos |
| --- | ---: |
| Estratégia completa | 20 |
| Ideia, variação ou refino de item curto | 1 |
| Roteiro | 2 |
| OCR de imagem própria até 10MB | 2 |
| Stories do dia | 2 por bloco de até cinco |
| Stories da semana | 10 por bloco de até 35 |
| Plano de uma a três ideias de monetização | 5 |
| Regenerar bio, ICP, monetização, matriz, calendário, ação | 2, 3, 3, 5, 5, 3 |

Quantidade de Stories é calculada da agenda validada no servidor. Cliente não
pode informar custo menor. Tipos e limites de saída são validados antes de debitar.

`wallet` retorna `{wallet:{balance,reserved,available,allowance}}`.
`cancel` recebe `{generationId}`. A carteira piloto recebe 30 créditos uma única
vez e tem grants/reset administrativos idempotentes. Saldos e contratos legados
permanecem nas tabelas originais, sem conversão automática. Pacotes mensais
120/240, seus preços e sua renovação Stripe ainda não estão ativados: precisam
política de migração e período contratual antes da venda. Não anunciar ilimitado.

## Histórico, revisões e feedback

`history` recebe `{businessId?,generationId?,operation?,status?,from?,to?,limit?,offset?}`.
Limite padrão 30, máximo 200. Retorna `{generations,revisions,feedback,ledger,
page,pageSize,total,revisionsTotal,hasMore}`. Todos os filtros preservam proprietário.
Últimos parâmetros são persistidos antes de chamar o modelo, incluindo tentativa
que falhe. `generationId` recupera a origem de revisões antigas sem varrer páginas.

`saveRevision` recebe `{businessId,strategyId?,parentRevisionId?,kind,title,content}`,
com `kind` igual a `input`, `manual_edit`, `selection` ou `agenda`. Insere uma
revisão imutável e retorna `{revision,versionId}`. Conteúdo pode ser snapshot
`{input,strategy,workspace}`. Revisões de geração guardam a saída exata da etapa;
a origem fica em `generation_id`. Salvar edição manual não chama modelo.

`feedback` recebe `{versionId,contentId,rating,goal,published,publishedAt?,period?,
metrics?,notes?}` e retorna `{ok:true,feedback}`. Avaliação só pode apontar versão
da própria conta. Gerações futuras recuperam no máximo seis itens do mesmo negócio,
com orçamento total de 30 mil caracteres e preferência por até três avaliações
positivas e três demais. Só o conteúdo avaliado é incluído, não o briefing completo.
Publicação declarada e preferência pessoal têm marcadores diferentes.

## Administração de IA

`admin-api` mantém o controle de membro ativo. Ações:

- `getAiConfig {}` retorna `{active,revisions,tests,health,suggested}`.
- `listAiModels {provider}` consulta catálogo autenticado e retorna `{provider,models}`.
- `testAiModel {candidate}` faz pequena chamada real, com custo do provedor, e
  retorna `{test,success,code}`. Não expõe chaves ou corpo de erro do provedor.
- `applyAiConfig {models}` exige teste da configuração exata nas últimas 24h pelo
  admin atual, grava revisão e auditoria na mesma transação.
- `rollbackAiConfig {revision}` cria nova revisão com a configuração anterior;
  os modelos também precisam de teste recente. Não faz teste pago silencioso.

Candidate: `{provider:'openai'|'gemini',model,weight:1..100,
reasoning:'low'|'medium'|'high',inputPricePerMillion?,outputPricePerMillion?,
priceVerifiedAt?,priceExpiresAt?}`. A dupla desejada é `gpt-5.6-luna` e
`gemini-3.8-flash`. Não há modelo ativo inserido pela migração. Modelos futuros
precisam passar allowlist do adaptador, catálogo da conta e teste de saída.

Rotação 50/50 alterna modelos entre novas operações; replay não gira novamente.
Etapas do bundle mantêm modelo/configuração. Contingência ocorre só em limite
transitório/rede/5xx, no outro modelo da mesma revisão e sem segundo débito.
Erros de credencial, modelo inexistente ou pedido inválido não acionam fallback.

`grantCredits`/`resetUsage` exigem `idempotencyKey`, `userId` e `amount` (reset
padrão 30). Grants piloto não expiram. Reset não pode atravessar reserva ativa.
`listUsers.aiWallet` é `{balance,reserved,available}|null`. No overview, consumo
vem do ledger e custo estimado em USD vem de tokens/preço registrado em cada
etapa. Custos ausentes ficam `null`, com contagens de cobertura; fallback de
tentativa falha pode ter custo não conhecido. MRR não é inventado por tipo de plano.

## Verificação e limites

Testes locais cobrem transação, rollback, idempotência, concorrência lógica,
RLS, bloqueio de escrita legada, replay, preços, rotação e adaptadores/modelos
simulados. Eles não comprovam acesso atual às chaves nem qualidade de geração real.
PGlite serializa a conexão de teste; a prova adicional de concorrência distribuída
e corrida de requisições exige PostgreSQL/Edge reais na homologação.

Nenhuma chamada real a OpenAI/Gemini, deploy ou alteração remota foi executada por
este subtrabalho. Supabase inativo informado pelo coordenador impede homologação
autenticada até reativação. Cron de reconciliação não foi instalado; liberação de
reserva expirada é feita na próxima interação autenticada.
