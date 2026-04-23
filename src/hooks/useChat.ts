import { useQuery, useMutation, useQueryClient } from '@tanstack/react-query';
import { supabase } from '@/integrations/supabase/client';
import { chatWithOllama, testOllama } from '@/lib/ollama';
import type { ChatMessage, ChatConversation } from '@/types/chat';

const AI_PROVIDER = import.meta.env.VITE_AI_PROVIDER || 'supabase';

export const useConversations = (userId?: string) => {
  return useQuery({
    queryKey: ['chat-conversations', userId],
    queryFn: async (): Promise<ChatConversation[]> => {
      if (!userId) return [];
      const { data, error } = await supabase
        .from('chat_conversations')
        .select('*')
        .eq('user_id', userId)
        .order('updated_at', { ascending: false });

      if (error) throw error;
      return data ?? [];
    },
    enabled: !!userId,
    staleTime: 1000 * 60,
  });
};

export const useChatMessages = (conversationId?: string) => {
  return useQuery({
    queryKey: ['chat-messages', conversationId],
    queryFn: async (): Promise<ChatMessage[]> => {
      if (!conversationId) return [];
      const { data, error } = await supabase
        .from('chat_messages')
        .select('*')
        .eq('conversation_id', conversationId)
        .order('created_at', { ascending: true });

      if (error) throw error;
      return data ?? [];
    },
    enabled: !!conversationId,
    staleTime: 1000 * 30,
  });
};

export const useSendMessage = () => {
  const queryClient = useQueryClient();

  return useMutation({
    mutationFn: async ({
      userId,
      message,
      conversationId,
    }: {
      userId: string;
      message: string;
      conversationId?: string;
    }): Promise<{ response: string; conversation_id: string }> => {
      // Obter contexto financeiro do usuário
      const { data: userContext } = await getUserContext(userId);

      let response = '';
      let convId = conversationId;

      // Criar nova conversa se não existir
      if (!convId) {
        const { data: newConv } = await supabase
          .from('chat_conversations')
          .insert({ user_id: userId, title: message.slice(0, 50) })
          .select()
          .single();
        convId = newConv?.id;
      }

      // Salvar mensagem do usuário
      if (convId) {
        await supabase.from('chat_messages').insert({
          conversation_id: convId,
          user_id: userId,
          role: 'user',
          content: message,
        });
      }

      // Enviar para IA (Ollama ou Supabase Edge Function)
      if (AI_PROVIDER === 'ollama') {
        // Usar Ollama local
        const ollamaAvailable = await testOllama();
        if (ollamaAvailable) {
          const messages = [{ role: 'user' as const, content: message }];
          response = await chatWithOllama(messages, userContext);
        } else {
          response = getMockResponse(message, userContext);
        }
      } else {
        // Usar Edge Function do Supabase
        const { data: aiRes, error: aiError } = await supabase.functions.invoke('ai-chat', {
          body: { user_id: userId, message, conversation_id: conversationId },
        });

        if (aiError) throw aiError;
        response = (aiRes as { response: string })?.response || '';
      }

      // Salvar resposta da IA
      if (convId) {
        await supabase.from('chat_messages').insert({
          conversation_id: convId,
          user_id: userId,
          role: 'assistant',
          content: response,
        });

        // Atualizar timestamp da conversa
        await supabase
          .from('chat_conversations')
          .update({ updated_at: new Date().toISOString() })
          .eq('id', convId);
      }

      return { response, conversation_id: convId || '' };
    },
    onSuccess: (_, { conversationId }) => {
      if (conversationId) {
        queryClient.invalidateQueries({ queryKey: ['chat-messages', conversationId] });
        queryClient.invalidateQueries({ queryKey: ['chat-conversations'] });
      }
    },
  });
};

