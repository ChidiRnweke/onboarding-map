---
name: drafting-prs
description: Draft or revise PR titles and bodies for changes to this package (app, CLI, core) as concise records of intent, behavior, and verified evidence. Use when preparing or updating a PR here, and before implementing a UI change that needs before/after captures.
---

# Drafting PRs

A PR is durable context for humans and agents who arrive later. Explain why the change
was needed and what it does so a reader can understand it without the diff or conversation.

This skill is for PRs that change onboarding-map itself (`src/`, `tools/`, `templates/`,
`skills/*/SKILL.md`). It is not about the maps people build with the package.

## Gather the context

Read the task request, final changes, relevant checks, and `AGENTS.md`. Preserve the original
problem and intended outcome in your own words. Do not describe the prompting process or invent
rationale that the request and evidence do not support.

Read relevant merged PRs when they explain earlier intent or behavior. Check that history against
current code. An unmerged proposal is not evidence of current behavior.

Prepare evidence early. For UI fixes, attempt reproduction before editing. For a PR drafted after
implementation, recover the before state from `main` in a second worktree when feasible. Never
reset another agent's worktree.

## Write in Simplified Technical English

Write in the register of an architecture decision record: dry, precise, and about behavior and
its consequences. A PR is durable context for a human or agent who arrives later, so the body must
state the reason for the change as well as the change itself. Do not write a marketing summary, a
change log, or a work diary.

Apply the practical STE conventions without claiming formal certification: short sentences, one
idea per sentence, active voice, and common words; the same term for the same thing; a necessary
technical term defined at its first use; concrete verbs. Remove filler, praise, metaphor, and sales
language. Adjectives name a quality, not a value; a value statement names what a user or system
can now do.

Make the body semantic, not mechanical. Group changes by behavior and explain why each behavior
exists; a component inventory is not a description. "The bottom strip now reserves a right-hand
gutter, so the attribution badge can never sit under the journey nav" describes behavior and its
reason. "Added a div" lists a part. State the reason for a consequential choice, and keep a
rejected alternative only when it explains a material choice.

Use Conventional Commits for the title (`AGENTS.md` "Commit messages"): a type from the Angular
set, an optional scope, then a lowercase subject naming the concrete problem or resulting behavior,
not the internal mechanism. Rewrite the title and the body around the final implementation when
scope changes.

Use exactly these four sections, in this order — they match `.github/pull_request_template.md`:

### Why

Open with the problem, stated concretely and in behavior terms, and say who or what it affects.
State the intended outcome as an observable consequence, not a quality. Define the subject before
you refer to it by a shorthand: a reader cannot act on a noun the text has not named. Do not open
with a slogan, and do not open with a list of edits. Preserve the reason the work was requested.

### What changed

Explain previous and resulting behavior, with a concrete trigger or example when useful. Describe
the final solution and the choices behind it. Include compatibility or migration details here only
when a reader needs them to understand or use the change.

Format for scanning: lead each behavior group with a bold phrase, keep paragraphs to a few
sentences, and keep the section headings stable across the body.

### Evidence

Give a repeatable scenario and the observed result. For visible app changes, include captioned
before/after screenshots. For CLI or core changes, give a concrete input/output example (e.g.
`node dist/cli/index.js validate --map templates/physics.ts --json`). Do not force screenshots onto
CLI-only or core-only work.

### Validation

Name checks actually run and their results — at minimum `npm run build && npm run check && npm run
lint`, plus `npx commitlint --from origin/main`. State material limitations and checks not run when
they leave a relevant gap. Distinguish a screenshot-based spot check from a full
`shoot.mjs`/`diff.mjs` regression pass. Do not report pending CI as passed. Update this section
when the final results arrive.

Keep each section as short as the change allows. Remove file inventories, work diaries, raw logs,
abandoned approaches, repeated summaries, template comments, and empty checklist items. Keep a
rejected approach only when it explains a material choice.

## Reproduce and capture UI behavior

