---

description: "Task list for codojo init — workspace scaffolding"
---

# Tasks: `codojo init` — Workspace Scaffolding

**Input**: Design documents from `specs/20260525-125032-init-command/`

**Prerequisites**: plan.md (required), spec.md (user stories), research.md, data-model.md, contracts/cli-init.md, quickstart.md

**Tests**: REQUIRED. Constitution Principle IX (Test-Driven Development, NON-NEGOTIABLE) and spec SC-006 mandate that every claimed behavior has a test written before its implementation. Each user story below leads with its tests; write them first and watch them fail (or characterize existing behavior) before touching production code.

**Context**: A bootstrap implementation already exists (`src/commands/init.ts`, `src/cli.ts`, `src/templates/*`, `src/utils.ts`). Most behavior is in place; the genuine new code is **FR-013** (non-directory target) and the **`exitCodeForError`** extraction. Other tasks add the missing tests and close any gap they surface.

## Format: `[ID] [P?] [Story] Description`

- **[P]**: Can run in parallel (different files, no dependencies on incomplete tasks)
- **[Story]**: US1, US2, US3 — maps to the spec's user stories
- File paths are exact and relative to repo root

## Path Conventions

Single-project CLI. Source in `src/`, tests co-located in `src/__tests__/` (per `tsconfig.json` excludes + ts-jest ESM preset).

---

## Phase 1: Setup (Shared Infrastructure)

**Purpose**: Confirm a clean starting point before any change.

- [x] T001 Establish a green baseline: run `npm install`, then `npm run build` (must be clean under `strict`) and `npm test` (existing `src/__tests__/smoke.test.ts` green), to confirm the toolchain and current behavior before changes.

---

## Phase 2: Foundational (Blocking Prerequisites)

**Purpose**: Shared test scaffolding every user story's tests depend on.

**⚠️ CRITICAL**: No user-story test work begins until this is complete.

- [x] T002 [P] Create shared test helpers in `src/__tests__/helpers.ts`: `makeTempWorkspace()` (creates a unique dir via `fs.mkdtemp` under `os.tmpdir()` and registers cleanup), `stripAnsi(s)` (removes chalk ANSI codes), and `captureConsole()` (spies on `console.log`/`console.error`, returns recorded lines, restores on teardown).

**Checkpoint**: Test helpers available — user stories can proceed.

---

## Phase 3: User Story 1 - Scaffold a fresh learning workspace (Priority: P1) 🎯 MVP

**Goal**: Running init against a fresh path produces the complete workspace and the correct success output.

**Independent Test**: Run `runInit(['<tmp>/ws'])` into an empty temp dir and confirm all 10 manifest files exist with non-empty content and the success message is printed in order.

### Tests for User Story 1 (REQUIRED - Principle IX) ⚠️

> **Write these FIRST. They characterize existing behavior; any failure marks a real gap to close in implementation.**

- [x] T003 [P] [US1] In `src/__tests__/scaffold.test.ts`, test that `runInit(['<tmp>/ws'])` creates the full directory tree and writes all 10 manifest files from `workspaceFiles()` to disk (FR-005).
- [x] T004 [US1] In `src/__tests__/scaffold.test.ts`, test that every written file is non-empty on disk, and that stdout (ANSI-stripped) prints — in order — the `Scaffolding workspace at <path> …` line, one `  + <file>` line per manifest entry, the `✓ Your codojo is ready.` line, and the `cd … && run claude` instruction (FR-006, FR-009).
- [x] T005 [P] [US1] In `src/__tests__/templates.test.ts`, test `settingsJson()` parses as JSON and denies `notes/**` & `projects/**`, allows `mentor_notes/**`, `profile.md`, `goals.md`, and denies sensitive/traversal paths (`../**`, `~/.ssh/**`, `**/.env`) (FR-007).
- [x] T006 [US1] In `src/__tests__/templates.test.ts`, test that `rootClaudeMd()` instructs the mentor to confirm before editing `profile.md`/`goals.md` (FR-007 behavioral half) and that `profileMd()` front matter contains `onboarded: false` (FR-008).

### Implementation for User Story 1

- [x] T007 [US1] In `src/commands/init.ts`, ensure `runInit` writes the complete manifest tree to the resolved path and emits the ordered success output; close any gap surfaced by T003/T004.
- [x] T008 [P] [US1] In `src/templates/claude.ts`, ensure `rootClaudeMd()` carries the confirm-before-editing instruction for `profile.md`/`goals.md`; add it if T006 fails.

