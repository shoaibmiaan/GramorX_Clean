import { useRouter } from 'next/router';
import { Button, Card } from '@/components/design-system';
import { useState } from 'react';
import { useToast } from '@/components/design-system/Toaster';

export default function ConfirmOrder() {
  const router = useRouter();
  const { plan } = router.query;
  const [loading, setLoading] = useState(false);
  const { toast } = useToast();

  const handleConfirm = async () => {
    setLoading(true);
    try {
      const res = await fetch('/api/payment/create-intent', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ plan }),
      });

      if (!res.ok) {
        const payload = await res.json().catch(() => ({}));
        toast({
          title: 'Payment setup failed',
          description: payload?.error || res.statusText,
          intent: 'error',
        });
        return;
      }

      const { checkoutUrl } = await res.json();
      if (checkoutUrl) {
        router.push(checkoutUrl);
      } else {
        toast({
          title: 'Missing checkout link',
          description: 'Please try again in a moment.',
          intent: 'warning',
        });
      }
    } catch (err: any) {
      toast({
        title: 'Unexpected error',
        description: err?.message || 'Could not start checkout.',
        intent: 'error',
      });
    } finally {
      setLoading(false);
    }
  };

  return (
    <div className="container py-10">
      <Card className="p-8 max-w-lg mx-auto text-center">
        <h1 className="text-2xl font-bold mb-4">Confirm Your Order</h1>
        <p className="mb-2">Plan: <strong>{plan}</strong></p>
        <p className="mb-2">Price: <strong>$19.99 / month</strong></p>
        <p className="text-sm text-gray-400 mb-6">
          You will be redirected to Safepay to complete payment securely.
        </p>
        <Button onClick={handleConfirm} disabled={loading}>
          {loading ? 'Processing...' : 'Confirm & Pay'}
        </Button>
      </Card>
    </div>
  );
}
