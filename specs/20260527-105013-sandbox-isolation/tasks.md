# Tasks: Sandbox-Based Workspace Isolation & Opt-In GitHub CLI Access

**Input**: Design documents from `specs/20260527-105013-sandbox-isolation/`

**Prerequisites**: plan.md, spec.md, research.md, data-model.md, contracts/

**Tests**: REQUIRED (Constitution Principle IX — TDD, NON-NEGOTIABLE). Every test task is written and made to FAIL before the implementation it covers. `npm test` must pass clean before a story is complete.

**Authoritative shape**: `contracts/generated-settings.md` is the source of truth for the generated `.claude/settings.json`; `data-model.md` is a summary.

## Format: `[ID] [P?] [Story] Description`

- **[P]**: Can run in parallel (different files, no dependencies)
- **[Story]**: US1 / US2 / US3 (setup, foundational, polish carry no story label)

## Path Conventions

Single-project CLI: source in `src/`, tests in `src/__tests__/` (existing layout). No new directories.

---

## Phase 1: Setup

**Purpose**: Establish a known-green baseline before changes.

- [x] T001 Run `npm run build` and `npm test` from repo root; confirm the current suite is green. Note that `src/__tests__/templates.test.ts` currently asserts `Read(../**)` is **present** in the deny list — that assertion is intentionally flipped in T002 (it will go red first).

---

## Phase 2: Foundational (Blocking Prerequisites)

**Purpose**: Shared prerequisites for all stories.

**None.** The codebase already exists and each story is independently sliceable (US1 changes the default `settingsJson()` output; US2 introduces the options type + flag; US3 is docs). Proceed directly to User Story 1.

**Checkpoint**: Baseline green → US1 may begin.

---

## Phase 3: User Story 1 - The mentor is actually confined to the workspace (Priority: P1) 🎯 MVP

**Goal**: The default generated `.claude/settings.json` enforces OS-level isolation — the dead `Read(../**)` rule is gone, a strict `sandbox` block confines reads to the workspace and denies all shell writes, and the generated `CLAUDE.md` tells the mentor to write via its Edit/Write tools and hand write-needing shell commands to the learner.

**Independent Test**: `node dist/cli.js init <dir>` (no flag) → the emitted `.claude/settings.json` matches the **Default** variant in `contracts/generated-settings.md`; the macOS enforcement check in `quickstart.md` (SC-001/SC-002/SC-003) passes.

### Tests for User Story 1 (write FIRST, ensure they FAIL) ⚠️

- [x] T002 [US1] In `src/__tests__/templates.test.ts`, replace the assertion that the deny list contains `Read(../**)` with one asserting it is **absent** (FR-001).
- [x] T003 [US1] In `src/__tests__/templates.test.ts`, assert default `settingsJson()` has `sandbox.enabled===true`, `sandbox.allowUnsandboxedCommands===false`, `filesystem.allowRead===["."]`, `filesystem.denyRead===["/"]`, `filesystem.denyWrite===["."]`, and `filesystem.allowWrite===["./mentor_notes","./profile.md","./goals.md","/tmp"]` (FR-002/003/004/005, per `contracts/generated-settings.md`).
- [x] T004 [US1] In `src/__tests__/templates.test.ts`, assert default `settingsJson()` contains **no** `Bash(gh` allow rule and **no** `sandbox.excludedCommands` key (FR-007), and that the existing FR-006 rules remain (notes/projects Edit/Write/MultiEdit denied; mentor_notes/profile/goals allowed).
- [x] T005 [US1] In `src/__tests__/templates.test.ts`, alongside the existing `rootClaudeMd()` tests, assert `rootClaudeMd()` output contains (a) the instruction to modify `mentor_notes/`/`profile.md`/`goals.md` via Edit/Write tools, and (b) the instruction to hand write-needing shell commands to the learner (FR-013).
- [x] T006 [US1] In `src/__tests__/templates.test.ts`, add a regression assertion that the other `workspaceFiles()` entries (`profile.md`, `goals.md`, `notes/CLAUDE.md`, `projects/CLAUDE.md`, `mentor_notes/*`) are unchanged by this feature (FR-012).

### Implementation for User Story 1

- [x] T007 [P] [US1] In `src/templates/settings.ts`: remove the `Read(../**)` deny entry; add the `sandbox` block (`enabled:true`, `allowUnsandboxedCommands:false`, `filesystem:{allowRead:["."],denyRead:["/"],denyWrite:["."],allowWrite:["./mentor_notes","./profile.md","./goals.md","/tmp"]}`) in the key order shown in `contracts/generated-settings.md`; refresh the file's doc-comment to describe the sandbox (FR-001–FR-006).
- [x] T008 [P] [US1] In `src/templates/claude.ts` (`rootClaudeMd()`): add the "Writing files" guidance — use Edit/Write tools for `mentor_notes/`/`profile.md`/`goals.md`, never use shell (`touch`/`>`/`mv`/`rm`) to create/modify/delete, and hand any write-needing shell command to the learner (FR-013).
- [x] T009 [US1] Run `npm run build` && `npm test`; confirm the US1 tests are green and the strict build is clean.

