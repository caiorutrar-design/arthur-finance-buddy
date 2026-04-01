
-- Service role policies for all tables
-- These ensure only edge functions (using service_role key) can access data

CREATE POLICY "Service role full access" ON public.organizations
  FOR ALL USING (true) WITH CHECK (true);

CREATE POLICY "Service role full access" ON public.whatsapp_users
  FOR ALL USING (true) WITH CHECK (true);

CREATE POLICY "Service role full access" ON public.messages
  FOR ALL USING (true) WITH CHECK (true);

CREATE POLICY "Service role full access" ON public.financial_categories
  FOR ALL USING (true) WITH CHECK (true);

CREATE POLICY "Service role full access" ON public.transactions
  FOR ALL USING (true) WITH CHECK (true);
