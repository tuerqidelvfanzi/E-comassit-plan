import { NavLink, Outlet } from 'react-router-dom';
import { Package, LogOut } from 'lucide-react';
import { PRODUCT_NAME } from '../lib/brand';
import { navItems } from '../lib/mock';
import { useAuth } from '../lib/auth';
import { Button } from './ui';

export function AppLayout() {
  const { logout } = useAuth();

  return (
    <div className="flex min-h-screen bg-[var(--color-bg)]">
      <aside className="flex w-56 flex-col border-r border-[var(--color-border)] bg-[var(--color-surface)]">
        <div
          className="flex items-center gap-2 border-b border-[var(--color-border)] px-4 py-4"
          style={{
            background: 'var(--color-topbar)',
            color: 'var(--color-topbar-fg)',
          }}
        >
          <Package className="h-6 w-6" style={{ color: 'var(--color-primary)' }} />
          <span className="font-semibold">{PRODUCT_NAME}</span>
        </div>
        <nav className="flex flex-1 flex-col gap-1 p-3">
          {navItems.map((item) => (
            <NavLink
              key={item.to}
              to={item.to}
              end={item.end}
              className={({ isActive }) =>
                `rounded-lg px-3 py-2 text-sm ${
                  isActive
                    ? 'bg-[var(--color-primary-soft)] font-medium text-[var(--color-nav-accent,var(--color-primary))]'
                    : 'text-label hover:bg-[var(--color-muted)]'
                }`
              }
            >
              {item.label}
            </NavLink>
          ))}
        </nav>
        <div className="border-t border-[var(--color-border)] p-3">
          <Button variant="ghost" className="w-full justify-start gap-2" onClick={logout}>
            <LogOut className="h-4 w-4" />
            退出登录
          </Button>
        </div>
      </aside>
      <main className="flex-1 overflow-auto p-6">
        <Outlet />
      </main>
    </div>
  );
}
