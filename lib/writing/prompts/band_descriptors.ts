// lib/writing/prompts/band_descriptors.ts
// Concise examiner-style anchors for key bands.

export const bandAnchors: Record<'5.0' | '5.5' | '6.0' | '6.5' | '7.0' | '7.5' | '8.0' | '8.5', string> = {
  '5.0': 'Addresses task partially; frequent inaccuracies; limited cohesion; basic vocabulary with repetition.',
  '5.5': 'Generally addresses task; meaning clear but lapses in cohesion and grammar; limited range.',
  '6.0': 'Addresses all parts; ideas arranged logically but mechanical; some lexical/grammar errors remain.',
  '6.5': 'Clear position; mostly well-organised; generally accurate language with minor slips.',
  '7.0': 'Fully addresses task; clear progression; good range of vocab/structures with occasional errors.',
  '7.5': 'Fully addresses task with detail; cohesive and varied; mostly accurate with minor slips under complexity.',
  '8.0': 'Fully satisfies task; very well-structured; wide range; rare non-impeding errors.',
  '8.5': 'Consistently precise, concise, and cohesive; very rare slips; examiner-level control.',
};
