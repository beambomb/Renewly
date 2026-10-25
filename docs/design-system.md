# Renewly Design System

Source of truth for all UI decisions. Components use ONLY the tokens defined here.

## Provenance (reproducible)

- Reference repo: https://github.com/nextlevelbuilder/ui-ux-pro-max-skill (MIT licence)
- Commit used: `04cfb449bd8494811ad63e94172a308fa25a551a` (shallow clone into the git-ignored `design-reference/`)
- Not committed to this repo. Content below is paraphrased and adapted from its generator output; attribution: UI UX Pro Max, (c) nextlevelbuilder, MIT.
- Generator run (Python 3.12, stdlib only, no network, no `--persist`):

```
python design-reference/.claude/skills/ui-ux-pro-max/scripts/search.py "<query>" --design-system -p "Renewly" -f markdown [--density 6 --motion 4]
python .../search.py "progress ring gauge dashboard" --domain chart -n 4
python .../search.py "app router server components images fonts" --stack nextjs -n 6
python .../search.py "touch target bottom navigation thumb" --domain ux -n 6
```

- The `npx ui-ux-pro-max-cli` installer was NOT used; the Python scripts were skimmed (imports: csv, json, re, pathlib, tempfile; no sockets/subprocess/eval) and run directly.

### Query history and why the result was chosen

1. Full product query ("personal subscription, recurring-purchase and warranty tracker; mobile-first PWA; data dashboard of circular progress rings with logos") returned Glassmorphism on a dark navy palette with Fira Code/Fira Sans. Its page pattern ("Product Demo + Features") is a marketing-page pattern and does not fit an app.
2. The skill says to verify fit and retry once with a narrower rewrite. Query "subscription tracker finance dashboard mobile app" (`--density 6 --motion 4`) returned **Minimalism & Swiss Style**, listed as best for dashboards, SaaS and professional tools, with accessibility risk "low" (Glassmorphism is "conditional" because blur reduces text contrast). This is the chosen direction.
3. Its page pattern ("Trust & Authority + Conversion") is also a landing-page pattern and is NOT applied. App layout comes from the chart/dashboard and mobile UX searches below.

No bolder/expressive style was recommended for this product; the expressiveness lives in the rings themselves (large, high-contrast, state colour plus text).

## Style: Minimalism & Swiss

Clean, functional, grid-based, high contrast, geometric sans-serif, generous white space. Light and dark both supported. Sharp or no shadows. Hover/press feedback 150-250ms.

Anti-patterns (from the generator, plus project additions):

