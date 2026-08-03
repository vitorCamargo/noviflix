# Noviflix

Movie discovery app — Angular 22, standalone components, signals, zoneless change
detection, SCSS. Dark UI with a `#33c5cf` accent.

**Current state: skeleton.** Routing, i18n and models are real; every page is a
placeholder. Features get built one commit at a time.

## Setup

```bash
npm install
npm start          # dev server on http://localhost:4200
npm run build      # production bundle into dist/
npm test           # Vitest unit tests
```

TMDB calls route through a Cloudflare Worker that holds the token server-side, so
no credential lives in this repo.

## Deployment

GitHub Pages, published by `.github/workflows/deploy.yml` on every push to
`master`.

## What exists

```
src/app/
  core/
    i18n/          I18nService, en + pt-BR dictionaries, specs
    models/        tmdb.models.ts, user-collection.models.ts
  layout/          site header (logo, nav, About, language switcher),
                   about-popover, horizontal-scroll directive
  shared/
    language-switcher/
    overlay-panel/      large two-column dialog shell
    popover/            anchored popover with trigger + notch
    page-placeholder/   temporary — delete once all pages are real
  features/        home, search, movie-details (page + modal),
                   collections, collection-details, not-found
src/styles/        _tokens.scss (all design tokens), _mixins.scss
public/            logo-mark.svg, logo-wordmark.svg, favicon.svg
```

### Routing

All five pages plus the pop-up are wired and navigable:

| Route              | Renders                                        |
| ------------------ | ---------------------------------------------- |
| `/`                | Home                                           |
| `/search?q=`       | Search results (reads `q` from the URL)        |
| `/movie/:id`       | Movie details, full page                       |
| `/collections`     | The user's collections                         |
| `/collections/:id` | One collection                                 |
| `**`               | 404                                            |

`movie/:id` is registered twice — once on the primary outlet, once on a named
`modal` outlet. Linking to `[{ outlets: { modal: ['movie', id] } }]` overlays the
details without disturbing the page behind it; `/movie/123` typed directly renders
the full page. The modal shell works now (Escape, scrim click, body scroll lock);
its body is still a placeholder.

### Layout and scrolling

The shell is header + content, nothing else. There's no footer; the TMDB
attribution it used to carry now lives in the About panel, which is where the
privacy and authorship copy sits anyway.

Above 901px the content area becomes a **horizontal track** and `HorizontalScroll`
maps vertical wheel input onto it. Below that it's an ordinary vertical page.

The breakpoint is defined once, in the `.nv-track` media query in `styles.scss`.
The directive doesn't repeat it as a `matchMedia` check — it asks whether the
element actually has horizontal overflow, which is only true when CSS has put it
in track mode. One source of truth, no chance of the two drifting apart.

Motion is eased rather than applied directly: each wheel event adds to a target
offset and a `requestAnimationFrame` loop covers 14% of the remaining distance per
frame. Mouse wheels arrive as coarse steps, so assigning `scrollLeft` straight
across feels like jumping; easing turns the same input into a glide, and
successive clicks accumulate into one longer movement. `prefers-reduced-motion`
skips it and jumps directly. The track sets `scroll-behavior: auto` so the browser
doesn't smooth on top of the loop and produce rubbery lag.

**No scrollbars anywhere.** Hidden globally via the `hide-scrollbar` mixin —
`scrollbar-width: none` plus the WebKit pseudo-element. Scrolling is untouched:
wheel, trackpad, touch and keyboard all work. Worth knowing this removes the
visual cue that a region scrolls, so content that continues past the fold needs
to hint at it some other way — a peeking next card, a fade at the edge.

Three things it deliberately does *not* do:

- **Horizontal gestures pass through.** Trackpad swipes and shift+wheel already
  scroll sideways; translating them again would double the movement.
- **Nested vertical scrollers win.** Before hijacking, it walks up from the event
  target looking for an ancestor that scrolls vertically and still has room. A
  dialog body or popover panel keeps its own scrolling.
- **Boundaries release the event.** At either end it stops calling
  `preventDefault`, so overscroll and back-swipe gestures still work.

The scroll logic is split into two exported pure functions — `resolveWheelDelta`
and `findNestedVerticalScroller` — because the interesting parts are arithmetic
and precedence, testable without a layout engine. jsdom reports zero for all
scroll metrics, so the specs define them explicitly.

The track carries `tabindex="0"`: a scrollable region has to be keyboard-reachable
to be operable with arrow keys (WCAG 2.1.1).

### Grid backdrop, glow and cursor

