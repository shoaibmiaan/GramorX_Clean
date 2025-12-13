import { useState } from 'react';
import { useRouter } from 'next/router';
import type { GetServerSideProps } from 'next';

import { Alert } from '@/components/design-system/Alert';
import { Button } from '@/components/design-system/Button';
import { Card } from '@/components/design-system/Card';
import { Container } from '@/components/design-system/Container';
import { Input } from '@/components/design-system/Input';
import AuthLayout from '@/components/layouts/AuthLayout';
import { supabaseBrowser } from '@/lib/supabaseBrowser';
import { redirectByRole } from '@/lib/routeAccess';
import { getServerClient } from '@/lib/supabaseServer';

export const getServerSideProps: GetServerSideProps = async ({ req, res }) => {
  const supabase = getServerClient(req, res);
  const {
    data: { user },
  } = await supabase.auth.getUser();

  if (!user) {
    return {
      redirect: {
        destination: '/auth/login?next=/account/security/mfa',
        permanent: false,
      },
    };
  }

  return { props: {} };
};

export default function MfaPage() {
  const [code, setCode] = useState('');
  const [error, setError] = useState<string | null>(null);
  const [loading, setLoading] = useState(false);
  const router = useRouter();
  const supabase = supabaseBrowser();

  const submit = async (e: React.FormEvent) => {
    e.preventDefault();
    setLoading(true);
    setError(null);
    try {
      if (!/^\d{6}$/.test(code)) {
        throw new Error('Please enter a valid 6-digit code.');
      }
      const { data, error } = await supabase.auth.verifyOtp({ type: 'totp', token: code });
      if (error) throw error;
      redirectByRole(data.user ?? null);
      router.replace('/account/security').catch(() => {});
    } catch (err: unknown) {
      console.error('MFA verification error:', err);
      const message = err instanceof Error ? err.message : 'Failed to verify code. Please try again.';
      setError(message);
    } finally {
      setLoading(false);
    }
  };

  return (
    <AuthLayout title="Two-factor authentication" subtitle="Enter the 6-digit code from your authenticator app." showRightOnMobile>
      <Container className="mt-4 max-w-xl">
        <Card className="p-6">
          <form onSubmit={submit} className="space-y-4">
            <Input
              value={code}
              onChange={(e) => setCode(e.target.value.replace(/\s+/g, ''))}
              placeholder="123456"
              inputMode="numeric"
              pattern="[0-9]{6}"
              required
              maxLength={6}
            />
            <Button type="submit" disabled={loading} loading={loading} className="w-full">
              {loading ? 'Verifying…' : 'Verify'}
            </Button>
          </form>
          {error && (
            <Alert variant="warning" title="Verification error" className="mt-4">
              {error}
            </Alert>
          )}
        </Card>
      </Container>
    </AuthLayout>
  );
}
