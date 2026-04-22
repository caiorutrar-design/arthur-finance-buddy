import { useQuery, useMutation, useQueryClient } from '@tanstack/react-query';
import { supabase } from '@/integrations/supabase/client';
import type { Database } from '@/integrations/supabase/types';

type Goal = Database['public']['Tables']['goals']['Row'];
type GoalInsert = Database['public']['Tables']['goals']['Insert'];
type GoalUpdate = Database['public']['Tables']['goals']['Update'];

export type GoalStatus = 'active' | 'completed' | 'paused';

export interface GoalWithProgress extends Goal {
  percentage: number;
  remaining: number;
  isNearDeadline: boolean;
  isCompleted: boolean;
  daysLeft: number | null;
}

interface UseGoalsOptions {
  userId?: string;
  status?: GoalStatus;
}

const calculateProgress = (goal: Goal): GoalWithProgress => {
  const targetAmount = Number(goal.target_amount);
  const currentAmount = Number(goal.current_amount);
  const percentage = targetAmount > 0 ? Math.min((currentAmount / targetAmount) * 100, 100) : 0;
  const remaining = targetAmount - currentAmount;
  const isCompleted = currentAmount >= targetAmount;

  let daysLeft: number | null = null;
  let isNearDeadline = false;

  if (goal.deadline) {
    const deadlineDate = new Date(goal.deadline);
    const today = new Date();
    today.setHours(0, 0, 0, 0);
    const diffTime = deadlineDate.getTime() - today.getTime();
    daysLeft = Math.ceil(diffTime / (1000 * 60 * 60 * 24));
    isNearDeadline = daysLeft <= 7 && daysLeft >= 0 && percentage < 100;
  }

  return {
    ...goal,
    percentage,
    remaining,
    isNearDeadline,
    isCompleted,
    daysLeft,
  };
};

export const useGoals = (options: UseGoalsOptions = {}) => {
  const { userId, status } = options;
  const queryKey = ['goals', { userId, status }];

  return useQuery({
    queryKey,
    queryFn: async (): Promise<GoalWithProgress[]> => {
      let query = supabase
        .from('goals')
        .select('*')
        .order('created_at', { ascending: false });

      if (userId) query = query.eq('user_id', userId);
      if (status) query = query.eq('status', status);

      const { data, error } = await query;
      if (error) throw error;
      return (data ?? []).map(calculateProgress);
    },
    staleTime: 1000 * 60 * 2,
  });
};

export const useGoalStats = (userId?: string) => {
  const queryKey = ['goal-stats', userId];

  return useQuery({
    queryKey,
    queryFn: async () => {
      let query = supabase.from('goals').select('*');
      if (userId) query = query.eq('user_id', userId);

      const { data, error } = await query;
      if (error) throw error;

      const goals = (data ?? []).map(calculateProgress);

      return {
        total: goals.length,
        active: goals.filter(g => g.status === 'active').length,
        completed: goals.filter(g => g.status === 'completed').length,
        paused: goals.filter(g => g.status === 'paused').length,
        totalTarget: goals.reduce((sum, g) => sum + Number(g.target_amount), 0),
        totalCurrent: goals.reduce((sum, g) => sum + Number(g.current_amount), 0),
        nearDeadline: goals.filter(g => g.isNearDeadline).length,
      };
    },
    staleTime: 1000 * 60 * 2,
  });
};

export const useCreateGoal = () => {
  const queryClient = useQueryClient();

  return useMutation({
    mutationFn: async (goal: GoalInsert) => {
      const { data, error } = await supabase
        .from('goals')
        .insert(goal)
        .select()
        .single();

      if (error) throw error;
      return calculateProgress(data);
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['goals'] });
      queryClient.invalidateQueries({ queryKey: ['goal-stats'] });
    },
  });
};

export const useUpdateGoal = () => {
  const queryClient = useQueryClient();

  return useMutation({
    mutationFn: async ({ id, ...updates }: GoalUpdate & { id: string }) => {
      const { data, error } = await supabase
        .from('goals')
        .update(updates)
        .eq('id', id)
        .select()
        .single();

      if (error) throw error;
      return calculateProgress(data);
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['goals'] });
      queryClient.invalidateQueries({ queryKey: ['goal-stats'] });
    },
  });
};

export const useDeleteGoal = () => {
  const queryClient = useQueryClient();

  return useMutation({
    mutationFn: async (id: string) => {
      const { error } = await supabase.from('goals').delete().eq('id', id);
      if (error) throw error;
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['goals'] });
      queryClient.invalidateQueries({ queryKey: ['goal-stats'] });
    },
  });
};

export const useAddContribution = () => {
  const queryClient = useQueryClient();

  return useMutation({
    mutationFn: async ({ id, amount }: { id: string; amount: number }) => {
      const { data: goal, error: fetchError } = await supabase
        .from('goals')
        .select('current_amount, target_amount')
        .eq('id', id)
        .single();

      if (fetchError) throw fetchError;

      const currentAmount = Number(goal.current_amount);
      const targetAmount = Number(goal.target_amount);
      const newAmount = currentAmount + amount;
      const isCompleted = newAmount >= targetAmount;

      const { data, error } = await supabase
        .from('goals')
        .update({
          current_amount: newAmount,
          status: isCompleted ? 'completed' : undefined,
        })
        .eq('id', id)
        .select()
        .single();

      if (error) throw error;
      return calculateProgress(data);
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['goals'] });
      queryClient.invalidateQueries({ queryKey: ['goal-stats'] });
    },
  });
};
