import type { GetServerSidePropsContext } from 'next';

import { getServerClient } from '@/lib/supabaseServer';

export async function requireUserOrRedirect<Database = any>(
  ctx: GetServerSidePropsContext,
  nextPath?: string,
) {
  const supabase = getServerClient<Database>(ctx.req, ctx.res);
  const {
    data: { user },
    error,
  } = await supabase.auth.getUser();

  if (error || !user) {
    const destination = nextPath ?? ctx.resolvedUrl ?? '/';
    const loginUrl = `/login?next=${encodeURIComponent(destination)}`;

    return {
      redirect: {
        destination: loginUrl,
        permanent: false,
      },
    } as const;
  }

  return { supabase, user } as const;
}
