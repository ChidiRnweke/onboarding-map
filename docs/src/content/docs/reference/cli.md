---
title: Command line
description: Every onboarding-map command and option.
---

The package installs one command, `onboarding-map` (or `npx onboarding-map`).

## Commands

| Command          | What it does                                                                                                        |
| ---------------- | ------------------------------------------------------------------------------------------------------------------- |
| `init [dir]`     | Start a project with `map.ts`, config, `package.json` and skills. `--template starter\|physics`; `--target` chooses where to install the skills. |
| `dev`            | Serve the map; reload on save and list validation problems in the page. `--port` defaults to `4321`.                                      |
| `build`          | Validate and write a static site to `./dist` (`map.json` and the app). `--out <dir>` changes the output folder.                           |
| `validate`       | Check every reference; exit 1 on errors.                                                                            |
| `changelog`      | What changed since a git revision, as Markdown for review. `--against <rev>` (default `HEAD`), `--out <file>`.      |
| `audit`          | Stale or unfinished content. `--check-urls` also requests every link (slow).                                        |
| `schema`         | Print the JSON Schema for `map.json` files.                                                                         |
| `skills install` | Install or update the agent skills. `--target` chooses where to install them.                                                               |

## Common options

- `--map <file>` — the map file. Defaults to the one named in `onboarding-map.config.json`, else the
  first of `map.ts`, `map.json`, `map.js`.
- `--target <targets>` — `claude`, `agents`, `codex`, a comma-separated list, `all` or `none`. If
  omitted in a terminal, `init` and `skills install` ask where to put the skills; in a non-interactive
  shell, pass the flag.
- `--port <port>` — the `dev` server port.
- `--out <dir>` — the `build` output folder.
- `--json` — machine-readable output, for scripts and agents. Supported by `validate`, `changelog`
  and `audit`. `audit --check-urls` also checks documentation links over the network.

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
