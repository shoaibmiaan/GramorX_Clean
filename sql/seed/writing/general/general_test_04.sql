-- General Training Writing Test 04
-- Task 1: complaint letter | Task 2: advantages–disadvantages

with upsert_test as (
  insert into public.writing_tests (slug, title, description, duration_seconds, is_active)
  values (
    'writing-general-04',
    'General Training Writing Test 04',
    'General module: complaint letter task 1 + advantages/disadvantages essay task 2',
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
      'You recently joined a local gym but several pieces of equipment are often broken and classes start late. Write a letter to the gym manager. In your letter:\n- describe the problems you have experienced\n- explain how these issues have affected you\n- say what you would like the gym to do',
      150
    ),
    (
      2,
      'More people are choosing to shop online rather than in local stores. Discuss the advantages and disadvantages of this trend and give your own opinion.',
      250
    )
  ) as t(task_number, prompt, word_limit_min)
on conflict (test_id, task_number) do update
  set prompt = excluded.prompt,
      word_limit_min = excluded.word_limit_min;
