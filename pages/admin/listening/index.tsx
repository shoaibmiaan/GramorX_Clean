// pages/admin/listening/index.tsx
import * as React from 'react';
import type { GetServerSideProps, NextPage } from 'next';
import Head from 'next/head';
import Link from 'next/link';

import { getServerClient } from '@/lib/supabaseServer';
import { RoleGuard } from '@/components/auth/RoleGuard';
import { Container } from '@/components/design-system/Container';
import { Card } from '@/components/design-system/Card';
import { Input } from '@/components/design-system/Input';
import { Textarea } from '@/components/design-system/Textarea';
import { Button } from '@/components/design-system/Button';
import Icon from '@/components/design-system/Icon';
import { useToast } from '@/components/design-system/Toaster';

const LETTERS = ['A', 'B', 'C', 'D', 'E', 'F'];

type ListeningAdminOverview = {
  totalTests: number;
  practiceTests: number;
  mockTests: number;
  totalAttempts: number;
  practiceAttempts: number;
  mockAttempts: number;
  avgBandScore: number | null;
};

type Props = {
  stats: ListeningAdminOverview;
};

interface QuestionDraft {
  id: string;
  prompt: string;
  options: string[];
  correctIndex: number;
}

interface UploadResult {
  path: string;
  url: string | null;
  mime: string;
  originalName: string;
}

interface ExistingTest {
  slug: string;
  title: string;
  duration?: number;
}

const makeQuestion = (seed: number): QuestionDraft => ({
  id: `q-${Date.now()}-${seed}`,
  prompt: '',
  options: ['', '', '', ''],
  correctIndex: 0,
});

const toSentenceCase = (text: string) =>
  text.charAt(0).toUpperCase() + text.slice(1);

