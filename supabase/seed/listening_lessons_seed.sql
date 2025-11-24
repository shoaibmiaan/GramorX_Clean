-- supabase/seed/listening_lessons_seed.sql
-- Seed data for Listening lessons (used by /listening/learn pages).

insert into public.listening_lessons (
  slug,
  title,
  level,
  estimated_minutes,
  lesson_type,
  is_published,
  is_popular,
  order_index,
  tags,
  content
)
values
  (
    'listening-basics-active-listening',
    'Active Listening Fundamentals',
    'beginner',
    12,
    'strategy',
    true,
    true,
    10,
    array['basics', 'focus', 'question-type:general'],
    $CONTENT$
Most IELTS Listening failures are not "English" problems. They are focus problems.

In this lesson, you will learn:
- How to listen in short bursts instead of zoning out for whole sections.
- Why you should NEVER read all the options at once.
- A simple way to reset your brain in the 30 seconds they give you before each section.

Key ideas:
1) Focus in waves, not all-or-nothing.
2) Use question keywords as anchors.
3) Accept that you will miss small details sometimes. Don’t let that ruin the whole section.$CONTENT$
  ),
  (
    'listening-mcq-strategy',
    'Multiple-choice strategy (MCQ)',
    'intermediate',
    15,
    'question_type',
    true,
    true,
    20,
    array['mcq', 'question-type', 'question-type:multiple_choice'],
    $CONTENT$
Multiple-choice questions are dangerous because they look easy and kill your band quietly.

In this lesson, you will:
- Learn how to use "pre-listening elimination" to kill 1–2 wrong options before audio starts.
- See why you should NOT try to remember the exact wording of each option.
- Practice matching meaning, not exact words.

Key steps:
1) Underline keywords + numbers in questions.
2) Decide which options are obviously wrong from logic.
3) During the audio, listen for meaning that matches an option, not the same words.$CONTENT$
  ),
  (
    'listening-form-notes-completion',
    'Form / notes completion',
    'intermediate',
    12,
    'question_type',
    true,
    false,
    30,
    array['form_completion', 'notes', 'question-type:completion'],
    $CONTENT$
Form and notes completion questions punish:
- spelling,
- numbers,
- and tiny details.

In this lesson, you will:
- Learn how to scan the form BEFORE the audio even starts.
- Predict what type of word will fill each gap (number, noun, adjective, etc).
- Build the habit of writing short, clean answers with correct spelling.

Habit:
Every time you see a gap, ask: "What kind of word fits here?" before you hear anything.$CONTENT$
  ),
  (
    'listening-map-diagram',
    'Maps and diagrams',
    'advanced',
    14,
    'question_type',
    true,
    false,
    40,
    array['map', 'diagram', 'question-type:map'],
    $CONTENT$
Maps and diagrams test your ability to:
- keep track of position,
- follow directions,
- not panic when the speaker moves fast.

In this lesson:
- You will learn to fix one simple rule: always know where "you" are standing on the map.
- You will train your brain to translate "go past", "opposite", and "next to" into movement on the diagram.

The trick:
Imagine you are physically walking with the speaker on the map, not watching from above like a drone.$CONTENT$
  ),
  (
    'listening-section-4-survival',
    'Section 4 survival kit',
    'advanced',
    18,
    'strategy',
    true,
    true,
    50,
    array['section4', 'lecture', 'question-type:general'],
    $CONTENT$
Section 4 feels brutal because:
- it is one long monologue,
- the pace is higher,
- there are no breaks between questions.

In this lesson:
- You will learn how to create a mini note-taking system that works under pressure.
- You will see how to use question numbers as "checkpoints" during the audio.
- You will practice not freezing when you miss one answer.

Rule:
If you miss one question, let it die. Do NOT chase it while 3 new answers pass you by.$CONTENT$
  )
on conflict (slug) do update
set
  title = excluded.title,
  level = excluded.level,
  estimated_minutes = excluded.estimated_minutes,
  lesson_type = excluded.lesson_type,
  is_published = excluded.is_published,
  is_popular = excluded.is_popular,
  order_index = excluded.order_index,
  tags = excluded.tags,
  content = excluded.content;
