// pages/mock/writing/result.tsx
import type { GetServerSideProps, NextPage } from 'next';
import { getServerClient } from '@/lib/supabaseServer';
import type { Database } from '@/lib/database.types';

type PageProps = Record<string, never>;

const WritingLatestResultRedirect: NextPage<PageProps> = () => null;

export const getServerSideProps: GetServerSideProps<PageProps> = async (ctx) => {
  const supabase = getServerClient(ctx);

  const {
    data: { user },
  } = await supabase.auth.getUser();

  if (!user) {
    return {
      redirect: {
        destination: `/login?next=/mock/writing/result`,
        permanent: false,
      },
    };
  }

  type AttemptsWritingRow =
    Database['public']['Tables']['attempts_writing']['Row'];

  const { data: attempts, error } = await supabase
    .from('attempts_writing')
    .select('id, created_at, user_id')
    .eq('user_id', user.id)
    .order('created_at', { ascending: false })
    .limit(1);

  if (error) {
    console.error('[mock/writing/result] attempts error', error);
  }

  const latest = (attempts as AttemptsWritingRow[] | null)?.[0];

  if (!latest) {
    return {
      redirect: {
        destination: '/mock/writing/history',
        permanent: false,
      },
    };
  }

  return {
    redirect: {
      destination: `/mock/writing/result/${latest.id}`,
      permanent: false,
    },
  };
};

export default WritingLatestResultRedirect;
