# Feature Specification: Sandbox-Based Workspace Isolation & Opt-In GitHub CLI Access

**Feature Branch**: `20260527-105013-sandbox-isolation`

**Created**: 2026-05-27

**Status**: Draft

**Input**: User description: "Harden codojo init's generated workspace isolation and add opt-in GitHub CLI access. The generated settings.json relies on a `Read(../**)` deny rule that is a no-op, and permission rules only govern Claude's own file tools — not Bash subprocesses — so the mentor can currently read/write outside the workspace. Replace this with an OS-level sandbox block, and add an opt-in `--allow-gh-cli` flag for read-only GitHub CLI access."

## Clarifications

### Session 2026-05-27

- Q: Should `gh auth status` be in the auto-approved read-only `gh` set, given `gh auth status --show-token` exposes the authentication token? → A: No — remove `gh auth` from auto-approval entirely; any `gh auth` command requires explicit approval. Other read-only lookups (PRs, issues, runs, search, repo view, general `gh status`) remain auto-approved.

## User Scenarios & Testing *(mandatory)*

### User Story 1 - The mentor is actually confined to the workspace (Priority: P1)

A learner scaffolds a workspace with `codojo init` and starts the mentor. The mentor cannot read the learner's other projects, secrets, or home-directory files, and cannot create or modify files anywhere outside the workspace — and this holds even when the mentor runs shell commands, not just when it uses its built-in file tools. The boundary is enforced by the operating system, not by the mentor's good behavior.

**Why this priority**: This is the core promise of the feature. Today the workspace advertises an isolation boundary (`Read(../**)`) that does nothing, giving users a false sense of security. Restoring a real boundary is the whole point; everything else is secondary.

**Independent Test**: Generate a default workspace, start the mentor, and ask it to run shell commands that (a) read a file outside the workspace (e.g. a sibling project) and (b) write a file anywhere — both must fail at the OS level (`Operation not permitted`). Reading files *inside* the workspace via shell succeeds; the mentor's *writes* to `mentor_notes/`/`profile.md`/`goals.md` happen through its Edit/Write tools, not shell.

**Acceptance Scenarios**:

1. **Given** a freshly generated workspace, **When** the mentor runs a shell command to read a file outside the workspace, **Then** the operating system blocks the read and the command fails.
2. **Given** a freshly generated workspace, **When** the mentor runs a shell command to write a file anywhere (inside or outside the workspace), **Then** the operating system blocks the write and the command fails.
3. **Given** a freshly generated workspace, **When** the mentor reads a file inside the workspace via shell, or writes `mentor_notes/`/`profile.md`/`goals.md` via its Edit/Write tools, **Then** the operation succeeds.
4. **Given** a freshly generated workspace, **When** a shell command fails because of the sandbox, **Then** it is not silently retried outside the sandbox.

---

### User Story 2 - Opt-in GitHub CLI access (Priority: P2)

A learner who wants the mentor to look things up on GitHub (open pull requests, issues, CI runs) scaffolds the workspace with `codojo init --allow-gh-cli`. In that workspace the mentor can run read-only `gh` lookups without being prompted each time, but it still cannot perform mutating GitHub operations without explicit approval. A learner who does not pass the flag gets a workspace where `gh` does not work at all.

**Why this priority**: Useful but optional capability. It deliberately widens the isolation boundary, so it must be an explicit choice rather than a default.

**Independent Test**: Run `codojo init --allow-gh-cli <dir>` and confirm the generated workspace permits read-only `gh` lookups unattended; run `codojo init <dir>` without the flag and confirm `gh` is blocked. Confirm mutating `gh` operations still require approval in the flagged workspace.

**Acceptance Scenarios**:

1. **Given** `codojo init` is run without `--allow-gh-cli`, **When** the mentor attempts a `gh` command, **Then** it is blocked.
2. **Given** `codojo init --allow-gh-cli`, **When** the mentor runs a read-only `gh` lookup (viewing/listing PRs, issues, runs, or searching), **Then** it runs without a permission prompt.
3. **Given** `codojo init --allow-gh-cli`, **When** the mentor attempts any `gh` operation outside the read-only set — a mutating operation (create, merge, close, delete, secret, generic API, login) or any `gh auth` command (which can expose the token via `--show-token`) — **Then** it is not auto-approved and requires explicit user approval.
4. **Given** `--allow-gh-cli` is passed either before or after the workspace directory argument, **When** `init` runs, **Then** the flag is recognized and is not mistaken for the directory path.

---

### User Story 3 - Honest, accurate permission documentation (Priority: P3)

A learner reading the project's README "Permission model" section comes away with a correct understanding of where the isolation boundary is: that OS-level sandboxing enforces it for shell commands, what the default boundary allows, and how to enable GitHub CLI access.

