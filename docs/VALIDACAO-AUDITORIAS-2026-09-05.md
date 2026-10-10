# Validacao das auditorias do StrategInsta

Data: 05/09/2026. Escopo: versoes, auditorias de julho, codigo local, configuracao remota disponivel e verificacoes tecnicas. Revisao orientada pela skill security. Nenhum codigo funcional, permissao ou deploy foi alterado.

## Veredito

A Fase 2 continua relevante como diagnostico tecnico, mas subestima falhas do admin e da cobranca. A Fase 1 serve como conjunto de hipoteses de posicionamento, nao como validacao de demanda. O produto ainda nao tem evidencias suficientes para ser considerado pronto para venda.

O criterio de sucesso proposto e reduzir o trabalho do social media para transformar um briefing em uma estrategia coerente, revisavel e apresentavel ao cliente. Os sete entregaveis podem compor esse resultado principal; nao precisam virar sete produtos independentes.

## 1. Qual versao existe em cada lugar

| Local | Evidencia |
|---|---|
| GitHub antonypinheiro-web/StrategInsta | main em f92cdc82240f1e83cfe74cc2e9ce8f1179dfae3b, de 26/03/2026; nenhuma outra branch ou PR encontrado na consulta anterior desta sessao |
| Git local em app/ | Mesmo HEAD, com modificacoes e arquivos novos sem commit, incluindo admin e migracao de maio |
| Vercel, projeto strateginsta | Ultimo deploy dpl_CHSiHzmKShajzMoiS3AVsiW8LbXi, READY, production, 26/03/2026, SHA f92cdc8; nenhuma publicacao posterior listada |
| Supabase vqngekcjshfvssqjqgkp | admin-api v1, call-ai v7, stripe-webhook v16 e create-checkout-session v16, metadados ACTIVE, atualizados em 06/05/2026 |
| Auditorias | ../auditoria/fase-1-mercado-e-demanda.md e fase-2-produto-e-funcionalidades.md, julho; fora do repositorio app/ |

Site e backend estao em momentos diferentes. A interface admin local nao integra o commit publicado na Vercel. ACTIVE e READY sao estados de publicacao, nao testes funcionais. O codigo publicado de call-ai foi lido e confirma prompts arbitrarios e ausencia de debito por requisicao.

Vercel: https://vercel.com/antony-pinheiros-projects/strateginsta/CHSiHzmKShajzMoiS3AVsiW8LbXi

## 2. Achados por prioridade

### P1 - Webhook Stripe publicado exige JWT do Supabase

Evidencia remota: stripe-webhook tem verify_jwt=true. O Stripe envia sua assinatura, nao um token de usuario Supabase; portanto a configuracao bloqueia entregas normais antes do handler. Risco: pagamento realizado sem ativacao do plano. Nao executei uma cobranca real.

Correcao: configurar somente o webhook externo com verify_jwt=false e manter validacao rigorosa da assinatura Stripe dentro da funcao. Versionar essa configuracao. Nao estender a mudanca indiscriminadamente a admin-api.

Referencia: https://supabase.com/docs/guides/functions/auth#external-webhooks

### P1 - Cota nao e autoritativa no servidor

Evidencias: supabase/functions/call-ai/index.ts:137 aceita systemPrompt/userPrompt do cliente; src/hooks/usePlan.ts:117 calcula o incremento no navegador. A funcao publicada de IA confirma essa implementacao. Chamadas diretas de um usuario com saldo nao debitam o consumo. A consulta de plano tambem ignora erros e assume free/uso zero quando nao recebe dados.

Ha ainda um caminho normal sem debito: src/pages/Index.tsx:427 salva ao pular o nome, mas nao chama incrementUsage. Na confirmacao do nome, o consumo pode ser incrementado mesmo se o salvamento falhar, porque saveStrategyToSupabase captura o erro sem propaga-lo.

Correcao: definir unidade de cobranca, criar operacao de geracao identificada, reservar/debitar no servidor de forma atomica, tratar concorrencia, repeticao, falha parcial e estorno. Uma estrategia tem varias chamadas de IA; apenas incrementar uma vez por chamada mudaria a unidade de venda e poderia interromper a estrategia do plano free.