const AdminListeningContent: React.FC<Props> = ({ stats }) => {
  const {
    totalTests,
    practiceTests,
    mockTests,
    totalAttempts,
    practiceAttempts,
    mockAttempts,
    avgBandScore,
  } = stats;

  const [title, setTitle] = React.useState('');
  const [description, setDescription] = React.useState('');
  const [uploading, setUploading] = React.useState(false);
  const [creating, setCreating] = React.useState(false);
  const [audio, setAudio] = React.useState<UploadResult | null>(null);
  const [questions, setQuestions] = React.useState<QuestionDraft[]>([
    makeQuestion(1),
  ]);
  const [existingTests, setExistingTests] = React.useState<ExistingTest[]>([]);
  const [loadingTests, setLoadingTests] = React.useState(false);
  const [audioError, setAudioError] = React.useState<string | null>(null);

  const fileInputRef = React.useRef<HTMLInputElement | null>(null);
  const { success, error: toastError } = useToast();

  React.useEffect(() => {
    let cancelled = false;
    setLoadingTests(true);
    fetch('/api/listening/tests')
      .then(async (res) => {
        if (!res.ok) throw new Error('Failed to load tests');
        return (await res.json()) as ExistingTest[];
      })
      .then((data) => {
        if (!cancelled) setExistingTests(data);
      })
      .catch(() => {
        if (!cancelled) {
          toastError('Could not load existing tests');
        }
      })
      .finally(() => {
        if (!cancelled) setLoadingTests(false);
      });

    return () => {
      cancelled = true;
    };
  }, [toastError]);

  const handleFileChange = async (
    event: React.ChangeEvent<HTMLInputElement>,
  ) => {
    const file = event.target.files?.[0];
    if (!file) return;

    setUploading(true);
    setAudioError(null);

    try {
      const form = new FormData();
      form.append('file', file);
      if (title) form.append('title', title);

      const res = await fetch('/api/admin/listening/upload', {
        method: 'POST',
        body: form,
      });

      const payload = await res.json().catch(() => ({ error: 'Upload failed' }));

      if (!res.ok || payload?.error) {
        setAudio(null);
        toastError(payload?.error ?? 'Upload failed');
      } else {
        setAudio({
          path: payload.path,
          url: payload.publicUrl ?? payload.path ?? null,
          mime: payload.mime,
          originalName: file.name,
        });
        success('Audio uploaded successfully');
      }
    } catch (err: any) {
      setAudio(null);
      toastError(err?.message ?? 'Upload failed');
    } finally {
      setUploading(false);
    }
  };

  const addQuestion = () => {
    setQuestions((prev) => [...prev, makeQuestion(prev.length + 1)]);
  };

  const removeQuestion = (id: string) => {
    setQuestions((prev) =>
      prev.length <= 1 ? prev : prev.filter((q) => q.id !== id),
    );
  };

  const updatePrompt = (id: string, prompt: string) => {
    setQuestions((prev) => prev.map((q) => (q.id === id ? { ...q, prompt } : q)));
  };

  const updateOption = (id: string, index: number, value: string) => {
    setQuestions((prev) =>
      prev.map((q) => {
        if (q.id !== id) return q;
        const options = [...q.options];
        options[index] = value;
        return { ...q, options };
      }),
    );
  };

  const setCorrectOption = (id: string, index: number) => {
    setQuestions((prev) =>
      prev.map((q) => (q.id === id ? { ...q, correctIndex: index } : q)),
    );
  };

  const hasValidationErrors = React.useMemo(() => {
    if (!title.trim()) return 'Title is required';
    if (!audio?.url) return 'Upload an audio file';
    for (const q of questions) {
      if (!q.prompt.trim()) return 'All questions need a prompt';
      if (q.options.some((opt) => !opt.trim()))
        return 'All options must be filled';
      if (q.correctIndex >= q.options.length)
        return 'Mark a correct option for each question';
    }
    return null;
  }, [audio?.url, questions, title]);

  const resetForm = () => {
    setTitle('');
    setDescription('');
    setAudio(null);
    setQuestions([makeQuestion(1)]);
    setAudioError(null);
    if (fileInputRef.current) {
      fileInputRef.current.value = '';
    }
  };

  const handleSubmit = async (event: React.FormEvent) => {
    event.preventDefault();
    const validationError = hasValidationErrors;
    if (validationError) {
      setAudioError(
        validationError === 'Upload an audio file' ? validationError : null,
      );
      toastError(validationError);
      return;
    }

    if (!audio?.url) {
      toastError('Upload an audio file before saving');
      return;
    }

    const trimmedTitle = title.trim();

    setCreating(true);
    try {
      const res = await fetch('/api/admin/listening/tests', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          title: trimmedTitle,
          audioUrl: audio.url,
          storagePath: audio.path,
          description: description.trim() || undefined,
          questions: questions.map((q) => ({
            prompt: q.prompt.trim(),
            options: q.options.map((opt) => opt.trim()),
            correctOption: q.correctIndex,
          })),
        }),
      });

      const payload = await res.json().catch(() => ({
        error: 'Failed to create test',
      }));

      if (!res.ok || payload?.error) {
        toastError(payload?.error ?? 'Failed to create test');
      } else {
        success('Listening test created');
        resetForm();
        setExistingTests((prev) => [
          { slug: payload.slug, title: trimmedTitle },
          ...prev,
        ]);
      }
    } catch (err: any) {
      toastError(err?.message ?? 'Failed to create test');
    } finally {
      setCreating(false);
    }
  };

  return (
    <>
      <Head>
        <title>Admin • Listening • GramorX</title>
        <meta
          name="description"
          content="Admin overview and test creator for the IELTS Listening module – tests, attempts, and health summary."
        />
      </Head>

      <main className="min-h-screen bg-background py-8">
        <Container className="py-2">
          {/* Top header + overview */}
          <div className="mb-6 flex flex-wrap items-center justify-between gap-3">
            <div>
              <p className="text-[11px] font-medium uppercase tracking-wide text-muted-foreground">
                Admin · Listening module
              </p>
              <h1 className="text-2xl font-semibold text-foreground sm:text-3xl">
                Listening admin overview
              </h1>
              <p className="mt-1 text-xs text-muted-foreground sm:text-sm">
                Control tests, watch attempts, and keep the Listening module exam-accurate.
              </p>
            </div>

            <div className="flex flex-wrap items-center gap-2">
              {/* These still point to dedicated views if/when you add them */}
              <Button asChild size="sm" variant="outline">
                <Link href="/admin/listening/tests">
                  <Icon name="FileText" size={14} />
                  <span>Manage tests</span>
                </Link>
              </Button>
              <Button asChild size="sm" variant="outline">
                <Link href="/admin/listening/question-bank">
                  <Icon name="Database" size={14} />
                  <span>Question bank</span>
                </Link>
              </Button>
              <Button asChild size="sm">
                <Link href="/admin/listening/attempts">
                  <Icon name="ListChecks" size={14} />
                  <span>View attempts</span>
                </Link>
              </Button>
            </div>
          </div>

          {/* Stat cards */}
          <section className="mb-6 grid gap-3 md:grid-cols-3">
            <Card className="border-border bg-card/60 p-4">
              <div className="flex items-center justify-between gap-2">
                <div>
                  <p className="text-[11px] font-medium uppercase tracking-wide text-muted-foreground">
                    Listening tests
                  </p>
                  <p className="mt-1 text-xl font-semibold text-foreground">
                    {totalTests}
                  </p>
                  <p className="mt-1 text-[11px] text-muted-foreground">
                    {practiceTests} practice · {mockTests} mock
                  </p>
                </div>
                <Icon name="Headphones" size={20} className="text-primary" />
              </div>
            </Card>

            <Card className="border-border bg-card/60 p-4">
              <div className="flex items-center justify-between gap-2">
                <div>
                  <p className="text-[11px] font-medium uppercase tracking-wide text-muted-foreground">
                    Total attempts
                  </p>
                  <p className="mt-1 text-xl font-semibold text-foreground">
                    {totalAttempts}
                  </p>
                  <p className="mt-1 text-[11px] text-muted-foreground">
                    {practiceAttempts} practice · {mockAttempts} mock
                  </p>
                </div>
                <Icon name="Activity" size={20} className="text-primary" />
              </div>
            </Card>

            <Card className="border-border bg-card/60 p-4">
              <div className="flex items-center justify-between gap-2">
                <div>
                  <p className="text-[11px] font-medium uppercase tracking-wide text-muted-foreground">
                    Avg Listening band (submitted mocks)
                  </p>
                  <p className="mt-1 text-xl font-semibold text-foreground">
                    {avgBandScore != null ? avgBandScore.toFixed(1) : '—'}
                  </p>
                  <p className="mt-1 text-[11px] text-muted-foreground">
                    Based on submitted mock attempts only.
                  </p>
                </div>
                <Icon name="LineChart" size={20} className="text-primary" />
              </div>
            </Card>
          </section>

          {/* Quick links */}
          <section className="mb-10 grid gap-4 md:grid-cols-3">
            <Card className="flex flex-col justify-between border-border bg-card/60 p-4">
              <div className="space-y-2">
                <p className="text-sm font-semibold text-foreground">
                  Test definitions
                </p>
                <p className="text-xs text-muted-foreground">
                  Create, edit, and mark tests as practice vs mock. Attach audio,
                  duration, and band ranges.
                </p>
              </div>
              <div className="mt-3">
                <Button asChild size="sm" className="w-full justify-center">
                  <Link href="/admin/listening/tests">
                    <Icon name="FileText" size={14} />
                    <span>Open tests manager</span>
                  </Link>
                </Button>
              </div>
            </Card>

            <Card className="flex flex-col justify-between border-border bg-card/60 p-4">
              <div className="space-y-2">
                <p className="text-sm font-semibold text-foreground">
                  Question bank
                </p>
                <p className="text-xs text-muted-foreground">
                  Inspect questions by test, section, and type. Make sure real
                  IELTS style is preserved.
                </p>
              </div>
              <div className="mt-3">
                <Button asChild size="sm" className="w-full justify-center">
                  <Link href="/admin/listening/question-bank">
                    <Icon name="Database" size={14} />
                    <span>Open question bank</span>
                  </Link>
                </Button>
              </div>
            </Card>

            <Card className="flex flex-col justify-between border-border bg-card/60 p-4">
              <div className="space-y-2">
                <p className="text-sm font-semibold text-foreground">
                  Attempts &amp; health
                </p>
                <p className="text-xs text-muted-foreground">
                  See who is actually using Listening, how often, and at what
                  band level.
                </p>
              </div>
              <div className="mt-3">
                <Button asChild size="sm" className="w-full justify-center">
                  <Link href="/admin/listening/attempts">
                    <Icon name="ListChecks" size={14} />
                    <span>View attempts</span>
                  </Link>
                </Button>
              </div>
            </Card>
          </section>

          {/* Creator + existing tests layout */}
          <form
            onSubmit={handleSubmit}
            className="grid gap-8 lg:grid-cols-[minmax(0,2fr)_minmax(0,1fr)]"
          >
            <div className="space-y-6">
              <section className="rounded-3xl border border-border bg-card/60 p-6 shadow-sm">
                <h2 className="text-xl font-semibold">Create listening mock test</h2>
                <p className="mt-1 text-small text-muted-foreground">
                  Upload audio tracks and craft question sets for new listening
                  practice tests. Only admins can access this workspace.
                </p>

                <div className="mt-6 space-y-4">
                  <Input
                    label="Title"
                    placeholder="IELTS Listening Practice Test #5"
                    value={title}
                    onChange={(e) => setTitle(e.target.value)}
                    required
                  />
                  <Textarea
                    label="Internal notes"
                    hint="Optional helper text for other admins (not shown to students)."
                    value={description}
                    onChange={(e) => setDescription(e.target.value)}
                    variant="subtle"
                    size="sm"
                  />

                  <div>
                    <label className="mb-1 block text-small font-medium text-muted-foreground">
                      Audio file
                    </label>
                    <input
                      ref={fileInputRef}
                      type="file"
                      accept="audio/*"
                      onChange={handleFileChange}
                      className="block w-full cursor-pointer rounded-xl border border-dashed border-border bg-background px-4 py-3 text-small text-muted-foreground"
                    />
                    <div className="mt-2 min-h-[1.25rem] text-small text-muted-foreground">
                      {uploading && <span>Uploading…</span>}
                      {!uploading && audio?.url && (
                        <span className="text-success">
                          Uploaded {audio.originalName} (
                          {audio.mime.split('/')[1] || audio.mime})
                        </span>
                      )}
                      {!uploading && !audio?.url && audioError && (
                        <span className="text-sunsetOrange">{audioError}</span>
                      )}
                    </div>
                  </div>
                </div>
              </section>

              <section className="rounded-3xl border border-border bg-card/60 p-6 shadow-sm">
                <div className="flex items-center justify-between gap-4">
                  <div>
                    <h2 className="text-xl font-semibold">Questions</h2>
                    <p className="mt-1 text-small text-muted-foreground">
                      Start with multiple-choice questions. Each prompt should
                      align with the uploaded track.
                    </p>
                  </div>
                  <Button
                    type="button"
                    variant="soft"
                    tone="primary"
                    size="sm"
                    onClick={addQuestion}
                  >
                    Add question
                  </Button>
                </div>

                <div className="mt-6 space-y-6">
                  {questions.map((q, index) => (
                    <div
                      key={q.id}
                      className="rounded-2xl border border-border bg-background/50 p-5 shadow-sm"
                    >
                      <div className="mb-4 flex items-start justify-between gap-4">
                        <div>
                          <p className="text-sm font-semibold text-muted-foreground">
                            Question {index + 1}
                          </p>
                          <p className="text-xs text-muted-foreground/80">
                            Multiple choice
                          </p>
                        </div>
                        {questions.length > 1 && (
                          <Button
                            type="button"
                            variant="ghost"
                            size="sm"
                            onClick={() => removeQuestion(q.id)}
                          >
                            Remove
                          </Button>
                        )}
                      </div>

                      <Textarea
                        label="Prompt"
                        placeholder="What is the purpose of the speaker&apos;s visit?"
                        value={q.prompt}
                        onChange={(e) => updatePrompt(q.id, e.target.value)}
                        size="sm"
                      />

                      <div className="mt-4 grid gap-3">
                        {q.options.map((opt, optIdx) => (
                          <div
                            key={`${q.id}-${optIdx}`}
                            className="rounded-xl border border-border/60 bg-card/40 p-4"
                          >
                            <div className="flex flex-wrap items-center justify-between gap-3">
                              <p className="text-small font-medium text-muted-foreground">
                                Option{' '}
                                {LETTERS[optIdx] ??
                                  toSentenceCase(String(optIdx + 1))}
                              </p>
                              <Button
                                type="button"
                                size="sm"
                                variant="soft"
                                tone={
                                  q.correctIndex === optIdx
                                    ? 'primary'
                                    : 'default'
                                }
                                onClick={() =>
                                  setCorrectOption(q.id, optIdx)
                                }
                              >
                                {q.correctIndex === optIdx
                                  ? 'Correct option'
                                  : 'Mark correct'}
                              </Button>
                            </div>
                            <Input
                              className="mt-3"
                              placeholder="Answer text"
                              value={opt}
                              onChange={(e) =>
                                updateOption(q.id, optIdx, e.target.value)
                              }
                            />
                          </div>
                        ))}
                      </div>
                    </div>
                  ))}
                </div>
              </section>

              <div className="flex justify-end">
                <Button
                  type="submit"
                  loading={creating}
                  loadingText="Saving"
                  disabled={Boolean(hasValidationErrors)}
                >
                  Save listening test
                </Button>
              </div>
            </div>

            <aside className="space-y-6">
              <div className="rounded-3xl border border-border bg-card/60 p-6 shadow-sm">
                <h3 className="text-lg font-semibold">Existing tests</h3>
                <p className="mt-1 text-small text-muted-foreground">
                  Quick reference list pulled from Supabase. Refresh to see new
                  entries from other admins.
                </p>

                <div className="mt-4 space-y-3">
                  {loadingTests && (
                    <p className="text-small text-muted-foreground">
                      Loading…
                    </p>
                  )}
                  {!loadingTests && existingTests.length === 0 && (
                    <p className="text-small text-muted-foreground">
                      No listening tests found.
                    </p>
                  )}
                  {!loadingTests &&
                    existingTests.map((test) => (
                      <div
                        key={test.slug}
                        className="rounded-2xl border border-border/60 bg-background/40 px-4 py-3 text-small"
                      >
                        <p className="font-medium text-foreground">
                          {test.title}
                        </p>
                        <p className="text-muted-foreground">
                          Slug: {test.slug}
                        </p>
                        {typeof test.duration === 'number' &&
                          test.duration > 0 && (
                            <p className="text-muted-foreground">
                              Duration: {test.duration} sec
                            </p>
                          )}
                      </div>
                    ))}
                </div>
              </div>
            </aside>
          </form>
        </Container>
      </main>
    </>
  );
};