**Why this priority**: The previous documentation overstated the protection that permission rules provide. Accurate docs prevent users from relying on a boundary that isn't there. Lower priority because it does not change runtime behavior, but it is part of "done."

**Independent Test**: Read the README "Permission model" section and verify it describes the sandbox as the enforcement mechanism, no longer references the removed parent-traversal deny rule, and documents the `--allow-gh-cli` flag.

**Acceptance Scenarios**:

1. **Given** the updated README, **When** a reader looks for how the workspace is isolated, **Then** it states that the sandbox provides the OS-level boundary and that permission rules alone do not isolate shell commands.
2. **Given** the updated README, **When** a reader looks for GitHub CLI support, **Then** the `--allow-gh-cli` flag and its read-only nature are documented.

---

### Edge Cases

- `--allow-gh-cli` passed with no directory argument: the flag is consumed and the interactive directory prompt still appears (the flag is never treated as the path).
- `--allow-gh-cli` passed before the directory (`codojo init --allow-gh-cli ~/foo`) and after it (`codojo init ~/foo --allow-gh-cli`): both are recognized.
- An unknown flag (e.g. a typo like `--allow-gh`) does not silently enable GitHub access.
- The target workspace already exists and is non-empty: existing `init` refusal behavior is unchanged.
- Default workspace where running a language runtime in the sandbox fails because the runtime's files live outside the workspace: this is an accepted consequence (see Assumptions), not a defect.
- **`gh` PATH-shim escape** (`--allow-gh-cli` only): the mentor could write a script named `gh` inside the workspace and run it with a prepended `PATH`, matching the `gh` excluded-command pattern and running outside the sandbox. Mitigation relied upon: under strict mode with the closed allow-list, such an invocation is not auto-approved and still hits a permission prompt. The plan MUST confirm this holds.
- **`gh` compound command** (`--allow-gh-cli` only): for a chained command such as `gh pr view 1 && curl …`, the plan MUST determine whether the entire command runs outside the sandbox and whether the leading `gh` token alone can satisfy an auto-approve rule.

## Requirements *(mandatory)*

### Functional Requirements

- **FR-001**: The generated workspace settings MUST NOT contain the ineffective parent-directory-traversal deny rule (`Read(../**)`).
- **FR-002**: The generated workspace settings MUST include a *declarative* sandbox configuration that confines shell commands (and their child processes) to the workspace. codojo emits Claude Code's platform-agnostic sandbox settings (allow/deny read and write paths, excluded commands); Claude Code itself translates that single configuration into OS-level enforcement — Seatbelt on macOS, bubblewrap on Linux/WSL2. codojo does NOT author OS-specific sandbox profiles. The boundary is enforced by the operating system, not by the mentor's discretion.
- **FR-003**: The sandbox MUST be configured so that a shell command blocked by the sandbox is NOT automatically retried outside the sandbox (strict mode).
- **FR-004**: In a default workspace, shell-command READ access MUST be denied across the entire filesystem except the workspace root.
- **FR-005**: In a default workspace, shell-command WRITE access MUST be denied throughout the workspace (`denyWrite` on the workspace root; `allowWrite` cannot re-permit paths within a denied region — verified empirically). The mentor changes its writable files (`mentor_notes/`, `profile.md`, `goals.md`) through its Edit/Write tools, which are governed by the permission allow rules (FR-006), NOT through shell commands.
- **FR-006**: Existing permission boundaries MUST be preserved: the learner's `notes/` and `projects/` areas remain read-only to the mentor; the mentor's notes area (`mentor_notes/`), `profile.md`, and `goals.md` remain writable **via the mentor's Edit/Write tools** (the permission allow rules), not via shell commands (FR-005).
- **FR-007**: By default (flag absent), the generated workspace MUST block the GitHub CLI (`gh`) entirely.
- **FR-008**: `codojo init` MUST accept an opt-in `--allow-gh-cli` flag, recognized whether it appears before or after the optional workspace-directory argument, and the flag MUST NOT be interpreted as the directory path.
- **FR-009**: When `--allow-gh-cli` is provided, the generated workspace MUST permit a defined set of read-only `gh` operations to run unattended: viewing and listing pull requests, viewing pull-request diffs and checks, viewing and listing issues, viewing repositories, viewing and listing workflow runs, searching, and reporting general status. `gh auth` commands MUST NOT be in this auto-approved set (a broad `gh auth status` approval could expose the authentication token via `--show-token`). This set MUST be a *closed* allow-list of specific read-only subcommands (never a `gh *` wildcard), so any unlisted or newly introduced `gh` subcommand is not auto-approved and falls through to a permission prompt — drift can only withhold convenience, never silently grant access. The complete enumerated list is owned by the implementation plan.
- **FR-010**: When `--allow-gh-cli` is provided, the generated workspace MUST allow `gh` to run outside the sandbox (because the tool cannot complete network requests inside it), while ensuring `gh` operations outside the read-only set — mutating operations (create, merge, close, delete, secrets, generic API calls, login) and any `gh auth` command — are NOT auto-approved and still require explicit user approval. Because this exception is keyed on the command pattern `gh` rather than a verified binary identity, the implementation plan MUST validate how Claude Code matches excluded commands (literal token vs. resolved binary, compound/chained commands, `PATH` resolution) before the exception is relied upon (see Edge Cases). The opt-in nature of `--allow-gh-cli` means the user explicitly accepts this residual widening of the boundary.
- **FR-011**: The project README's permission-model documentation MUST be updated to describe the sandbox-based isolation accurately and to document the `--allow-gh-cli` flag, and MUST NOT continue to describe the removed parent-traversal rule as a protection.
- **FR-012**: All other generated workspace files and their contents (besides `.claude/settings.json` and `CLAUDE.md`) MUST remain unchanged by this feature.
- **FR-013**: The generated workspace `CLAUDE.md` MUST instruct the mentor to (a) modify `mentor_notes/`, `profile.md`, and `goals.md` via its Edit/Write tools rather than shell commands (shell writes are sandbox-denied workspace-wide), and (b) when a task requires a write-performing shell command, surface that command to the learner to run rather than attempting it itself.

