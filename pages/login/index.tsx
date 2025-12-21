// pages/login/index.tsx
'use client';

import AuthOptions from '@/components/auth/AuthOptions';
import AuthLayout from '@/components/layouts/AuthLayout';

export default function LoginOptions() {
  return (
    <AuthLayout
      title="Welcome back"
      subtitle="Sign in to continue your IELTS journey."
    >
      <AuthOptions mode="login" />
    </AuthLayout>
  );
}
