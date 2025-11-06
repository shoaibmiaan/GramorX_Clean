// pages/ai/study-buddy/session/[id]/summary.tsx
import type { GetServerSideProps, NextPage } from 'next';
import Head from 'next/head';
import Link from 'next/link';

import { getServerClient } from '@/lib/supabaseServer';

import { Button } from '@/components/design-system/Button';
import { Card } from '@/components/design-system/Card';
import { Container } from '@/components/design-system/Container';
import { Badge } from '@/components/design-system/Badge';
import { ProgressBar } from '@/components/design-system/ProgressBar';

import type { StudySession } from '@/pages/ai/study-buddy';

import { GradientText } from '@/components/design-system/GradientText';

function normaliseSession(session: any | null): StudySession | null {
  if (!session) return null;
  const items = Array.isArray(session.items)
    ? session.items.map((item: any) => ({
        skill: item.skill,
        minutes: Number(item.minutes || 0),
        topic: item.topic ?? null,
        status: item.status ?? 'pending',
      }))
    : [];
  return {
    id: session.id,
    user_id: session.user_id,
    items,
    state: session.state,
    created_at: session.created_at,
    updated_at: session.updated_at ?? null,
    started_at: session.started_at ?? null,
    ended_at: session.ended_at ?? null,
    duration_minutes: session.duration_minutes ?? null,
    xp_earned: session.xp_earned ?? 0,
  };
}

type Props = { session: StudySession | null };

export const getServerSideProps: GetServerSideProps<Props> = async (ctx) => {
  const id = String(ctx.query.id || '');
  if (!id) return { notFound: true };

  const supabase = getServerClient(ctx.req, ctx.res);
  const {
    data: { user },
    error: userErr,
  } = await supabase.auth.getUser();

  if (userErr) throw userErr;
  if (!user) {
    return {
      redirect: {
        destination: `/login?next=${encodeURIComponent(ctx.resolvedUrl ?? `/ai/study-buddy/session/${id}/summary`)}`,
        permanent: false,
      },
    };
  }

  const { data, error } = await supabase
    .from('study_buddy_sessions')
    .select('*')
    .eq('id', id)
    .eq('user_id', user.id)
    .maybeSingle();

  if (error) {
    console.error('[study-buddy/summary] load error', error);
    return { notFound: true };
  }

  return { props: { session: normaliseSession(data) } };
};

const SummaryPage: NextPage<Props> = ({ session }) => {
  if (!session) {
    return (
      <Container className="py-20">
        <Card className="p-10 text-center">
          <h1 className="text-2xl font-semibold">Session not found</h1>
          <p className="mt-2 text-muted-foreground">Create a new Study Buddy plan to see your post-session insights.</p>
          <Button className="mt-6" asChild>
            <Link href="/ai/study-buddy">Back to Study Buddy</Link>
          </Button>
        </Card>
      </Container>
    );
  }

  const duration =
    session.duration_minutes ?? session.items.reduce((sum, item) => sum + Number(item.minutes || 0), 0);
  const completedBlocks = session.items.filter((item) => item.status === 'completed').length;
  const completionRate = session.items.length
    ? Math.round((completedBlocks / session.items.length) * 100)
    : 0;
  const skillTotals = session.items.reduce<Record<string, number>>((acc, item) => {
    acc[item.skill] = (acc[item.skill] ?? 0) + Number(item.minutes || 0);
    return acc;
  }, {});

  const topSkill = Object.entries(skillTotals).sort((a, b) => b[1] - a[1])[0]?.[0];

  return (
    <>
      <Head>
        <title>Session summary — Study Buddy</title>
      </Head>
      <Container className="py-10 space-y-8">
        <div className="flex flex-wrap items-center justify-between gap-4">
          <div>
            <Badge variant="success">Session logged</Badge>
            <h1 className="mt-3 text-3xl font-semibold">
              Great job! <GradientText className="font-semibold">Session recap</GradientText>
            </h1>
            <p className="text-sm text-muted-foreground">
              Completed on {new Date(session.ended_at ?? session.updated_at ?? session.created_at).toLocaleString()}
            </p>
          </div>
          <div className="flex gap-3">
            <Button variant="secondary" asChild>
              <Link href={`/ai/study-buddy/session/${session.id}/practice`}>Review session</Link>
            </Button>
            <Button asChild>
              <Link href="/ai/study-buddy">Start new session</Link>
            </Button>
          </div>
        </div>

        <div className="grid gap-6 md:grid-cols-3">
          <Card className="p-6">
            <p className="text-sm text-muted-foreground">Total focus time</p>
            <p className="mt-3 text-3xl font-semibold">{duration} min</p>
            <p className="mt-2 text-xs text-muted-foreground">Across {session.items.length} guided blocks.</p>
          </Card>
          <Card className="p-6">
            <p className="text-sm text-muted-foreground">XP earned</p>
            <p className="mt-3 text-3xl font-semibold">{session.xp_earned ?? 0} XP</p>
            <p className="mt-2 text-xs text-muted-foreground">Keep stacking XP to boost your weekly streak.</p>
          </Card>
          <Card className="p-6">
            <p className="text-sm text-muted-foreground">Completion rate</p>
            <p className="mt-3 text-3xl font-semibold">{completionRate}%</p>
            <p className="mt-2 text-xs text-muted-foreground">{completedBlocks} of {session.items.length} blocks completed.</p>
          </Card>
        </div>

        <Card className="p-6">
          <h2 className="text-lg font-semibold">Skill breakdown</h2>
          <p className="text-sm text-muted-foreground">Where your focus minutes landed this session.</p>
          <div className="mt-4 space-y-3">
            {Object.entries(skillTotals).map(([skill, minutes]) => (
              <div key={skill} className="flex items-center gap-3">
                <span className="w-28 text-sm font-medium text-foreground">{skill}</span>
                <ProgressBar value={Math.round((minutes / duration) * 100)} className="h-2 flex-1" />
                <span className="w-16 text-right text-sm font-medium text-foreground">{minutes}m</span>
              </div>
            ))}
          </div>
        </Card>

        <div className="grid gap-6 lg:grid-cols-2">
          <Card className="p-6">
            <h2 className="text-lg font-semibold">Highlights</h2>
            <ul className="mt-3 list-disc space-y-2 pl-5 text-sm text-muted-foreground">
              <li>You protected your streak with a {duration}-minute deep focus session.</li>
              {topSkill && <li>Your strongest coverage today was {topSkill}. Keep the momentum!</li>}
              <li>Log fresh insights in the Mistakes Book to reinforce progress.</li>
            </ul>
            <Button className="mt-4" variant="secondary" asChild>
              <Link href="/mistakes">Add to Mistakes Book</Link>
            </Button>
          </Card>

          <Card className="p-6">
            <h2 className="text-lg font-semibold">Next recommendation</h2>
            <p className="mt-2 text-sm text-muted-foreground">
              Rotate in a fresh speaking drill tomorrow to balance your skill mix. Aim for at least 20 minutes of speaking to stay on track.
            </p>
            <div className="mt-4 space-y-2 text-sm">
              <div className="flex justify-between">
                <span>Suggested duration</span>
                <span className="font-medium text-foreground">35 min</span>
              </div>
              <div className="flex justify-between">
                <span>Recommended skills</span>
                <span className="font-medium text-foreground">Speaking · Listening · Writing</span>
              </div>
            </div>
            <Button className="mt-6" asChild>
              <Link href="/ai/study-buddy">Build next session →</Link>
            </Button>
          </Card>
        </div>
      </Container>
    </>
  );
};

export default SummaryPage;
