# Triage Labels

The skills speak in terms of five canonical triage roles. This file maps those roles to the actual label strings used in this repo's issue tracker.

| Label in mattpocock/skills | Label in our tracker | Meaning                                  |
| -------------------------- | -------------------- | ---------------------------------------- |
| `needs-triage`             | `needs-triage`       | Maintainer needs to evaluate this issue  |
| `needs-info`               | `needs-info`         | Waiting on reporter for more information |
| `ready-for-agent`          | `ready-for-agent`    | Fully specified, ready for an agent      |
| `ready-for-human`          | `ready-for-human`    | Requires human implementation            |
| `wontfix`                  | `wontfix`            | Will not be actioned                     |

When a skill mentions a role (e.g. "apply the AFK-ready triage label"), use the corresponding label string from this table.

Edit the right-hand column to match whatever vocabulary you actually use.

## When an issue is `ready-for-agent`

An issue gets `ready-for-agent` only when all of these hold. Otherwise it is `ready-for-human` (clear but outside these limits) or `needs-info` (not clear yet).

- It has acceptance criteria that can be checked.
- The screen or behaviour it asks for is described without ambiguity.
- It does not touch authentication (`iron-session`, credentials), `vercel.json`, `Dockerfile` or `scripts/`, and adds no dependency unless the issue explicitly approves one.
- It fits in one pull request. If it doesn't, break it into a Wayfinder map with child issues first.

An agent implements these in a session you start; see [issue-runbook.md](./issue-runbook.md).

## Other labels

| Label             | Meaning                                                           |
| ----------------- | ----------------------------------------------------------------- |
| `migration`       | Pull request includes a Prisma migration (additive only)          |
| `wayfinder:map`   | Map issue of a Wayfinder plan                                     |
| `wayfinder:<type>` | Child ticket of a map: `research`, `prototype`, `grilling`, `task` |
