'use client';
import { useState } from 'react';
import Link from 'next/link';
import { usePathname } from 'next/navigation';
import {
  LayoutDashboard, Home, FileText, ArrowLeftRight,
  Building2, Users, Settings, ChevronLeft, ChevronRight,
  Shield, LogOut, Bell, CreditCard, ClipboardList, BarChart3
} from 'lucide-react';
import { useAuth } from '@/components/auth/AuthProvider';
import { cn } from '@/lib/utils';

const menuByRole = {
  citizen: [
    { href: '/dashboard/citizen', icon: LayoutDashboard, label: 'Overview' },
    { href: '/property/register', icon: Home, label: 'Register Property' },
    { href: '/property/transfer', icon: ArrowLeftRight, label: 'Transfer' },
    { href: '/search', icon: FileText, label: 'Search Properties' },
  ],
  officer: [
    { href: '/dashboard/officer', icon: LayoutDashboard, label: 'Overview' },
    { href: '/dashboard/officer#approvals', icon: ClipboardList, label: 'Pending Approvals' },
    { href: '/search', icon: FileText, label: 'Search Properties' },
    { href: '/dashboard/officer#activity', icon: BarChart3, label: 'Activity Feed' },
  ],
  bank: [
    { href: '/dashboard/bank', icon: LayoutDashboard, label: 'Overview' },
    { href: '/mortgage', icon: CreditCard, label: 'Mortgages' },
    { href: '/search', icon: FileText, label: 'Title Verification' },
  ],
  admin: [
    { href: '/dashboard/admin', icon: LayoutDashboard, label: 'Overview' },
    { href: '/dashboard/admin#users', icon: Users, label: 'User Management' },
    { href: '/dashboard/admin#logs', icon: ClipboardList, label: 'Audit Logs' },
    { href: '/dashboard/admin#stats', icon: BarChart3, label: 'System Stats' },
    { href: '/dashboard/admin#settings', icon: Settings, label: 'Settings' },
  ],
};

export default function DashboardLayout({ children }) {
  const [collapsed, setCollapsed] = useState(false);
  const pathname = usePathname();
  const { user, logout } = useAuth();
  const role = user?.role || 'citizen';
  const menu = menuByRole[role] || menuByRole.citizen;

  return (
    <div className="flex min-h-screen bg-gray-50">
      {/* Sidebar */}
      <aside
        className={cn(
          'flex flex-col bg-white border-r border-gray-200 transition-all duration-300 shrink-0',
          collapsed ? 'w-16' : 'w-60'
        )}
      >
        {/* Logo */}
        <div className={cn('flex items-center h-16 px-4 border-b border-gray-100', collapsed && 'justify-center')}>
          {collapsed ? (
            <div className="p-1.5 bg-primary-600 rounded-lg">
              <Shield size={18} className="text-white" />
            </div>
          ) : (
            <Link href="/" className="flex items-center gap-2">
              <div className="p-1.5 bg-primary-600 rounded-lg">
                <Shield size={18} className="text-white" />
              </div>
              <span className="font-bold text-gray-900">
                Land<span className="text-primary-600">Chain</span>
              </span>
            </Link>
          )}
        </div>

        {/* Nav */}
        <nav className="flex-1 px-2 py-4 space-y-1 overflow-y-auto">
          {menu.map((item) => {
            const Icon = item.icon;
            const active = pathname === item.href.split('#')[0];
            return (
              <Link
                key={item.href}
                href={item.href}
                title={collapsed ? item.label : undefined}
                className={cn(
                  'flex items-center gap-3 px-3 py-2.5 rounded-lg text-sm font-medium transition-colors',
                  active
                    ? 'bg-primary-50 text-primary-700'
                    : 'text-gray-600 hover:bg-gray-50 hover:text-gray-900'
                )}
              >
                <Icon size={18} className="shrink-0" />
                {!collapsed && <span>{item.label}</span>}
              </Link>
            );
          })}
        </nav>

        {/* User info + logout */}
        <div className="border-t border-gray-100 p-3 space-y-1">
          {!collapsed && user && (
            <div className="px-3 py-2 rounded-lg bg-gray-50">
              <p className="text-xs font-medium text-gray-900 truncate">{user.name}</p>
              <p className="text-xs text-gray-500 capitalize">{user.role}</p>
            </div>
          )}
          <button
            onClick={logout}
            title={collapsed ? 'Sign Out' : undefined}
            className={cn(
              'w-full flex items-center gap-3 px-3 py-2.5 rounded-lg text-sm font-medium text-red-600 hover:bg-red-50 transition-colors',
              collapsed && 'justify-center'
            )}
          >
            <LogOut size={18} className="shrink-0" />
            {!collapsed && 'Sign Out'}
          </button>
        </div>

        {/* Collapse button */}
        <button
          onClick={() => setCollapsed(!collapsed)}
          className="absolute -right-3 top-20 bg-white border border-gray-200 rounded-full p-1 shadow-sm hover:bg-gray-50 transition-colors z-10 self-end m-2"
        >
          {collapsed ? <ChevronRight size={14} /> : <ChevronLeft size={14} />}
        </button>
      </aside>

      {/* Main content */}
      <main className="flex-1 overflow-auto">
        <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-8">
          {children}
        </div>
      </main>
    </div>
  );
}
