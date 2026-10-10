# StrategInsta: Product Requirements Document

**Versão:** 2.3, piloto aprovado e implementado localmente
**Atualização:** 27/09/2026
**Status:** implementação local verificada; publicação e homologação real pendentes
**Projeto oficial:** `F:\00.claude-code\projects\1.softwares--e--apps\strateg-insta`
**Código e Git:** subpasta `app/`

Antony aprovou o plano rev1.1. O estado vigente de implementação e validação está
em `docs/stories/PILOT-001-piloto-empreendedores.md`; o lote para autorização está
em `docs/PILOTO-PUBLICACAO.md`. As seções históricas abaixo preservam o diagnóstico
de 10/09 e não devem ser interpretadas como revogação da aprovação posterior.

## 1. Objetivo e Posicionamento

O StrategInsta transforma o briefing de um negócio em uma estratégia de Instagram
que o empreendedor consiga revisar e colocar em prática no próprio negócio. A função central é gerar essa
estratégia, não acumular ferramentas desconectadas de conteúdo ou automação.

Público prioritário do primeiro piloto, confirmado em 10/09: empreendedores usando
o app no próprio negócio. Social medias e profissionais de marketing continuam
como públicos secundários. Essa decisão substitui a prioridade anterior. Recursos de equipe,
múltiplos clientes e agências não devem ser presumidos como já disponíveis.

Proposta de valor: sair de informações dispersas sobre negócio, público e objetivos
para um plano de Instagram organizado, contextualizado e revisável.

Não prometer geração em três minutos, resultados comerciais, disponibilidade ou
margens sem medição. As afirmações antigas eram expectativas, não resultados
comprovados. O produto ainda não está pronto para abertura comercial.

## 2. Estado Real e Correção do Incidente

Em 09/09, Antony confirmou que a geração real funcionou. O erro seguinte ocorria
no diálogo de nome: Salvar e Pular não concluíam. A estratégia já era persistida,
mas o UPDATE de uso falhava com 42501 por solicitar retorno de uma coluna protegida
via PostgREST. A correção mantém as permissões e verifica a contagem exata de linhas
atualizadas sem solicitar representação. A mesma função atende nome informado e padrão.

| Área | Situação verificada em 10/09/2026 |
| --- | --- |
| Briefing | Preservado e recuperado após recarga; linguagem de negócio próprio |
| Geração anterior | Sete seções geradas; qualidade não aprovada: havia suposições e números sem fonte |
| Salvar com nome | Validado no app autenticado; um registro persistido e uso de 1 para 2 |
| Reabertura | Lista da própria conta e resultado reaberto após recarga; sem novo consumo |
| ICP, monetização e bio | Apresentação e prompts ajustados localmente; novas respostas ainda não homologadas |
| Etapas finais | Agora usam contexto revisado; validação de JSON e retomada da etapa com falha |
| Testes locais | 43 aprovados; typecheck/build passaram; lint com 0 erros e 10 avisos anteriores |
| Anexos / Stories recorrentes / seleção de ideias / modelos no admin | Requisitos detalhados no plano do piloto, implementação pendente |
| Produção | Nenhuma publicação deste lote; build local não equivale a deploy |
| Lançamento comercial | Continua condicionado a qualidade, créditos server-side e pagamentos |

Plano detalhado: [Piloto de empreendedores, revisão 1.1](PLANO-PILOTO-EMPREENDEDORES.md).
Perguntas do onboarding e créditos/ofertas serão definidos com Antony antes de
aprovar a implementação. Antony informou reset de créditos pelo admin; o saldo
2/2 do teste anterior é histórico e não foi revalidado nesta revisão.
Evidências do lote: [FIX-002](stories/FIX-002-conclusao-e-qualidade.md).

## 3. Princípios de Produto e Validação

