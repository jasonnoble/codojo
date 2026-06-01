---
description: "Task list for Onboarding Background — Sharing Options"
---

# Tasks: Onboarding Background — Sharing Options

**Input**: Design documents from `/specs/20260525-192407-onboarding-background-options/`

**Prerequisites**: plan.md, spec.md, research.md, data-model.md, contracts/onboarding-background.md, quickstart.md

**Tests**: REQUIRED. Constitution Principle IX (TDD, NON-NEGOTIABLE) — every behavior gets a failing test before its implementation, and `npm test` + `npm run build` (strict `tsc`) must pass clean before the feature is done. Note the honesty limit (plan.md): the *content* of the generated templates is unit-tested; the mentor's *runtime adherence* (does the LLM actually fetch/parse/recap?) is non-deterministic and verified by manual review (Phase 6) against the PASS criteria in quickstart.md.

**Organization**: Tasks are grouped by user story (P1→P3 from spec.md) for traceability. Because this is a content change, US1 and US2 both edit `src/templates/claude.ts` (`rootClaudeMd()`) and all three stories append to the single test file `src/__tests__/templates.test.ts` — so cross-story parallelism is limited and same-file tasks run sequentially.

## Format: `[ID] [P?] [Story] Description`

- **[P]**: Can run in parallel (different files, no dependencies on incomplete tasks)
- **[Story]**: US1 / US2 / US3 (maps to spec.md user stories)
- Exact file paths are included in each task

## Path Conventions

Single-project CLI (`codojo`). Source at `src/`, tests at `src/__tests__/`. No structure changes — this feature edits template content and one type.

---

## Phase 1: Setup

**Purpose**: Establish a clean Red/Green baseline before any edits.

- [X] T001 Establish baseline: run `npm test` and `npm run build` on the clean tree and confirm both pass, so any new failing assertion is attributable to this feature (TDD Red baseline). No files changed.

---

## Phase 2: Foundational (Blocking Prerequisites)

**None.** This is a content/template change with no shared prerequisite code: the onboarding-script stories (US1/US2) edit `rootClaudeMd()`, US3 edits `profileMd()` + the `LearnerProfile` type. User stories depend only on Setup (Phase 1).

---

## Phase 3: User Story 1 - Choose how to share my background (Priority: P1) 🎯 MVP

**Goal**: The onboarding interview, right after Name, introduces the background step with the required framing and presents the four ways to share as a multi-select checklist (any/all/none), confirms back what it understood, may ask light follow-ups with an exit, and never asks for LinkedIn. This is the MVP — the broken LinkedIn step is gone and the working menu exists, even before each path's per-method behavior (US2) is filled in.

**Independent Test**: Against a fresh `onboarded: false` profile, onboarding introduces the background step with the framing, offers exactly the four options as a checklist, and never asks for a LinkedIn URL.

### Tests for User Story 1 (REQUIRED — Principle IX) ⚠️

> Write FIRST, confirm they FAIL before implementation.

- [X] T002 [US1] Add a `describe('onboarding background step', …)` block to `src/__tests__/templates.test.ts` with failing assertions on `rootClaudeMd()`: contains the FR-002 framing ("…know a little about your background…") right after the Name step (C1); presents the four options as a checklist — resume, GitHub username, website, something else (C2/FR-003); states the any/all/none multi-select + optional intent (C3/FR-003/004/005); contains a confirm-back instruction for the background step (C8/FR-010); permits light clarifying follow-ups with an always-available exit (C9/FR-011); does **not** match `/linkedin/i` anywhere in the script (C10/FR-001); still contains the Name, current-languages, learning-target, and goals steps (FR-015); and keeps the `onboarded: false` gate (FR-016). Run `npm test`; confirm the new assertions fail.

### Implementation for User Story 1

- [X] T003 [US1] In `src/templates/claude.ts` (`rootClaudeMd()`), replace onboarding steps 2–4 (LinkedIn, Resume, GitHub) with a single **Background** step at position 2 and renumber the trailing steps (Current languages → 3, Learning target → 4, Goals → 5; research.md Decision 3). The Background step must carry the FR-002 framing, list the four options as a checklist, state the any/all/none + optional intent, instruct a confirm-back before moving on, and allow light follow-ups with an exit. Leave the Name step and the `onboarded: false` gate intact. Make T002's assertions pass. (Per-method action detail is added in US2.)

