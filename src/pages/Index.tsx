import { useState } from "react";
import { TrendingUp, TrendingDown, Target, AlertTriangle, CreditCard, ShoppingCart, Utensils, Car } from "lucide-react";
import { ChatPanel } from "@/components/ChatPanel";
import { FinancialCard } from "@/components/FinancialCard";
import { CategoryBar } from "@/components/CategoryBar";
import { GoalCard } from "@/components/GoalCard";

const MOCK_CATEGORIES = [
  { name: "Mercado", icon: ShoppingCart, spent: 1240, limit: 1500, color: "hsl(var(--primary))" },
  { name: "Delivery", icon: Utensils, spent: 680, limit: 500, color: "hsl(var(--warning))" },
  { name: "Transporte", icon: Car, spent: 320, limit: 600, color: "hsl(var(--primary))" },
  { name: "Cartão", icon: CreditCard, spent: 2100, limit: 3000, color: "hsl(var(--primary))" },
];

const Index = () => {
  const [sidebarOpen, setSidebarOpen] = useState(true);

  return (
    <div className="flex h-screen overflow-hidden">
      {/* Sidebar - Financial Summary */}
      <aside
        className={`${
          sidebarOpen ? "w-80" : "w-0"
        } transition-all duration-300 overflow-hidden border-r border-border flex-shrink-0`}
      >
        <div className="w-80 h-full flex flex-col p-4 gap-4 overflow-y-auto">
          {/* Header */}
          <div className="flex items-center gap-3 mb-2">
            <div className="h-10 w-10 rounded-xl bg-primary/20 flex items-center justify-center">
              <span className="text-primary font-heading font-bold text-lg">A</span>
            </div>
            <div>
              <h1 className="font-heading font-bold text-lg text-foreground">Arthur</h1>
              <p className="text-xs text-muted-foreground">Seu consultor financeiro</p>
            </div>
          </div>

          {/* Balance Cards */}
          <div className="grid grid-cols-2 gap-3">
            <FinancialCard
              label="Saldo"
              value="R$ 4.230"
              icon={<TrendingUp className="h-4 w-4 text-primary" />}
              trend="+12%"
              positive
            />
            <FinancialCard
              label="Gastos (mês)"
              value="R$ 4.340"
              icon={<TrendingDown className="h-4 w-4 text-destructive" />}
              trend="+8%"
              positive={false}
            />
          </div>

          {/* Alert */}
          <div className="glass-card rounded-lg p-3 flex items-start gap-3 border-l-2 border-l-warning">
            <AlertTriangle className="h-4 w-4 text-warning mt-0.5 flex-shrink-0" />
            <div>
              <p className="text-xs font-medium text-foreground">Alerta: Delivery</p>
              <p className="text-xs text-muted-foreground">
                Você já ultrapassou o limite de <span className="font-semibold text-warning">R$ 500</span> nesta categoria.
              </p>
            </div>
          </div>

          {/* Categories */}
          <div>
            <h2 className="font-heading font-semibold text-sm text-foreground mb-3">Categorias</h2>
            <div className="space-y-3">
              {MOCK_CATEGORIES.map((cat) => (
                <CategoryBar key={cat.name} {...cat} />
              ))}
            </div>
          </div>

          {/* Goals */}
          <div>
            <h2 className="font-heading font-semibold text-sm text-foreground mb-3">Metas</h2>
            <div className="space-y-3">
              <GoalCard
                title="Viagem Europa"
                current={8500}
                target={25000}
                deadline="Dez 2025"
                icon={<Target className="h-4 w-4 text-primary" />}
              />
              <GoalCard
                title="Reserva de Emergência"
                current={12000}
                target={18000}
                deadline="Jun 2025"
                icon={<Target className="h-4 w-4 text-primary" />}
              />
            </div>
          </div>
        </div>
      </aside>

      {/* Chat Area */}
      <main className="flex-1 flex flex-col min-w-0">
        <ChatPanel onToggleSidebar={() => setSidebarOpen(!sidebarOpen)} sidebarOpen={sidebarOpen} />
      </main>
    </div>
  );
};

export default Index;
