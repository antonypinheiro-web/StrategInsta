# StrategInsta — Roadmap de Produto

**Versão:** 1.0 | **Data:** Março de 2026

---

## Sprint 1 — Fundação Técnica ✅ Em andamento

- [x] Clonar repositório e configurar ambiente local
- [x] Remover dependência do Lovable (lovable-tagger)
- [x] Instalar SDKs do Gemini e OpenAI
- [x] Criar Multi-AI Engine (`aiService.ts`) com Gemini + OpenAI fallback
- [x] Criar documentação inicial (PRD, Arquitetura, Modelo de Negócio, Roadmap)
- [ ] Configurar variáveis de ambiente no Vercel
- [ ] Testar build de produção

---

## Sprint 2 — Prompts & Onboarding em Chat

- [ ] Reescrever `OnboardingWizard.tsx` como chat progressivo (uma pergunta por vez)
- [ ] Implementar os 5 blocos de perguntas (14 perguntas total)
- [ ] Adicionar lógica de pular blocos opcionais
- [ ] Calibrar e testar prompts com dados reais do usuário (marca pessoal do Antony)
- [ ] Ajuste fino de qualidade das respostas geradas
- [ ] Testes com 5-10 estratégias reais para validar qualidade

---

## Sprint 3 — Sistema de Planos e Billing

- [ ] Criar tabela `subscriptions` no Supabase
- [ ] Implementar middleware de verificação de plano
- [ ] Criar sistema de créditos (contador visível + alertas progressivos)
- [ ] Integrar Stripe (checkout + customer portal + webhooks)
- [ ] Implementar lógica de limites por plano
- [ ] Página de upgrade com comparativo de planos
- [ ] Freemium: bloquear após 2 estratégias com CTA de upgrade

---

## Sprint 4 — Redesign & Landing Page

- [ ] Redesign do app (UI polish, identidade visual refinada)
- [ ] Landing page persuasiva e otimizada para conversão
  - [ ] Hero com proposta de valor clara
  - [ ] Seção "Como funciona" (3 passos)
  - [ ] Seção de benefícios por persona
  - [ ] Comparativo de planos com destaque no recomendado
  - [ ] Depoimentos (mockados inicialmente)
  - [ ] FAQ
  - [ ] CTA final
- [ ] Domínio customizado configurado no Vercel
- [ ] SEO básico (meta tags, OG tags)

---

## Sprint 5 — Validação e Lançamento

- [ ] Usar o app nos projetos e marca pessoal do Antony (validação real)
- [ ] Coletar feedback e ajustar prompts com base nos resultados
- [ ] Criar lista de espera / beta fechado
- [ ] Lançamento para primeiros 50 usuários
- [ ] Monitoramento de métricas (conversão, churn, NPS)

---

## Backlog — V2

- [ ] API pública para integrações externas
- [ ] Export para Notion, Google Sheets, Trello
- [ ] White-label no export (plano Professional+)
- [ ] Múltiplos perfis de cliente por conta
- [ ] Histórico de versões por etapa
- [ ] Onboarding via upload de briefing PDF

---

## Backlog — V3 (Upsell)

- [ ] Geração de imagem para posts via Imagen 4 (Google) ou DALL-E
- [ ] Geração de roteiro de vídeo para Reels
- [ ] Templates de carrossel personalizados
- [ ] Integração Instagram Graph API (publicação direta)
- [ ] Integração Meta Ads (campanhas a partir da estratégia)
- [ ] Integração Canva (templates pré-preenchidos)
- [ ] Integração Facebook/Edits/Meta Suite

---

## Ideias em Investigação

- Modo "Agência": gerenciar múltiplos clientes com workspace separado
- Report mensal automático para clientes (PDF com métricas + estratégia)
- StrategInsta Academy: conteúdo educativo sobre Instagram dentro do app
- Afiliados: programa de indicação com comissão recorrente
