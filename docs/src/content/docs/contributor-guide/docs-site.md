---
title: The docs site
description: How this site is built, themed like the map, and deployed to GitHub Pages.
---

This site is Astro + Starlight, in `docs/`. It is its own package with its own
`package-lock.json`, so its dependencies never enter the published package.

## Run it

```sh
npm --prefix docs install
npm run docs:embed          # build the live maps into docs/public/embed (once)
npm --prefix docs run dev
```

`docs:embed` runs `tools/embed-maps.mjs`. It builds the SvelteKit shell once per example, each with
a base path matching where that copy is served, runs the CLI's `build` for each map, and copies each
source file to `docs/public/examples/`. The **Examples** page puts the live map and its data side by
side with `MapData.astro`; the landing page frames one live map.

## The design is the map's

The docs are meant to look like the product, not like default Starlight:

- **`docs/src/styles/tokens.css`** mirrors the palette, fonts and radii from the app's
  `src/app.css`. Change one, change the other.
- **`docs/src/styles/theme.css`** maps Starlight's `--sl-color-*` variables onto those tokens.
- **`docs/src/components/`** holds the custom `SiteTitle`, `Hero`, `Footer` and `MapData`.
- The landing hero (`Hero.astro`) frames the live map like a panel.

## The embeds and `base`

GitHub Pages serves this repository at `/onboarding-map/`, so `astro.config.mjs` sets `base`. A
prebuilt map shell resolves its assets and `map.json` from a compiled-in base, so each embedded copy
is built with `ONBOARDING_BASE` set to the path it is served from, under `/onboarding-map/embed/…`.
That is the only reason `svelte.config.js` reads `ONBOARDING_BASE`; the published shell keeps an
empty base.

Astro does not prefix `base` onto Markdown links, so `astro.config.mjs` has a small rehype plugin
that does it. Write internal links root-absolute (`/reference/cli/`).
