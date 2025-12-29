-- Grant VIP plan to a specific user for full feature testing
-- Safe to re-run: uses INSERT ... ON CONFLICT to upsert the user_plans row

insert into public.user_plans (user_id, plan_id, status, activated_at, expires_at, payment_method, metadata)
select 
  '7dfab25b-3ef0-44ee-a418-12245e37b919'::uuid as user_id,
  p.id as plan_id,
  'active'::text as status,
  timezone('utc', now()) as activated_at,
  null::timestamptz as expires_at,
  'manual'::text as payment_method,
  coalesce(
    jsonb_build_object(
      'granted_for', 'full_feature_testing',
      'granted_by', 'cli_script'
    ),
    '{}'::jsonb
  ) as metadata
from public.plans p
where p.code = 'VIP'
on conflict (user_id) do update
set
  plan_id = excluded.plan_id,
  status = 'active',
  expires_at = null,
  payment_method = 'manual',
  metadata = coalesce(user_plans.metadata, '{}'::jsonb) || jsonb_build_object(
    'last_updated_for', 'full_feature_testing'
  );


