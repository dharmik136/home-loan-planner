-- Enable UUID extension
CREATE EXTENSION IF NOT EXISTS "uuid-ossp";

-- =========================================================================
-- 1. Profiles Table (Extends Supabase Auth)
-- =========================================================================
CREATE TABLE public.profiles (
    id UUID PRIMARY KEY REFERENCES auth.users(id) ON DELETE CASCADE,
    email VARCHAR(255) UNIQUE NOT NULL,
    full_name VARCHAR(255),
    role VARCHAR(50) DEFAULT 'user' CHECK (role IN ('user', 'advisor', 'admin')),
    subscription_tier VARCHAR(50) DEFAULT 'free' CHECK (subscription_tier IN ('free', 'subscriber', 'advisor_pro')),
    newsletter_subscriber BOOLEAN DEFAULT TRUE NOT NULL,
    lead_source VARCHAR(100),
    calculated_savings NUMERIC(12, 2) DEFAULT 0.00 NOT NULL,
    created_at TIMESTAMP WITH TIME ZONE DEFAULT TIMEZONE('utc'::text, NOW()) NOT NULL,
    updated_at TIMESTAMP WITH TIME ZONE DEFAULT TIMEZONE('utc'::text, NOW()) NOT NULL
);

-- =========================================================================
-- 2. Portfolios Table
-- =========================================================================
CREATE TABLE public.portfolios (
    id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
    owner_id UUID NOT NULL REFERENCES public.profiles(id) ON DELETE CASCADE,
    name VARCHAR(255) NOT NULL,
    is_client_portfolio BOOLEAN DEFAULT FALSE,
    client_email VARCHAR(255),
    extra_monthly_budget NUMERIC(12, 2) DEFAULT 0.00 NOT NULL,
    rollover_strategy VARCHAR(50) DEFAULT 'avalanche' CHECK (rollover_strategy IN ('avalanche', 'snowball', 'none')),
    created_at TIMESTAMP WITH TIME ZONE DEFAULT TIMEZONE('utc'::text, NOW()) NOT NULL,
    updated_at TIMESTAMP WITH TIME ZONE DEFAULT TIMEZONE('utc'::text, NOW()) NOT NULL
);

-- =========================================================================
-- 3. Loans Table
-- =========================================================================
CREATE TABLE public.loans (
    id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
    portfolio_id UUID NOT NULL REFERENCES public.portfolios(id) ON DELETE CASCADE,
    name VARCHAR(255) NOT NULL,
    loan_type VARCHAR(50) DEFAULT 'home' CHECK (loan_type IN ('home', 'car', 'education', 'personal', 'credit_card', 'custom')),
    bank_name VARCHAR(255),
    original_principal NUMERIC(12, 2) NOT NULL,
    outstanding_balance NUMERIC(12, 2) NOT NULL,
    interest_rate NUMERIC(5, 2) NOT NULL,
    tenure_months INTEGER NOT NULL,
    emi NUMERIC(12, 2),
    start_date DATE NOT NULL,
    pre_emi_interest NUMERIC(12, 2) DEFAULT 0.00 NOT NULL,
    prepayment_strategy VARCHAR(50) DEFAULT 'tenure_reduction' CHECK (prepayment_strategy IN ('tenure_reduction', 'emi_reduction')),
    rules_template VARCHAR(50) DEFAULT 'none' CHECK (rules_template IN ('hdfc', 'rbi_floating', 'custom_limits', 'none')),
    custom_min_prepayment NUMERIC(12, 2),
    created_at TIMESTAMP WITH TIME ZONE DEFAULT TIMEZONE('utc'::text, NOW()) NOT NULL,
    updated_at TIMESTAMP WITH TIME ZONE DEFAULT TIMEZONE('utc'::text, NOW()) NOT NULL
);

-- =========================================================================
-- 4. Prepayments Table (Manual entries/presets)
-- =========================================================================
CREATE TABLE public.prepayments (
    id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
    loan_id UUID NOT NULL REFERENCES public.loans(id) ON DELETE CASCADE,
    amount NUMERIC(12, 2) NOT NULL,
    month_index INTEGER NOT NULL CHECK (month_index >= 1),
    prepayment_type VARCHAR(50) DEFAULT 'one_time' CHECK (prepayment_type IN ('one_time', 'recurring_yearly', '13th_emi')),
    created_at TIMESTAMP WITH TIME ZONE DEFAULT TIMEZONE('utc'::text, NOW()) NOT NULL
);

