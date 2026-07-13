-- Security-advisor hardening:
-- 1) Pin search_path on trigger functions (function_search_path_mutable).
-- 2) Drop anon/authenticated EXECUTE on SECURITY DEFINER trigger functions;
--    they are only ever invoked by triggers, never via the REST API.
--    get_shared_plan keeps its anon grant on purpose - that is the share-link feature.

ALTER FUNCTION public.handle_updated_at() SET search_path = public;
ALTER FUNCTION public.handle_new_user() SET search_path = public;

REVOKE EXECUTE ON FUNCTION public.handle_new_user() FROM PUBLIC, anon, authenticated;

-- rls_auto_enable exists only on the hosted project (created outside migrations),
-- so guard the revoke for fresh local databases.
DO $$
BEGIN
    IF EXISTS (
        SELECT 1
        FROM pg_proc p
        JOIN pg_namespace n ON n.oid = p.pronamespace
        WHERE n.nspname = 'public' AND p.proname = 'rls_auto_enable'
    ) THEN
        REVOKE EXECUTE ON FUNCTION public.rls_auto_enable() FROM PUBLIC, anon, authenticated;
    END IF;
END $$;
