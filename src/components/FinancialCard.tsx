import { ReactNode } from "react";

interface FinancialCardProps {
  label: string;
  value: string;
  icon: ReactNode;
  trend: string;
  positive: boolean;
}

export function FinancialCard({ label, value, icon, trend, positive }: FinancialCardProps) {
  return (
    <div className="glass-card rounded-lg p-3">
      <div className="flex items-center justify-between mb-1">
        <span className="text-xs text-muted-foreground">{label}</span>
        {icon}
      </div>
      <p className="font-heading font-bold text-lg text-foreground">{value}</p>
      <span className={`text-xs font-medium ${positive ? "text-primary" : "text-destructive"}`}>
        {trend} vs mês anterior
      </span>
    </div>
  );
}
