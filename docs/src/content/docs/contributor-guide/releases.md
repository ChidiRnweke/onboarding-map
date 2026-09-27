---
title: Releases
description: release-please keeps the version and changelog; merging its PR tags and publishes.
---

release-please keeps a release PR (`chore(main): release x.y.z`) open with the next version and
`CHANGELOG.md`. Merging it tags the release, and the `Release` workflow publishes to npm with Trusted
Publishing — no token exists.

Only `feat`, `fix`, `perf`, `refactor`, `revert` and `deps` commits cause a release; the other types
land without one.

## Do not do these by hand

Do not tag, bump `version`, edit `CHANGELOG.md` or run `npm publish`. release-please owns all of it.

:::note
When release-please updates its PR, GitHub holds that PR's check runs as "action required" until a
maintainer approves them (Actions → the run → "Approve workflows to run"). A release PR whose checks
show as waiting is not failing.
:::
