import { useState, useMemo } from "react";
import { Plus, TrendingUp, TrendingDown, Wallet, ArrowLeftRight } from "lucide-react";
import { useAuth } from "@/hooks/useAuth";
import {
  useTransactions,
  useTransactionTotals,
  useCreateTransaction,
  useUpdateTransaction,
  useDeleteTransaction,
  TransactionWithCategory,
  TransactionType,
} from "@/hooks/useTransactions";
import { useCategories } from "@/hooks/useCategories";
import { TransactionList } from "@/components/transactions/TransactionList";
import { TransactionForm } from "@/components/transactions/TransactionForm";
import { CategoryFilter } from "@/components/transactions/CategoryFilter";
import { FinancialCard } from "@/components/FinancialCard";
import { Button } from "@/components/ui/button";
import { Skeleton } from "@/components/ui/skeleton";
import { AlertDialog, AlertDialogAction, AlertDialogCancel, AlertDialogContent, AlertDialogDescription, AlertDialogFooter, AlertDialogHeader, AlertDialogTitle } from "@/components/ui/alert-dialog";
import { Pagination, PaginationContent, PaginationItem, PaginationNext, PaginationPrevious } from "@/components/ui/pagination";
import { format, startOfMonth, endOfMonth } from "date-fns";
import { useToast } from "@/hooks/use-toast";
import { useNavigate } from "react-router-dom";
import { PanelLeftClose, PanelLeft } from "lucide-react";

const PAGE_SIZE = 20;

interface TransactionsPageProps {
  onToggleSidebar?: () => void;
  sidebarOpen?: boolean;
}

