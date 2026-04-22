import { AlertCircle, TrendingUp, Lightbulb, Info } from 'lucide-react';
import { Card, CardContent } from '@/components/ui/card';
import { Badge } from '@/components/ui/badge';
import { Button } from '@/components/ui/button';
import type { AlertWithMeta, AlertType } from '@/hooks/useAlerts';
import { cn } from '@/lib/utils';
import { formatDistanceToNow } from '@/lib/utils';

interface AlertCardProps {
  alert: AlertWithMeta;
  onMarkAsRead?: (id: string) => void;
  onDelete?: (id: string) => void;
  className?: string;
}

const ALERT_CONFIG: Record<AlertType, { icon: React.ComponentType<{ className?: string }>; colorClass: string; label: string }> = {
  budget_exceeded: {
    icon: AlertCircle,
    colorClass: 'text-destructive',
    label: 'Orçamento Excedido',
  },
  goal_progress: {
    icon: TrendingUp,
    colorClass: 'text-primary',
    label: 'Meta',
  },
  spending_alert: {
    icon: AlertCircle,
    colorClass: 'text-warning',
    label: 'Alerta de Gasto',
  },
  tip: {
    icon: Lightbulb,
    colorClass: 'text-primary',
    label: 'Dica',
  },
};

export function AlertCard({ alert, onMarkAsRead, onDelete, className }: AlertCardProps) {
  const config = ALERT_CONFIG[alert.type as AlertType] ?? ALERT_CONFIG.tip;
  const Icon = config.icon;
  const timeAgo = formatDistanceToNow(new Date(alert.created_at), { addSuffix: true, locale: 'pt-BR' });

  return (
    <Card
      className={cn(
        'transition-all duration-200',
        !alert.is_read && 'border-l-2 border-l-primary bg-primary/5',
        className
      )}
    >
      <CardContent className="p-3">
        <div className="flex items-start gap-3">
          <div className={cn('mt-0.5 flex-shrink-0', config.colorClass)}>
            <Icon className="h-4 w-4" />
          </div>
          <div className="flex-1 min-w-0">
            <div className="flex items-center gap-2 mb-1">
              <span className="text-xs font-medium text-foreground">{config.label}</span>
              {!alert.is_read && (
                <Badge variant="default" className="text-xs h-4 px-1.5">Novo</Badge>
              )}
            </div>
            <h4 className="text-sm font-semibold text-foreground">{alert.title}</h4>
            <p className="text-xs text-muted-foreground mt-1">{alert.message}</p>
            <p className="text-xs text-muted-foreground/70 mt-1">{timeAgo}</p>
          </div>
          <div className="flex flex-col gap-1 flex-shrink-0">
            {!alert.is_read && onMarkAsRead && (
              <Button
                variant="ghost"
                size="sm"
                className="h-6 text-xs"
                onClick={() => onMarkAsRead(alert.id)}
              >
                <Info className="h-3 w-3 mr-1" />
                Ler
              </Button>
            )}
          </div>
        </div>
      </CardContent>
    </Card>
  );
}
