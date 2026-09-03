# Plan: FPL Team Assistant Foundation

## Context

Build the data pipeline foundation for an FPL (Fantasy Premier League) team assistant. The goal is to prove end-to-end API connectivity: proxy FPL's public API through a backend, wire a team-ID input on the frontend to trigger real data fetches, and display a confirmation. No prediction or transfer logic yet.

## GitHub Status

`gh` CLI is installed but **not authenticated** — no GitHub account is connected. The only git remote is Figma's own internal git endpoint (`api.figma.com/git/...`). A GitHub repo cannot be created automatically. After implementation, a commit will be made to the existing Figma git remote.

---

## Architecture Decision: Vite Plugin Middleware (no separate process)

Rather than spinning up a separate Express server (which would require a second port and a process manager), the backend will be implemented as an **inline Vite plugin** in `vite.config.ts` using Vite's `configureServer` hook. This adds Connect middleware directly to the existing dev server at port 8443. No new dependencies needed — Node's built-in `fetch` handles outbound requests.

Benefits:
- Single process, single port — works within Figma Make's constrained environment
- No `concurrently` or `npm-run-all` required
- Caching lives in the plugin closure (simple in-memory Map)

---

## Files to Create / Modify

### 1. `vite.config.ts` — Add `fplApiPlugin`

Add an inline plugin before the existing plugins array. It:
- Intercepts `GET /api/fpl/*` in `configureServer`
- Routes to four handlers matching the four endpoints
- Caches `bootstrap` and `fixtures` responses for 30 minutes using a `Map<string, { data; ts }>` in plugin closure scope
- Sends FPL requests with `User-Agent: Mozilla/5.0` header (FPL API requires it)
- Returns `{ error: string }` JSON with appropriate HTTP status on failures

Route table:
| Frontend path | FPL upstream |
|---|---|
| `GET /api/fpl/bootstrap` | `https://fantasy.premierleague.com/api/bootstrap-static/` |
| `GET /api/fpl/fixtures` | `https://fantasy.premierleague.com/api/fixtures/` |
| `GET /api/fpl/player/:id` | `https://fantasy.premierleague.com/api/element-summary/{id}/` |
| `GET /api/fpl/team/:teamId/:gw` | `https://fantasy.premierleague.com/api/entry/{teamId}/event/{gw}/picks/` |

### 2. `src/index.css` — Font imports + design tokens

Add Google Fonts imports at top (before `@import 'tailwindcss'`):
- **Rajdhani** (600, 700) — display/heading, sporty condensed
- **DM Sans** (400, 500, 600) — body copy, clean and readable

Add Tailwind v4 `@theme` block with FPL color tokens:
```css
--color-fpl-purple: #37003c;
--color-fpl-green: #00ff87;
--color-navy: #0d0d1a;
--color-navy-card: #1a1a2e;
--color-navy-border: #2a2a4a;
```

Set `font-family` defaults on `body`.

### 3. `src/App.tsx` — Full homepage

Structure:
```
<div class="min-h-full bg-navy text-white font-dm-sans">
  <Header />
  <Hero />
  <TeamLoader />       ← manages team-load state
  <GameweekResult />   ← shown after successful load
</div>
```

All components inline in `App.tsx` (no separate component files needed — scope is small):

**Header**: FPL purple bar, "FPL Team Assistant" in Rajdhani, small tagline.

**Hero**: Dark card with headline "Import your FPL team, get data-driven transfer suggestions to hit 80+ points next gameweek", subtext, and a subtle green accent rule.

**TeamLoader**:
- Input field: "Enter your FPL Team ID" with a hint linking to where to find it
- "Load My Team" button in FPL green
- On submit: calls `GET /api/fpl/bootstrap` first to get current gameweek, then `GET /api/fpl/team/:teamId/:gw` — both sequentially
- Shows loading state, error state (inline red message), and success state

**GameweekResult** (shown on success):
- Card with "Gameweek {N}" badge
- Player grid placeholder: "Squad view coming next"
- `console.log` of raw team data (as required)

### 4. `src/types.ts` (new) — Minimal TypeScript types

Thin type definitions for FPL API shapes used in the frontend:
- `BootstrapResponse` (just `current_event: number`)
- `TeamPicksResponse` (entry info + picks array)
- `ApiError`

---

## Caching Implementation

```ts
// In fplApiPlugin closure:
const cache = new Map<string, { data: unknown; ts: number }>();
const TTL = 30 * 60 * 1000;

function getCached(key: string): unknown | null {
  const e = cache.get(key);
  return e && Date.now() - e.ts < TTL ? e.data : null;
}
```

Only `bootstrap` and `fixtures` are cached. Player and team endpoints are not (they're user-specific or frequently changing).

---

## Design Tokens & Aesthetic

Based on real FPL branding:
- **Background**: `#0d0d1a` (very dark navy)
- **Cards**: `#1a1a2e` with `#2a2a4a` borders
- **Accent**: `#00ff87` (FPL green) for CTAs and highlights
- **Header**: `#37003c` (FPL purple)
- **Text**: white / `#a0aec0` for secondary

Typography:
- Headings: Rajdhani 700 (condensed, sporty)
- Body: DM Sans 400/500

---

## Verification

1. Open the preview — homepage loads with dark navy background and FPL purple header
2. Enter a valid FPL Team ID (e.g. `1`) and click "Load My Team"
3. Browser DevTools Network tab shows:
   - `GET /api/fpl/bootstrap` → 200 JSON
   - `GET /api/fpl/team/1/{gw}` → 200 JSON
4. Console shows raw team picks data
5. UI shows "Team loaded successfully" confirmation card with current gameweek number
6. Second click on "Load My Team" for bootstrap should return cached response (verify via server logs — no second upstream request)
7. Enter an invalid team ID → UI shows clear error message, not a crash

---

## Commit

After implementation: `git add -A && git commit -m "feat: FPL Team Assistant foundation — API proxy + homepage"` pushed to Figma git remote.