export default function TransactionsPage({ onToggleSidebar, sidebarOpen = true }: TransactionsPageProps) {
  const { profile } = useAuth();
  const navigate = useNavigate();
  const { toast } = useToast();

  // Filters state
  const [selectedType, setSelectedType] = useState<TransactionType | "all">("all");
  const [selectedCategoryId, setSelectedCategoryId] = useState<string | undefined>();
  const [startDate, setStartDate] = useState<Date>(() => startOfMonth(new Date()));
  const [endDate, setEndDate] = useState<Date>(() => endOfMonth(new Date()));
  const [page, setPage] = useState(1);

  // Modal states
  const [formOpen, setFormOpen] = useState(false);
  const [editingTransaction, setEditingTransaction] = useState<TransactionWithCategory | null>(null);
  const [deletingTransaction, setDeletingTransaction] = useState<TransactionWithCategory | null>(null);

  // Build filters for queries
  const filters = useMemo(() => ({
    userId: profile?.id,
    organizationId: profile?.organization_id,
    type: selectedType !== "all" ? selectedType : undefined,
    categoryId: selectedCategoryId,
    startDate: startDate ? format(startDate, "yyyy-MM-dd") : undefined,
    endDate: endDate ? format(endDate, "yyyy-MM-dd") : undefined,
  }), [profile?.id, profile?.organization_id, selectedType, selectedCategoryId, startDate, endDate]);

  // Fetch transactions with pagination
  const { data: transactionsData, isLoading: isLoadingTransactions } = useTransactions({
    ...filters,
    page,
    pageSize: PAGE_SIZE,
  });

  // Fetch totals
  const { data: totals } = useTransactionTotals(filters);

  // Mutations
  const createMutation = useCreateTransaction();
  const updateMutation = useUpdateTransaction();
  const deleteMutation = useDeleteTransaction();

  const handleClearFilters = () => {
    setSelectedType("all");
    setSelectedCategoryId(undefined);
    setStartDate(startOfMonth(new Date()));
    setEndDate(endOfMonth(new Date()));
    setPage(1);
  };

  const handleDateRangeChange = (start: Date | undefined, end: Date | undefined) => {
    setStartDate(start ?? startOfMonth(new Date()));
    setEndDate(end ?? endOfMonth(new Date()));
    setPage(1);
  };

  const handleOpenCreate = () => {
    setEditingTransaction(null);
    setFormOpen(true);
  };

  const handleOpenEdit = (transaction: TransactionWithCategory) => {
    setEditingTransaction(transaction);
    setFormOpen(true);
  };

  const handleDelete = (transaction: TransactionWithCategory) => {
    setDeletingTransaction(transaction);
  };

  const confirmDelete = async () => {
    if (!deletingTransaction) return;
    try {
      await deleteMutation.mutateAsync(deletingTransaction.id);
      toast({ title: "Transação excluída", description: "A transação foi removida com sucesso." });
    } catch {
      toast({ title: "Erro", description: "Não foi possível excluir a transação.", variant: "destructive" });
    } finally {
      setDeletingTransaction(null);
    }
  };

  const handleFormSubmit = async (values: {
    type: "income" | "expense";
    amount: string;
    description?: string;
    category_id?: string;
    transaction_date: Date;
  }) => {
    if (!profile?.id || !profile?.organization_id) return;

    const payload = {
      user_id: profile.id,
      organization_id: profile.organization_id,
      type: values.type,
      amount: parseFloat(values.amount.replace(",", ".")),
      description: values.description || null,
      category_id: values.category_id || null,
      transaction_date: format(values.transaction_date, "yyyy-MM-dd"),
    };

    try {
      if (editingTransaction) {
        await updateMutation.mutateAsync({ id: editingTransaction.id, ...payload });
        toast({ title: "Transação atualizada", description: "As alterações foram salvas." });
      } else {
        await createMutation.mutateAsync(payload);
        toast({ title: "Transação criada", description: "A transação foi adicionada com sucesso." });
      }
      setFormOpen(false);
      setEditingTransaction(null);
    } catch {
      toast({ title: "Erro", description: "Não foi possível salvar a transação.", variant: "destructive" });
    }
  };

  const totalPages = Math.ceil((transactionsData?.total ?? 0) / PAGE_SIZE);
  const formattedBalance = new Intl.NumberFormat("pt-BR", { style: "currency", currency: "BRL" }).format(totals?.balance ?? 0);
  const formattedIncome = new Intl.NumberFormat("pt-BR", { style: "currency", currency: "BRL" }).format(totals?.totalIncome ?? 0);
  const formattedExpense = new Intl.NumberFormat("pt-BR", { style: "currency", currency: "BRL" }).format(totals?.totalExpense ?? 0);

  return (
    <div className="flex h-full">
      {/* Main Content */}
      <main className="flex-1 flex flex-col min-w-0">
        {/* Header */}
        <header className="flex items-center gap-3 px-4 py-3 border-b border-border">
          <button
            onClick={() => navigate("/")}
            className="p-2 rounded-lg hover:bg-secondary transition-colors text-muted-foreground hover:text-foreground"
          >
            {sidebarOpen ? <PanelLeftClose className="h-4 w-4" /> : <PanelLeft className="h-4 w-4" />}
          </button>
          <div className="flex-1">
            <h1 className="font-heading font-bold text-lg text-foreground">Transações</h1>
            <p className="text-xs text-muted-foreground">
              {format(startDate, "dd MMM", { locale: require("date-fns/locale/pt-BR") })} -{" "}
              {format(endDate, "dd MMM yyyy", { locale: require("date-fns/locale/pt-BR") })}
            </p>
          </div>
          <Button onClick={handleOpenCreate} size="sm" className="gap-2">
            <Plus className="h-4 w-4" />
            Nova
          </Button>
        </header>

        {/* Summary Cards */}
        <div className="grid grid-cols-3 gap-3 p-4 border-b border-border">
          <FinancialCard
            label="Saldo"
            value={formattedBalance}
            icon={<Wallet className="h-4 w-4 text-primary" />}
            trend={`${transactionsData?.total ?? 0} transações`}
            positive={(totals?.balance ?? 0) >= 0}
          />
          <FinancialCard
            label="Receitas"
            value={formattedIncome}
            icon={<TrendingUp className="h-4 w-4 text-primary" />}
            trend="no período"
            positive={true}
          />
          <FinancialCard
            label="Despesas"
            value={formattedExpense}
            icon={<TrendingDown className="h-4 w-4 text-destructive" />}
            trend="no período"
            positive={false}
          />
        </div>

        {/* Filters */}
        <div className="px-4 py-3 border-b border-border bg-muted/30">
          <CategoryFilter
            organizationId={profile?.organization_id}
            selectedType={selectedType}
            selectedCategoryId={selectedCategoryId}
            startDate={startDate}
            endDate={endDate}
            onTypeChange={(type) => { setSelectedType(type); setPage(1); }}
            onCategoryChange={(catId) => { setSelectedCategoryId(catId); setPage(1); }}
            onDateRangeChange={handleDateRangeChange}
            onClearFilters={handleClearFilters}
          />
        </div>

        {/* Transaction List */}
        <div className="flex-1 overflow-y-auto p-4">
          <TransactionList
            transactions={transactionsData?.transactions ?? []}
            isLoading={isLoadingTransactions}
            isEmpty={!isLoadingTransactions && (transactionsData?.transactions?.length ?? 0) === 0}
            emptyMessage="Nenhuma transação encontrada neste período"
            onEdit={handleOpenEdit}
            onDelete={handleDelete}
          />

          {/* Pagination */}
          {totalPages > 1 && (
            <div className="mt-4">
              <Pagination>
                <PaginationContent>
                  <PaginationItem>
                    <PaginationPrevious
                      onClick={() => setPage((p) => Math.max(1, p - 1))}
                      className={page <= 1 ? "pointer-events-none opacity-50" : "cursor-pointer"}
                    />
                  </PaginationItem>
                  <span className="px-4 text-sm text-muted-foreground">
                    Página {page} de {totalPages}
                  </span>
                  <PaginationItem>
                    <PaginationNext
                      onClick={() => setPage((p) => Math.min(totalPages, p + 1))}
                      className={page >= totalPages ? "pointer-events-none opacity-50" : "cursor-pointer"}
                    />
                  </PaginationItem>
                </PaginationContent>
              </Pagination>
            </div>
          )}
        </div>
      </main>

      {/* Transaction Form Modal */}
      <TransactionForm
        open={formOpen}
        onOpenChange={(open) => {
          setFormOpen(open);
          if (!open) setEditingTransaction(null);
        }}
        transaction={editingTransaction}
        onSubmit={handleFormSubmit}
        isLoading={createMutation.isPending || updateMutation.isPending}
      />

      {/* Delete Confirmation */}
      <AlertDialog open={!!deletingTransaction} onOpenChange={() => setDeletingTransaction(null)}>
        <AlertDialogContent>
          <AlertDialogHeader>
            <AlertDialogTitle>Excluir transação?</AlertDialogTitle>
            <AlertDialogDescription>
              Esta ação não pode ser desfeita. A transação será permanentemente removida.
            </AlertDialogDescription>
          </AlertDialogHeader>
          <AlertDialogFooter>
            <AlertDialogCancel>Cancelar</AlertDialogCancel>
            <AlertDialogAction onClick={confirmDelete} className="bg-destructive text-destructive-foreground hover:bg-destructive/90">
              {deleteMutation.isPending ? "Excluindo..." : "Excluir"}
            </AlertDialogAction>
          </AlertDialogFooter>
        </AlertDialogContent>
      </AlertDialog>
    </div>
  );
}