**Checkpoint**: A default-generated workspace is OS-isolated and the mentor knows to use tools / defer shell writes — US1 is independently shippable (MVP).

---

## Phase 4: User Story 2 - Opt-in GitHub CLI access (Priority: P2)

**Goal**: `codojo init --allow-gh-cli` produces a workspace whose mentor may run a closed set of read-only `gh` lookups unattended (via `excludedCommands` + permission allow rules), while mutating/`gh auth` operations still prompt; without the flag, `gh` is blocked.

**Independent Test**: `codojo init --allow-gh-cli <dir>` → settings match the **gh variant** contract; `codojo init <dir>` → no gh rules; the flag is parsed in either position; the FR-010 spike (T018) classifies all cases PASS.

### Tests for User Story 2 (write FIRST, ensure they FAIL) ⚠️

- [x] T010 [P] [US2] In `src/__tests__/templates.test.ts`, assert `settingsJson({allowGhCli:true})` `permissions.allow` contains all 11 read-only `Bash(gh …)` rules from `contracts/generated-settings.md` and does **NOT** contain `Bash(gh auth status:*)`, and `sandbox.excludedCommands===["gh","gh *"]` (FR-009/FR-010).
- [x] T011 [P] [US2] In `src/__tests__/invocation.test.ts`, assert `runInit(['--allow-gh-cli', dir])` and `runInit([dir, '--allow-gh-cli'])` both enable gh and treat `dir` (not the flag) as the workspace path; `runInit([dir])` produces the default (no gh); a leading `--allow-gh-cli` is never mistaken for the directory (FR-008).

### Implementation for User Story 2

- [x] T012 [US2] In `src/types/index.ts`, add `export interface WorkspaceOptions { allowGhCli?: boolean }` and `export const DEFAULT_WORKSPACE_OPTIONS: Required<WorkspaceOptions> = { allowGhCli: false }` (data-model.md).
- [x] T013 [US2] In `src/templates/settings.ts`, change `settingsJson` to accept `WorkspaceOptions` (`{ allowGhCli = false }: WorkspaceOptions = {}`); when `allowGhCli`, append the 11 read-only `Bash(gh …)` rules after `Write(goals.md)` and add `sandbox.excludedCommands:["gh","gh *"]` after `allowUnsandboxedCommands`, in the order shown in the contract (FR-009/FR-010). Depends on T012 and T007.
- [x] T014 [US2] In `src/templates/index.ts`, change `workspaceFiles` to accept `WorkspaceOptions` and thread it into `settingsJson(opts)` (data-model threading). Depends on T012, T013.
- [x] T015 [US2] In `src/commands/init.ts`, parse `--allow-gh-cli` from `argv` (recognized in any position via `argv.includes`), derive the workspace dir as the first arg **not** starting with `--`, build a `WorkspaceOptions`, and pass it to `workspaceFiles` (FR-008, contracts/cli-init.md). Depends on T014.
- [x] T016 [P] [US2] In `src/cli.ts`, update `USAGE` to document `init [dir] [--allow-gh-cli]` and the flag's read-only-gh meaning (contracts/cli-init.md). Independent of the data path.
- [x] T017 [US2] Run `npm run build` && `npm test`; confirm US2 tests green. Generate both variants (`init <dir>` and `init <dir> --allow-gh-cli`) and diff the emitted `.claude/settings.json` against `contracts/generated-settings.md`.

### Spike for User Story 2 (gating — FR-010) ⚠️

- [x] T018 [US2] FR-010 spike **DONE** (2026-05-27, macOS): **PASS** — every escape vector (PATH-shim, compound, arg0) is gated by a permission prompt; nothing ran unsandboxed unprompted. Matching is on the literal leading token. Redundancy resolved → `excludedCommands` simplified to `["gh *"]` (dropped redundant `"gh"`) in `settings.ts` + test + contract + data-model. Residual risk recorded in research R4 (a gh-led compound runs unsandboxed once approved, but always prompts).

**Checkpoint**: US1 + US2 both work independently; the gh exception is empirically validated.

---

## Phase 5: User Story 3 - Honest, accurate permission documentation (Priority: P3)