-- =========================================================================
-- 5. Rate Changes Table (Floating rate schedules)
-- =========================================================================
CREATE TABLE public.rate_changes (
    id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
    loan_id UUID NOT NULL REFERENCES public.loans(id) ON DELETE CASCADE,
    new_rate NUMERIC(5, 2) NOT NULL,
    month_index INTEGER NOT NULL CHECK (month_index >= 1),
    created_at TIMESTAMP WITH TIME ZONE DEFAULT TIMEZONE('utc'::text, NOW()) NOT NULL
);

-- =========================================================================
-- 6. Windfalls Table
-- =========================================================================
CREATE TABLE public.windfalls (
    id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
    portfolio_id UUID NOT NULL REFERENCES public.portfolios(id) ON DELETE CASCADE,
    amount NUMERIC(12, 2) NOT NULL,
    month_index INTEGER NOT NULL CHECK (month_index >= 1),
    description VARCHAR(255),
    is_optimized BOOLEAN DEFAULT TRUE NOT NULL,
    manual_splits JSONB,
    created_at TIMESTAMP WITH TIME ZONE DEFAULT TIMEZONE('utc'::text, NOW()) NOT NULL
);

-- =========================================================================
-- 7. Transactions Table (Stripe payment logging)
-- =========================================================================
CREATE TABLE public.transactions (
    id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
    profile_id UUID REFERENCES public.profiles(id) ON DELETE SET NULL,
    amount NUMERIC(10, 2) NOT NULL,
    currency VARCHAR(10) DEFAULT 'INR' NOT NULL,
    stripe_payment_intent_id VARCHAR(255) UNIQUE,
    status VARCHAR(50) NOT NULL CHECK (status IN ('succeeded', 'failed', 'pending')),
    invoice_url TEXT,
    created_at TIMESTAMP WITH TIME ZONE DEFAULT TIMEZONE('utc'::text, NOW()) NOT NULL
);

-- =========================================================================
-- 8. Advisor Branding Table (B2B White-Label Configurations)
-- =========================================================================
CREATE TABLE public.advisor_branding (
    id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
    advisor_id UUID UNIQUE NOT NULL REFERENCES public.profiles(id) ON DELETE CASCADE,
    business_name VARCHAR(255),
    logo_url TEXT,
    primary_color VARCHAR(10) DEFAULT '#0f172a' NOT NULL,
    contact_email VARCHAR(255),
    contact_phone VARCHAR(50),
    website VARCHAR(255),
    disclaimer_text TEXT,
    created_at TIMESTAMP WITH TIME ZONE DEFAULT TIMEZONE('utc'::text, NOW()) NOT NULL,
    updated_at TIMESTAMP WITH TIME ZONE DEFAULT TIMEZONE('utc'::text, NOW()) NOT NULL
);

-- =========================================================================
-- 9. Report Exports Table (Logs of generated PDF report URLs)
-- =========================================================================
CREATE TABLE public.report_exports (
    id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
    portfolio_id UUID NOT NULL REFERENCES public.portfolios(id) ON DELETE CASCADE,
    generated_by UUID NOT NULL REFERENCES public.profiles(id) ON DELETE SET NULL,
    storage_path TEXT NOT NULL,
    file_size INTEGER,
    created_at TIMESTAMP WITH TIME ZONE DEFAULT TIMEZONE('utc'::text, NOW()) NOT NULL
);

-- =========================================================================
-- 10. Bank Prepayment Rules Table
-- =========================================================================
CREATE TABLE public.bank_prepayment_rules (
    id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
    bank_name VARCHAR(100) UNIQUE NOT NULL,
    min_prepayment_formula TEXT,
    max_prepayment_formula TEXT,
    yearly_cap_percent NUMERIC(5, 2),
    lock_in_months INTEGER DEFAULT 0 NOT NULL,
    floating_penalty_percent NUMERIC(5, 2) DEFAULT 0.00 NOT NULL,
    fixed_penalty_percent NUMERIC(5, 2) DEFAULT 2.00 NOT NULL,
    guidance_notes TEXT,
    updated_at TIMESTAMP WITH TIME ZONE DEFAULT TIMEZONE('utc'::text, NOW()) NOT NULL
);

-- =========================================================================
-- Triggers for Automatic updated_at Columns
-- =========================================================================
CREATE OR REPLACE FUNCTION public.handle_updated_at()
RETURNS TRIGGER AS $$
BEGIN
    NEW.updated_at = NOW();
    RETURN NEW;
END;
$$ LANGUAGE plpgsql;

CREATE TRIGGER update_profiles_updated_at
    BEFORE UPDATE ON public.profiles
    FOR EACH ROW
    EXECUTE FUNCTION public.handle_updated_at();

