-- Academic Writing Test 04
-- Task 1: chart | Task 2: opinion

with upsert_test as (
  insert into public.writing_tests (slug, title, description, duration_seconds, is_active)
  values (
    'writing-academic-04',
    'Academic Writing Test 04',
    'Academic module: chart task 1 + opinion essay task 2',
    3600,
    true
  )
  on conflict (slug) do update
    set title = excluded.title,
        description = excluded.description,
        duration_seconds = excluded.duration_seconds,
        is_active = excluded.is_active
  returning id
)
insert into public.writing_tasks (test_id, task_number, prompt, word_limit_min)
select
  upsert_test.id,
  task_number,
  prompt,
  word_limit_min
from upsert_test,
  (values
    (
      1,
      'The bar chart below shows the percentage of household energy that came from renewable sources in five countries in 2005 and 2025. Summarise the information by selecting and reporting the main features, and make comparisons where relevant.',
      150
    ),
    (
      2,
      'Some people believe universities should prioritise academic research, while others think teaching practical job skills is more important. To what extent do you agree or disagree?',
      250
    )
  ) as t(task_number, prompt, word_limit_min)
on conflict (test_id, task_number) do update
  set prompt = excluded.prompt,
      word_limit_min = excluded.word_limit_min;