**Goal**: The README "Permission model" section accurately describes sandbox-based isolation and the `--allow-gh-cli` flag, with no surviving claim that the parent-traversal rule isolates.

**Independent Test**: Read the README; it states the sandbox is the OS-level boundary, documents `--allow-gh-cli` (read-only), and contains no `Read(../**)`/parent-traversal isolation claim (US3 acceptance scenarios; SC-006).

### Tests for User Story 3 (write FIRST, ensure it FAILS) ⚠️

- [x] T019 [US3] Add `src/__tests__/readme.test.ts`: `readFileSync` the repo-root `README.md` and assert the content contains `sandbox` and `--allow-gh-cli`, and does **not** describe `Read(../**)`/parent-directory traversal as an isolation mechanism (FR-011, SC-006).

### Implementation for User Story 3

- [x] T020 [US3] In `README.md`, rewrite the "Permission model" section to make T019 pass: the `sandbox` block (Seatbelt on macOS / bubblewrap on Linux+WSL2) is the OS-level boundary for shell commands; permission rules govern Claude's own tools and alone do not isolate shell commands; the mentor writes `mentor_notes/`/`profile.md`/`goals.md` via its tools and hands write-needing shell commands to the learner; remove any claim that `Read(../**)`/parent-traversal provides isolation; document `--allow-gh-cli` and its read-only nature (FR-011).

**Checkpoint**: All three stories independently functional and documented.

---

## Phase 6: Polish & Cross-Cutting Concerns

- [x] T021 Principle VIII amendment **DONE** (constitution v1.1.1, commit `ac1a2dd`): VIII re-worded around the OS-level sandbox and propagated to `plan-template.md` + `CLAUDE.md`; this feature's `plan.md` VIII gate is flipped to PASS.
- [x] T022 Final quality gate: `npm run build` passes with zero errors/warnings under strict mode (Principle VI); `npm test` passes clean with every claimed behavior covered (Principle IX); no CommonJS introduced (Principle VII); `main` left npm-publishable (Principle V).
- [ ] T023 Run the full `quickstart.md` manual verification on macOS (SC-001/002/003 enforcement checks + recorded FR-010 spike outcomes), confirming both emitted `.claude/settings.json` variants match `contracts/generated-settings.md`.

---

## Dependencies & Execution Order

### Phase Dependencies

- **Setup (T001)** → no dependencies.
- **Foundational** → none (empty).
- **US1 (T002–T009)** → after Setup. MVP.
- **US2 (T010–T018)** → after Setup; shares `src/templates/settings.ts` and `src/__tests__/templates.test.ts` with US1, so run **after US1** (sequential, not parallel, to avoid same-file conflicts). T013 depends on US1's T007.
- **US3 (T019–T020)** → after US2 (documents both the sandbox and the `--allow-gh-cli` behavior).
- **Polish (T021–T023)** → after all desired stories.

### Within each story

- Tests (T002–T006, T010–T011) written and FAILING before implementation (Principle IX).
- US2 order: type (T012) → settings (T013) → index (T014) → init (T015); USAGE (T016) independent.
- T018 spike gates US2 sign-off.

### Parallel Opportunities

- **US1**: T007 (`settings.ts`) ∥ T008 (`claude.ts`) — different files. (T002–T006 all edit `templates.test.ts` → sequential.)
- **US2**: T010 (`templates.test.ts`) ∥ T011 (`invocation.test.ts`); T016 (`cli.ts`) ∥ the T012–T015 data path.

---

## Parallel Example: User Story 1 implementation

```bash
# After US1 tests (T002–T006) are written and red, run the two implementation
# tasks in parallel (different files):
Task: "T007 settings.ts — remove Read(../**), add sandbox block"
Task: "T008 claude.ts — add Writing-files mentor guidance (FR-013)"
```

---

## Implementation Strategy

### MVP first (US1 only)

1. T001 baseline → 2. US1 tests (T002–T006, red) → 3. US1 impl (T007–T008) → 4. T009 green → **STOP & VALIDATE** the default workspace is OS-isolated (quickstart enforcement check). Shippable MVP.

### Incremental delivery

- US1 (isolation) → demo → US2 (opt-in gh, gated by T018 spike) → demo → US3 (docs) → polish. Each story leaves `main` releasable (Principle V).

---

## Notes

- `[P]` = different files, no incomplete-task dependency. Same-file edits are sequential.
- Verify each test fails before implementing it.
- One item remains genuinely open: the **FR-010 spike** (T018, may force a gh redesign). The **Principle VIII amendment** (T021) is now done (constitution v1.1.1, commit `ac1a2dd`).
- The R3 write-boundary spike is already complete (Option B: all shell writes denied; mentor uses tools) — no task needed.
