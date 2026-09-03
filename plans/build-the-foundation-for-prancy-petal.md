# Plan: FPL Team Assistant — Full Visual Redesign

## Context

The current app uses a generic SaaS template aesthetic: uniform shadow-cards, all-caps eyebrow labels, soft grey backgrounds, no visual connection to football or sports data. The redesign replaces this with a broadcast stat overlay / sports data graphics language — think Opta/Sky Sports: bold numerals, a real pitch formation layout, scoreboard visual language. All data logic and API wiring is preserved unchanged.

---

## Files to Modify

Three files change. No data/logic files (`prediction.ts`, `types.ts`, `vite.config.ts`) are touched.

### 1. `src/index.css` — New design token system

**Remove** the existing `:root`, `html.dark`, `@theme`, and `.shadow-card` blocks entirely.

**Replace with:**

```css
/* ── Semantic color variables ─────────────────── */
:root {
  --c-base:           #F7F9FC;          /* page background */
  --c-surface:        #FFFFFF;          /* card / panel */
  --c-surface-2:      #F1F5FB;          /* muted / elevated */
  --c-ink:            #0F172A;
  --c-ink-2:          #475569;
  --c-ink-3:          #94A3B8;
  --c-line:           #E2E8F0;          /* hairline border */
  --c-primary:        #2454FF;          /* electric blue */
  --c-primary-hover:  #1a41e6;
  --c-primary-subtle: rgba(36, 84, 255, 0.07);
  /* Fixture difficulty */
  --c-easy:           #16A34A;  --c-easy-bg:  #F0FDF4;
  --c-mid:            #D97706;  --c-mid-bg:   #FFFBEB;
  --c-hard:           #DC2626;  --c-hard-bg:  #FEF2F2;
  /* Pitch */
  --c-pitch-gradient: linear-gradient(180deg, #145229 0%, #166534 30%, #15803d 60%, #166534 85%, #145229 100%);
  --c-pitch-card:     rgba(255, 255, 255, 0.94);
  --c-pitch-ink:      #0F172A;
  --c-pitch-muted:    #475569;
  --c-pitch-line:     rgba(255, 255, 255, 0.07);
  /* Position strip colors (static, decorative) */
  --c-pos-gk:   #D97706;
  --c-pos-def:  #2454FF;
  --c-pos-mid:  #16A34A;
  --c-pos-fwd:  #DC2626;
  /* Position pills for list view */
  --c-pos-gk-text:  #92400e;  --c-pos-gk-bg:  #fef3c7;
  --c-pos-def-text: #075985;  --c-pos-def-bg: #e0f2fe;
  --c-pos-mid-text: #065f46;  --c-pos-mid-bg: #d1fae5;
  --c-pos-fwd-text: #9f1239;  --c-pos-fwd-bg: #ffe4e6;
}

html.dark {
  --c-base:           #0B1220;
  --c-surface:        #131B2E;
  --c-surface-2:      #1a2540;
  --c-ink:            #E7ECF5;
  --c-ink-2:          #94A3B8;
  --c-ink-3:          #4A5568;
  --c-line:           rgba(255, 255, 255, 0.08);
  --c-primary:        #2454FF;
  --c-primary-hover:  #4070ff;
  --c-primary-subtle: rgba(36, 84, 255, 0.15);
  --c-easy:           #22C55E;  --c-easy-bg:  rgba(34, 197, 94, 0.12);
  --c-mid:            #F59E0B;  --c-mid-bg:   rgba(245, 158, 11, 0.12);
  --c-hard:           #F87171;  --c-hard-bg:  rgba(248, 113, 113, 0.12);
  --c-pitch-gradient: linear-gradient(180deg, #0a2018 0%, #0d2d1e 30%, #103626 60%, #0d2d1e 85%, #0a2018 100%);
  --c-pitch-card:     rgba(11, 18, 32, 0.92);
  --c-pitch-ink:      #E7ECF5;
  --c-pitch-muted:    #94A3B8;
  /* Position pills — dark mode */
  --c-pos-gk-text:  #fbbf24;  --c-pos-gk-bg:  rgba(251, 191, 36, 0.12);
  --c-pos-def-text: #38bdf8;  --c-pos-def-bg: rgba(56, 189, 248, 0.12);
  --c-pos-mid-text: #34d399;  --c-pos-mid-bg: rgba(52, 211, 153, 0.12);
  --c-pos-fwd-text: #fb7185;  --c-pos-fwd-bg: rgba(251, 113, 133, 0.12);
}

@theme {
  --color-base:           var(--c-base);
  --color-surface:        var(--c-surface);
  --color-surface-2:      var(--c-surface-2);
  --color-ink:            var(--c-ink);
  --color-ink-2:          var(--c-ink-2);
  --color-ink-3:          var(--c-ink-3);
  --color-line:           var(--c-line);
  --color-primary:        var(--c-primary);
  --color-primary-subtle: var(--c-primary-subtle);
  --color-easy:           var(--c-easy);
  --color-easy-bg:        var(--c-easy-bg);
  --color-mid:            var(--c-mid);
  --color-mid-bg:         var(--c-mid-bg);
  --color-hard:           var(--c-hard);
  --color-hard-bg:        var(--c-hard-bg);
  --color-pitch-card:     var(--c-pitch-card);
  --color-pitch-ink:      var(--c-pitch-ink);
  --color-pitch-muted:    var(--c-pitch-muted);
  --color-pos-gk-text:    var(--c-pos-gk-text);
  --color-pos-gk-bg:      var(--c-pos-gk-bg);
  --color-pos-def-text:   var(--c-pos-def-text);
  --color-pos-def-bg:     var(--c-pos-def-bg);
  --color-pos-mid-text:   var(--c-pos-mid-text);
  --color-pos-mid-bg:     var(--c-pos-mid-bg);
  --color-pos-fwd-text:   var(--c-pos-fwd-text);
  --color-pos-fwd-bg:     var(--c-pos-fwd-bg);
  --color-nav:            #1e3a5f;   /* static dark navy header */
  --font-rajdhani: "Rajdhani", sans-serif;
  --font-dm-sans:  "DM Sans", sans-serif;
}
```

