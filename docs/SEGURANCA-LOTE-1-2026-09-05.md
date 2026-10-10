# StrategInsta: seguranca, lote 1

Data local: 05/09/2026, America/Sao_Paulo. Migrations geradas pela CLI em UTC
06/09/2026. Executor: Codex, coordenacao codex-master, revisao security e Supabase.

## Resultado

Correcoes locais implementadas. NENHUMA migration aplicada ao Supabase, nenhum
deploy, commit ou push. Este lote nao torna o app pronto para lancamento.

## O que mudou

- Webhook usa Stripe SDK 22.6.1 com assinatura do corpo original, tolerancia de
  300 segundos e suporte a rotacao de assinaturas. Payload invalido: 400;
  falha de processamento: 500 para permitir reentrega.
- Nova RPC `apply_stripe_billing_event`: plano, recibo unico por event.id e log
  de uso na mesma transacao. Falha de log desfaz o conjunto. Nao zera creditos
  nem periodo. Historico separado e privado impede reaplicar eventos antigos
  de assinatura cancelada/substituida nos cenarios testados. Consulta Stripe
  novamente antes de aplicar o estado, em vez de confiar no snapshot do evento.
- `stripe_webhook_events` e `stripe_billing_state` sao inacessiveis a anon e
  authenticated. RPC apenas service_role, com search_path fixo.
- Configuracao libera JWT apenas no webhook, mantendo validacao Stripe interna.
  Demais funcoes continuam com JWT. Dependencias fixadas no import map explicito.
- Admin exige membro ativo com role admin e user_id correspondente. Nao ha
  bootstrap por ADMIN_EMAILS; revogacao nao e revertida no proximo login.
- Checkout valida origens de retorno, verifica erros no banco, rejeita conta
  bloqueada, usa idempotencia na criacao de customer e nao redefine plano como
  free ao salvar stripe_customer_id. Nao implementa ainda trava transacional
  para varias sessoes de checkout ou troca de assinaturas.
- Protecao por coluna impede usuario de alterar plano, bloqueio, identificadores
  Stripe e observacoes internas. Insercao de plano pelo cliente somente user_id,
  demais valores usam defaults. Leitura nao inclui notas. RLS continua isolando
  usuarios. Escrita legada de strategies_used/period_start permanece TEMPORARIA.
- Telemetria do cliente nao pode registrar subscription_created/cancelled,
  payment_failed, generation_completed nem simular source=stripe_webhook.
- Removido fallback local de cota em erro de banco; geracao fica indisponivel
  com mensagem de erro, em vez de assumir credito livre. Isso nao corrige a
  ausencia de debito na funcao call-ai, que permanece prioridade SEC-002.
- Login usa INITIAL_SESSION da mesma assinatura de Auth, com unsubscribe correto
  e telemetria fora do callback sincrono. Retorno checkout=success nao significa
  mais que assinatura foi ativada.
- Dialogo aguarda salvamento, bloqueia cliques enquanto pendente e preserva
  formulario no erro. Salvar com nome padrao percorre o mesmo fluxo. UUID de
  estrategia reutilizado nas tentativas da mesma sessao para evitar duplicata
  de salvamento. Save e debito AINDA nao sao uma transacao unica; resposta de
  rede ambigua no debito e multiplas abas exigem o novo ledger do servidor.
- Corrigidos os 12 erros de lint. Dependencias atualizadas dentro das faixas
  compativeis, sem `--force`: alertas npm cairam de 21 para 4.

## Verificacoes

- `npm test`: 23 testes aprovados, sem rede de cobranca e sem IA paga.
- PGlite 0.5.8 executa PostgreSQL real em memoria com schema documentado, roles
  simuladas, RLS e as duas migrations. Verifica grants, isolamento, repeticao,
  eventos antigos, falha de log com rollback e reentrega. Nao e Supabase Auth
  completo nem prova de concorrencia multi-conexao de producao: PGlite serializa
  operacoes. O SQL usa row lock e chave unica; teste multi-conexao fica pendente.
- `npm run typecheck`: frontend e modulos compartilhados aprovados.
- Deno 2.9.6 check: stripe-webhook, admin-api e create-checkout-session aprovados.
  A verificacao nao equivale a execucao no Edge Runtime hospedado.
- `npm run lint`: zero erros, 10 avisos remanescentes de Fast Refresh.
- `npm run build`: aprovado, Vite 5.4.21; bundle principal ~1.058 kB, gzip ~291 kB.
  Aviso de tamanho continua e pede separacao de chunks em etapa propria.
- Navegador local: landing carrega; `/admin` sem sessao redireciona a `/login`;
  login verificado em 390x844. Nao foi realizado login em conta real.
