<!--
SYNC IMPACT REPORT
==================
Version change: 1.1.0 → 1.1.1 (PATCH)
Rationale: Re-worded Principle VIII to replace the obsolete enumerated mechanism
"parent-directory traversal denied" (the no-op `Read(../**)` deny rule) with the
OS-level sandbox boundary the principle's rationale already referenced (since the
1.0.1 clarification). The principle's intent and normative force are unchanged —
this corrects a dead implementation detail and adds clarifying language — hence
PATCH.

Modified principles:
  VIII. The Workspace Is Sacred — enumerated boundaries now name the OS-level
        sandbox instead of "parent-directory traversal denied"; clarified that
        permission rules govern only the mentor's own tools and MUST be backed by
        the sandbox, and that a command exception to run outside the sandbox is a
        deliberate loosening.

Added sections: none
Removed sections: none

Templates / artifacts requiring updates:
  ✅ .specify/templates/plan-template.md — VIII gate line updated to name the sandbox
  ✅ CLAUDE.md — constitution version reference bumped to v1.1.1
  ✅ .specify/templates/spec-template.md — reviewed; no change required
  ✅ .specify/templates/tasks-template.md — reviewed; no change required
  ✅ .specify/templates/checklist-template.md — reviewed; no change required
  ⚠ README.md — "Permission model" section: propagated by feature FR-011 (task T019)
  ⚠ generated CLAUDE.md (src/templates/claude.ts) — propagated by feature FR-013 (task T008)

Follow-up TODOs: none

----- Prior amendments -----
1.1.0 (2026-05-25): Added Principle IX (Test-Driven Development, NON-NEGOTIABLE).
1.0.1 (2026-05-25): Clarified Principle VIII rationale (declared sandbox, not a
fixed home directory); no normative change.
1.0.0 (2026-05-25): Initial ratification — 8 principles (I–VIII), Technology
Constraints, Development Workflow & Quality Gates, and Governance; filled from
the unratified template.
-->

# codojo Constitution

## Core Principles

codojo is two things at once, and these principles govern both: it is a
**product** — a Claude Code workspace that puts the AI into mentor mode — and it
is a **codebase** — a TypeScript CLI published to npm. Principles I–III and VIII
constrain the *product's runtime behavior* (the mentor codojo generates).
Principles IV–VII and IX constrain *how the codojo codebase itself is engineered*.

### I. Teach, Don't Ghostwrite

The mentor MUST reinforce the learner's understanding, never replace it. The
generated mentor MUST NOT produce code the learner has not explicitly asked to
understand. When code is unavoidable, it MUST be the smallest illustrative
snippet and MUST follow an explanation of the concept behind it — never a large
block dropped on the learner. Every feature codojo ships MUST be evaluated
against this question: does it deepen the learner's understanding, or substitute
for it? Features that substitute MUST be rejected.

**Rationale**: codojo exists to grow developers, not to autocomplete for them.
A mentor that writes the code teaches nothing; the value is in the struggle and
the guided discovery.

### II. Meet the Learner Where They Are

The mentor MUST anchor every new concept to languages and frameworks the learner
already knows, building a bridge from the familiar to the unfamiliar. The target
user is an experienced developer switching languages or frameworks — NOT a
beginner. Explanations MUST assume professional fluency in the learner's existing
stack and MUST NOT re-teach fundamentals they already command.

**Rationale**: Concept mapping is faster and more durable than learning from
scratch. Treating an expert like a novice wastes their time and erodes trust.

### III. Notes Belong to the Learner

The `notes/` and `projects/` directories are READ-ONLY for the mentor. The mentor
MUST read them only to understand what the learner is studying, to source quiz
questions, and to give feedback — and MUST NOT write to them unless the learner
explicitly asks. `profile.md` and `goals.md` are the learner's record of
themselves; the mentor MUST confirm with the learner before editing either.

**Rationale**: Learning artifacts are the learner's own work and their proof of
progress. A mentor that edits the learner's notes corrupts the record and
undermines ownership.

### IV. Specs Before Code (NON-NEGOTIABLE)

No feature gets built without a spec-kit specification. No exceptions. Work MUST
flow through the Spec-Driven Development pipeline — constitution → specify →
clarify → plan → tasks → implement — before any implementation begins. This is
enforced by workflow, not left to convention.

**Rationale**: Specs make intent reviewable before code makes it expensive to
change. Skipping the spec trades a cheap conversation now for an expensive
rewrite later.

### V. Small, Shippable Increments

Every version MUST be publishable to npm as a coherent release. No dark launches,
no half-merged features hidden behind dead code. Each increment MUST stand on its
own and deliver demonstrable value. Work MUST be sliced so that any completed
increment leaves `main` in a releasable state.

**Rationale**: Shippable increments keep the project honest, surface integration
problems early, and let users benefit continuously instead of waiting for a big
bang that may never land.

### VI. TypeScript Strict Mode (NON-NEGOTIABLE)

TypeScript `strict` mode is mandatory. No `any`, no implicit `any`, no implicit
returns, no suppression comments to dodge the type checker. A `tsc` build that
emits errors or warnings under strict mode BLOCKS shipping. Type escapes MUST be
replaced with correct types, not silenced.

**Rationale**: codojo teaches good engineering; it MUST exemplify it. Strict
types catch bugs the tests miss and keep a small codebase trustworthy as it
grows.

### VII. ESM Only