**Key changes from current:**
- Remove `--c-accent` → renamed to `--c-primary` (#2454FF, more saturated)
- Remove all drop shadows — no `.shadow-card` class, no `var(--c-shadow)`
- `--c-base` replaces `--c-surface` (page bg), `--c-surface` replaces `--c-surface-card` (cards)
- Border: solid `#E2E8F0` hairline vs. old semi-transparent rgba
- Position strip colors added (decorative, static)

**Keep unchanged:** Google Fonts `@import` line, `@import 'tailwindcss'`, scrollbar styles, `html/body/#root { height: 100% }`, `body { font-family: var(--font-dm-sans) }`

---

### 2. `src/App.tsx` — Header + Hero + TeamLoader

No changes to: `useDarkMode`, `fetchJson`, `loadTeam`, `App` root function logic.

**Header changes:**
- Remove `BETA` pill span entirely
- Change `FPL TEAM ASSISTANT` → `FPL Team Assistant` (Rajdhani, mixed case)
- Change `FPL ASSIST` (mobile) → `FPL Assist`
- Remove `bg-header border-header-border` → use `bg-nav border-b border-line/20`
- Logo icon: keep, change `bg-accent` → `bg-primary`
- Dark mode button: keep, 44px touch target (`w-11 h-11`)

**Hero changes (significant rewrite of the `Hero` component):**
- Remove eyebrow label ("— DATA-DRIVEN FPL" span + hr divider)
- Remove `radial-gradient` overlay (clean white/base background)
- Layout becomes a 2-column flex on sm+, stacked on mobile:
  - **Left (sm:flex-1)**: Headline in Rajdhani mixed case ("Import your FPL team. Hit 80+ points next gameweek."), subtext paragraph in DM Sans, pill/badge chips for features ("Live FPL data", etc. — keep these but as ink-3 text without accent dots, or remove)
  - **Right (sm:shrink-0)**: Large demo score number "84.2" in Rajdhani 700 at `clamp(72px, 12vw, 140px)` in `text-primary`, label below: "predicted this gameweek" in text-ink-3 text-sm
  - On mobile: number appears first (order-first), then text below
- No background decoration — just `bg-base`
- Bottom: hint "Enter your Team ID below ↓" in ink-3 text-sm
- Remove the 3-bullet-point feature list (or simplify to inline text)

**TeamLoader changes:**
- Card: `bg-surface border border-line rounded-xl p-6` (no shadow)
- Title: "Load your squad" (sentence case, Rajdhani 700, not all-caps)
- Input height: `h-11` (44px touch target)
- Button height: `h-11` (44px touch target), `bg-primary hover:opacity-90`
- Remove `onMouseEnter/onMouseLeave` handlers (use `hover:opacity-90` CSS utility)
- Error box: `bg-hard-bg border border-hard/20` (uses new token names `hard` vs. old `danger`)

**LoadingCard:**
- `bg-surface border border-line rounded-xl` (no shadow, no rounded-2xl → rounded-xl)
- Spinner border: `border-primary`

**Footer:**
- `border-t border-line` (updated token name)

---

### 3. `src/components/SquadView.tsx` — Pitch formation + mobile list

Complete rewrite of the component file. Data types (`EnrichedPick`, `SquadData`) unchanged.

#### ScoreBanner (scoreboard style — replaces shadow card)

```
<div className="border-l-4 border-primary rounded-r-xl mb-8 bg-primary-subtle">
  <div className="px-6 py-5">
    <div className="flex flex-col sm:flex-row sm:items-end sm:justify-between gap-4">
      [Left] GW{gw} predicted score label (ink-3, xs, tracked)
             {score.toFixed(1)} in Rajdhani 700 at 72px, text-ink
      [Right] gap badge: "+X.X" / "-X.X" in Rajdhani 700 28px, colored easy/mid
              "vs 80pt target" label
    </div>
    [Progress bar: h-1.5, bg-line track, colored fill, 80pt marker at 80% left]
  </div>
</div>
```

Visually distinct from player cards via: border-l-4, blue-tinted background, no card rounding on left side.

#### Section divider pattern (replaces all-caps h2 headers)

```tsx
<div className="flex items-center gap-3 mb-4">
  <span className="text-ink-3 text-xs font-medium">Starting XI</span>
  <div className="flex-1 h-px bg-line" />
  <span className="text-ink-3 text-xs">{count} players</span>
</div>
```

Same pattern for "Bench".

#### PitchFormation (desktop — sm:block, hidden on mobile)

```tsx
<div className="hidden sm:block">
  <div style={{ background: 'var(--c-pitch-gradient)' }} className="relative rounded-xl overflow-hidden">
    <PitchLines />  {/* subtle white lines: halfway, center circle, penalty areas */}
    <div className="relative z-10 flex flex-col gap-8 py-10 px-4">
      <PitchRow picks={fwd} />
      <PitchRow picks={mid} />
      <PitchRow picks={def} />
      <PitchRow picks={gk} />
    </div>
  </div>
</div>
```

`PitchLines`: absolute positioned divs using `--c-pitch-line` for:
- Halfway line: `absolute top-1/2 left-8 right-8 h-px`
- Center circle: `absolute top-1/2 left-1/2 -translate-x-1/2 -translate-y-1/2 w-20 h-20 rounded-full border`
- Top penalty arc: `absolute top-6 left-1/2 -translate-x-1/2 w-36 h-12 rounded-b-sm border border-t-0`
- Bottom penalty arc: `absolute bottom-6 left-1/2 -translate-x-1/2 w-36 h-12 rounded-t-sm border border-b-0`

`PitchRow`: `flex justify-center gap-3` containing `PitchCard` items.

`PitchCard` (w-24, compact card on the green pitch):
- Outer: `relative flex flex-col items-center w-24`
- C/VC badge floating above: `absolute -top-3 left-1/2 -translate-x-1/2 w-5 h-5 rounded-full bg-primary text-white flex items-center justify-center text-[9px] font-bold z-10`
- Card div: `w-full rounded-lg overflow-hidden` with `style={{ background: 'var(--c-pitch-card)' }}`
  - Top color strip: `h-1 w-full` with `style={{ background: POSITION_COLOR[type] }}` (static vars)
  - Body `p-1.5 text-center`:
    - `web_name` in `text-[11px] font-semibold truncate` with `color: var(--c-pitch-ink)`
    - `team.short_name` in `text-[9px]` with `color: var(--c-pitch-muted)`
    - `displayPts.toFixed(1)` in Rajdhani 700 at `text-xl` with `color: var(--c-pitch-ink)`
    - Opponent badge: `text-[9px] px-1 rounded` with diff color classes
    - Price: `text-[9px]` with `color: var(--c-pitch-muted)`

#### MobileListView (mobile only — block sm:hidden)

```tsx
<div className="block sm:hidden space-y-5">
  {[{type:1, label:'Goalkeeper'}, {type:2, label:'Defenders'}, ...].map(g => (
    <div>
      <div className="flex items-center gap-3 mb-2">
        <span className="text-ink-3 text-xs">{g.label}</span>
        <div className="flex-1 h-px bg-line" />
      </div>
      <div className="space-y-2">
        {picks.filter(type).map(ep => <ListCard ep={ep} />)}
      </div>
    </div>
  ))}
</div>
```

`ListCard` (full-width horizontal row, 44px min-height):
- `flex items-center gap-3 bg-surface border border-line rounded-xl p-3 min-h-[56px]`
- Left: `w-1 self-stretch rounded-full shrink-0` with position strip color (inline style)
- Middle flex-1:
  - Name row: `font-semibold text-ink text-sm` + C/VC badges (4×4 circles)
  - Sub row: `team.short_name • £Xm • opp badge` in text-ink-3 text-xs
- Right: Rajdhani 700 `text-2xl text-ink` score, `text-[10px] text-ink-3` FPL ep_next below

#### BenchSection (below pitch/list, all widths)

```tsx
<div className="mt-8">
  {/* Same section divider pattern */}
  <div className="flex gap-3 overflow-x-auto pb-2 -mx-5 px-5 sm:mx-0 sm:px-0 sm:flex-wrap sm:justify-center">
    {bench.map(ep => <BenchCard key={...} ep={ep} />)}
  </div>
</div>
```

`BenchCard` (compact, muted — horizontal scrollable on mobile):
- `flex-shrink-0 w-24 opacity-70 flex flex-col items-center`
- Same card structure as PitchCard but using `bg-surface-2 border border-line` (not translucent on green)
- No pitch gradient context
- Slightly smaller text

---

## Helper data

```ts
const POSITION_COLOR: Record<number, string> = {
  1: '#D97706', // GK — amber
  2: '#2454FF', // DEF — primary blue
  3: '#16A34A', // MID — green
  4: '#DC2626', // FWD — red
}

const POS_META = {
  1: { label: 'GK',  textClass: 'text-pos-gk-text',  bgClass: 'bg-pos-gk-bg',  rowLabel: 'Goalkeepers' },
  2: { label: 'DEF', textClass: 'text-pos-def-text', bgClass: 'bg-pos-def-bg', rowLabel: 'Defenders' },
  3: { label: 'MID', textClass: 'text-pos-mid-text', bgClass: 'bg-pos-mid-bg', rowLabel: 'Midfielders' },
  4: { label: 'FWD', textClass: 'text-pos-fwd-text', bgClass: 'bg-pos-fwd-bg', rowLabel: 'Forwards' },
}

function diffClass(d: number): string {
  if (d <= 2) return 'text-easy bg-easy-bg'
  if (d === 3) return 'text-mid bg-mid-bg'
  return 'text-hard bg-hard-bg'
}
```

---

## Typography rules applied

| Element | Font | Size | Weight | Case |
|---|---|---|---|---|
| App name in header | Rajdhani | 22px/20px | 700 | Mixed case |
| Hero h1 | Rajdhani | clamp(36px,5vw,56px) | 700 | Sentence |
| Score demo "84.2" | Rajdhani | clamp(72px,12vw,140px) | 700 | — |
| Score banner big number | Rajdhani | 72px | 700 | — |
| Gap badge in banner | Rajdhani | 28px | 700 | — |
| Pitch card pts number | Rajdhani | 20px (text-xl) | 700 | — |
| List card pts number | Rajdhani | 24px (text-2xl) | 700 | — |
| All body/labels/UI | DM Sans | 10px–16px | 400/500/600 | Sentence |
| Position tags (GK/DEF/MID/FWD) | DM Sans | 9px | 700 | ALL-CAPS ✓ |
| Gameweek label (GW38) | DM Sans | 10px | 500 | ALL-CAPS ✓ |
| Section headers | DM Sans | 12px | 500 | Sentence, ink-3 |

---

## Mobile responsiveness

- `px-5` container padding on mobile everywhere
- Hero: score number on top (`order-first sm:order-last`), headline below; flex-col on mobile, flex-row on sm
- Team input + button: always inline (both h-11=44px, fits at 375px)
- Pitch: `hidden sm:block` — collapsed to list view (`block sm:hidden`) below 640px
- Bench: `-mx-5 px-5` horizontal scroll bleed on mobile, `sm:mx-0 sm:px-0 sm:flex-wrap sm:justify-center` on desktop
- All touch targets: minimum 44px (h-11 for button/input, w-11 h-11 for dark mode toggle)

---

## What is NOT changed

- `src/types.ts` — no changes
- `src/services/prediction.ts` — no changes  
- `vite.config.ts` — no changes
- `loadTeam()` async function — no changes
- `useDarkMode()` hook — no changes
- All fetch/API logic — no changes
- Defensive contribution calculation — no changes

---

## Verification

1. App loads — white (#F7F9FC) background, dark navy header, hero shows huge "84.2" on right
2. Hero text is sentence case, no eyebrow label, no BETA pill
3. Dark mode toggle: base switches to #0B1220, surface cards to #131B2E, text to #E7ECF5
4. Enter any team ID → loading states appear → on success: blue left-border score banner appears, green pitch formation below (on sm+)
5. On 375px viewport: pitch is replaced by grouped vertical list, bench scrolls horizontally
6. No drop shadows visible anywhere (DevTools → Computed → box-shadow should be "none" on all cards)
7. All buttons/inputs are ≥44px tall
