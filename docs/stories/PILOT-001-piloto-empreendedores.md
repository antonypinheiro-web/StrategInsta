# PILOT-001: piloto para empreendedores

Status: publicada em produção; homologação real bloqueada por sessão admin
indisponível no navegador atual, 27/09/2026. Plano rev1.1 aprovado por Antony.

## Resultado esperado

Uma conta gera e revisa uma estratégia contextualizada, consulta todas as versões,
escolhe monetização, trabalha a matriz 5×4 e Stories por rotina. Toda geração de IA
tem custo visível, reserva e consumo idempotentes no servidor. Edições manuais não
cobram. Admin testa modelos e ativa uma configuração versionada.

## Escopo de execução

- Backend: ledger, operação idempotente, versões e feedback, adapters de modelos,
  configuração administrativa e migrations isoladas. Sem reaplicar migrations antigas.
- Conteúdo: matriz, roteiros, Stories, monetização, bio e edições limitadas.
- Onboarding: perguntas progressivas, medição declarada, anexos privados revisados.
- Integração: jornada completa, histórico global, cotação, admin e persistência ativa.

## Critérios de aceite

- [x] Histórico implementado durante onboarding e geração, com versões, extrato e paginação.
- [x] Fluxo completo usa ledger; não atualiza consumo pelo navegador.
- [x] Repetição, concorrência, falha e cancelamento não duplicam débito nos testes SQL.
- [x] Outputs inválidos são rejeitados pelas validações de estrutura e escopo.
- [x] Escolhas de monetização e edições entram nas etapas seguintes, com regressão.
- [x] Matriz e Stories levam ao gerador com origem e custo.
- [x] Feedback vinculado à versão; publicação e preferência têm campos distintos.
- [x] Uploads implementados com limites, políticas privadas testadas e revisão de fontes.
- [x] Implementada exigência de teste antes da ativação e registro do modelo por operação.
- [x] Typecheck, Deno check, lint, 100 testes e build completos.
- [x] UI local revisada com fixture sintética em desktop e recorte móvel.
- [x] Migrations e funções publicadas no Supabase; frontend `main` e deployment
  Vercel READY em `strateginsta.vercel.app`.
- [x] 75 arquivos do piloto publicados, sem alterações de checkout/preços e sem
  migrations divergentes.
- [ ] Ativação e geração real com ambos os modelos usando as chaves do app.
- [ ] Homologação autenticada com backend implantado e dois briefings diferentes.

## Evidências e limites

Readback de 27/09/2026: projeto `vqngekcjshfvssqjqgkp` ACTIVE_HEALTHY; migrations
do piloto 20260927193259 e 20260927194604, call-ai v9, admin-api v3. A conta admin
histórica está ativa no banco, mas a sessão atual do navegador não tem permissão.
Vercel `dpl_8djmSK2ZSGQErYGpe76xgQrNPAgL` READY no domínio de produção. Não houve
teste real dos modelos nem geração com briefing real; fixture não prova essas saídas.
HTML/JS/CSS de produção responderam HTTP 200 e o Vercel não reportou erros de
runtime nos últimos 30 minutos. Revisão visual no browser continua pendente.

Resultados, limitações e lote remoto concreto: `docs/PILOTO-PUBLICACAO.md`.
Lint sem erros e dez avisos preexistentes; build mantém aviso de bundle acima de
500 kB. A liberação para usuários reais depende da homologação autenticada.

Modelos e preços de referência consultados em 27/09/2026:
- https://developers.openai.com/api/docs/models/gpt-5.6-luna
- https://ai.google.dev/gemini-api/docs/latest-model

Catálogo não prova acesso pelas chaves do app. Testes de acesso ficam no admin;
ativação 50/50 depende dos dois testes reais passarem.

## Arquivos do lote

- `src/pages/PilotIndex.tsx`, `src/App.tsx`
- `src/services/pilotService.ts`, `src/services/adminService.ts`
- `src/components/PilotHistoryDialog.tsx`, `src/components/AdminModelSettings.tsx`
- `src/pages/Admin.tsx`, `src/types/admin.ts`, `src/lib/saved-strategy.ts`, `src/lib/pilot-revisions.ts`
- `src/components/workspace/*`, `src/types/workspace.ts`
- `src/components/OnboardingWizard.tsx`, `src/components/briefing/*`
- `src/lib/briefing.ts`, `src/lib/attachments.ts`, `src/types/briefing.ts`, `src/services/briefingAttachmentService.ts`
- `src/integrations/supabase/client.ts` exporta a URL pública para upload TUS.
- `supabase/functions/call-ai/index.ts`, `supabase/functions/admin-api/index.ts`
- `supabase/functions/_shared/pilot-*.ts`, migrations de ledger e anexos
- Testes específicos e fixtures do piloto em `tests/`.
- `docs/PILOTO-PUBLICACAO.md`, `docs/BACKEND-PILOTO-CONTRATO.md`, plano, PRD,
  README, BUSINESS-MODEL e HANDOFF/checkpoint de continuidade.

Commit de publicação: `bc8a55bc649681a735eb4505182073d37d2b2e08`. Working tree local
mantém mudanças anteriores e arquivos internos fora desse commit; não os limpar
nem presumir que pertençam ao lote remoto.
