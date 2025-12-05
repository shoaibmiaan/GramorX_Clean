// lib/reco/account/profile.ts

import type { SupabaseClient } from '@supabase/supabase-js';
import type { Database } from '@/lib/database.types';

type Db = Database;

/**
 * Minimal helper used by reco flows.
 * Safe + generic so build doesn't break.
 */
export async function getRecoProfile(
  supabase: SupabaseClient<Db>,
  userId: string,
) {
  const { data, error } = await supabase
    .from('profiles')
    .select('*')
    .eq('id', userId)
    .single();

  if (error) {
    console.error('[reco] getRecoProfile error', error);
    return null;
  }

  return data;
}
