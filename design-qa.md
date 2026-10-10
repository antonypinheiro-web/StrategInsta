# UX-001: QA do briefing

Data: 06/09/2026
final result: passed
Escopo: implementacao local da opcao 2, nao aprovacao para lancamento comercial.

## Fonte e evidencia

- Fonte: opcao 2, Foco em uma decisao, escolhida explicitamente por Antony.
- Imagem original: C:/Users/anton/.codex/generated_images/019cc9fe-1ea4-7953-a41a-07b648154ed7/exec-3117e3a1-289e-4fa5-9a76-425e5106589a.png
- Copia intacta em tests/ui/briefing-reference.png, 1487x1058 pixels.
- Implementacao: http://127.0.0.1:8080/tests/ui/briefing.html
- Comparacao conjunta: http://127.0.0.1:8080/tests/ui/briefing-comparison.html
- Recorte ampliado conjunto: mesma URL com ?detail=1.
- Responsivo: http://127.0.0.1:8080/tests/ui/briefing-responsive.html
- Tema claro responsivo: mesma URL com ?theme=light.

Fonte e implementacao foram capturadas juntas pelo navegador, nao apenas vistas
separadamente. Capturas estao no registro desta tarefa. Comparacao final usa
iframe de 1487x1058 CSS px, escala .5 para ambas as superficies; recorte de
campos usa escala 1 antes do ajuste conjunto a largura da janela. Nao houve
medicao independente de deviceScaleFactor: nao afirmar equivalencia pixel-perfect.
Mesma etapa Objetivo, tema escuro, opcao orcamento e texto ficticio de criterio.
A faixa de ferramentas de teste fica oculta na comparacao, nao no teste funcional.

## Achados e correcoes

- [P2, corrigido] Ritmo vertical e CTA: primeira comparacao tinha navegacao
  alta e botao estreito. Reduzido padding da navegacao, removido espaco superior
  duplicado e CTA alterado para 420px no desktop e largura inteira no celular.
  Novas capturas conjunta e ampliada confirmaram hierarquia e proporcoes.
- [P2, corrigido] Avanco mobile mantinha o fim da etapa anterior visivel.
  Removido preventScroll do foco no titulo. Nova captura no celular mostra
  o titulo de Recursos e os campos apos avancar de Objetivo.
- [P2, corrigido] Sair da conta poderia descartar edicoes sem aviso.
  O briefing pede confirmacao quando ha alteracoes nao salvas. Fechar/recarregar
  a aba tambem registra beforeunload enquanto houver alteracoes.
- [P3, aceitavel] Radios nativos diferem do desenho nos preenchimentos e aneis.
  Mantidos controles reais com labels, teclado e estados acessiveis; color-scheme
  ajustado ao tema escuro. Nao substituidos por imagens dos controles.

## Superficies de fidelidade

- Tipografia: mantida a fonte existente do app. Hierarquia titulo 32px desktop,
  24px mobile; controles 16px, apoio 14px. Recorte conjunto verificou titulos,
  textos e quebras. Variacao de fonte rasterizada do mock e intencional.
- Espacamento: cinco etapas horizontais, formulario amplo e ajuda lateral;
  ajuda abaixo do formulario no mobile. Botoes e campos sem sobreposicao observada.
- Cores: tokens originais escuros e claros; roxo e rosa preservados, CTA
  #ec4899 -> #a855f7 -> #6366f1. Nenhuma paleta alternativa introduzida.
- Imagens: src/assets/logo.png real, nitido e ajustado ao tema, no lugar
  da reinterpretacao do logo pelo mock. Nao foi desenhado outro logo em codigo.
- Conteudo: objetivo principal, criterio opcional e ajuda preservados. Acrescentado
  "Tenho outro objetivo" por compatibilidade com respostas livres. Exemplo ficticio
  nao aparece como resultado real. Revisões mostram limite antes da geracao.

## Verificacao funcional

- Formulario vazio bloqueia avancar e identifica campos ausentes.
- Perfil Instagram opcional; publico e objetivo desconhecidos podem ser explicitados.
- Salvar e sair confirma somente apos escrita real. Recarregar restaura dados e etapa.
- Revisao apresenta respostas e permite voltar para edicao.
- Sem creditos ou com erro do plano: geracao desabilitada na fixture.
- Envio simulado chegou ao callback com objetivo informado, sem IA ou debito real.
- Desktop claro/escuro e mobile claro/escuro inspecionados.
- Mobile usa iframe de 390px; area util observada de 375px apos scrollbar,
  scrollWidth igual a clientWidth. Nao equivale a teste em aparelho fisico.
- 29 testes automatizados passaram; typecheck e build passaram; lint 0 erros,
  10 avisos preexistentes. Bundle principal ainda acima de 500kB.

## Checklist final e limites

- [x] Comparacao conjunta e recorte legivel dos detalhes.
- [x] Correcoes visuais e nova captura apos ajustes.
- [x] Fluxo principal e estados de erro testados localmente.
- [x] Rascunho identificado como local, nao sincronizado.
- [ ] Geracao real autenticada com briefing novo, sem mocks.
- [ ] Teste em aparelho fisico e regressao completa do restante do app.
- [ ] Publicacao do novo onboarding e validacao em producao.

Esses ultimos itens nao fazem parte da aprovacao visual local. A fixture nao
valida permissao administrativa, cobranca real ou consumo atomico de creditos.
