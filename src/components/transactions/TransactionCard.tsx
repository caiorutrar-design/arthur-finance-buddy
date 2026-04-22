import { TrendingUp, TrendingDown, MoreHorizontal, Pencil, Trash2 } from "lucide-react";
import { TransactionWithCategory, TransactionType } from "@/hooks/useTransactions";
import { Button } from "@/components/ui/button";
import {
  DropdownMenu,
  DropdownMenuContent,
  DropdownMenuItem,
  DropdownMenuSeparator,
  DropdownMenuTrigger,
} from "@/components/ui/dropdown-menu";
import { Badge } from "@/components/ui/badge";
import { format } from "date-fns";
import { ptBR } from "date-fns/locale";

interface TransactionCardProps {
  transaction: TransactionWithCategory;
  onEdit?: (transaction: TransactionWithCategory) => void;
  onDelete?: (transaction: TransactionWithCategory) => void;
}

const CATEGORY_COLORS: Record<string, string> = {
  '#ef4444': 'bg-red-500/10 text-red-500 border-red-500/20',
  '#f97316': 'bg-orange-500/10 text-orange-500 border-orange-500/20',
  '#eab308': 'bg-yellow-500/10 text-yellow-500 border-yellow-500/20',
  '#22c55e': 'bg-green-500/10 text-green-500 border-green-500/20',
  '#06b6d4': 'bg-cyan-500/10 text-cyan-500 border-cyan-500/20',
  '#8b5cf6': 'bg-violet-500/10 text-violet-500 border-violet-500/20',
  '#ec4899': 'bg-pink-500/10 text-pink-500 border-pink-500/20',
  '#14b8a6': 'bg-teal-500/10 text-teal-500 border-teal-500/20',
  '#3b82f6': 'bg-blue-500/10 text-blue-500 border-blue-500/20',
  '#6b7280': 'bg-gray-500/10 text-gray-500 border-gray-500/20',
};

const DEFAULT_COLOR = 'bg-gray-500/10 text-gray-500 border-gray-500/20';

const CATEGORY_ICONS: Record<string, string> = {
  Utensils: '🍽️',
  Car: '🚗',
  Home: '🏠',
  Heart: '❤️',
  GraduationCap: '🎓',
  Gamepad2: '🎮',
  Bike: '🛵',
  ShoppingCart: '🛒',
  Wallet: '💰',
  Briefcase: '💼',
  TrendingUp: '📈',
  MoreHorizontal: '📋',
};

export function TransactionCard({ transaction, onEdit, onDelete }: TransactionCardProps) {
  const isIncome = transaction.type === 'income';
  const amount = Number(transaction.amount);
  const formattedAmount = new Intl.NumberFormat('pt-BR', {
    style: 'currency',
    currency: 'BRL',
  }).format(amount);

  const categoryColor = transaction.category?.color ?? DEFAULT_COLOR;
  const colorClass = CATEGORY_COLORS[transaction.category?.color ?? ''] ?? DEFAULT_COLOR;
  const icon = transaction.category?.icon ?? '📋';
  const iconEmoji = CATEGORY_ICONS[transaction.category?.icon ?? ''] ?? icon;

  const formattedDate = format(
    new Date(transaction.transaction_date),
    "dd MMM yyyy",
    { locale: ptBR }
  );

  return (
    <div className="glass-card rounded-lg p-3 flex items-center gap-3 hover:shadow-md transition-shadow">
      {/* Icon */}
      <div className={`w-10 h-10 rounded-full flex items-center justify-center text-lg ${colorClass}`}>
        {iconEmoji}
      </div>

      {/* Details */}
      <div className="flex-1 min-w-0">
        <div className="flex items-center gap-2 mb-0.5">
          <span className="text-sm font-medium text-foreground truncate">
            {transaction.description || transaction.category?.name || 'Transação'}
          </span>
          {transaction.category && (
            <Badge variant="outline" className={`text-[10px] px-1.5 py-0 ${colorClass}`}>
              {transaction.category.name}
            </Badge>
          )}
        </div>
        <span className="text-xs text-muted-foreground">
          {formattedDate}
        </span>
      </div>

      {/* Amount */}
      <div className="text-right">
        <p className={`text-sm font-semibold ${isIncome ? 'text-primary' : 'text-destructive'}`}>
          {isIncome ? '+' : '-'}{formattedAmount}
        </p>
        <div className={`flex items-center justify-end gap-1 text-xs ${isIncome ? 'text-primary/60' : 'text-destructive/60'}`}>
          {isIncome ? (
            <TrendingUp className="h-3 w-3" />
          ) : (
            <TrendingDown className="h-3 w-3" />
          )}
          <span>{isIncome ? 'Receita' : 'Despesa'}</span>
        </div>
      </div>

      {/* Actions */}
      {(onEdit || onDelete) && (
        <DropdownMenu>
          <DropdownMenuTrigger asChild>
            <Button variant="ghost" size="icon" className="h-8 w-8 text-muted-foreground">
              <MoreHorizontal className="h-4 w-4" />
            </Button>
          </DropdownMenuTrigger>
          <DropdownMenuContent align="end">
            {onEdit && (
              <DropdownMenuItem onClick={() => onEdit(transaction)}>
                <Pencil className="h-4 w-4 mr-2" />
                Editar
              </DropdownMenuItem>
            )}
            {onDelete && (
              <>
                <DropdownMenuSeparator />
                <DropdownMenuItem onClick={() => onDelete(transaction)} className="text-destructive focus:text-destructive">
                  <Trash2 className="h-4 w-4 mr-2" />
                  Excluir
                </DropdownMenuItem>
              </>
            )}
          </DropdownMenuContent>
        </DropdownMenu>
      )}
    </div>
  );
}
