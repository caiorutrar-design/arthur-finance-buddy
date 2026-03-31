import { LucideIcon } from "lucide-react";

interface CategoryBarProps {
  name: string;
  icon: LucideIcon;
  spent: number;
  limit: number;
  color: string;
}

export function CategoryBar({ name, icon: Icon, spent, limit }: CategoryBarProps) {
  const pct = Math.min((spent / limit) * 100, 100);
  const overBudget = spent > limit;

  return (
    <div className="glass-card rounded-lg p-3">
      <div className="flex items-center justify-between mb-2">
        <div className="flex items-center gap-2">
          <Icon className="h-3.5 w-3.5 text-muted-foreground" />
          <span className="text-xs font-medium text-foreground">{name}</span>
        </div>
        <span className={`text-xs font-semibold ${overBudget ? "text-destructive" : "text-foreground"}`}>
          R$ {spent.toLocaleString("pt-BR")} / {limit.toLocaleString("pt-BR")}
        </span>
      </div>
      <div className="h-1.5 rounded-full bg-secondary overflow-hidden">
        <div
          className={`h-full rounded-full transition-all duration-500 ${
            overBudget ? "bg-destructive" : pct >= 80 ? "bg-warning" : "bg-primary"
          }`}
          style={{ width: `${pct}%` }}
        />
      </div>
    </div>
  );
}
