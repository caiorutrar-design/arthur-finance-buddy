import { useState } from 'react';
import { Plus, Wallet, AlertTriangle } from 'lucide-react';
import { Button } from '@/components/ui/button';
import { Badge } from '@/components/ui/badge';
import { BudgetCard } from '@/components/budgets/BudgetCard';
import { BudgetForm } from '@/components/budgets/BudgetForm';
import { useBudgetsWithUsage, useCreateBudget, useUpdateBudget, useDeleteBudget, type BudgetWithUsage, type PeriodType } from '@/hooks/useBudgets';
import { useAuth } from '@/hooks/useAuth';
import { useToast } from '@/hooks/use-toast';
import { AlertDialog, AlertDialogAction, AlertDialogCancel, AlertDialogContent, AlertDialogDescription, AlertDialogFooter, AlertDialogHeader, AlertDialogTitle } from '@/components/ui/alert-dialog';
import { Skeleton } from '@/components/ui/skeleton';
import type { Database } from '@/integrations/supabase/types';

type BudgetInsert = Database['public']['Tables']['budgets']['Insert'];

const PERIOD_LABELS: Record<PeriodType, string> = {
  weekly: 'Semanal',
  monthly: 'Mensal',
  yearly: 'Anual',
};

const Budgets = () => {
  const { profile } = useAuth();
  const userId = profile?.id ?? '';
  const { toast } = useToast();

  const [selectedPeriod, setSelectedPeriod] = useState<PeriodType>('monthly');
  const [formOpen, setFormOpen] = useState(false);
  const [editingBudget, setEditingBudget] = useState<BudgetWithUsage | null>(null);
  const [deletingBudget, setDeletingBudget] = useState<BudgetWithUsage | null>(null);

  const { data: budgets, isLoading } = useBudgetsWithUsage({ userId, periodType: selectedPeriod });
  const createBudget = useCreateBudget();
  const updateBudget = useUpdateBudget();
  const deleteBudget = useDeleteBudget();

  const handleCreateBudget = async (formData: {
    category_id: string;
    amount_limit: number;
    period_type: PeriodType;
    start_date: string;
    end_date?: string;
  }) => {
    if (!userId) return;
    try {
      await createBudget.mutateAsync({
        user_id: userId,
        category_id: formData.category_id,
        amount_limit: formData.amount_limit,
        period_type: formData.period_type,
        start_date: formData.start_date,
        end_date: formData.end_date || null,
      } as BudgetInsert);
      toast({ title: 'Orçamento criado com sucesso!' });
      setFormOpen(false);
    } catch {
      toast({ title: 'Erro ao criar orçamento', variant: 'destructive' });
    }
  };

  const handleUpdateBudget = async (formData: {
    category_id: string;
    amount_limit: number;
    period_type: PeriodType;
    start_date: string;
    end_date?: string;
  }) => {
    if (!editingBudget) return;
    try {
      await updateBudget.mutateAsync({
        id: editingBudget.id,
        category_id: formData.category_id,
        amount_limit: formData.amount_limit,
        period_type: formData.period_type,
        start_date: formData.start_date,
        end_date: formData.end_date || null,
      });
      toast({ title: 'Orçamento atualizado!' });
      setFormOpen(false);
      setEditingBudget(null);
    } catch {
      toast({ title: 'Erro ao atualizar orçamento', variant: 'destructive' });
    }
  };

  const handleDeleteBudget = async () => {
    if (!deletingBudget) return;
    try {
      await deleteBudget.mutateAsync(deletingBudget.id);
      toast({ title: 'Orçamento removido' });
      setDeletingBudget(null);
    } catch {
      toast({ title: 'Erro ao remover orçamento', variant: 'destructive' });
    }
  };

  const overBudgetCount = budgets?.filter((b) => b.isOverBudget).length ?? 0;
  const warningCount = budgets?.filter((b) => b.isWarning).length ?? 0;

  return (
    <div className="flex flex-col h-full">
      {/* Header */}
      <div className="flex items-center justify-between p-4 border-b border-border">
        <div className="flex items-center gap-3">
          <div className="h-10 w-10 rounded-xl bg-primary/20 flex items-center justify-center">
            <Wallet className="h-5 w-5 text-primary" />
          </div>
          <div>
            <h1 className="font-heading font-bold text-lg">Orçamentos</h1>
            <p className="text-xs text-muted-foreground">Controle seus gastos por categoria</p>
          </div>
        </div>
        <Button onClick={() => { setEditingBudget(null); setFormOpen(true); }} className="gap-2">
          <Plus className="h-4 w-4" />
          Novo Orçamento
        </Button>
      </div>

      {/* Period Tabs */}
      <div className="flex gap-2 p-4 border-b border-border">
        {(Object.keys(PERIOD_LABELS) as PeriodType[]).map((period) => (
          <Button
            key={period}
            variant={selectedPeriod === period ? 'default' : 'outline'}
            size="sm"
            onClick={() => setSelectedPeriod(period)}
          >
            {PERIOD_LABELS[period]}
          </Button>
        ))}
      </div>

      {/* Summary Badges */}
      {(overBudgetCount > 0 || warningCount > 0) && (
        <div className="flex gap-3 px-4 pt-4">
          {overBudgetCount > 0 && (
            <Badge variant="destructive" className="gap-1">
              <AlertTriangle className="h-3 w-3" />
              {overBudgetCount} excedido{overBudgetCount > 1 ? 's' : ''}
            </Badge>
          )}
          {warningCount > 0 && (
            <Badge variant="secondary" className="gap-1 bg-warning/20 text-warning border-warning/30">
              <AlertTriangle className="h-3 w-3" />
              {warningCount} próximo do limite
            </Badge>
          )}
        </div>
      )}

      {/* Budgets Grid */}
      <div className="flex-1 overflow-y-auto p-4">
        {isLoading ? (
          <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-4">
            {[1, 2, 3].map((i) => (
              <div key={i} className="space-y-3">
                <Skeleton className="h-32 w-full rounded-lg" />
              </div>
            ))}
          </div>
        ) : budgets && budgets.length > 0 ? (
          <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-4">
            {budgets.map((budget) => (
              <BudgetCard
                key={budget.id}
                budget={budget}
                onEdit={(b) => { setEditingBudget(b); setFormOpen(true); }}
                onDelete={setDeletingBudget}
              />
            ))}
          </div>
        ) : (
          <div className="flex flex-col items-center justify-center h-64 text-center">
            <Wallet className="h-12 w-12 text-muted-foreground mb-3" />
            <h3 className="font-semibold text-foreground mb-1">Nenhum orçamento</h3>
            <p className="text-sm text-muted-foreground mb-4">
              Crie orçamentos para acompanhar seus gastos por categoria.
            </p>
            <Button onClick={() => { setEditingBudget(null); setFormOpen(true); }} className="gap-2">
              <Plus className="h-4 w-4" />
              Criar primeiro orçamento
            </Button>
          </div>
        )}
      </div>

      {/* Budget Form Dialog */}
      <BudgetForm
        open={formOpen}
        onOpenChange={(open) => {
          setFormOpen(open);
          if (!open) setEditingBudget(null);
        }}
        onSubmit={editingBudget ? handleUpdateBudget : handleCreateBudget}
        initialData={editingBudget}
        userId={userId}
        isLoading={createBudget.isPending || updateBudget.isPending}
      />

      {/* Delete Confirmation */}
      <AlertDialog open={!!deletingBudget} onOpenChange={(open) => { if (!open) setDeletingBudget(null); }}>
        <AlertDialogContent>
          <AlertDialogHeader>
            <AlertDialogTitle>Remover Orçamento</AlertDialogTitle>
            <AlertDialogDescription>
              Tem certeza que deseja remover este orçamento? Esta ação não pode ser desfeita.
            </AlertDialogDescription>
          </AlertDialogHeader>
          <AlertDialogFooter>
            <AlertDialogCancel>Cancelar</AlertDialogCancel>
            <AlertDialogAction onClick={handleDeleteBudget} className="bg-destructive text-destructive-foreground hover:bg-destructive/90">
              Remover
            </AlertDialogAction>
          </AlertDialogFooter>
        </AlertDialogContent>
      </AlertDialog>
    </div>
  );
};

export default Budgets;