### P1 - Schema permite ao cliente alterar campos administrativos do proprio plano

Evidencia: docs/supabase-schema.sql:28-34 autoriza INSERT/UPDATE pela propriedade da linha, sem restringir colunas como plan_type, strategies_used e is_blocked. O mesmo registro recebe admin_notes, enquanto o cliente le o plano com select('*').

Se aplicadas com os privilegios de tabela usuais, essas regras permitem elevar o proprio plano, alterar consumo e ler observacoes supostamente internas. A consulta read-only a pg_policies do banco remoto expirou por timeout: a exposicao efetiva em producao nao foi confirmada.

Correcao: plano, bloqueio, consumo e notas sob controle de servidor; notas internas em superficie nao acessivel ao cliente; leitura publica apenas dos campos necessarios. Auditar grants, policies e funcoes reais antes de migrar. Bloquear escrita direta precisa vir junto da substituicao do fluxo atual do usePlan.

Referencia: https://supabase.com/docs/guides/database/postgres/row-level-security

### P1 - Revogacao de admin pode ser desfeita pelo bootstrap

Evidencia: supabase/functions/admin-api/index.ts:65-82 busca apenas membro ativo e, se nao encontrar, faz upsert active=true para email em ADMIN_EMAILS. Um admin desativado volta a ser ativado no acesso seguinte enquanto estiver na lista.

Correcao: bootstrap controlado de uso unico; respeitar desativacao existente, verificar identidade confirmada e exigir role admin explicitamente. O CHECK da tabela hoje limita a role a admin, mas nao substitui a verificacao explicita solicitada no plano.

### P1 - Confirmacoes Stripe repetidas podem reaplicar efeitos

Evidencias: supabase/functions/stripe-webhook/index.ts:21-39 nao verifica idade da assinatura; :87-96 reexecuta ativacao e zera consumo sem controle por event.id. Erros retornados pelo banco sao ignorados em varias atualizacoes, podendo responder sucesso sem persistencia.

Correcao: verificacao oficial de assinatura com tolerancia temporal; processamento idempotente, controle de eventos fora de ordem e tratamento de falhas de banco. Testar reentrega de checkout, cancelamento, renovacao e falha transitoria. A verificacao JWT errada nao deve ser usada como protecao substituta.

Referencia: https://docs.stripe.com/webhooks

### P2 - Creditos extras sao somados, mas nao consumidos no registro de concessao

Evidencias: usePlan e call-ai leem amount - used_amount; nao foi encontrada atualizacao de used_amount no fluxo. O contador mensal muda, mas concessoes sem expiracao permanecem inteiras e voltam a ampliar o limite apos reset. O dashboard tambem recebe consumo de extras incorreto.

Correcao: definir se o beneficio e bonus consumivel ou aumento recorrente. Para bonus, registrar consumo transacional e ordem de expiracao, sem dupla contagem com a cota mensal.

### P2 - Dashboard nao mede o que alguns nomes prometem

Evidencias: admin-api/index.ts:180-239 limita usuarios a 1000 e eventos a 500; nao aplica filtros de plano/status ao overview; freeToPaidRate mede proporcao atual de planos pagos, nao conversao; MRR soma preco mensal de tabela inclusive de concessoes manuais e ignora anual; custo de IA e strategies_used * 0.06, sem tokens/modelo/tentativas. Erros de consultas podem virar zeros.

src/pages/Admin.tsx:488-492 apresenta integracoes com ok fixo. Configuracoes operacionais sao um textarea somente leitura. listUsers filtra apenas a pagina carregada; a UI solicita os primeiros 100 usuarios. listStrategies:355-356 nao exclui arquivadas no filtro active e combina busca textual com igualdade de UUID, que falha para nomes comuns.

Correcao: agregacoes server-side completas, definicoes de metricas, paginacao e filtros reais; status consultados com momento da verificacao. Separar estimativa de faturamento contratado e recebido. Contabilizar erro, tentativa e estrategia concluida como eventos diferentes.

### P2 - Logs administrativos nao sao garantidos

