import { useState, useEffect } from 'react';
import { useForm } from 'react-hook-form';
import { Target, Calendar } from 'lucide-react';
import {
  Dialog,
  DialogContent,
  DialogHeader,
  DialogTitle,
  DialogFooter,
} from '@/components/ui/dialog';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import { Textarea } from '@/components/ui/textarea';
import { Calendar as CalendarComponent } from '@/components/ui/calendar';
import {
  Popover,
  PopoverContent,
  PopoverTrigger,
} from '@/components/ui/popover';
import { cn } from '@/lib/utils';
import type { GoalWithProgress } from '@/hooks/useGoals';

const GOAL_ICONS = [
  { value: 'target', emoji: '🎯', label: 'Meta' },
  { value: 'plane', emoji: '✈️', label: 'Viagem' },
  { value: 'home', emoji: '🏠', label: 'Casa' },
  { value: 'car', emoji: '🚗', label: 'Carro' },
  { value: 'graduation', emoji: '🎓', label: 'Estudos' },
  { value: 'heart', emoji: '❤️', label: 'Saúde' },
  { value: 'savings', emoji: '💰', label: 'Poupança' },
  { value: 'laptop', emoji: '💻', label: 'Tecnologia' },
  { value: 'gift', emoji: '🎁', label: 'Presente' },
  { value: 'vacation', emoji: '🏖️', label: 'Férias' },
];

const GOAL_COLORS = [
  '#6366f1', // indigo
  '#8b5cf6', // violet
  '#ec4899', // pink
  '#f43f5e', // rose
  '#ef4444', // red
  '#f97316', // orange
  '#eab308', // yellow
  '#22c55e', // green
  '#14b8a6', // teal
  '#06b6d4', // cyan
  '#3b82f6', // blue
];

interface GoalFormData {
  name: string;
  target_amount: number;
  deadline: string;
  icon: string;
  color: string;
}

interface GoalFormProps {
  open: boolean;
  onOpenChange: (open: boolean) => void;
  onSubmit: (data: GoalFormData) => void;
  editingGoal?: GoalWithProgress | null;
  isSubmitting?: boolean;
}

export function GoalForm({ open, onOpenChange, onSubmit, editingGoal, isSubmitting }: GoalFormProps) {
  const [selectedDate, setSelectedDate] = useState<Date | undefined>();

  const {
    register,
    handleSubmit,
    setValue,
    watch,
    reset,
    formState: { errors },
  } = useForm<GoalFormData>({
    defaultValues: {
      name: '',
      target_amount: 0,
      deadline: '',
      icon: 'target',
      color: GOAL_COLORS[0],
    },
  });

  const selectedIcon = watch('icon');
  const selectedColor = watch('color');

  useEffect(() => {
    if (editingGoal) {
      reset({
        name: editingGoal.name,
        target_amount: Number(editingGoal.target_amount),
        deadline: editingGoal.deadline ?? '',
        icon: editingGoal.icon ?? 'target',
        color: editingGoal.color ?? GOAL_COLORS[0],
      });
      setSelectedDate(editingGoal.deadline ? new Date(editingGoal.deadline) : undefined);
    } else {
      reset({
        name: '',
        target_amount: 0,
        deadline: '',
        icon: 'target',
        color: GOAL_COLORS[0],
      });
      setSelectedDate(undefined);
    }
  }, [editingGoal, open, reset]);

  const onFormSubmit = (data: GoalFormData) => {
    onSubmit(data);
  };

  return (
    <Dialog open={open} onOpenChange={onOpenChange}>
      <DialogContent className="sm:max-w-md">
        <DialogHeader>
          <DialogTitle className="flex items-center gap-2">
            <Target className="h-5 w-5 text-primary" />
            {editingGoal ? 'Editar Meta' : 'Nova Meta'}
          </DialogTitle>
        </DialogHeader>

        <form onSubmit={handleSubmit(onFormSubmit)} className="space-y-4">
          {/* Nome */}
          <div className="space-y-2">
            <Label htmlFor="name">Nome da meta *</Label>
            <Input
              id="name"
              placeholder="Ex: Viagem para Europa"
              {...register('name', { required: 'Nome é obrigatório' })}
              className={errors.name ? 'border-destructive' : ''}
            />
            {errors.name && (
              <p className="text-xs text-destructive">{errors.name.message}</p>
            )}
          </div>

          {/* Valor alvo */}
          <div className="space-y-2">
            <Label htmlFor="target_amount">Valor alvo (R$) *</Label>
            <Input
              id="target_amount"
              type="number"
              min="0"
              step="0.01"
              placeholder="25000"
              {...register('target_amount', {
                required: 'Valor alvo é obrigatório',
                min: { value: 1, message: 'Valor deve ser maior que zero' },
                valueAsNumber: true,
              })}
              className={errors.target_amount ? 'border-destructive' : ''}
            />
            {errors.target_amount && (
              <p className="text-xs text-destructive">{errors.target_amount.message}</p>
            )}
          </div>

          {/* Prazo */}
          <div className="space-y-2">
            <Label>Prazo (opcional)</Label>
            <Popover>
              <PopoverTrigger asChild>
                <Button
                  variant="outline"
                  type="button"
                  className={cn(
                    'w-full justify-start text-left font-normal',
                    !selectedDate && 'text-muted-foreground'
                  )}
                >
                  <Calendar className="h-4 w-4 mr-2" />
                  {selectedDate
                    ? selectedDate.toLocaleDateString('pt-BR')
                    : 'Selecionar prazo'}
                </Button>
              </PopoverTrigger>
              <PopoverContent className="w-auto p-0" align="start">
                <CalendarComponent
                  mode="single"
                  selected={selectedDate}
                  onSelect={(date) => {
                    setSelectedDate(date);
                    setValue('deadline', date ? date.toISOString().split('T')[0] : '');
                  }}
                  disabled={(date) => date < new Date()}
                  initialFocus
                />
              </PopoverContent>
            </Popover>
          </div>

          {/* Ícone */}
          <div className="space-y-2">
            <Label>Ícone</Label>
            <div className="flex flex-wrap gap-2">
              {GOAL_ICONS.map((icon) => (
                <button
                  key={icon.value}
                  type="button"
                  onClick={() => setValue('icon', icon.value)}
                  className={cn(
                    'text-xl p-2 rounded-lg border transition-colors',
                    selectedIcon === icon.value
                      ? 'border-primary bg-primary/10'
                      : 'border-transparent hover:bg-accent'
                  )}
                  title={icon.label}
                >
                  {icon.emoji}
                </button>
              ))}
            </div>
          </div>

          {/* Cor */}
          <div className="space-y-2">
            <Label>Cor</Label>
            <div className="flex flex-wrap gap-2">
              {GOAL_COLORS.map((color) => (
                <button
                  key={color}
                  type="button"
                  onClick={() => setValue('color', color)}
                  className={cn(
                    'w-7 h-7 rounded-full transition-transform',
                    selectedColor === color ? 'scale-125 ring-2 ring-offset-2 ring-primary' : ''
                  )}
                  style={{ backgroundColor: color }}
                />
              ))}
            </div>
          </div>

          <DialogFooter>
            <Button
              type="button"
              variant="outline"
              onClick={() => onOpenChange(false)}
            >
              Cancelar
            </Button>
            <Button type="submit" disabled={isSubmitting}>
              {isSubmitting ? 'Salvando...' : editingGoal ? 'Salvar' : 'Criar Meta'}
            </Button>
          </DialogFooter>
        </form>
      </DialogContent>
    </Dialog>
  );
}

