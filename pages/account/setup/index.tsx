// pages/account/setup/index.tsx
// This page implements the account onboarding wizard. The goal of this wizard
// is to collect a few pieces of information from the user when they first
// configure their GramorX account: their target IELTS band, the date they
// intend to take the exam, the study rhythm they prefer, and their
// preferred interface language. Rather than immediately redirecting to
// another page (as the previous implementation did), this page guides
// the user through a simple multi‑step form and persists each setting
// via API endpoints. Once complete, the user is returned to the main
// account area.

import * as React from 'react';
import Head from 'next/head';
import { useRouter } from 'next/router';
import { Container } from '@/components/design-system/Container';
import { Card } from '@/components/design-system/Card';
import { Button } from '@/components/design-system/Button';
import { Input } from '@/components/design-system/Input';
import { Select } from '@/components/design-system/Select';
import { Alert } from '@/components/design-system/Alert';
import { Toaster, useToast } from '@/components/design-system/Toaster';

// Define the available target bands. These values roughly correspond to
// IELTS band scores. Adjust as needed to match your domain.
const TARGET_BAND_OPTIONS = [
  '5.0',
  '5.5',
  '6.0',
  '6.5',
  '7.0',
  '7.5',
  '8.0',
  '8.5',
  '9.0',
];

// Define study rhythm presets. These strings should match what your
// backend/API expects. Feel free to update the labels to suit your
// product’s terminology (e.g. “Light”, “Moderate”, “Intensive”).
const STUDY_RHYTHM_OPTIONS = [
  { value: 'light', label: 'Light (2–3 days per week)' },
  { value: 'moderate', label: 'Moderate (4–5 days per week)' },
  { value: 'intensive', label: 'Intensive (daily study)' },
];

// Supported locales for the interface. If your app supports more
// languages, add them here. The values should correspond to
// SupportedLocale in your i18n config.
const LOCALE_OPTIONS = [
  { value: 'en', label: 'English' },
  { value: 'ur', label: 'Urdu' },
];

/**
 * A simple account onboarding wizard. It uses a step counter to show
 * different forms one at a time. When the user completes the final
 * step, we POST all settings to their respective API endpoints and
 * redirect back to the account hub. Errors are surfaced via toast
 * notifications.
 */
