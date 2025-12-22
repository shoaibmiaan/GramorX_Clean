-- General Training Writing Test 05
-- Task 1: request/inquiry letter | Task 2: two-part question

with upsert_test as (
  insert into public.writing_tests (slug, title, description, duration_seconds, is_active)
  values (
    'writing-general-05',
    'General Training Writing Test 05',
    'General module: inquiry letter task 1 + two-part question essay task 2',
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
      'You plan to volunteer at your city''s annual book festival but need more information. Write a letter to the festival coordinator. In your letter:\n- introduce yourself and your interest in volunteering\n- ask about the roles available and required hours\n- inquire about any training or preparation needed',
      150
    ),
    (
      2,
      'Many people now change careers several times during their working life. Why do you think this happens? Do you think this is a positive or negative development?',
      250
    )
  ) as t(task_number, prompt, word_limit_min)
on conflict (test_id, task_number) do update
  set prompt = excluded.prompt,
      word_limit_min = excluded.word_limit_min;
