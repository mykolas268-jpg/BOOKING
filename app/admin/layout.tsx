'use client';

import { useState } from 'react';
import { usePathname, useRouter } from 'next/navigation';
import Link from 'next/link';
import { createClient } from '@/lib/supabase/client';
import { cn } from '@/lib/utils';
import {
  LayoutDashboard,
  Calendar,
  Scissors,
  Clock,
  Star,
  Settings,
  QrCode,
  LogOut,
  Menu,
  X,
} from 'lucide-react';

const navItems = [
  { href: '/admin', label: 'Skydelis', icon: LayoutDashboard },
  { href: '/admin/bookings', label: 'Rezervacijos', icon: Calendar },
  { href: '/admin/services', label: 'Paslaugos', icon: Scissors },
  { href: '/admin/schedule', label: 'Tvarkaraštis', icon: Clock },
  { href: '/admin/reviews', label: 'Atsiliepimai', icon: Star },
  { href: '/admin/settings', label: 'Nustatymai', icon: Settings },
  { href: '/admin/qr', label: 'QR Kodas', icon: QrCode },
];

export default function AdminLayout({ children }: { children: React.ReactNode }) {
  const pathname = usePathname();
  const router = useRouter();
  const [sidebarOpen, setSidebarOpen] = useState(false);
  const supabase = createClient();

  if (pathname === '/admin/login') {
    return <>{children}</>;
  }

  async function handleLogout() {
    await supabase.auth.signOut();
    router.push('/admin/login');
  }

  const isActive = (href: string) =>
    href === '/admin' ? pathname === '/admin' : pathname.startsWith(href);

  return (
    <div className="min-h-screen bg-background">
      {/* Mobile top bar */}
      <div className="lg:hidden flex items-center justify-between border-b border-border px-4 py-3">
        <button onClick={() => setSidebarOpen(true)} className="p-1">
          <Menu className="h-5 w-5" />
        </button>
        <span className="text-sm font-medium">
          {process.env.NEXT_PUBLIC_BUSINESS_NAME || 'Administravimas'}
        </span>
        <div className="w-7" />
      </div>

      {/* Mobile sidebar overlay */}
      {sidebarOpen && (
        <div className="fixed inset-0 z-50 lg:hidden">
          <div className="fixed inset-0 bg-black/40" onClick={() => setSidebarOpen(false)} />
          <div className="fixed left-0 top-0 bottom-0 w-64 bg-card border-r border-border p-4 overflow-y-auto">
            <div className="flex items-center justify-between mb-6">
              <span className="text-sm font-semibold">
                {process.env.NEXT_PUBLIC_BUSINESS_NAME || 'Administravimas'}
              </span>
              <button onClick={() => setSidebarOpen(false)} className="p-1">
                <X className="h-4 w-4" />
              </button>
            </div>
            <nav className="space-y-1">
              {navItems.map((item) => (
                <Link
                  key={item.href}
                  href={item.href}
                  onClick={() => setSidebarOpen(false)}
                  className={cn(
                    'flex items-center gap-3 rounded-lg px-3 py-2.5 text-sm transition-colors',
                    isActive(item.href)
                      ? 'bg-secondary font-medium'
                      : 'text-muted-foreground hover:bg-secondary/50'
                  )}
                >
                  <item.icon className="h-4 w-4" />
                  {item.label}
                </Link>
              ))}
            </nav>
            <div className="mt-8 pt-4 border-t border-border">
              <button
                onClick={handleLogout}
                className="flex items-center gap-3 rounded-lg px-3 py-2.5 text-sm text-muted-foreground hover:bg-secondary/50 w-full transition-colors"
              >
                <LogOut className="h-4 w-4" />
                Atsijungti
              </button>
            </div>
          </div>
        </div>
      )}

      <div className="flex">
        {/* Desktop sidebar */}
        <aside className="hidden lg:flex lg:flex-col lg:w-60 lg:border-r lg:border-border lg:min-h-screen lg:fixed lg:top-0 lg:left-0 lg:bg-card">
          <div className="p-5 border-b border-border">
            <span className="text-sm font-semibold">
              {process.env.NEXT_PUBLIC_BUSINESS_NAME || 'Administravimas'}
            </span>
          </div>
          <nav className="flex-1 p-3 space-y-1">
            {navItems.map((item) => (
              <Link
                key={item.href}
                href={item.href}
                className={cn(
                  'flex items-center gap-3 rounded-lg px-3 py-2.5 text-sm transition-colors',
                  isActive(item.href)
                    ? 'bg-secondary font-medium'
                    : 'text-muted-foreground hover:bg-secondary/50'
                )}
              >
                <item.icon className="h-4 w-4" />
                {item.label}
              </Link>
            ))}
          </nav>
          <div className="p-3 border-t border-border">
            <button
              onClick={handleLogout}
              className="flex items-center gap-3 rounded-lg px-3 py-2.5 text-sm text-muted-foreground hover:bg-secondary/50 w-full transition-colors"
            >
              <LogOut className="h-4 w-4" />
              Atsijungti
            </button>
          </div>
        </aside>

        {/* Main content */}
        <main className="flex-1 lg:ml-60 p-4 lg:p-8 min-h-screen">{children}</main>
      </div>
    </div>
  );
}