**Checkpoint**: US1 fully functional — the MVP scaffolds a workspace and reports success. Deployable.

---

## Phase 4: User Story 2 - Never clobber existing work (Priority: P2)

**Goal**: init refuses to touch any non-empty or non-directory target, writing nothing and exiting non-zero.

**Independent Test**: Point init at (a) a dir with one file, (b) a dir with only `.DS_Store`, and (c) an existing regular file — each aborts, writes nothing, exits non-zero.

### Tests for User Story 2 (REQUIRED - Principle IX) ⚠️

> **Write these FIRST. T011 covers the genuine behavior gap (FR-013) and must fail before T012.**

- [x] T009 [P] [US2] In `src/__tests__/guard.test.ts`, test that `runInit(['<tmp>/ws'])` against a directory containing one regular file aborts, creates no manifest files, leaves the existing file untouched, and sets a non-zero `process.exitCode` (FR-004).
- [x] T010 [US2] In `src/__tests__/guard.test.ts`, test that a target directory containing only a hidden file (`.DS_Store`) is treated as non-empty and aborts (FR-004, clarified).
- [x] T011 [US2] In `src/__tests__/guard.test.ts`, test that when the target path exists but is a regular file (not a directory), `runInit` prints a clear "path exists and is not a directory" message, writes nothing, and sets a non-zero `process.exitCode` (FR-013).

### Implementation for User Story 2

- [x] T012 [US2] In `src/commands/init.ts`, before the emptiness guard, add an explicit `fs.stat` check: if the resolved target exists and is **not** a directory, print the FR-013 message to stderr, set a non-zero `process.exitCode`, and return without writing (makes T011 pass). **(This is the main behavior gap.)**
- [x] T013 [US2] In `src/commands/init.ts`, confirm the non-empty guard reads entries via `fs.readdir` (so hidden files count) and returns before any write, satisfying T009/T010; adjust the abort message to match FR-004 (not empty → suggest new path / remove dir / mention forthcoming `update`).

**Checkpoint**: US1 + US2 both work — scaffolds fresh targets, protects everything else.

---

## Phase 5: User Story 3 - Flexible, interruptible invocation (Priority: P3)

**Goal**: Path arg skips the prompt; `~` expands; Ctrl-C exits 130 with nothing written; OS errors surface non-zero.

**Independent Test**: Invoke with a path arg (no prompt), simulate a cancelled prompt (no files, code 130), and an uncreatable path (OS error, non-zero).

### Tests for User Story 3 (REQUIRED - Principle IX) ⚠️

> **Write these FIRST. T014 must fail before the helper in T018 exists.**

- [x] T014 [P] [US3] In `src/__tests__/exit-code.test.ts`, test `exitCodeForError`: returns `130` for an error whose `name === 'ExitPromptError'` and `1` for any other error (FR-011, FR-012).
- [x] T015 [P] [US3] In `src/__tests__/invocation.test.ts`, mock `@inquirer/prompts` via `jest.unstable_mockModule` + dynamic `import`, then test that passing a path argument skips the prompt and uses that path, and that with no argument the prompt is invoked with default `~/workspace/codojo` (FR-001, FR-002).
- [x] T016 [US3] In `src/__tests__/invocation.test.ts`, test that when the mocked prompt rejects with an `ExitPromptError`, `runInit` creates no workspace files (FR-011, "nothing written on cancellation").
- [x] T017 [US3] In `src/__tests__/invocation.test.ts`, test that an uncreatable target (e.g. a path under a read-only parent) surfaces the underlying OS error rather than failing silently, and does not exit 0 (FR-012).

### Implementation for User Story 3

- [x] T018 [P] [US3] Create `src/exitCode.ts` exporting `exitCodeForError(err: unknown): number` — `130` when `err instanceof Error && err.name === 'ExitPromptError'`, else `1` (makes T014 pass).
- [x] T019 [US3] In `src/cli.ts`, replace the inline error→code logic in `main().catch` with `exitCodeForError` imported from `./exitCode.js`, preserving the dim `Cancelled.` message and `process.exit(<code>)` behavior (depends on T018).

