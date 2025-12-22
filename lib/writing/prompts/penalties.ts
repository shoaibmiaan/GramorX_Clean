// lib/writing/prompts/penalties.ts
// Shared penalty philosophy for IELTS-style Writing evaluation prompts.

export const penaltyGuidelines = [
  'Under-length: if Task 1 < 150 words or Task 2 < 250 words, cap the band and note the penalty clearly.',
  'Off-topic: if the answer does not address the prompt, mark as off-topic and reduce Task Response sharply.',
  'Memorised/template language: penalise templated openings and generic fillers; reward specific, relevant content.',
  'Borderline rounding: if unsure between two bands, choose the lower band (stricter than real IELTS).',
].join('\n');

export const penaltyTags = {
  underLength: 'under_length',
  offTopic: 'off_topic',
  memorised: 'memorised_language',
};
