# FPL Team Assistant

FPL Team Assistant is a Fantasy Premier League companion for reviewing a public team, projecting its next-gameweek score, visualising the squad on a pitch, and evaluating transfer opportunities.

The application combines live public FPL data with a transparent, client-side prediction model. Signed-in users can access transfer suggestions; visitors can explore the landing experience and load a public team by ID.

## Highlights

- Import a public FPL Team ID and retrieve the selected gameweek squad.
- Display the starting XI and bench with official FPL shirt and crest imagery, with resilient text fallbacks.
- Project player and starting-XI points using recent form, fixture difficulty, home advantage, availability, minutes reliability, and defensive contribution data.
- Compare the projected score with an 80-point target.
- Generate position- and budget-aware transfer suggestions for authenticated users.
- Support email/password and Google OAuth with Supabase Auth.
- Ship a responsive, accessible interface with light/dark modes and reduced-motion support.
- Include baseline technical SEO: metadata, canonical URL, JSON-LD, `robots.txt`, and `sitemap.xml`.

## Technology

| Area | Choice |
| --- | --- |
| UI | React 19, TypeScript, React Router |
| Styling | Tailwind CSS v4 |
| Motion | Motion |
| Auth | Supabase Auth |
| Development server | Vite 8 |
| Data source | Public Fantasy Premier League API |
| Package manager | pnpm |

## Getting started

### Prerequisites

- Node.js 22
- pnpm 10

The pinned versions are recorded in [`.mise.toml`](.mise.toml).

### Local development

```bash
pnpm install
pnpm dev
```

Vite starts the app at the configured local address. The development server also provides the FPL API middleware described below.

### Quality checks

```bash
pnpm exec tsc --noEmit
pnpm run build
pnpm run format
```

## Application flow

1. A user submits a public FPL Team ID.
2. The frontend requests bootstrap data, fixtures, team picks, and player summaries through `/api/fpl/*`.
3. Vite middleware retrieves the public FPL responses, caching bootstrap and fixture data for 30 minutes.
4. The prediction service enriches every selected player with a projected score and next-fixture context.
5. The UI renders the score, pitch, and player views. Authenticated users can also view transfer analysis.

For a full component and data-flow reference, see [the architecture document](docs/architecture.md).

## Authentication

The app uses Supabase Auth with email/password and Google OAuth. Figma Make supplies the public Supabase project configuration through `utils/supabase/info.tsx`; that generated file should not be edited manually.

For Google OAuth, configure these values in Google Cloud for the connected Supabase project:

- Authorized JavaScript origin: `https://chekotqfukzbggtzvgme.supabase.co`
- Authorized redirect URI: `https://chekotqfukzbggtzvgme.supabase.co/auth/v1/callback`

## FPL API middleware

During `vite dev`, the application exposes these same-origin routes:

| Route | Upstream FPL endpoint |
| --- | --- |
| `GET /api/fpl/bootstrap` | `/api/bootstrap-static/` |
| `GET /api/fpl/fixtures` | `/api/fixtures/` |
| `GET /api/fpl/player/:id` | `/api/element-summary/:id/` |
| `GET /api/fpl/team/:teamId/:gameweek` | `/api/entry/:teamId/event/:gameweek/picks/` |

The middleware is configured for Vite's development server. A production deployment must provide equivalent server-side proxy or serverless routes; a static Vite build alone cannot serve `/api/fpl/*`.

## Project structure

```text
src/
  app/              Route configuration
  components/       Pitch, image, landing, squad, and transfer UI
  contexts/         Auth state provider
  hooks/            Reusable UI hooks
  lib/              External client setup
  pages/            Routed page and shell components
  services/         Prediction and transfer-analysis logic
  utils/            FPL image URL helpers
  types.ts          API and application contracts
public/             Static crawl assets and favicon
supabase/           Connected Supabase Edge Function scaffolding
docs/               Technical documentation
```

## SEO

The public landing page is the only indexable route. `public/robots.txt` excludes `/login`, while `public/sitemap.xml` lists the landing page. The document head includes a canonical URL and `WebApplication` structured data.

## Deployment notes

`pnpm run build` produces the static Vite output in `dist/`. Before publishing, ensure the target platform supports SPA route fallback and implements the production equivalent of the FPL API middleware. Supabase Auth redirect URLs must also include the final application origin.

## Disclaimer

FPL Team Assistant is an independent project and is not affiliated with Fantasy Premier League or the Premier League.
