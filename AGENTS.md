<!-- BEGIN:nextjs-agent-rules -->

# This is NOT the Next.js you know

This version has breaking changes — APIs, conventions, and file structure may all differ from your training data. Read the relevant guide in `node_modules/next/dist/docs/` (resolved from this file's directory; in monorepos the `next` package may not be visible from the repo root) before writing any code. Heed deprecation notices.

This block is written and re-added by `next dev` — verify at `node_modules/next/dist/server/lib/generate-agent-files.js`. Removing it from a diff only re-creates the uncommitted change; committing it with your work keeps the tree clean.

<!-- END:nextjs-agent-rules -->

## Agent skills

### Issue tracker

Issues are GitHub Issues in israelcena/painel-de-carreira, via the `gh` CLI. See `docs/agents/issue-tracker.md`.

### Triage labels

Five canonical labels with their default names (needs-triage, needs-info, ready-for-agent, ready-for-human, wontfix). See `docs/agents/triage-labels.md`.

### Domain docs

Single context: one `CONTEXT.md` and `docs/adr/` at the root. See `docs/agents/domain.md`.

### Implementing issues

To implement a `ready-for-agent` issue, follow `docs/agents/issue-runbook.md`. There is no unattended runner: the user starts and watches every session. The criteria for `ready-for-agent` are in `docs/agents/triage-labels.md`.

## Project rules

- **Language:** everything except UI text is written in English: code, comments, tests, commits, issues, pull requests, `CONTEXT.md`, ADRs and new `CHANGELOG.md` entries. UI text stays in Brazilian Portuguese.
- **Changelog:** every user-visible change adds an entry to the unreleased section of `CHANGELOG.md` in the same pull request.
- **Checks:** `npm run lint`, `npm run typecheck` and `npm run build` must pass (CI runs them on every pull request). Domain logic changes come with tests.
- **Migrations:** additive only (no drop or rename) unless a human does the change; label the pull request `migration`.
