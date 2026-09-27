---
title: Get started
description: Create a map project, ask your agent for a first draft, check it and build the site.
---

You need Node 22.18 or later, a subject to map, and material your coding agent can use: notes,
documentation, slides, a syllabus or a codebase.

## Create the project

```sh
npx onboarding-map init my-map
cd my-map
npm install
```

`init` creates `map.ts`, installs the map-writing skills for your agent, and adds the project
commands. In a terminal, it asks where to install the skills. If you run it from a non-interactive
shell, pass `--target agents` (or the folder your agent reads). You can start from the longer Physics
example with `npx onboarding-map init my-map --template physics`.

## Ask your agent for a draft

Give your agent the source material and ask it to make the map:

> Read these notes and make an onboarding map for a new teammate. Draft the map in `map.ts`, run
> `npx onboarding-map validate --json`, and show me the route and anything you could not verify.

The agent writes the file; you decide what belongs on the route and whether its sources support the
content. See [working with your agent](/user-guide/working-with-your-agent/) for prompts and the
installed skills.

## Review the map

```sh
npx onboarding-map dev
```

Open the local address printed by the command. The site reloads when `map.ts` changes and reports
validation errors in the page. Walk the route and ask the agent to revise any part that does not
make sense.

Before sharing, check the references and review the agent's change summary:

```sh
npx onboarding-map validate
npx onboarding-map audit
npx onboarding-map changelog
```

`validate` catches broken references and stops an invalid build. `audit` lists unfinished or possibly
stale content. `changelog` summarizes what changed for you to review.

## Build the site

```sh
npx onboarding-map build
```

The command writes the finished site to `dist/`. For a free GitHub Pages deployment, follow
[Deploying your map](/user-guide/deploying-your-map/).

:::tip
The map is one file, but a complete map takes real writing. Start with the agent and its skills
rather than trying to fill in every field yourself.
:::