**Checkpoint**: All three user stories independently functional.

---

## Phase 6: Polish & Cross-Cutting Concerns

**Purpose**: Verify cross-cutting guarantees and close the coverage contract.

- [x] T020 [P] FR-010 (testable half): in `src/__tests__/templates.test.ts`, assert `profileMd()` ships with a blank `name:` front-matter field and `_Not yet collected._` placeholders (no baked-in learner identity), and `goalsMd()` ships with no collected goals. The pure "no network access / no onboarding" property stays a **manual code review** of `src/commands/init.ts` and `src/templates/*`, captured in the PR description. (Resolves analyze finding D1.)
- [x] T021 Reconcile against `quickstart.md`'s FR/SC → test map, then run `npm run build` (strict, zero errors) and `npm test` (all green) to confirm SC-006 coverage and Principles VI & IX.
- [x] T022 [P] Update `README.md` only if init's behavior/wording changed (e.g., the new FR-013 message), keeping docs accurate.

---

## Dependencies & Execution Order

### Phase Dependencies

- **Setup (T001)**: none — start immediately.
- **Foundational (T002)**: after Setup — **blocks all user stories** (tests need the helpers).
- **User Stories (Phases 3–5)**: each depends only on Foundational. They can proceed in parallel by file, with one caveat: both US1 (T007) and US2 (T012/T013) edit `src/commands/init.ts`, so sequence those two edits (US1 then US2) to avoid a conflict, or do them on the same working copy.
- **Polish (Phase 6)**: after all targeted stories are complete.

### User Story Dependencies

- **US1 (P1)**: independent — the MVP.
- **US2 (P2)**: independent behavior; shares `init.ts` with US1 (coordinate edits, not logic).
- **US3 (P3)**: independent; touches `cli.ts` + new `exitCode.ts`, no overlap with US1/US2 source.

### Within Each User Story (TDD order)

- Tests are written and failing/characterizing BEFORE implementation (Principle IX).
- US1: T003,T004,T005,T006 → T007,T008
- US2: T009,T010,T011 → T012,T013
- US3: T014,T015,T016,T017 → T018 → T019

---

## Parallel Opportunities

- **Foundational**: T002 is the lone prerequisite.
- **Within US1 tests**: T003 (scaffold.test.ts) and T005 (templates.test.ts) are different files → run in parallel. T004 shares scaffold.test.ts with T003; T006 shares templates.test.ts with T005 (sequential within each file).
- **Within US3 tests**: T014 (exit-code.test.ts) and T015 (invocation.test.ts) → parallel.
- **Across stories**: once T002 lands, US1/US2/US3 test files are distinct and can be written in parallel (mind the shared-`init.ts` note above for implementation).

### Parallel Example: User Story 1 tests

```bash
# Different files → safe to author together:
Task: "T003 scaffold.test.ts — full manifest written to disk (FR-005)"
Task: "T005 templates.test.ts — settings.json permission rules (FR-007)"
```

---

## Implementation Strategy

### MVP First (User Story 1 only)

1. Phase 1 Setup → Phase 2 Foundational.
2. Phase 3 (US1): tests first, then make them pass.
3. **STOP and VALIDATE**: a fresh path yields a complete workspace + correct output.
4. The package is publishable at this point.

### Incremental Delivery

1. Setup + Foundational → ready.
2. US1 → test → ship (MVP).
3. US2 → adds the FR-013 gap fix + clobber protection → ship.
4. US3 → arg/prompt/cancel/OS-error polish → ship.
5. Each story leaves `main` npm-publishable (Principle V).

---

## Notes

- `[P]` = different files, no dependency on an incomplete task.
- Every task carries an exact file path; story tasks carry a `[US#]` label.
- Tests precede implementation within every story (Principle IX); verify failure (or deliberate characterization) before writing code.
- Keep the toolchain green: `npm run build` strict-clean and `npm test` passing are the merge gates (Principles VI, IX).
- No new runtime dependencies; ESM only, `.js` import extensions (Principle VII).
- Commit after each task or logical group; each story checkpoint is a safe stopping point.
- **FR-003 coverage (analyze finding C1)**: `~`/bare-`~`/relative path resolution is already covered by the existing `src/__tests__/smoke.test.ts` `expandHome` tests — no new task is needed; it is re-verified green by the baseline (T001) and final suite (T021).
