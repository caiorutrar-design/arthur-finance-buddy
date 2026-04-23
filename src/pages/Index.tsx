import { useState } from "react";
import { TrendingUp, TrendingDown, Target, AlertTriangle, CreditCard, ShoppingCart, Utensils, Car, LogOut, List, Menu } from "lucide-react";
import { ChatContainer } from "@/components/chat/ChatContainer";
import { FinancialCard } from "@/components/FinancialCard";
import { CategoryBar } from "@/components/CategoryBar";
import { GoalCard } from "@/components/goals/GoalCard";
import { useAuth } from "@/hooks/useAuth";
import { useGoals } from "@/hooks/useGoals";
import { Avatar, AvatarFallback } from "@/components/ui/avatar";
import { useNavigate } from "react-router-dom";
import {
  DropdownMenu,
  DropdownMenuContent,
  DropdownMenuItem,
  DropdownMenuLabel,
  DropdownMenuSeparator,
  DropdownMenuTrigger,
} from "@/components/ui/dropdown-menu";
import { Button } from "@/components/ui/button";
import { SidebarNav, HeaderNav } from "@/components/layout/SidebarNav";

const MOCK_CATEGORIES = [
  { name: "Mercado", icon: ShoppingCart, spent: 1240, limit: 1500, color: "hsl(var(--primary))" },
  { name: "Delivery", icon: Utensils, spent: 680, limit: 500, color: "hsl(var(--warning))" },
  { name: "Transporte", icon: Car, spent: 320, limit: 600, color: "hsl(var(--primary))" },
  { name: "Cartão", icon: CreditCard, spent: 2100, limit: 3000, color: "hsl(var(--primary))" },
];

const Index = () => {
  const [sidebarOpen, setSidebarOpen] = useState(true);
  const { profile, signOut } = useAuth();
  const navigate = useNavigate();
  const { data: goals = [] } = useGoals({ userId: profile?.id, status: 'active' });
  const activeGoals = goals.filter(g => !g.isCompleted).slice(0, 3);

  const handleLogout = async () => {
    await signOut();
  };

  const userInitials = profile?.name
    ? profile.name.split(' ').map(n => n[0]).join('').toUpperCase().slice(0, 2)
    : profile?.email?.[0]?.toUpperCase() ?? 'U';

  return (
    <div className="flex h-screen overflow-hidden">
      {/* Sidebar - Financial Summary */}
      <aside
        className={`${
          sidebarOpen ? "w-80" : "w-0"
        } transition-all duration-300 overflow-hidden border-r border-border flex-shrink-0`}
      >
        <div className="w-80 h-full flex flex-col p-4 gap-4 overflow-y-auto">
          {/* Header with user info */}
          <div className="flex items-center gap-3 mb-2">
            <div className="h-10 w-10 rounded-xl bg-primary/20 flex items-center justify-center">
              <span className="text-primary font-heading font-bold text-lg">A</span>
            </div>
            <div className="flex-1 min-w-0">
              <h1 className="font-heading font-bold text-lg text-foreground">Arthur</h1>
              <p className="text-xs text-muted-foreground">Seu consultor financeiro</p>
            </div>
            <DropdownMenu>
              <DropdownMenuTrigger asChild>
                <button className="flex items-center gap-2 rounded-lg p-1 hover:bg-accent transition-colors">
                  <Avatar className="h-8 w-8">
                    <AvatarFallback className="text-xs bg-primary/20 text-primary">
                      {userInitials}
                    </AvatarFallback>
                  </Avatar>
                </button>
              </DropdownMenuTrigger>
              <DropdownMenuContent align="end" className="w-56">
                <DropdownMenuLabel className="font-normal">
                  <div className="flex flex-col space-y-1">
                    <p className="text-sm font-medium">{profile?.name || 'Usuário'}</p>
                    <p className="text-xs text-muted-foreground">{profile?.email}</p>
                  </div>
                </DropdownMenuLabel>
                <DropdownMenuSeparator />
                <DropdownMenuItem onClick={handleLogout} className="text-destructive focus:text-destructive">
                  <LogOut className="h-4 w-4 mr-2" />
                  Sair
                </DropdownMenuItem>
              </DropdownMenuContent>
            </DropdownMenu>
          </div>

          {/* Navigation */}
          <SidebarNav />

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
              {activeGoals.length > 0 ? (
                activeGoals.map((goal) => (
                  <GoalCard
                    key={goal.id}
                    goal={goal}
                    compact
                    onEdit={() => navigate('/goals')}
                    onContribute={() => navigate('/goals')}
                  />
                ))
              ) : (
                <p className="text-xs text-muted-foreground text-center py-2">Nenhuma meta ativa</p>
              )}
              <Button
                variant="ghost"
                size="sm"
                className="w-full text-xs text-primary"
                onClick={() => navigate('/goals')}
              >
                Ver todas as metas →
              </Button>
            </div>
          </div>

          {/* Navigation */}
          <div className="mt-auto">
            <Button
              variant="outline"
              className="w-full justify-start gap-2"
              onClick={() => navigate("/transactions")}
            >
              <List className="h-4 w-4" />
              Ver todas transações
            </Button>
          </div>
        </div>
      </aside>

      {/* Chat Area */}
      <main className="flex-1 flex flex-col min-w-0">
        <ChatContainer
          userId={profile?.id}
          onToggleSidebar={() => setSidebarOpen(!sidebarOpen)}
          sidebarOpen={sidebarOpen}
        />
      </main>
    </div>
  );
};

export default Index;
