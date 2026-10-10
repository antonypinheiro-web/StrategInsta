# StrategInsta 2.0 - Deploy do Admin Console

Este checklist serve para ativar o Admin Console no Supabase com seguranca.

> Atualizacao: banco, funcoes e preview publicados em 06/09/2026 UTC.
> Producao Vercel publicada apos confirmacao adicional: dpl_AkrX3jpMvuQRAaszjRLgrbsrQfTX.
> Estado atual, validacoes e riscos remanescentes:
> `stories/ACCESS-001-admin-e-usuario.md`. O roteiro abaixo e historico;
> nao reaplicar migrations ja registradas.

## O que ja esta pronto no codigo

- Rota `/admin` no frontend.
- Edge Function `admin-api` para acoes administrativas.
- Logs administrativos em `admin_audit_logs`.
- Eventos de uso em `usage_events`.
- Creditos extras em `credit_grants`.
- Bloqueio de usuario em `user_plans.is_blocked`.

## Passo 1 - Confirmar projeto Supabase

No painel do Supabase, confirme que voce esta no projeto certo do StrategInsta.

O cliente atual usa a URL em `src/integrations/supabase/client.ts`.
Projeto confirmado: `vqngekcjshfvssqjqgkp`. Nao imprimir chaves nos logs.

## Passo 2 - Aplicar schema

Opcao simples pelo painel:

1. Abra Supabase.
2. Va em SQL Editor.
3. Crie uma nova query.
4. Cole o conteudo de `supabase/migrations/20260505190000_admin_console.sql`.
5. Clique em Run.

Opcao via CLI, se a Supabase CLI estiver configurada:

```powershell
npx supabase link --project-ref SEU_PROJECT_REF
npx supabase db push
```

Nao executar `db push` as cegas: o banco tem schema base criado manualmente e
historico MCP com timestamps diferentes dos arquivos locais. Reconciliar antes. Apos a migration
admin, aplicar `20260906002606_billing_event_safety.sql`. A migration
`20260906003602_protect_plan_fields.sql` exige publicar o frontend atualizado
na mesma janela, pois o frontend antigo usa `select('*')` e campos de INSERT
que passarao a ser proibidos. Nao reaplicar `docs/supabase-schema.sql` em producao.

## Passo 3 - Configurar secrets das Edge Functions

A Edge Function `admin-api` precisa destas variaveis no Supabase:

- `SUPABASE_URL`
- `SUPABASE_SERVICE_ROLE_KEY`

O bootstrap por `ADMIN_EMAILS` foi REMOVIDO. Um email listado anteriormente nao
cria nem reativa permissao. Confirmar com Antony o email da conta, localizar
essa conta no Auth e provisionar explicitamente `admin_users` com role `admin`
e active `true`, registrando quem autorizou. Nao presumir email pelo GitHub.
Reativacao de membro revogado exige nova autorizacao explicita.

O checkout usa `APP_ALLOWED_ORIGINS`, com origens exatas separadas por virgula.
Padrao: `https://strateginsta.vercel.app`. Preview e localhost devem ser
autorizados explicitamente; nao usar wildcard. Nunca incluir segredos no frontend.

## Passo 4 - Publicar Edge Functions

Funcoes que precisam estar publicadas:

Somente apos validacao e aprovacao da janela de publicacao. `config.toml` fixa
`verify_jwt=false` APENAS no stripe-webhook; o handler exige assinatura Stripe.
O import map explicito fixa Stripe e Supabase. Nao usar `--no-verify-jwt` no admin.

```powershell
npx supabase functions deploy admin-api
npx supabase functions deploy call-ai
npx supabase functions deploy stripe-webhook
npx supabase functions deploy create-checkout-session
```

## Passo 5 - Teste de aceitacao

1. Crie ou acesse sua conta no app.
2. Abra `/admin`.
3. Confirme que voce consegue ver o painel.
4. Entre com um usuario comum e confirme que ele nao acessa `/admin`.
5. Como admin, conceda creditos extras a um usuario.
6. Confirme que os creditos aparecem no limite do usuario.
7. Altere o plano manualmente.
8. Confirme que a acao aparece em Logs.

## Observacao importante

A Service Role nunca deve ir para o frontend. Ela deve ficar apenas nos Secrets do Supabase.
