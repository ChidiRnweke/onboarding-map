---
title: Deploying your map
description: Build the static site and publish it to GitHub Pages with a free GitHub Actions workflow.
---

`onboarding-map build` makes a static website in `dist/`. It contains the map data and the files the
browser needs to show it. There is no app server to run: a static host serves those files.

For a public repository, GitHub Actions can build the site and publish it to GitHub Pages at no
charge.

## Add a workflow

Commit your map project, including `map.ts`, `package.json` and `package-lock.json`. Add this file as
`.github/workflows/deploy.yml`:

```yaml
name: Deploy map

on:
  push:
    branches: [main]

permissions:
  contents: read
  pages: write
  id-token: write

concurrency:
  group: pages
  cancel-in-progress: true

jobs:
  build:
    runs-on: ubuntu-latest
    steps:
      - uses: actions/checkout@v4
      - uses: actions/setup-node@v4
        with:
          node-version: 24
          cache: npm
      - run: npm ci
      - run: npm run build
      - uses: actions/configure-pages@v5
      - uses: actions/upload-pages-artifact@v3
        with:
          path: dist

  deploy:
    needs: build
    runs-on: ubuntu-latest
    environment:
      name: github-pages
      url: ${{ steps.deployment.outputs.page_url }}
    steps:
      - id: deployment
        uses: actions/deploy-pages@v5
```

In your repository, open **Settings → Pages** and set **Build and deployment → Source** to **GitHub
Actions**. Push to `main`; the workflow installs dependencies, builds the map and publishes `dist/`.
The URL appears in the deployment job and the Pages settings.

## Use a site-root URL

The built map expects to live at the root of its domain. Use a GitHub Pages user or organization site
(for example, `your-name.github.io`) or connect a custom domain. A project Pages URL such as
`your-name.github.io/my-map/` adds a repository path; the current map build does not set that path.

GitHub Pages hosting and GitHub-hosted Actions are free for public repositories. For private
repositories, Pages availability and Actions minutes depend on your GitHub plan.

Next: [the command-line reference](/reference/cli/).
