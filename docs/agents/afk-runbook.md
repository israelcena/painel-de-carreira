# AFK runbook

The procedure an unattended agent follows to turn one `ready-for-agent` issue into a pull request. A scheduled Claude Code cloud routine runs it every 6 hours with the prompt `/implement following docs/agents/afk-runbook.md`. The environment is prepared by `scripts/cloud-setup.sh` (gh, bun, a local Postgres with migrations and seed).

One run handles **at most one issue**. The human reviews and merges every pull request: merging to `main` deploys to production.

## 1. Pick

List open `ready-for-agent` issues with no assignee (see [issue-tracker.md](./issue-tracker.md) for the `gh` commands). Drop any with an open blocker: `gh api repos/{owner}/{repo}/issues/<n> --jq .issue_dependencies_summary.blocked_by` greater than 0, or an open issue in a `Blocked by:` line. Take the oldest one left. If none is left, stop: do nothing else and write nothing.

## 2. Claim

Your first write: `gh issue edit <n> --add-assignee @me`. This keeps a later run from picking the same issue.

## 3. Understand

Read the issue with its comments, `CONTEXT.md` and the ADRs in `docs/adr/` that touch the area. Use the glossary's terms in code, tests, commits and the pull request. If the issue turns out not to meet the `ready-for-agent` criteria in [triage-labels.md](./triage-labels.md), go to **Giving up**.

## 4. Build

- Branch from an up-to-date `main`: `agent/<n>-<short-slug>`.
- Use `/tdd` for domain logic (Stages, Rejection, Archive, positions, metrics).
- Stay inside the limits: no changes to authentication, `vercel.json`, `Dockerfile` or `scripts/`, and no new dependencies unless the issue explicitly approves them.
- Prisma migrations must be additive only (new tables or columns, no drop or rename). A pull request with a migration gets the `migration` label.
- Every user-visible change gets an entry under the unreleased section of `CHANGELOG.md`, in English.
- Everything you write is in English, except UI text, which stays in Brazilian Portuguese.

## 5. Verify

Run `npm run lint`, `npm run typecheck`, `npm run test --if-present` and `npm run build`. Then start the app (`npm run dev`, login from `.env`) and check the screen or behaviour you changed against the issue's acceptance criteria. Run `/code-review` against `main` and fix what it finds.

## 6. Open the pull request

Push the branch and open the pull request with a body written by `/pr`, including `Closes #<n>`. Wait for CI. If it fails, fix and push again, at most 3 attempts in total.

## Giving up

When the issue is unclear, larger than one pull request, would break a limit, or CI still fails after 3 attempts:

1. Comment on the issue: what you tried, where you stopped and what is needed to continue. Name the branch if you pushed one.
2. `gh issue edit <n> --remove-label ready-for-agent --add-label needs-info --remove-assignee @me`.
3. Close any pull request you opened. Never leave a failing pull request open.

## Never

- Merge a pull request, push to `main` or force-push a branch you did not create.
- Touch other issues beyond reading them.
- Handle more than one issue per run.
