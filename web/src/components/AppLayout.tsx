import { NavLink, Outlet } from 'react-router-dom';
import { Package, LogOut } from 'lucide-react';
import { navItems } from '../lib/mock';
import { useAuth } from '../lib/auth';
import { Button } from './ui';

export function AppLayout() {
  const { logout } = useAuth();

  return (
    <div className="flex min-h-screen">
      <aside className="flex w-56 flex-col border-r border-[var(--color-border)] bg-white">
        <div className="flex items-center gap-2 border-b border-[var(--color-border)] px-4 py-4">
          <Package className="h-6 w-6 text-[var(--color-primary)]" />
          <span className="font-semibold">商品选品助手</span>
        </div>
        <nav className="flex flex-1 flex-col gap-1 p-3">
          {navItems.map((item) => (
            <NavLink
              key={item.to}
              to={item.to}
              end={item.end}
              className={({ isActive }) =>
                `rounded-lg px-3 py-2 text-sm ${isActive ? 'bg-blue-50 font-medium text-[var(--color-primary)]' : 'text-slate-600 hover:bg-slate-50'}`
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