Attempt reproduction in the running app before editing. `ONBOARDING_MAP=<file> npm run dev` (prepend
`~/.nvm/versions/node/v24.21.0/bin` to `PATH`) renders any map file directly — `templates/physics.ts`
gives a map with many stages and periods, `templates/starter.ts` a minimal one. There is no auth and
no database to seed: the map file is the fixture.

Reach a specific screen state with two knobs, both read on load:

- **The URL hash** sets which stage/phase/step is open: `#<stage>/<phase>/<step>`
  (`src/lib/progress.ts`). `phase` is one of `brief`, `do`, `observe`, `read`, `done`; `step` is
  1-based in the hash. `#provision/do/3` opens stage `provision`, phase `do`, the third `do` item.
- **`localStorage`** sets what the hash cannot: whether a sidebar starts open
  (`onboarding-map:<name>-open`, `true`/`false`, `src/lib/sidebars.ts` — the panel, legend and
  minimap each have their own `name`) and whether the first-visit intro has been seen
  (`onboarding-map:<mapId>:intro-seen`, JSON `true`, `src/lib/progress.ts`; leave it unset to
  capture the intro itself). Set these with `page.addInitScript` before navigating, since the app
  reads them on mount.

Capture the actual running application. Use matching data, viewport, and interaction state for
before/after comparisons. Include the affected hover, focus, error, or loading state when that is
the issue. Inspect each capture for the claimed result. Never substitute a generated mockup or
label an after capture as before.

For a one-off capture (a single state, to check or document a change), use `tools/capture.mjs`
rather than writing a throwaway script:

```bash
node tools/capture.mjs http://localhost:5173/ out.png --hash '#provision/do/3' --theme dark
```

For a real before/after regression across viewports and both themes, use the existing pair
(`AGENTS.md` "Verifying a change"): build the branch's worktree and a `main` checkout, serve both,
then `node tools/shoot.mjs <new-url> <out> --baseline <main-url>` and `node tools/diff.mjs <out>`.
Its `--states` selectors are stale (predate the SvelteKit migration); drive interactions yourself
with `tools/capture.mjs` or Playwright directly when a state matters, rather than trusting them.

Two mechanics that silently spoil a capture: theme comes from the browser's own `colorScheme`
(`mode-watcher` resolves `prefers-color-scheme`; there is no `data-theme` attribute or class to
toggle by hand), and a click leaves a focus ring, so blur the active element and move the pointer
away before shooting. `tools/capture.mjs` and `tools/shoot.mjs` both do this.

Keep temporary captures out of the PR. Commit only useful evidence images under
`docs/pr-evidence/<task>/`, using descriptive names such as `badge-wide-light.png`. Exclude any
map content that isn't already public.

Embed images in the PR with full commit-pinned raw URLs:
`https://raw.githubusercontent.com/ChidiRnweke/onboarding-map/<full-commit-sha>/docs/pr-evidence/<task>/<file>.png`.
Use the real pushed commit that contains the image. Check each URL after pushing; local paths and
expiring CI artifacts do not provide durable evidence. If an image changes or its commit is
replaced by a rebase, update the URL to the new pushed commit.

Give every image descriptive alt text and a visible caption. The caption names the screen, state,
and observable result, such as "After — 1400×900, physics template: the badge sits clear of the
journey nav." Record shared reproduction details once. If a before image is unavailable, say why
and provide the verified after state; never fabricate the comparison.

## Publish and review

Follow `.github/pull_request_template.md`. When using `gh`, write the exact body to a temporary
file and pass `--body-file` to preserve Markdown and avoid shell expansion:

```bash
gh pr create --head <branch> --title "<type(scope): subject>" --body-file /tmp/pr-body.md
```

Follow the task's authorization and `AGENTS.md` rules for opening or updating a PR. Drafting alone
does not authorize publishing, merging, or unrelated external actions.

Before publishing, read the body without the diff. Can a new reader explain the original problem,
the resulting behavior, and the evidence? Remove anything that does not help them. Verify image
links and captions, and ensure every validation claim matches an observed result.
