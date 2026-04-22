import { LucideIcon, Pencil, Trash2, AlertTriangle } from 'lucide-react';
import { Card, CardContent, CardHeader } from '@/components/ui/card';
import { Badge } from '@/components/ui/badge';
import { BudgetProgress } from './BudgetProgress';
import { Button } from '@/components/ui/button';
import type { BudgetWithUsage } from '@/hooks/useBudgets';
import { cn } from '@/lib/utils';

interface BudgetCardProps {
  budget: BudgetWithUsage;
  onEdit?: (budget: BudgetWithUsage) => void;
  onDelete?: (budget: BudgetWithUsage) => void;
  className?: string;
}

export function BudgetCard({ budget, onEdit, onDelete, className }: BudgetCardProps) {
  const { category, spent, percentage, remaining, isOverBudget, isWarning, period_type, amount_limit } = budget;

  const categoryName = category?.name ?? 'Sem categoria';
  const CategoryIcon = (category?.icon ?? 'MoreHorizontal') as unknown as LucideIcon;
  const categoryColor = category?.color ?? '#6b7280';

  return (
    <Card className={cn('relative overflow-hidden', className)}>
      {isOverBudget && (
        <div className="absolute top-0 right-0 w-16 h-16 opacity-10">
          <AlertTriangle className="w-full h-full text-destructive" />
        </div>
      )}
      <CardHeader className="pb-2">
        <div className="flex items-start justify-between gap-2">
          <div className="flex items-center gap-2 min-w-0">
            <div
              className="h-9 w-9 rounded-lg flex items-center justify-center flex-shrink-0"
              style={{ backgroundColor: `${categoryColor}20` }}
            >
              <CategoryIcon className="h-4 w-4" style={{ color: categoryColor }} />
            </div>
            <div className="min-w-0">
              <h3 className="font-semibold text-sm text-foreground truncate">{categoryName}</h3>
              <p className="text-xs text-muted-foreground capitalize">
                {period_type === 'monthly' ? 'Mensal' : period_type === 'weekly' ? 'Semanal' : 'Anual'}
              </p>
            </div>
          </div>
          <div className="flex gap-1 flex-shrink-0">
            {onEdit && (
              <Button variant="ghost" size="icon" className="h-7 w-7" onClick={() => onEdit(budget)}>
                <Pencil className="h-3.5 w-3.5" />
              </Button>
            )}
            {onDelete && (
              <Button variant="ghost" size="icon" className="h-7 w-7 text-destructive hover:text-destructive" onClick={() => onDelete(budget)}>
                <Trash2 className="h-3.5 w-3.5" />
              </Button>
            )}
          </div>
        </div>
      </CardHeader>
      <CardContent className="space-y-3">
        <div className="flex items-baseline justify-between">
          <div>
            <span className={cn('text-lg font-bold', isOverBudget ? 'text-destructive' : 'text-foreground')}>
              R$ {spent.toLocaleString('pt-BR', { minimumFractionDigits: 2 })}
            </span>
            <span className="text-xs text-muted-foreground ml-1">
              de R$ {Number(amount_limit).toLocaleString('pt-BR', { minimumFractionDigits: 2 })}
            </span>
          </div>
          {isOverBudget && (
            <Badge variant="destructive" className="text-xs">
              Excedido
            </Badge>
          )}
          {!isOverBudget && isWarning && (
            <Badge variant="secondary" className="text-xs bg-warning/20 text-warning border-warning/30">
              Atenção
            </Badge>
          )}
        </div>

        <BudgetProgress percentage={percentage} isWarning={isWarning} isOverBudget={isOverBudget} />

        <div className="flex justify-between text-xs text-muted-foreground">
          <span>
            {remaining >= 0 ? 'Restante' : 'Estouro'}:{' '}
            <span className={remaining >= 0 ? 'text-foreground' : 'text-destructive'}>
              R$ {Math.abs(remaining).toLocaleString('pt-BR', { minimumFractionDigits: 2 })}
            </span>
          </span>
          <span>{percentage.toFixed(0)}% usado</span>
        </div>
      </CardContent>
    </Card>
  );
}
