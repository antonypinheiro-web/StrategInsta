# ThinkPost

Aplicacao de planejamento estrategico de Instagram. Primeiro piloto: empreendedores
planejando para o proprio negocio.
O projeto oficial fica em `F:\00.claude-code\projects\1.softwares--e--apps\strateg-insta`.
Esta pasta `app/` contem o codigo e o repositorio Git. Leia `../HANDOFF.md` para
retomar o trabalho sem confundir a versao local com a publicada.

Piloto aprovado e implementado localmente em 27/09/2026: onboarding/anexos,
matriz, Stories, gerador, histórico, revisões, carteira e modelos no admin.
100 testes, typecheck, Deno check e build passaram. A publicação ainda depende
de autorização; detalhes em [lote do piloto](docs/PILOTO-PUBLICACAO.md).

## Tecnologias

React, TypeScript, Vite, Tailwind CSS e componentes shadcn/ui.
Supabase para autenticacao, banco e Edge Functions. IA e Stripe passam pelo
servidor. O frontend nao deve conter Service Role nem chaves privadas de IA/pagamento.

## Desenvolvimento local

Use Node.js com suporte a execucao nativa de TypeScript nos testes e npm.

```sh
npm ci
npm run dev
```

O servidor local usa a porta 8080.

- `/app`: aplicativo real. Exige login e usa o backend configurado; pode consumir creditos.
- `/admin`: painel administrativo. Exige conta autorizada pelo servidor.
- `/tests/ui/briefing.html`: previa visual local. NAO gera estrategias nem consulta saldo real.

O frontend aponta para o projeto Supabase configurado em
`src/integrations/supabase/client.ts`. Confira o destino antes de testes com dados
reais. Nao copie chaves privadas para o codigo ou para arquivos versionados.

## Respostas preenchidas na previa

Na ultima etapa, use **Salvar briefing para o app real** e depois **Abrir app real**.
Entre na sua conta no mesmo navegador e no mesmo endereco local. Use
**Trazer respostas da previa**, confirme a importacao e revise antes de gerar.

A importacao so aparece em desenvolvimento e exige confirmacao. Nao gera
estrategia automaticamente nem altera permissoes. O rascunho da conta nao e
sobrescrito em disco pela importacao: use **Salvar e sair** depois de revisar.
Rascunhos ficam neste navegador; nao sincronizam com outro dispositivo ou com
o dominio publicado. Evite dados sensiveis. Fixtures nao entram no build final.

## Estrategias salvas

No briefing ou dashboard, abra **Estrategias salvas** para consultar resultados da
sua conta. Essa leitura nao gera IA nem usa creditos. O resultado completo e seu
historico sao recuperados do Supabase; rascunhos de briefing continuam locais.

## Verificacoes

```sh
npm run typecheck
npm run lint
npm test
npm run build
```

Os testes locais nao substituem validacao autenticada, teste de pagamentos nem
revisao de seguranca em producao. Pendencias e limites estao no HANDOFF e nas stories.

## Identidade e favicon

`public/favicon.svg` e a fonte do icone SI com o gradiente original.
`public/favicon.png` e `public/favicon.ico` sao versoes rasterizadas do mesmo icone.
Todos os HTMLs declaram explicitamente o favicon com uma versao de cache.

## Publicacao e backend

A hospedagem atual e Vercel. `npm run build` gera os artefatos em `dist/`;
publicar exige conferir o projeto, o ambiente e a autorizacao para producao.
Nao enviar `.env`, documentos internos ou credenciais no deployment.

As Edge Functions e migrations ficam em `supabase/`. O historico remoto de
migrations precisa ser reconciliado antes de um `db push`; nao reaplique o schema
base. Instrucoes administrativas: `docs/ADMIN-CONSOLE-DEPLOY.md`.

## Documentacao

- `docs/PRD.md`: escopo do produto.
- `docs/PLANO-PILOTO-EMPREENDEDORES.md`: requisitos, modelos, anexos, Stories e aceite do piloto.
- `docs/ARCHITECTURE.md`: arquitetura.
- `docs/stories/`: implementacoes, criterios e pendencias.
- `design-qa.md`: verificacao visual local do briefing.
- `../HANDOFF.md`: estado atual, riscos e proximos passos.

O historico Git e os registros de origem do projeto sao preservados. Nao sao
instrucoes vigentes de operacao ou publicacao.