const AdminListeningPage: NextPage<Props> = (props) => {
  return (
    <RoleGuard allow="admin">
      <AdminListeningContent {...props} />
    </RoleGuard>
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
        destination: `/login?next=${encodeURIComponent('/admin/listening')}`,
        permanent: false,
      },
    };
  }

  // Tests stats
  const { data: testRows } = await supabase
    .from('listening_tests')
    .select('id, is_mock');

  const totalTests = testRows?.length ?? 0;
  const practiceTests = testRows?.filter((t: any) => !t.is_mock).length ?? 0;
  const mockTests = testRows?.filter((t: any) => !!t.is_mock).length ?? 0;

  // Attempts stats
  const { data: attemptsRows } = await supabase
    .from('attempts_listening')
    .select('id, mode, band_score')
    .eq('status', 'submitted');

  const totalAttempts = attemptsRows?.length ?? 0;
  const practiceAttempts =
    attemptsRows?.filter((a: any) => a.mode === 'practice').length ?? 0;
  const mockAttempts =
    attemptsRows?.filter((a: any) => a.mode === 'mock').length ?? 0;

  const mockBandScores =
    attemptsRows?.filter(
      (a: any) => a.mode === 'mock' && a.band_score != null,
    ) ?? [];

  const avgBandScore =
    mockBandScores.length > 0
      ? mockBandScores.reduce(
          (sum: number, row: any) => sum + Number(row.band_score),
          0,
        ) / mockBandScores.length
      : null;

  return {
    props: {
      stats: {
        totalTests,
        practiceTests,
        mockTests,
        totalAttempts,
        practiceAttempts,
        mockAttempts,
        avgBandScore,
      },
    },
  };
};

export default AdminListeningPage;
