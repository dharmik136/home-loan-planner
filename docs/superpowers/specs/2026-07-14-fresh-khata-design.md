# Fresh Khata — a DESIGN.md for The Prepayment Ledger

**Status:** approved 2026-07-14. Implementation in progress.

## Why this exists

The Next.js rewrite of the Home Loan Prepayment Planner shipped with two unrelated visual languages: a broadsheet-ledger theme on the planner/calculator pages (warm paper, emerald/clay/gold ink accents) and a generic blue-SaaS marketing skin on the landing/pricing/about pages ("Become debt-free years faster", gradient hero, muted-grey cards). This spec unifies both into one design system, authored as a [DESIGN.md](https://github.com/google-labs-code/design.md) file per the format spec cloned to `dev/design.md`, and applies it across the whole app — including a copy-voice pass so the words match the world, not just the pixels.

## Reference concept

**The Bahi-khata** — the red-cloth-bound Indian merchant ledger, opened fresh every Diwali (Chopda Pujan) as a promise of honest bookkeeping. Chosen after the user's own stated goal ("something which has to do with authenticity and should look like we can trust this") was translated from an adjective into a concrete object, per the DESIGN.md philosophy: *a specific reference carries more than a list of adjectives.*

Execution approach: **restrained, with earned ornament** (not fully ornate, not fully austere). Ceremonial detail — red accents, the ink stamp, a gold rule — appears only at moments that have earned it: the masthead, the primary action, the debt-free milestone. Everywhere else stays quiet and scannable, because this is a dense, form- and table-heavy financial tool, not a poster.

## Decisions locked during brainstorming

| Area | Decision |
|---|---|
| Dark mode | Reimagined as "lamplight" — doing the books by lamp at night, warm amber/ember on deep maroon-brown. Never a cold blue-grey dashboard. |
| Semantic color | Green stays "saved" (universal convention, load-bearing across existing charts/cards). "Cost/interest paid" moves off red onto a muted iron-brown. Red is reserved for the ledger's own ceremonial accent (masthead, primary actions, the milestone stamp) — it never means "bad news." A separate burnt-rust `warn` color carries real form/validation errors, kept apart from both `cost` and `cloth-red`. |
| Copy voice | Rewritten to match the ledger register, not just reskinned visually (landing/pricing/about copy specifically). |
| Milestones/celebration | Achievement badges and confetti-style "Debt-Free Celebration" become the ledger's own vocabulary: a circular red ink stamp, hand-lettered, marking the moment a loan is paid off. |
| Layout | Keep the wide multi-panel workspace (the app's core value is comparing several numbers at once) — expressed as a two-page ledger spread with a visible center gutter rule, not a generic dashboard grid. |
| Elevation | Two levels only: page and sheet. Warm-brown-tinted shadow (paper on a desk), never cool-grey, never glass/blur/glow. |
| Shapes | Cut-paper corners, 2–4px radius, everywhere. |
| Inputs | Ruled-line fields (writing directly on a ledger line, bottom rule only, thicker red rule on focus) rather than boxed inputs. |
| Buttons | Outline-only (red border + red text on cream/paper, no fill) — quieter than a solid CTA, closer to a "sign here" box. |
| Masthead | Cream background, red double-rule bottom border (echoing the ruled header band of a real ledger page) on every page. |
| Typography | Headline: **Prata** (a free stand-in for PF Marlet Display — Adobe Fonts entitlement lookup failed with an account/plan restriction on this connection, and no Creative Cloud font sync was found locally; revisit real PF Marlet Display licensing later, see Open Items). Body/numbers: **Lora**, tabular figures throughout. Ceremonial stamp lettering only: **Kalam**. |

## Full token/color reference

**Day**
| Token | Value | Role |
|---|---|---|
| `paper` | `#F6EFE1` | Page background |
| `ink` | `#241C14` | Primary text |
| `ink-soft` | `#6B5B4A` | Secondary text, captions, metadata |
| `rule` | `#CBB99A` | Hairline column/section rules |
| `cloth-red` | `#9E2B25` | Masthead rule, outline buttons, links |
| `saved` | `#2F6B4A` | Money saved |
| `cost` | `#6E5A4D` | Interest paid |
| `warn` | `#A8531F` | Form validation / real errors |
| `seal-gold` | `#B98A2E` | Section-header rules, stamp accent |

**Lamplight**
| Token | Value | Role |
|---|---|---|
| `paper` | `#241512` | Page background |
| `ink` | `#F0E4D3` | Primary text |
| `ink-soft` | `#A99783` | Secondary text |
| `rule` | `#4A3830` | Hairline rules |
| `cloth-red` | `#C8543F` | Masthead rule, outline buttons (brighter than Day — reads as glowing) |
| `saved` | `#4E9370` | Money saved |
| `cost` | `#A08D7C` | Interest paid |
| `warn` | `#C97A45` | Errors |
| `seal-gold` | `#D9A64E` | Rules, stamp accent |

Verified visually via the brainstorming visual companion (Day-vs-Lamplight mockup, font specimen comparison, Prata+Lora pairing preview) before approval.

## Scope

**In scope:** `next-app/` — every route (`/`, `/about`, `/calculator`, `/planner`, `/planner/optimizer`, `/pricing`, `/sample-report`), every component in `components/`, `app/globals.css`, `tailwind.config.js`. A new `DESIGN.md` at the repo root as the canonical source of truth, with tokens exported via `npx -p @google/design.md designmd export --format json-tailwind` (the app pins `tailwindcss@^3.4.17`, so the v3 `theme.extend` JSON format applies, not the v4 `@theme` CSS format) into `tailwind.config.js`.

**Out of scope:** the legacy single-file `web/` app and root `index.html` (the pre-Next.js build, GitHub Pages only, not the production Vercel deployment) — not touched by this pass. Supabase schema/backend — unaffected, this is presentation-layer only.

## Open items for implementation

1. **PF Marlet Display licensing** — Prata is a placeholder. If/when Adobe Fonts access is fixed (or the font is purchased directly from Parachute Fonts), swap the `headline` token's `fontFamily` and re-run `design.md lint` + `design.md diff` to confirm no regression.
2. **Milestone ink-stamp component** — needs a new `MilestoneStamp` component (or a rework of `DebtFreeCelebration.tsx`/`AchievementBadges.tsx`) rendering a rotated circular stamp in Kalam. Existing confetti/badge logic should be removed, not just hidden.
3. **Copy rewrite** — headlines and microcopy on `/`, `/pricing`, `/about`, `/sample-report` need a pass into the ledger register (e.g., an "opening entry" instead of a SaaS hero pitch). No specific new copy was dictated during brainstorming — write it consistent with the Overview prose above and keep it factually equivalent to what's there today (same claims, same numbers, new voice).
