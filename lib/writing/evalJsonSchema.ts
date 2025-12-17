export const WritingEvaluationJsonSchema = {
  type: 'object',
  additionalProperties: false,
  required: [
    'confidence_level',
    'evaluation_version',
    'overall_band',
    'task1_band',
    'task2_band',
    'task1_tr',
    'task1_cc',
    'task1_lr',
    'task1_gra',
    'task2_tr',
    'task2_cc',
    'task2_lr',
    'task2_gra',
    'strengths',
    'weaknesses',
    'improvement_actions',
    'warnings',
  ],
  properties: {
    confidence_level: { type: 'string', enum: ['low', 'medium', 'high'] },
    evaluation_version: { type: 'string', minLength: 3 },

    overall_band: { type: 'number', minimum: 0, maximum: 9, multipleOf: 0.5 },
    task1_band: { type: ['number', 'null'], minimum: 0, maximum: 9, multipleOf: 0.5 },
    task2_band: { type: 'number', minimum: 0, maximum: 9, multipleOf: 0.5 },

    task1_tr: { type: ['number', 'null'], minimum: 0, maximum: 9, multipleOf: 0.5 },
    task1_cc: { type: ['number', 'null'], minimum: 0, maximum: 9, multipleOf: 0.5 },
    task1_lr: { type: ['number', 'null'], minimum: 0, maximum: 9, multipleOf: 0.5 },
    task1_gra: { type: ['number', 'null'], minimum: 0, maximum: 9, multipleOf: 0.5 },

    task2_tr: { type: 'number', minimum: 0, maximum: 9, multipleOf: 0.5 },
    task2_cc: { type: 'number', minimum: 0, maximum: 9, multipleOf: 0.5 },
    task2_lr: { type: 'number', minimum: 0, maximum: 9, multipleOf: 0.5 },
    task2_gra: { type: 'number', minimum: 0, maximum: 9, multipleOf: 0.5 },

    strengths: { type: 'string', minLength: 5 },
    weaknesses: { type: 'string', minLength: 5 },
    improvement_actions: { type: 'string', minLength: 5 },

    warnings: { type: 'array', items: { type: 'string' } },
  },
} as const;
