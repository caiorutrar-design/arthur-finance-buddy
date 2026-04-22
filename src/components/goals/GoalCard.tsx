import { useState } from 'react';
import { Target, Clock, CheckCircle2, PauseCircle, PlayCircle, Trash2, Plus, Edit, MoreVertical } from 'lucide-react';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { Badge } from '@/components/ui/badge';
import { Progress } from '@/components/ui/progress';
import { CircularProgress } from './GoalProgress';
import {
  DropdownMenu,
  DropdownMenuContent,
  DropdownMenuItem,
  DropdownMenuTrigger,
} from '@/components/ui/dropdown-menu';
import { useAddContribution, useUpdateGoal, useDeleteGoal, type GoalWithProgress } from '@/hooks/useGoals';
import { useToast } from '@/hooks/use-toast';
import { cn } from '@/lib/utils';

interface GoalCardProps {
  goal: GoalWithProgress;
  onEdit: (goal: GoalWithProgress) => void;
  onContribute: (goal: GoalWithProgress) => void;
  compact?: boolean;
}

const GOAL_ICONS: Record<string, string> = {
  target: '🎯',
  plane: '✈️',
  home: '🏠',
  car: '🚗',
  graduation: '🎓',
  heart: '❤️',
  savings: '💰',
  laptop: '💻',
  gift: '🎁',
  vacation: '🏖️',
};

