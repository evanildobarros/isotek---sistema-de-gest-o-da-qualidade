-- Allow Super Admins to VIEW (SELECT) all companies
CREATE POLICY "Super Admins can view all companies" ON public.company_info
FOR SELECT
TO authenticated
USING (
    (EXISTS (SELECT 1 FROM public.profiles WHERE id = auth.uid() AND is_super_admin = true))
    OR
    (auth.jwt() ->> 'email' = 'evanildobarros@gmail.com')
);
