// lib/writing/examinerNotes.ts
export type CriteriaKey = 'TR' | 'CC' | 'LR' | 'GRA';

type BandNoteMap = Partial<Record<5 | 6 | 7 | 8, string>>;

export const EXAMINER_NOTES: Record<CriteriaKey, BandNoteMap> = {
  TR: {
    5: 'Ideas are relevant but not developed enough. Key parts of the task may be missing.',
    6: 'You address the task, but development is uneven and examples can be vague.',
    7: 'You take a clear position and develop ideas with specific support.',
    8: 'You address the task fully with well-developed, well-supported arguments throughout.',
  },
  CC: {
    5: 'Progression is unclear. Paragraphing and linking feel mechanical or inconsistent.',
    6: 'Organisation is generally clear, but cohesion can be repetitive or forced.',
    7: 'Information flows logically with clear paragraphing and natural linking.',
    8: 'Your essay is cohesive throughout with effortless progression and strong paragraph control.',
  },
  LR: {
    5: 'Vocabulary is limited and repetition is frequent. Word choice can be inaccurate.',
    6: 'You show some range, but precision and collocations need improvement.',
    7: 'Good range with mostly precise word choice and natural collocations.',
    8: 'Wide, flexible vocabulary used precisely with a highly natural tone.',
  },
  GRA: {
    5: 'Errors are frequent and can affect clarity. Complex structures are limited.',
    6: 'You use a mix of structures, but errors are noticeable under complexity.',
    7: 'A good range of structures with generally strong accuracy.',
    8: 'Wide structural range with high accuracy; errors are rare and minor.',
  },
};

export const noteForBand = (criterion: CriteriaKey, band: number): string | null => {
  const b = band >= 8 ? 8 : band >= 7 ? 7 : band >= 6 ? 6 : 5;
  return EXAMINER_NOTES[criterion][b] ?? null;
};
