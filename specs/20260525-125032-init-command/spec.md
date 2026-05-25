# Feature Specification: `codojo init` — Workspace Scaffolding

**Feature Branch**: `20260525-125032-init-command`

**Created**: 2026-05-25

**Status**: Draft

**Input**: User description: "The `codojo init` command — a CLI command that scaffolds a fresh codojo learning workspace on the learner's machine. It is the only entry point into codojo; everything else (onboarding, teaching, quizzing) happens inside the generated workspace via Claude Code."

## Clarifications

### Session 2026-05-25

- Q: What counts as a "non-empty" directory for the abort guard (FR-004)? → A: Any entry at all — including hidden files such as `.DS_Store` and `.git/` — makes the directory non-empty.
- Q: What if the target path exists but is a regular file (not a directory)? → A: Distinct abort — explain that the path exists and is not a directory, write nothing, exit non-zero.

## User Scenarios & Testing *(mandatory)*

### User Story 1 - Scaffold a fresh learning workspace (Priority: P1)

An experienced developer who has installed the `codojo` package runs the init
command, chooses where the workspace should live, and ends up with a complete,
ready-to-use workspace plus a clear instruction to `cd` in and run `claude`.

**Why this priority**: This is the entire purpose of the command and the only
entry point into codojo. Without it, nothing downstream (onboarding, teaching,
quizzing) can happen. It is the MVP on its own.

**Independent Test**: Run the command against a path that does not yet exist,
accepting the default or supplying one, and confirm that every documented
workspace file is created on disk with non-empty content and that the success
message names the workspace path and tells the learner to run `claude`.

**Acceptance Scenarios**:

1. **Given** a path that does not exist, **When** the learner runs init and
   confirms the path, **Then** the full workspace directory tree is created and
   every documented file is written with non-empty content.
2. **Given** a successful scaffold, **When** the command finishes, **Then** it
   prints one confirmation line per created file, a "✓ Your codojo is ready."
   line, and an instruction to `cd` into the workspace and run `claude`, and it
   exits with code 0.
3. **Given** the workspace was created, **When** the permission settings file is
   inspected, **Then** it is valid JSON that makes `notes/` and `projects/`
   read-only and `mentor_notes/`, `profile.md`, and `goals.md` writable.
4. **Given** the workspace was created, **When** the learner profile scaffold is
   inspected, **Then** it indicates the learner has not yet been onboarded.

---

### User Story 2 - Never clobber existing work (Priority: P2)

A learner accidentally points init at a directory that already contains files
(an old workspace, an unrelated project). The command refuses to touch it,
explains why, and tells them how to proceed — leaving their existing files
completely untouched.

**Why this priority**: Data loss is the worst possible outcome for a tool that
runs in a developer's own directories. Protecting existing work is essential to
trust, but it is secondary to the command being able to scaffold at all.

**Independent Test**: Run the command against a directory that already contains
at least one file, and confirm that no files are written or modified, an
explanatory error is shown, and the process exits non-zero.

**Acceptance Scenarios**:

1. **Given** a target directory that exists and contains at least one entry,
   **When** the learner runs init against it, **Then** the command writes
   nothing, leaves all existing contents unchanged, and exits with a non-zero
   code.
2. **Given** the abort above, **When** the error is shown, **Then** it explains
   that the directory is not empty, suggests choosing a new path or removing the
   directory, and mentions that an `update` command is planned for the future.

---

### User Story 3 - Flexible, interruptible invocation (Priority: P3)

A learner who already knows where they want the workspace passes the path
directly on the command line to skip the prompt; another learner changes their
mind mid-prompt and cancels with Ctrl-C, expecting nothing to be left behind.

**Why this priority**: These conveniences make the command pleasant and safe to
use, but the command is fully functional without them (the prompt and default
already cover the core flow).

**Independent Test**: Invoke the command with a path argument and confirm the
prompt is skipped and that path is used; separately, cancel the prompt and
confirm a clean exit with no files written.

**Acceptance Scenarios**:

1. **Given** a workspace path supplied as a command-line argument, **When** the
   learner runs init, **Then** no prompt is shown and the supplied path is used.
2. **Given** no argument, **When** the learner runs init, **Then** they are
   prompted with a default of `~/workspace/codojo`.
3. **Given** a path beginning with `~`, **When** init resolves it, **Then** the
   `~` is expanded to the learner's home directory.
4. **Given** the interactive prompt is showing, **When** the learner cancels
   with Ctrl-C, **Then** the command exits cleanly with code 130 and no files or
   directories have been created.

---

### Edge Cases

- **Target exists but is empty**: An existing directory with zero entries is
  treated as an acceptable target — scaffolding proceeds into it. A directory
  that contains only hidden files (e.g., a stray `.DS_Store`) is considered
  non-empty and triggers the abort in FR-004.
- **Path is not creatable (permissions / read-only parent)**: The command
  surfaces the underlying operating-system error clearly and exits non-zero
  rather than failing silently or partially.
- **Path exists but is a regular file (not a directory)**: The command aborts
  with a clear "path exists and is not a directory" message and a non-zero exit,
  writing nothing (FR-013).
- **Bare `~` or relative path**: A bare `~` resolves to the home directory; a
  relative path resolves against the current working directory.
- **Partial-write safety on cancellation**: If the learner cancels at the
  prompt, no directory or file may be left on disk.

## Requirements *(mandatory)*

### Functional Requirements