Evidencia: admin-api/index.ts:95 ignora erro de insert. As mudancas acontecem antes do log. Leituras administrativas nao sao registradas, embora o plano diga toda acao.

Correcao: auditar mutacoes de banco na mesma transacao; para acoes no Auth/Stripe, registrar tentativa, resultado e reconciliacao. Definir explicitamente o escopo de auditoria de leituras sensiveis.

### P2 - Anexos do briefing nao alimentam a IA

Evidencias: OnboardingWizard.tsx:384-397 aceita arquivos e informa que foram enviados; buildUserContext em aiService.ts:59-81 utiliza apenas campos textuais. Nao ha leitura/extracao nem envio dos anexos no caminho de geracao examinado.

Correcao: implementar extracao validada ou retirar a promessa de uso dos anexos ate existir. Separar anexos do cliente, briefing estruturado e conhecimento editorial do produto; nao importar todo o Vault indiscriminadamente.

## 3. Validacao da Fase 2

| Conclusao de julho | Avaliacao atual |
|---|---|
| E.A.E/3A3R nao embarcados | Confirmada no motor examinado. BASE_SYSTEM, aiService.ts:85, e generico; nao ha implementacao explicita desses criterios |
| Prompts expostos no navegador | Confirmada. Alem disso, o repositorio GitHub e publico: mover para backend mantendo prompt proprietario nesse repo nao o torna privado |
| Cota burlavel | Confirmada e ampliada pelos caminhos de salvar/pular e pelas permissoes do schema |
| Templates silenciosos | Confirmada em aiService.ts:296,362,428,493. Contradiz Landing.tsx:93 |
| Base de migrations incompleta | Confirmada: somente admin_console, que pressupoe user_plans preexistente |
| geminiService sem uso | Nenhuma importacao encontrada no codigo pesquisado; limpeza util, abaixo dos riscos de receita |
| Admin, historico e Stripe funcionais | Afirmacao forte demais. Existem implementacoes, mas faltam testes integrados e ha falhas verificadas |
| White label, API, perfis e modelo premium | Flags e promessas presentes, sem implementacao correspondente localizada no fluxo. Landing.tsx:316-319; PlansModal.tsx:101-104 |
| Depoimentos ficticios | Textos continuam presentes. Nao e possivel provar autenticidade pelo codigo; exigir origem/autorizacao e evidencia das metricas antes de publica-los como reais |
| Modelo Flash necessariamente gera conteudo raso | Hipotese, nao conclusao demonstrada. Fazer comparacao cega com exemplos, custo e latencia; premium nao garante qualidade |
| Teto de R$200 invalida Agency de R$247 | Nao demonstrado. Preferencia do fundador nao substitui disposicao a pagar de agencias |

Nao executei novas geracoes pagas; qualidade real e superioridade sobre ChatGPT continuam sem validacao experimental.

## 4. Validacao da Fase 1

Continuam uteis: identificar ChatGPT/Claude como substitutos, avaliar retrabalho do social media, testar uma entrega apresentavel e investigar motivo de renovacao no segundo mes.

Precisam de revisao:

- A tese de espaco competitivo vazio nao foi demonstrada. Iris/Flick oferece contexto de marca, estrategia, calendario mensal e roteiros para freelancers/agencias, com sobreposicao direta a H2. Isso nao prova equivalencia completa nem elimina uma oportunidade brasileira, mas enfraquece a exclusividade afirmada. Fonte: https://www.flick.social/ai-social-media-tool-freelancers-agencies
- Predis suporta Portugues Br. A barreira de idioma descrita na matriz e incorreta. Fonte: https://predis.ai/supported-languages/
- Precos precisam de data, moeda, periodicidade, volume e pagina exata. A pagina atual da Predis mistura valores promocionais e tabela comparativa divergente; nao adotar a faixa antiga como base de decisao sem confirmar checkout. Fonte: https://predis.ai/pricing/
- Reclamacoes de concorrentes sao sinais qualitativos, nao comprovacao de migracao de clientes ou disposicao a pagar pelo StrategInsta.
- Popularidade do Instagram nao mede demanda por este software. O numero de 91%, a receita de concorrentes, volume de busca e as generalizacoes setoriais nao foram confirmados nesta revisao e nao devem ser tratados como validacao de demanda.
- H1+H2 esta registrado como posicionamento escolhido, nao como resultado validado com compradores. Metodo proprietario e onboarding guiado tambem podem ser reproduzidos em outras ferramentas; o diferencial precisa aparecer no resultado e no fluxo de trabalho.

