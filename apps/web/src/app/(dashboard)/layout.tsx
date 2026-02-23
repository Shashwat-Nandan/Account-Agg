'use client';

import { useEffect, useState } from 'react';
import Link from 'next/link';
import { usePathname, useRouter } from 'next/navigation';
import { useAuthStore } from '@/lib/store/auth-store';
import { cn } from '@/lib/utils';
import {
  LayoutDashboard,
  Wallet,
  FileCheck,
  Database,
  Shield,
  UserCheck,
  Share2,
  LogOut,
  Menu,
  X,
} from 'lucide-react';

const navItems = [
  { href: '/dashboard', label: 'Dashboard', icon: LayoutDashboard },
  { href: '/accounts', label: 'Accounts', icon: Wallet },
  { href: '/consents', label: 'Consents', icon: FileCheck },
  { href: '/data', label: 'Financial Data', icon: Database },
  { href: '/proofs', label: 'ZK Proofs', icon: Shield },
  { href: '/kyc', label: 'KYC', icon: UserCheck },
  { href: '/share', label: 'Share', icon: Share2 },
];

export default function DashboardLayout({
  children,
}: {
  children: React.ReactNode;
}) {
  const pathname = usePathname();
  const router = useRouter();
  const { user, logout } = useAuthStore();
  const [sidebarOpen, setSidebarOpen] = useState(false);

  useEffect(() => {
    if (!user) {
      router.push('/login');
    }
  }, [user, router]);

  if (!user) return null;

  const handleLogout = () => {
    logout();
    router.push('/login');
  };

  return (
    <div className="min-h-screen bg-gray-50 flex">
      {/* Mobile overlay */}
      {sidebarOpen && (
        <div
          className="fixed inset-0 bg-black/50 z-40 lg:hidden"
          onClick={() => setSidebarOpen(false)}
        />
      )}

      {/* Sidebar */}
      <aside
        className={cn(
          'fixed lg:static inset-y-0 left-0 z-50 w-64 bg-white border-r border-gray-200 flex flex-col transition-transform lg:translate-x-0',
          sidebarOpen ? 'translate-x-0' : '-translate-x-full',
        )}
      >
        <div className="h-16 flex items-center px-6 border-b border-gray-200">
          <div className="w-8 h-8 bg-primary-700 rounded-lg flex items-center justify-center mr-3">
            <Shield className="w-4 h-4 text-white" />
          </div>
          <span className="font-bold text-gray-900">Account Agg</span>
          <button
            onClick={() => setSidebarOpen(false)}
            className="ml-auto lg:hidden text-gray-500"
          >
            <X className="w-5 h-5" />
          </button>
        </div>

        <nav className="flex-1 py-4 px-3 space-y-1">
          {navItems.map((item) => {
            const isActive = pathname === item.href;
            return (
              <Link
                key={item.href}
                href={item.href}
                onClick={() => setSidebarOpen(false)}
                className={cn(
                  'flex items-center gap-3 px-3 py-2.5 rounded-lg text-sm font-medium transition-colors',
                  isActive
                    ? 'bg-primary-50 text-primary-700'
                    : 'text-gray-600 hover:bg-gray-100 hover:text-gray-900',
                )}
              >
                <item.icon className="w-5 h-5" />
                {item.label}
              </Link>
            );
          })}
        </nav>

        <div className="p-3 border-t border-gray-200">
          <div className="px-3 py-2 text-xs text-gray-500 truncate">
            {user.phone}
          </div>
          <button
            onClick={handleLogout}
            className="flex items-center gap-3 px-3 py-2.5 rounded-lg text-sm font-medium text-gray-600 hover:bg-gray-100 hover:text-gray-900 w-full transition-colors"
          >
            <LogOut className="w-5 h-5" />
            Logout
          </button>
        </div>
      </aside>

      {/* Main content */}
      <div className="flex-1 flex flex-col min-w-0">
        <header className="h-16 bg-white border-b border-gray-200 flex items-center px-4 lg:px-8">
          <button
            onClick={() => setSidebarOpen(true)}
            className="lg:hidden mr-4 text-gray-500"
          >
            <Menu className="w-5 h-5" />
          </button>
          <h2 className="text-lg font-semibold text-gray-900">
            {navItems.find((i) => i.href === pathname)?.label || 'Dashboard'}
          </h2>
          <div className="ml-auto flex items-center gap-2">
            <span className={cn(
              'text-xs px-2 py-1 rounded-full font-medium',
              user.kycStatus === 'VERIFIED'
                ? 'bg-accent-100 text-accent-700'
                : 'bg-yellow-100 text-yellow-700',
            )}>
              KYC: {user.kycStatus}
            </span>
          </div>
        </header>

        <main className="flex-1 p-4 lg:p-8 overflow-auto">{children}</main>
      </div>
    </div>
  );
}
