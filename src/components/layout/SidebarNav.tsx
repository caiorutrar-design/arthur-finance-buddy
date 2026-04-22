import { TrendingUp, List, Wallet, Target, Settings, LayoutDashboard, Bell } from 'lucide-react';
import { NavLink as RouterNavLink } from 'react-router-dom';
import { cn } from '@/lib/utils';
import { AlertsBell } from '@/components/alerts/AlertsBell';

interface NavItemProps {
  to: string;
  icon: React.ComponentType<{ className?: string }>;
  label: string;
  badge?: number;
}

function NavItem({ to, icon: Icon, label }: NavItemProps) {
  return (
    <RouterNavLink
      to={to}
      className={({ isActive }) =>
        cn(
          'flex items-center gap-3 px-3 py-2 rounded-lg text-sm font-medium transition-colors',
          isActive
            ? 'bg-primary/10 text-primary'
            : 'text-muted-foreground hover:text-foreground hover:bg-accent'
        )
      }
    >
      <Icon className="h-4 w-4" />
      <span>{label}</span>
    </RouterNavLink>
  );
}

export function SidebarNav() {
  return (
    <nav className="space-y-1">
      <NavItem to="/" icon={LayoutDashboard} label="Dashboard" />
      <NavItem to="/transactions" icon={List} label="Transações" />
      <NavItem to="/budgets" icon={Wallet} label="Orçamentos" />
      <NavItem to="/goals" icon={Target} label="Metas" />
    </nav>
  );
}

interface HeaderNavProps {
  onToggleSidebar?: () => void;
  sidebarOpen?: boolean;
}

export function HeaderNav({ onToggleSidebar }: HeaderNavProps) {
  return (
    <div className="flex items-center gap-2">
      <AlertsBell />
    </div>
  );
}
