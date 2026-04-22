import { useQuery, useMutation, useQueryClient } from '@tanstack/react-query';
import { supabase } from '@/integrations/supabase/client';
import type { Database } from '@/integrations/supabase/types';

type Budget = Database['public']['Tables']['budgets']['Row'];
type BudgetInsert = Database['public']['Tables']['budgets']['Insert'];
type BudgetUpdate = Database['public']['Tables']['budgets']['Update'];

export type PeriodType = 'weekly' | 'monthly' | 'yearly';

export interface BudgetWithCategory extends Budget {
  category?: Database['public']['Tables']['financial_categories']['Row'] | null;
}

export interface BudgetWithUsage extends BudgetWithCategory {
  spent: number;
  percentage: number;
  remaining: number;
  isOverBudget: boolean;
  isWarning: boolean;
}

interface UseBudgetsOptions {
  userId?: string;
  periodType?: PeriodType;
}

const getDateRangeForPeriod = (periodType: PeriodType): { startDate: string; endDate: string } => {
  const now = new Date();
  const year = now.getFullYear();
  const month = now.getMonth();
  const day = now.getDate();
  const dayOfWeek = now.getDay();

  switch (periodType) {
    case 'weekly': {
      const startOfWeek = new Date(now);
      startOfWeek.setDate(day - dayOfWeek);
      const endOfWeek = new Date(startOfWeek);
      endOfWeek.setDate(startOfWeek.getDate() + 6);
      return {
        startDate: startOfWeek.toISOString().split('T')[0],
        endDate: endOfWeek.toISOString().split('T')[0],
      };
    }
    case 'yearly': {
      return {
        startDate: `${year}-01-01`,
        endDate: `${year}-12-31`,
      };
    }
    case 'monthly':
    default: {
      const startOfMonth = new Date(year, month, 1);
      const endOfMonth = new Date(year, month + 1, 0);
      return {
        startDate: startOfMonth.toISOString().split('T')[0],
        endDate: endOfMonth.toISOString().split('T')[0],
      };
    }
  }
};

export const useBudgets = (options: UseBudgetsOptions = {}) => {
  const { userId, periodType } = options;
  const queryKey = ['budgets', { userId, periodType }];

  return useQuery({
    queryKey,
    queryFn: async (): Promise<BudgetWithCategory[]> => {
      let query = supabase
        .from('budgets')
        .select(`
          *,
          category:financial_categories(*)
        `)
        .order('created_at', { ascending: false });

      if (userId) {
        query = query.eq('user_id', userId);
      }
      if (periodType) {
        query = query.eq('period_type', periodType);
      }

      const { data, error } = await query;
      if (error) throw error;
      return (data as BudgetWithCategory[]) ?? [];
    },
    staleTime: 1000 * 60 * 2,
  });
};

export const useBudgetsWithUsage = (options: UseBudgetsOptions = {}) => {
  const { userId, periodType } = options;
  const queryKey = ['budgets-with-usage', { userId, periodType }];

  return useQuery({
    queryKey,
    queryFn: async (): Promise<BudgetWithUsage[]> => {
      let budgetsQuery = supabase
        .from('budgets')
        .select(`
          *,
          category:financial_categories(*)
        `)
        .order('created_at', { ascending: false });

      if (userId) budgetsQuery = budgetsQuery.eq('user_id', userId);
      if (periodType) budgetsQuery = budgetsQuery.eq('period_type', periodType);

      const { data: budgets, error: budgetsError } = await budgetsQuery;
      if (budgetsError) throw budgetsError;
      if (!budgets || budgets.length === 0) return [];

      const resolvedBudgets = budgets as BudgetWithCategory[];
      const { startDate, endDate } = getDateRangeForPeriod(periodType ?? 'monthly');

      const transactionsQuery = supabase
        .from('transactions')
        .select('category_id, amount, type')
        .eq('type', 'expense')
        .gte('transaction_date', startDate)
        .lte('transaction_date', endDate);

      if (userId) transactionsQuery.eq('user_id', userId);

      const { data: transactions, error: transactionsError } = await transactionsQuery;
      if (transactionsError) throw transactionsError;

      return resolvedBudgets.map((budget) => {
        const spent = (transactions ?? [])
          .filter((t) => t.category_id === budget.category_id)
          .reduce((sum, t) => sum + Number(t.amount), 0);

        const amountLimit = Number(budget.amount_limit);
        const percentage = amountLimit > 0 ? (spent / amountLimit) * 100 : 0;
        const remaining = amountLimit - spent;

        return {
          ...budget,
          spent,
          percentage,
          remaining,
          isOverBudget: spent > amountLimit,
          isWarning: percentage >= 80 && percentage <= 100,
        };
      });
    },
    staleTime: 1000 * 60 * 2,
  });
};

export const useCreateBudget = () => {
  const queryClient = useQueryClient();

  return useMutation({
    mutationFn: async (budget: BudgetInsert) => {
      const { data, error } = await supabase
        .from('budgets')
        .insert(budget)
        .select(`
          *,
          category:financial_categories(*)
        `)
        .single();

      if (error) throw error;
      return data as BudgetWithCategory;
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['budgets'] });
      queryClient.invalidateQueries({ queryKey: ['budgets-with-usage'] });
    },
  });
};

export const useUpdateBudget = () => {
  const queryClient = useQueryClient();

  return useMutation({
    mutationFn: async ({ id, ...updates }: BudgetUpdate & { id: string }) => {
      const { data, error } = await supabase
        .from('budgets')
        .update(updates)
        .eq('id', id)
        .select(`
          *,
          category:financial_categories(*)
        `)
        .single();

      if (error) throw error;
      return data as BudgetWithCategory;
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['budgets'] });
      queryClient.invalidateQueries({ queryKey: ['budgets-with-usage'] });
    },
  });
};

export const useDeleteBudget = () => {
  const queryClient = useQueryClient();

  return useMutation({
    mutationFn: async (id: string) => {
      const { error } = await supabase.from('budgets').delete().eq('id', id);
      if (error) throw error;
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['budgets'] });
      queryClient.invalidateQueries({ queryKey: ['budgets-with-usage'] });
    },
  });
};
