import { useEffect } from 'react';
import { useForm } from 'react-hook-form';
import { Dialog, DialogContent, DialogHeader, DialogTitle, DialogFooter } from '@/components/ui/dialog';
import { Button } from '@/components/ui/button';
import { Label } from '@/components/ui/label';
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from '@/components/ui/select';
import { Input } from '@/components/ui/input';
import { useCategories } from '@/hooks/useCategories';
import type { BudgetWithCategory } from '@/hooks/useBudgets';
import type { PeriodType } from '@/hooks/useBudgets';
import type { Database } from '@/integrations/supabase/types';
import * as LucideIcons from 'lucide-react';

type Category = Database['public']['Tables']['financial_categories']['Row'];

interface BudgetFormData {
  category_id: string;
  amount_limit: number;
  period_type: PeriodType;
  start_date: string;
  end_date?: string;
}

interface BudgetFormProps {
  open: boolean;
  onOpenChange: (open: boolean) => void;
  onSubmit: (data: BudgetFormData) => void;
  initialData?: BudgetWithCategory | null;
  userId: string;
  isLoading?: boolean;
}

export function BudgetForm({ open, onOpenChange, onSubmit, initialData, userId, isLoading }: BudgetFormProps) {
  const { data: categories } = useCategories({});
  const isEditing = !!initialData;

  const {
    register,
    handleSubmit,
    setValue,
    watch,
    reset,
    formState: { errors },
  } = useForm<BudgetFormData>({
    defaultValues: {
      category_id: '',
      amount_limit: 0,
      period_type: 'monthly',
      start_date: new Date().toISOString().split('T')[0],
      end_date: '',
    },
  });

  const periodType = watch('period_type');
  const selectedCategoryId = watch('category_id');

  useEffect(() => {
    if (open) {
      if (initialData) {
        setValue('category_id', initialData.category_id);
        setValue('amount_limit', Number(initialData.amount_limit));
        setValue('period_type', initialData.period_type as PeriodType);
        setValue('start_date', initialData.start_date);
        setValue('end_date', initialData.end_date ?? '');
      } else {
        reset({
          category_id: '',
          amount_limit: 0,
          period_type: 'monthly',
          start_date: new Date().toISOString().split('T')[0],
          end_date: '',
        });
      }
    }
  }, [open, initialData, setValue, reset]);

  const expenseCategories = categories?.filter((c) => c.type === 'expense') ?? [];

  return (
    <Dialog open={open} onOpenChange={onOpenChange}>
      <DialogContent className="sm:max-w-md">
        <DialogHeader>
          <DialogTitle>{isEditing ? 'Editar' : 'Novo'} Orçamento</DialogTitle>
        </DialogHeader>
        <form onSubmit={handleSubmit(onSubmit)} className="space-y-4">
          {/* Category */}
          <div className="space-y-2">
            <Label htmlFor="category_id">Categoria</Label>
            <Select
              value={selectedCategoryId}
              onValueChange={(val) => setValue('category_id', val, { shouldValidate: true })}
            >
              <SelectTrigger id="category_id" className={errors.category_id ? 'border-destructive' : ''}>
                <SelectValue placeholder="Selecione uma categoria" />
              </SelectTrigger>
              <SelectContent>
                {expenseCategories.map((cat) => {
                  const Icon = (LucideIcons[cat.icon as keyof typeof LucideIcons] ?? LucideIcons.MoreHorizontal) as React.ComponentType<{ className?: string }>;
                  return (
                    <SelectItem key={cat.id} value={cat.id}>
                      <div className="flex items-center gap-2">
                        <Icon className="h-4 w-4" style={{ color: cat.color ?? '#6b7280' }} />
                        {cat.name}
                      </div>
                    </SelectItem>
                  );
                })}
              </SelectContent>
            </Select>
            {errors.category_id && (
              <p className="text-xs text-destructive">Categoria é obrigatória</p>
            )}
          </div>

          {/* Amount Limit */}
          <div className="space-y-2">
            <Label htmlFor="amount_limit">Limite (R$)</Label>
            <Input
              id="amount_limit"
              type="number"
              step="0.01"
              min="0"
              {...register('amount_limit', {
                required: 'Limite é obrigatório',
                min: { value: 0.01, message: 'Limite deve ser maior que zero' },
                valueAsNumber: true,
              })}
              className={errors.amount_limit ? 'border-destructive' : ''}
            />
            {errors.amount_limit && (
              <p className="text-xs text-destructive">{errors.amount_limit.message}</p>
            )}
          </div>

          {/* Period Type */}
          <div className="space-y-2">
            <Label htmlFor="period_type">Período</Label>
            <Select
              value={periodType}
              onValueChange={(val) => setValue('period_type', val as PeriodType, { shouldValidate: true })}
            >
              <SelectTrigger id="period_type">
                <SelectValue />
              </SelectTrigger>
              <SelectContent>
                <SelectItem value="weekly">Semanal</SelectItem>
                <SelectItem value="monthly">Mensal</SelectItem>
                <SelectItem value="yearly">Anual</SelectItem>
              </SelectContent>
            </Select>
          </div>

          {/* Start Date */}
          <div className="space-y-2">
            <Label htmlFor="start_date">Data de início</Label>
            <Input
              id="start_date"
              type="date"
              {...register('start_date', { required: 'Data de início é obrigatória' })}
              className={errors.start_date ? 'border-destructive' : ''}
            />
            {errors.start_date && (
              <p className="text-xs text-destructive">{errors.start_date.message}</p>
            )}
          </div>

          {/* End Date (optional) */}
          <div className="space-y-2">
            <Label htmlFor="end_date">Data de término (opcional)</Label>
            <Input
              id="end_date"
              type="date"
              {...register('end_date')}
            />
          </div>

          <DialogFooter>
            <Button type="button" variant="outline" onClick={() => onOpenChange(false)}>
              Cancelar
            </Button>
            <Button type="submit" disabled={isLoading}>
              {isLoading ? 'Salvando...' : isEditing ? 'Salvar' : 'Criar'}
            </Button>
          </DialogFooter>
        </form>
      </DialogContent>
    </Dialog>
  );
}
