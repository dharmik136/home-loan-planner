# The Prepayment Ledger: Free Lead Magnet & Customer Data Capture Strategy

This document details the product strategy pivot transitioning **The Prepayment Ledger** from a paid commercial SaaS utility into a **100% Free Lead Magnet, Educational Utility, and Customer Database Builder**.

---

## 💡 1. Pivot Strategy & Value Proposition

### The Pivot Philosophy
Indian B2C users demonstrate high payment resistance for single-purpose personal finance utility calculators. However, they are highly motivated to optimize their mortgages. By removing the payment gate entirely:
1. **Viral Coefficient Expansion**: The tool can spread organically through personal finance subreddits, LinkedIn, and WhatsApp groups without transaction drop-offs.
2. **Data Asset Accumulation**: The primary B2C business asset transitions from micro-transactions (₹499/₹999) to a **highly qualified, high-intent database of home-loan borrowers**.
3. **Downstream Monetization**: A database of home-loan borrowers (with details like outstanding balance, current interest rates, and loan age) is highly valuable for partner channels (unbiased refinancing brokers, tax planning, wealth managers, and premium B2B advisor directories).

---

## 🔄 2. Customer Lead Capture Funnel

The "Fake Door" paywall has been refactored into a **Data Capture Wall**:

```
+-------------------------------------------------------------+
|                     LEAD CAPTURE FUNNEL                     |
+-------------------------------------------------------------+
|                                                             |
|  1. Free Calculator & Multi-Loan Rollover (Interactive UI)  |
|     - Zero friction. User adds loans and runs simulations.  |
|                                                             |
|  2. Value Revelation (Milestones & Stacked Chart)           |
|     - User sees that prepayments save ₹15 Lakhs.            |
|                                                             |
|  3. The Data Capture Gate (Save Plan / PDF Export)          |
|     - User clicks "Save Plan & Get PDF (Free)"              |
|     - Prompts for Email address to save plan and generate   |
|       their printable Debt-Free Blueprint.                  |
|                                                             |
|  4. Customer Database Entry                                 |
|     - Email, loan portfolio parameters, and newsletter      |
|       opt-in are synced to the Supabase database.           |
|                                                             |
+-------------------------------------------------------------+
```

---

## 🗄️ 3. Database Updates for Lead Generation

Under the free lead-magnet model, the `public.profiles` and `public.transactions` schemas adapt to capture subscriber metadata:

```sql
-- Extend public.profiles to track lead capture attributes
ALTER TABLE public.profiles 
  ADD COLUMN IF NOT EXISTS newsletter_subscriber BOOLEAN DEFAULT TRUE NOT NULL,
  ADD COLUMN IF NOT EXISTS lead_source VARCHAR(100),
  ADD COLUMN IF NOT EXISTS calculated_savings NUMERIC(12, 2) DEFAULT 0.00;

-- Drop subscription check constraints (since premium features are now unlocked)
ALTER TABLE public.profiles 
  DROP CONSTRAINT IF EXISTS profiles_subscription_tier_check;

ALTER TABLE public.profiles 
  ADD CONSTRAINT profiles_subscription_tier_check 
  CHECK (subscription_tier IN ('free', 'subscriber', 'advisor_pro'));
```

* **Lead Profiling**: Saving the user's estimated interest savings (`calculated_savings`) allows you to segment your email database: e.g., targeting users with over ₹10 Lakhs in potential savings with specific refinancing advisory offers.

---

## 📈 4. Growth & Educational Drip Loops

Once an email is captured, the 5-stage welcome sequence (detailed in the [Copywriting Playbook](file:///C:/Users/Dharmik%20Shingala/HomeLoan-Planner/docs/MVP-PRODUCT-PROPOSAL.md)) triggers automatically:

* **Email 1: Onboarding**: Guides the user to return to their saved dashboard.
* **Email 2: Educational**: Explains the math behind why 50/50 windfall splits leak money, establishing analytical authority.
* **Email 3: Mindset**: Encourages comparison between Avalanche and Snowball.
* **Email 4: Rule Navigations**: Details how to bypass lender prepayment operational friction.
* **Email 5: Refinance Hook**: Introduces how to evaluate balance transfers if their interest rate exceeds market averages.