### Key Entities

- **Generated workspace settings**: The permission-and-sandbox configuration that `init` writes into a new workspace. Defines what the mentor's file tools and shell commands may read and write, and which commands run inside vs. outside the OS sandbox.
- **Workspace generation options**: The set of choices made at `init` time that influence the generated settings. For this feature the only such option is whether GitHub CLI access is enabled; it defaults to off.

## Success Criteria *(mandatory)*

### Measurable Outcomes

- **SC-001**: `codojo init` deterministically emits a settings file whose sandbox configuration confines reads to the workspace; 100% of generated default workspaces contain the expected read boundary, verified automatically from the generated configuration.
- **SC-002**: `codojo init` deterministically emits a settings file whose sandbox configuration denies shell writes throughout the workspace; 100% of generated default workspaces contain that boundary, verified automatically from the generated configuration. (The mentor's tool-based writes to `mentor_notes/`/`profile.md`/`goals.md` are governed by permission rules, not the sandbox — see FR-006/FR-013.)
- **SC-003**: In a default workspace, the mentor cannot run any `gh` command unattended (0 successful unattended `gh` invocations).
- **SC-004**: In a `--allow-gh-cli` workspace, every read-only `gh` lookup in the defined set runs without a prompt, and every `gh` operation outside that set — including any `gh auth` command and all mutating operations — requires approval (0 such operations auto-approved).
- **SC-005**: `--allow-gh-cli` is correctly recognized in both argument positions, with 0% misclassification as the workspace directory.
- **SC-006**: A reader of the updated README can correctly identify the sandbox as the isolation mechanism and locate the `--allow-gh-cli` flag, with no surviving claim that the parent-traversal deny rule provides isolation.
- **SC-007**: The OS-level *enforcement* of the emitted configuration (e.g. Seatbelt returning `Operation not permitted` for an out-of-workspace read or write) is a property of Claude Code, not codojo. It is verified manually once on macOS and is explicitly not an ongoing codojo automated-test obligation.

## Assumptions

- A codojo workspace typically lives inside the user's home directory, so it cannot be isolated by permission deny rules alone (a blanket parent/home deny would also lock the workspace out of itself); OS-level sandboxing is therefore required for a real boundary.
- The mentor is "notes-only": it guides the learner and hands them commands to run rather than executing language runtimes itself. Consequently, denying shell read access to the whole filesystem outside the workspace — which prevents running runtimes whose files live elsewhere — is an accepted trade-off, not a defect.
- The same declarative sandbox settings are correct across platforms precisely because Claude Code (not codojo) maps them to Seatbelt on macOS and bubblewrap on Linux/WSL2. macOS (Seatbelt) is the primary platform being validated; Linux/WSL2 (bubblewrap) enforcement is not verified as part of this feature. Residual risk: codojo depends on Claude Code's cross-platform sandbox abstraction remaining stable.
- `gh` is the only tool granted a run-outside-the-sandbox exception, because it is a known case that cannot complete its network handshake inside the sandbox; other such tools are out of scope.
- `/tmp` is listed in the sandbox `allowWrite` to document intent, but under the absolute `denyWrite` on the workspace root it is **inert for shell writes** (and macOS `/tmp`→`/private/tmp` symlink resolution would block it regardless). In practice the mentor has **no shell-writable scratch directory** — it writes via its Edit/Write tools and defers write-needing shell commands to the learner (FR-013).
- The user's Claude Code version supports the sandbox configuration the generated settings rely on.
- The default GitHub-CLI-access setting is "off"; enabling it is always an explicit per-`init` choice.
