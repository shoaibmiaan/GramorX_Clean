-- Academic Writing Test 05
-- Task 1: process | Task 2: discussion (both views)

with upsert_test as (
  insert into public.writing_tests (slug, title, description, duration_seconds, is_active)
  values (
    'writing-academic-05',
    'Academic Writing Test 05',
    'Academic module: process diagram task 1 + discussion essay task 2',
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
      'The diagram shows the stages involved in producing bottled spring water. Summarise the information by selecting and reporting the main features, and make comparisons where relevant.',
      150
    ),
    (
      2,
      'Some people say that government investment in the arts is a waste of money, while others believe it is essential for a well-functioning society. Discuss both views and give your own opinion.',
      250
    )
  ) as t(task_number, prompt, word_limit_min)
on conflict (test_id, task_number) do update
  set prompt = excluded.prompt,
      word_limit_min = excluded.word_limit_min;
