import type { NextApiRequest, NextApiResponse } from 'next';

import { getServerClient } from '@/lib/supabaseServer';
import type { Database } from '@/types/supabase';

type Stats = {
  totalActivities: number;
  recentActivities: number;
  pendingTasks: number;
  completedTasks: number;
};

type SuccessResponse = {
  ok: true;
  email: string | null;
  roleFlags: { isAdmin: boolean; isTeacher: boolean };
  stats: Stats;
};

type ErrorResponse = { ok: false; error: string };

type ResponseBody = SuccessResponse | ErrorResponse;

const RECENT_DAYS = 7;

export default async function handler(req: NextApiRequest, res: NextApiResponse<ResponseBody>) {
  if (req.method !== 'GET') {
    res.setHeader('Allow', 'GET');
    return res.status(405).json({ ok: false, error: 'Method not allowed' });
  }

  try {
    const supabase = getServerClient<Database>(req, res);
    const {
      data: { user },
      error: userError,
    } = await supabase.auth.getUser();

    if (userError) {
      throw userError;
    }

    if (!user) {
      return res.status(401).json({ ok: false, error: 'Unauthorized' });
    }

    const weekAgo = new Date();
    weekAgo.setDate(weekAgo.getDate() - RECENT_DAYS);

    const [{ data: profileData, error: profileError }, activityCount, recentCount, pendingTasks, completedTasks] =
      await Promise.all([
        supabase
          .from('profiles')
          .select('role, teacher_approved, email')
          .eq('id', user.id)
          .single(),
        supabase.from('user_activities').select('*', { count: 'exact', head: true }).eq('user_id', user.id),
        supabase
          .from('user_activities')
          .select('*', { count: 'exact', head: true })
          .eq('user_id', user.id)
          .gte('created_at', weekAgo.toISOString()),
        supabase
          .from('task_assignments')
          .select('*', { count: 'exact', head: true })
          .eq('assigned_to', user.id)
          .eq('status', 'pending'),
        supabase
          .from('task_assignments')
          .select('*', { count: 'exact', head: true })
          .eq('assigned_to', user.id)
          .eq('status', 'completed'),
      ]);

    if (profileError) throw profileError;

    const stats: Stats = {
      totalActivities: activityCount.count ?? 0,
      recentActivities: recentCount.count ?? 0,
      pendingTasks: pendingTasks.count ?? 0,
      completedTasks: completedTasks.count ?? 0,
    };

    return res.status(200).json({
      ok: true,
      email: profileData?.email ?? user.email ?? null,
      roleFlags: {
        isAdmin: profileData?.role === 'admin',
        isTeacher: profileData?.teacher_approved === true || profileData?.role === 'teacher',
      },
      stats,
    });
  } catch (error) {
    const message = error instanceof Error ? error.message : 'Unable to load account summary';
    return res.status(500).json({ ok: false, error: message });
  }
}