- Manter uma função central: estratégia de Instagram contextualizada e executável.
- Validar demanda e disposição de pagamento antes de ampliar o escopo.
- Entregar versões pequenas e aprender com uso real, sem sacrificar segurança.
- Personalizar a experiência com perguntas úteis, sem alongar o briefing apenas
  para criar compromisso psicológico. Duração e abandono precisam ser medidos.
- Mostrar valor e limites com clareza; teste grátis, cobrança, renovação e
  cancelamento não podem ser prometidos sem implementação e condições explícitas.
- Plano anual e distribuição por orgânico/anúncios são hipóteses de crescimento,
  não justificativas para preços, descontos, LTV ou receita inventados.

A pesquisa de mercado atualizada continua pendente. Nenhum faturamento de
concorrente ou volume de busca foi comprovado nesta revisão documental.

## 4. Experiência e Identidade Visual

Decisão aprovada por Antony: opção 2, **Foco em uma decisão**, da sequência mais
recente de propostas com a identidade original. Não usar as propostas anteriores
com paletas alternativas.

Preservar logo real `src/assets/logo.png`, roxo, rosa, temas claro/escuro e gradiente
`#ec4899`, `#a855f7`, `#6366f1`. O favicon SI deriva do SVG existente; arquivos ICO
alternativos não podem continuar mostrando marca de outro produto.

Interface legível no computador e celular, com labels, foco visível, navegação por
teclado e mensagens compreensíveis para pessoas sem conhecimento de programação.

## 5. Jornada Principal

### 5.1 Conta e Contexto de Cliente

Cadastro/login identificam quem usa o SaaS. O briefing descreve o negócio ou
cliente atendido. Não confundir o perfil do social media com o público da marca.

Um admin usa o mesmo cadastro para acessar `/admin` e a experiência comum em `/app`.
Ter acesso administrativo não implica plano ilimitado nem dispensa de créditos.

### 5.2 Briefing Atual em Cinco Etapas

1. **Negócio:** marca ou perfil, segmento e oferta; Instagram opcional.
2. **Situação:** público, obstáculo, ações/resultados observados; referências,
   voz e temas como complementos opcionais.
3. **Objetivo:** uma prioridade, objetivo livre ou desconhecimento explícito;
   sinal de avanço desejado, tratado como expectativa e não resultado observado.
4. **Recursos:** frequência viável, experiência, tempo/equipe e foco do funil.
5. **Revisão:** respostas editáveis, saldo/limites reais e ação de geração.

A lista de perguntas candidatas da seção 12 do plano será discutida com Antony;
a estrutura atual não equivale à aprovação de um onboarding ampliado.

Sem chat simulado, esperas artificiais ou confirmação falsa de anexos. Não anunciar
leitura de arquivos enquanto o backend não processar seu conteúdo. Campos antigos
continuam compatíveis, mas isso não significa migração automática de todo cache.

### 5.3 Salvamento e Recuperação

Estado implementado: um rascunho por conta e navegador, em armazenamento local.
Estratégias concluídas ficam no Supabase e podem ser reabertas por “Estratégias
salvas”, com nome, briefing e histórico. Consultar não usa créditos.
Não é sincronização em nuvem nem cadastro persistente de múltiplos clientes.
Salvar só pode ser confirmado após escrita bem-sucedida. Falhas devem manter
as respostas na tela. Saída com alterações não salvas deve avisar o usuário.

O cache global antigo sem dono identificado não deve ser atribuído automaticamente
a outra conta. Dados do briefing não devem aparecer em logs, URLs ou arquivos de teste.
Não tratar armazenamento local como criptografado ou apropriado para segredos.

### 5.4 Prévia versus App Real

- `/tests/ui/briefing.html`: fixture de desenvolvimento, sem IA nem saldo real.
- `/app`: fluxo real autenticado; pode usar serviços externos e consumir créditos.
- `/admin`: área operacional protegida no servidor.

