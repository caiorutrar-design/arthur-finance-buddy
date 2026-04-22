# 🏦 ARTHUR FINANCE BUDDY — PLANO DE IMPLANTAÇÃO
**Versão:** 1.0 | **Data:** 2026-04-22 | **Stack:** React + TypeScript + Vite + TailwindCSS + shadcn/ui + Supabase

---

## 📋 SUMÁRIO

1. [Estado Atual](#-estado-atual)
2. [DER - Diagrama Entidade-Relacionamento](#-der---diagrama-entidade-relacionamento)
3. [Novas Tabelas Necessárias](#-novas-tabelas-necessárias)
4. [Arquitetura da Aplicação](#-arquitetura-da-aplicação)
5. [API Endpoints](#-api-endpoints)
6. [Estrutura de Pastas](#-estrutura-de-pastas)
7. [Plano de Implantação (Fases)](#-plano-de-implantação-fases)
8. [Prioridades e Timeline](#-prioridades-e-timeline)

---

## 📊 ESTADO ATUAL

### ✅ Já Implementado
| Componente | Status |
|-----------|--------|
| Schema base (organizations, users, transactions, categories) | ✅ Feito |
| Chat UI (ChatPanel) | ✅ Feito |
| Dashboard UI (sidebar com cards) | ✅ Feito |
| Supabase + RLS configurado | ✅ Feito |
| Migrations prontas | ✅ Feito |

### ⚠️ Pendente (Bridge para "Assistente Financeiro")
| Componente | Status |
|-----------|--------|
| Autenticação (Auth) | ❌ Falta |
| Goals (Metas) | ❌ Falta |
| Budgets (Orçamentos por categoria) | ❌ Falta |
| Alerts (Alertas de gastos) | ❌ Falta |
| AI Chat (integração com LLM) | ❌ Falta (mock) |
| Telegram Integration | ❌ Falta |
| Chat History persistente | ❌ Parcial |

---

## 🔗 DER - DIAGRAMA ENTIDADE-RELACIONAMENTO

```
┌─────────────────┐       ┌──────────────────┐
│  organizations  │       │      users       │
├─────────────────┤       ├──────────────────┤
│ • id (PK)       │       │ • id (PK)        │
│ • name          │       │ • organization_id │──┐
│ • slug          │       │ • email          │  │
│ • created_at    │       │ • password_hash  │  │
│ • updated_at    │       │ • name           │  │
└─────────────────┘       │ • avatar_url     │  │
         │                │ • telegram_chat_id│  │
         │                │ • created_at     │  │
         │                │ • updated_at     │  │
         │                └──────────────────┘  │
         │                      │              │
         │                      │              │
         ▼                      ▼              │
┌─────────────────┐       ┌──────────────────┐  │
│ whatsapp_users  │       │      goals       │  │
├─────────────────┤       ├──────────────────┤  │
│ • id (PK)       │       │ • id (PK)        │◄─┤
│ • organization_id│◄─────│ • user_id (FK)   │  │
│ • phone_number  │       │ • name           │  │
│ • display_name  │       │ • target_amount  │  │
│ • created_at    │       │ • current_amount │  │
│ • updated_at    │       │ • deadline       │  │
└─────────────────┘       │ • icon           │  │
         │               │ • status         │  │
         │               │ • created_at     │  │
         │               └──────────────────┘  │
         │                                     │
         ▼                                     │
┌─────────────────┐       ┌──────────────────┐  │
│   transactions  │       │     budgets      │  │
├─────────────────┤       ├──────────────────┤  │
│ • id (PK)       │       │ • id (PK)        │◄─┤
│ • user_id (FK)  │◄──────│ • user_id (FK)   │  │
│ • category_id   │       │ • category_id(FK)│  │
│ • organization_id│◄─────│ • amount_limit   │  │
│ • amount        │       │ • period_type    │  │
│ • description   │       │ • start_date     │  │
│ • type          │       │ • end_date       │  │
│ • transaction_date│     │ • created_at     │  │
│ • created_at    │       └──────────────────┘  │
└─────────────────┘              │              │
         │                       │              │
         ▼                       ▼              │
┌─────────────────┐       ┌──────────────────┐   │
│     messages    │       │  chat_conversations│ │
├─────────────────┤       ├──────────────────┤   │
│ • id (PK)       │       │ • id (PK)        │◄─┤
│ • user_id (FK)  │◄──────│ • user_id (FK)   │  │
│ • organization_id│     │ • title          │  │
│ • content       │       │ • created_at     │  │
│ • role          │       │ • updated_at     │  │
│ • direction     │       └──────────────────┘  │
│ • created_at    │              │             │
└─────────────────┘              │             │
                   ┌─────────────┘             │
                   ▼                           │
           ┌──────────────────┐                │
           │    alerts        │                │
           ├──────────────────┤                │
           │ • id (PK)        │◄───────────────┘
           │ • user_id (FK)   │
           │ • type           │
           │ • title          │
           │ • message        │
           │ • is_read        │
           │ • created_at     │
           └──────────────────┘

┌─────────────────────┐
│ financial_categories│
├─────────────────────┤
│ • id (PK)           │
│ • organization_id (FK)│◄─┐
│ • name              │  │
│ • type              │  │
│ • icon              │  │
│ • color             │  │
│ • created_at        │  │
└─────────────────────┘  │
                        │
◄────────────────────────┘
  (referenciada por transactions e budgets)
```

---

## 🆕 NOVAS TABELAS NECESSÁRIAS

### 1. `users` (autenticação)
```sql
CREATE TABLE public.users (
  id UUID NOT NULL DEFAULT gen_random_uuid() PRIMARY KEY,
  organization_id UUID NOT NULL REFERENCES public.organizations(id) ON DELETE CASCADE,
  email TEXT NOT NULL UNIQUE,
  password_hash TEXT NOT NULL,
  name TEXT,
  avatar_url TEXT,
  telegram_chat_id TEXT,
  created_at TIMESTAMPTZ NOT NULL DEFAULT now(),
  updated_at TIMESTAMPTZ NOT NULL DEFAULT now()
);
ALTER TABLE public.users ENABLE ROW LEVEL SECURITY;
```

### 2. `goals` (metas financeiras)
```sql
CREATE TABLE public.goals (
  id UUID NOT NULL DEFAULT gen_random_uuid() PRIMARY KEY,
  user_id UUID NOT NULL REFERENCES public.users(id) ON DELETE CASCADE,
  name TEXT NOT NULL,
  target_amount NUMERIC(12, 2) NOT NULL,
  current_amount NUMERIC(12, 2) NOT NULL DEFAULT 0,
  deadline DATE,
  icon TEXT DEFAULT 'target',
  color TEXT,
  status TEXT DEFAULT 'active' CHECK (status IN ('active', 'completed', 'paused')),
  created_at TIMESTAMPTZ NOT NULL DEFAULT now()
);
ALTER TABLE public.goals ENABLE ROW LEVEL SECURITY;
```

### 3. `budgets` (orçamento por categoria)
```sql
CREATE TABLE public.budgets (
  id UUID NOT NULL DEFAULT gen_random_uuid() PRIMARY KEY,
  user_id UUID NOT NULL REFERENCES public.users(id) ON DELETE CASCADE,
  category_id UUID NOT NULL REFERENCES public.financial_categories(id) ON DELETE CASCADE,
  amount_limit NUMERIC(12, 2) NOT NULL,
  period_type TEXT DEFAULT 'monthly' CHECK (period_type IN ('weekly', 'monthly', 'yearly')),
  start_date DATE NOT NULL DEFAULT CURRENT_DATE,
  end_date DATE,
  created_at TIMESTAMPTZ NOT NULL DEFAULT now()
);
ALTER TABLE public.budgets ENABLE ROW LEVEL SECURITY;
CREATE UNIQUE INDEX idx_budgets_user_category ON public.budgets(user_id, category_id);
```

### 4. `chat_conversations` (contexto para IA)
```sql
CREATE TABLE public.chat_conversations (
  id UUID NOT NULL DEFAULT gen_random_uuid() PRIMARY KEY,
  user_id UUID NOT NULL REFERENCES public.users(id) ON DELETE CASCADE,
  title TEXT,
  created_at TIMESTAMPTZ NOT NULL DEFAULT now(),
  updated_at TIMESTAMPTZ NOT NULL DEFAULT now()
);
ALTER TABLE public.chat_conversations ENABLE ROW LEVEL SECURITY;
```

### 5. `chat_messages` (histórico de chat por conversa)
```sql
CREATE TABLE public.chat_messages (
  id UUID NOT NULL DEFAULT gen_random_uuid() PRIMARY KEY,
  conversation_id UUID NOT NULL REFERENCES public.chat_conversations(id) ON DELETE CASCADE,
  user_id UUID NOT NULL REFERENCES public.users(id) ON DELETE CASCADE,
  role TEXT NOT NULL CHECK (role IN ('user', 'assistant', 'system')),
  content TEXT NOT NULL,
  metadata JSONB,
  created_at TIMESTAMPTZ NOT NULL DEFAULT now()
);
ALTER TABLE public.chat_messages ENABLE ROW LEVEL SECURITY;
CREATE INDEX idx_chat_messages_conversation ON public.chat_messages(conversation_id);
```

### 6. `alerts` (notificações e alertas)
```sql
CREATE TABLE public.alerts (
  id UUID NOT NULL DEFAULT gen_random_uuid() PRIMARY KEY,
  user_id UUID NOT NULL REFERENCES public.users(id) ON DELETE CASCADE,
  type TEXT NOT NULL CHECK (type IN ('budget_exceeded', 'goal_progress', 'spending_alert', 'tip')),
  title TEXT NOT NULL,
  message TEXT NOT NULL,
  is_read BOOLEAN DEFAULT false,
  metadata JSONB,
  created_at TIMESTAMPTZ NOT NULL DEFAULT now()
);
ALTER TABLE public.alerts ENABLE ROW LEVEL SECURITY;
CREATE INDEX idx_alerts_user_unread ON public.alerts(user_id) WHERE is_read = false;
```

### 7. `telegram_connections` (vinculo Telegram)
```sql
CREATE TABLE public.telegram_connections (
  id UUID NOT NULL DEFAULT gen_random_uuid() PRIMARY KEY,
  user_id UUID NOT NULL REFERENCES public.users(id) ON DELETE CASCADE,
  telegram_chat_id TEXT NOT NULL UNIQUE,
  telegram_user_id TEXT,
  is_active BOOLEAN DEFAULT true,
  created_at TIMESTAMPTZ NOT NULL DEFAULT now(),
  updated_at TIMESTAMPTZ NOT NULL DEFAULT now()
);
ALTER TABLE public.telegram_connections ENABLE ROW LEVEL SECURITY;
```

---

## 🏗️ ARQUITETURA DA APLICAÇÃO

```
┌─────────────────────────────────────────────────────────────────┐
│                         FRONTEND (React)                         │
│  ┌──────────┐  ┌──────────┐  ┌──────────┐  ┌──────────────────┐ │
│  │ Dashboard │  │ Chat AI  │  │  Goals   │  │   Telegram Bot   │ │
│  │  (Stats)  │  │  (LLM)   │  │ (Metas)  │  │   (Edge Fn)     │ │
│  └────┬─────┘  └────┬─────┘  └────┬─────┘  └────────┬────────┘ │
│       │             │             │                  │          │
│       └─────────────┴──────┬──────┴──────────────────┘          │
│                            │                                     │
│                     Supabase Client                              │
│              (React Query + Realtime)                            │
└─────────────────────────────┬───────────────────────────────────┘
                              │
              ┌───────────────┼───────────────┐
              ▼               ▼               ▼
     ┌────────────┐   ┌────────────┐   ┌────────────┐
     │  Database  │   │   Auth     │   │  Edge Fn   │
     │  (Postgres)│   │  (Auth)    │   │  (AI/Tg)   │
     └────────────┘   └────────────┘   └────────────┘
```

### Fluxo de Dados

```
┌──────────────────────────────────────────────────────────────────┐
│                         FLUXO DE DADOS                             │
├──────────────────────────────────────────────────────────────────┤
│                                                                   │
│  [User Input] → [React Component] → [React Query Mutation]       │
│                                              │                    │
│                                              ▼                    │
│                                    [Supabase Client]              │
│                                              │                    │
│                          ┌───────────────────┼───────────────────┐
│                          ▼                   ▼                   │
│                   [REST API]          [Edge Functions]            │
│                   (CRUD ops)          (AI, Telegram)             │
│                          │                   │                   │
│                          ▼                   ▼                   │
│                   [PostgreSQL]         [External APIs]           │
│                   (Persistent)         (LLM, Telegram)           │
│                                                                   │
└──────────────────────────────────────────────────────────────────┘
```

### React Query Patterns

```typescript
// Queries para dados
useQuery({
  queryKey: ['transactions', userId, month],
  queryFn: () => supabase.from('transactions').select('*').eq('user_id', userId),
})

// Mutations para writes
useMutation({
  mutationFn: (newTransaction) => 
    supabase.from('transactions').insert(newTransaction),
  onSuccess: () => queryClient.invalidateQueries(['transactions']),
})

// Realtime para updates
supabase.channel('alerts')
  .on('postgres_changes', { event: 'INSERT', schema: 'public', table: 'alerts' }, 
    (payload) => { /* handle new alert */ })
  .subscribe()
```

---

## 🌐 API ENDPOINTS

### Supabase REST (via PostgREST)

| Método | Endpoint | Descrição |
|--------|----------|-----------|
| GET | `/transactions?user_id=eq.{id}&order=transaction_date.desc` | Lista transações |
| POST | `/transactions` | Cria transação |
| PATCH | `/transactions?id=eq.{id}` | Atualiza transação |
| DELETE | `/transactions?id=eq.{id}` | Remove transação |
| GET | `/goals?user_id=eq.{id}` | Lista metas |
| POST | `/goals` | Cria meta |
| GET | `/budgets?user_id=eq.{id}` | Lista orçamentos |
| GET | `/alerts?user_id=eq.{id}&is_read=eq.false` | Lista alertas não lidos |
| PATCH | `/alerts?id=eq.{id}` | Marca alerta como lido |
| GET | `/chat_messages?conversation_id=eq.{id}&order=created_at.asc` | Histórico do chat |

### Edge Functions (Supabase)

| Função | Endpoint | Descrição |
|--------|----------|-----------|
| `ai-chat` | `/functions/v1/ai-chat` | Processa mensagem do chat com IA |
| `ai-analyze` | `/functions/v1/ai-analyze` | Analisa gastos e gera insights |
| `telegram-webhook` | `/functions/v1/telegram-webhook` | Recebe updates do Telegram |
| `send-telegram` | `/functions/v1/send-telegram` | Envia mensagem para Telegram |
| `generate-alerts` | `/functions/v1/generate-alerts` | Verifica e gera alertas automáticos |

### Exemplo: AI Chat Edge Function

```typescript
// supabase/functions/ai-chat/index.ts
Deno.serve(async (req) => {
  const { user_id, message, conversation_id } = await req.json();
  
  // 1. Busca contexto do usuário (transações recentes, metas, alertas)
  const userContext = await getUserContext(user_id);
  
  // 2. Monta prompt com contexto
  const prompt = buildFinancialPrompt(message, userContext);
  
  // 3. Chama LLM (OpenAI/Claude/Ollama)
  const response = await callLLM(prompt);
  
  // 4. Salva mensagem no banco
  await saveChatMessage(conversation_id, user_id, 'user', message);
  await saveChatMessage(conversation_id, user_id, 'assistant', response);
  
  return new Response(JSON.stringify({ response }));
});
```

---

## 📁 ESTRUTURA DE PASTAS

```
arthur-finance-buddy/
├── src/
│   ├── components/
│   │   ├── ui/                    # Componentes shadcn/ui
│   │   ├── dashboard/
│   │   │   ├── DashboardPage.tsx
│   │   │   ├── FinancialCard.tsx   # ✅ existente
│   │   │   ├── CategoryBar.tsx     # ✅ existente
│   │   │   ├── GoalCard.tsx        # ✅ existente
│   │   │   ├── TransactionList.tsx # NOVO
│   │   │   ├── AlertBanner.tsx      # NOVO
│   │   │   └── SpendingChart.tsx   # NOVO
│   │   ├── chat/
│   │   │   ├── ChatPanel.tsx        # ✅ existente
│   │   │   ├── ChatInput.tsx        # NOVO
│   │   │   ├── ChatMessage.tsx      # NOVO
│   │   │   └── ChatWelcome.tsx      # NOVO
│   │   ├── goals/
│   │   │   ├── GoalsPage.tsx        # NOVO
│   │   │   ├── GoalForm.tsx         # NOVO
│   │   │   └── GoalProgress.tsx     # NOVO
│   │   └── layout/
│   │       ├── Sidebar.tsx          # NOVO
│   │       ├── Header.tsx           # NOVO
│   │       └── MobileNav.tsx        # NOVO
│   ├── pages/
│   │   ├── Index.tsx                # ✅ existente (Dashboard + Chat)
│   │   ├── Login.tsx                # NOVO
│   │   ├── Goals.tsx                # NOVO
│   │   ├── Transactions.tsx          # NOVO
│   │   ├── Reports.tsx              # NOVO
│   │   └── Settings.tsx             # NOVO
│   ├── hooks/
│   │   ├── useAuth.tsx              # NOVO
│   │   ├── useTransactions.ts        # NOVO
│   │   ├── useGoals.ts              # NOVO
│   │   ├── useAlerts.ts             # NOVO
│   │   └── useChat.ts               # NOVO
│   ├── lib/
│   │   ├── supabase/
│   │   │   ├── client.ts            # ✅ existente
│   │   │   ├── server.ts            # NOVO (Edge functions)
│   │   │   └── types.ts             # ✅ existente
│   │   ├── ai/
│   │   │   ├── prompts.ts           # NOVO
│   │   │   └── analytics.ts         # NOVO
│   │   └── utils.ts                 # ✅ existente
│   ├── stores/                      # Zustand/Jotai se necessário
│   │   └── userStore.ts            # NOVO
│   ├── types/
│   │   ├── database.ts              # Tipos gerados do Supabase
│   │   └── index.ts                 # Tipos da app
│   └── App.tsx                      # ✅ existente
├── supabase/
│   ├── functions/                   # Edge Functions
│   │   ├── ai-chat/
│   │   ├── ai-analyze/
│   │   ├── telegram-webhook/
│   │   ├── send-telegram/
│   │   └── generate-alerts/
│   └── migrations/
│       ├── 20260401002908_*.sql     # ✅ existente
│       ├── 20260401002922_*.sql     # ✅ existente
│       └── 001_add_users.sql        # NOVO
│       └── 002_add_goals.sql        # NOVO
│       └── 003_add_budgets.sql       # NOVO
│       └── 004_add_chat_conversations.sql  # NOVO
│       └── 005_add_alerts.sql       # NOVO
│       └── 006_add_telegram.sql      # NOVO
└── package.json
```

---

## 📅 PLANO DE IMPLANTAÇÃO ( FASES )

### FASE 1: AUTENTICAÇÃO + BASE (Semana 1)
**Duração:** 5 dias | **Prioridade:** 🔴 Crítica

- [ ] **1.1** Adicionar `users` table com auth
  ```sql
  -- Criar migration: 001_add_users.sql
  -- Incluir: id, email, password_hash, name, telegram_chat_id
  ```
- [ ] **1.2** Configurar Supabase Auth (email/password)
- [ ] **1.3** Criar tela de Login/Register
- [ ] **1.4** Implementar `useAuth` hook com React Query
- [ ] **1.5** Adicionar HOC de autenticação (`ProtectedRoute`)
- [ ] **1.6** Migrar `whatsapp_users` → `users` (ou unificar)
- [ ] **1.7** Configurar RLS policies para `users`

**Entregável:** Login funcional com email/senha

---

### FASE 2: TRANSAÇÕES + CATEGORIAS (Semana 2)
**Duração:** 5 dias | **Prioridade:** 🔴 Crítica

- [ ] **2.1** Adicionar campos extras em `transactions`
  - `user_id` (FK → users)
  - `notes` (TEXT)
  - `is_recurring` (BOOLEAN)
  - `recurring_id` (UUID, se recorrente)
- [ ] **2.2** Criar CRUD de transações no frontend
- [ ] **2.3** Implementar `useTransactions` hook
- [ ] **2.4** Criar página de lista de transações
- [ ] **2.5** Adicionar filtros (data, categoria, tipo)
- [ ] **2.6** Criar modal de adicionar/editar transação
- [ ] **2.7** Validar inputs (amount > 0, data válida)

**Entregável:** CRUD completo de transações

---

### FASE 3: ORÇAMENTOS + ALERTAS (Semana 3)
**Duração:** 5 dias | **Prioridade:** 🟠 Alta

- [ ] **3.1** Criar tabela `budgets`
- [ ] **3.2** Criar tabela `alerts`
- [ ] **3.3** Implementar página de orçamentos
  - Definir limite por categoria
  - Visualizar % utilizado
  - Alerta ao ultrapassar 80% e 100%
- [ ] **3.4** Implementar `generate-alerts` Edge Function
  - Rodar via cron (diário)
  - Verificar budgets vs gastos
  - Gerar alertas automáticos
- [ ] **3.5** Adicionar notificação em tempo real
  - Usar Supabase Realtime para `alerts`

**Entregável:** Sistema de alertas funcionando

---

### FASE 4: METAS FINANCEIRAS (Semana 4)
**Duração:** 3 dias | **Prioridade:** 🟡 Média

- [ ] **4.1** Criar tabela `goals`
- [ ] **4.2** Implementar `useGoals` hook
- [ ] **4.3** Criar página de metas
  - Progress bar visual
  -deadline countdown
  - Editar/apagar meta
- [ ] **4.4** Vincular transações à meta (opcional)
- [ ] **4.5** Alertas de progresso de meta

**Entregável:** Página de metas completa

---

### FASE 5: AI CHAT - INTEGRAÇÃO LLM (Semanas 5-6)
**Duração:** 8 dias | **Prioridade:** 🟠 Alta

- [ ] **5.1** Criar tabelas `chat_conversations` e `chat_messages`
- [ ] **5.2** Implementar Edge Function `ai-chat`
  - Receber mensagem do usuário
  - Buscar contexto (transações, metas, alertas)
  - Chamar LLM (OpenAI GPT-4 ou Claude)
  - Retornar resposta
- [ ] **5.3** Persistir histórico de chat
- [ ] **5.4** Melhorar UI do chat
  - Indicador de "digitando..."
  - Markdown rendering
  - Botões de sugestão
- [ ] **5.5** Implementar `ai-analyze` (análise automática)
  - Resumo semanal de gastos
  - Comparativo com meses anteriores
  - Tendências identificadas

**Entregável:** Chat com IA respondendo com contexto real

---

### FASE 6: TELEGRAM INTEGRATION (Semanas 7-8)
**Duração:** 6 dias | **Prioridade:** 🟡 Média

- [ ] **6.1** Criar tabela `telegram_connections`
- [ ] **6.2** Implementar Edge Function `telegram-webhook`
  - Receber updates do Telegram
  - Validar token do bot
  - Integrar com `ai-chat`
- [ ] **6.3** Implementar Edge Function `send-telegram`
  - Enviar notificações para o usuário
  - Enviar resumos diários/semanais
- [ ] **6.4** Criar fluxo de "/start" e vinculação
- [ ] **6.5** Botões inline para ações rápidas
- [ ] **6.6** Testar com canal existente

**Entregável:** Bot no Telegram respondendo como Arthur

---

### FASE 7: REFINAMENTOS + DASHBOARD (Semana 9)
**Duração:** 5 dias | **Prioridade:** 🟢 Normal

- [ ] **7.1** Criar dashboard principal (agregar tudo)
  - Cards de resumo (saldo, gastos, receitas)
  - Gráfico de gastos por categoria
  - Gráfico de evolução patrimonial
  - Lista de alertas recentes
- [ ] **7.2** Página de relatórios
  - Exportar para Excel/CSV
  - Filtros avançados
- [ ] **7.3** Responsividade mobile
- [ ] **7.4** Dark mode
- [ ] **7.5** Performance: lazy loading, virtualização

**Entregável:** Dashboard completo e polido

---

## ⏱️ PRIORIDADES E TIMELINE

```
SEMANA   FASE                      PRIORIDADE   ESFORÇO
─────────────────────────────────────────────────────────
  1      Fase 1: Auth + Base      🔴 Crítica    ████████
  2      Fase 2: Transações       🔴 Crítica    ████████
  3      Fase 3: Orçamentos       🟠 Alta       ████████
  4      Fase 4: Metas            🟡 Média      ████
  5-6    Fase 5: AI Chat          🟠 Alta       ████████████
  7-8    Fase 6: Telegram         🟡 Média      ██████████
  9      Fase 7: Dashboard        🟢 Normal     ████████
─────────────────────────────────────────────────────────
TOTAL:   ~9 semanas (2 meses)
```

### Resumo por Prioridade

| Prioridade | Itens | Total |
|------------|-------|-------|
| 🔴 Crítica | Auth, Transações | 2 semanas |
| 🟠 Alta | Orçamentos, AI Chat | 3 semanas |
| 🟡 Média | Metas, Telegram | 2.5 semanas |
| 🟢 Normal | Dashboard, Refinamentos | 1.5 semanas |

---

## 📊 MATRIZ DE DEPENDÊNCIAS

```
Fase 1 (Auth)
    │
    ▼
Fase 2 (Transações) ───────────────┐
    │                               │
    ▼                               │
Fase 3 (Orçamentos/Alertas)        │  ←─┐
    │                               │    │
    ▼                               │    │
Fase 4 (Metas) ────────────────────┴───► Fase 5 (AI Chat)
    │                                        │
    │                                        ▼
    │                               Fase 6 (Telegram)
    │                                        │
    └────────────────────────────────────────┘
                              │
                              ▼
                        Fase 7 (Dashboard)
```

---

## 🔧 CONFIGURAÇÕES NECESSÁRIAS

### Variáveis de Ambiente (.env)

```bash
# Supabase
VITE_SUPABASE_URL=https://xxx.supabase.co
VITE_SUPABASE_ANON_KEY=xxx
SUPABASE_SERVICE_ROLE_KEY=xxx  # Edge Functions

# AI (OpenAI ou similar)
OPENAI_API_KEY=sk-xxx
# OU para Ollama local:
OLLAMA_BASE_URL=http://localhost:11434
OLLAMA_MODEL=llama3

# Telegram
TELEGRAM_BOT_TOKEN=xxx
TELEGRAM_WEBHOOK_URL=https://xxx.supabase.co/functions/v1/telegram-webhook
```

### Row Level Security (RLS)

```sql
-- Politicas de usuário (após adicionar auth)
CREATE POLICY "Users can view own data" ON transactions
  FOR SELECT USING (auth.uid() = user_id);

CREATE POLICY "Users can insert own data" ON transactions
  FOR INSERT WITH CHECK (auth.uid() = user_id);

CREATE POLICY "Users can update own data" ON transactions
  FOR UPDATE USING (auth.uid() = user_id);

CREATE POLICY "Users can delete own data" ON transactions
  FOR DELETE USING (auth.uid() = user_id);
```

---

## ✅ CHECKLIST DE IMPLEMENTAÇÃO

### Pré-requisitos
- [ ] Conta Supabase criada
- [ ] Projeto configurado
- [ ] Database schema migrado
- [ ] Edge Functions deployadas

### Backend (Supabase)
- [ ] Auth configurado (email/password)
- [ ] Tables criadas (users, goals, budgets, alerts, chat_*)
- [ ] RLS policies aplicadas
- [ ] Edge Functions deployadas
- [ ] Realtime habilitado nas tabelas

### Frontend
- [ ] React Query configurado
- [ ] Rotas protegidas com Auth
- [ ] Hooks implementados
- [ ] Componentes de UI prontos
- [ ] Chat com IA integrado
- [ ] Telegram conectado

### Operacionais
- [ ] Monitoramento (erros, performance)
- [ ] Backup automático do banco
- [ ] Logs das Edge Functions
- [ ] Testes básicos

---

## 🎯 RECOMENDAÇÕES

1. **Comece pela Fase 1-2** — são a base de tudo. Não pule.
2. **Use mock data inicialmente** para UI while backend berkembang
3. **AI Chat pode usar Ollama local primeiro** antes de pagar OpenAI
4. **Telegram é opcional** — implemente se o canal já existir
5. **Realtime é killer feature** — use para alertas e chat

---

_Documento criado em: 2026-04-22_  
_Autor: NOAH - Líder de TI_  
_Projeto: arthur-finance-buddy_
