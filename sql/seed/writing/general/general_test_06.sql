-- General Training Writing Test 06
-- Task 1: advice/apology/arrangement letter | Task 2: cause–effect analysis

with upsert_test as (
  insert into public.writing_tests (slug, title, description, duration_seconds, is_active)
  values (
    'writing-general-06',
    'General Training Writing Test 06',
    'General module: arrangement/apology letter task 1 + cause–effect essay task 2',
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
      'A friend will stay at your apartment while you are away for a week. Write a letter to your friend. In your letter:\n- apologise for not being there to greet them\n- give instructions about using key appliances and caring for your plants\n- suggest activities nearby and explain how to contact you in an emergency',
      150
    ),
    (
      2,
      'In many cities, younger people are moving away from small towns to work in large urban areas. What are the causes of this trend? What effects does it have on the communities they leave behind?',
      250
    )
  ) as t(task_number, prompt, word_limit_min)
on conflict (test_id, task_number) do update
  set prompt = excluded.prompt,
      word_limit_min = excluded.word_limit_min;
