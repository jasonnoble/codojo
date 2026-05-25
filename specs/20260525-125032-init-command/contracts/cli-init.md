# CLI Contract: `codojo init`

The "interface" codojo exposes is a command-line tool. This is its contract — the
observable behavior downstream (the learner, the test suite) depends on.

## Invocation

```
codojo init [dir]
```

- `dir` (optional positional): target workspace path. May contain a leading `~`.
  When present, the interactive prompt is skipped (FR-001).
- When absent: prompt `Where should your codojo workspace live?` with default
  `~/workspace/codojo` (FR-002).

## Inputs

| Input | Source | Notes |
|-------|--------|-------|
| workspace path | `argv` after `init`, else prompt | `~`/`~/…` expanded to home; relative resolved vs cwd (FR-003) |

No environment variables, no config files, no network (FR-010).

## Outputs (stdout) — success path

Printed in this exact order (FR-009):

```
Scaffolding workspace at <abs-path> …
  + CLAUDE.md
  + .claude/settings.json
  + profile.md
  + goals.md
  + notes/CLAUDE.md
  + projects/CLAUDE.md
  + mentor_notes/sessions/CLAUDE.md
  + mentor_notes/topics/CLAUDE.md
  + mentor_notes/quiz_history.md
  + mentor_notes/concept_map.md

✓ Your codojo is ready.

Change into the <abs-path> directory and run `claude` to start learning something new.
```

(One `+` line per manifest entry; styling via `chalk` may add ANSI.)

## Exit codes

| Code | Condition | Requirement |
|------|-----------|-------------|
| `0` | Workspace scaffolded successfully | FR-009 |
| non-zero (`1`) | Target dir exists and is non-empty (incl. hidden files) | FR-004 |
| non-zero (`1`) | Target path exists but is not a directory | FR-013 |
| non-zero (`1`) | Target path cannot be created (OS error) | FR-012 |
| `130` | Learner cancels the prompt (Ctrl-C) | FR-011 |

## Error outputs (stderr)

| Case | Message contract |
|------|------------------|
| Non-empty target | States the directory is not empty; suggests a new path or removing the dir; mentions a forthcoming `update` command (FR-004). Writes nothing. |
| Not a directory | States the path exists and is not a directory (FR-013). Writes nothing. |
| Uncreatable path | Surfaces the underlying OS error message (FR-012). |
| Cancellation | Brief "Cancelled." acknowledgement; exits 130; nothing written (FR-011). |

## Side effects

- On success: creates the workspace directory tree and writes all 10 manifest
  files, each non-empty (FR-005, FR-006).
- On any abort/error: **no file is created or modified** (FR-004, FR-011, FR-013;
  SC-003). (Exception: a mid-write OS failure under FR-012 may leave a partial
  tree — the spec requires surfacing the error and non-zero exit, not rollback.)
- Never writes outside the chosen workspace path (Principle VIII).

## Guarantees

- Idempotent only against fresh/empty targets; never overwrites existing content.
- No network access (FR-010).
- Generated `.claude/settings.json` is valid JSON with the permission rules in
  data-model.md (FR-007).
