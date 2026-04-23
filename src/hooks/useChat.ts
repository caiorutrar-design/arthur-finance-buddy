import { useQuery, useMutation, useQueryClient } from '@tanstack/react-query';
import { supabase } from '@/integrations/supabase/client';
import type { ChatMessage, ChatConversation } from '@/types/chat';

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
      const { data: aiRes, error: aiError } = await supabase.functions.invoke('ai-chat', {
        body: { user_id: userId, message, conversation_id: conversationId },
      });

      if (aiError) throw aiError;
      return aiRes as { response: string; conversation_id: string };
    },
    onSuccess: (_, { conversationId }) => {
      if (conversationId) {
        queryClient.invalidateQueries({ queryKey: ['chat-messages', conversationId] });
        queryClient.invalidateQueries({ queryKey: ['chat-conversations'] });
      }
    },
  });
};

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
