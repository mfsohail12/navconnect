# NavConnect demo app

Investor demo of NavConnect, an accessible hospital wayfinding concept, set at Lakeridge Health Oshawa. It's a Next.js web app shown in phone and laptop browsers. The demo is soon, so favour working, polished and simple over clever.

**Read first:**

- `docs/BUILD_BRIEF.md` is the full spec, data model and build phases.
- `docs/reference/navconnect-prototype.html` is the approved prototype. It's the source of truth for look, copy, data and behaviour. It's about 94 KB, so read it in sections.

## Stack

- Next.js (App Router, TypeScript). Routes: `/` (patient phone app) and `/staff-dashboard`.
- Supabase: Postgres for shared demo state, Realtime for live updates, Presence for active navigations. No auth.
- Supabase CLI migrations in `supabase/migrations/`. Generated types in `lib/database.types.ts`.
- Deployed to Vercel. PWA via `app/manifest.ts` only (no service worker).

## Rules

- **Port the prototype; don't redesign it.** Reuse its CSS tokens, layout, copy, translations, routes and map coordinates. Split it into React components, CSS modules, and TypeScript modules.
- **Static data lives in code** (`lib/navconnect/`): languages, destinations, routes, detours, map geometry. **Only shared, changing state lives in Supabase.**
- **Writes go through Server Actions** using `getSupabaseAdminClient()` from `lib/supabase/server.ts`. **Reads and realtime go through** `getSupabaseBrowserClient()` and `useTableChanges()` from `lib/supabase/`. Reuse these utilities; don't create new Supabase clients.
- Never import `lib/supabase/server.ts` from a Client Component. Never expose `SUPABASE_SECRET_KEY` or prefix it with `NEXT_PUBLIC_`.
- **Schema changes only through new migrations**, using the npm scripts:
  1. `npm run db:new -- <name>` creates `supabase/migrations/<timestamp>_<name>.sql`. Write the SQL there.
  2. `npm run db:push` applies pending migrations to the linked Supabase project. Ask before running it.
  3. `npm run db:types` regenerates `lib/database.types.ts`. Run it after every push.
  4. `npm run db:status` compares local and remote migrations.

  Never edit a migration that's already been pushed; add a new one instead. Never change the schema in the Supabase dashboard.

- Every table that clients read needs RLS with an `anon` select policy and must be in the `supabase_realtime` publication.
- **Don't use `crypto.randomUUID()` in browser code.** Phones testing over `http://<lan-ip>:3000` don't have it. Use `getClientId()` from `lib/supabase/utils.ts` for device IDs.
- Keep the disclaimers from the prototype unless told otherwise.
- **Out of scope:** auth, real indoor positioning, real camera or OCR, native apps, offline caching.

## Commands

- `npm run dev`: local dev. To test on a phone, use `npm run dev -- -H 0.0.0.0` and open `http://<lan-ip>:3000`.
- `npm run db:new -- <name>`, `npm run db:push`, `npm run db:status`, `npm run db:types`
- `npm run lint` and `npm run build`. Run both before calling a phase done.
