import { TransactionWithCategory } from "@/hooks/useTransactions";
import { TransactionCard } from "./TransactionCard";
import { Skeleton } from "@/components/ui/skeleton";
import { Alert, AlertDescription } from "@/components/ui/alert";
import { AlertCircle, Inbox } from "lucide-react";

interface TransactionListProps {
  transactions: TransactionWithCategory[];
  isLoading?: boolean;
  isEmpty?: boolean;
  emptyMessage?: string;
  onEdit?: (transaction: TransactionWithCategory) => void;
  onDelete?: (transaction: TransactionWithCategory) => void;
}

export function TransactionList({
  transactions,
  isLoading,
  isEmpty,
  emptyMessage = "Nenhuma transação encontrada",
  onEdit,
  onDelete,
}: TransactionListProps) {
  if (isLoading) {
    return (
      <div className="space-y-3">
        {Array.from({ length: 5 }).map((_, i) => (
          <div key={i} className="glass-card rounded-lg p-3 flex items-center gap-3">
            <Skeleton className="h-10 w-10 rounded-full" />
            <div className="flex-1 space-y-2">
              <Skeleton className="h-4 w-3/4" />
              <Skeleton className="h-3 w-1/2" />
            </div>
            <Skeleton className="h-5 w-20" />
          </div>
        ))}
      </div>
    );
  }

  if (isEmpty) {
    return (
      <Alert className="border-dashed">
        <Inbox className="h-4 w-4" />
        <AlertDescription className="text-center py-8">
          <p className="text-muted-foreground">{emptyMessage}</p>
          <p className="text-xs text-muted-foreground mt-1">
            Adicione sua primeira transação para começar
          </p>
        </AlertDescription>
      </Alert>
    );
  }

  return (
    <div className="space-y-2">
      {transactions.map((transaction) => (
        <TransactionCard
          key={transaction.id}
          transaction={transaction}
          onEdit={onEdit}
          onDelete={onDelete}
        />
      ))}
    </div>
  );
}
