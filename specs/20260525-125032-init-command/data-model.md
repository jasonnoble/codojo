# Phase 1 Data Model: `codojo init`

`codojo init` is a stateless scaffolder — it persists no database and reads no
prior state. The "data" is the in-memory description of what to write and the
on-disk tree it produces. Entities below map to existing types in
`src/types/index.ts` and `src/templates/index.ts`.

## Entity: WorkspaceFile

A single file to write into the workspace. Source of truth for the manifest.

| Field | Type | Rules |
|-------|------|-------|
| `path` | `string` | Relative to workspace root, POSIX separators (e.g. `mentor_notes/sessions/CLAUDE.md`). Unique within the manifest. |
| `content` | `string` | MUST be non-empty (FR-006). |

Defined in `src/templates/index.ts` as `interface WorkspaceFile`. The directory
tree is *derived* from the set of `path` values — adding a manifest entry is all
it takes to scaffold a new file/dir.

## Aggregate: Workspace Manifest

The ordered list returned by `workspaceFiles()`. Fixed at 10 entries (FR-005):

1. `CLAUDE.md` — mentor-mode rules; includes confirm-before-editing instruction (FR-007 behavioral half).
2. `.claude/settings.json` — permission boundaries (FR-007).
3. `profile.md` — front matter `onboarded: false` (FR-008).
4. `goals.md`
5. `notes/CLAUDE.md` — read-only marker for the mentor.
6. `projects/CLAUDE.md` — read-only marker for the mentor.
7. `mentor_notes/sessions/CLAUDE.md`
8. `mentor_notes/topics/CLAUDE.md`
9. `mentor_notes/quiz_history.md`
10. `mentor_notes/concept_map.md`

**Invariants**: every `path` distinct; every `content` non-empty; the union of
the parent directories defines the scaffolded tree; the set is identical on every
run (deterministic, offline).

## Value object: PermissionBoundary

Encoded inside `.claude/settings.json` (not a standalone TS type). Each boundary
is an allow/deny rule keyed by tool + glob.

| Boundary | Rule | Requirement |
|----------|------|-------------|
| `notes/**` | deny Write/Edit/MultiEdit | FR-007 (read-only) |
| `projects/**` | deny Write/Edit/MultiEdit | FR-007 (read-only) |
| `mentor_notes/**` | allow Write/Edit/MultiEdit | FR-007 (writable) |
| `profile.md`, `goals.md` | allow Write/Edit | FR-007 (writable) — paired with confirm-before-edit rule in CLAUDE.md |
| `../**`, `~/.ssh/**`, `~/.aws/**`, `~/.gnupg/**`, `**/.env` | deny Read | FR-007 (sensitive/traversal denied), Principle VIII |

**Validation**: the file MUST parse as JSON (FR-007); deny set MUST include the
read-only globs; allow set MUST include the writable globs.

## Transient: ResolvedTarget

Not persisted; computed during a run from the path argument or prompt answer.

| Field | Derivation | Used by |
|-------|-----------|---------|
| `rawPath` | `argv[0]` or prompt answer (default `~/workspace/codojo`) | FR-001, FR-002 |
| `workspacePath` | `expandHome(rawPath)` → absolute | FR-003 |
| `exists` / `isDirectory` / `isEmpty` | `fs.stat` + `fs.readdir` on `workspacePath` | FR-004, FR-013 |

**State decisions** (one-shot, no transitions):
- not exists, or exists+directory+empty → **scaffold** (FR-005).
- exists + directory + has ≥1 entry (incl. hidden) → **abort, non-zero** (FR-004).
- exists + not a directory → **abort, non-zero, distinct message** (FR-013).
- creation fails (permissions) → **surface OS error, non-zero** (FR-012).
- prompt cancelled → **exit 130, nothing written** (FR-011).
