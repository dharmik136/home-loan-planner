-- Advisor contact fields are PII and must not be enumerable through the REST API.
DROP POLICY IF EXISTS "Advisor branding visible to anyone" ON public.advisor_branding;

CREATE POLICY "Advisors can read own branding" ON public.advisor_branding
    FOR SELECT
    USING (auth.uid() = advisor_id);