Ported from [vitorCamargo/v-spotifood](https://github.com/vitorCamargo/v-spotifood)
(MIT), which is where this structure comes from. Cell size is 64px rather than
that project's viewport-derived `10vh`.

**The grid is real DOM, not a background image.** `GridBackdrop` renders a field
of opaque rounded pads with a `1px` margin on two sides. Nothing draws a line —
the seams *are* the gaps, and the darker `--nv-grid-seam` behind shows through
them.

That detail carries the whole effect, because of what it enables next.

**The glow sits underneath the pads.** `MouseGlow` is a radial gradient following
the pointer at `--nv-z-glow: 5`, below the pads at `10`. Opaque pads occlude it
everywhere except the seams, so it reads as the grid *lighting up* around the
cursor. The pads mask the glow into grid shape for free — no per-pad work, no
hit-testing, no reacting to pointer position at all.

Layer order matters here, so it's a documented scale in `_tokens.scss`:
glow `5` → pads `10` → content `20` → header `100` → modal `200` →
scroll overlay `800` → cursor `900`.

**The cursor trails via a CSS transition,** not an animation loop. Both dot and
ring get the same transform on every `mousemove`; the ring carries
`transition: transform .8s cubic-bezier(.05,.8,.4,1)` and the browser eases it.
Cheaper than a rAF lerp and it stays smooth under main-thread load. Pressing the
mouse swells the dot. Transforms are written straight to the elements rather than
through bindings — this fires constantly and shouldn't drive change detection.

**`ScrollOverlay`** blocks pointer events for 66ms after each scroll event.
Without it, content sliding under a stationary cursor fires hover states on
everything that passes beneath, which reads as flicker.

Grid dimensions come from `computeGrid`, exported and unit tested: rounds up to
over-fill rather than leave a bare strip, holds a minimum column count, and caps
total pads so a huge viewport can't stall layout.

Everything is fine-pointer and `min-width: 576px` only — the same query gates
`cursor: none`, so touch and small screens keep the system pointer.

### Page grid

`PageGrid` lays a page on the drum lattice. Content is projected in and places
itself with `grid-area`; the pads are a complete field behind it.

The rule that matters: **content covers pads, it never replaces them.** An
earlier version subtracted placed areas from the pad count and let auto-placement
fill the remainder — which punched visible holes in the lattice wherever a block
was transparent, like behind the headline. The pad layer now spans every track
and re-declares the same lattice inside itself, so pads still align with the
cells content occupies.

No z-index is involved. The pad layer is the first child, so every later sibling
paints over it in DOM order.

`DrumCard` enforces the two rules that make a card belong to the grid rather than
sit on it: the box is a whole number of cells, and the corner radius matches the
pads' so the rounding reads as continuing the lattice. Its hover border is an
inset `box-shadow` rather than a real border — a border would change the box size
and knock the card off the lattice.

Row counts vary with viewport height because cells are a fixed 64px, so a layout
that pinned content to absolute rows would slide around on resize. `home-layout.ts`
defines a 10-row composition block and `centreOffset` centres it in whatever rows
exist.

### Overlay primitives

Two reusable shells, both built from the design reference:

**`nv-popover`** — pill trigger with a panel beneath it. The trigger turns accent
when open, and a notch bridges trigger and panel so the panel reads as anchored
rather than floating. Closes on outside click and Escape, returns focus to the
trigger. Inputs: `label`, `align` (`start` | `end`), `width`, `notch`. Project an
icon with the `nvPopoverIcon` attribute; everything else becomes panel content.

**`nv-overlay-panel`** — the large centred dialog. Four projection slots:

```html
<nv-overlay-panel ariaLabel="…" [connector]="true" (closed)="close()">
  <div nvPanelToolbar>back / forward / actions</div>
  <div nvPanelFilters>filter tabs, right-aligned</div>
  <div nvPanelAside>headline + primary CTA</div>
  <div nvPanelBody>scrolling content grid</div>
</nv-overlay-panel>
```

Aside and body are a 5/7 split that collapses to one column under 900px and goes
full-bleed under 640px. The body gets a thin accent scrollbar. `connector` draws
the accent bar at the top edge that ties the panel to the nav item that opened
it. Close is red (`--nv-close`) so dismiss reads apart from the cyan accent.

The component only emits `closed` — it never decides what closing means, so the
caller stays in charge of routing.

Used by: the About panel in the header (popover) and the movie-details pop-up
(overlay panel).

### i18n

`I18nService` holds the language in a signal, so switching is instant — no reload,
no build-time locale bundles. Templates call `i18n.t('some.key')`; reading the
signal inside `t()` is what registers the view for re-render.

`en.ts` is the source of truth and `pt-BR.ts` is typed as `Dictionary`, so adding
an English key without translating it fails the build. Choice persists to
`localStorage`, falling back to the browser locale. `tmdbLang()` exposes the
matching BCP-47 tag, ready for the API layer.

Dictionaries are intentionally small — grow them per feature.

### Models

- `tmdb.models.ts` — TMDB response shapes (movies, credits, videos, genres).
- `user-collection.models.ts` — collections are **the user's own lists in
  localStorage**, not a TMDB resource. Saved items keep a denormalised snapshot
  (title, poster, year, score) so a collection renders without refetching, with
  the TMDB `id` kept for pulling full details on demand. The store is versioned
  for future migration.