- Fixture `/tests/ui/dialog.html`: erro preserva dialogo/nome e contadores 0/0;
  botao nome padrao no caso de sucesso fecha dialogo e exibe 1/1. Fixture local,
  fora da entrada do build de producao, nao escreve em Supabase/Stripe.
- Requisitos dos testes: Node com remocao nativa de tipos TS (22.18+; usado 26.1).

## Estado remoto confirmado nesta etapa

Antony restaurou o projeto `vqngekcjshfvssqjqgkp`. Consultas SQL voltaram a
responder. Foram encontrados 3 usuarios Auth e 2 planos; nenhum plano com
stripe_customer_id ou stripe_subscription_id preenchido. Isso NAO prova ausencia
de contratos no Stripe; reconciliacao financeira ainda precisa consultar Stripe.

O schema publico consultado possui user_plans e strategies. Nao ha admin_users,
usage_events ou credit_grants. O historico de migrations retornou vazio. As
policies e grants reais confirmam INSERT/UPDATE amplos no proprio user_plans.
A exposicao de elevacao de plano deixou de ser apenas suspeita do schema local.

Advisors adicionais: search_path mutavel de update_updated_at_column, schema
GraphQL descobrivel e protecao contra senhas vazadas desabilitada. A migration
local fixa search_path e revoga acesso anon. Descoberta de nomes de tabelas por
usuario autenticado nao prova vazamento de linhas; RLS precisa permanecer.
Ver [search_path](https://supabase.com/docs/guides/database/database-linter?lint=0011_function_search_path_mutable),
[GraphQL anon](https://supabase.com/docs/guides/database/database-linter?lint=0026_pg_graphql_anon_table_exposed)
e [protecao de senhas](https://supabase.com/docs/guides/auth/password-security#password-strength-and-leaked-password-protection).

## Publicacao segura, ainda pendente

1. Confirmar email do primeiro admin e existencia/identidade da conta Auth.
2. Reconciliar historico vazio de migrations com o schema base existente. Nao
   executar o schema completo nem `db push` sem essa verificacao.
3. Em janela aprovada, aplicar admin_console de maio e billing_event_safety.
4. Publicar frontend atualizado e protect_plan_fields na mesma janela. A leitura
   `select('*')` e INSERT com campos extras do frontend antigo deixam de funcionar.
5. Publicar funcoes com config.toml/import map, configurar origens exatas de
   checkout, confirmar prices/secrets em test-mode e provisionar admin autorizado.
6. Verificar readback de policies/grants, advisors, login admin/usuario comum,
   webhook Stripe real de teste e reentregas. Nao testar com cobranca real.

## Ainda bloqueia lancamento

- SEC-002: unidade estrategia, reserva/debito/estorno atomicos, repeticao e
  concorrencia, consumo/expiracao de bonus, refinamentos e limites por servidor.
  Retirar UPDATE legado de strategies_used/period_start so com esse fluxo pronto.
- Migracao base reproduzivel e testes de Auth/Edge/Stripe completos.
- Logs atomicos das demais acoes admin, erros ignorados em operacoes antigas,
  busca/paginacao e metricas honestas, sem custo IA inventado.
- Quatro alertas npm: Vite/esbuild e React Router. Solucao sugerida pelo npm exige
  major upgrade; nao executado automaticamente. Ver audit antes da migracao de
  versoes. Servidor dev foi limitado a 127.0.0.1, nao exposto na rede.
- Prompts arbitrarios em call-ai, templates silenciosos, promessas de anexos,
  white label/API/multiperfil/premium nao entregues e depoimentos sem evidencia.
- Onboarding, qualidade do metodo, privacidade e validacao de demanda continuam
  fora deste lote tecnico. Landing ainda contem as promessas antigas.

## Retificacao da auditoria anterior

O handler `handleNameStrategySkip` existia, mas nao estava ligado ao botao.
Na interface anterior, o botao apenas fechava o dialogo. Portanto, o texto
anterior que descrevia esse botao como caminho normal de salvamento sem debito
era impreciso. O problema real de interface e o handler desconectado foram
corrigidos neste lote. A falta de debito autoritativo em call-ai permanece.

## Referencias tecnicas

- [Webhooks Stripe](https://docs.stripe.com/webhooks)
- [Autenticacao de Edge Functions](https://supabase.com/docs/guides/functions/auth)
- [Dependencias e import map](https://supabase.com/docs/guides/functions/dependencies)

O endpoint changelog.md do Supabase nao foi recuperado nesta sessao: web recusou
content-type e PowerShell falhou TLS. Documentacao oficial atual foi consultada;
nao alegar revisao completa do changelog.