// Buscar contexto financeiro do usuário
async function getUserContext(userId: string): Promise<string> {
  const now = new Date();
  const startOfMonth = new Date(now.getFullYear(), now.getMonth(), 1).toISOString().split('T')[0];
  const endOfMonth = new Date(now.getFullYear(), now.getMonth() + 1, 0).toISOString().split('T')[0];

  const [transactions, goals, budgets] = await Promise.all([
    supabase
      .from('transactions')
      .select('*,category:financial_categories(name,icon,color)')
      .eq('user_id', userId)
      .gte('transaction_date', startOfMonth)
      .lte('transaction_date', endOfMonth),
    supabase.from('goals').select('*').eq('user_id', userId).eq('status', 'active'),
    supabase.from('budgets').select('*,category:financial_categories(name,icon,color)').eq('user_id', userId),
  ]);

  const txList = transactions.data || [];
  const goalsList = goals.data || [];
  const budgetsList = budgets.data || [];

  const totalIncome = txList
    .filter((t: any) => t.type === 'income')
    .reduce((s: number, t: any) => s + Number(t.amount), 0);
  const totalExpense = txList
    .filter((t: any) => t.type === 'expense')
    .reduce((s: number, t: any) => s + Number(t.amount), 0);
  const balance = totalIncome - totalExpense;

  const categorySpending: Record<string, number> = {};
  txList
    .filter((t: any) => t.type === 'expense')
    .forEach((t: any) => {
      const catName = t.category?.name || 'Sem categoria';
      categorySpending[catName] = (categorySpending[catName] || 0) + Number(t.amount);
    });

  let context = `## Resumo Financeiro (mês atual)\n`;
  context += `- Receitas: R$ ${totalIncome.toFixed(2)}\n`;
  context += `- Despesas: R$ ${totalExpense.toFixed(2)}\n`;
  context += `- Saldo: R$ ${balance.toFixed(2)}\n\n`;

  if (Object.keys(categorySpending).length > 0) {
    context += `## Gastos por Categoria\n`;
    for (const [cat, amount] of Object.entries(categorySpending)) {
      const budget = budgetsList.find((b: any) => b.category?.name === cat);
      const limit = budget ? Number(budget.amount_limit) : null;
      const pct = limit ? ((amount / limit) * 100).toFixed(0) : null;
      context += `- ${cat}: R$ ${amount.toFixed(2)}${pct ? ` (${pct}% do orçamento)` : ''}\n`;
    }
    context += '\n';
  }

  if (goalsList.length > 0) {
    context += `## Metas Ativas\n`;
    goalsList.forEach((g: any) => {
      const pct = ((Number(g.current_amount) / Number(g.target_amount)) * 100).toFixed(1);
      context += `- ${g.name}: R$ ${Number(g.current_amount).toFixed(2)} / R$ ${Number(g.target_amount).toFixed(2)} (${pct}%)\n`;
    });
    context += '\n';
  }

  if (budgetsList.length > 0) {
    context += `## Orçamentos\n`;
    budgetsList.forEach((b: any) => {
      context += `- ${b.category?.name || '?'}: limite R$ ${Number(b.amount_limit).toFixed(2)} (${b.period_type})\n`;
    });
  }

  return context;
}

// Respostas mock quando não há IA disponível
function getMockResponse(_message: string, context: string): string {
  // Análise simples do contexto
  if (context.includes('Saldo: R$') && context.includes('R$ 0.00')) {
    return 'Parece que você ainda não tem transações registradas esse mês. Que tal adicionar suas receitas e despesas para que eu possa te ajudar melhor? 💰';
  }

  if (context.toLowerCase().includes('despesas') && context.includes('Receitas')) {
    return 'Entendi! Estou aqui para ajudar com suas finanças. Me pergunte sobre seus gastos, metas ou orçamentos! 📊';
  }

  return 'Olá! Sou o Arthur, seu assistente financeiro. Posso ajudar a analisar seus gastos, criar metas de economia e acompanhar seus orçamentos. O que gostaria de saber? 💬';
}

export const useCreateConversation = () => {
  const queryClient = useQueryClient();

  return useMutation({
    mutationFn: async ({
      userId,
      title,
    }: {
      userId: string;
      title?: string;
    }): Promise<ChatConversation> => {
      const { data, error } = await supabase
        .from('chat_conversations')
        .insert({ user_id: userId, title: title || 'Nova conversa' })
        .select()
        .single();

      if (error) throw error;
      return data;
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['chat-conversations'] });
    },
  });
};

export const useDeleteConversation = () => {
  const queryClient = useQueryClient();

  return useMutation({
    mutationFn: async (id: string) => {
      const { error } = await supabase.from('chat_conversations').delete().eq('id', id);
      if (error) throw error;
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['chat-conversations'] });
    },
  });
};
