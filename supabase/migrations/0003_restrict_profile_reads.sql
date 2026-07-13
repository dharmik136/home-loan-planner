-- Profiles contain PII and must never be readable by anonymous users or peers.
DROP POLICY IF EXISTS "Allow public read profile metadata" ON public.profiles;

CREATE POLICY "Users can read own profile" ON public.profiles
    FOR SELECT
    USING (auth.uid() = id);
