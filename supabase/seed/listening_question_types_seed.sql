-- supabase/seed/listening_question_types_seed.sql
-- Seed canonical IELTS Listening question types.

insert into public.listening_question_types (
  key,
  label,
  description,
  difficulty,
  is_active,
  order_index,
  tags
)
values
  (
    'short_answer',
    'Short answer / sentence completion',
    'Fill a word or short phrase into a sentence or question. Spelling and tiny details matter.',
    'intermediate',
    true,
    10,
    array['core', 'completion', 'spelling']
  ),
  (
    'multiple_choice_single',
    'Multiple-choice (one answer)',
    'Choose one correct option from A–C / A–D. Classic IELTS Listening trap zone.',
    'intermediate',
    true,
    20,
    array['mcq', 'single', 'options']
  ),
  (
    'multiple_choice_multiple',
    'Multiple-choice (multiple answers)',
    'Choose two or three answers from a larger set. Easy way to lose 2–3 marks in one shot.',
    'advanced',
    true,
    30,
    array['mcq', 'multiple', 'options']
  ),
  (
    'matching',
    'Matching',
    'Match options (people, places, opinions) to a list. Tests tracking of references over time.',
    'intermediate',
    true,
    40,
    array['matching', 'mapping']
  ),
  (
    'map_diagram',
    'Map / diagram labelling',
    'Label a map or diagram based on directions and descriptions.',
    'advanced',
    true,
    50,
    array['map', 'diagram', 'visual']
  ),
  (
    'form_notes_completion',
    'Form / notes / table completion',
    'Complete forms, notes, or tables with missing information. Heavy on spelling and detail.',
    'intermediate',
    true,
    60,
    array['completion', 'forms', 'notes']
  )
on conflict (key) do update
set
  label = excluded.label,
  description = excluded.description,
  difficulty = excluded.difficulty,
  is_active = excluded.is_active,
  order_index = excluded.order_index,
  tags = excluded.tags;