A fixture oferece salvar e abrir o app real. A importação local exige login,
confirmação e revisão; não gera automaticamente nem sobrescreve o rascunho da
conta em disco. Depende do mesmo navegador e origem. Não transfere entre Codex,
Chrome, outro computador ou o domínio Vercel.

Esse mecanismo é uma ponte de desenvolvimento, não uma funcionalidade comercial.
O usuário não deve ser enviado à fixture para validar geração real.

## 6. Estratégia e Inteligência

Entregáveis previstos no fluxo existente:

- Perfil do Cliente Ideal.
- Ideias de monetização.
- Opções de bio do Instagram.
- Estratégia de Stories.
- Matriz de conteúdo por objetivo/funil.
- Calendário editorial.
- Plano de ação.

As quatro etapas revisáveis são seguidas de matriz, calendário e plano de ação,
gerados com o contexto já revisado. Não iniciar essas partes em segundo plano
antes do ICP. Validar o formato retornado e informar falha sem substituir por
conteúdo genérico. Na mesma tela, preservar partes prontas para tentar as pendentes. Uma estratégia só está concluída
quando as partes necessárias e o salvamento forem confirmados.

Refinamento por etapa, histórico, renomeação e exportação fazem parte do escopo;
duplicação, limites por plano, histórico de versões e formatos de exportação
precisam de validação específica antes de serem anunciados como disponíveis.

O caminho ativo do frontend é `src/services/aiService.ts`. Não usar o serviço legado
`geminiService.ts` como prova de integração real. Provedores, modelos, disponibilidade,
timeouts e fallback devem ser verificados na Edge Function publicada. Não garantir
um modelo premium por plano somente porque aparece em documento antigo.

### Requisitos adicionais solicitados em 10/09, ainda não implementados

- Modelo alvo: rotação GPT 5.6 Luna/Gemini 3.8 Flash e atualização pelo admin.
  Distribuição e fallback limitados no servidor; registrar modelo efetivo e custo.
- Inputs e outputs ajustáveis após save por edição delimitada/refino por seção;
  versões preservadas e aviso de impacto/custo antes de regenerar.
- Matriz 5 × 4: cinco níveis de consciência e quatro objetivos de conteúdo.
  Referência PDF fornecida por Antony, inspecionada nas três páginas. Poucas ideias
  iniciais por célula, nova ideia/formato sob demanda e botão para gerar roteiro.
- Gerador de conteúdo conectado à matriz e Stories, com contexto de origem;
  roteiro/refino por item/dia/semana, sem gerar arte ou vídeo final neste lote.
- Toda geração e revisão persistida por usuário/negócio, inclusive tentativas com
  status. Feedback “deu bom/deu ruim” com objetivo/contexto entra nas próximas
  gerações por recuperação de exemplos, sem inferir resultado comercial.
- Histórico ao lado de Sair: novo bug relatado, aberto para reprodução e correção
  P0. A lista Estratégias salvas não encerra esse requisito.
- Toda operação de IA consome créditos: nova estratégia, ideia, formato, roteiro,
  Stories e refinamento. Limites e oferta comercial serão discutidos antes de ativar.

Aceites, perguntas e valores ilustrativos estão nas seções 12 a 17 do plano.
Eles não representam funcionalidades disponíveis ou preços aprovados.

### Conhecimento Estratégico

Incorporar conhecimento estratégico, tático e operacional pertinente: formatos,
ângulos, estruturas de conteúdo, funil e leitura de métricas do Instagram.

Fontes do Vault e materiais de Antony devem ser auditados e versionados antes da
incorporação. Separar conhecimento validado, hipótese e tendência com fonte/data.
Não afirmar que todo material fornecido em prompts anteriores já está no motor.
Perguntas adicionais do briefing de social media ainda precisam ser localizadas
ou recebidas. Conteúdo de 2026 exige pesquisa atualizada; não foi produzido aqui.

