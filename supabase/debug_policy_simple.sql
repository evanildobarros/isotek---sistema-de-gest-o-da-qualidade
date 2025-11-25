-- Simplify the SELECT policy to be extremely direct for debugging
DROP POLICY IF EXISTS "Super Admins can view all companies" ON public.company_info;

CREATE POLICY "Super Admins can view all companies" ON public.company_info
FOR SELECT
TO authenticated
USING (
    auth.jwt() ->> 'email' = 'evanildobarros@gmail.com'
);
