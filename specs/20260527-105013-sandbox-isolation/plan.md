# Implementation Plan: Sandbox-Based Workspace Isolation & Opt-In GitHub CLI Access

**Branch**: `20260527-105013-sandbox-isolation` | **Date**: 2026-05-27 | **Spec**: [spec.md](./spec.md)

**Input**: Feature specification from `specs/20260527-105013-sandbox-isolation/spec.md`

## Summary

Replace the no-op `Read(../**)` deny rule in the generated workspace `.claude/settings.json` with a real OS-level Claude Code `sandbox` block (strict mode; reads confined to the workspace via `denyRead:["/"]`+`allowRead:["."]`; all shell writes denied via `denyWrite:["."]` — the mentor writes `mentor_notes/`/`profile.md`/`goals.md` through its Edit/Write tools and hands write-needing shell commands to the learner, per a new generated-CLAUDE.md instruction, FR-013). Add an opt-in `--allow-gh-cli` flag to `codojo init` that, when set, adds a closed allow-list of read-only `gh` permission rules plus `excludedCommands:["gh","gh *"]`. Wire the choice through a new `WorkspaceOptions` type. Update the README permission model. The single load-bearing unknown — exactly how Claude Code matches `excludedCommands` — is undocumented and is resolved by an empirical spike in Phase 0 (see research.md).

> **⚠ Behavioral change from the original spec (R3 spike).** The spec originally described a *fine-grained* write boundary — the mentor's shell could write its own areas (`mentor_notes/`/`profile.md`/`goals.md`) while the learner's `notes/`/`projects/` were denied. The R3 spike disproved that: Claude Code's `allowWrite` does **not** re-allow paths within a `denyWrite` region (unlike `allowRead`/`denyRead`), so `denyWrite:["."]` is absolute. The boundary therefore became **all shell writes denied workspace-wide**. Mitigation: the mentor writes those three files through its **Edit/Write tools** (governed by permission rules, which the sandbox does not gate) and hands any write-needing shell command to the learner — mandated by the new **FR-013** generated-`CLAUDE.md` instruction. FR-005/SC-002 were updated to match.

## Technical Context

**Language/Version**: TypeScript (strict), Node.js ≥ 20

**Primary Dependencies**: `@inquirer/prompts`, `chalk`, `fs-extra` (existing). **No new dependencies** — `--allow-gh-cli` parsing is hand-rolled (no arg-parser dep).

**Storage**: N/A — `init` writes files to disk; no persistent store.

**Testing**: Jest + ts-jest (ESM). TDD per Constitution IX.

**Target Platform**: codojo CLI runs on Node ≥ 20. The *generated workspace* targets Claude Code; sandbox enforcement is macOS Seatbelt (primary, verified) / Linux+WSL2 bubblewrap (unverified, out of scope) — abstracted by Claude Code from one declarative settings block.

**Project Type**: Single-project CLI.

**Performance Goals**: N/A (one-shot scaffolding).

**Constraints**: ESM only, explicit `.js` extensions; strict types; generated `settings.json` MUST be valid JSON; flag must not be misread as the workspace directory.

**Scale/Scope**: ~5 source files (`cli.ts`, `commands/init.ts`, `templates/settings.ts`, `templates/index.ts`, `types/index.ts`) + test updates; README.

## Constitution Check

*GATE: Must pass before Phase 0 research. Re-checked after Phase 1 design.*

Product behavior (the generated mentor):

- [x] **I. Teach, Don't Ghostwrite** — N/A: no change to mentor pedagogy.
- [x] **II. Meet the Learner Where They Are** — N/A: no change to teaching behavior.
- [x] **III. Notes Belong to the Learner** — PASS (strengthened): `notes/`/`projects/` Edit/Write deny rules preserved (FR-006). Per research R3, `denyWrite:["."]` denies ALL shell writes in the workspace; the mentor mutates `mentor_notes/`/`profile.md`/`goals.md` via its Edit/Write tools (permission allow rules), and the generated `CLAUDE.md` (FR-013) instructs it to hand write-needing shell commands to the learner.
- [⚠] **VIII. The Workspace Is Sacred** — PASS in spirit (the feature replaces a no-op with real OS enforcement, strictly strengthening the boundary). **Flag**: VIII's text literally enumerates "parent-directory traversal denied" as a required boundary, which this feature removes as ineffective. See Complexity Tracking — recommend a PATCH constitution amendment to re-word VIII around the sandbox.

Engineering (the codojo codebase):

- [x] **IV. Specs Before Code** — PASS: spec + clarification + this plan.
- [x] **V. Small, Shippable Increments** — PASS: one coherent, releasable increment; default behavior changes are additive/strengthening, flag is additive.
- [x] **VI. TypeScript Strict Mode** — PASS: no `any`/suppressions introduced.
- [x] **VII. ESM Only** — PASS: ESM with explicit extensions.
- [x] **IX. Test-Driven Development** — PASS: Phase-1 tasks order tests before implementation; every FR maps to a test (see quickstart.md / data-model.md test matrix).
- [x] **Technology Constraints** — PASS: no new dependencies.

**Gate result: PASS** (one flagged governance follow-up on VIII wording; does not block — see Complexity Tracking).

## Project Structure

### Documentation (this feature)

```text
specs/20260527-105013-sandbox-isolation/
├── plan.md              # This file
├── research.md          # Phase 0 — decisions + the excludedCommands spike
├── data-model.md        # Phase 1 — WorkspaceOptions + generated-settings shape
├── quickstart.md        # Phase 1 — manual verification + test matrix
├── contracts/
│   ├── cli-init.md      # `codojo init` command + --allow-gh-cli contract
│   └── generated-settings.md  # shape of generated .claude/settings.json
└── tasks.md             # Phase 2 (/speckit-tasks — NOT created here)
```

### Source Code (repository root)

```text
src/
├── cli.ts                 # USAGE text gains --allow-gh-cli; routes argv to runInit
├── commands/
│   └── init.ts            # parse flags vs positional dir; pass WorkspaceOptions
├── templates/
│   ├── index.ts           # workspaceFiles(opts) → settingsJson(opts)
│   ├── settings.ts        # emit sandbox block; conditional gh rules + excludedCommands
│   └── claude.ts          # generated CLAUDE.md: tools-not-shell mentor guidance (FR-013; tested in templates.test.ts)
├── types/
│   └── index.ts           # WorkspaceOptions + DEFAULT_WORKSPACE_OPTIONS
└── __tests__/
    ├── templates.test.ts  # settingsJson() default + {allowGhCli:true}; AND FR-013 rootClaudeMd()
    │                       #   assertions (folded here alongside existing rootClaudeMd tests — no separate claude.test.ts)
    └── invocation.test.ts # --allow-gh-cli parsing (both positions, no-dir)
```

**Structure Decision**: Single-project CLI; no new directories. Changes thread `WorkspaceOptions` from `cli.ts` → `runInit` → `workspaceFiles` → `settingsJson`.

## Complexity Tracking

| Violation | Why Needed | Simpler Alternative Rejected Because |
|-----------|------------|--------------------------------------|
| Principle VIII text names "parent-directory traversal denied" as a boundary; this feature removes that rule | The `Read(../**)` rule is a verified no-op; the sandbox enforces the same intent at the OS level far more strongly | Keeping the dead rule to satisfy the literal wording would preserve a false sense of security — the opposite of VIII's intent. Resolution: a separate PATCH amendment re-wording VIII to reference the sandbox boundary (propagated per Governance). Flagged for the user; does not block this plan. |
