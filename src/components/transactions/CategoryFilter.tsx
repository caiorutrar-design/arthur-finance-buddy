import { useCategories } from "@/hooks/useCategories";
import { TransactionType } from "@/hooks/useTransactions";
import { cn } from "@/lib/utils";
import { Button } from "@/components/ui/button";
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from "@/components/ui/select";
import { Calendar } from "@/components/ui/calendar";
import { Popover, PopoverContent, PopoverTrigger } from "@/components/ui/popover";
import { ptBR } from "date-fns/locale";
import { format, startOfMonth, endOfMonth } from "date-fns";
import { CalendarIcon, Filter } from "lucide-react";
import { useState } from "react";

interface CategoryFilterProps {
  organizationId?: string;
  selectedType?: TransactionType | 'all';
  selectedCategoryId?: string;
  startDate?: Date;
  endDate?: Date;
  onTypeChange?: (type: TransactionType | 'all') => void;
  onCategoryChange?: (categoryId: string | undefined) => void;
  onDateRangeChange?: (startDate: Date | undefined, endDate: Date | undefined) => void;
  onClearFilters?: () => void;
}

const MONTH_PRESETS = [
  { label: 'Este mês', getDates: () => ({ start: startOfMonth(new Date()), end: endOfMonth(new Date()) }) },
  { label: 'Mês anterior', getDates: () => {
    const d = new Date();
    d.setMonth(d.getMonth() - 1);
    return { start: startOfMonth(d), end: endOfMonth(d) };
  }},
  { label: 'Últimos 3 meses', getDates: () => {
    const d = new Date();
    d.setMonth(d.getMonth() - 3);
    return { start: startOfMonth(d), end: endOfMonth(new Date()) };
  }},
  { label: 'Este ano', getDates: () => {
    const d = new Date();
    return { start: new Date(d.getFullYear(), 0, 1), end: endOfMonth(d) };
  }},
];

export function CategoryFilter({
  organizationId,
  selectedType,
  selectedCategoryId,
  startDate,
  endDate,
  onTypeChange,
  onCategoryChange,
  onDateRangeChange,
  onClearFilters,
}: CategoryFilterProps) {
  const { data: categories = [] } = useCategories({ organizationId });
  const [showDatePicker, setShowDatePicker] = useState(false);

  const hasActiveFilters = selectedType !== 'all' || selectedCategoryId || startDate || endDate;

  const handleMonthPreset = (preset: typeof MONTH_PRESETS[0]) => {
    const { start, end } = preset.getDates();
    onDateRangeChange?.(start, end);
    setShowDatePicker(false);
  };

  return (
    <div className="flex flex-wrap items-center gap-2">
      {/* Type Filter */}
      <Select
        value={selectedType ?? 'all'}
        onValueChange={(val) => onTypeChange?.(val as TransactionType | 'all')}
      >
        <SelectTrigger className="w-[140px] h-9">
          <SelectValue placeholder="Tipo" />
        </SelectTrigger>
        <SelectContent>
          <SelectItem value="all">Todos</SelectItem>
          <SelectItem value="expense">Despesas</SelectItem>
          <SelectItem value="income">Receitas</SelectItem>
        </SelectContent>
      </Select>

      {/* Category Filter */}
      <Select
        value={selectedCategoryId ?? 'all'}
        onValueChange={(val) => onCategoryChange?.(val === 'all' ? undefined : val)}
      >
        <SelectTrigger className="w-[160px] h-9">
          <SelectValue placeholder="Categoria" />
        </SelectTrigger>
        <SelectContent>
          <SelectItem value="all">Todas</SelectItem>
          {categories.map((cat) => (
            <SelectItem key={cat.id} value={cat.id}>
              {cat.name}
            </SelectItem>
          ))}
        </SelectContent>
      </Select>

      {/* Date Range Picker */}
      <Popover open={showDatePicker} onOpenChange={setShowDatePicker}>
        <PopoverTrigger asChild>
          <Button variant="outline" size="sm" className="h-9 gap-2">
            <CalendarIcon className="h-4 w-4" />
            {startDate && endDate
              ? `${format(startDate, 'dd/MM')} - ${format(endDate, 'dd/MM')}`
              : 'Período'}
          </Button>
        </PopoverTrigger>
        <PopoverContent className="w-auto p-0" align="start">
          <div className="p-3 border-b border-border">
            <p className="text-xs font-medium text-muted-foreground mb-2">Atalhos</p>
            <div className="flex flex-wrap gap-1">
              {MONTH_PRESETS.map((preset) => (
                <Button
                  key={preset.label}
                  variant="outline"
                  size="sm"
                  className="h-7 text-xs"
                  onClick={() => handleMonthPreset(preset)}
                >
                  {preset.label}
                </Button>
              ))}
            </div>
          </div>
          <Calendar
            mode="range"
            selected={{ from: startDate, to: endDate }}
            onSelect={(range) => {
              if (range?.from && range?.to) {
                onDateRangeChange?.(range.from, range.to);
                setShowDatePicker(false);
              }
            }}
            numberOfMonths={2}
            locale={ptBR}
            disabled={(date) => date > new Date()}
          />
          {(startDate || endDate) && (
            <div className="p-2 border-t border-border">
              <Button
                variant="ghost"
                size="sm"
                className="w-full h-8 text-xs"
                onClick={() => {
                  onDateRangeChange?.(undefined, undefined);
                  setShowDatePicker(false);
                }}
              >
                Limpar datas
              </Button>
            </div>
          )}
        </PopoverContent>
      </Popover>

      {/* Clear Filters */}
      {hasActiveFilters && onClearFilters && (
        <Button
          variant="ghost"
          size="sm"
          className="h-9 gap-1 text-muted-foreground"
          onClick={onClearFilters}
        >
          <Filter className="h-3 w-3" />
          Limpar
        </Button>
      )}
    </div>
  );
}
