# Lote do piloto para publicação

Preparado em 27/09/2026. Plano aprovado por Antony e lote remoto autorizado e
publicado. Homologação autenticada permanece pendente de sessão admin válida.

## Estado verificado

- Supabase `vqngekcjshfvssqjqgkp`: ACTIVE_HEALTHY na leitura final de 27/09.
  No início da rodada estava INACTIVE; nenhuma reativação foi feita pelo agente.
- Funções remotas após publicação: call-ai v9 e admin-api v3, ambas com
  `verify_jwt: true`; checkout e webhook permaneceram v17.
- Migrations remotas incluem as três antigas mais `pilot_generation_ledger`
  20260927193259 e `private_briefing_files` 20260927194604. Duas novas tabelas,
  bucket privado e políticas foram confirmados por readback SQL.
- Nenhuma chamada real de IA foi executada, nenhum modelo foi testado/ativado e
  nenhuma concessão nova de créditos ou alteração de preço/Stripe foi feita.
- GitHub `main`: commit `bc8a55bc649681a735eb4505182073d37d2b2e08`, 75 arquivos
  delimitados ao piloto; checkout/preços, migrations divergentes, fixtures,
  backups e documentos internos foram excluídos.
- Vercel: deployment `dpl_8djmSK2ZSGQErYGpe76xgQrNPAgL`, commit acima, READY,
  production, alias `strateginsta.vercel.app`, projeto
  `prj_EyuJMOu8JZVuFNnMpJotCOGulODe`.
- Smoke HTTP via Vercel: HTML e assets JavaScript/CSS retornaram 200; consulta de
  erros de runtime não encontrou ocorrências nos últimos 30 minutos. Inspeção
  visual no browser não foi possível nesta sessão.
- Código das funções atuais preservado localmente e relido em
  `work/pilot-release-2026-09-27/call-ai-before.json` e `admin-api-before.json`,
  incluindo imports e `verify_jwt: true`. A pasta é evidência de recuperação e
  está excluída do Git; não a remover na limpeza da tarefa.

## Lote publicado e homologação restante

1. Aplicadas somente as duas migrations novas no projeto atual. O lote cria a
   carteira, registro de operações, revisões, feedback, configuração de modelos,
   anexos e bucket privado `briefing-files`. Também retira do cliente a alteração
   direta de consumo; a contabilização passa pelas funções do servidor.
2. Publicadas `call-ai` v9 e `admin-api` v3 com os módulos `_shared/pilot-*.ts` e
   imports necessários. `verify_jwt` e autenticação/autorização internas preservadas.
3. Publicado frontend via commit restrito em `main`; Vercel terminou READY no
   domínio de produção. Não executar `db push`: os nomes das migrations remotas
   diferem dos timestamps locais. Lockfiles npm e pnpm foram sincronizados.
4. No admin, ainda testar os IDs `gpt-5.6-luna` e `gemini-3.8-flash` usando as chaves já
   configuradas no servidor. Somente após cada teste passar, ativar pesos 50/50
   e configuração versionada. A consulta de catálogo não comprova acesso.
5. Após conseguir uma sessão admin válida, homologar dois briefings distintos:
   sequência completa,
   salvar nome informado/automático, recarregar/reabrir, refinar um item,
   comparar versões, avaliar, consultar extrato, testar anexo privado e
   isolamento entre duas contas. As chamadas reais geram custo de provedor e
   consumo na carteira de teste; registrar os valores medidos.

O frontend e backend foram publicados nesta janela. O próximo passo depende de
Antony entrar no endereço de produção com a conta admin ativa no Supabase e avisar
quando o painel estiver aberto. A aba atual não tem essa permissão. Não pedir
senha/token; não marcar modelos ou briefing como testados antes do readback real.

## Recuperação

As funções anteriores foram exportadas. Se a homologação falhar,
interromper a liberação e preservar dados, versões e extrato. Qualquer reversão
de permissões precisa ser revista junto da versão restaurada; não apagar as
novas tabelas ou registros como forma de rollback.

## Limites comerciais e de produto

- Carteira piloto: 30 créditos iniciais, uma única vez. Estratégia completa: 20.
  Edição manual e consulta: 0. IA usa cotação/reserva/consumo no servidor.
- 120/240 são cenários de ofertas, sem renovação mensal nem alteração de
  contratos, preços ou checkout neste lote. Homologar Stripe test-mode antes
  de oferecer uma nova assinatura; não converter planos antigos silenciosamente.
- Modelos ativos só mudam depois de teste e ativação no painel. Todos os pedidos
  de uma estratégia mantêm o modelo selecionado, salvo fallback transitório
  registrado, sem segunda cobrança de créditos pela mesma operação.
- O @ continua como referência para a medição declarada. O app não consulta
  métricas do Instagram nem usa MCP/Meta nesta entrega.
- Arquivos: 50 MB/documento, 10 MB/imagem, 100 MB e cinco arquivos por briefing.
  Texto extraído fica limitado explicitamente; PDF escaneado requer imagem/OCR
  ou descrição manual. OCR usa IA e custa 2 créditos no piloto.
- Qualidade de ICP, copy e estratégias precisa de avaliação humana de saídas
  reais. Schemas e prompts reduzem falhas; não comprovam ausência de invenções.

## Verificações locais

- `npm test`: 100/100 passaram antes da publicação, incluindo SQL real em PGlite, concorrência,
  idempotência, falha/estorno, privacidade, anexos e versionamento.
- `npm run typecheck`: passou para frontend e módulos compartilhados.
- `npx --yes deno check --config supabase/functions/deno.json
  supabase/functions/call-ai/index.ts supabase/functions/admin-api/index.ts`:
  passou após correções de nulidade.
- `npm run lint`: zero erros; dez avisos Fast Refresh preexistentes.
- `npm run build`: passou. Bundle principal 919,74 kB, gzip 272,34 kB; permanece
  o aviso de tamanho acima de 500 kB. Bibliotecas de leitura carregam sob demanda.
- `git diff --check`: passou; Git informa normalização LF/CRLF no Windows.
- Prévia sintética: onboarding em cinco etapas, matriz 5x4, roteiro a partir de
  ideia, edição manual sem consumo, seleção antes do plano de monetização,
  bios, bloqueio de edição em consulta e layout móvel de 390 px.

As fixtures não autenticam, não chamam IA e não comprovam persistência remota.
