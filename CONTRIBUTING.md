# Contributing to codojo

Thanks for helping build codojo. This project is developed with
[Spec-Driven Development](https://github.com/github/spec-kit): features flow
through `constitution → specify → clarify → plan → tasks → analyze → implement`.
The project constitution at `.specify/memory/constitution.md` is the
non-negotiable source of truth — note **Principle IX: tests before
implementation**.

## After cloning: restore the spec-kit commands

The `.specify/` framework (templates, scripts, memory, config) **is** committed,
so the constitution, specs, and plans travel with the repo. But `.claude/` — which
holds the spec-kit *slash-command skills* (`/speckit-specify`, `/speckit-plan`, …)
— is **git-ignored on purpose**: it's local, machine-specific agent tooling, not
shipped code (see commit "Exclude .claude/ from version control").

So a fresh clone has the artifacts but not the commands. To regenerate the Claude
Code integration locally:

```bash
# 1. Install the spec-kit CLI once (via uv — https://docs.astral.sh/uv/):
uv tool install specify-cli --from git+https://github.com/github/spec-kit.git

# 2. From the repo root, regenerate the .claude/ skills for Claude Code:
specify init . --integration claude --force
```

`--integration claude` installs the skills by default; `--force` skips the
"directory not empty" confirmation. (`specify init --here --integration claude
--force` is the documented equivalent.) The regenerated `.claude/` files stay
untracked — that's expected.

> [!WARNING]
> **Don't let re-init revert project config.** `.specify/` is committed and is
> the source of truth — including this repo's customizations: the
> `branch_numbering: timestamp` and `auto_commit` settings in
> `.specify/extensions/git/git-config.yml`, and the tailored
> `.specify/templates/plan-template.md` (Constitution Check gates) and
> `tasks-template.md` (tests REQUIRED). `specify init` re-scaffolds spec-kit
> assets, so afterward review the diff and `git checkout -- .specify/` to discard
> any unintended changes there — keep only the new, untracked `.claude/` files
> unless you are deliberately changing project config.

## Development

```bash
npm install
npm run build     # tsc, strict — must be clean
npm test          # jest (ESM) — must be green
npm run dev       # tsc --watch
```

Requirements: Node.js >= 20 (see `engines` in `package.json`) and
[Claude Code](https://claude.com/claude-code) on your `PATH`.

## Reporting bugs

Open a [GitHub issue](https://github.com/jasonnoble/codojo/issues). Include:

- What you ran (exact command and arguments)
- What you expected to happen
- What actually happened (output, exit code, error message)
- Node.js version (`node --version`) and OS

## Proposing a feature

codojo is built with Spec-Driven Development — no feature gets built without a
spec (Constitution Principle IV). If you have an idea:

1. Open a GitHub issue describing the problem you want to solve (not the
   solution). We'll discuss it there.
2. If it gets the go-ahead, run the SDD pipeline:
   `constitution → specify → clarify → plan → tasks → analyze → implement`
3. Open a PR with the spec artifacts and implementation together.

Features proposed without a spec will be closed with a pointer back to this
process — not as a rejection, but to keep the workflow consistent.

## Code of conduct

This project follows the
[Contributor Covenant](https://www.contributor-covenant.org/version/2/1/code_of_conduct/)
(v2.1). By participating you agree to uphold it. Report unacceptable behavior
to [codojo@jasonnoble.dev](mailto:codojo@jasonnoble.dev).

## Before opening a PR

- A spec-kit spec backs the change (Principle IV) — run the SDD flow for any
  non-trivial feature.
- `npm run build` is clean under `strict` (Principle VI) and `npm test` passes,
  with a test for **every** new behavior, written first (Principle IX).
- ESM only — no CommonJS in shipped code (Principle VII).
- The change leaves the package publishable to npm (Principle V).
