import * as React from 'react';
import { useRouter } from 'next/router';
import Link from 'next/link';

type PlanId = 'free' | 'starter' | 'booster' | 'master';

const GATE_MODE = process.env.NEXT_PUBLIC_GATE_MODE || 'off';
const isWritingOnly = GATE_MODE === 'writing-only';

function isWritingRoute(pathname: string) {
  return (
    pathname === '/' ||
    pathname.startsWith('/writing') ||
    pathname.startsWith('/mock/writing') ||
    pathname.startsWith('/api/mock/writing')
  );
}

function SoftGate() {
  return (
    <div className="mx-auto max-w-3xl p-6 text-center">
      <h1 className="text-2xl font-semibold">Coming Soon</h1>
      <p className="mt-2 opacity-80">
        This module is coming soon. Join the waitlist to get early, free access.
      </p>
      <div className="mt-6 flex items-center justify-center gap-3">
        <Link href="/waitlist" className="px-4 py-2 rounded-xl bg-primary text-white">Join Waitlist</Link>
        <Link href="/writing" className="px-4 py-2 rounded-xl border">Go to Writing</Link>
      </div>
    </div>
  );
}

type Props = {
  children: React.ReactNode;
  userPlan: PlanId;   // from SSR
  role?: string;      // from SSR
};

export default function GlobalPlanGuard({ children, userPlan, role }: Props) {
  const { pathname } = useRouter();
  const isAdminTeacher = role === 'admin' || role === 'teacher';

  // Admin/Teacher bypass everything.
  if (isAdminTeacher) return <>{children}</>;

  if (isWritingOnly) {
    // Only Writing is open; everything else shows soft gate.
    if (isWritingRoute(pathname)) return <>{children}</>;
    return <SoftGate />;
  }

  // Gate OFF – everything passes through.
  return <>{children}</>;
}
