# ACCESS-001: Admin e usuario no mesmo cadastro

Data local: 05/09/2026; operacoes remotas em 06/09 UTC.
Atualizacao em 06/09/2026: backend, previa e producao publicados.

## Escopo aprovado

Antony confirmou seu email para admin e pediu a experiencia comum com o mesmo login.
Depois autorizou atualizar site e banco juntos. A ferramenta de deploy rejeitou
producao duas vezes, exigindo confirmacao adicional apos o aviso de substituicao
do site publico. Antony confirmou novamente apos o aviso, pedindo preservar
as mesmas cores e a identidade visual. Publicacao autorizada e concluida.

## Aceitacao

- [x] Conta existente confirmada e promovida explicitamente, sem novo cadastro.
- [x] Concessao registrada em admin_audit_logs na mesma transacao.
- [x] Plano free, uso 1 e zero concessoes extras preservados (readback SQL).
- [x] Link admin consulta autorizacao server-side; nenhuma permissao vem do botao.
- [x] Links abrem outra area sem descarregar o briefing atual.
- [x] Painel e lista de 3 usuarios verificados no navegador da previa autenticada.
- [x] Area comum verificada com link admin e uso 1/2.
- [x] Teste local: admin continua limitado ao proprio plano via RLS.
- [x] 24 testes; typecheck; lint zero erros/10 warnings; build aprovado.
- [x] Funcoes remotas sem login: admin/IA/checkout HTTP 401.
- [x] Webhook sem assinatura: HTTP 400; sem pagamento ou geracao de IA no teste.
- [x] Publicacao em producao READY e dominio principal vinculado.
- [x] Login publico abre; /app e /admin sem sessao redirecionam para /login.
- [ ] Repetir teste autenticado no dominio publico com login do usuario.
- [ ] Teste real das acoes de credito/plano/bloqueio com dados descartaveis autorizados.
- [ ] Escolha de proposta visual antes de substituir onboarding.

## Publicacoes

Supabase ativo e usado pelo codigo local e HEAD publicado: vqngekcjshfvssqjqgkp.
Projeto antigo uuotsgoqgdzrnyhvegvs permanece INACTIVE e intocado.
Vercel: strateginsta, prj_EyuJMOu8JZVuFNnMpJotCOGulODe.
Preview READY: dpl_9AkjpLrnYwWXj3qjprhNUvqqhok9.
URL: https://strateginsta-q8k2ibq7o-antony-pinheiros-projects.vercel.app
Producao READY: dpl_AkrX3jpMvuQRAaszjRLgrbsrQfTX.
Dominio confirmado no readback: https://strateginsta.vercel.app.
Mesmos nove artefatos da previa testada, sem alteracao de identidade visual.
Enviados apenas artefatos compilados de dist e vercel.json, sem .env ou documentos.
Configuracao static por deployment; preset do projeto continua vite no readback.

Migrations aplicadas via MCP, com timestamps remotos diferentes dos arquivos locais:

| Nome | Arquivo local | Versao remota |
| --- | --- | --- |
| admin_console | 20260505190000_admin_console.sql | 20260906023342 |
| billing_event_safety | 20260906002606_billing_event_safety.sql | 20260906023408 |
| protect_plan_fields | 20260906003602_protect_plan_fields.sql | 20260906023524 |

Nao rodar db push sem reconciliar esse historico; nao reaplicar schema completo.
Funcoes publicadas: admin-api v2, call-ai v8, create-checkout-session v17,
stripe-webhook v17. Somente webhook tem verify_jwt=false: assinatura no handler.

## Incidente de coordenacao resolvido

O deploy de producao foi negado, mas a chamada SQL seguinte na mesma orquestracao
aplicou protect_plan_fields. O site antigo usa select('*') e INSERT de campos
agora proibidos. Apos nova autorizacao explicita, os mesmos artefatos da previa
foram publicados em producao, encerrando a divergencia conhecida de versoes.
Nenhuma protecao foi desfeita para contornar o bloqueio da ferramenta.
Em futuros lotes, interromper a sequencia imediatamente se o deploy for negado.

## Riscos remanescentes

SEC-002 ainda necessario: frontend pode alterar strategies_used e period_start.
Nao ha contabilidade atomica por geracao. Billing exige teste Stripe test-mode.
Logs do admin ainda nao sao atomicos com todas as mutacoes. Dashboard possui
estimativas, nao faturamento/custo real certificado. Nao pronto para abrir vendas.

## Arquivos desta etapa

- src/components/AccountViewSwitch.tsx
- src/pages/Index.tsx
- src/pages/Admin.tsx
- tests/billing-database.test.mjs
- vercel.json
- docs/stories/ACCESS-001-admin-e-usuario.md
- docs/ADMIN-CONSOLE-DEPLOY.md
- ../HANDOFF.md

## Design

Tres propostas exibidas no chat, ainda sem selecao. Nao implementadas.
Ordem exibida: Briefing Editorial; Estudio de Estrategia; Mapa do Cliente.
Orientacao posterior: preservar logo, cores, gradientes e identidade atuais.
As paletas alternativas nao foram aprovadas. Adaptar a organizacao do briefing
guiado a identidade original antes de substituir o onboarding.
Preservar objetivo: briefing de cliente -> estrategia Instagram revisavel/executavel.
Nao transformar em CRM/agendador ou aumentar formulario por persuasao artificial.
