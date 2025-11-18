import { listeningPracticeList, listeningPracticePapers } from '@/data/listening';
import { readingPracticeList, readingPracticePapers } from '@/data/reading';
import {
  normalizeWritingPaper,
  toMockPaper,
  type NormalizedWritingPaper,
} from '@/data/writing/exam-index';
import writingExam01 from '@/data/writing/ielts-writing-exam-01.json';
import writingExam02 from '@/data/writing/ielts-writing-exam-02.json';
import writingExam03 from '@/data/writing/ielts-writing-exam-03.json';
import writingExam04 from '@/data/writing/ielts-writing-exam-04.json';
import writingExam05 from '@/data/writing/ielts-writing-exam-05.json';
import speakingExam01 from '@/data/speaking/full-exam-001.json';
import speakingExam02 from '@/data/speaking/full-exam-002.json';
import speakingExam03 from '@/data/speaking/full-exam-003.json';
import speakingExam04 from '@/data/speaking/full-exam-004.json';
import speakingExam05 from '@/data/speaking/full-exam-005.json';
import { speakingPracticeList } from '@/data/speaking';
import type { MockModuleId } from '@/types/mock';

import type {
  ListeningMockContent,
  ModuleMockContent,
  ModuleMockMeta,
  NormalizedQuestion,
  ReadingMockContent,
  SpeakingMockContent,
  WritingMockContent,
} from './types';

const LISTENING_SELECTION = listeningPracticeList.slice(0, 6);
const LISTENING_CONTENT = new Map(
  listeningPracticePapers.map((paper) => {
    const questions: NormalizedQuestion[] = (paper.sections ?? []).flatMap((section, index) => {
      const sectionLabel = section.title ?? `Section ${index + 1}`;
      return (section.questions ?? []).map((question, qIndex) => ({
        id: `${paper.id}-${question.id ?? qIndex + 1}`,
        prompt: question.prompt ?? question.id ?? `Question ${qIndex + 1}`,
        answer: String(question.answer ?? ''),
        section: sectionLabel,
        options: Array.isArray(question.options) ? question.options : undefined,
      }));
    });

    const durationSec = typeof paper.durationSec === 'number' ? paper.durationSec : 40 * 60;
    return [paper.id, { id: paper.id, title: paper.title ?? paper.id, durationSec, questions, paper } satisfies ListeningMockContent];
  }),
);

const listeningMetaList: ModuleMockMeta[] = LISTENING_SELECTION.map((paper) => ({
  id: paper.id,
  title: paper.title ?? paper.id,
  durationMinutes: Math.max(1, Math.round((paper.durationSec ?? 1800) / 60)),
  questionCount: paper.totalQuestions,
  sectionCount: paper.sections,
  difficulty: 'medium',
  tags: ['audio', 'timed'],
}));

const READING_SELECTION = readingPracticeList.slice(0, 6);
const READING_CONTENT = new Map(
  readingPracticePapers.map((paper) => {
    const questions: NormalizedQuestion[] = (paper.passages ?? []).flatMap((passage, pIndex) => {
      const sectionLabel = passage.title ?? `Passage ${pIndex + 1}`;
      return (passage.questions ?? []).map((question, qIndex) => ({
        id: `${paper.id}-${passage.id ?? pIndex + 1}-${question.id ?? qIndex + 1}`,
        prompt: question.prompt ?? `Question ${qIndex + 1}`,
        answer: String(question.answer ?? ''),
        section: sectionLabel,
        options: Array.isArray(question.options) ? question.options : undefined,
      }));
    });

    return [
      paper.id,
      {
        id: paper.id,
        title: paper.title ?? paper.id,
        durationSec: paper.durationSec ?? 60 * 60,
        questions,
        paper,
      } satisfies ReadingMockContent,
    ];
  }),
);

const readingMetaList: ModuleMockMeta[] = READING_SELECTION.map((paper) => ({
  id: paper.id,
  title: paper.title ?? paper.id,
  durationMinutes: Math.max(1, Math.round((paper.durationSec ?? 3600) / 60)),
  questionCount: paper.totalQuestions,
  sectionCount: paper.passages,
  difficulty: 'medium',
  tags: ['comprehension'],
}));

const WRITING_SOURCES: NormalizedWritingPaper[] = [
  writingExam01,
  writingExam02,
  writingExam03,
  writingExam04,
  writingExam05,
].map((paper) => normalizeWritingPaper(paper));