export function GoalCard({ goal, onEdit, onContribute, compact = false }: GoalCardProps) {
  const [showContribute, setShowContribute] = useState(false);
  const { toast } = useToast();
  const addContribution = useAddContribution();
  const updateGoal = useUpdateGoal();
  const deleteGoal = useDeleteGoal();

  const iconEmoji = GOAL_ICONS[goal.icon ?? 'target'] ?? '🎯';
  const deadlineDisplay = goal.deadline
    ? new Date(goal.deadline).toLocaleDateString('pt-BR', { month: 'short', year: 'numeric' })
    : null;

  const handleStatusToggle = async () => {
    const newStatus = goal.status === 'paused' ? 'active' : 'paused';
    try {
      await updateGoal.mutateAsync({ id: goal.id, status: newStatus });
      toast({
        title: newStatus === 'paused' ? 'Meta pausada' : 'Meta reativada',
        description: ` "${goal.name}" ${newStatus === 'paused' ? 'foi pausada' : 'foi reativada'}.`,
      });
    } catch {
      toast({ title: 'Erro', description: 'Não foi possível atualizar o status.', variant: 'destructive' });
    }
  };

  const handleMarkComplete = async () => {
    try {
      await updateGoal.mutateAsync({ id: goal.id, status: 'completed' });
      toast({ title: 'Meta concluída! 🎉', description: `Parabéns! Você alcançou "${goal.name}".` });
    } catch {
      toast({ title: 'Erro', description: 'Não foi possível marcar como concluída.', variant: 'destructive' });
    }
  };

  const handleDelete = async () => {
    if (!confirm(`Excluir a meta "${goal.name}"? Esta ação não pode ser undone.`)) return;
    try {
      await deleteGoal.mutateAsync(goal.id);
      toast({ title: 'Meta excluída', description: ` "${goal.name}" foi removida.` });
    } catch {
      toast({ title: 'Erro', description: 'Não foi possível excluir a meta.', variant: 'destructive' });
    }
  };

  const statusConfig = {
    active: { label: 'Ativa', color: 'bg-primary', textColor: 'text-primary', badge: 'default' as const },
    completed: { label: 'Concluída', color: 'bg-green-500', textColor: 'text-green-500', badge: 'default' as const },
    paused: { label: 'Pausada', color: 'bg-yellow-500', textColor: 'text-yellow-600', badge: 'secondary' as const },
  };
  const statusStyle = statusConfig[goal.status as keyof typeof statusConfig] ?? statusConfig.active;

  if (compact) {
    return (
      <div
        className="glass-card rounded-lg p-3 flex items-center gap-3 cursor-pointer hover:bg-accent/50 transition-colors"
        onClick={() => onEdit(goal)}
      >
        <span className="text-xl">{iconEmoji}</span>
        <div className="flex-1 min-w-0">
          <p className="text-sm font-medium truncate">{goal.name}</p>
          <p className="text-xs text-muted-foreground">
            R$ {Number(goal.current_amount).toLocaleString('pt-BR')} / R$ {Number(goal.target_amount).toLocaleString('pt-BR')}
          </p>
        </div>
        <div className="flex items-center gap-2">
          <Progress value={goal.percentage} className="h-1.5 w-16" />
          <span className="text-xs font-semibold">{Math.round(goal.percentage)}%</span>
        </div>
      </div>
    );
  }

  return (
    <Card className={cn('relative overflow-hidden', goal.status === 'completed' && 'opacity-80')}>
      {goal.color && (
        <div
          className="absolute top-0 left-0 right-0 h-1"
          style={{ backgroundColor: goal.color }}
        />
      )}

      <CardHeader className="pb-2">
        <div className="flex items-start justify-between">
          <div className="flex items-center gap-2">
            <span className="text-2xl">{iconEmoji}</span>
            <div>
              <CardTitle className="text-base leading-tight">{goal.name}</CardTitle>
              {deadlineDisplay && (
                <p className="text-xs text-muted-foreground flex items-center gap-1 mt-0.5">
                  <Clock className="h-3 w-3" />
                  {deadlineDisplay}
                  {goal.daysLeft !== null && goal.daysLeft >= 0 && (
                    <span className={cn('font-medium', goal.isNearDeadline && 'text-orange-500')}>
                      · {goal.daysLeft}d restantes
                    </span>
                  )}
                </p>
              )}
            </div>
          </div>

          <div className="flex items-center gap-2">
            <Badge variant={statusStyle.badge} className={cn('text-xs', statusStyle.textColor)}>
              {statusStyle.label}
            </Badge>

            <DropdownMenu>
              <DropdownMenuTrigger asChild>
                <Button variant="ghost" size="icon" className="h-8 w-8">
                  <MoreVertical className="h-4 w-4" />
                </Button>
              </DropdownMenuTrigger>
              <DropdownMenuContent align="end">
                <DropdownMenuItem onClick={() => onEdit(goal)}>
                  <Edit className="h-4 w-4 mr-2" /> Editar
                </DropdownMenuItem>
                <DropdownMenuItem onClick={() => onContribute(goal)}>
                  <Plus className="h-4 w-4 mr-2" /> Contribuir
                </DropdownMenuItem>
                {goal.status !== 'completed' && (
                  <DropdownMenuItem onClick={handleMarkComplete}>
                    <CheckCircle2 className="h-4 w-4 mr-2" /> Marcar concluída
                  </DropdownMenuItem>
                )}
                <DropdownMenuItem onClick={handleStatusToggle}>
                  {goal.status === 'paused' ? (
                    <><PlayCircle className="h-4 w-4 mr-2" /> Retomar</>
                  ) : (
                    <><PauseCircle className="h-4 w-4 mr-2" /> Pausar</>
                  )}
                </DropdownMenuItem>
                <DropdownMenuItem onClick={handleDelete} className="text-destructive focus:text-destructive">
                  <Trash2 className="h-4 w-4 mr-2" /> Excluir
                </DropdownMenuItem>
              </DropdownMenuContent>
            </DropdownMenu>
          </div>
        </div>
      </CardHeader>

      <CardContent>
        <div className="flex items-center gap-4">
          <CircularProgress percentage={goal.percentage} size={72} strokeWidth={7} color={goal.color ?? undefined} />
          <div className="flex-1 min-w-0">
            <div className="flex justify-between text-sm mb-1">
              <span className="text-muted-foreground">Arrecadado</span>
              <span className="font-semibold">
                R$ {Number(goal.current_amount).toLocaleString('pt-BR')}
              </span>
            </div>
            <Progress
              value={goal.percentage}
              className="h-2 mb-1"
              style={goal.color ? { '--progress-foreground': goal.color } as React.CSSProperties : undefined}
            />
            <div className="flex justify-between text-xs text-muted-foreground">
              <span>Meta: R$ {Number(goal.target_amount).toLocaleString('pt-BR')}</span>
              <span className="font-medium text-foreground">{Math.round(goal.percentage)}%</span>
            </div>
            {goal.remaining > 0 && (
              <p className="text-xs text-muted-foreground mt-1">
                Faltam: <span className="font-medium text-foreground">R$ {Number(goal.remaining).toLocaleString('pt-BR')}</span>
              </p>
            )}
          </div>
        </div>

        {goal.status === 'completed' && (
          <div className="mt-3 flex items-center gap-2 text-green-600 text-sm font-medium">
            <CheckCircle2 className="h-4 w-4" />
            Meta alcançada!
          </div>
        )}

        {goal.isNearDeadline && goal.status === 'active' && (
          <div className="mt-3 flex items-center gap-2 text-orange-500 text-xs font-medium">
            <Clock className="h-4 w-4" />
            Atenção: prazo se aproximando!
          </div>
        )}
      </CardContent>
    </Card>
  );
}
