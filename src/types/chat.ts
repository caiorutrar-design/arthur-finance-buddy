// Types for Chat
export interface ChatMessage {
  id: string;
  conversation_id: string;
  user_id: string;
  role: 'user' | 'assistant' | 'system';
  content: string;
  metadata: Record<string, unknown> | null;
  created_at: string;
}

export interface ChatConversation {
  id: string;
  user_id: string;
  title: string | null;
  created_at: string;
  updated_at: string;
}

export interface ChatSettings {
  id: string;
  user_id: string;
  provider: 'openai' | 'anthropic' | 'ollama';
  api_key_encrypted: string | null;
  model: string;
  system_prompt: string;
  ollama_base_url: string;
  ollama_model: string;
  created_at: string;
  updated_at: string;
}

export interface ChatContext {
  balance: number;
  totalIncome: number;
  totalExpense: number;
  categorySpending: Record<string, number>;
  goals: { name: string; current_amount: number; target_amount: number }[];
}