`Inputs-StrategInsta-Antony.txt`, na raiz, é material legado, não evidência de
recuperação do briefing atual. O índice do Vault informado em
`F:\OBSIDIAN\Obsidian Vault\02 - EMPRESA\_index.md` não foi encontrado nesta revisão.
Não houve nova incorporação de conhecimento externo.

## 7. Admin Console

Painel operacional do proprietário, separado em `/admin`. Roles avançadas de
suporte, financeiro e analista ficam para depois. Ações sensíveis sempre no
servidor, com autenticação e verificação em `admin_users`.

| Área | Requisito do MVP |
| --- | --- |
| Usuários | Listar/buscar por nome, email ou ID; plano, créditos, cadastro e último acesso; criar, bloquear/desbloquear |
| Créditos e planos | Conceder extras, alterar plano, resetar uso e manter observação interna |
| Estratégias | Filtrar por usuário/plano/data/status, abrir para suporte e arquivar/excluir com confirmação |
| Configurações | Status verificável de integrações; modelo/provedor por tarefa, teste, revisão e auditoria de alterações; limites e erros de IA/Stripe/Supabase |
| Auditoria | Registrar ator, ação, alvo e resultado; proteger logs contra alteração pelo cliente |

Estrutura prevista: sidebar, tabelas densas, filtros, métricas e confirmação de
ações sensíveis. Seções: Visão Geral, Usuários, Estratégias, Créditos/Planos,
Eventos, Configurações e Logs.

Tabelas: `admin_users`, `admin_audit_logs`, `usage_events`, `credit_grants` e
`user_plans`. A implementação existente não equivale a homologação de todas as
ações. Há pendência de atomicidade entre certas mutações e seus logs.

### Dashboard e Eventos

Métricas: usuários totais/novos, estratégias geradas, créditos consumidos, bloqueios
por limite, conversão free para pago, plano mais usado, MRR e custo de IA estimados.
Mostrar período, fonte e limitações; ausência de dados não deve virar número inventado.

Editável no MVP significa filtros de período/plano/status e CSV, não um construtor
completo de BI. Exportações devem respeitar permissões e proteger dados pessoais.

Eventos previstos: login, onboarding iniciado/concluído, geração iniciada/concluída/
com erro, paywall visto, checkout iniciado e assinatura criada/cancelada. Eventos
financeiros precisam de fonte server-side; telemetria do cliente não é prova de receita.

## 8. Planos e Créditos

A tabela abaixo preserva a proposta antiga para revisão. **Não representa oferta
comercial aprovada, configuração Stripe vigente ou preços validados em mercado.**

| Plano proposto | Mensal | Anual | Estratégias propostas |
| --- | --- | --- | --- |
| Free | R$ 0 | Não aplicável | 2 vitalícias |
| Individual | R$ 47 | R$ 397 | 15/mês |
| Professional | R$ 97 | R$ 797 | 60/mês |
| Agency | R$ 247 | R$ 1.997 | 250/mês |

Revisar o modelo de oferta para carteira de créditos por operação. A proposta de
30/120/240 créditos no plano é ilustrativa e exige aprovação e custo medido.
Não manter refinamentos ilimitados enquanto toda geração tiver consumo.

Revisar custos reais por geração/refinamento, uso esperado, preços e IDs Stripe,
conversão e suporte antes de ativar vendas. Estimativas antigas de custo por IA,
margem de 85%, câmbio ou metas de MRR não são resultados atuais.

Requisitos obrigatórios: saldo confiável no servidor, bloqueio consistente, extras
administrativos refletidos no app, tratamento de concorrência e regra explícita
para falha/repetição. O ledger atômico de reserva, débito e estorno está pendente
(SEC-002). O UPDATE legado de uso/período pelo cliente deve ser eliminado sem
quebrar o fluxo existente. Assinatura não pode ser alterada pelo frontend.

## 9. Segurança e Operação

