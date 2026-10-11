# Método no motor de geração

Versão 1.1 (proposta) • 11/10/2026 • Autor: Claude Code, para aprovação de Antony
Status: **aprovado por Antony em 11/10/2026** (decisões na seção 10). Só a camada de regras da plataforma está implementada
(`call-ai` v11, publicada em 11/10/2026).

Correção da v1.0: a versão anterior trazia estruturas da Mentoria de Instagram para o app.
Antony esclareceu em 11/10 que a intenção era levar a **pesquisa do Muse** para a Mentoria e
para o app, e não a Mentoria para o app. Nesta versão, o app usa o método E.A.E./3A3R, as
regras da plataforma conferidas e as funcionalidades que ele já tem. O que vinha da Mentoria
está no anexo A, apenas como opção.

## 1. Objetivo

Ajudar o empreendedor a decidir **que conteúdos criar**, de forma estratégica, com base no
método de Antony (E.A.E. + funil 3A3R) e no que a Meta publica oficialmente sobre o Instagram.
Decisões de Antony: incluir o método no motor (09/10), matriz 5×5 com "Oferta e venda" (10/10),
convite estratégico e não "comente PALAVRA" em todo conteúdo (10/10).

## 2. Fontes

| Camada | Fonte | Uso no motor |
| --- | --- | --- |
| Método | `0.Antony-Pinheiro--minha-empresa/empresa/01-METODO-EAE-BASE.md` (v2.0.1) | fases E.A.E. e funil 3A3R |
| Plataforma | `auditoria/muse/` (Muse, conferido por Claude em 10/10/2026) | regras do Instagram (já no motor, v11) |
| Funcionalidades | o próprio app (ICP, monetização, bio, Stories, matriz, calendário, plano) | estrutura de saída existente |

Regra: o motor não cita fontes ao usuário e não inventa. Quando a fonte não cobre, trata
como hipótese.

## 3. Camadas

1. **Plataforma** (feito, v11): até 5 hashtags, convites estratégicos, sem engagement bait,
   originalidade, Reels de alcance até 3 minutos, Stories só para seguidores, segmentos
   sensíveis, leitura por taxas por alcance.
2. **Método E.A.E./3A3R** (este documento): fase do negócio, gargalo do funil, matriz 5×5
   orientada pelo método.
3. **Atualização periódica** da camada 1 com o Muse (registrado no PDR para versão futura).

O texto do método fica num arquivo de conhecimento versionado
(`supabase/functions/_shared/knowledge/metodo.ts`) e cada operação recebe só o que usa.

## 4. Fase E.A.E. do negócio

Do documento base: "Estrutura antes de acelerar. Acelerar antes de escalar."

| Fase | O que significa para o conteúdo no Instagram |
| --- | --- |
| Estruturação | montar a base antes de buscar volume: oferta clara, perfil que explica o negócio, caminho de contato funcionando |
| Aceleração | com a base pronta, aumentar volume de conteúdo e acelerar o que já dá sinal positivo |
| Escala | com canais validados e capacidade, ampliar o que funciona e abrir novos canais |

Regras:
- O motor classifica a fase a partir do briefing (momento do negócio, capacidade de
  atender, provas disponíveis, resultados observados) e justifica.
- Na dúvida, a fase mais baixa. Sem capacidade de atender, não recomendar Escala.
- O documento base usa ciclos de 90 dias; o app trabalha em ciclos mensais de conteúdo dentro
  dessa lógica, sem prometer resultado em 30 dias.

## 5. Gargalo do funil 3A3R

Do documento base: o 3A3R mostra onde a empresa ganha e onde perde clientes, e portanto onde
agir primeiro.

| Etapa | Pergunta | KPI do método |
| --- | --- | --- |
| Assimilação | as pessoas certas conhecem e entendem o negócio? | alcance qualificado, visualizações, seguidores do nicho |
| Aquisição | quem conhece entra em contato? | contatos, custo por contato, taxa de contato |
| Ativação | quem entra em contato compra? | conversão de contato em cliente |
| Retenção | o cliente continua e tem boa experiência? | permanência, satisfação |
| Receita | o cliente compra mais? | ticket médio, recompra |
| Recomendação | o cliente indica? | indicações, avaliações |