## 5. Como complementar o projeto

O Vault atual aponta Empresa.md e Metodo.md (o antigo _index.md nao existe no caminho informado). O metodo prioriza estrutura antes de acelerar e adaptar a decisao a capacidade real do cliente. A adaptacao ao Instagram deve aparecer em escolhas justificadas, nao apenas na insercao das siglas em um prompt.

Sequencia proposta, ainda sem implementar:

1. Estabilizar base: webhook, permissoes de banco, cota atomica, bonus, logs e configuracao de deploy. Testar usuario comum/admin em ambiente controlado.
2. Transformar metodologia em criterios testaveis: briefing -> diagnostico -> prioridade -> conteudo -> indicador. Versionar fontes e regras em repositorio privado quando proprietarias; validar resultados com exemplos aprovados por Antony.
3. Entregar o fluxo principal: briefing reutilizavel por cliente, revisao de estrategia e exportacao apresentavel. Incluir isolamento de clientes se multi-perfil fizer parte do piloto. Medir retrabalho, nao apenas quantidade de textos gerados.
4. Rodar piloto pago com social medias: registrar tempo antes/depois, porcentagem aproveitada, motivo de compra, custo por entrega e renovacao. Cinco participantes servem para aprendizado qualitativo inicial, nao prova estatistica de mercado.
5. Evoluir retencao: registrar o que foi executado, resultados e restricoes para orientar o proximo ciclo. Validar uso antes de ampliar planos, anual e distribuicao paga.

Conhecimento do Instagram: separar principios permanentes, referencias taticas revisadas e tendencias datadas com fonte/expiracao. O codigo atual nao mostra uma rotina de atualizacao de tendencias; nao prometer conhecimento permanentemente atualizado. O roadmap de outras redes permanece futuro.

H3, captacao para mentoria, continua possibilidade secundaria; precisa de escolha clara e tratamento adequado dos dados do cliente da agencia. Nao presumir que cada usuario da ferramenta e lead para consultoria.

## 6. Verificacoes e limites

- Build: aprovado nesta revisao; JS principal 1.057,88 kB, gzip 290,80 kB; avisos de bundle e base Browserslist antiga.
- TypeScript: node node_modules/typescript/bin/tsc --noEmit -p tsconfig.app.json aprovado. Isso verifica src, nao as Edge Functions Deno.
- npm run lint: 12 erros e 12 avisos. Incluem any, escapes, interfaces vazias e require.
- npm run typecheck e npm test: scripts inexistentes. Nao ha suite executada por esses comandos.
- Banco remoto: consulta read-only a pg_policies falhou por timeout. Aplicacao da migracao e permissoes reais continuam sem comprovacao nesta revisao.
- Nao testados: login completo, admin/usuario comum, pagamento real, geracao paga, qualidade dos outputs, exportacao e jornada no navegador.
- Auditorias originais preservadas; este documento fica dentro do repositorio app/ para ser incluido em um futuro commit. Nenhum push ou deploy realizado.

## 7. Criterios para a proxima aprovacao

- [ ] Validar plano/permissoes contra tentativas de alteracao por usuario comum.
- [ ] Testar geracao concorrente, cancelada e repetida sem burlar ou duplicar debitos.
- [ ] Testar webhook assinado, invalido, repetido e fora de ordem em modo de teste.
- [ ] Demonstrar concessao, consumo e expiracao de bonus.
- [ ] Demonstrar revogacao de admin e auditoria de operacoes sensiveis.
- [ ] Remover ou comprovar promessas e depoimentos antes de divulgar.
- [ ] Aprovar rubrica de qualidade do metodo e comparar outputs em teste cego.
- [ ] Confirmar oferta e disposicao a pagar com usuarios do publico escolhido.

Estes itens sao backlog proposto para a proxima etapa, nao declaracao de funcionalidades entregues.
