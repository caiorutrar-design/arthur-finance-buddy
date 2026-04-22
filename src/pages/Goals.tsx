import { useState, useMemo } from 'react';
import { Plus, Target, TrendingUp, CheckCircle2, PauseCircle, AlertTriangle } from 'lucide-react';
import { Button } from '@/components/ui/button';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Tabs, TabsList, TabsTrigger } from '@/components/ui/tabs';
import { Skeleton } from '@/components/ui/skeleton';
import { GoalCard } from '@/components/goals/GoalCard';
import { GoalForm, ContributeForm } from '@/components/goals/GoalForm';
import { useGoals, useGoalStats, useCreateGoal, useUpdateGoal, useAddContribution, type GoalWithProgress } from '@/hooks/useGoals';
import { useAuth } from '@/hooks/useAuth';
import { useToast } from '@/hooks/use-toast';
import { useNavigate } from 'react-router-dom';

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

export default function GoalsPage() {
  const { profile } = useAuth();
  const userId = profile?.id;
  const navigate = useNavigate();
  const { toast } = useToast();

  const [activeTab, setActiveTab] = useState<'all' | 'active' | 'completed' | 'paused'>('all');
  const [formOpen, setFormOpen] = useState(false);
  const [contributeOpen, setContributeOpen] = useState(false);
  const [editingGoal, setEditingGoal] = useState<GoalWithProgress | null>(null);
  const [contributingGoal, setContributingGoal] = useState<GoalWithProgress | null>(null);

  const { data: goals = [], isLoading } = useGoals({ userId });
  const { data: stats } = useGoalStats(userId);

  const createGoal = useCreateGoal();
  const updateGoal = useUpdateGoal();

  const filteredGoals = useMemo(() => {
    if (activeTab === 'all') return goals;
    return goals.filter((g) => g.status === activeTab);
  }, [goals, activeTab]);

  const handleCreateGoal = async (data: {
    name: string;
    target_amount: number;
    deadline: string;
    icon: string;
    color: string;
  }) => {
    if (!userId) return;
    try {
      await createGoal.mutateAsync({
        user_id: userId,
        name: data.name,
        target_amount: data.target_amount,
        deadline: data.deadline || null,
        icon: data.icon,
        color: data.color,
        status: 'active',
      });
      setFormOpen(false);
      toast({ title: 'Meta criada!', description: `"${data.name}" foi adicionada.` });
    } catch {
      toast({ title: 'Erro', description: 'Não foi possível criar a meta.', variant: 'destructive' });
    }
  };

  const handleEditGoal = (data: {
    name: string;
    target_amount: number;
    deadline: string;
    icon: string;
    color: string;
  }) => {
    if (!editingGoal) return;
    updateGoal.mutate(
      {
        id: editingGoal.id,
        name: data.name,
        target_amount: data.target_amount,
        deadline: data.deadline || null,
        icon: data.icon,
        color: data.color,
      },
      {
        onSuccess: () => {
          setFormOpen(false);
          setEditingGoal(null);
          toast({ title: 'Meta atualizada', description: `"${data.name}" foi salva.` });
        },
        onError: () => {
          toast({ title: 'Erro', description: 'Não foi possível atualizar a meta.', variant: 'destructive' });
        },
      }
    );
  };

  const handleContribute = async (data: { amount: number }) => {
    if (!contributingGoal) return;
    addContribution.mutate(
      { id: contributingGoal.id, amount: data.amount },
      {
        onSuccess: (updated) => {
          setContributeOpen(false);
          setContributingGoal(null);
          if (updated.isCompleted) {
            toast({ title: 'Meta alcançada! 🎉', description: `Parabéns! Você alcançou "${updated.name}".` });
          } else {
            toast({
              title: 'Contribuição添加',
              description: `R$ ${data.amount.toLocaleString('pt-BR')} adicionados a "${updated.name}".`,
            });
          }
        },
        onError: () => {
          toast({ title: 'Erro', description: 'Não foi possível adicionar a contribuição.', variant: 'destructive' });
        },
      }
    );
  };

  return (
    <div className="flex h-full">
      {/* Sidebar */}
      <aside className="w-72 border-r border-border p-4 flex flex-col gap-4 overflow-y-auto">
        <div className="flex items-center gap-2">
          <Target className="h-6 w-6 text-primary" />
          <h1 className="font-heading font-bold text-lg">Metas</h1>
        </div>

        {/* Stats Cards */}
        {stats && (
          <div className="grid grid-cols-2 gap-3">
            <Card className="p-3">
              <CardContent className="p-0">
                <p className="text-xs text-muted-foreground">Total</p>
                <p className="text-xl font-bold">{stats.total}</p>
              </CardContent>
            </Card>
            <Card className="p-3">
              <CardContent className="p-0">
                <p className="text-xs text-muted-foreground">Concluídas</p>
                <p className="text-xl font-bold text-green-500">{stats.completed}</p>
              </CardContent>
            </Card>
            <Card className="p-3">
              <CardContent className="p-0">
                <p className="text-xs text-muted-foreground">Ativas</p>
                <p className="text-xl font-bold">{stats.active}</p>
              </CardContent>
            </Card>
            <Card className="p-3">
              <CardContent className="p-0">
                <p className="text-xs text-muted-foreground">Pausadas</p>
                <p className="text-xl font-bold text-yellow-500">{stats.paused}</p>
              </CardContent>
            </Card>
          </div>
        )}

        {/* Total Progress */}
        {stats && stats.totalTarget > 0 && (
          <Card className="p-3">
            <CardContent className="p-0 space-y-2">
              <div className="flex justify-between text-sm">
                <span className="text-muted-foreground">Total acumulado</span>
                <span className="font-semibold">
                  R$ {stats.totalCurrent.toLocaleString('pt-BR')}
                </span>
              </div>
              <div className="h-2 rounded-full bg-secondary overflow-hidden">
                <div
                  className="h-full rounded-full bg-primary transition-all"
                  style={{ width: `${Math.min((stats.totalCurrent / stats.totalTarget) * 100, 100)}%` }}
                />
              </div>
              <p className="text-xs text-muted-foreground text-right">
                de R$ {stats.totalTarget.toLocaleString('pt-BR')}
              </p>
            </CardContent>
          </Card>
        )}

        {/* Alerts */}
        {stats && stats.nearDeadline > 0 && (
          <div className="flex items-center gap-2 text-orange-500 text-sm p-3 rounded-lg bg-orange-500/10">
            <AlertTriangle className="h-4 w-4" />
            <span>{stats.nearDeadline} meta{(stats.nearDeadline as number) > 1 ? 's' : ''} perto do prazo</span>
          </div>
        )}

        <Button
          onClick={() => {
            setEditingGoal(null);
            setFormOpen(true);
          }}
          className="w-full gap-2"
        >
          <Plus className="h-4 w-4" />
          Nova Meta
        </Button>
      </aside>

      {/* Main Content */}
      <main className="flex-1 overflow-y-auto p-6">
        <Tabs value={activeTab} onValueChange={(v) => setActiveTab(v as typeof activeTab)} className="mb-6">
          <TabsList>
            <TabsTrigger value="all">Todas</TabsTrigger>
            <TabsTrigger value="active">Ativas</TabsTrigger>
            <TabsTrigger value="completed">Concluídas</TabsTrigger>
            <TabsTrigger value="paused">Pausadas</TabsTrigger>
          </TabsList>
        </Tabs>

        {isLoading ? (
          <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-4">
            {[1, 2, 3].map((i) => (
              <Card key={i}>
                <CardHeader>
                  <Skeleton className="h-6 w-3/4" />
                </CardHeader>
                <CardContent>
                  <Skeleton className="h-20 w-full" />
                </CardContent>
              </Card>
            ))}
          </div>
        ) : filteredGoals.length === 0 ? (
          <div className="flex flex-col items-center justify-center py-16 text-center">
            <Target className="h-16 w-16 text-muted-foreground/30 mb-4" />
            <h3 className="font-heading font-semibold text-lg mb-2">Nenhuma meta encontrada</h3>
            <p className="text-sm text-muted-foreground mb-4">
              {activeTab === 'all'
                ? 'Comece criando sua primeira meta financeira!'
                : `Nenhuma meta ${activeTab === 'active' ? 'ativa' : activeTab === 'completed' ? 'concluída' : 'pausada'} no momento.`}
            </p>
            {activeTab === 'all' && (
              <Button
                onClick={() => {
                  setEditingGoal(null);
                  setFormOpen(true);
                }}
                className="gap-2"
              >
                <Plus className="h-4 w-4" />
                Criar Meta
              </Button>
            )}
          </div>
        ) : (
          <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-4">
            {filteredGoals.map((goal) => (
              <GoalCard
                key={goal.id}
                goal={goal}
                onEdit={(g) => {
                  setEditingGoal(g);
                  setFormOpen(true);
                }}
                onContribute={(g) => {
                  setContributingGoal(g);
                  setContributeOpen(true);
                }}
              />
            ))}
          </div>
        )}
      </main>

      {/* Goal Form Modal */}
      <GoalForm
        open={formOpen}
        onOpenChange={(open) => {
          setFormOpen(open);
          if (!open) setEditingGoal(null);
        }}
        onSubmit={editingGoal ? handleEditGoal : handleCreateGoal}
        editingGoal={editingGoal}
        isSubmitting={createGoal.isPending || updateGoal.isPending}
      />

      {/* Contribute Modal */}
      <ContributeForm
        open={contributeOpen}
        onOpenChange={(open) => {
          setContributeOpen(open);
          if (!open) setContributingGoal(null);
        }}
        onSubmit={handleContribute}
        goal={contributingGoal}
        isSubmitting={false}
      />
    </div>
  );
}
