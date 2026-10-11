# UX-001: Briefing com identidade original

Data: 06/09/2026. Status: opcao 2 implementada e validada localmente.

## Orientacao do usuario

Melhorar onboarding e app sem perder o objetivo nem a identidade visual.
Preservar cores de antes. Nao substituir a marca pelas paletas alternativas
das primeiras propostas. A publicacao tecnica foi autorizada e concluida;
nao equivale a aprovacao de um layout especifico entre os tres.
Depois de ver as propostas revisadas, Antony respondeu "2", aprovando a
implementacao local de "Foco em uma decisao". Nao houve novo deploy nesta etapa.

## Fonte visual

Tokens existentes em src/index.css: fundo escuro HSL 240 10% 3.9%, superficies
HSL 240 3.7% 15.9%, primary HSL 262 83% 58%, secondary HSL 329 86% 70%.
Botao: gradiente #ec4899, #a855f7, #6366f1. Preservar suporte ao tema claro.
Usar src/assets/logo.png real na implementacao, nao logos reinterpretadas nas imagens.
Referencias: screenshot original enviado por Antony e logo local.

## Propostas revisadas, na ordem exibida

Arquivos no diretorio C:/Users/anton/.codex/generated_images/019cc9fe-1ea4-7953-a41a-07b648154ed7/:

1. Briefing por etapas: exec-058b3e28-3e71-4f23-a01b-64024d40a83a.png
2. Foco em uma decisao: exec-3117e3a1-289e-4fa5-9a76-425e5106589a.png
3. Revisao livre: exec-b2c6bedd-b90c-4071-8a06-dc639eca13da.png

Essa sequencia substitui as opcoes de cores alternativas como referencia de escolha.
Os dados das imagens sao ficticios. A opcao 2 agora esta implementada em codigo.
Nao construir a partir de numero das imagens antigas por engano.

## Requisitos implementados

- Briefing por cliente, distinto de cadastro da conta e atualizacao de ciclo.
- Campos editaveis, revisao antes de gerar, possibilidade de indicar desconhecimento.
- Negocio, situacao atual, objetivo, capacidade operacional e revisao final.
- Preservar campos anteriores e compatibilidade com geracao/historico.
- Rascunho por conta no navegador, com salvamento explicito e retomada da etapa.
- Nao importar cache global antigo sem dono identificado para outra conta.
- Salvamento real antes de exibir qualquer confirmacao de salvamento.
- Sem chat simulado, esperas artificiais ou confirmacao falsa de arquivo anexado.
- Nao anunciar importacao de referencias se o backend nao processar os arquivos.
- Mostrar limites/custo antes de gerar, sem promessas de conversao ou dados inventados.
- Desktop e mobile, labels, teclado, foco, contraste e tema claro/escuro.

## Aceitacao desta etapa

- [x] Tokens atuais conferidos no codigo.
- [x] Tres propostas revisadas na identidade solicitada exibidas no chat.
- [x] Documentacao e HANDOFF atualizados.
- [x] Escolha da estrutura visual pelo usuario: opcao 2.
- [x] Implementacao, testes de formulario e validacao visual responsiva.
- [x] 29 testes automatizados, typecheck e build passaram.
- [x] Lint sem erros; permanecem 10 avisos Fast Refresh anteriores.
- [x] Validacao manual: campos obrigatorios, revisao, salvar/retomar, limites e envio simulado.
- [x] Desktop e janela mobile 390px, temas claro e escuro, sem overflow lateral observado.
- [ ] Validar geracao real autenticada com novo briefing antes de publicar.
- [ ] Publicar novo onboarding depois de validar a experiencia com Antony.

## Limites desta entrega

Rascunho local nao e sincronizado entre dispositivos e nao e um cadastro de varios
clientes. Cada conta tem um rascunho neste navegador. O cache antigo global
strateginsta_user_input nao foi apagado nem importado automaticamente, porque
nao identifica o dono. Campos legados continuam aceitos em initialValues/historico.
Dados locais nao sao criptografados pelo app; evitar informacoes sensiveis.

Marca, obstaculo e sinal de avanco agora entram no contexto da IA. Objetivos
continuam expectativas, nunca resultados observados. Instagram e opcional.
Anexos foram retirados da entrada porque o fluxo nao processava seu conteudo.
Esta etapa nao muda permissoes, planos, banco ou funcoes remotas.

Previa sem IA, cobranca ou dados reais:
http://127.0.0.1:8080/tests/ui/briefing.html
Aplicacao real local (exige login): http://127.0.0.1:8080/app

## Arquivos

- docs/stories/UX-001-briefing-identidade-original.md
- design-qa.md
- src/components/OnboardingWizard.tsx
- src/components/AccountViewSwitch.tsx
- src/pages/Index.tsx
- src/lib/briefing.ts
- src/services/aiService.ts
- src/types.ts
- src/index.css
- tests/briefing.test.mjs
- tests/ui/briefing.html
- tests/ui/briefing.tsx
- tests/ui/briefing-comparison.html
- tests/ui/briefing-responsive.html
- tests/ui/briefing-reference.png
- ../HANDOFF.md

Build local final: dist/assets/index-BpcH9RIp.js e index-BFvfVanE.css.
Fixtures em tests/ui nao fazem parte do build de producao.