interface ContributeFormData {
  amount: number;
}

interface ContributeFormProps {
  open: boolean;
  onOpenChange: (open: boolean) => void;
  onSubmit: (data: ContributeFormData) => void;
  goal: GoalWithProgress | null;
  isSubmitting?: boolean;
}

export function ContributeForm({
  open,
  onOpenChange,
  onSubmit,
  goal,
  isSubmitting,
}: ContributeFormProps) {
  const { register, handleSubmit, reset, watch, setValue } = useForm<ContributeFormData>({
    defaultValues: { amount: 0 },
  });

  const amount = watch('amount');

  useEffect(() => {
    if (goal) {
      reset({ amount: 0 });
    }
  }, [goal, reset]);

  const remaining = goal ? Number(goal.target_amount) - Number(goal.current_amount) : 0;

  const quickAmounts = [
    { label: 'R$ 100', value: 100 },
    { label: 'R$ 500', value: 500 },
    { label: 'R$ 1.000', value: 1000 },
  ];

  return (
    <Dialog open={open} onOpenChange={onOpenChange}>
      <DialogContent className="sm:max-w-md">
        <DialogHeader>
          <DialogTitle className="flex items-center gap-2">
            <Target className="h-5 w-5 text-primary" />
            Contribuir para "{goal?.name}"
          </DialogTitle>
        </DialogHeader>

        <form onSubmit={handleSubmit(onSubmit)} className="space-y-4">
          <div className="space-y-2">
            <Label htmlFor="amount">Valor da contribuição (R$) *</Label>
            <Input
              id="amount"
              type="number"
              min="0.01"
              step="0.01"
              placeholder="500"
              {...register('amount', {
                required: 'Valor é obrigatório',
                min: { value: 0.01, message: 'Valor deve ser maior que zero' },
                valueAsNumber: true,
              })}
            />
            {remaining > 0 && (
              <p className="text-xs text-muted-foreground">
                Faltam R$ {remaining.toLocaleString('pt-BR')} para completar a meta.
              </p>
            )}
          </div>

          {/* Quick amounts */}
          <div className="flex gap-2 flex-wrap">
            {quickAmounts.map((qa) => (
              <Button
                key={qa.value}
                type="button"
                variant="outline"
                size="sm"
                onClick={() => setValue('amount', qa.value)}
              >
                {qa.label}
              </Button>
            ))}
            {remaining > 0 && (
              <Button
                type="button"
                variant="outline"
                size="sm"
                onClick={() => setValue('amount', remaining)}
              >
                Completar (R$ {remaining.toLocaleString('pt-BR')})
              </Button>
            )}
          </div>

          <DialogFooter>
            <Button type="button" variant="outline" onClick={() => onOpenChange(false)}>
              Cancelar
            </Button>
            <Button type="submit" disabled={isSubmitting || !amount}>
              {isSubmitting ? 'Adicionando...' : 'Adicionar'}
            </Button>
          </DialogFooter>
        </form>
      </DialogContent>
    </Dialog>
  );
}
