import { useQuery, useMutation, useQueryClient } from '@tanstack/react-query';
import { supabase } from '@/integrations/supabase/client';
import type { Database } from '@/integrations/supabase/types';

type Alert = Database['public']['Tables']['alerts']['Row'];
type AlertInsert = Database['public']['Tables']['alerts']['Insert'];
type AlertUpdate = Database['public']['Tables']['alerts']['Update'];

export type AlertType = 'budget_exceeded' | 'goal_progress' | 'spending_alert' | 'tip';

export interface AlertWithMeta extends Alert {
  metadata?: Record<string, unknown> | null;
}

interface UseAlertsOptions {
  userId?: string;
  unreadOnly?: boolean;
  limit?: number;
}

export const useAlerts = (options: UseAlertsOptions = {}) => {
  const { userId, unreadOnly = false, limit } = options;
  const queryKey = ['alerts', { userId, unreadOnly, limit }];

  return useQuery({
    queryKey,
    queryFn: async (): Promise<AlertWithMeta[]> => {
      let query = supabase
        .from('alerts')
        .select('*')
        .order('created_at', { ascending: false })
        .limit(limit ?? 50);

      if (userId) {
        query = query.eq('user_id', userId);
      }
      if (unreadOnly) {
        query = query.eq('is_read', false);
      }

      const { data, error } = await query;
      if (error) throw error;
      return (data as AlertWithMeta[]) ?? [];
    },
    staleTime: 1000 * 30, // 30 seconds - alerts change frequently
  });
};

export const useUnreadAlertCount = (userId?: string) => {
  return useQuery({
    queryKey: ['alerts-unread-count', userId],
    queryFn: async (): Promise<number> => {
      let query = supabase.from('alerts').select('id', { count: 'exact', head: true }).eq('is_read', false);
      if (userId) query = query.eq('user_id', userId);
      const { count, error } = await query;
      if (error) throw error;
      return count ?? 0;
    },
    staleTime: 1000 * 30,
  });
};

export const useCreateAlert = () => {
  const queryClient = useQueryClient();

  return useMutation({
    mutationFn: async (alert: AlertInsert) => {
      const { data, error } = await supabase.from('alerts').insert(alert).select().single();
      if (error) throw error;
      return data as AlertWithMeta;
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['alerts'] });
      queryClient.invalidateQueries({ queryKey: ['alerts-unread-count'] });
    },
  });
};

export const useMarkAlertAsRead = () => {
  const queryClient = useQueryClient();

  return useMutation({
    mutationFn: async ({ id, isRead = true }: { id: string; isRead?: boolean }) => {
      const { error } = await supabase
        .from('alerts')
        .update({ is_read: isRead })
        .eq('id', id);
      if (error) throw error;
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['alerts'] });
      queryClient.invalidateQueries({ queryKey: ['alerts-unread-count'] });
    },
  });
};

export const useMarkAllAlertsAsRead = () => {
  const queryClient = useQueryClient();

  return useMutation({
    mutationFn: async (userId: string) => {
      const { error } = await supabase
        .from('alerts')
        .update({ is_read: true })
        .eq('user_id', userId)
        .eq('is_read', false);
      if (error) throw error;
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['alerts'] });
      queryClient.invalidateQueries({ queryKey: ['alerts-unread-count'] });
    },
  });
};

export const useDeleteAlert = () => {
  const queryClient = useQueryClient();

  return useMutation({
    mutationFn: async (id: string) => {
      const { error } = await supabase.from('alerts').delete().eq('id', id);
      if (error) throw error;
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['alerts'] });
      queryClient.invalidateQueries({ queryKey: ['alerts-unread-count'] });
    },
  });
};