- Service Role e chaves privadas somente no servidor; nunca no bundle, repo ou logs.
- RLS para isolamento de contas; admin não ganha leitura irrestrita via frontend comum.
- Verificar admin em todas as ações sensíveis, não apenas ao mostrar o link.
- Webhook Stripe com assinatura, idempotência, ordenação e proteção contra replay.
- Mensagens de erro úteis sem revelar credenciais ou conteúdo sensível.
- Definir retenção, exclusão, uso de dados por fornecedores e termos antes de prometer
  que dados nunca serão usados para treinamento. Essa garantia não foi auditada.
- Distinguir dev, preview e produção. `npm run build` agora fixa NODE_ENV=production.
- Não reaplicar schema base nem migrations com histórico remoto divergente sem reconciliação.

## 10. Critérios de Aceitação e Pendências

- [x] Reproduzir erro de conclusão no app autenticado; diagnóstico 42501 no UPDATE de uso.
- [x] Preservar o briefing preenchido por Antony e conferir sua recuperação após recarga.
- [x] Confirmar login e plano reais sem extrair credenciais da sessão.
- [ ] Recuperar/importar as respostas e revisar, sem usar um saldo simulado.
- [x] Mostrar e reabrir as sete seções da geração anterior.
- [ ] Homologar uma nova geração real com prompts e pipeline deste lote.
- [x] Salvar estratégia e reencontrá-la em Estratégias salvas após recarga.
- [ ] Conferir consumo de crédito uma única vez e regra de falha/repetição no servidor.
- [ ] Validar acesso comum/admin no mesmo cadastro, sem bypass de autorização.
- [ ] Validar mutações admin e pagamentos com dados de teste autorizados.
- [ ] Publicar lote aprovado e fazer readback no domínio correto, sem confundir build com deploy.

Teste visual aprovado ou suíte automatizada verde não fecha esses itens sozinho.

## 11. Backlog e Sequência

Prioridade imediata: concluir discussão de onboarding, cotas e limites e obter
aprovação do plano. Execução posterior inicia por histórico persistente/botão,
SEC-002 e rotação dos dois modelos solicitados; depois homologar novo pipeline.
Depois: seleção e plano de monetização, Stories recorrentes, briefing/anexos e
piloto acompanhado. Detalhamento e aceite em PLANO-PILOTO-EMPREENDEDORES.md.

Pesquisa de mercado, pricing, briefing ampliado, base de conhecimento versionada,
melhorias de dashboard e distribuição continuam no planejamento. Aplicativos para
outras redes ficam em backlog, para outro chat, reutilizando a lógica somente após
validar o núcleo do StrategInsta.

Integrações futuras: Notion, Sheets, Trello/ClickUp, Canva, CapCut, Instagram/Meta
quando tecnicamente viáveis e autorizadas. Não implicam publicação automática,
acesso a contas ou geração nativa de mídia já implementados.

## 12. Fontes e Precedência

Este PRD registra requisitos e o estado conhecido em 10/09/2026. O handoff da raiz
registra a retomada imediata. Stories preservam evidências das respectivas etapas:

- `docs/stories/ACCESS-001-admin-e-usuario.md`: release técnico e acesso duplo.
- `docs/stories/UX-001-briefing-identidade-original.md`: opção 2 e testes locais.
- `docs/stories/BRAND-001-favicon-e-previa.md`: limpeza e ponte da prévia.
- `docs/SEGURANCA-LOTE-1-2026-09-05.md`: segurança e pendências.
- `design-qa.md`: aprovação visual local, não homologação funcional.

Trechos antigos que dizem aguardar escolha visual, prometem três minutos ou
tratam a prévia como suficiente são históricos e não devem prevalecer sobre esta
revisão. BUSINESS-MODEL e ROADMAP preservam hipóteses e trechos históricos; o
plano do piloto e este PRD prevalecem para público, sequência e funcionalidades. Não apagar o histórico para ocultar divergências.
