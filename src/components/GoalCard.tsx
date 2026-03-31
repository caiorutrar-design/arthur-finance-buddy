import { ReactNode } from "react";

interface GoalCardProps {
  title: string;
  current: number;
  target: number;
  deadline: string;
  icon: ReactNode;
}

export function GoalCard({ title, current, target, deadline, icon }: GoalCardProps) {
  const pct = Math.round((current / target) * 100);

  return (
    <div className="glass-card rounded-lg p-3">
      <div className="flex items-center justify-between mb-2">
        <div className="flex items-center gap-2">
          {icon}
          <span className="text-xs font-medium text-foreground">{title}</span>
        </div>
        <span className="text-xs text-muted-foreground">{deadline}</span>
      </div>
      <div className="h-1.5 rounded-full bg-secondary overflow-hidden mb-1.5">
        <div
          className="h-full rounded-full bg-primary transition-all duration-500"
          style={{ width: `${pct}%` }}
        />
      </div>
      <div className="flex justify-between">
        <span className="text-xs text-muted-foreground">
          R$ {current.toLocaleString("pt-BR")}
        </span>
        <span className="text-xs font-semibold text-primary">{pct}%</span>
      </div>
    </div>
  );
}