**Checkpoint**: Onboarding shows the four-option background checklist with the correct framing and no LinkedIn ask — independently demoable as the MVP.

---

## Phase 4: User Story 2 - Each sharing method does the right thing (Priority: P2)

**Goal**: For each chosen method the mentor takes the right action — resume (paste, or a learner-run `!cp` into the workspace root, then parse), GitHub username (analyze public repos), website (fetch & read with a paste fallback), and "something else" (free-form) — and accommodates more than one method or none.

**Independent Test**: For each of the four options, simulate the learner choosing it and supplying input; confirm the script directs the method-appropriate action and the multi/none cases are handled.

### Tests for User Story 2 (REQUIRED — Principle IX) ⚠️

> Write FIRST, confirm they FAIL before implementation.

- [X] T004 [US2] Extend the `onboarding background step` describe block in `src/__tests__/templates.test.ts` with failing assertions on `rootClaudeMd()`: resume → instruct **paste**, or give a path and the mentor hands the learner a ready-to-run `!cp <path> ./resume.<ext>` command (learner runs it) bringing it to the workspace root, then parse; paste is the fallback for unparseable formats (C4/FR-006); GitHub → analyze the username's public repositories (C5/FR-007); website → fetch & read, with a paste fallback if the fetch is blocked (C6/FR-008); something else → invite a free-form description and incorporate it (C7/FR-009); a LinkedIn URL offered under "something else" → explain it can't be viewed and ask for a paste (C11/edge); and the background step explicitly directs the mentor to write `profile.md` via its Edit/Write tools (never a shell write like `touch`/`>`/`mv`) and to hand any shell-only write to the learner to run (C12/FR-017) — assert this directive appears within the background/onboarding step, so a generic shell-write rule elsewhere does not satisfy it. Run `npm test`; confirm fail.

### Implementation for User Story 2

- [X] T005 [US2] In `src/templates/claude.ts` (`rootClaudeMd()` Background step from T003), add the per-method instructions and edge handling: resume (paste, or hand the learner `!cp <path> ./resume.<ext>` to run, then parse; paste fallback for `.docx`/unparseable); GitHub username (analyze public repos); website (fetch & read; paste fallback if blocked); something else (free-form, incorporated); LinkedIn-under-"something else" handling; and add (or extend) the background step's directive that `profile.md` writes go through Edit/Write — never a shell write — with any shell-only write handed to the learner, so T004's onboarding-scoped assertion passes (C12/FR-017). Make T004 pass. Same file/function as T003 — runs after it, not in parallel.

**Checkpoint**: Each background path triggers the correct mentor action; US1 + US2 together complete the onboarding-script behavior.

---

## Phase 5: User Story 3 - LinkedIn fully removed from the learner's record (Priority: P3)

**Goal**: LinkedIn appears nowhere in the profile scaffold (Links + Background note) or the documented data contract; a website slot replaces it.

**Independent Test**: Inspect a freshly scaffolded `profile.md` and the `LearnerProfile` type — no LinkedIn reference remains and a website slot/field appears.

### Tests for User Story 3 (REQUIRED — Principle IX) ⚠️

> Write FIRST, confirm they FAIL before implementation. (Shares `templates.test.ts` with US1/US2 — sequential, not parallel.)

- [X] T006 [US3] Extend the `profileMd()` assertions in `src/__tests__/templates.test.ts`: Links section lists GitHub, Website, Resume and does **not** match `/linkedin/i` (C13/FR-012); the Background note references resume / GitHub / website / the learner's own description and **not** LinkedIn (C14/FR-013); `profileMd()` still ships `onboarded: false` and a blank identity so existing init tests pass (C15). Run `npm test`; confirm the LinkedIn-removal assertions fail.

### Implementation for User Story 3

