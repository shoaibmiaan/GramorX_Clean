// lib/writing/examples/examples.ts
export type BandKey = 'band6' | 'band7' | 'band8';

export type ExamplesByBand = Record<BandKey, string[]>;

export type CriterionExamples = {
  TR: ExamplesByBand;
  CC: ExamplesByBand;
  LR: ExamplesByBand;
  GRA: ExamplesByBand;
};

export const WRITING_EXAMPLES: CriterionExamples = {
  TR: {
    band6: [
      'One reason is that public transport is often unreliable, so people choose cars for convenience.',
      'This can be solved by improving bus frequency and keeping fares affordable.',
    ],
    band7: [
      'A clear advantage is improved productivity, because employees can work during their peak hours with fewer distractions.',
      'However, without boundaries, remote work may increase stress as workers feel “always online”.',
    ],
    band8: [
      'While the policy may reduce congestion in the short term, it risks shifting traffic to neighbouring areas unless alternatives improve simultaneously.',
      'Therefore, a congestion charge should be paired with expanded transit capacity and safe cycling infrastructure.',
    ],
  },
  CC: {
    band6: [
      'Overall, the main trend is upward. In detail, the first category increases steadily over the period.',
      'In contrast, the second category remains stable, with only minor fluctuations.',
    ],
    band7: [
      'To begin with, the problem is driven by rising demand. As a result, prices increase and low-income groups are affected the most.',
      'Turning to solutions, governments can intervene through targeted subsidies and stricter regulation.',
    ],
    band8: [
      'Having established the cause, it is useful to consider the consequences, which extend beyond individuals to the wider economy.',
      'This progression from cause to impact clarifies why preventative action is more cost-effective than repair.',
    ],
  },
  LR: {
    band6: [
      'This approach is beneficial for society, but it can also create some problems.',
      'A major factor is the lack of resources in many areas.',
    ],
    band7: [
      'The proposal is economically viable, but its long-term sustainability depends on consistent enforcement.',
      'This shift has accelerated in recent years due to rapid technological adoption.',
    ],
    band8: [
      'The policy may inadvertently widen inequality by concentrating opportunities among those with existing advantages.',
      'A more nuanced strategy would prioritise early intervention while maintaining accountability for outcomes.',
    ],
  },
  GRA: {
    band6: [
      'If governments invest more, the quality will improve.',
      'People who live in cities often face higher costs.',
    ],
    band7: [
      'Although the measure is expensive initially, it can pay for itself over time through lower healthcare costs.',
      'Not only does this reduce emissions, but it also improves air quality in dense urban areas.',
    ],
    band8: [
      'Had the authorities acted earlier, the damage could have been reduced significantly.',
      'What matters most is whether the benefits outweigh the opportunity cost of alternative investments.',
    ],
  },
};

export const pickExample = (criterion: keyof CriterionExamples, band: number): string | null => {
  const bucket: BandKey =
    band >= 8 ? 'band8' : band >= 7 ? 'band7' : 'band6';

  const list = WRITING_EXAMPLES[criterion][bucket];
  return list?.[0] ?? null;
};
