# ZadarIQ project context

Read `docs/PROJECT_HANDOVER.md` before making architectural or deployment changes. It records verified facts and unresolved access checks from 2026-09-27; revalidate remote state as needed.

- Work on the current GitHub version. The local checkout was once 140 commits behind; Lovable may still update `main` independently.
- Production is reachable at `https://www.zadariq.city/`. Vercel hosts the frontend; Lovable Cloud manages its Supabase-based data, Auth and Edge Functions (confirmed by the user). Backend changes must go through Lovable. Preview and production share the live database; use read-only verification unless explicitly testing an authorized write. Frontend deployment does not apply database migrations or deploy functions.
- `/radar` uses `CityRadar`; `/sunday-radar` redirects to `/radar?layer=sunday`. Reuse `src/lib/radar` and `src/components/radar` for radar work.
- Data is mixed: static `src/data/mockData.ts`, approved `pending_places`, hours overrides and domain-specific tables. Preserve static IDs and the `ap_` prefix while changing data flows.
- Relative verification timestamps and default hours are not evidence of current verification. Do not introduce new invented freshness or opening-hour claims.
- Use Europe/Zagreb calendar semantics for local dates and business hours. Test date boundaries for changes in this area.
- Supabase and Drizzle both contain migrations; `drizzle/schema.ts` is intentionally empty, not an authoritative schema to push to the database.
- Keep private keys out of source, logs and frontend environment variables. Confirm environment identity before testing writes, scraper jobs or notifications.
- Current checks: `npm run build`, `./node_modules/.bin/tsc -p tsconfig.app.json --noEmit`, `npm test`, `npm run lint`. Lint has existing debt; the single test is only a placeholder. Build alone does not type-check or prove runtime configuration.
- Package-manager configuration is unresolved: three lockfiles, stale npm lock and Bun-specific prebuild. Check the handover before changing dependency or deployment setup.
- Keep the handover current when infrastructure assumptions, source-of-truth decisions or operating procedures change.