- [X] T007 [US3] In `src/templates/profile.ts` (`profileMd()`), change the Links section from `LinkedIn:/GitHub:/Resume:` to `GitHub:/Website:/Resume:` (FR-012) and update the Background-note HTML comment to reference resume / GitHub / website / own description, dropping "LinkedIn profile" (FR-013). Make T006 pass.
- [X] T008 [P] [US3] In `src/types/index.ts`, rename `LearnerProfile.linkedInUrl?: string` → `websiteUrl?: string` (FR-014/C16). Verification is `npm run build` (strict `tsc`) staying clean — the field is referenced nowhere else, so the build compiles only once renamed. Different file from T007 with no dependency → parallelizable.

**Checkpoint**: No LinkedIn reference remains in any shipped artifact (SC-004); the data contract exposes `websiteUrl`.

---

## Phase 6: Polish & Cross-Cutting Concerns

- [X] T009 Run the full suite gate (SC-005): `npm test` all green and `npm run build` strict-clean, confirming no regressions in existing `init`/template tests.
- [ ] T010 Manual review per quickstart.md (LLM runtime behavior — not unit-testable): dry-run onboarding and check each row against its PASS criterion — sources folded into `profile.md` (≥1 concrete detail per supplied source, none dropped); recap names ≥2 selected sources with no invented claims; ≤3 light follow-ups each answerable in a sentence with an explicit exit offered; `profile.md` confirmed before write. Log results. Runs after T009 (needs the built artifact).

---

## Dependencies & Execution Order

### Phase Dependencies

- **Setup (Phase 1)**: no dependencies.
- **Foundational (Phase 2)**: none for this feature.
- **User Stories (Phase 3–5)**: depend on Setup.
  - US1 → US2 are **sequential** (both edit `rootClaudeMd()`; US2 extends US1's step).
  - US3 is source-independent of US1/US2 (edits `profile.ts` + `types/index.ts`) but its test task shares `templates.test.ts`, so test-file edits across stories serialize.
- **Polish (Phase 6)**: after all implementation.

### Within Each User Story

- Test task FIRST and FAILING before implementation (Principle IX).
- US3: `profileMd()` edit (T007) and the type rename (T008) are independent files → parallelizable.

### Parallel Opportunities

- **T008 [P]** (type rename) can run alongside **T007** (profile scaffold) — different files.
- US3's source work (T007/T008) can proceed alongside US1/US2's `claude.ts` work **if** the shared `templates.test.ts` edits are coordinated to avoid conflicts.
- Otherwise parallelism is minimal: the onboarding-script tasks (T002→T003→T004→T005) are inherently sequential (one file, one function).

---

## Parallel Example: User Story 3

```bash
# After T006 (US3 tests) is written and failing, the two implementation
# tasks touch different files and can run together:
Task: "T007 Update profileMd() Links + Background note in src/templates/profile.ts"
Task: "T008 Rename linkedInUrl → websiteUrl in src/types/index.ts"
```

---

## Implementation Strategy

### MVP First (User Story 1 only)

1. Phase 1: Setup (baseline green).
2. Phase 3: US1 — T002 (failing tests) → T003 (implement). The checklist exists and LinkedIn is gone.
3. **STOP and VALIDATE**: run the US1 assertions; demo onboarding showing the four-option background step.

### Incremental Delivery

1. Setup → US1 (MVP: working background menu, no LinkedIn) → validate.
2. US2 (each method does the right thing) → validate.
3. US3 (LinkedIn removed from scaffold + contract) → validate.
4. Phase 6 gate (full suite + manual review) before the feature is considered complete.

---

## Notes

- This branch (`20260525-192407-onboarding-background-options`) is already merged (PR #9 shipped specs only). Start implementation on a **fresh branch** off `main`; this uncommitted `tasks.md` will follow the checkout.
- [P] = different files, no dependency. [Story] label maps each task to its spec.md user story.
- Verify each test fails before implementing it (Red→Green).
- The shipped artifact is the instruction text; content is unit-tested, runtime adherence is manual review (Phase 6).
- Commit after each task or logical Red→Green pair.
