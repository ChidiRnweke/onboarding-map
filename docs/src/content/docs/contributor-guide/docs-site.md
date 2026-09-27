---
title: The docs site
description: How this site is built, themed like the map, and deployed to GitHub Pages.
---

This site is Astro + Starlight, in `docs/`. It is its own package with its own
`package-lock.json`, so its dependencies never enter the published package.

## Run it

```sh
npm --prefix docs install
npm run docs:embed          # build the live map into docs/public/embed (once)
npm --prefix docs run dev
```

`docs:embed` lives in the root `package.json`. It builds the SvelteKit shell with a base path and
runs the CLI's `build` to write the physics template to `docs/public/embed/physics`. The landing
page iframes that folder as a live map.

## The design is the map's

The docs are meant to look like the product, not like default Starlight:

- **`docs/src/styles/tokens.css`** mirrors the palette, fonts and radii from the app's
  `src/app.css`. Change one, change the other.
- **`docs/src/styles/theme.css`** maps Starlight's `--sl-color-*` variables onto those tokens.
- **`docs/src/components/`** holds the custom `SiteTitle`, `Hero` and `Footer`.
- The landing hero (`Hero.astro`) frames the live map like a panel.

## The embed and `base`

GitHub Pages serves this repository at `/onboarding-map/`, so `astro.config.mjs` sets `base`. The
prebuilt map shell hardcodes its asset paths, so it is built with a matching base
(`ONBOARDING_BASE`) or it would fetch `/map.json` from the domain root. That is the only reason
`svelte.config.js` reads `ONBOARDING_BASE`; the published shell keeps an empty base.

Astro does not prefix `base` onto Markdown links, so `astro.config.mjs` has a small rehype plugin
that does it. Write internal links root-absolute (`/user-guide/cli/`).
