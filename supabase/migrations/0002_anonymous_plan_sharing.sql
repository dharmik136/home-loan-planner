-- Anonymous share links use an opaque token instead of exposing the lead table.
ALTER TABLE public.lead_captures
    ADD COLUMN IF NOT EXISTS share_token UUID NOT NULL DEFAULT uuid_generate_v4();

CREATE UNIQUE INDEX IF NOT EXISTS idx_lead_captures_share_token
    ON public.lead_captures(share_token);

DROP POLICY IF EXISTS "Anyone can read lead captures by ID" ON public.lead_captures;

CREATE OR REPLACE FUNCTION public.get_shared_plan(p_share_token UUID)
RETURNS JSONB
LANGUAGE sql
SECURITY DEFINER
SET search_path = public
AS $$
    SELECT portfolio_snapshot
    FROM public.lead_captures
    WHERE share_token = p_share_token
    LIMIT 1;
$$;

REVOKE ALL ON FUNCTION public.get_shared_plan(UUID) FROM PUBLIC;
GRANT EXECUTE ON FUNCTION public.get_shared_plan(UUID) TO anon, authenticated;
