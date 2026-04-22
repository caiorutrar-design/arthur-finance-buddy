-- Migration: 002_add_transactions_rls.sql
-- Adds RLS policies for transactions and financial_categories (Phase 2)

-- Ensure transactions table exists and has user_id
DO $$
BEGIN
  IF NOT EXISTS (SELECT 1 FROM information_schema.columns WHERE table_name = 'transactions' AND column_name = 'user_id') THEN
    ALTER TABLE public.transactions ADD COLUMN user_id UUID REFERENCES public.users(id) ON DELETE SET NULL;
  END IF;
END $$;

-- Add icon and color to financial_categories if they don't exist
DO $$
BEGIN
  IF NOT EXISTS (SELECT 1 FROM information_schema.columns WHERE table_name = 'financial_categories' AND column_name = 'icon') THEN
    ALTER TABLE public.financial_categories ADD COLUMN icon TEXT;
  END IF;
  IF NOT EXISTS (SELECT 1 FROM information_schema.columns WHERE table_name = 'financial_categories' AND column_name = 'color') THEN
    ALTER TABLE public.financial_categories ADD COLUMN color TEXT;
  END IF;
END $$;

-- Transactions RLS policies (authenticated users manage own transactions)
CREATE POLICY "Users can view own transactions" ON public.transactions
  FOR SELECT USING (auth.uid() = user_id);

CREATE POLICY "Users can insert own transactions" ON public.transactions
  FOR INSERT WITH CHECK (auth.uid() = user_id);

CREATE POLICY "Users can update own transactions" ON public.transactions
  FOR UPDATE USING (auth.uid() = user_id);

CREATE POLICY "Users can delete own transactions" ON public.transactions
  FOR DELETE USING (auth.uid() = user_id);

-- Financial categories policies (authenticated users can view categories)
CREATE POLICY "Users can view categories" ON public.financial_categories
  FOR SELECT USING (true);

CREATE POLICY "Users can insert categories" ON public.financial_categories
  FOR INSERT WITH CHECK (true);

CREATE POLICY "Users can update categories" ON public.financial_categories
  FOR UPDATE USING (true);

-- Indexes for better query performance
CREATE INDEX IF NOT EXISTS idx_transactions_user_id ON public.transactions(user_id);
CREATE INDEX IF NOT EXISTS idx_transactions_category ON public.transactions(category_id);
CREATE INDEX IF NOT EXISTS idx_transactions_date ON public.transactions(transaction_date DESC);
CREATE INDEX IF NOT EXISTS idx_transactions_type ON public.transactions(type);

-- Seed default categories with icons and colors if not already seeded
INSERT INTO public.financial_categories (organization_id, name, type, icon, color)
SELECT o.id, cat.name, cat.type, cat.icon, cat.color
FROM public.organizations o
CROSS JOIN (VALUES 
  ('Alimentação', 'expense', 'Utensils', '#ef4444'),
  ('Transporte', 'expense', 'Car', '#f97316'),
  ('Moradia', 'expense', 'Home', '#eab308'),
  ('Saúde', 'expense', 'Heart', '#22c55e'),
  ('Educação', 'expense', 'GraduationCap', '#06b6d4'),
  ('Lazer', 'expense', 'Gamepad2', '#8b5cf6'),
  ('Delivery', 'expense', 'Bike', '#ec4899'),
  ('Mercado', 'expense', 'ShoppingCart', '#14b8a6'),
  ('Salário', 'income', 'Wallet', '#22c55e'),
  ('Freelance', 'income', 'Briefcase', '#06b6d4'),
  ('Investimentos', 'income', 'TrendingUp', '#3b82f6'),
  ('Outros', 'expense', 'MoreHorizontal', '#6b7280')
) AS cat(name, type, icon, color)
WHERE o.slug = 'default'
ON CONFLICT DO NOTHING;
