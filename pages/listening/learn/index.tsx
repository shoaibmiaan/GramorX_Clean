// pages/listening/learn/index.tsx
import * as React from 'react';
import type { GetServerSideProps, NextPage } from 'next';
import Head from 'next/head';
import Link from 'next/link';

import { getServerClient } from '@/lib/supabaseServer';
import { Container } from '@/components/design-system/Container';
import { Card } from '@/components/design-system/Card';
import { Button } from '@/components/design-system/Button';
import Icon from '@/components/design-system/Icon';

import ListeningModuleHero from '@/components/listening/ListeningModuleHero';
import ListeningNavTabs from '@/components/listening/ListeningNavTabs';
import ListeningInfoBanner from '@/components/listening/ListeningInfoBanner';
import ListeningLessonCard from '@/components/listening/Learning/ListeningLessonCard';

type LessonLevel = 'beginner' | 'intermediate' | 'advanced';

type LessonSummary = {
  id: string;
  slug: string;
  title: string;
  level: LessonLevel;
  estimatedMinutes: number;
  lessonType: string;
  isPopular: boolean;
};

type Props = {
  lessons: LessonSummary[];
  totalLessons: number;
  recommendedSlug: string | null;
};

const ListeningLearnIndexPage: NextPage<Props> = ({
  lessons,
  totalLessons,
  recommendedSlug,
}) => {
  const recommendedLesson = lessons.find((l) => l.slug === recommendedSlug) ?? lessons[0];

  return (
    <>
      <Head>
        <title>Listening Lessons • GramorX</title>
        <meta
          name="description"
          content="Structured IELTS Listening lessons to fix question-type weaknesses before you waste mocks."
        />
      </Head>

      <main className="min-h-screen bg-background py-8">
        <Container>
          <ListeningModuleHero
            chipLabel="Listening module"
            title="Listening lessons"
            subtitle="Short, focused lessons to fix question types, strategies, and habits that quietly kill your IELTS Listening band."
            metaLabel="How to use this"
            metaDescription="Don’t just binge tests. Use these lessons to plug your leaks, then re-test."
          />

          <ListeningNavTabs activeKey="learn" />

          <section className="mb-6">
            <ListeningInfoBanner
              variant="info"
              title="Start with your weakest question type"
              body="If you already know that MCQs or maps destroy you, start with those lessons. If you don’t know your weak type yet, do one practice test first, then come back here with data."
            />
          </section>

          {/* Recommended lesson quick-start */}
          {recommendedLesson && (
            <section className="mb-6">
              <Card className="flex flex-col items-start justify-between gap-3 border-border bg-card/60 p-4 sm:flex-row sm:items-center sm:p-5">
                <div className="flex items-start gap-3">
                  <div className="mt-0.5 flex h-9 w-9 items-center justify-center rounded-full bg-primary/10">
                    <Icon name="Sparkles" size={16} className="text-primary" />
                  </div>
                  <div>
                    <p className="text-[11px] font-medium uppercase tracking-wide text-muted-foreground">
                      Recommended starting point
                    </p>
                    <p className="mt-1 text-sm font-semibold text-foreground sm:text-base">
                      {recommendedLesson.title}
                    </p>
                    <p className="mt-1 text-[11px] text-muted-foreground sm:text-xs">
                      {recommendedLesson.estimatedMinutes} min · {recommendedLesson.level}{' '}
                      · {recommendedLesson.lessonType}
                    </p>
                  </div>
                </div>
                <Button asChild size="sm">
                  <Link href={`/listening/learn/${encodeURIComponent(recommendedLesson.slug)}`}>
                    <Icon name="Play" size={14} />
                    <span>Start this lesson</span>
                  </Link>
                </Button>
              </Card>
            </section>
          )}

          {/* All lessons */}
          <section className="space-y-3">
            <div className="flex items-center justify-between gap-2">
              <h2 className="text-sm font-semibold text-foreground sm:text-base">
                All listening lessons
              </h2>
              <p className="text-[11px] text-muted-foreground sm:text-xs">
                {totalLessons} lesson{totalLessons !== 1 ? 's' : ''} · more coming with your data.
              </p>
            </div>

            {lessons.length === 0 ? (
              <Card className="border-border bg-card/60 p-4 text-xs text-muted-foreground sm:text-sm">
                No listening lessons configured yet. Once lessons are added in the admin panel,
                they&apos;ll show up here.
              </Card>
            ) : (
              <div className="grid gap-3 md:grid-cols-2 lg:grid-cols-3">
                {lessons.map((lesson) => (
                  <ListeningLessonCard
                    key={lesson.id}
                    slug={lesson.slug}
                    title={lesson.title}
                    level={lesson.level}
                    estimatedMinutes={lesson.estimatedMinutes}
                    lessonType={lesson.lessonType}
                    isPopular={lesson.isPopular}
                  />
                ))}
              </div>
            )}
          </section>
        </Container>
      </main>
    </>
  );
};

export const getServerSideProps: GetServerSideProps<Props> = async (ctx) => {
  const supabase = getServerClient(ctx.req, ctx.res);

  const {
    data: { user },
    error: userError,
  } = await supabase.auth.getUser();

  if (userError) {
    // Hard fail = just send empty state
    return {
      props: {
        lessons: [],
        totalLessons: 0,
        recommendedSlug: null,
      },
    };
  }

  if (!user) {
    return {
      redirect: {
        destination: `/login?next=${encodeURIComponent('/listening/learn')}`,
        permanent: false,
      },
    };
  }

  const { data: rows, error } = await supabase
    .from('listening_lessons')
    .select(
      'id, slug, title, level, estimated_minutes, lesson_type, is_published, is_popular, order_index',
    )
    .eq('is_published', true)
    .order('order_index', { ascending: true });

  if (error || !rows) {
    return {
      props: {
        lessons: [],
        totalLessons: 0,
        recommendedSlug: null,
      },
    };
  }

  const lessons: LessonSummary[] = rows.map((row: any) => ({
    id: row.id,
    slug: row.slug,
    title: row.title,
    level: (row.level ?? 'intermediate') as LessonLevel,
    estimatedMinutes: row.estimated_minutes ?? 10,
    lessonType: row.lesson_type ?? 'strategy',
    isPopular: !!row.is_popular,
  }));

  const recommended = lessons[0]?.slug ?? null;

  return {
    props: {
      lessons,
      totalLessons: lessons.length,
      recommendedSlug: recommended,
    },
  };
};

export default ListeningLearnIndexPage;