CREATE TRIGGER update_portfolios_updated_at
    BEFORE UPDATE ON public.portfolios
    FOR EACH ROW
    EXECUTE FUNCTION public.handle_updated_at();

CREATE TRIGGER update_loans_updated_at
    BEFORE UPDATE ON public.loans
    FOR EACH ROW
    EXECUTE FUNCTION public.handle_updated_at();

CREATE TRIGGER update_advisor_branding_updated_at
    BEFORE UPDATE ON public.advisor_branding
    FOR EACH ROW
    EXECUTE FUNCTION public.handle_updated_at();

CREATE TRIGGER update_bank_prepayment_rules_updated_at
    BEFORE UPDATE ON public.bank_prepayment_rules
    FOR EACH ROW
    EXECUTE FUNCTION public.handle_updated_at();

-- =========================================================================
-- Trigger to automatically create a profile when a new user signs up
-- =========================================================================
CREATE OR REPLACE FUNCTION public.handle_new_user()
RETURNS TRIGGER AS $$
BEGIN
    INSERT INTO public.profiles (id, email, full_name, role, subscription_tier)
    VALUES (
        NEW.id,
        NEW.email,
        COALESCE(NEW.raw_user_meta_data->>'full_name', NEW.raw_user_meta_data->>'name', ''),
        'user',
        'free'
    );
    RETURN NEW;
END;
$$ LANGUAGE plpgsql SECURITY DEFINER;

CREATE TRIGGER on_auth_user_created
    AFTER INSERT ON auth.users
    FOR EACH ROW EXECUTE FUNCTION public.handle_new_user();

-- =========================================================================
-- Row-Level Security (RLS) Policies
-- =========================================================================
ALTER TABLE public.profiles ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.portfolios ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.loans ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.prepayments ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.rate_changes ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.windfalls ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.transactions ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.advisor_branding ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.report_exports ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.bank_prepayment_rules ENABLE ROW LEVEL SECURITY;

-- 1. Profiles RLS
CREATE POLICY "Allow public read profile metadata" ON public.profiles FOR SELECT USING (true);
CREATE POLICY "Users can edit own profile" ON public.profiles FOR UPDATE USING (auth.uid() = id);
CREATE POLICY "Users can insert own profile" ON public.profiles FOR INSERT WITH CHECK (auth.uid() = id);

-- 2. Portfolios RLS
CREATE POLICY "Portfolios visible to owner" ON public.portfolios FOR SELECT USING (auth.uid() = owner_id);
CREATE POLICY "Portfolios writeable by owner" ON public.portfolios FOR ALL USING (auth.uid() = owner_id) WITH CHECK (auth.uid() = owner_id);

-- 3. Loans RLS
CREATE POLICY "Loans visible to portfolio owner" ON public.loans FOR SELECT USING (
    EXISTS (
        SELECT 1 FROM public.portfolios 
        WHERE portfolios.id = loans.portfolio_id 
        AND portfolios.owner_id = auth.uid()
    )
);
CREATE POLICY "Loans writeable by portfolio owner" ON public.loans FOR ALL USING (
    EXISTS (
        SELECT 1 FROM public.portfolios 
        WHERE portfolios.id = loans.portfolio_id 
        AND portfolios.owner_id = auth.uid()
    )
) WITH CHECK (
    EXISTS (
        SELECT 1 FROM public.portfolios 
        WHERE portfolios.id = loans.portfolio_id 
        AND portfolios.owner_id = auth.uid()
    )
);

-- 4. Prepayments RLS
CREATE POLICY "Prepayments visible to loan owner" ON public.prepayments FOR SELECT USING (
    EXISTS (
        SELECT 1 FROM public.loans 
        JOIN public.portfolios ON portfolios.id = loans.portfolio_id
        WHERE loans.id = prepayments.loan_id 
        AND portfolios.owner_id = auth.uid()
    )
);
CREATE POLICY "Prepayments writeable by loan owner" ON public.prepayments FOR ALL USING (
    EXISTS (
        SELECT 1 FROM public.loans 
        JOIN public.portfolios ON portfolios.id = loans.portfolio_id
        WHERE loans.id = prepayments.loan_id 
        AND portfolios.owner_id = auth.uid()
    )
) WITH CHECK (
    EXISTS (
        SELECT 1 FROM public.loans 
        JOIN public.portfolios ON portfolios.id = loans.portfolio_id
        WHERE loans.id = prepayments.loan_id 
        AND portfolios.owner_id = auth.uid()
    )
);

