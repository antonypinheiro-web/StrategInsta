# StrategInsta — Arquitetura Técnica

**Versão:** 1.0 | **Data:** Março de 2026

---

## Stack Tecnológica

| Camada | Tecnologia | Versão |
|--------|-----------|--------|
| Frontend | React + TypeScript | 18.x + 5.x |
| Build | Vite + SWC | 5.x |
| UI | Tailwind CSS + shadcn/ui | 3.x |
| Roteamento | React Router | 6.x |
| Estado | React Hooks (useState/useCallback) | — |
| Backend/Auth | Supabase | 2.x |
| IA Primária | Google Gemini 2.5 Flash | — |
| IA Fallback | OpenAI GPT-4o mini | — |
| Deploy | Vercel | — |
| Pagamentos | Stripe (a implementar) | — |

---

## Estrutura de Diretórios

```
src/
├── assets/             # Imagens, ícones, logo
├── components/
│   ├── ui/             # shadcn/ui components
│   ├── strategy/       # Componentes do dashboard de estratégia
│   ├── OnboardingWizard.tsx   # Chat de coleta de inputs
│   ├── StrategyDashboard.tsx  # Dashboard principal
│   ├── SidebarNav.tsx         # Navegação lateral
│   ├── HistoryPanel.tsx       # Histórico de estratégias
│   ├── LandingPage.tsx        # Página inicial
│   ├── LoadingSpinner.tsx     # Loading states
│   ├── InputDialog.tsx        # Dialog de input
│   └── SessionContextProvider.tsx # Auth context
├── hooks/              # Custom hooks
├── integrations/
│   └── supabase/       # Cliente e tipos Supabase
├── lib/                # Utilitários (cn, etc.)
├── pages/
│   └── Index.tsx       # Orquestrador principal
├── services/
│   └── aiService.ts    # Multi-AI Engine (Gemini + OpenAI)
├── types.ts            # Tipos TypeScript globais
└── main.tsx            # Entry point

docs/
├── PRD.md
├── ARCHITECTURE.md
├── BUSINESS-MODEL.md
├── ONBOARDING-FLOW.md
└── ROADMAP.md
```

---

## Multi-AI Engine (`aiService.ts`)

### Fluxo de Roteamento

```
Requisição de geração
        │
        ▼
  Gemini 2.5 Flash ──── sucesso ──▶ Retorna resultado
        │
      falha (timeout / rate limit / resposta insuficiente)
        │
        ▼
  GPT-4o mini ──── sucesso ──▶ Retorna resultado
        │
      falha
        │
        ▼
  Throw Error → Toast de erro ao usuário
```

### Critérios de Fallback
- Timeout implícito das APIs
- Rate limit (429)
- Resposta com menos de 50 caracteres
- Qualquer exceção não tratada

### Saídas JSON
As funções `generateWeeklyStoriesStrategy`, `generateContentTable`, `generateEditorialCalendar` e `generateActionPlan` pedem saída em JSON puro ao modelo. O código faz parse com extração por regex (`/\[[\s\S]*\]/` ou `/\{[\s\S]*\}/`) e tem fallback estruturado caso o parse falhe.

---

## Supabase — Schema Principal

### Tabela: `strategies`
| Campo | Tipo | Descrição |
|-------|------|-----------|
| id | uuid | PK |
| user_id | uuid | FK → auth.users |
| name | text | Nome dado pelo usuário |
| user_input | jsonb | Inputs do onboarding |
| generated_strategy | jsonb | Estratégia completa gerada |
| history | jsonb | Histórico de refinamentos |
| created_at | timestamptz | — |
| updated_at | timestamptz | — |

### Autenticação
- Supabase Auth (email/senha + OAuth futuro)
- RLS: usuário só acessa suas próprias estratégias

---

## Variáveis de Ambiente

```env
# AI
VITE_GEMINI_API_KEY=...
VITE_OPENAI_API_KEY=...
VITE_PRIMARY_AI=gemini
VITE_GEMINI_MODEL=gemini-2.5-flash
VITE_OPENAI_MODEL=gpt-4o-mini

# Supabase
VITE_SUPABASE_URL=...
VITE_SUPABASE_ANON_KEY=...

# Stripe (futuro)
VITE_STRIPE_PUBLIC_KEY=...
```

> ⚠️ NUNCA commitar `.env`. Adicionar ao Vercel via Environment Variables no painel.

---

## Segurança

### Atual
- Chaves de API no `.env` (nunca commitadas)
- `.gitignore` configurado

### Recomendado (próxima iteração)
- Mover chamadas de IA para **Supabase Edge Functions** — a chave nunca vai ao browser
- Rate limiting por usuário via Edge Function
- Validação de uso por plano antes de cada geração

---

## Performance

- Etapas 1-4 são **sequenciais** (cada uma aguarda a anterior para contexto)
- Etapas 5-7 são geradas em **paralelo** (`Promise.all`)
- Loading states com feedback visual progressivo
- Respostas são streaming-ready (futuro: usar streaming da Gemini API)
