# NavConnect demo app: build brief

## 1. What we're building

NavConnect is an accessible hospital wayfinding concept: AR-style directions, four languages (including right-to-left Arabic), spoken guidance, vibration cues, volunteer help, and a staff console. The founder is pitching it to investors in about a week.

We're turning the approved single-file prototype (`docs/reference/navconnect-prototype.html`) into a deployed Next.js web app:

- **`/`, the patient app.** Shown on real phones. On a phone it fills the screen. On a laptop it sits centred inside the phone frame from the prototype.
- **`/staff-dashboard`, the staff and volunteer console.** Shown on a laptop.
- **Several phones at once** feed one dashboard live. A help request sent from any phone appears on the dashboard within a second or two. A closure toggled on the dashboard reaches every phone on an affected route.
- **Installable as a PWA** so it looks like a native app from the home screen.

Everything except the shared demo state is mocked. Positioning and the camera view are simulated exactly as in the prototype. The letter scan opens the device's real camera or photo picker, but the image is ignored and the result is always Diagnostic Imaging.

## 2. The prototype is the spec

Port it; don't redesign it. Match its visuals, copy and behaviour unless this brief says otherwise. The one structural change: the prototype runs the patient app and staff console side by side in one page with in-memory state. Now they're two routes sharing state through Supabase.

What to carry over from the prototype's `<script>` and `<style>`:

| Prototype                                                                          | Where it goes                                                                                                                                                           |
| ---------------------------------------------------------------------------------- | ----------------------------------------------------------------------------------------------------------------------------------------------------------------------- |
| CSS custom properties (light/dark tokens), component styles                        | `app/globals.css` and/or CSS Modules. Keep the token system. Don't convert to Tailwind utility classes; if Tailwind was installed by create-next-app it can stay unused |
| `P` / `ic()` icon paths                                                            | An `<Icon name>` component                                                                                                                                              |
| `I` strings (en, fr, ar, zh) merged with `EXTRA`                                   | `lib/navconnect/i18n.ts`: one typed dictionary per language. Arabic sets `dir="rtl"` on the app container                                                               |
| `DEST`, `ORDER`, `KW`                                                              | `lib/navconnect/destinations.ts`                                                                                                                                        |
| `baseRoute`, `detourRoute`, `getRoute`, `CLOSURE_AFFECTS`, `stats`                 | `lib/navconnect/routes.ts` (pure functions; closures passed in as an argument)                                                                                          |
| `WINGS`, `ELEVS`, `mapSVG`                                                         | `<FloorMap>` component plus `lib/navconnect/map.ts`                                                                                                                     |
| `speak`, `haptic`, `HAP`                                                           | `lib/navconnect/speech.ts`, `lib/navconnect/haptics.ts`                                                                                                                 |
| Screens: home, route, nav (AR view), arrive, settings                              | Client components under `app/(patient)/…` or `components/patient/…`                                                                                                     |
| Navigation engine (`startNav`, `step`, `maneuver`, `advance`, `finish`)            | A `useNavigation` hook or reducer                                                                                                                                       |
| Help sheet, closure choice sheet (detour or volunteer), scan overlay              | Client components                                                                                                                                                       |
| `console_` staff console                                                           | `/staff-dashboard`, now backed by Supabase                                                                                                                              |
| Settings (language, text size, contrast, voice, vibration, pace)                   | Per-device, in `localStorage` (wrap in try/catch)                                                                                                                       |

## 3. Architecture

- **Next.js App Router, TypeScript.** Patient screens are mostly Client Components (timers, speech, haptics, local state).
- **Supabase** for shared state only, through the utilities already in the repo:
  - `lib/supabase/client.ts`: `getSupabaseBrowserClient()` for browser reads and realtime
  - `lib/supabase/server.ts`: `getSupabaseAdminClient()` for Server Actions only (service role key)
  - `lib/supabase/utils.ts`: `Row/Insert/Update<"table">` types, `unwrap()`, `getClientId()`
  - `lib/supabase/use-table-changes.ts`: `useTableChanges(table, { filter, onChange, onResync })`, which refetches on subscribe, reconnect and tab visibility
- **Writes:** Server Actions in `app/actions.ts` (or split by feature). Each action is one atomic statement or one `rpc()` call.
- **Device identity:** `getClientId()` (random ID in `localStorage`). Help requests carry `client_id` so "Assign volunteer" reaches only the phone that asked.
- **Active navigations:** a Supabase Realtime Presence channel (for example `navigating`). A phone tracks itself while navigating and untracks on arrival or end. The dashboard shows the presence count added to a seeded baseline, so it looks busy.

## 4. Shared data model

A draft migration is at `docs/reference/initial-schema.sql`. Review it, then create it as the first real migration with `npx supabase migration new init_demo_schema` and push it. Summary:

| Table                | Purpose                                                                                                                                                                                                               |
| -------------------- | --------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------- |
| `closures`           | `key` (`cElev` = Purple Elevator, `aWing` = A Wing hallway), label, description, `affects` (destination IDs), `is_closed`                                                                                             |
| `help_requests`      | `client_id`, `reason` (`lost`, `wheelchair`, `interpreter`, `other`, `escort`), `lang`, `location`, `destination`, `escort_for` (closure key), `note`, `status` (`open`, `assigned`, `done`), `volunteer`, timestamps |
| `activity`           | Dashboard activity feed messages                                                                                                                                                                                      |
| `destination_counts` | Top destinations today (seeded)                                                                                                                                                                                       |
| `demo_stats`         | `arrivals_today`, `median_minutes` (seeded)                                                                                                                                                                           |

