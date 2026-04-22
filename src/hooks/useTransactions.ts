import { useQuery, useMutation, useQueryClient } from '@tanstack/react-query';
import { supabase } from '@/integrations/supabase/client';
import type { Database } from '@/integrations/supabase/types';

type Transaction = Database['public']['Tables']['transactions']['Row'];
type TransactionInsert = Database['public']['Tables']['transactions']['Insert'];
type TransactionUpdate = Database['public']['Tables']['transactions']['Update'];

export type TransactionType = 'income' | 'expense';

export interface TransactionWithCategory extends Transaction {
  category?: Database['public']['Tables']['financial_categories']['Row'] | null;
}

export interface TransactionFilters {
  userId?: string;
  organizationId?: string;
  type?: TransactionType;
  categoryId?: string;
  startDate?: string;
  endDate?: string;
  search?: string;
}

export interface TransactionTotals {
  totalIncome: number;
  totalExpense: number;
  balance: number;
  count: number;
}

interface UseTransactionsOptions extends TransactionFilters {
  page?: number;
  pageSize?: number;
}

const DEFAULT_PAGE_SIZE = 20;

export const useTransactions = (options: UseTransactionsOptions = {}) => {
  const { userId, organizationId, type, categoryId, startDate, endDate, search, page = 1, pageSize = DEFAULT_PAGE_SIZE } = options;

  const queryKey = ['transactions', { userId, organizationId, type, categoryId, startDate, endDate, search, page, pageSize }];

  return useQuery({
    queryKey,
    queryFn: async (): Promise<{ transactions: TransactionWithCategory[]; total: number }> => {
      let query = supabase
        .from('transactions')
        .select(`
          *,
          category:financial_categories(*)
        `, { count: 'exact' })
        .order('transaction_date', { ascending: false })
        .order('created_at', { ascending: false });

      if (userId) {
        query = query.eq('user_id', userId);
      }
      if (organizationId) {
        query = query.eq('organization_id', organizationId);
      }
      if (type) {
        query = query.eq('type', type);
      }
      if (categoryId) {
        query = query.eq('category_id', categoryId);
      }
      if (startDate) {
        query = query.gte('transaction_date', startDate);
      }
      if (endDate) {
        query = query.lte('transaction_date', endDate);
      }
      if (search) {
        query = query.ilike('description', `%${search}%`);
      }

      const from = (page - 1) * pageSize;
      const to = from + pageSize - 1;
      query = query.range(from, to);

      const { data, error, count } = await query;

      if (error) throw error;
      return { transactions: (data as TransactionWithCategory[]) ?? [], total: count ?? 0 };
    },
    staleTime: 1000 * 60 * 2, // 2 minutes
  });
};

export const useTransactionTotals = (options: TransactionFilters = {}) => {
  const { userId, organizationId, startDate, endDate } = options;

  const queryKey = ['transaction-totals', { userId, organizationId, startDate, endDate }];

  return useQuery({
    queryKey,
    queryFn: async (): Promise<TransactionTotals> => {
      let query = supabase
        .from('transactions')
        .select('amount, type');

      if (userId) {
        query = query.eq('user_id', userId);
      }
      if (organizationId) {
        query = query.eq('organization_id', organizationId);
      }
      if (startDate) {
        query = query.gte('transaction_date', startDate);
      }
      if (endDate) {
        query = query.lte('transaction_date', endDate);
      }

      const { data, error } = await query;

      if (error) throw error;

      const transactions = data ?? [];
      const totalIncome = transactions
        .filter(t => t.type === 'income')
        .reduce((sum, t) => sum + Number(t.amount), 0);
      const totalExpense = transactions
        .filter(t => t.type === 'expense')
        .reduce((sum, t) => sum + Number(t.amount), 0);

      return {
        totalIncome,
        totalExpense,
        balance: totalIncome - totalExpense,
        count: transactions.length,
      };
    },
    staleTime: 1000 * 60 * 2,
  });
};

export const useTransaction = (id: string) => {
  return useQuery({
    queryKey: ['transaction', id],
    queryFn: async (): Promise<TransactionWithCategory> => {
      const { data, error } = await supabase
        .from('transactions')
        .select(`
          *,
          category:financial_categories(*)
        `)
        .eq('id', id)
        .single();

      if (error) throw error;
      return data as TransactionWithCategory;
    },
    enabled: !!id,
  });
};

export const useCreateTransaction = () => {
  const queryClient = useQueryClient();

  return useMutation({
    mutationFn: async (transaction: TransactionInsert) => {
      const { data, error } = await supabase
        .from('transactions')
        .insert(transaction)
        .select(`
          *,
          category:financial_categories(*)
        `)
        .single();

      if (error) throw error;
      return data as TransactionWithCategory;
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['transactions'] });
      queryClient.invalidateQueries({ queryKey: ['transaction-totals'] });
    },
  });
};

export const useUpdateTransaction = () => {
  const queryClient = useQueryClient();

  return useMutation({
    mutationFn: async ({ id, ...updates }: TransactionUpdate & { id: string }) => {
      const { data, error } = await supabase
        .from('transactions')
        .update(updates)
        .eq('id', id)
        .select(`
          *,
          category:financial_categories(*)
        `)
        .single();

      if (error) throw error;
      return data as TransactionWithCategory;
    },
    onSuccess: (_, { id }) => {
      queryClient.invalidateQueries({ queryKey: ['transactions'] });
      queryClient.invalidateQueries({ queryKey: ['transaction', id] });
      queryClient.invalidateQueries({ queryKey: ['transaction-totals'] });
    },
  });
};

export const useDeleteTransaction = () => {
  const queryClient = useQueryClient();

  return useMutation({
    mutationFn: async (id: string) => {
      const { error } = await supabase
        .from('transactions')
        .delete()
        .eq('id', id);

      if (error) throw error;
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['transactions'] });
      queryClient.invalidateQueries({ queryKey: ['transaction-totals'] });
    },
  });
};
