// pages/admin/listening/tests.tsx
import * as React from 'react';
import type { GetServerSideProps, NextPage } from 'next';
import Head from 'next/head';
import Link from 'next/link';

import { getServerClient } from '@/lib/supabaseServer';
import { Container } from '@/components/design-system/Container';
import { Card } from '@/components/design-system/Card';
import { Button } from '@/components/design-system/Button';
import { Input } from '@/components/design-system/Input';
import { Alert } from '@/components/design-system/Alert';
import Icon from '@/components/design-system/Icon';

type AdminListeningTest = {
  id: string;
  slug: string;
  title: string;
  difficulty: string;
  isMock: boolean;
  totalQuestions: number;
  durationSeconds: number;
};

type Props = {
  tests: AdminListeningTest[];
};

const AdminListeningTestsPage: NextPage<Props> = ({ tests: initialTests }) => {
  const [tests, setTests] = React.useState<AdminListeningTest[]>(initialTests);
  const [filter, setFilter] = React.useState<'all' | 'practice' | 'mock'>('all');
  const [saving, setSaving] = React.useState(false);
  const [error, setError] = React.useState<string | null>(null);

  const filteredTests = tests.filter((t) => {
    if (filter === 'practice') return !t.isMock;
    if (filter === 'mock') return t.isMock;
    return true;
  });

  const handleToggleMock = async (test: AdminListeningTest) => {
    setSaving(true);
    setError(null);

    try {
      const res = await fetch('/api/admin/listening/tests/upsert', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        credentials: 'include',
        body: JSON.stringify({
          id: test.id,
          slug: test.slug,
          title: test.title,
          difficulty: test.difficulty,
          isMock: !test.isMock,
          totalQuestions: test.totalQuestions,
          durationSeconds: test.durationSeconds,
        }),
      });

      if (!res.ok) {
        throw new Error(`Failed to update test (${res.status})`);
      }

      setTests((prev) =>
        prev.map((t) =>
          t.id === test.id
            ? {
                ...t,
                isMock: !t.isMock,
              }
            : t,
        ),
      );
    } catch (err) {
      setError('Failed to update test. Please try again.');
    } finally {
      setSaving(false);
    }
  };

  const handleDelete = async (test: AdminListeningTest) => {
    if (!window.confirm(`Delete test "${test.title}"? This cannot be undone.`)) {
      return;
    }

    setSaving(true);
    setError(null);

    try {
      const res = await fetch('/api/admin/listening/tests/delete', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        credentials: 'include',
        body: JSON.stringify({ id: test.id }),
      });

      if (!res.ok) {
        throw new Error(`Failed to delete test (${res.status})`);
      }

      setTests((prev) => prev.filter((t) => t.id !== test.id));
    } catch (err) {
      setError('Failed to delete test. Please try again.');
    } finally {
      setSaving(false);
    }
  };

  return (
    <>
      <Head>
        <title>Admin • Listening Tests • GramorX</title>
        <meta
          name="description"
          content="Manage IELTS Listening tests used across practice and mock flows."
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
                <Icon name="Headphones" size={12} />
                <span>Listening tests</span>
              </span>
            </div>
          </div>

          <section className="mb-4">
            <Card className="border-border bg-card/60 p-4">
              <div className="flex flex-wrap items-center justify-between gap-3">
                <div>
                  <p className="text-sm font-semibold text-foreground sm:text-base">
                    All Listening tests
                  </p>
                  <p className="mt-1 text-xs text-muted-foreground sm:text-sm">
                    Practice tests should be flexible. Mock tests must match real IELTS flow as
                    closely as possible.
                  </p>
                </div>
                <div className="flex flex-wrap items-center gap-2">
                  <select
                    value={filter}
                    onChange={(e) =>
                      setFilter(e.target.value as 'all' | 'practice' | 'mock')
                    }
                    className="rounded-md border border-border bg-background px-2 py-1 text-xs text-foreground outline-none focus-visible:ring-2 focus-visible:ring-primary sm:text-sm"
                  >
                    <option value="all">All</option>
                    <option value="practice">Practice</option>
                    <option value="mock">Mock</option>
                  </select>
                  <Button
                    type="button"
                    size="sm"
                    variant="outline"
                    disabled
                    title="New test creation can be wired later"
                  >
                    <Icon name="Plus" size={14} />
                    <span>New test (coming)</span>
                  </Button>
                </div>
              </div>
            </Card>
          </section>

          {error && (
            <section className="mb-4">
              <Alert variant="error">{error}</Alert>
            </section>
          )}

          <section>
            <Card className="border-border bg-card/60 p-0">
              <div className="border-b border-border px-4 py-3">
                <div className="flex flex-wrap items-center justify-between gap-2">
                  <p className="text-xs text-muted-foreground sm:text-sm">
                    {filteredTests.length} test
                    {filteredTests.length === 1 ? '' : 's'} shown
                  </p>
                  <div className="flex items-center gap-2">
                    <Icon
                      name="Info"
                      size={14}
                      className="text-muted-foreground"
                    />
                    <p className="text-[11px] text-muted-foreground sm:text-xs">
                      Use the mock toggle carefully – it affects where the test shows up in the
                      student UI.
                    </p>
                  </div>
                </div>
              </div>

              <div className="overflow-x-auto">
                <table className="min-w-full text-left text-xs text-muted-foreground sm:text-sm">
                  <thead>
                    <tr className="border-b border-border bg-muted/40 text-[11px] uppercase tracking-wide">
                      <th className="px-4 py-2 font-medium">Title</th>
                      <th className="px-4 py-2 font-medium">Slug</th>
                      <th className="px-4 py-2 font-medium">Mode</th>
                      <th className="px-4 py-2 font-medium">Difficulty</th>
                      <th className="px-4 py-2 font-medium">Questions</th>
                      <th className="px-4 py-2 font-medium">Duration</th>
                      <th className="px-4 py-2 font-medium">Actions</th>
                    </tr>
                  </thead>
                  <tbody>
                    {filteredTests.length === 0 ? (
                      <tr>
                        <td
                          className="px-4 py-3 text-xs text-muted-foreground sm:text-sm"
                          colSpan={7}
                        >
                          No tests match this filter.
                        </td>
                      </tr>
                    ) : (
                      filteredTests.map((test) => (
                        <tr
                          key={test.id}
                          className="border-b border-border/60 last:border-b-0"
                        >
                          <td className="px-4 py-2 align-middle text-xs text-foreground sm:text-sm">
                            {test.title}
                          </td>
                          <td className="px-4 py-2 align-middle text-[11px] text-muted-foreground sm:text-xs">
                            {test.slug}
                          </td>
                          <td className="px-4 py-2 align-middle">
                            <span
                              className={[
                                'inline-flex items-center gap-1 rounded-full px-2 py-0.5 text-[11px] font-medium',
                                test.isMock
                                  ? 'bg-danger/10 text-danger'
                                  : 'bg-success/10 text-success',
                              ].join(' ')}
                            >
                              <Icon
                                name={test.isMock ? 'Shield' : 'FlaskConical'}
                                size={11}
                              />
                              <span>{test.isMock ? 'Mock' : 'Practice'}</span>
                            </span>
                          </td>
                          <td className="px-4 py-2 align-middle text-xs text-foreground sm:text-sm">
                            {test.difficulty || '—'}
                          </td>
                          <td className="px-4 py-2 align-middle text-xs text-foreground sm:text-sm">
                            {test.totalQuestions}
                          </td>
                          <td className="px-4 py-2 align-middle text-xs text-foreground sm:text-sm">
                            {Math.round(test.durationSeconds / 60)} min
                          </td>
                          <td className="px-4 py-2 align-middle">
                            <div className="flex flex-wrap items-center gap-2">
                              <Button
                                type="button"
                                size="xs"
                                variant="outline"
                                disabled={saving}
                                onClick={() => handleToggleMock(test)}
                              >
                                <Icon
                                  name={test.isMock ? 'FlaskConical' : 'Shield'}
                                  size={11}
                                />
                                <span>{test.isMock ? 'Make practice' : 'Make mock'}</span>
                              </Button>
                              <Button
                                type="button"
                                size="xs"
                                variant="outline"
                                disabled
                                title="Edit form can be added later"
                              >
                                <Icon name="Pencil" size={11} />
                                <span>Edit</span>
                              </Button>
                              <Button
                                type="button"
                                size="xs"
                                variant="ghost"
                                className="text-danger hover:bg-danger/10 hover:text-danger"
                                disabled={saving}
                                onClick={() => handleDelete(test)}
                              >
                                <Icon name="Trash2" size={11} />
                                <span>Delete</span>
                              </Button>
                            </div>
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
        destination: `/login?next=${encodeURIComponent('/admin/listening/tests')}`,
        permanent: false,
      },
    };
  }

  const { data: rows } = await supabase
    .from('listening_tests')
    .select('id, slug, title, difficulty, is_mock, total_questions, duration_seconds')
    .order('created_at', { ascending: false });

  const tests: AdminListeningTest[] =
    rows?.map((row: any) => ({
      id: row.id,
      slug: row.slug,
      title: row.title,
      difficulty: row.difficulty ?? 'mixed',
      isMock: !!row.is_mock,
      totalQuestions: row.total_questions ?? 0,
      durationSeconds: row.duration_seconds ?? 0,
    })) ?? [];

  return {
    props: {
      tests,
    },
  };
};

export default AdminListeningTestsPage;