Functions, executable only by `service_role`:

- `record_arrival(destination)`: atomic increment
- `reset_demo()`: clears and reseeds everything. The dashboard has a "Reset demo" button that calls it.

The seed data matches the prototype's console (two sample requests, two activity entries, the top-destination counts, 412 arrivals, 5.8-minute median). The language mix chart stays static in code.

Reads: everyone (RLS `select` for `anon`). Writes: Server Actions only. All tables are in the `supabase_realtime` publication.

## 5. Cross-device flows (must work with several phones at once)

1. **Help request.** Phone → Help → reason → Send. A Server Action inserts `help_requests` and an `activity` row. The dashboard shows it live. Staff click **Assign volunteer**, and a Server Action sets `status='assigned'` and a volunteer name from a small rotating list. Only that phone (subscribed with `client_id=eq.<id>`) shows "<name> is coming to you", spoken aloud, with an arrival vibration.
2. **Closure while navigating.** Staff toggle a closure on the dashboard. Every phone currently navigating to an affected destination pauses and shows the prototype's choice sheet:
   - **Take a detour:** switch to the detour route, speak it, and log to `activity`.
   - **Send a volunteer:** an escort help request with `reason='escort'` and `escort_for=<key>`.

   Phones not on an affected route ignore it. If a closure is already active before navigation starts, the route screen shows the detour and the "Ask a volunteer instead" button, as in the prototype.

3. **Arrival.** On arrival, a Server Action calls `record_arrival` and logs to `activity` (including the language if not English). The dashboard's top destinations and arrivals update live.
4. **Active navigations** update via Presence as phones start and stop.
5. **Reset demo** on the dashboard returns everything to the seed state. All open screens resync.

Activity messages should read like the prototype's, e.g. "New request from a visitor: 'I need an interpreter' near the A Wing hallway (prefers Arabic)."

## 6. Mobile and demo constraints

- **Speech.** iOS Safari only speaks after a user gesture. "Start navigation" is the first gesture, so don't speak on page load. Voices vary by device.
- **Vibration.** `navigator.vibrate` works on Android only. Cues use the device's vibration motor and nothing else: no on-screen shake or haptic toast. Where vibration isn't supported (iOS), cues do nothing.
- **Locked phones.** Phones drop the realtime websocket when locked or backgrounded. `useTableChanges` resyncs on visibility; make sure every live view supplies `onResync`.
- **Layout.** Use `100dvh` and `env(safe-area-inset-*)`. No horizontal scroll at 360px wide. Touch targets at least 44px.
- **Accessibility.** Keep the prototype's text-size, high-contrast, focus and reduced-motion support. Use real buttons, labelled switches and `lang`/`dir` on the app container.
- **PWA.** `app/manifest.ts` with `name: "NavConnect"`, `display: "standalone"`, `theme_color: "#1546C8"`, and 192/512 icons plus an `apple-touch-icon`. Use a simple blue rounded square with the prototype's arrow mark; generate PNGs or ask for assets. No service worker or offline caching.
- **Honesty labels** stay visible: the patient home disclaimer, the dashboard "Sample data · not live hospital data" tag, and "Demo detour, needs confirming with Lakeridge."

## 7. Out of scope

Auth or logins, real indoor positioning, a live camera or AR feed, real OCR of letters, a native app, offline mode, analytics, tests beyond a quick smoke check. Don't add libraries for state management, styling or animation unless clearly necessary. React state, `useReducer` and plain CSS are enough.

## 8. Build phases

Stop after each phase, summarize what changed, and say how to verify it.

**Phase 1: Foundation**

- Port the static data and logic into typed modules under `lib/navconnect/`, with no UI yet.
- Create and push the schema migration, then regenerate types.
- Server Actions for: send help request, assign volunteer, toggle closure, log detour choice, record arrival, reset demo.
- A bare `/staff-dashboard` that lists closures and help requests live, with working toggle, assign and reset.
- **Done when:** toggling a closure or assigning a request in one browser shows up in a second browser within about 2 seconds, and `npm run build` passes.

**Phase 2: Patient app**

- Port every patient screen, overlay and the navigation engine with the prototype's styling.
- Language switching (including RTL), settings persistence, speech and haptics.
- Responsive UI with emphasis on matching phone UI to prototype.

**Phase 3: Dashboard and cross-device flows**

- The full dashboard UI from the prototype: tiles, help requests, closures, top destinations, language mix and activity feed.
- All flows in section 5, plus Presence.

**Phase 4: PWA and mobile polish**

- Manifest and icons, safe areas, a check at 360–430px wide, and iOS speech (vibration is a no-op on iOS).

**Phase 5: Hardening for the demo**

- Test with 3+ browsers at once: no duplicated or lost events, and correct behaviour after a phone is locked and unlocked.

## 9. Environment variables

`.env.local`, also set in Vercel:

```
NEXT_PUBLIC_SUPABASE_URL=
NEXT_PUBLIC_SUPABASE_PUBLISHABLE_KEY=
SUPABASE_SECRET_KEY=        # server only; never prefix with NEXT_PUBLIC_
```
