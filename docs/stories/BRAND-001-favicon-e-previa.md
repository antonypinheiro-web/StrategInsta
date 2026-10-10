# BRAND-001: Identidade e encaminhamento da previa

Data: 06/09/2026. Status: implementado localmente; teste autenticado pendente.

## Pedido e causa

Antony autorizou limpar os residuos de marca do construtor original e relatou
que preenchera o briefing sem obter estrategia. A pagina aberta era a fixture
tests/ui/briefing.html, cujo callback apenas mostrava uma simulacao.
O rotulo Gerar minha estrategia e o saldo ficticio induziam a expectativa errada.
O ICO ainda era antigo e os HTMLs de teste nao declaravam favicon.

## Implementacao

- ICO substituido por versao PNG de 64px do SVG SI existente, sem redesenho da marca.
- SVG, PNG e ICO consistentes; referencias explicitas e cache v2 nos quatro HTMLs.
- Documento principal em pt-BR; README substituido por instrucoes reais do projeto.
- Registro historico de remocao da dependencia no ROADMAP e Git preservados.
- Previa indica ausencia de IA e saldo real; botao salva o briefing para uso no app real.
- Link abre /app no mesmo navegador sem fechar a previa.
- App local oferece importacao explicita apos login, com confirmacao antes de
  substituir campos da tela. Nao gera nem sobrescreve rascunho da conta automaticamente.
- Importacao limitada a desenvolvimento; origem e mesmo navegador/endereco local.
- NODE_ENV herdado era development: scripts/build.mjs agora fixa production no
  processo filho do Vite. Build final nao contem a chave de armazenamento da fixture.

## Preservacao das respostas

Antes de editar, usei Salvar e sair na UI e confirmei o estado salvo. Apos HMR,
a revisao continuou mostrando o briefing preenchido por Antony, nao os dados
ficticios antigos. O novo botao tambem confirmou salvamento. Nao copiar conteudo
do briefing para fixtures ou para o repositorio. Nao sobrescrever esse rascunho
com dados de QA. Nenhuma credencial ou token foi extraido do navegador.

## Aceitacao

- [x] 32 testes passaram, incluindo tres verificacoes de branding.
- [x] Typecheck e build passaram; lint sem erros, com 10 avisos anteriores.
- [x] SVG/ICO e previa respondem HTTP200 localmente.
- [x] PNG SI inspecionado visualmente; ICO validado com o mesmo payload PNG.
- [x] Build final sem string Lovable e sem local-ui-fixture.
- [x] UI confirmou respostas preservadas e salvamento para o app real.
- [x] App real aberto no IAB, /app redireciona a /login sem sessao.
- [ ] Importacao visual apos autenticacao e geracao real com saldo do usuario.
- [ ] Publicacao e readback dos favicons no dominio publico.

Sem alteracoes no banco, permissoes, assinaturas ou creditos. A causa observada
era a fixture, nao uma falha comprovada da IA. Nao afirmar gerador real validado.

## Arquivos

- README.md
- index.html
- public/favicon.ico
- public/favicon.png
- package.json
- scripts/build.mjs
- src/components/OnboardingWizard.tsx
- tests/branding.test.mjs
- tests/ui/briefing.tsx
- tests/ui/briefing.html
- tests/ui/briefing-responsive.html
- tests/ui/briefing-comparison.html
- docs/stories/BRAND-001-favicon-e-previa.md
- ../HANDOFF.md

Build final: index-BP246ySZ.js, 729.59kB (gzip221.32kB), ainda acima do limite
de aviso de 500kB; CSS index-Bd9EP4po.css. Nao publicado nesta etapa.
