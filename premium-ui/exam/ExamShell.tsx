import * as React from 'react';
import { PrBreadcrumb, type PrBreadcrumbItem } from '../components/PrBreadcrumb';
import { PrProgress } from '../components/PrProgress';
import { PrTimer } from '../components/PrTimer';

export type Props = {
  title: string;
  totalQuestions: number;
  currentQuestion: number;
  seconds?: number;
  onNavigate?: (q: number) => void;
  onTimeUp?: () => void;
  answerSheet?: React.ReactNode;
  children?: React.ReactNode;
  breadcrumbItems?: PrBreadcrumbItem[];
};

export function ExamShell({
  title,
  totalQuestions,
  currentQuestion,
  seconds,
  onNavigate,
  onTimeUp,
  answerSheet,
  children,
  breadcrumbItems,
}: Props) {
  const safeTotal = Math.max(1, totalQuestions || 1);
  const clampedCurrent = Math.min(Math.max(currentQuestion || 1, 1), safeTotal);
  const progress = (clampedCurrent / safeTotal) * 100;

  const fallbackBreadcrumbs = React.useMemo<PrBreadcrumbItem[]>(
    () => [
      { label: 'Premium Suite', href: '/premium', description: 'Enterprise controls' },
      { label: 'Exams', href: '/premium/exams', description: 'Active sessions' },
      { label: title, meta: `${clampedCurrent}/${safeTotal}` },
    ],
    [title, clampedCurrent, safeTotal],
  );

  const crumbs = breadcrumbItems && breadcrumbItems.length > 0 ? breadcrumbItems : fallbackBreadcrumbs;

  return (
    <div className="pr-min-h-[100dvh] pr-bg-[var(--pr-bg)] pr-text-[var(--pr-fg)] pr-pb-12 pr-pt-6">
      <div className="pr-mx-auto pr-flex pr-w-full pr-max-w-6xl pr-flex-col pr-gap-6 pr-px-4 sm:pr-px-6">
        <div className="pr-hidden md:pr-block">
          <PrBreadcrumb items={crumbs} />
        </div>

        <section className="pr-rounded-[32px] pr-border pr-border-[color-mix(in_oklab,var(--pr-border)_80%,transparent)] pr-bg-[color-mix(in_oklab,var(--pr-card)_90%,var(--pr-bg)_10%)] pr-p-6 sm:pr-p-8 pr-shadow-[0_30px_120px_rgba(0,0,0,0.25)]">
          <div className="pr-flex pr-flex-wrap pr-items-center pr-justify-between pr-gap-4">
            <div>
              <p className="pr-text-[12px] pr-font-semibold pr-uppercase pr-tracking-[0.18em] pr-text-[color-mix(in_oklab,var(--pr-fg)_55%,var(--pr-bg))]">
                Premium Assessment
              </p>
              <h1 className="pr-text-2xl pr-font-semibold sm:pr-text-3xl">{title}</h1>
              <p className="pr-text-sm pr-text-[color-mix(in_oklab,var(--pr-fg)_60%,var(--pr-bg))]">
                Question {clampedCurrent} of {safeTotal}
              </p>
            </div>
            {typeof seconds === 'number' && seconds > 0 ? (
              <PrTimer seconds={seconds} onElapsed={onTimeUp} />
            ) : null}
          </div>

          <div className="pr-mt-8 pr-grid pr-gap-6 lg:pr-grid-cols-[minmax(0,1fr)_320px]">
            <section className="pr-space-y-5 pr-rounded-3xl pr-border pr-border-[color-mix(in_oklab,var(--pr-border)_70%,transparent)] pr-bg-[var(--pr-card)] pr-p-6">
              <div className="pr-flex pr-flex-wrap pr-items-center pr-justify-between pr-gap-4">
                <div>
                  <p className="pr-text-[12px] pr-font-semibold pr-uppercase pr-tracking-[0.2em] pr-text-[color-mix(in_oklab,var(--pr-fg)_45%,var(--pr-bg))]">
                    Section progress
                  </p>
                  <span className="pr-text-lg pr-font-semibold">{Math.round(progress)}% complete</span>
                </div>
                <div className="pr-w-full pr-min-w-[220px] pr-flex-1 pr-max-w-sm">
                  <PrProgress value={progress} aria-label={`Progress ${clampedCurrent} of ${safeTotal}`} />
                </div>
              </div>
              <div className="pr-rounded-2xl pr-border pr-border-[color-mix(in_oklab,var(--pr-border)_60%,transparent)] pr-bg-[color-mix(in_oklab,var(--pr-card)_80%,var(--pr-bg)_20%)] pr-p-4">
                {children}
              </div>
            </section>

            <aside className="pr-space-y-5">
              <div className="pr-rounded-3xl pr-border pr-border-[color-mix(in_oklab,var(--pr-border)_70%,transparent)] pr-bg-[var(--pr-card)] pr-p-5">
                <div className="pr-flex pr-items-center pr-justify-between">
                  <h2 className="pr-text-sm pr-font-semibold pr-uppercase pr-tracking-[0.2em] pr-text-[color-mix(in_oklab,var(--pr-fg)_55%,var(--pr-bg))]">
                    Navigate
                  </h2>
                  <span className="pr-text-xs pr-text-[color-mix(in_oklab,var(--pr-fg)_50%,var(--pr-bg))]">Tap to jump</span>
                </div>
                <div className="pr-mt-4 pr-grid pr-grid-cols-5 pr-gap-2">
                  {Array.from({ length: safeTotal }).map((_, index) => {
                    const questionNumber = index + 1;
                    const isActive = questionNumber === clampedCurrent;
                    return (
                      <button
                        key={questionNumber}
                        type="button"
                        onClick={() => onNavigate?.(questionNumber)}
                        disabled={!onNavigate}
                        aria-current={isActive || undefined}
                        className={`pr-h-10 pr-rounded-xl pr-border pr-text-sm pr-font-medium pr-transition ${
                          isActive
                            ? 'pr-border-[var(--pr-primary)] pr-bg-[color-mix(in_oklab,var(--pr-primary)_20%,var(--pr-bg))]'
                            : 'pr-border-[color-mix(in_oklab,var(--pr-border)_70%,transparent)] pr-bg-transparent hover:pr-border-[var(--pr-primary)]'
                        } ${onNavigate ? '' : 'pr-opacity-50 pr-cursor-not-allowed'}`}
                      >
                        {questionNumber}
                      </button>
                    );
                  })}
                </div>
              </div>

              {answerSheet ? (
                <div className="pr-rounded-3xl pr-border pr-border-[color-mix(in_oklab,var(--pr-border)_70%,transparent)] pr-bg-[var(--pr-card)] pr-p-5">
                  <h3 className="pr-text-sm pr-font-semibold pr-uppercase pr-tracking-[0.18em] pr-text-[color-mix(in_oklab,var(--pr-fg)_55%,var(--pr-bg))]">
                    Answer sheet
                  </h3>
                  <div className="pr-mt-4">{answerSheet}</div>
                </div>
              ) : null}
            </aside>
          </div>
        </section>
      </div>
    </div>
  );
}

export default ExamShell;
