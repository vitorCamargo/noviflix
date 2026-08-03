# Design notes

## Palette

Accent is used sparingly and with intent: one word in the headline, the primary
button, active nav state, progress rings, `#N` rank markers, play triangles.
Everything else is white, grey, or the artwork itself.

Already in `src/styles/_tokens.scss`.

## Loading sequence

Three distinct stages, worth reproducing because it sets the tone:

1. **Boot** — a small white outline circle with a centre dot, plus a large ring
   drawing itself in accent colour. Both off-centre, asymmetric.
2. **Ready** — collapses to a single centred accent ring with a play triangle
   inside, and a small dot orbiting the ring's edge.
3. **Enter** — content rises into place.

## Layout

- **Faint grid overlay** across the whole page — dim lines with small `+`
  crosshair marks at intersections. Floating cards align to it, and some cards
  have crosshairs on their corners, which visually pins them to the grid. This is
  the single most characteristic thing about the design.
- **Two-column split**: large text left, a cluster of overlapping cards right.
- **Deliberate overlap and depth** — cards sit on top of each other at slight
  offsets rather than in a tidy row. Album art overlaps a stats panel; a small
  "featured" card hangs off the top-right corner of a portrait.
- **Header**: mark top-left, then sparse text links (`About`, `Share`). A pill
  button floats centred. User avatar and a kebab menu sit top-right.
- **Bottom-left hint text** in muted grey (`Swipe or scroll to navigate`).
- **Carousel** of circular avatars with chevron buttons, active item ringed in
  accent.

## Typography

Very heavy weight (800–900), tight letter-spacing, large size. Headline is two
lines with the emphasised word in accent, ending in a period — `you listen.`
Noviflix equivalent: `you watch.` Body copy is noticeably lighter and looser
than the headline, in grey.
