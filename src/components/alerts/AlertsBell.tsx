import { useState, useRef, useEffect } from 'react';
import { Bell, ChevronDown } from 'lucide-react';
import { useUnreadAlertCount } from '@/hooks/useAlerts';
import { AlertsList } from './AlertsList';
import { Popover, PopoverContent, PopoverTrigger } from '@/components/ui/popover';
import { useAuth } from '@/hooks/useAuth';
import { cn } from '@/lib/utils';

interface AlertsBellProps {
  className?: string;
}

export function AlertsBell({ className }: AlertsBellProps) {
  const { profile } = useAuth();
  const userId = profile?.id ?? '';
  const { data: unreadCount = 0 } = useUnreadAlertCount(userId);
  const [open, setOpen] = useState(false);
  const badgeRef = useRef<HTMLSpanElement>(null);

  const displayCount = Math.min(unreadCount, 99);

  return (
    <Popover open={open} onOpenChange={setOpen}>
      <PopoverTrigger asChild>
        <button
          className={cn(
            'relative inline-flex items-center justify-center h-9 w-9 rounded-lg hover:bg-accent transition-colors',
            className
          )}
        >
          <Bell className="h-5 w-5 text-foreground" />
          {unreadCount > 0 && (
            <span
              ref={badgeRef}
              className={cn(
                'absolute -top-0.5 -right-0.5 inline-flex items-center justify-center',
                'h-5 min-w-5 px-1 text-xs font-bold rounded-full',
                'bg-destructive text-destructive-foreground animate-in fade-in zoom-in-75',
                displayCount > 9 ? 'px-1.5' : ''
              )}
              style={{ fontSize: displayCount > 9 ? '10px' : '11px' }}
            >
              {displayCount > 99 ? '99+' : displayCount}
            </span>
          )}
          <ChevronDown className={cn('h-3 w-3 absolute -bottom-0.5 right-0.5 text-muted-foreground transition-transform', open && 'rotate-180')} />
        </button>
      </PopoverTrigger>
      <PopoverContent className="w-96 p-0" align="end" side="bottom">
        <AlertsList
          userId={userId}
          maxHeight="400px"
          onClose={() => setOpen(false)}
        />
      </PopoverContent>
    </Popover>
  );
}