- Playful design, poor security UX, AI purple/pink gradients.
- Raw hex in components; use tokens.
- Emoji as structural icons. (User-chosen emoji as an item's logo is content, not an icon, and is allowed.)
- Colour as the only status signal.
- Removing focus rings, hover-only interactions, instant 0ms state changes, one duration for everything.
- Overshoot easing (`back.out`) on dense data: the skill flags it as sloppy on informational UI.

## Tokens

The block below is parsed by `scripts/check-design-tokens.mjs` (names present, WCAG AA contrast of declared pairs). `src/app/globals.css` mirrors it.

```css
:root {
  /* surface and text (skill palette, light) */
  --color-background: #F8FAFC;
  --color-foreground: #020617;
  --color-card: #FFFFFF;
  --color-card-foreground: #020617;
  --color-muted: #E8ECF1;
  --color-muted-foreground: #475569;
  --color-border: #CBD5E1;
  --color-primary: #0F172A;
  --color-on-primary: #FFFFFF;
  --color-secondary: #1E3A8A;
  --color-on-secondary: #FFFFFF;
  --color-accent: #A16207;
  --color-on-accent: #FFFFFF;
  --color-destructive: #DC2626;
  --color-on-destructive: #FFFFFF;
  --color-focus: #1E3A8A;
  /* ring status (project addition, see AA notes) */
  --color-status-ok: #15803D;
  --color-status-soon: #B45309;
  --color-status-urgent: #C2410C;
  --color-status-overdue: #DC2626;
  --color-track: #CBD5E1;
}

.dark {
  --color-background: #0F172A;
  --color-foreground: #F8FAFC;
  --color-card: #192134;
  --color-card-foreground: #F8FAFC;
  --color-muted: #101A34;
  --color-muted-foreground: #94A3B8;
  --color-border: #334155;
  --color-primary: #F8FAFC;
  --color-on-primary: #0F172A;
  --color-secondary: #93C5FD;
  --color-on-secondary: #0F172A;
  --color-accent: #FACC15;
  --color-on-accent: #020617;
  --color-destructive: #F87171;
  --color-on-destructive: #020617;
  --color-focus: #93C5FD;
  --color-status-ok: #4ADE80;
  --color-status-soon: #FBBF24;
  --color-status-urgent: #FB923C;
  --color-status-overdue: #F87171;
  --color-track: #334155;
}
```

### Contrast pairs enforced by the script (WCAG AA)

Text pairs need 4.5:1, non-text (ring strokes, borders used as boundaries, focus) need 3:1. Both themes are checked independently.

### AA adjustments to the generated palette

- The skill's dark theme was not generated for the chosen style; the dark values above are derived by me (dark tokens come from the Glassmorphism dark palette surface values `#0F172A` / `#192134` / `#94A3B8`, which the generator emitted, plus inverted primary/accent).
- Skill border `#E2E8F0` on `#FFFFFF` is about 1.2:1. Used as a decorative divider that is fine, but control boundaries need 3:1, so `--color-border` is darkened to `#CBD5E1`, and form controls use `--color-muted-foreground` for their outline. (Final values verified by the script; any change is recorded here.)
- Status colours are not in the skill palette (it has only one destructive colour). They are my addition, chosen to meet 3:1 as ring strokes and 4.5:1 as text on card in each theme.
- Accent `#A16207` was already adjusted by the generator from `#CA8A04`; kept.

## Typography

- Heading and body: IBM Plex Sans (generator pick for finance/trust), loaded with `next/font/google` (self-hosted, zero layout shift; skill Next.js rule). Weights 400, 500, 600, 700.
- Base 16px, line-height 1.5 body, 1.2 headings. Numbers in rings and cost summaries use `font-variant-numeric: tabular-nums`.
- Scale (rem): 0.75 caption (labels only, never body), 0.875 small, 1 body, 1.125 lead, 1.25 h3, 1.5 h2, 2 h1, 2.5 summary figure.

## Spacing, radius, shadow, density

- Density dial 6 (standard). 4/8 rhythm: `--space-1: 4px`, `2: 8px`, `3: 12px`, `4: 16px`, `6: 24px`, `8: 32px`, `12: 48px`, `16: 64px`.
- Page gutters 16px on phones, 24px from 768px. Content max width 1120px. Ring grid: 2 columns at 375px, 3 at 640px, 4 at 1024px, 5 at 1280px.
- Radius: `--radius-sm: 6px`, `--radius-md: 10px`, `--radius-lg: 16px`, `--radius-full: 9999px`.
- Shadow: flat by default (1px border). `--shadow-sm: 0 1px 2px rgb(2 6 23 / 0.08)`; `--shadow-md: 0 4px 12px rgb(2 6 23 / 0.10)` for sheets only. No blur effects, no glass.
- Icon sizes: `--icon-sm: 16px`, `--icon-md: 20px`, `--icon-lg: 24px`. Single icon family (Lucide), one stroke width (2px), outline style only.

## Component rules

- Touch targets at least 44x44px, at least 8px between adjacent targets, expand hit area for small icons. Bottom navigation has at most 5 items (planned: Home, Add, Alerts, Settings = 4).
- Primary action in the thumb zone: the quick-add button is a bottom-anchored control above the nav. Respect `env(safe-area-inset-*)` for fixed bars; add bottom padding so scroll content is never hidden.
- Forms: visible labels (never placeholder-only), helper text only where it prevents a mistake (examples go in placeholders), optional fields grouped in one "More details" disclosure instead of "(optional)" tags, inline error next to the field, multi-error forms focus a linked error summary. Native controls where possible.
- Dialogs/sheets: focus trap, Escape closes, focus returns to the trigger, destructive confirmation names the item.
- Pressed feedback within 80-150ms using colour/opacity, never layout-shifting transforms.
- Cursor pointer on all clickable elements; visible disabled state with native `disabled`.
- Focus: 2px outline `--color-focus` with 2px offset on every interactive element, never removed. Sticky UI must not cover focused elements (`scroll-padding` for the bottom bar).
- No emoji, no raw hex, no ad-hoc spacing in components.

### Ring component rules (chart guidance: Gauge / custom SVG)

- Custom SVG ring, no chart library (generator lists Custom SVG as a recommended gauge implementation).
- The number and label sit beside/below the gauge as visible text ("12 days left", "Due today", "Overdue by 3 days"). Red/amber/green alone is insufficient (generator note), so each state also has a text label and a distinct glyph in a status chip: ok = check, soon = clock, urgent = alert triangle, overdue = alert octagon. The urgent state additionally draws a dashed track segment marker.
- States: comfortable more than 30% left, soon 30% or less, urgent 3 days or less, overdue past due. Urgent wins over soon; overdue wins over all.
- Accessible fallback: the SVG has `role="img"` with an `aria-label` like "Netflix, 12 days left, 40 percent of the cycle remaining, status soon". Focusing a ring card reveals the same details as hover (title attribute is not relied on).
- Logo centre: image, else user emoji, else initials (max 2 letters). Decorative duplicates are `aria-hidden`.
- Ring stroke 8px at 96px size (grid cards), 10px at 160px (detail).

## Motion rules

- Tokens: `--duration-press: 120ms`, `--duration-fast: 180ms`, `--duration-base: 250ms`, `--duration-ring: 600ms`.
- Easing: `--ease-standard: cubic-bezier(0.2, 0, 0, 1)`, `--ease-exit: cubic-bezier(0.4, 0, 1, 1)`. Exits faster than enters.
- Ring fill animates `stroke-dashoffset` (transform/opacity-class property, no width/height animation) once on mount and on reset. Grid items stagger 40ms each, capped at 12 items, no overshoot.
- `prefers-reduced-motion: reduce`: all of the above are disabled and the final state renders immediately; the "bought again" reset is communicated by text and an `aria-live` announcement.
- Motion must convey meaning (reset, appear), never decoration.

## Layout and mobile UX (skill guidance applied)

- Mobile-first breakpoints 375 / 768 / 1024 / 1440, viewport meta present, zoom NOT disabled, no horizontal scroll.
- Fixed header/bottom bar compensate with padding; sticky nav never overlaps first content.
- Disable accidental pull-to-refresh with `overscroll-behavior: contain` where not needed.
- Reserve image space (explicit logo sizes) to keep CLS under 0.1; logos lazy-loaded below the fold.
- Long lists: the dashboard renders 200 rings; use CSS `content-visibility: auto` per card and avoid per-card effects.

## Next.js stack guidance applied (generator, nextjs 16.2 entries)

- App Router, file-based routing, Server Components by default, `'use client'` only for interactive leaves (ring animation, forms, sheets).
- Fetch initial data in Server Components, not `useEffect`.
- `next/font` for fonts. Colocate route-specific components in `_components/`.
- shadcn/ui was NOT recommended by the generator for this query, so it is not used; plain Tailwind with tokens plus small hand-written primitives.

## Landing page tokens

The public landing page (`src/app/(marketing)/`) is always dark (`.dark` tokens), flat (no gradient, glow, blur, glass or shadow) and uses only the colour tokens above. Its extra tokens live in the plain `:root` block of `globals.css` (not `@theme`, so Tailwind never prunes them) and are consumed through `var(--...)` in `landing.css`. Landing section rhythm may use `--space-24` (96px) and `--space-40` (160px), which sit above the app spacing scale.

| Token | Value | Used for |
| --- | --- | --- |
| `--text-display`, `--leading-display`, `--tracking-display` | `clamp(3rem, 7vw, 7rem)`, `0.95`, `-0.03em` | h1 |
| `--text-section`, `--leading-section`, `--tracking-section` | `clamp(1.75rem, 3.6vw, 3.5rem)`, `1.1`, `-0.02em` | h2, track sentences, footer wordmark |
| `--text-counter` | `calc(var(--text-display) * 1.6)` | hero day counter |
| `--monogram-size` | `2.5rem` | monogram in the hero ring |
| `--container-landing` | `90rem` | max content width |
| `--space-24`, `--space-40` | `6rem`, `10rem` | section padding (phones, from 768px) |
| `--ease-expo` | `cubic-bezier(0.16, 1, 0.3, 1)` | hero ring draw |
| `--duration-hero-cycle`, `--delay-hero-start` | `4000ms`, `200ms` | hero ring sequence |
| `--duration-pulse`, `--duration-chip`, `--delay-chip` | `700ms`, `500ms`, `300ms` | halo pulse, reminder chip arrival |
| `--stagger-ring`, `--duration-switch` | `120ms`, `400ms` | satellite stagger, reminder stage ring change |
| `--rise-distance`, `--rise-distance-sm` | `1rem`, `0.5rem` | rise-in distances |
| `--halo-scale`, `--halo-opacity` | `1.12`, `0.55` | halo pulse |
| `--hero-ring-size-sm/-md/-lg` | `112vw`, `clamp(24rem, min(90svh, 70vw), 48rem)`, `clamp(28rem, min(92svh, 52vw), 60rem)` | giant ring size per breakpoint |
| `--hero-text-max`, `--hero-ring-bleed`, `--chip-max` | `48%`, `8%`, `70%` | hero layout |
| `--ring-size-satellite`, `--ring-size-track`, `--ring-size-stage` | `6rem`, `10rem`, `20rem` | demo ring sizes |
| `--band-min-height` | `max(20svh, 8.25rem)` | track band minimum height |
| `--footer-arc-size`, `--footer-arc-size-lg` | `90vw`, `60vw` | footer arc width |

Scoped motion exemption: the landing is a marketing surface. Two motions are presentational (the rise-in of the track sentences and the footer arc), both scroll-scrubbed, removed under reduced motion, and never hide content. Everything else on the page carries meaning (time passing, state change, a reminder arriving).

## Pre-delivery checklist (from the skill's `references/pro-rules.md`)

Run before declaring done; result is recorded in NOTES.md and README.

Process
- [ ] Relevant skill searches run for the interface
- [ ] quick-reference sections 1-3 reviewed as a final pass
- [ ] Tested at 375px and landscape
- [ ] Reduced motion and largest text size checked
- [ ] Dark mode contrast checked independently
- [ ] Touch targets 44px or more, nothing behind safe areas

Visual quality
- [ ] No emoji used as icons (SVG only; emoji logos are user content)
- [ ] One icon family and style
- [ ] Pressed states do not shift layout
- [ ] Semantic tokens only, no per-screen hex

Interaction
- [ ] Clear pressed feedback on all tappable elements
- [ ] Touch targets meet minimum size
- [ ] Timing uses shared tokens
- [ ] Disabled states clear and non-interactive
- [ ] Focus order matches visual order, labels descriptive
- [ ] No conflicting gestures

Light/dark
- [ ] Text contrast 4.5:1 in both themes
- [ ] Borders and states distinguishable in both themes
- [ ] Scrim legibility measured
- [ ] Both themes tested

Layout
- [ ] Safe areas respected
- [ ] Scroll content not hidden by fixed bars
- [ ] Small phone, large phone, tablet, portrait and landscape
- [ ] Gutters adapt by breakpoint
- [ ] 4/8 spacing rhythm
- [ ] Readable text measure on large screens

Accessibility
- [ ] Decorative icons `aria-hidden`
- [ ] Meaningful images have text alternatives
- [ ] Icon controls have names and state
- [ ] Form labels, hints, clear errors
- [ ] Colour is never the only indicator
- [ ] Reduced motion and text scaling do not break layout
- [ ] Sticky UI does not obscure focus
- [ ] No swipe-only or drag-only interactions
- [ ] Auth allows password managers/paste (magic link: email field with `autocomplete="email"`)
- [ ] Failed forms keep inline errors, and multi-error forms focus a linked summary
