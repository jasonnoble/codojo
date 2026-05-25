<!--
SYNC IMPACT REPORT
==================
Version change: 1.0.0 → 1.0.1 (PATCH)
Rationale: Wording-only clarification of Principle VIII's rationale; the
principle's normative rules are unchanged. Removed the "home directory"
reference (the workspace lives wherever the learner chose during `codojo init`)
and reframed the trust argument around the declared sandbox.

Modified principles:
  VIII. The Workspace Is Sacred — rationale reworded (no normative change)

Added sections: none
Removed sections: none

Templates requiring updates:
  ✅ .specify/templates/plan-template.md — constitution version reference bumped
                                           to v1.0.1 (gate text unchanged)
  ✅ .specify/templates/spec-template.md — reviewed; no change required
  ✅ .specify/templates/tasks-template.md — reviewed; no change required
  ✅ .specify/templates/checklist-template.md — reviewed; no change required

Follow-up TODOs: none

----- Prior amendments -----
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
Principles IV–VII constrain *how the codojo codebase itself is engineered*.

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
or write files outside that workspace except through the permission boundaries
declared in the workspace's `.claude/settings.json`. Those boundaries — `notes/`
and `projects/` read-only, `mentor_notes/` read/write, sensitive paths and
parent-directory traversal denied — MUST be generated with every workspace and
honored in spirit even where enforcement is soft. Loosening a boundary MUST be a
deliberate, reviewed change, never an incidental one.

**Rationale**: Trust is the foundation of mentorship. A tool that reaches outside
its declared sandbox — or leaks secrets, or edits the learner's files unbidden —
cannot be trusted to run anywhere on a developer's machine. The workspace lives
wherever the learner chose during `codojo init`, so the boundary is defined by
that declared sandbox, not by any fixed location.

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
- `npm test` passes.
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

**Version**: 1.0.1 | **Ratified**: 2026-05-25 | **Last Amended**: 2026-05-25
