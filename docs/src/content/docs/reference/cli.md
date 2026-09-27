---
title: Command line
description: Every onboarding-map command and option.
---

The package installs one command, `onboarding-map` (or `npx onboarding-map`).

## Commands

| Command          | What it does                                                                                                        |
| ---------------- | ------------------------------------------------------------------------------------------------------------------- |
| `init [dir]`     | Start a project: `map.ts`, config, `package.json`, agent skills. `--template starter\|physics` (default `starter`). |
| `dev`            | Serve the map; reload on save; list validation problems in the page. `--port` (default `4321`).                     |
| `build`          | Validate and write a static site to `./dist` (`map.json` + the app). `--out <dir>` to change the folder.            |
| `validate`       | Check every reference; exit 1 on errors.                                                                            |
| `changelog`      | What changed since a git revision, as Markdown for review. `--against <rev>` (default `HEAD`), `--out <file>`.      |
| `audit`          | Stale or unfinished content. `--check-urls` also requests every link (slow).                                        |
| `schema`         | Print the JSON Schema for `map.json` files.                                                                         |
| `skills install` | (Re)install the agent skills into your project. `--target claude,agents,codex\|all\|none`.                          |

## Common options

- `--map <file>` — the map file. Defaults to the one named in `onboarding-map.config.json`, else the
  first of `map.ts`, `map.json`, `map.js`.
- `--json` — machine-readable output, for scripts and agents. Supported by `validate`, `changelog`
  and `audit`.

## Problems carry a path

Every issue has a `path` into the map — `nodes.git`, `stages.setup` — and a `message`. An agent can
use the path to go straight to what to fix.

```sh
$ npx onboarding-map validate --json
{
  "ok": false,
  "errors": [
    {
      "path": "stages.setup.waypoints[0]",
      "message": "No node with id 'editr'. Did you mean 'editor'?"
    }
  ],
  "warnings": []
}
```

`validate` exits non-zero when there are errors; `audit` never fails the build.

## Where the config lives

`onboarding-map.config.json` holds two settings, both overridable by flags:

```json
{ "map": "./map.ts", "out": "./dist" }
```
