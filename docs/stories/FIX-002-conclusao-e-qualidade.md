# FIX-002: conclusão, recuperação e base de qualidade do piloto

Data: 10/09/2026. Executor: Codex direto, rota codex-master + investigação
sistemática + Supabase. Sem subagentes, push, deploy ou migration nesta entrega.
Status: correção de save validada com backend real; melhorias de geração locais,
aguardando nova geração autenticada para homologação de qualidade.

## Problema e causa

Antony concluiu a geração, mas Salvar e Pular no diálogo de nome falhavam. O INSERT/
upsert de strategies já havia sido concluído. A falha posterior vinha do UPDATE
de user_plans com retorno de representação: erro 42501, permission denied for
table user_plans. Os grants são por coluna e não autorizam SELECT da chave id.
O retorno inferido pelo PostgREST pode incluir essa chave. Diagnóstico confirmado
por UI, inspeção de permissões e regressão SQL com colunas protegidas.

Mudança: UPDATE com retorno mínimo e count exact, CAS com user_id/uso anterior,
exigindo exatamente uma linha alterada. Criar plano também passou a INSERT sem
representação, seguido de leitura explícita das colunas autorizadas. Não ampliar
SELECT, não silenciar falha, não pular contabilização. Mensagens ao usuário não
exibem payload, credenciais nem erro bruto do provedor.

## Evidências

- Save real concluiu no app local autenticado; registro
  `7a16493c-6eab-4d68-9a4a-9e187af990a7`, nome `Teste 09-09-2026`, sete seções.
- Uma linha para esse ID após repetição; uso da conta foi de 1 para 2.
- Reabertura após recarga via Estratégias salvas; crédito continuou em 2.
- Briefing real permaneceu no navegador, sem substituição por dados de QA.
- Botão de nome padrão usa o mesmo caminho de conclusão. Falha simulada mantém
  nome editável e diálogo; sucesso na fixture fechou o diálogo com um salvamento
  e um débito simulados. Nenhum crédito real consumido por esse teste.
- Leitura de call-ai v8 e usage_events: Gemini preview indisponível, fallback
  OpenAI seguido de sucesso. Nome efetivo da resposta OpenAI não registrado;
  gpt-4o-mini é o default do código, sujeito a OPENAI_MODEL.

## Checklist

- [x] Reproduzir fronteira persistência/contabilização e corrigir causa sem ampliar grants.
- [x] Regredir retorno de PK protegida, count ausente/zero e erro de permissão.
- [x] Recuperar estratégia da própria conta, restaurando datas do histórico.
- [x] Rejeitar objeto salvo malformado e consulta para dono diferente.
- [x] Formatar ICP, monetização e bio com React seguro, sem HTML executável.
- [x] Reorientar prompts a evidência, concisão e hipótese explícita.
- [x] Gerar ativos finais após revisão, usando contexto anterior e retendo etapas prontas.
- [x] Remover quatro fallbacks genéricos; validar estrutura e quantidades do JSON.
- [x] Testar parsing com delimitadores em strings, dados incompletos e dias duplicados.
- [x] Testar contexto sequencial, retomada e descarte de resultado final cancelado.
- [x] Adaptar linguagem do briefing ao empreendedor e esclarecer limite atual do @.
- [x] Retirar status operacional fictício das integrações no admin.
- [x] Documentar próximos fluxos e atualizar PRD/README/HANDOFF.
- [x] 43 testes automatizados aprovados; typecheck e build aprovados.
- [x] Lint: zero erros, dez avisos FastRefresh preexistentes.
- [ ] Nova geração real com prompts/pipeline alterados e comparação de qualidade.
- [ ] SEC-002: ledger atômico por operação e retirada de UPDATE de uso/período do cliente.
- [ ] Publicação do lote aprovado e validação no domínio publicado.

## Limites

O save e o débito ainda são operações separadas. O CAS protege a tentativa atual,
mas não cria idempotência durável por estratégia entre recargas/abas ou estorno.
SEC-002 continua aberto. Reabrir um registro antigo não revalida seu conteúdo.
Não houve nova chamada de IA executada pelo agente após mudar os prompts. O saldo
da conta está em 2/2; não houve concessão ou reset de créditos.

Seleção de ideias/plano derivado, Stories com rotina e continuidade, anexos e
seletor de modelos no admin ainda não implementados. Requisitos e aceites em
PLANO-PILOTO-EMPREENDEDORES.md. Não tratá-los como recursos liberados.

Testes e build inicialmente encontraram spawn EPERM na sandbox Windows e foram
reexecutados em contexto autorizado. Bundle continua acima de 500 kB. Nenhuma
migration ou mudança remota de modelo/grant foi aplicada para resolver o save.

## Arquivos deste lote

- src/hooks/usePlan.ts
- src/lib/legacy-plan-usage.ts
- src/lib/saved-strategy.ts
- src/lib/strategy-output.ts
- src/lib/final-strategy-assets.ts
- src/components/InputDialog.tsx
- src/components/ui/dialog.tsx
- src/components/SavedStrategiesDialog.tsx
- src/components/OnboardingWizard.tsx
- src/components/StrategyDashboard.tsx
- src/components/strategy/StrategyText.tsx
- src/components/strategy/IdealCustomerProfileDisplay.tsx
- src/components/strategy/InstagramBioDisplay.tsx
- src/components/strategy/MonetizationIdeasDisplay.tsx
- src/pages/Index.tsx
- src/pages/Admin.tsx
- src/services/aiService.ts
- tests/plan-usage.test.mjs
- tests/billing-database.test.mjs
- tests/saved-strategy.test.mjs
- tests/strategy-output.test.mjs
- docs/PLANO-PILOTO-EMPREENDEDORES.md
- docs/PRD.md
- docs/stories/FIX-002-conclusao-e-qualidade.md
- README.md
- ../HANDOFF.md

Muitas alterações anteriores permanecem no working tree. Esta lista não implica
autoria de todo diff contra HEAD f92cdc8.
