-- Migration: 001_add_users.sql
-- Adds users table with auth support, replacing whatsapp_users as the primary user table

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

CREATE TRIGGER update_users_updated_at
  BEFORE UPDATE ON public.users
  FOR EACH ROW EXECUTE FUNCTION public.update_updated_at_column();

CREATE INDEX idx_users_email ON public.users(email);
CREATE INDEX idx_users_organization ON public.users(organization_id);

-- RLS policies: users can only see/edit their own row
CREATE POLICY "Users can view own user" ON public.users
  FOR SELECT USING (auth.uid() = id);

CREATE POLICY "Users can update own user" ON public.users
  FOR UPDATE USING (auth.uid() = id);

CREATE POLICY "Users can insert own user" ON public.users
  FOR INSERT WITH CHECK (auth.uid() = id);

-- Allow service role full access for edge functions
CREATE POLICY "Service role full access on users" ON public.users
  FOR ALL USING (true) WITH CHECK (true);

-- Goals table (Phase 4 dependency)
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

CREATE TRIGGER update_goals_updated_at
  BEFORE UPDATE ON public.goals
  FOR EACH ROW EXECUTE FUNCTION public.update_updated_at_column();

CREATE POLICY "Users can manage own goals" ON public.goals
  FOR ALL USING (auth.uid() = user_id);

CREATE POLICY "Service role full access on goals" ON public.goals
  FOR ALL USING (true) WITH CHECK (true);

-- Budgets table
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

CREATE POLICY "Users can manage own budgets" ON public.budgets
  FOR ALL USING (auth.uid() = user_id);

CREATE POLICY "Service role full access on budgets" ON public.budgets
  FOR ALL USING (true) WITH CHECK (true);

-- Chat conversations table
CREATE TABLE public.chat_conversations (
  id UUID NOT NULL DEFAULT gen_random_uuid() PRIMARY KEY,
  user_id UUID NOT NULL REFERENCES public.users(id) ON DELETE CASCADE,
  title TEXT,
  created_at TIMESTAMPTZ NOT NULL DEFAULT now(),
  updated_at TIMESTAMPTZ NOT NULL DEFAULT now()
);
ALTER TABLE public.chat_conversations ENABLE ROW LEVEL SECURITY;

CREATE TRIGGER update_chat_conversations_updated_at
  BEFORE UPDATE ON public.chat_conversations
  FOR EACH ROW EXECUTE FUNCTION public.update_updated_at_column();

CREATE POLICY "Users can manage own conversations" ON public.chat_conversations
  FOR ALL USING (auth.uid() = user_id);

CREATE POLICY "Service role full access on chat_conversations" ON public.chat_conversations
  FOR ALL USING (true) WITH CHECK (true);

-- Chat messages table
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

CREATE POLICY "Users can manage own messages" ON public.chat_messages
  FOR ALL USING (auth.uid() = user_id);

CREATE POLICY "Service role full access on chat_messages" ON public.chat_messages
  FOR ALL USING (true) WITH CHECK (true);

-- Alerts table
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

CREATE POLICY "Users can manage own alerts" ON public.alerts
  FOR ALL USING (auth.uid() = user_id);

CREATE POLICY "Service role full access on alerts" ON public.alerts
  FOR ALL USING (true) WITH CHECK (true);

-- Telegram connections table
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

CREATE TRIGGER update_telegram_connections_updated_at
  BEFORE UPDATE ON public.telegram_connections
  FOR EACH ROW EXECUTE FUNCTION public.update_updated_at_column();

CREATE POLICY "Users can manage own telegram connections" ON public.telegram_connections
  FOR ALL USING (auth.uid() = user_id);

CREATE POLICY "Service role full access on telegram_connections" ON public.telegram_connections
  FOR ALL USING (true) WITH CHECK (true);

-- Update transactions to reference users instead of whatsapp_users
ALTER TABLE public.transactions DROP CONSTRAINT IF EXISTS transactions_whatsapp_user_id_fkey;
ALTER TABLE public.transactions DROP CONSTRAINT IF EXISTS transactions_organization_id_fkey;
ALTER TABLE public.transactions ADD COLUMN IF NOT EXISTS user_id UUID REFERENCES public.users(id) ON DELETE CASCADE;
UPDATE public.transactions SET user_id = u.id
FROM public.users u
JOIN public.whatsapp_users wu ON wu.phone_number = (
  SELECT wun.phone_number FROM public.whatsapp_users wun WHERE wun.id = transactions.whatsapp_user_id
) WHERE u.email = (wu.display_name || '@placeholder.local');
-- Note: this update may need manual adjustment based on actual data mapping
