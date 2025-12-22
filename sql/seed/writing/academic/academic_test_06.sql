-- Academic Writing Test 06
-- Task 1: map | Task 2: problem–solution

with upsert_test as (
  insert into public.writing_tests (slug, title, description, duration_seconds, is_active)
  values (
    'writing-academic-06',
    'Academic Writing Test 06',
    'Academic module: map comparison task 1 + problem–solution essay task 2',
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
      'The maps below show the layout of Greenbank Park in 1990 and today. Summarise the information by selecting and reporting the main changes.',
      150
    ),
    (
      2,
      'Many cities are facing a shortage of affordable housing. What are the causes of this problem? What measures can governments and communities take to address it?',
      250
    )
  ) as t(task_number, prompt, word_limit_min)
on conflict (test_id, task_number) do update
  set prompt = excluded.prompt,
      word_limit_min = excluded.word_limit_min;
