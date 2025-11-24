// pages/admin/listening/question-bank.tsx
import * as React from 'react';
import type { GetServerSideProps, NextPage } from 'next';
import Head from 'next/head';
import Link from 'next/link';

import { getServerClient } from '@/lib/supabaseServer';
import { Container } from '@/components/design-system/Container';
import { Card } from '@/components/design-system/Card';
import { Button } from '@/components/design-system/Button';
import Icon from '@/components/design-system/Icon';

type AdminListeningQuestion = {
  id: string;
  testSlug: string;
  testTitle: string;
  sectionNumber: number;
  sectionTitle: string;
  questionNumber: number;
  type: string;
  prompt: string;
  maxScore: number;
};

type Props = {
  questions: AdminListeningQuestion[];
};

const AdminListeningQuestionBankPage: NextPage<Props> = ({ questions }) => {
  const [search, setSearch] = React.useState('');
  const [typeFilter, setTypeFilter] = React.useState<'all' | 'short_answer'>('all');

  const filtered = questions.filter((q) => {
    if (typeFilter !== 'all' && q.type !== typeFilter) return false;
    if (!search.trim()) return true;
    const s = search.toLowerCase();
    return (
      q.prompt.toLowerCase().includes(s) ||
      q.testSlug.toLowerCase().includes(s) ||
      q.testTitle.toLowerCase().includes(s)
    );
  });

  return (
    <>
      <Head>
        <title>Admin • Listening Question Bank • GramorX</title>
        <meta
          name="description"
          content="Admin question bank for IELTS Listening tests – inspect and audit questions."
        />
      </Head>

      <main className="min-h-screen bg-background py-8">
        <Container>
          <div className="mb-4 flex flex-wrap items-center justify-between gap-3">
            <div className="flex flex-wrap items-center gap-2">
              <Button asChild variant="outline" size="xs">
                <Link href="/admin/listening">
                  <Icon name="ArrowLeft" size={12} />
                  <span>Back to overview</span>
                </Link>
              </Button>
              <span className="inline-flex items-center gap-1 rounded-full bg-primary/10 px-2 py-0.5 text-[11px] font-medium text-primary">
                <Icon name="Database" size={12} />
                <span>Question bank</span>
              </span>
            </div>

            <div className="flex flex-wrap items-center gap-2">
              <input
                type="text"
                value={search}
                onChange={(e) => setSearch(e.target.value)}
                placeholder="Search by prompt or test…"
                className="w-40 rounded-md border border-border bg-background px-2 py-1 text-xs text-foreground outline-none focus-visible:ring-2 focus-visible:ring-primary sm:w-64 sm:text-sm"
              />
              <select
                value={typeFilter}
                onChange={(e) =>
                  setTypeFilter(e.target.value as 'all' | 'short_answer')
                }
                className="rounded-md border border-border bg-background px-2 py-1 text-xs text-foreground outline-none focus-visible:ring-2 focus-visible:ring-primary sm:text-sm"
              >
                <option value="all">All types</option>
                <option value="short_answer">Short answer only</option>
              </select>
            </div>
          </div>

          <section className="mb-4">
            <Card className="border-border bg-card/60 p-4">
              <p className="text-sm font-semibold text-foreground sm:text-base">
                IELTS Listening question bank
              </p>
              <p className="mt-1 text-xs text-muted-foreground sm:text-sm">
                Every question here must feel like a real IELTS item – same style, same traps, same
                marking behaviour. If it feels “off”, fix or delete it.
              </p>
            </Card>
          </section>

          <section>
            <Card className="border-border bg-card/60 p-0">
              <div className="border-b border-border px-4 py-3">
                <p className="text-xs text-muted-foreground sm:text-sm">
                  {filtered.length} question{filtered.length === 1 ? '' : 's'} shown
                </p>
              </div>

              <div className="overflow-x-auto">
                <table className="min-w-full text-left text-xs text-muted-foreground sm:text-sm">
                  <thead>
                    <tr className="border-b border-border bg-muted/40 text-[11px] uppercase tracking-wide">
                      <th className="px-4 py-2 font-medium">Test</th>
                      <th className="px-4 py-2 font-medium">Section</th>
                      <th className="px-4 py-2 font-medium">Q</th>
                      <th className="px-4 py-2 font-medium">Type</th>
                      <th className="px-4 py-2 font-medium">Prompt</th>
                      <th className="px-4 py-2 font-medium">Max</th>
                    </tr>
                  </thead>
                  <tbody>
                    {filtered.length === 0 ? (
                      <tr>
                        <td
                          className="px-4 py-3 text-xs text-muted-foreground sm:text-sm"
                          colSpan={6}
                        >
                          No questions match this filter.
                        </td>
                      </tr>
                    ) : (
                      filtered.map((q) => (
                        <tr
                          key={q.id}
                          className="border-b border-border/60 last:border-b-0"
                        >
                          <td className="px-4 py-2 align-middle text-xs text-foreground sm:text-sm">
                            {q.testTitle}{' '}
                            <span className="text-[11px] text-muted-foreground">
                              ({q.testSlug})
                            </span>
                          </td>
                          <td className="px-4 py-2 align-middle text-xs text-foreground sm:text-sm">
                            {q.sectionNumber} ·{' '}
                            <span className="text-[11px] text-muted-foreground">
                              {q.sectionTitle}
                            </span>
                          </td>
                          <td className="px-4 py-2 align-middle text-xs text-foreground sm:text-sm">
                            {q.questionNumber}
                          </td>
                          <td className="px-4 py-2 align-middle text-[11px] text-muted-foreground sm:text-xs">
                            {q.type}
                          </td>
                          <td className="px-4 py-2 align-middle text-xs text-foreground sm:text-sm">
                            {q.prompt}
                          </td>
                          <td className="px-4 py-2 align-middle text-xs text-foreground sm:text-sm">
                            {q.maxScore}
                          </td>
                        </tr>
                      ))
                    )}
                  </tbody>
                </table>
              </div>
            </Card>
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
  } = await supabase.auth.getUser();

  if (!user) {
    return {
      redirect: {
        destination: `/login?next=${encodeURIComponent('/admin/listening/question-bank')}`,
        permanent: false,
      },
    };
  }

  const { data: rows } = await supabase
    .from('listening_questions')
    .select(
      'id, question_number, type, prompt, max_score, listening_sections(section_number, title, listening_tests(title, slug))',
    )
    .order('section_number', { referencedTable: 'listening_sections', ascending: true })
    .order('question_number', { ascending: true });

  const questions: AdminListeningQuestion[] =
    rows?.map((row: any) => ({
      id: row.id,
      testSlug: row.listening_sections?.listening_tests?.slug ?? 'unknown',
      testTitle: row.listening_sections?.listening_tests?.title ?? 'Unknown test',
      sectionNumber: row.listening_sections?.section_number ?? 0,
      sectionTitle: row.listening_sections?.title ?? '',
      questionNumber: row.question_number ?? 0,
      type: row.type ?? 'short_answer',
      prompt: row.prompt ?? '',
      maxScore: row.max_score ?? 1,
    })) ?? [];

  return {
    props: {
      questions,
    },
  };
};

export default AdminListeningQuestionBankPage;
