import { AlertCard } from './AlertCard';
import { useAlerts, useMarkAlertAsRead, useMarkAllAlertsAsRead } from '@/hooks/useAlerts';
import { ScrollArea } from '@/components/ui/scroll-area';
import { Button } from '@/components/ui/button';
import { Skeleton } from '@/components/ui/skeleton';
import { CheckCheck, Bell } from 'lucide-react';
import { cn } from '@/lib/utils';

interface AlertsListProps {
  userId: string;
  maxHeight?: string;
  onClose?: () => void;
  className?: string;
}

export function AlertsList({ userId, maxHeight = '400px', onClose, className }: AlertsListProps) {
  const { data: alerts, isLoading } = useAlerts({ userId, limit: 20 });
  const markAsRead = useMarkAlertAsRead();
  const markAllAsRead = useMarkAllAlertsAsRead();

  const unreadCount = alerts?.filter((a) => !a.is_read).length ?? 0;

  const handleMarkAllAsRead = async () => {
    await markAllAsRead.mutateAsync(userId);
  };

  return (
    <div className={cn('flex flex-col', className)}>
      {/* Header */}
      <div className="flex items-center justify-between p-3 border-b border-border">
        <div className="flex items-center gap-2">
          <Bell className="h-4 w-4 text-primary" />
          <span className="text-sm font-semibold">Notificações</span>
          {unreadCount > 0 && (
            <span className="inline-flex items-center justify-center h-5 min-w-5 px-1 text-xs font-medium bg-primary text-primary-foreground rounded-full">
              {unreadCount}
            </span>
          )}
        </div>
        {unreadCount > 0 && (
          <Button variant="ghost" size="sm" className="h-7 text-xs gap-1" onClick={handleMarkAllAsRead}>
            <CheckCheck className="h-3 w-3" />
            Marcar todos lidos
          </Button>
        )}
      </div>

      {/* List */}
      <ScrollArea className="flex-1" style={{ maxHeight }}>
        {isLoading ? (
          <div className="p-3 space-y-3">
            {[1, 2, 3].map((i) => (
              <Skeleton key={i} className="h-20 w-full rounded-lg" />
            ))}
          </div>
        ) : alerts && alerts.length > 0 ? (
          <div className="p-3 space-y-2">
            {alerts.map((alert) => (
              <AlertCard
                key={alert.id}
                alert={alert}
                onMarkAsRead={(id) => markAsRead.mutate({ id, isRead: true })}
              />
            ))}
          </div>
        ) : (
          <div className="flex flex-col items-center justify-center py-8 px-4 text-center">
            <Bell className="h-8 w-8 text-muted-foreground mb-2" />
            <p className="text-sm text-muted-foreground">Nenhuma notificação</p>
          </div>
        )}
      </ScrollArea>
    </div>
  );
}
