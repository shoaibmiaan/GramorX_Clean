// components/layouts/ProfileLayout.tsx
import { ReactNode } from 'react';

interface ProfileLayoutProps {
  children: ReactNode;
}

export function ProfileLayout({ children }: ProfileLayoutProps) {
  return (
    <div className="flex min-h-screen bg-background">
      <aside className="w-64 border-r bg-card">
        {/* Profile navigation */}
        <nav className="p-4 space-y-2">
          <div className="text-sm font-medium text-muted-foreground px-2">Profile</div>
          {/* Navigation items */}
        </nav>
      </aside>
      <main className="flex-1 p-6">
        {children}
      </main>
    </div>
  );
}

// components/layouts/CommunicationLayout.tsx
import { ReactNode } from 'react';

interface CommunicationLayoutProps {
  children: ReactNode;
}

export function CommunicationLayout({ children }: CommunicationLayoutProps) {
  return (
    <div className="flex h-screen bg-background">
      {/* Chat sidebar */}
      <div className="w-80 border-r bg-card">
        {/* Messages/chat list */}
      </div>
      {/* Main content */}
      <div className="flex-1 flex flex-col">
        {children}
      </div>
    </div>
  );
}

// components/layouts/BillingLayout.tsx
import { ReactNode } from 'react';

interface BillingLayoutProps {
  children: ReactNode;
}

export function BillingLayout({ children }: BillingLayoutProps) {
  return (
    <div className="min-h-screen bg-background">
      <div className="max-w-4xl mx-auto py-8 px-4">
        <div className="mb-8">
          <h1 className="text-2xl font-bold">Billing & Subscription</h1>
          <p className="text-muted-foreground">Manage your payments and subscription</p>
        </div>
        {children}
      </div>
    </div>
  );
}