// components/layouts/BillingLayout.tsx
import { ReactNode } from 'react';
import Link from 'next/link';
import { useRouter } from 'next/router';
import { Button } from '@/components/design-system/Button';

interface BillingLayoutProps {
  children: ReactNode;
  userRole?: string;
}

export function BillingLayout({ children, userRole }: BillingLayoutProps) {
  const router = useRouter();
  const currentPath = router.pathname;

  const isActive = (path: string) => currentPath.startsWith(path);

  const billingLinks = [
    { href: '/billing', label: 'Overview', icon: '📊' },
    { href: '/billing/invoices', label: 'Invoices', icon: '🧾' },
    { href: '/billing/payment-methods', label: 'Payment Methods', icon: '💳' },
    { href: '/subscription/manage', label: 'Subscription', icon: '🔄' },
  ];

  return (
    <div className="min-h-screen bg-background">
      <div className="max-w-6xl mx-auto">
        <div className="p-6 border-b">
          <div className="flex items-center justify-between">
            <div>
              <h1 className="text-2xl font-bold">Billing & Subscription</h1>
              <p className="text-muted-foreground">Manage your payments and subscription plans</p>
            </div>
            <Button variant="outline" asChild>
              <Link href="/pricing">Upgrade Plan</Link>
            </Button>
          </div>

          {/* Navigation tabs */}
          <nav className="flex space-x-1 mt-6">
            {billingLinks.map((link) => (
              <Button
                key={link.href}
                variant={isActive(link.href) ? 'secondary' : 'ghost'}
                size="sm"
                asChild
              >
                <Link href={link.href}>
                  <span className="flex items-center gap-2">
                    <span>{link.icon}</span>
                    {link.label}
                  </span>
                </Link>
              </Button>
            ))}
          </nav>
        </div>

        <div className="p-6">
          {children}
        </div>
      </div>
    </div>
  );
}