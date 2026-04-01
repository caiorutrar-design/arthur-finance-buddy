
-- Timestamp trigger function
CREATE OR REPLACE FUNCTION public.update_updated_at_column()
RETURNS TRIGGER AS $$
BEGIN
  NEW.updated_at = now();
  RETURN NEW;
END;
$$ LANGUAGE plpgsql SET search_path = public;

-- Organizations (multi-tenant)
CREATE TABLE public.organizations (
  id UUID NOT NULL DEFAULT gen_random_uuid() PRIMARY KEY,
  name TEXT NOT NULL,
  slug TEXT NOT NULL UNIQUE,
  created_at TIMESTAMPTZ NOT NULL DEFAULT now(),
  updated_at TIMESTAMPTZ NOT NULL DEFAULT now()
);
ALTER TABLE public.organizations ENABLE ROW LEVEL SECURITY;

CREATE TRIGGER update_organizations_updated_at
  BEFORE UPDATE ON public.organizations
  FOR EACH ROW EXECUTE FUNCTION public.update_updated_at_column();

-- WhatsApp Users
CREATE TABLE public.whatsapp_users (
  id UUID NOT NULL DEFAULT gen_random_uuid() PRIMARY KEY,
  organization_id UUID NOT NULL REFERENCES public.organizations(id) ON DELETE CASCADE,
  phone_number TEXT NOT NULL,
  display_name TEXT,
  created_at TIMESTAMPTZ NOT NULL DEFAULT now(),
  updated_at TIMESTAMPTZ NOT NULL DEFAULT now(),
  UNIQUE(organization_id, phone_number)
);
ALTER TABLE public.whatsapp_users ENABLE ROW LEVEL SECURITY;

CREATE INDEX idx_whatsapp_users_phone ON public.whatsapp_users(phone_number);

CREATE TRIGGER update_whatsapp_users_updated_at
  BEFORE UPDATE ON public.whatsapp_users
  FOR EACH ROW EXECUTE FUNCTION public.update_updated_at_column();

-- Messages
CREATE TABLE public.messages (
  id UUID NOT NULL DEFAULT gen_random_uuid() PRIMARY KEY,
  whatsapp_user_id UUID NOT NULL REFERENCES public.whatsapp_users(id) ON DELETE CASCADE,
  organization_id UUID NOT NULL REFERENCES public.organizations(id) ON DELETE CASCADE,
  content TEXT NOT NULL,
  role TEXT NOT NULL CHECK (role IN ('user', 'assistant', 'system')),
  direction TEXT NOT NULL CHECK (direction IN ('inbound', 'outbound')),
  whatsapp_message_id TEXT,
  created_at TIMESTAMPTZ NOT NULL DEFAULT now()
);
ALTER TABLE public.messages ENABLE ROW LEVEL SECURITY;

CREATE INDEX idx_messages_user ON public.messages(whatsapp_user_id);
CREATE INDEX idx_messages_created ON public.messages(created_at DESC);

-- Financial Categories
CREATE TABLE public.financial_categories (
  id UUID NOT NULL DEFAULT gen_random_uuid() PRIMARY KEY,
  organization_id UUID NOT NULL REFERENCES public.organizations(id) ON DELETE CASCADE,
  name TEXT NOT NULL,
  type TEXT NOT NULL CHECK (type IN ('expense', 'income')),
  created_at TIMESTAMPTZ NOT NULL DEFAULT now()
);
ALTER TABLE public.financial_categories ENABLE ROW LEVEL SECURITY;

-- Transactions
CREATE TABLE public.transactions (
  id UUID NOT NULL DEFAULT gen_random_uuid() PRIMARY KEY,
  whatsapp_user_id UUID NOT NULL REFERENCES public.whatsapp_users(id) ON DELETE CASCADE,
  organization_id UUID NOT NULL REFERENCES public.organizations(id) ON DELETE CASCADE,
  category_id UUID REFERENCES public.financial_categories(id),
  amount NUMERIC(12, 2) NOT NULL,
  description TEXT,
  type TEXT NOT NULL CHECK (type IN ('expense', 'income')),
  transaction_date DATE NOT NULL DEFAULT CURRENT_DATE,
  created_at TIMESTAMPTZ NOT NULL DEFAULT now()
);
ALTER TABLE public.transactions ENABLE ROW LEVEL SECURITY;

CREATE INDEX idx_transactions_user ON public.transactions(whatsapp_user_id);
CREATE INDEX idx_transactions_date ON public.transactions(transaction_date DESC);

-- RLS: Allow service role full access (edge functions use service role)
-- No public access policies needed since webhooks use service role key

-- Seed default organization
INSERT INTO public.organizations (name, slug) VALUES ('Default', 'default');

-- Seed default financial categories
INSERT INTO public.financial_categories (organization_id, name, type)
SELECT o.id, cat.name, cat.type
FROM public.organizations o,
(VALUES 
  ('Alimentação', 'expense'),
  ('Transporte', 'expense'),
  ('Moradia', 'expense'),
  ('Saúde', 'expense'),
  ('Educação', 'expense'),
  ('Lazer', 'expense'),
  ('Delivery', 'expense'),
  ('Mercado', 'expense'),
  ('Salário', 'income'),
  ('Freelance', 'income'),
  ('Investimentos', 'income'),
  ('Outros', 'expense')
) AS cat(name, type)
WHERE o.slug = 'default';
