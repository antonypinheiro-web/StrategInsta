# StrategInsta — Product Requirements Document (PRD)

**Versão:** 1.0
**Data:** Março de 2026
**Status:** Em desenvolvimento ativo

---

## 1. Visão do Produto

### Problema
Criadores de conteúdo, empreendedores e profissionais de marketing enfrentam uma barreira real: saber que precisam de uma estratégia de conteúdo para o Instagram, mas não ter tempo, conhecimento técnico ou recursos para construir uma do zero. O resultado é postagem inconsistente, sem direcionamento e sem retorno.

### Solução
O StrategInsta é uma ferramenta SaaS que transforma inputs contextuais do usuário em uma estratégia completa e personalizada de conteúdo para Instagram, gerada por IA em minutos. Não é um gerador de texto genérico — é um sistema estratégico que entende o negócio, o público e os objetivos para entregar um plano executável.

### Proposta de Valor Central
> "Do briefing à estratégia completa em 3 minutos. Feito para o seu negócio, não para qualquer um."

---

## 2. Público-Alvo

### Segmentos Primários

| Segmento | Perfil | Dor Principal |
|----------|--------|---------------|
| **Empreendedor Individual** | Negócio próprio, sem equipe de marketing | Não sabe o que postar, perde tempo tentando planejar |
| **Social Media Manager** | Freelancer ou CLT gerenciando múltiplos clientes | Precisa de eficiência para escalar atendimentos |
| **Agência de Marketing** | Equipe gerenciando 10+ clientes de Instagram | Padronização de qualidade e velocidade de entrega |

### Segmento Secundário
- Criadores de conteúdo e influenciadores em fase de profissionalização
- Infoprodutores que usam Instagram como canal de vendas

---

## 3. Funcionalidades do MVP

### 3.1 Onboarding em Chat Progressivo
- Coleta de inputs via chat (uma pergunta por vez)
- 14 perguntas organizadas em 5 blocos temáticos
- Possibilidade de pular blocos
- Upload de arquivos de referência (até 5, 2MB cada)
- Persistência via localStorage para retomar depois

### 3.2 Pipeline de Geração de Estratégia

**Etapas sequenciais:**
1. Perfil do Cliente Ideal (ICP)
2. Ideias de Monetização
3. Bio do Instagram (4 opções)
4. Estratégia de Stories (7 dias)

**Etapas paralelas (ao finalizar sequencial):**
5. Matriz de Conteúdo (por funil)
6. Calendário Editorial (30 dias)
7. Plano de Ação (4 semanas)

### 3.3 Refinamento Interativo
- Usuário pode solicitar ajustes em cada etapa antes de confirmar
- Até N refinamentos por etapa (varia por plano)
- Histórico de versões por etapa

### 3.4 Dashboard de Estratégias
- Visualização organizada de todas as seções
- Navegação por sidebar
- Histórico de estratégias geradas
- Renomear, duplicar e deletar estratégias
- Export em PDF e texto

### 3.5 Sistema de Créditos e Limites
- Contador visível de estratégias restantes
- Alertas progressivos (ao usar 1º crédito, urgência no último)
- Upgrade imediato sem perda de dados
- Freemium: 2 estratégias vitalícias

---

## 4. Multi-AI Engine

### Arquitetura
- **Primário:** Google Gemini 2.5 Flash
- **Fallback:** OpenAI GPT-4o mini
- Roteamento automático em caso de falha
- Modelo premium (GPT-4.1) disponível para plano Agency

### Critérios de Fallback
1. Timeout > 30 segundos
2. Rate limit atingido
3. Resposta insuficiente (< 50 caracteres)
4. Erro de API

---

## 5. Modelo de Negócio

### Planos

| Plano | Preço/mês | Preço/ano | Estratégias | Target |
|-------|-----------|-----------|-------------|--------|
| Freemium | R$0 | — | 2 vitalícias | Conversão |
| Individual | R$47 | R$397 | 15/mês | Empreendedor solo |
| Professional | R$97 | R$797 | 60/mês | Social media manager |
| Agency | R$247 | R$1.997 | 250/mês | Agências |

### Meta de Margem
- Margem líquida mínima: **30%** (meta atual: ~85% com 100+ assinantes)

---

## 6. Integrações (Roadmap)

### MVP
- Export PDF/Texto nativo

### V2
- API pública para integração com ferramentas externas
- Notion, Google Sheets, Trello/ClickUp

### V3 (Backlog)
- Canva, CapCut (templates pré-preenchidos)
- Instagram Graph API (publicação direta)
- Meta Ads (campanhas a partir da estratégia)
- Geração de imagem/vídeo nativa (upsell)

---

## 7. Requisitos Não-Funcionais

- **Performance:** Geração completa em < 3 minutos
- **Disponibilidade:** 99.5% uptime
- **Segurança:** Chaves de API nunca expostas no frontend (usar proxy/edge functions)
- **Privacidade:** Dados do usuário não usados para treino de modelos
- **Escalabilidade:** Arquitetura stateless, custos variáveis com uso

---

## 8. Métricas de Sucesso

| Métrica | Meta 3 meses | Meta 6 meses |
|---------|-------------|-------------|
| Usuários Freemium | 500 | 2.000 |
| Conversão Free → Pago | 5% | 8% |
| Assinantes pagos | 50 | 200 |
| NPS | > 40 | > 60 |
| Churn mensal | < 10% | < 7% |
| Receita MRR | R$3.000 | R$12.000 |