- **FR-001**: The command MUST accept an optional workspace path as a
  command-line argument; when present, it MUST be used without prompting.
- **FR-002**: When no path argument is given, the command MUST prompt the
  learner for a workspace path, offering `~/workspace/codojo` as the default.
- **FR-003**: The command MUST expand a leading `~` (including a bare `~`) in the
  chosen path to the learner's home directory, and MUST resolve relative paths
  against the current working directory.
- **FR-004**: If the target directory already exists and contains at least one
  entry — counting hidden files such as `.DS_Store` and `.git/` as entries — the
  command MUST abort without creating or modifying any file, MUST
  exit non-zero, and MUST display a message that (a) states the directory is not
  empty, (b) suggests a new path or removing the directory, and (c) mentions a
  forthcoming `update` command.
- **FR-005**: On a valid target, the command MUST create the full workspace
  directory tree and write every file in the workspace manifest (see Key
  Entities).
- **FR-006**: Every file the command writes MUST have non-empty content.
- **FR-007**: The generated permission settings file MUST be valid JSON and MUST
  encode these boundaries: `notes/` and `projects/` are read-only to the mentor;
  `mentor_notes/`, `profile.md`, and `goals.md` are writable by the mentor; and
  sensitive locations and parent-directory traversal are denied. Although
  `profile.md` and `goals.md` are writable at the permissions layer, the
  generated `CLAUDE.md` MUST instruct the mentor to confirm with the learner
  before editing either file (Constitution Principle III). Both the permission
  boundary and the behavioral constraint are required.
- **FR-008**: The generated learner profile scaffold MUST mark the learner as
  not yet onboarded.
- **FR-009**: On success, the command MUST print a scaffolding line naming the
  target path, one confirmation line per created file, a readiness line, and an
  instruction to change into the workspace and run `claude`, in that order, and
  MUST exit with code 0.
- **FR-010**: The command MUST NOT run the onboarding interview, MUST NOT collect
  or write the learner's name, languages, or goals, and MUST NOT perform any
  network activity.
- **FR-011**: If the learner cancels the interactive prompt (Ctrl-C), the command
  MUST exit cleanly with code 130 and MUST NOT leave any partial files or
  directories on disk.
- **FR-012**: If the target path cannot be created (e.g., insufficient
  permissions), the command MUST surface the underlying operating-system error
  clearly and exit non-zero.
- **FR-013**: If the target path already exists but is not a directory (e.g., a
  regular file), the command MUST abort without creating or modifying anything,
  display a message stating the path exists and is not a directory, and exit
  non-zero.

### Key Entities *(include if feature involves data)*

- **Workspace**: The directory the command scaffolds; the learner's entire
  codojo engagement lives inside it. Identified by its filesystem path.
- **Workspace Manifest**: The fixed set of files the command writes into the
  workspace, each with a relative path and content. The manifest comprises:
  - `CLAUDE.md` — puts Claude Code into mentor mode; drives onboarding and all
    teaching sessions.
  - `.claude/settings.json` — file-permission boundaries for the mentor.
  - `profile.md` — learner profile scaffold, marked not-yet-onboarded.
  - `goals.md` — learning-goals scaffold.
  - `notes/CLAUDE.md` — signals that `notes/` is read-only to the mentor.
  - `projects/CLAUDE.md` — signals that `projects/` is read-only to the mentor.
  - `mentor_notes/sessions/CLAUDE.md` — session-log instructions for the mentor.
  - `mentor_notes/topics/CLAUDE.md` — per-topic progress-tracking instructions.
  - `mentor_notes/quiz_history.md` — empty quiz-log scaffold.
  - `mentor_notes/concept_map.md` — empty concept-map scaffold.
- **Permission Boundary**: A rule in the settings file declaring a path as
  read-only or writable to the mentor, or denying access entirely.

## Success Criteria *(mandatory)*

### Measurable Outcomes

- **SC-001**: A learner can go from an installed package to a ready-to-use
  workspace with a single command, in under 30 seconds on a typical laptop.
- **SC-002**: After a successful run, 100% of the files in the workspace manifest
  are present on disk, and none is empty.
- **SC-003**: The command never overwrites or deletes a pre-existing file — zero
  data-loss incidents across all runs against non-empty targets.
- **SC-004**: Every defined error case (non-empty target, target path is not a
  directory, uncreatable path, cancellation) ends in a non-zero or 130 exit with
  an actionable, human-readable message; the success path always exits 0.
- **SC-005**: A new learner, given only the command's success output, can locate
  the workspace and start their first session without further instructions.
- **SC-006**: Every behavior listed in this specification is covered by an
  automated test, and the full test suite passes, before the feature is
  considered complete.

## Assumptions

- **Audience**: Target users are experienced developers comfortable with a
  terminal; the command optimizes for them, not for first-time CLI users
  (Constitution Principle II).
- **Single workspace per run**: One invocation scaffolds exactly one workspace;
  managing or migrating existing workspaces is out of scope (deferred to a future
  `update` command).
- **Onboarding is downstream**: Collecting the learner's identity, languages, and
  goals is explicitly the job of the generated workspace's mentor on first
  `claude` run — not of this command.
- **Offline**: The command performs no network access; all template content is
  bundled with the package.
- **Test-first delivery**: Per Constitution Principle IX (Test-Driven
  Development, NON-NEGOTIABLE), each behavior above gets a failing test before its
  implementation; this is a process constraint on how the feature is built, not a
  user-facing behavior.
