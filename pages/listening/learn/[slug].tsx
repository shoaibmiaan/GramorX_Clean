// pages/listening/learn/[slug].tsx
import * as React from 'react';
import type { GetServerSideProps, NextPage } from 'next';
import Head from 'next/head';
import Link from 'next/link';

import { getServerClient } from '@/lib/supabaseServer';
import { Container } from '@/components/design-system/Container';
import { Button } from '@/components/design-system/Button';
import Icon from '@/components/design-system/Icon';

import ListeningNavTabs from '@/components/listening/ListeningNavTabs';
import ListeningLessonLayout from '@/components/listening/Learning/ListeningLessonLayout';
import ListeningTipCallout from '@/components/listening/Learning/ListeningTipCallout';
import ListeningQuestionTypeCard from '@/components/listening/Learning/ListeningQuestionTypeCard';

type LessonLevel = 'beginner' | 'intermediate' | 'advanced';

type LessonDetail = {
  id: string;
  slug: string;
  title: string;
  level: LessonLevel;
  estimatedMinutes: number;
  lessonType: string;
  tags: string[];
  content: string;
};

type Props = {
  lesson: LessonDetail;
};

const ListeningLessonPage: NextPage<Props> = ({ lesson }) => {
  const isQuestionTypeLesson = lesson.tags.some((t) =>
    t.toLowerCase().includes('question-type'),
  );

  // super basic content split – later you can render markdown properly if you want
  const blocks = lesson.content.split(/\n{2,}/g).filter((b) => b.trim().length > 0);

  return (
    <>
      <Head>
        <title>{lesson.title} • Listening Lesson • GramorX</title>
        <meta
          name="description"
          content="Focused IELTS Listening lesson to fix a very specific weakness, not to waste your time."
        />
      </Head>

      <main className="min-h-screen bg-background py-8">
        <Container>
          <div className="mb-4 flex flex-wrap items-center justify-between gap-3">
            <Button asChild variant="outline" size="xs">
              <Link href="/listening/learn">
                <Icon name="ArrowLeft" size={12} />
                <span>Back to lessons</span>
              </Link>
            </Button>
            <ListeningNavTabs activeKey="learn" />
          </div>

          <ListeningLessonLayout
            title={lesson.title}
            level={lesson.level}
            estimatedMinutes={lesson.estimatedMinutes}
            tags={lesson.tags}
          >
            <div className="space-y-4">
              {/* Optional question-type context card */}
              {isQuestionTypeLesson && (
                <ListeningQuestionTypeCard
                  title="This lesson targets a specific IELTS Listening question type"
                  description="Don’t rush this. The point is to understand how this question type works, where traps usually sit, and how your brain misfires under speed."
                />
              )}

              {/* Main content paragraphs */}
              {blocks.map((block, idx) => (
                <p
                  key={idx}
                  className="text-sm leading-relaxed text-foreground sm:text-base"
                >
                  {block}
                </p>
              ))}

              {/* Closing actionable tip */}
              <ListeningTipCallout
                title="Lock it in with action, not theory"
                body="Right after this lesson, do a short practice set focused only on this question type. Then come back and adjust your notes if the test exposed new weak spots."
              />
            </div>
          </ListeningLessonLayout>
        </Container>
      </main>
    </>
  );
};

export const getServerSideProps: GetServerSideProps<Props> = async (ctx) => {
  const slug = ctx.query.slug as string | undefined;
  if (!slug) {
    return { notFound: true };
  }

  const supabase = getServerClient(ctx.req, ctx.res);

  const {
    data: { user },
    error: userError,
  } = await supabase.auth.getUser();

  if (userError) {
    return { props: null as never };
  }

  if (!user) {
    return {
      redirect: {
        destination: `/login?next=${encodeURIComponent(`/listening/learn/${slug}`)}`,
        permanent: false,
      },
    };
  }

  const { data: row, error } = await supabase
    .from('listening_lessons')
    .select(
      'id, slug, title, level, estimated_minutes, lesson_type, tags, content, is_published',
    )
    .eq('slug', slug)
    .eq('is_published', true)
    .single<any>();

  if (error || !row) {
    return { notFound: true };
  }

  const lesson: LessonDetail = {
    id: row.id,
    slug: row.slug,
    title: row.title,
    level: (row.level ?? 'intermediate') as LessonLevel,
    estimatedMinutes: row.estimated_minutes ?? 10,
    lessonType: row.lesson_type ?? 'strategy',
    tags: Array.isArray(row.tags) ? row.tags : [],
    content: row.content ?? '',
  };

  return {
    props: {
      lesson,
    },
  };
};

export default ListeningLessonPage;
