# Implementation Plan: Onboarding Background — Sharing Options

**Branch**: `20260525-192407-onboarding-background-options` | **Date**: 2026-05-26 | **Spec**: [spec.md](./spec.md)

**Input**: Feature specification from `specs/20260525-192407-onboarding-background-options/spec.md`

## Summary

Replace the broken LinkedIn step in the generated workspace's onboarding
interview with a single, multi-select background step offering: upload/paste a
resume, provide a GitHub username, provide a website, or enter something else.
Remove LinkedIn from the onboarding script, the `profile.md` scaffold (Links and
Background note), and the documented `LearnerProfile` data contract (swap
`linkedInUrl` → `websiteUrl`).

The entire change lives in **bundled workspace content** plus one type
definition — there is no new executable code path. The mentor behaviors the spec
describes (present a checklist, fetch a website, analyze a GitHub account, ask
clarifying follow-ups) are *instructions* encoded as markdown in the generated
`CLAUDE.md`; codojo itself runs none of them. The testable surface is therefore
the **content of the template strings**: that the onboarding script contains the
required framing, options, and per-method instructions, contains no LinkedIn
ask, and that the profile scaffold + type contract drop LinkedIn for a website
field. This mirrors how the `init` feature tested FR-007's behavioral half
(asserting `rootClaudeMd()` contains the confirm-before-edit rule) and is honest
about the limit: the mentor's *runtime adherence* to these instructions is a
qualitative/manual property, not unit-testable.

Technical approach: extend `src/__tests__/templates.test.ts` with failing
assertions for the new onboarding script and profile scaffold (Red), then edit
`src/templates/claude.ts`, `src/templates/profile.ts`, and
`src/types/index.ts` to satisfy them (Green). No dependencies, no module-system
or build changes.

## Technical Context

**Language/Version**: TypeScript 5.9 (strict), compiled to ES2022; Node.js ≥ 20

**Primary Dependencies**: None new. Runtime "fetch website / analyze GitHub /
parse resume" is performed by the mentor (Claude Code), not by codojo code, so no
runtime dependency is added. Dev: `jest` + `ts-jest` (ESM preset), `typescript`.

**Storage**: Local filesystem only — the change is to the static content `init`
writes. codojo performs no network access (the website fetch is the mentor's, and
was already an available capability — see Constitution Principle VIII check).

**Testing**: Jest with `ts-jest/presets/default-esm` under
`node --experimental-vm-modules` (existing `npm test`). Tests in `src/__tests__/`;
this feature extends `templates.test.ts`.

**Target Platform**: Developer workstations (macOS/Linux); the generated workspace
targets Claude Code as the mentor runtime.

**Project Type**: Single-project CLI tool published to npm as `codojo`.

**Performance Goals**: N/A — static content change; no runtime cost.

**Constraints**: No new dependency (Technology Constraints); strict-mode `tsc`
clean and `npm test` clean before done (Principles VI, IX); workspace sandbox
boundaries unchanged (Principle VIII).

**Scale/Scope**: Two template functions (`rootClaudeMd`, `profileMd`), one type
(`LearnerProfile`), one test file extended. 16 functional requirements, 3 user
stories, 5 success criteria.

## Constitution Check

*GATE: Must pass before Phase 0 research. Re-check after Phase 1 design.*

Confirm this plan complies with `.specify/memory/constitution.md` (v1.1.1).

Product behavior (the generated mentor):

- [x] **I. Teach, Don't Ghostwrite** — the background step gathers context to
      tailor teaching; it generates no learner code. PASS.
- [x] **II. Meet the Learner Where They Are** — collecting resume/GitHub/website
      background is *the mechanism* by which the mentor anchors to the learner's
      known stack. This change makes that mechanism work (LinkedIn fetch was
      broken). PASS.
- [x] **III. Notes Belong to the Learner** — onboarding still writes `profile.md`
      only after confirming with the learner (existing rule, untouched); clarifying
      follow-ups (FR-011) never write to `notes/`/`projects/`. PASS.