Regras:
- O motor escolhe uma etapa prioritária a partir do obstáculo e da linha de base informados,
  como hipótese, e diz o que o usuário deve observar para confirmar.
- O conteúdo do mês dá mais peso à etapa prioritária, sem abandonar as demais.
- O Instagram atua principalmente em Assimilação, Aquisição e Ativação; Retenção, Receita e
  Recomendação aparecem como conteúdo para quem já é cliente e como ideias de monetização.

## 6. Matriz 5×5

**Linhas: nível de consciência do público** (já existentes no app): ainda não percebe o
problema, sente o problema, procura soluções, conhece a oferta, pronto para decidir.

**Colunas: finalidade do conteúdo** (as quatro do app + a nova decidida por Antony):
crescimento, engajamento, autoridade, quebra de objeção e **oferta e venda**.

25 células, uma ideia por célula, com os campos que o app já usa (título, ângulo, formato,
base no briefing, prova necessária, convite) e mais um campo: **etapa 3A3R** que a ideia
apoia.

Regras:
- Oferta e venda com condições reais e caminho de compra; sem escassez ou urgência inventadas.
- Ênfase na etapa prioritária do gargalo e coerência com a fase E.A.E.
- Convites pela finalidade da peça (regra já publicada na v11).

## 7. Demais saídas do app

Mantêm o formato atual, com dois acréscimos do método:
- **ICP**: o motor usa a fase E.A.E. e o gargalo 3A3R internamente para orientar o texto, sem exibir os nomes.
- **Calendário e plano de ação**: priorizam a etapa do gargalo e respeitam a fase (em
  Estruturação, menos volume e mais base).
- **Monetização**: ideias ligadas às etapas Receita e Recomendação, sem promoção de
  consultoria (já publicado).

## 8. Mudanças técnicas do lote 2

| Área | Mudança | Impacto |
| --- | --- | --- |
| Backend | `knowledge/metodo.ts`; fase e gargalo na etapa ICP; matriz 5×5 com campo de etapa 3A3R | muda o contrato: subir com o frontend |
| Frontend | matriz com a coluna "Oferta e venda" (fase e gargalo ficam internos) | deploy na Vercel |
| Briefing | campo "tem resposta automática no Direct? o que entrega?" (necessário para a regra de convite por palavra-chave) | frontend e backend juntos |
| Custo e tempo | matriz +25% de saída; medir o limite de ~150 s da função | separar a matriz em etapa própria se necessário |
| Compatibilidade | estratégias salvas com 5×4 continuam abrindo | testes de regressão |

## 9. Avaliação

Gerar com os mesmos 2 briefings no motor v11 (antes) e no lote 2 (depois); avaliação cega por
Antony ("isto segue o meu método?"); medir custo, tokens e tempo nos dois modelos.

## 10. Decisões de Antony (11/10/2026)

1. Seções 4 a 7: **aprovadas**.
2. Fase E.A.E. e gargalo 3A3R: **uso apenas interno**. O motor usa para decidir, mas não
   exibe ao usuário. Consequência: a linha "fase e gargalo exibidos" da seção 8 sai do
   escopo do frontend; o ICP não mostra os nomes das fases.
3. Anexo A (Mentoria): **nada entra no app**.
4. Banco de estratégias 3A3R: **não entra no motor**; fica apenas na consultoria.

## Anexo A: elementos da Mentoria que NÃO entram por padrão

Listados só para decisão de Antony. Nenhum será implementado sem pedido explícito.
- Ficha da ideia com intenção, pilar e quadro.
- Ciclo inicial de seis peças (2-1-1-1-1).
- Diagnóstico de perfil pelas "3 perguntas de quem visita" e frase de trabalho da oferta.
- Sequência de Stories contexto → valor → direção.
- Estruturas e checklist de qualidade de roteiro.
- Roteiro de atendimento no Direct e critério de lead qualificado.
- Formato "Executei → Observei → Hipótese → Vou testar" e árvore de decisão do ajuste de rota.

Observação: duas regras publicadas na v11 têm origem mista Meta + Mentoria (convite pela
finalidade da peça, pedido de Antony em 10/10; e comparar peças de mesma intenção e tempo no
ar). Se Antony preferir, a segunda pode ser reduzida à parte que vem da Meta (taxas por
alcance e tempo médio assistido).
