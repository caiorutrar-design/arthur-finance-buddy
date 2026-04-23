-- Migration: 007_add_chat_settings.sql
-- Chat settings table for LLM configuration

CREATE TABLE public.chat_settings (
  id UUID NOT NULL DEFAULT gen_random_uuid() PRIMARY KEY,
  user_id UUID NOT NULL REFERENCES public.users(id) ON DELETE CASCADE,
  provider TEXT DEFAULT 'openai' CHECK (provider IN ('openai', 'anthropic', 'ollama')),
  api_key_encrypted TEXT,
  model TEXT DEFAULT 'gpt-4o-mini',
  system_prompt TEXT DEFAULT 'Você é um assistente financeiro pessoal chamado "Arthur". Você ajuda o usuário a gerenciar suas finanças, analisar gastos, criar metas e dar conselhos práticos. Use dados reais do usuário quando disponíveis. Seja amigável, direto e útil.',
  ollama_base_url TEXT DEFAULT 'http://localhost:11434',
  ollama_model TEXT DEFAULT 'llama3',
  created_at TIMESTAMPTZ NOT NULL DEFAULT now(),
  updated_at TIMESTAMPTZ NOT NULL DEFAULT now()
);
ALTER TABLE public.chat_settings ENABLE ROW LEVEL SECURITY;

CREATE TRIGGER update_chat_settings_updated_at
  BEFORE UPDATE ON public.chat_settings
  FOR EACH ROW EXECUTE FUNCTION public.update_updated_at_column();

CREATE POLICY "Users can manage own chat settings" ON public.chat_settings
  FOR ALL USING (auth.uid() = user_id);

CREATE POLICY "Service role full access on chat_settings" ON public.chat_settings
  FOR ALL USING (true) WITH CHECK (true);
