alter table profiles
add column if not exists preferences jsonb default '{"email_notifications": true, "two_factor_enabled": false}'::jsonb;