export default function AccountSetupWizard() {
  const router = useRouter();
  const { toast } = useToast();

  // Track the current step (0 = band, 1 = exam date, 2 = rhythm, 3 = language)
  const [step, setStep] = React.useState(0);

  // Form state for each question
  const [targetBand, setTargetBand] = React.useState('');
  const [examDate, setExamDate] = React.useState('');
  const [studyRhythm, setStudyRhythm] = React.useState('');
  const [locale, setLocale] = React.useState('en');

  // Loading state for submission
  const [submitting, setSubmitting] = React.useState(false);

  // Fetch any existing onboarding values on mount (optional). If the user has
  // already completed onboarding, you could prefill the state here. This
  // example intentionally omits a fetch to keep the logic concise.

  // Handlers for navigating forward/backward. Prevent going beyond bounds.
  const nextStep = () => setStep((s) => (s < 3 ? s + 1 : s));
  const prevStep = () => setStep((s) => (s > 0 ? s - 1 : s));

  // Submit all selections to the server. Each call is awaited so the
  // wizard fails fast if any particular preference update fails. Feel
  // free to run these requests in parallel if your API can handle it.
  const handleFinish = async () => {
    setSubmitting(true);
    try {
      // Save target band
      if (targetBand) {
        const res = await fetch('/api/onboarding/target-band', {
          method: 'POST',
          headers: { 'Content-Type': 'application/json' },
          body: JSON.stringify({ band: targetBand }),
        });
        if (!res.ok) throw new Error('Failed to save target band');
      }

      // Save exam date (as ISO string). API may expect a date string.
      if (examDate) {
        const res = await fetch('/api/onboarding/exam-date', {
          method: 'POST',
          headers: { 'Content-Type': 'application/json' },
          body: JSON.stringify({ examDate }),
        });
        if (!res.ok) throw new Error('Failed to save exam date');
      }

      // Save study rhythm
      if (studyRhythm) {
        const res = await fetch('/api/onboarding/study-rhythm', {
          method: 'POST',
          headers: { 'Content-Type': 'application/json' },
          body: JSON.stringify({ rhythm: studyRhythm }),
        });
        if (!res.ok) throw new Error('Failed to save study rhythm');
      }

      // Save language preference
      if (locale) {
        const res = await fetch('/api/onboarding/language', {
          method: 'POST',
          headers: { 'Content-Type': 'application/json' },
          body: JSON.stringify({ locale }),
        });
        if (!res.ok) throw new Error('Failed to save language preference');
      }

      // Redirect back to the account hub on success
      await router.push('/account');
    } catch (err: any) {
      // Notify the user of the first encountered error
      toast({ variant: 'destructive', title: 'Error', description: err.message ?? 'Unable to save your preferences.' });
    } finally {
      setSubmitting(false);
    }
  };

  // Render a header and progress indicator
  const renderHeader = () => (
    <div className="mb-6">
      <h1 className="text-2xl font-semibold text-foreground mb-1">Account setup</h1>
      <p className="text-sm text-mutedText">Step {step + 1} of 4</p>
    </div>
  );

  // Step content components
  const renderTargetBandStep = () => (
    <>
      <h2 className="text-lg font-medium mb-2">What is your target IELTS band?</h2>
      <p className="text-sm text-mutedText mb-4">Pick the band score you hope to achieve.</p>
      <select
        value={targetBand}
        onChange={(e) => setTargetBand(e.target.value)}
        className="w-full rounded-md border border-border bg-background p-2 text-foreground"
      >
        <option value="" disabled hidden>Select band</option>
        {TARGET_BAND_OPTIONS.map((band) => (
          <option key={band} value={band}>{band}</option>
        ))}
      </select>
    </>
  );

  const renderExamDateStep = () => (
    <>
      <h2 className="text-lg font-medium mb-2">When is your exam?</h2>
      <p className="text-sm text-mutedText mb-4">Choose the date of your upcoming IELTS test.</p>
      <input
        type="date"
        value={examDate}
        onChange={(e) => setExamDate(e.target.value)}
        className="w-full rounded-md border border-border bg-background p-2 text-foreground"
      />
    </>
  );

  const renderStudyRhythmStep = () => (
    <>
      <h2 className="text-lg font-medium mb-2">How often will you study?</h2>
      <p className="text-sm text-mutedText mb-4">Select a study rhythm that matches your schedule.</p>
      <select
        value={studyRhythm}
        onChange={(e) => setStudyRhythm(e.target.value)}
        className="w-full rounded-md border border-border bg-background p-2 text-foreground"
      >
        <option value="" disabled hidden>Select rhythm</option>
        {STUDY_RHYTHM_OPTIONS.map((opt) => (
          <option key={opt.value} value={opt.value}>{opt.label}</option>
        ))}
      </select>
    </>
  );

  const renderLanguageStep = () => (
    <>
      <h2 className="text-lg font-medium mb-2">Which interface language do you prefer?</h2>
      <p className="text-sm text-mutedText mb-4">You can change this later in preferences.</p>
      <select
        value={locale}
        onChange={(e) => setLocale(e.target.value)}
        className="w-full rounded-md border border-border bg-background p-2 text-foreground"
      >
        {LOCALE_OPTIONS.map((opt) => (
          <option key={opt.value} value={opt.value}>{opt.label}</option>
        ))}
      </select>
    </>
  );

  return (
    <>
      <Head>
        <title>Setup · Account · GramorX</title>
        <meta name="description" content="Complete your account setup by providing your study goals and preferences." />
      </Head>
      {/* Toast provider ensures notifications are rendered */}
      <Toaster />
      <div className="py-8">
        <Container>
          <Card className="max-w-xl mx-auto p-6 space-y-6">
            {renderHeader()}
            {step === 0 && renderTargetBandStep()}
            {step === 1 && renderExamDateStep()}
            {step === 2 && renderStudyRhythmStep()}
            {step === 3 && renderLanguageStep()}
            <div className="flex justify-between pt-6">
              <Button variant="ghost" onClick={prevStep} disabled={step === 0 || submitting}>
                Back
              </Button>
              {step < 3 ? (
                <Button variant="primary" onClick={nextStep} disabled={submitting ||
                  (step === 0 && !targetBand) ||
                  (step === 1 && !examDate) ||
                  (step === 2 && !studyRhythm)
                }>
                  Next
                </Button>
              ) : (
                <Button variant="primary" onClick={handleFinish} disabled={submitting || !locale}>
                  {submitting ? 'Saving…' : 'Finish'}
                </Button>
              )}
            </div>
          </Card>
        </Container>
      </div>
    </>
  );
}