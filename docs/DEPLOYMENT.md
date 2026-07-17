# Vercel and Supabase Deployment

The production application lives in `next-app/`. Vercel should build that directory, while the Supabase schema is managed by the ordered SQL files in `supabase/migrations/`.

## Environment contract

Start locally with the committed placeholder template:

```bash
cp next-app/.env.example next-app/.env.local
```

Replace the placeholders in `.env.local` with values from the Supabase project's API settings:

| Variable | Required | Value |
| --- | --- | --- |
| `NEXT_PUBLIC_SUPABASE_URL` | Yes for cloud saving | The project's HTTPS URL |
| `NEXT_PUBLIC_SUPABASE_PUBLISHABLE_KEY` | Yes for cloud saving | The project's publishable browser key |
| `NEXT_PUBLIC_SITE_URL` | Recommended | Canonical production origin used by metadata and the sitemap |

The app also accepts `NEXT_PUBLIC_SUPABASE_ANON_KEY` for older Supabase projects, but new configuration should use the publishable-key variable. When neither key is configured, the planner continues in local-browser mode and cloud save/share is disabled.

`NEXT_PUBLIC_` values are visible to every browser visitor. Never put a Supabase secret key, `service_role` key, database password, Vercel token, or personal access token in a `NEXT_PUBLIC_` variable or any committed file. Browser access is protected by the row-level security policies in the migrations, not by hiding the publishable key.

## Apply the Supabase schema

Use the Supabase CLI from the repository root so migrations stay reproducible:

```bash
supabase login
supabase link --project-ref your-project-ref
supabase db push
```

Review every pending migration before applying it to production. Do not expose CLI access tokens or database passwords through the Next.js environment variables.

## Configure Vercel

1. Import the GitHub repository and set **Root Directory** to `next-app`.
2. Keep the framework preset as **Next.js**, the install command as `npm ci`, and the build command as `npm run build`.
3. Add the variables above to every intended Vercel environment: Production, Preview, and Development.
4. Redeploy after changing environment variables. Confirm the deployment uses the expected Supabase project before entering real customer data.

The local `.vercel/` directory and all `.env.local` files are ignored by Git. Vercel project linkage is deployment metadata and should not be committed.

## Release checks

Install deterministic application dependencies and Python development tools, then run the same core checks used by CI:

```bash
npm run install:apps
python -m pip install -r requirements-dev.txt
npm run check
```

The browser end-to-end suite is available separately with `npm run web:e2e` after Playwright's Chromium dependency is installed.