const writingContentList: WritingMockContent[] = WRITING_SOURCES.map((paper) => {
  const mapped = toMockPaper(paper);
  return {
    id: mapped.id,
    title: mapped.title ?? paper.id,
    task1Prompt: mapped.task1Prompt,
    task2Prompt: mapped.task2Prompt,
    durationSec: mapped.durationSec ?? 3600,
    minWordsTask1: mapped.minWordsTask1 ?? 150,
    minWordsTask2: mapped.minWordsTask2 ?? 250,
  } satisfies WritingMockContent;
});

const writingMetaList: ModuleMockMeta[] = writingContentList.map((paper) => ({
  id: paper.id,
  title: paper.title,
  durationMinutes: Math.max(1, Math.round(paper.durationSec / 60)),
  questionCount: 2,
  sectionCount: 2,
  difficulty: 'medium',
  tags: ['task1', 'task2'],
}));

const SPEAKING_SOURCES = [
  speakingExam01,
  speakingExam02,
  speakingExam03,
  speakingExam04,
  speakingExam05,
];

const speakingContentList: SpeakingMockContent[] = SPEAKING_SOURCES.map((script: any, index) => {
  const part1Questions = Array.isArray(script.part1)
    ? script.part1
    : Array.isArray(script.part1?.questions)
    ? script.part1?.questions ?? []
    : [];
  const part3Questions = Array.isArray(script.part3)
    ? script.part3
    : Array.isArray(script.part3?.questions)
    ? script.part3?.questions ?? []
    : [];
  const part2Cue = Array.isArray(script.part2?.cueCard)
    ? script.part2?.cueCard
    : typeof script.part2?.cueCard === 'string'
    ? [script.part2.cueCard]
    : [];

  return {
    id: script.id ?? `speaking-${index + 1}`,
    title: script.title ?? `Speaking Pack ${index + 1}`,
    description:
      speakingPracticeList.find((item) => item.id === (script.id ?? ''))?.description ??
      'Complete three-part IELTS speaking simulation.',
    part1Questions,
    part2CueCard: part2Cue,
    part3Questions,
    prepSeconds: script.part2?.prepSec ?? script.part2?.prepSeconds ?? 60,
    speakSeconds: script.part2?.speakSec ?? script.part2?.speakSeconds ?? 120,
  } satisfies SpeakingMockContent;
});

const speakingMetaList: ModuleMockMeta[] = speakingContentList.map((script) => ({
  id: script.id,
  title: script.title,
  durationMinutes: Math.round((script.prepSeconds + script.speakSeconds + script.part3Questions.length * 45) / 60),
  questionCount: script.part1Questions.length + script.part3Questions.length + 1,
  sectionCount: 3,
  difficulty: 'medium',
  tags: ['speaking'],
}));

const MODULE_META: Record<MockModuleId, ModuleMockMeta[]> = {
  listening: listeningMetaList,
  reading: readingMetaList,
  writing: writingMetaList,
  speaking: speakingMetaList,
};

export function listMocksForModule(module: MockModuleId): ModuleMockMeta[] {
  return MODULE_META[module] ?? [];
}

export function getMockMeta(module: MockModuleId, mockId: string): ModuleMockMeta | undefined {
  return listMocksForModule(module).find((item) => item.id === mockId);
}

export function getMockContent(module: MockModuleId, mockId: string): ModuleMockContent {
  switch (module) {
    case 'listening': {
      const record = LISTENING_CONTENT.get(mockId);
      if (!record) {
        throw new Error(`Listening mock not found: ${mockId}`);
      }
      return { module, content: record };
    }
    case 'reading': {
      const record = READING_CONTENT.get(mockId);
      if (!record) {
        throw new Error(`Reading mock not found: ${mockId}`);
      }
      return { module, content: record };
    }
    case 'writing': {
      const record = writingContentList.find((item) => item.id === mockId);
      if (!record) {
        throw new Error(`Writing mock not found: ${mockId}`);
      }
      return { module, content: record };
    }
    case 'speaking': {
      const record = speakingContentList.find((item) => item.id === mockId);
      if (!record) {
        throw new Error(`Speaking mock not found: ${mockId}`);
      }
      return { module, content: record };
    }
    default:
      throw new Error(`Unsupported module ${module}`);
  }
}