The package is `type: module` with NodeNext resolution throughout. No CommonJS,
no `require()`, no `module.exports`. All imports MUST use ESM syntax and MUST
include explicit file extensions where NodeNext requires them (e.g.
`../utils.js`).

**Rationale**: A single, modern module system avoids interop hazards and dual-
package hazards, and keeps the toolchain — `tsc`, ts-jest, Node ≥ 20 — coherent.

### VIII. The Workspace Is Sacred

The generated mentor MUST stay inside the learner's workspace. It MUST NOT read
or write files outside that workspace except through the boundaries declared in
the workspace's `.claude/settings.json`. Those boundaries — generated with every
workspace — MUST include: `notes/` and `projects/` read-only to the mentor,
`mentor_notes/`/`profile.md`/`goals.md` writable, sensitive paths denied, and an
OS-level sandbox confining shell commands and their subprocesses to the
workspace. The sandbox is the boundary that actually holds: permission rules
govern only the mentor's own file tools, so they MUST be backed by the sandbox
rather than relied on alone, and the mentor MUST honor every boundary in spirit
even where a given layer's enforcement is soft. Loosening a boundary — including
granting any command an exception to run outside the sandbox — MUST be a
deliberate, reviewed change, never an incidental one.

**Rationale**: Trust is the foundation of mentorship. A tool that reaches outside
its declared sandbox — or leaks secrets, or edits the learner's files unbidden —
cannot be trusted to run anywhere on a developer's machine. Permission rules
constrain the agent's own tools but not the shell subprocesses it spawns; only an
OS-level sandbox enforces the boundary regardless of what runs. The workspace
lives wherever the learner chose during `codojo init`, so the boundary is defined
by that declared sandbox, not by any fixed location.

### IX. Test-Driven Development (NON-NEGOTIABLE)

Tests are written before implementation. Every behavior a feature claims to have
MUST be covered by a test. If a behavior has no test, it is not considered
implemented — regardless of whether the code works in practice. The Red-Green-
Refactor cycle is mandatory: write a failing test, make it pass, clean up.
`npm test` MUST pass clean before any feature is considered complete. A feature
with untested behavior MUST NOT be merged to `main`.

**Rationale**: Tests written after the fact verify what was built, not what was
intended. Tests written first define the contract. codojo teaches good engineering
and MUST practice it — a codebase with behavioral gaps in its test suite cannot
be trusted, and cannot serve as an example to learners.

## Technology Constraints

The following stack is fixed for the codojo codebase; deviating from it requires a
constitution amendment (see Governance):

- **Language**: TypeScript in `strict` mode (Principle VI).
- **Module system**: ESM / `type: module`, NodeNext resolution (Principle VII).
- **Runtime**: Node.js `>= 20`.
- **Build**: `tsc` (`npm run build`); compiled output in `dist/`.
- **CLI/UX libraries**: `@inquirer/prompts` for interactive prompts, `chalk` for
  terminal styling, `fs-extra` for filesystem work.
- **Testing**: Jest with ts-jest (`npm test`).
- **Distribution**: published as the `codojo` package on npm; `bin` entry points
  to `dist/cli.js`.

New runtime dependencies MUST be justified against Principle I (does it serve the
learner?) and kept minimal. The product layer (the generated mentor) targets
Claude Code as its execution environment.

## Development Workflow & Quality Gates

All feature work MUST follow Spec-Driven Development with spec-kit:

1. **Constitution** governs (this document).
2. **`/speckit-specify`** — write the feature spec. No code before this exists
   (Principle IV).
3. **`/speckit-clarify`** — resolve ambiguities in the spec.
4. **`/speckit-plan`** — produce the implementation plan; the plan's Constitution
   Check MUST pass before research/design proceeds.
5. **`/speckit-tasks`** — break the plan into dependency-ordered tasks.
6. **`/speckit-implement`** — build, slicing into shippable increments
   (Principle V).

Quality gates — a change MUST NOT merge to `main` or publish unless:

- A spec-kit spec backs the feature (Principle IV).
- `npm run build` passes with zero errors/warnings under strict mode
  (Principle VI).
- `npm test` passes clean, and every behavior the feature claims is covered by a
  test that was written before its implementation (Principle IX).
- No CommonJS constructs were introduced (Principle VII).
- For changes to the generated workspace: the permission boundaries in the
  generated `.claude/settings.json` remain intact (Principle VIII), and mentor
  guidance still upholds Principles I–III.
- `main` is left in a releasable, npm-publishable state (Principle V).

## Governance

This constitution supersedes all other development practices for codojo. When a
practice and this document conflict, this document wins.

**Amendment procedure**: Amendments MUST be proposed as a change to this file,
include a rationale, and be reviewed before merge. Any amendment that materially
changes a principle MUST be propagated to dependent artifacts — the spec-kit
templates under `.specify/templates/` and the runtime guidance in `README.md` and
the generated `CLAUDE.md` — in the same change.

**Versioning policy**: This constitution is versioned with semantic versioning:

- **MAJOR**: backward-incompatible governance changes, or the removal or
  redefinition of a principle.
- **MINOR**: a new principle or section, or materially expanded guidance.
- **PATCH**: clarifications, wording, and non-semantic refinements.

**Compliance review**: Every plan's Constitution Check and every code review MUST
verify compliance with these principles. Complexity or deviation MUST be
justified in writing (e.g. the plan's Complexity Tracking table) or the change
MUST be simplified to comply.

**Version**: 1.1.1 | **Ratified**: 2026-05-25 | **Last Amended**: 2026-05-27
