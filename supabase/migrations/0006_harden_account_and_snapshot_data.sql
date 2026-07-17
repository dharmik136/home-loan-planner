-- Close privilege/payment write paths and bound anonymous snapshot retention.

-- Users may edit presentation/consent fields, but never grant themselves a
-- paid tier or privileged role. Service-role operations bypass these grants.
REVOKE UPDATE ON public.profiles FROM authenticated;
GRANT UPDATE (full_name, newsletter_subscriber) ON public.profiles TO authenticated;
DROP POLICY IF EXISTS "Users can insert own profile" ON public.profiles;
REVOKE INSERT ON public.profiles FROM authenticated;

-- Payment status is written only by trusted server/webhook code. Account
-- owners retain read access through the existing SELECT policy.
DROP POLICY IF EXISTS "Transactions manageable by profile owner" ON public.transactions;
REVOKE INSERT, UPDATE, DELETE ON public.transactions FROM anon, authenticated;

-- ON DELETE SET NULL must target a nullable column.
ALTER TABLE public.report_exports
    ALTER COLUMN generated_by DROP NOT NULL;

-- Consent is opt-in for both authenticated profiles and anonymous snapshots.
ALTER TABLE public.profiles
    ALTER COLUMN newsletter_subscriber SET DEFAULT FALSE;

ALTER TABLE public.lead_captures
    ALTER COLUMN newsletter_subscriber SET DEFAULT FALSE,
    ADD COLUMN IF NOT EXISTS expires_at TIMESTAMP WITH TIME ZONE
        NOT NULL DEFAULT (NOW() + INTERVAL '90 days');

-- Enforce practical bounds at the database boundary. NOT VALID avoids blocking
-- deployment if historical rows need cleanup while still checking new writes.
ALTER TABLE public.loans
    ADD CONSTRAINT loans_positive_values CHECK (
        original_principal > 0
        AND outstanding_balance >= 0
        AND interest_rate >= 0
        AND interest_rate <= 100
        AND tenure_months > 0
        AND tenure_months <= 600
        AND (emi IS NULL OR emi > 0)
        AND pre_emi_interest >= 0
        AND (custom_min_prepayment IS NULL OR custom_min_prepayment >= 0)
    ) NOT VALID;

ALTER TABLE public.prepayments
    ADD CONSTRAINT prepayments_positive_amount CHECK (amount > 0) NOT VALID;

ALTER TABLE public.rate_changes
    ADD CONSTRAINT rate_changes_valid_rate CHECK (new_rate >= 0 AND new_rate <= 100) NOT VALID;

ALTER TABLE public.windfalls
    ADD CONSTRAINT windfalls_positive_amount CHECK (amount > 0) NOT VALID;

ALTER TABLE public.transactions
    ADD CONSTRAINT transactions_positive_amount CHECK (amount > 0) NOT VALID;

ALTER TABLE public.report_exports
    ADD CONSTRAINT report_exports_valid_file_size CHECK (file_size IS NULL OR file_size >= 0) NOT VALID;

ALTER TABLE public.lead_captures
    ADD CONSTRAINT lead_captures_valid_email CHECK (
        char_length(email) BETWEEN 3 AND 255
        AND position('@' IN email) > 1
    ) NOT VALID,
    ADD CONSTRAINT lead_captures_savings_bounds CHECK (
        calculated_savings >= 0 AND calculated_savings <= 1000000000
    ) NOT VALID,
    ADD CONSTRAINT lead_captures_snapshot_size CHECK (
        portfolio_snapshot IS NULL
        OR octet_length(portfolio_snapshot::text) <= 250000
    ) NOT VALID;

CREATE INDEX IF NOT EXISTS idx_lead_captures_expires_at
    ON public.lead_captures(expires_at);

-- Expired opaque links stop resolving even before scheduled cleanup removes
-- their underlying rows.
CREATE OR REPLACE FUNCTION public.get_shared_plan(p_share_token UUID)
RETURNS JSONB
LANGUAGE sql
SECURITY DEFINER
SET search_path = public
AS $$
    SELECT portfolio_snapshot
    FROM public.lead_captures
    WHERE share_token = p_share_token
      AND expires_at > NOW()
    LIMIT 1;
$$;

REVOKE ALL ON FUNCTION public.get_shared_plan(UUID) FROM PUBLIC;
GRANT EXECUTE ON FUNCTION public.get_shared_plan(UUID) TO anon, authenticated;
