import { Progress } from '@/components/ui/progress';
import { cn } from '@/lib/utils';

interface BudgetProgressProps {
  percentage: number;
  isWarning?: boolean;
  isOverBudget?: boolean;
  size?: 'sm' | 'md' | 'lg';
  showLabel?: boolean;
  className?: string;
}

export function BudgetProgress({
  percentage,
  isWarning = false,
  isOverBudget = false,
  size = 'md',
  showLabel = false,
  className,
}: BudgetProgressProps) {
  const clampedPct = Math.min(percentage, 100);
  const overPct = percentage > 100 ? Math.min(percentage - 100, 100) : 0;

  const heightClass = {
    sm: 'h-1',
    md: 'h-2',
    lg: 'h-3',
  }[size];

  const colorClass = isOverBudget
    ? 'bg-destructive'
    : isWarning
    ? 'bg-warning'
    : 'bg-primary';

  return (
    <div className={cn('space-y-1', className)}>
      <div className={cn('relative rounded-full bg-secondary overflow-hidden', heightClass)}>
        <div
          className={cn('h-full rounded-full transition-all duration-500', colorClass)}
          style={{ width: `${clampedPct}%` }}
        />
        {isOverBudget && overPct > 0 && (
          <div
            className="absolute top-0 right-0 h-full bg-destructive/70 rounded-full animate-pulse"
            style={{ width: `${overPct}%` }}
          />
        )}
      </div>
      {showLabel && (
        <div className="flex justify-between text-xs text-muted-foreground">
          <span>{percentage.toFixed(0)}%</span>
          {isOverBudget && <span className="text-destructive font-medium">Excedido!</span>}
          {isWarning && !isOverBudget && <span className="text-warning font-medium">Atenção</span>}
        </div>
      )}
    </div>
  );
}
