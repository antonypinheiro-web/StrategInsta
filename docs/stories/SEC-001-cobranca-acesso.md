# SEC-001: Seguranca de cobranca e acesso

Data: 2026-09-05. Status: implementado e verificado localmente; publicacao pendente.

## Escopo aprovado

Avancar nos ajustes da auditoria, preservando trabalho local existente. Este lote
trata webhook Stripe, autorizacao admin, retorno de checkout e testes. Nao publica
deploy nem aplica SQL remoto. Supabase inicialmente INACTIVE, restaurado por
Antony durante a etapa; consultas de schema/permissoes voltaram a funcionar.

## Aceitacao

- [x] Webhook verifica assinatura oficial, tolerancia temporal e corpo original.
- [x] Evento repetido nao reaplica plano, log ou reset de consumo.
- [x] Eventos antigos nao restauram assinatura cancelada ou substituida nos cenarios testados.
- [x] Falha no banco permite reentrega sem efeitos parciais.
- [x] Usuario comum, admin revogado e role incorreta nao passam na funcao de autorizacao testada.
- [x] Checkout valida origens e nao escreve plan_type ao criar customer.
- [x] Interface nao anuncia pagamento confirmado apenas pela URL.
- [x] Salvamento com erro nao fecha dialogo nem incrementa uso, validado com fixture UI.
- [x] Campos de plano, bloqueio, Stripe e notas protegidos por grants locais testados.
- [x] Cliente nao consegue forjar eventos de assinatura nos testes de RLS.
- [x] lint, typecheck, testes e build executados com resultados no relatorio do lote.
- [ ] Aplicar migrations e publicar frontend/Edge Functions de forma coordenada.
- [ ] Provisionar email admin explicitamente aprovado e testar login admin/usuario comum real.
- [ ] Executar ciclo Stripe test-mode ponta a ponta com reentrega real.

## Fora deste lote

Cota atomica por estrategia e consumo de bonus, fechamento da escrita legada de
strategies_used/period_start, logs atomicos das demais acoes admin, metricas financeiras reais,
prompts/metodologia, anexos e validacao de mercado. O app NAO fica pronto para
venda apenas com este lote. Nao aplicar bloqueio de escrita de user_plans sem
substituir o fluxo legado do cliente e da IA.

## Arquivos

- package.json e package-lock.json
- tsconfig.security.json e tailwind.config.ts
- src/components/SessionContextProvider.tsx e InputDialog.tsx
- src/components/StrategyDashboard.tsx
- src/components/strategy/IdealCustomerProfileDisplay.tsx
- src/components/ui/command.tsx e textarea.tsx
- src/hooks/usePlan.ts e src/pages/Index.tsx
- src/lib/complete-strategy-save.ts e src/services/geminiService.ts (lint)
- supabase/config.toml e supabase/functions/deno.json, deno.lock
- supabase/functions/_shared/admin-auth.ts, billing.ts, checkout-policy.ts
- supabase/functions/admin-api/index.ts
- supabase/functions/stripe-webhook/index.ts
- supabase/functions/create-checkout-session/index.ts
- supabase/migrations/20260906002606_billing_event_safety.sql
- supabase/migrations/20260906003602_protect_plan_fields.sql
- tests/security.test.mjs, billing-database.test.mjs, strategy-save.test.mjs
- tests/ui/dialog.html e dialog.tsx
- docs/ADMIN-CONSOLE-DEPLOY.md e SEGURANCA-LOTE-1-2026-09-05.md
- docs/stories/SEC-001-cobranca-acesso.md
- ../HANDOFF.md (continuidade, fora do Git app/)

Demais modificacoes que ja existiam foram preservadas. Nenhum commit/push efetuado.
