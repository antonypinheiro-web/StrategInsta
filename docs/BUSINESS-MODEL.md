# StrategInsta — Modelo de Negócio

**Versão:** 1.0 | **Data:** Março de 2026

---

## Custo por Estratégia Gerada

### Estimativa de Tokens por Estratégia Completa

| Etapa | Input | Output |
|-------|-------|--------|
| Perfil do Cliente Ideal | ~1.500 | ~1.200 |
| Ideias de Monetização | ~1.200 | ~1.000 |
| Bio do Instagram | ~800 | ~600 |
| Estratégia de Stories | ~1.000 | ~2.000 |
| Matriz de Conteúdo | ~1.200 | ~3.000 |
| Calendário Editorial | ~1.500 | ~4.000 |
| Plano de Ação | ~1.000 | ~2.000 |
| **Total** | **~8.200** | **~13.800** |

### Custo por Modelo

| Modelo | Input /1M | Output /1M | Custo USD | Custo BRL* |
|--------|----------|-----------|-----------|-----------|
| **Gemini 2.5 Flash** | $0,15 | $0,60 | ~$0,0095 | **~R$0,054** |
| GPT-4o mini (fallback) | $0,15 | $0,60 | ~$0,0095 | ~R$0,054 |
| GPT-4.1 (Agency premium) | $2,00 | $8,00 | ~$0,127 | ~R$0,72 |

*Câmbio: USD 1 = BRL 5,70

**Custo médio operacional: ~R$0,06/estratégia**

---

## Planos e Precificação

### 🆓 Freemium
| Item | Valor |
|------|-------|
| Preço | R$0 |
| Estratégias | 2 vitalícias |
| Refinamentos | 1 por estratégia |
| Export | Apenas visualização |
| Marca d'água | Sim |
| **Objetivo** | Conversão para pago |

**Regra de alertas:**
- Ao gerar a 1ª: "Você usou 1 de 2 estratégias gratuitas"
- Ao iniciar a 2ª: "Esta é sua última estratégia gratuita. Assine para continuar."
- Após usar as 2: Bloqueio com CTA de upgrade

---

### 👤 Individual — R$47/mês | R$397/ano
| Item | Valor |
|------|-------|
| Estratégias | 15/mês |
| Refinamentos | 5 por estratégia |
| Perfis | 1 conta |
| Histórico | 6 meses |
| Export | PDF + Texto |
| Onboarding assistido | Sim |
| Custo IA/mês | ~R$0,90 |
| **Margem bruta** | **~98%** |

---

### 📱 Professional — R$97/mês | R$797/ano
| Item | Valor |
|------|-------|
| Estratégias | 60/mês |
| Refinamentos | Ilimitado |
| Perfis (clientes) | Até 10 |
| Histórico | 1 ano |
| Export | PDF + Texto + CSV |
| API Access | Sim |
| White-label export | Sim |
| Custo IA/mês | ~R$3,60 |
| **Margem bruta** | **~96%** |

---

### 🏢 Agency — R$247/mês | R$1.997/ano
| Item | Valor |
|------|-------|
| Estratégias | 250/mês |
| Refinamentos | Ilimitado |
| Perfis (clientes) | Ilimitado |
| Usuários na conta | Até 5 |
| Histórico | Ilimitado |
| Export avançado | Sim |
| White-label | Sim |
| API Access completo | Sim |
| Modelo de IA | GPT-4.1 (premium) |
| Suporte dedicado | Sim |
| Custo IA/mês | ~R$15 |
| **Margem bruta** | **~94%** |

---

## Projeções Financeiras

### Cenário Conservador — Mês 3
| Plano | Assinantes | MRR | Custo IA | Stripe (3,5%) |
|-------|-----------|-----|----------|--------------|
| Individual | 30 | R$1.410 | R$27 | R$49 |
| Professional | 10 | R$970 | R$36 | R$34 |
| Agency | 3 | R$741 | R$45 | R$26 |
| **Total** | **43** | **R$3.121** | **R$108** | **R$109** |

Fixos: R$260 → **Lucro líquido: ~R$2.644 (85% margem)**

### Cenário Moderado — Mês 6
| Plano | Assinantes | MRR |
|-------|-----------|-----|
| Individual | 80 | R$3.760 |
| Professional | 25 | R$2.425 |
| Agency | 8 | R$1.976 |
| **Total** | **113** | **R$8.161** |

Custos totais: ~R$867 → **Lucro líquido: ~R$7.294 (89% margem)**

### Break-even
Ponto de equilíbrio (cobrir custos fixos R$260 + Stripe):
- Apenas **7 assinantes Individual** já cobrem os custos fixos
- Break-even real: < 15 assinantes no total

---

## Estratégia de Conversão Freemium → Pago

### Gatilhos de Upgrade
1. **Ao usar a 1ª estratégia:** Banner contextual "Gostou? Assine e tenha 15/mês"
2. **Ao iniciar a 2ª:** Modal com comparação dos planos
3. **Ao tentar gerar a 3ª:** Bloqueio com oferta especial (desconto 20% no 1º mês)
4. **No dashboard:** Botão "Upgrade" sempre visível com badge de benefícios

### Meta de Conversão
- Freemium → Pago: 5-8%
- Com 500 usuários freemium: 25-40 assinantes pagos
- MRR estimado com 500 freemium: R$1.500 - R$2.500

---

## Stack de Pagamentos (Stripe)

### A implementar:
- Checkout Session para novos assinantes
- Customer Portal para gerenciar assinatura
- Webhooks: `customer.subscription.created`, `invoice.paid`, `customer.subscription.deleted`
- Tabela `subscriptions` no Supabase sincronizada via webhook
- Middleware de verificação de plano antes de cada geração
