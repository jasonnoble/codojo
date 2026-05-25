# Implementation Plan: `codojo init` — Workspace Scaffolding

**Branch**: `20260525-125032-init-command` | **Date**: 2026-05-25 | **Spec**: [spec.md](./spec.md)

**Input**: Feature specification from `specs/20260525-125032-init-command/spec.md`

## Summary

`codojo init` scaffolds a fresh learning workspace and is the only entry point
into codojo. A bootstrap implementation already exists (`src/commands/init.ts`,
`src/cli.ts`, `src/templates/*`, `src/utils.ts`); this plan **reconciles that
code with the now-ratified spec and builds the test suite Principle IX
requires**. The behavior is largely in place — the real work is (a) one behavior
gap, FR-013 (target path exists but is not a directory), which currently surfaces
an opaque `ENOTDIR` instead of a clear message, and (b) raising test coverage
from a single smoke test to every behavior the spec claims (FR-001–FR-013,
SC-006), written test-first.

Technical approach: keep the existing module layout; make exit-code and
prompt-cancellation behavior unit-testable via a tiny pure helper
(`exitCodeForError`) and by having `runInit` set `process.exitCode` (it already
does) rather than calling `process.exit`; drive filesystem behavior through real
temp directories; mock `@inquirer/prompts` for prompt/cancellation tests using
ESM module mocking.

## Technical Context

**Language/Version**: TypeScript 5.9 (strict), compiled to ES2022; Node.js ≥ 20

**Primary Dependencies**: `@inquirer/prompts` (interactive path prompt), `chalk`
(terminal styling), `fs-extra` (filesystem). Dev: `jest` + `ts-jest`
(ESM preset), `typescript`.

**Storage**: Local filesystem only — writes the workspace file tree. No database,
no network (FR-010).

**Testing**: Jest with `ts-jest/presets/default-esm`, run under
`node --experimental-vm-modules` (existing `npm test`). Tests in `src/__tests__/`.

**Target Platform**: Developer workstations — macOS and Linux primarily
(Constitution targets Node ≥ 20). Behavior must tolerate macOS `.DS_Store`.

**Project Type**: Single-project CLI tool published to npm as `codojo`.

**Performance Goals**: Scaffolding completes well under 30 s on a typical laptop
(SC-001); in practice sub-second since it writes ~10 small files.

**Constraints**: Offline (no network, FR-010); never clobber existing files
(SC-003, Principle VIII); strict-mode `tsc` clean and `npm test` clean before
done (Principles VI, IX).

**Scale/Scope**: One workspace per invocation; fixed 10-file manifest; single
actor (the learner). ~13 functional requirements, 3 user stories.

## Constitution Check

*GATE: Must pass before Phase 0 research. Re-check after Phase 1 design.*

Confirm this plan complies with `.specify/memory/constitution.md` (v1.1.0). Mark
each gate PASS / FAIL / N/A and justify any FAIL in Complexity Tracking below.

Product behavior (the generated mentor):

- [x] **I. Teach, Don't Ghostwrite** — N/A to the CLI's own logic; but the
      scaffolded `CLAUDE.md` carries the mentor-mode teaching rules. PASS.
- [x] **II. Meet the Learner Where They Are** — the command targets experienced
      developers (terminal users); scaffolded `CLAUDE.md` encodes concept
      mapping. PASS.
- [x] **III. Notes Belong to the Learner** — generated `.claude/settings.json`
      keeps `notes/`/`projects/` read-only, and FR-007 requires the scaffolded
      `CLAUDE.md` to instruct confirm-before-editing `profile.md`/`goals.md`.
      PASS.
- [x] **VIII. The Workspace Is Sacred** — the command writes only inside the
      chosen workspace, never clobbers existing content, and emits the permission
      boundaries. PASS.

Engineering (the codojo codebase):

- [x] **IV. Specs Before Code** — spec committed (`e1bc8c3`) and clarified before
      this plan. PASS.
- [x] **V. Small, Shippable Increments** — delivered as MVP (US1) then US2/US3;
      each leaves the package publishable. PASS.
- [x] **VI. TypeScript Strict Mode** — existing `tsconfig.json` has `strict:true`;
      no `any`/suppressions introduced. PASS.
- [x] **VII. ESM Only** — package is `type: module`, NodeNext, `.js` import
      extensions throughout; jest config is `.cjs` only as the loader shim
      (allowed — it is config, not shipped code). PASS.
- [x] **IX. Test-Driven Development** — tests authored before the FR-013 fix and
      before any refactor; every FR/SC mapped to a test (see quickstart.md).
      Caveat noted below. PASS (going forward).
- [x] **Technology Constraints** — no new dependencies; stays within the fixed
      stack. PASS.

**Caveat on Principle IX (honest disclosure):** the bootstrap implementation
predates its tests, so strict Red-Green-Refactor cannot be reconstructed for code
that already exists. This plan applies TDD prospectively: the FR-013 fix and the
testability refactor are written test-first (failing test → change), and the
remaining behaviors get characterization tests that must pass. This closes the
SC-006 coverage gap without pretending the original code was authored test-first.

## Project Structure

### Documentation (this feature)

```text
specs/20260525-125032-init-command/
├── plan.md              # This file
├── research.md          # Phase 0 output
├── data-model.md        # Phase 1 output
├── quickstart.md        # Phase 1 output (FR/SC → test map)
├── contracts/
│   └── cli-init.md      # CLI command contract
├── checklists/
│   └── requirements.md  # Spec quality checklist (from /speckit-specify)
└── spec.md              # Feature spec
```

### Source Code (repository root)

The project is an existing single-project CLI; the layout below is the **current**
structure, which this feature extends rather than reshapes:

```text
src/
├── cli.ts                  # arg dispatch + top-level error→exit-code mapping
├── index.ts                # library entry (re-exports)
├── utils.ts                # expandHome() — path resolution (FR-003)
├── commands/
│   └── init.ts             # runInit() — the command (FR-001,002,004,005,006,009,013)
├── templates/
│   ├── index.ts            # workspaceFiles() manifest (FR-005,006)
│   ├── claude.ts           # rootClaudeMd() + per-dir CLAUDE.md (FR-007 behavioral half)
│   ├── settings.ts         # settingsJson() permission rules (FR-007)
│   ├── profile.ts          # profileMd()/goalsMd() (FR-008)
│   └── mentorNotes.ts      # quizHistoryMd()/conceptMapMd()
├── types/
│   └── index.ts            # learner/workspace types
└── __tests__/
    ├── smoke.test.ts       # existing unit tests (manifest, settings, expandHome)
    ├── init.test.ts        # NEW — runInit filesystem + abort behavior (FR-004,005,006,013)
    ├── cli.test.ts         # NEW — error→exit-code mapping incl. Ctrl-C 130 (FR-011,012)
    ├── output.test.ts      # NEW — success-output content & order (FR-009)
    └── templates.test.ts   # NEW — CLAUDE.md confirm-before-edit + settings rules (FR-007)
```

**Structure Decision**: Single project, retain the existing `src/` + co-located
`src/__tests__/` layout (matches `tsconfig.json` excludes and the ts-jest ESM
preset). New test files are added per behavior cluster; the only production change
is the FR-013 handling in `init.ts` plus a small `exitCodeForError` helper
extracted for testability (`cli.ts` or `utils.ts`).

## Complexity Tracking

No constitution gates failed; no violations to justify. The one judgment call —
extracting `exitCodeForError` and adding characterization tests for pre-existing
code — is testability work, not added architectural complexity, and introduces no
new dependencies or layers.