-- 5. Rate Changes RLS
CREATE POLICY "Rate changes visible to loan owner" ON public.rate_changes FOR SELECT USING (
    EXISTS (
        SELECT 1 FROM public.loans 
        JOIN public.portfolios ON portfolios.id = loans.portfolio_id
        WHERE loans.id = rate_changes.loan_id 
        AND portfolios.owner_id = auth.uid()
    )
);
CREATE POLICY "Rate changes writeable by loan owner" ON public.rate_changes FOR ALL USING (
    EXISTS (
        SELECT 1 FROM public.loans 
        JOIN public.portfolios ON portfolios.id = loans.portfolio_id
        WHERE loans.id = rate_changes.loan_id 
        AND portfolios.owner_id = auth.uid()
    )
) WITH CHECK (
    EXISTS (
        SELECT 1 FROM public.loans 
        JOIN public.portfolios ON portfolios.id = loans.portfolio_id
        WHERE loans.id = rate_changes.loan_id 
        AND portfolios.owner_id = auth.uid()
    )
);

-- 6. Windfalls RLS
CREATE POLICY "Windfalls visible to portfolio owner" ON public.windfalls FOR SELECT USING (
    EXISTS (
        SELECT 1 FROM public.portfolios 
        WHERE portfolios.id = windfalls.portfolio_id 
        AND portfolios.owner_id = auth.uid()
    )
);
CREATE POLICY "Windfalls writeable by portfolio owner" ON public.windfalls FOR ALL USING (
    EXISTS (
        SELECT 1 FROM public.portfolios 
        WHERE portfolios.id = windfalls.portfolio_id 
        AND portfolios.owner_id = auth.uid()
    )
) WITH CHECK (
    EXISTS (
        SELECT 1 FROM public.portfolios 
        WHERE portfolios.id = windfalls.portfolio_id 
        AND portfolios.owner_id = auth.uid()
    )
);

-- 7. Transactions RLS
CREATE POLICY "Transactions visible to profile owner" ON public.transactions FOR SELECT USING (auth.uid() = profile_id);
CREATE POLICY "Transactions manageable by profile owner" ON public.transactions FOR ALL USING (auth.uid() = profile_id) WITH CHECK (auth.uid() = profile_id);

-- 8. Advisor Branding RLS
CREATE POLICY "Advisor branding visible to anyone" ON public.advisor_branding FOR SELECT USING (true);
CREATE POLICY "Advisor branding manageable by advisor" ON public.advisor_branding FOR ALL USING (auth.uid() = advisor_id) WITH CHECK (auth.uid() = advisor_id);

-- 9. Report Exports RLS
CREATE POLICY "Report exports visible to portfolio owner or generator" ON public.report_exports FOR SELECT USING (
    auth.uid() = generated_by OR 
    EXISTS (
        SELECT 1 FROM public.portfolios 
        WHERE portfolios.id = report_exports.portfolio_id 
        AND portfolios.owner_id = auth.uid()
    )
);
CREATE POLICY "Report exports manageable by portfolio owner or generator" ON public.report_exports FOR ALL USING (
    auth.uid() = generated_by OR 
    EXISTS (
        SELECT 1 FROM public.portfolios 
        WHERE portfolios.id = report_exports.portfolio_id 
        AND portfolios.owner_id = auth.uid()
    )
) WITH CHECK (
    auth.uid() = generated_by OR 
    EXISTS (
        SELECT 1 FROM public.portfolios 
        WHERE portfolios.id = report_exports.portfolio_id 
        AND portfolios.owner_id = auth.uid()
    )
);

-- 10. Bank Prepayment Rules RLS
CREATE POLICY "Bank rules visible to anyone" ON public.bank_prepayment_rules FOR SELECT USING (true);

-- =========================================================================
-- Performance Indexes
-- =========================================================================
CREATE INDEX idx_portfolios_owner_id ON public.portfolios(owner_id);
CREATE INDEX idx_loans_portfolio_id ON public.loans(portfolio_id);
CREATE INDEX idx_prepayments_loan_id ON public.prepayments(loan_id);
CREATE INDEX idx_rate_changes_loan_id ON public.rate_changes(loan_id);
CREATE INDEX idx_windfalls_portfolio_id ON public.windfalls(portfolio_id);
CREATE INDEX idx_transactions_profile_id ON public.transactions(profile_id);
CREATE INDEX idx_advisor_branding_advisor_id ON public.advisor_branding(advisor_id);
CREATE INDEX idx_report_exports_portfolio_id ON public.report_exports(portfolio_id);
CREATE INDEX idx_report_exports_generated_by ON public.report_exports(generated_by);
