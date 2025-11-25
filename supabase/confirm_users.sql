-- Confirm all users (Fix for "Login Failed" on new accounts)
UPDATE auth.users
SET email_confirmed_at = now()
WHERE email_confirmed_at IS NULL;
