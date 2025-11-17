// pages/mock/writing/run.tsx

import React, { useState, useMemo, useEffect, useCallback } from 'react';
import type { GetServerSideProps, NextPage } from 'next';
import Head from 'next/head';
import { useRouter } from 'next/router';

import { getServerClient } from '@/lib/supabaseServer';
import { Container } from '@/components/design-system/Container';
import { Card } from '@/components/design-system/Card';
import { Button } from '@/components/design-system/Button';

type Prompt = {
  id: string;
  topic: string;
  prompt_text: string;
  task_type: 'task1' | 'task2';
};

type Props = {
  slug: string;
  task1: Prompt;
  task2: Prompt;
};

const WritingRunPage: NextPage<Props> = ({ slug, task1, task2 }) => {
  const router = useRouter();

  const [started, setStarted] = useState(false);
  const [locked, setLocked] = useState(false);

  const [timeLeft, setTimeLeft] = useState(60 * 60); // 60 minutes fixed IELTS rule
  const [activeTask, setActiveTask] = useState<'task1' | 'task2'>('task1');

  const [task1Text, setTask1Text] = useState('');
  const [task2Text, setTask2Text] = useState('');

  const activePrompt = activeTask === 'task1' ? task1 : task2;

  // Word counters
  const words1 = useMemo(() => countWords(task1Text), [task1Text]);
  const words2 = useMemo(() => countWords(task2Text), [task2Text]);

  const handleSubmit = useCallback(
    async (auto = false) => {
      await fetch('/api/mock/writing/submit', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          slug,
          task1Id: task1.id,
          task2Id: task2.id,
          task1Text,
          task2Text,
          timeUsedSeconds: 3600 - timeLeft,
          auto,
        }),
      });

      router.push('/mock/writing/submitted');
    },
    [slug, task1.id, task2.id, task1Text, task2Text, timeLeft, router]
  );

  useEffect(() => {
    if (!started || locked) return;

    const interval = setInterval(() => {
      setTimeLeft((prev) => {
        if (prev <= 1) {
          clearInterval(interval);
          setLocked(true);
          void handleSubmit(true);
          return 0;
        }
        return prev - 1;
      });
    }, 1000);

    return () => clearInterval(interval);
  }, [started, locked, handleSubmit]);

  return (
    <>
      <Head>
        <title>{slug} • Writing Test</title>
      </Head>

      <main className="flex min-h-screen flex-col bg-background">
        <header className="flex justify-between border-b p-4">
          <div>
            <h2 className="text-h5 font-semibold">Writing Test — {slug}</h2>
            <p className="text-xs text-muted">IELTS Computer Based</p>
          </div>

          <div className="flex items-center gap-4">
            <div className="font-mono text-lg">{formatTime(timeLeft)}</div>
            <div className="text-sm">
              T1: {words1} / 150 • T2: {words2} / 250
            </div>
          </div>
        </header>

        {!started ? (
          <div className="flex flex-1 items-center justify-center">
            <Card className="max-w-lg p-6">
              <h1 className="mb-4 text-h4">Instructions</h1>
              <ul className="ml-4 list-disc space-y-1 text-sm text-muted">
                <li>You must complete Task 1 and Task 2.</li>
                <li>60 minutes total.</li>
                <li>Task 2 carries double weight.</li>
                <li>Word limits: 150 (T1), 250 (T2).</li>
                <li>Plain text editor only, no formatting.</li>
              </ul>

              <Button
                tone="primary"
                className="mt-5 w-full"
                onClick={() => setStarted(true)}
              >
                Start Test
              </Button>
            </Card>
          </div>
        ) : (
          <Container className="flex-1 py-6">
            <div className="flex gap-4">
              <Button
                tone={activeTask === 'task1' ? 'primary' : 'neutral'}
                onClick={() => setActiveTask('task1')}
              >
                Task 1
              </Button>
              <Button
                tone={activeTask === 'task2' ? 'primary' : 'neutral'}
                onClick={() => setActiveTask('task2')}
              >
                Task 2
              </Button>
            </div>

            <div className="mt-4 grid grid-cols-1 gap-4 md:grid-cols-2">
              <Card className="p-4">
                <h3 className="mb-2 font-semibold">{activePrompt.topic}</h3>
                <p className="whitespace-pre-line text-sm">
                  {activePrompt.prompt_text}
                </p>
              </Card>

              <Card className="flex flex-col p-4">
                <textarea
                  disabled={locked}
                  className="flex-1 resize-none border bg-surface p-3 text-sm outline-none"
                  value={activeTask === 'task1' ? task1Text : task2Text}
                  onChange={(e) =>
                    activeTask === 'task1'
                      ? setTask1Text(e.target.value)
                      : setTask2Text(e.target.value)
                  }
                />
              </Card>
            </div>

            <Button
              tone="primary"
              className="mt-6"
              disabled={locked}
              onClick={() => handleSubmit(false)}
            >
              Submit Test
            </Button>
          </Container>
        )}

        {/* Minimal inline footer, no external FooterMini import */}
        <footer className="mt-auto border-t bg-muted/40">
          <Container className="flex items-center justify-between py-3 text-[11px] text-muted-foreground">
            <span>GramorX • IELTS Writing Mock</span>
            <span>Don’t refresh during the test.</span>
          </Container>
        </footer>
      </main>
    </>
  );
};

export default WritingRunPage;

function countWords(text: string) {
  return text.trim().split(/\s+/).filter(Boolean).length;
}

function formatTime(sec: number) {
  const m = Math.floor(sec / 60)
    .toString()
    .padStart(2, '0');
  const s = (sec % 60).toString().padStart(2, '0');
  return `${m}:${s}`;
}

export const getServerSideProps: GetServerSideProps<Props> = async (ctx) => {
  const supabase = getServerClient(ctx.req, ctx.res);

  const {
    data: { user },
  } = await supabase.auth.getUser();
  if (!user) {
    return { redirect: { destination: '/auth/sign-in', permanent: false } };
  }

  const slug = ctx.query.slug;
  if (typeof slug !== 'string') return { notFound: true };

  const { data, error } = await supabase
    .from('writing_prompts')
    .select('id, topic, prompt_text, task_type')
    .eq('slug', slug)
    .neq('prompt_text', null);

  if (error || !data || data.length < 2) return { notFound: true };

  const task1 = data.find((p) => p.task_type === 'task1') as Prompt | undefined;
  const task2 = data.find((p) => p.task_type === 'task2') as Prompt | undefined;

  if (!task1 || !task2) return { notFound: true };

  return { props: { slug, task1, task2 } };
};
