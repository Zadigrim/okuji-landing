okuji — landing page
====================
index.html    the page (links styles.css)
styles.css    all styles, extracted from the page
assets/       okuji-crest-ink.svg, okuji-crest-cream.svg — the o. crest mark,
              standalone (the page itself uses inline SVG, so these are extras)

notes
  - NO raster images. Every graphic (crest, topographic contour fields, all icons)
    is inline SVG in index.html — nothing else to ship for the visuals.
  - Fonts load from Google Fonts via the <link> in <head>: Inter, Source Serif 4,
    JetBrains Mono. Needs network at load time. Ask if you want them self-hosted
    (local @font-face, fully offline).
  - Single internal dependency: index.html → styles.css (same folder).