- [x] **VIII. The Workspace Is Sacred** — the resume is brought *into* the
      workspace by handing the learner a `!cp` command to run (FR-006), so the
      mentor reads only inside the workspace — reusing the existing
      delegate-shell-writes-to-the-learner pattern rather than reading outside it.
      The website fetch (FR-008) is the mentor reading a learner-supplied public
      URL, a capability it already had; no permission boundary in the generated
      `.claude/settings.json` changes. PASS.

Engineering (the codojo codebase):

- [x] **IV. Specs Before Code** — spec committed and clarified (`/speckit-clarify`
      found no critical ambiguities) before this plan. PASS.
- [x] **V. Small, Shippable Increments** — one coherent template change; `main`
      stays npm-publishable. PASS.
- [x] **VI. TypeScript Strict Mode** — the only type change swaps one optional
      field (`linkedInUrl?` → `websiteUrl?`); no `any`/suppressions. PASS.
- [x] **VII. ESM Only** — no module or import changes. PASS.
- [x] **IX. Test-Driven Development** — new template-content assertions are written
      before editing the templates (Red→Green); every FR maps to a test or an
      explicit manual-review note (see quickstart.md). PASS.
- [x] **Technology Constraints** — no new dependencies; stays within the fixed
      stack. PASS.

**Honest disclosure on Principle IX (testability limit):** FR-006–FR-009 and
FR-011 describe *mentor runtime behavior* an LLM performs by following markdown
instructions. These cannot be unit-tested for actual adherence. Per the precedent
set by the `init` plan (FR-007/FR-010), each is covered by an **instruction-content
test** — asserting the generated `CLAUDE.md` contains the directive — and the
runtime behavior is logged as manual review in quickstart.md. This is coverage of
the artifact codojo actually ships (the instructions), stated without pretending it
verifies the LLM's responses.

## Project Structure

### Documentation (this feature)

```text
specs/20260525-192407-onboarding-background-options/
├── plan.md              # This file
├── research.md          # Phase 0 — decisions (field name, checklist phrasing, test strategy)
├── data-model.md        # Phase 1 — LearnerProfile contract + profile.md scaffold shape
├── quickstart.md        # Phase 1 — FR/SC → test map
├── contracts/
│   └── onboarding-background.md   # the required onboarding background-step contract
├── checklists/
│   └── requirements.md  # Spec quality checklist (from /speckit-specify)
└── spec.md              # Feature spec
```

### Source Code (repository root)

Existing single-project CLI; this feature edits content, not structure:

```text
src/
├── templates/
│   ├── claude.ts          # rootClaudeMd() — onboarding script (FR-001,002,003,004,005,006,007,008,009,010,011,015,016,017)
│   └── profile.ts         # profileMd() — Links section + Background note (FR-012,013)
├── types/
│   └── index.ts           # LearnerProfile — drop linkedInUrl, add websiteUrl (FR-014)
└── __tests__/
    └── templates.test.ts  # EXTENDED — onboarding-script + profile-scaffold assertions (IX)
```

**Structure Decision**: Retain the existing layout. All edits are to template
content and one type; the test surface is `templates.test.ts`, extended with a new
`describe` block for the onboarding background step rather than a new file (it
already exercises `rootClaudeMd()` and `profileMd()`). No production logic in
`commands/`, `cli.ts`, or `utils.ts` changes — `init` writes whatever the
templates return, so corrected content flows through unchanged.

## Assumptions

- **`!cp` source-path reachability (FR-006)**: The `!cp <path> ./resume.<ext>`
  handoff runs in the **learner's own shell, outside the sandbox**, so the
  learner's shell is assumed to have read access to whatever source path they
  supply. Paths on network mounts, cloud-synced volumes, or locations requiring
  elevated permissions may silently fail. This is accepted behavior: codojo does
  not validate the source path, and a failed `cp` is the learner's signal to fall
  back to pasting the resume — the paste path exists for exactly this case.

## Complexity Tracking

No constitution gates failed; no violations to justify. No new dependencies, no
new modules, no new layers — the feature is a content + single-field-type change.
