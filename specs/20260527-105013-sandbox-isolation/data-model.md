# Phase 1 Data Model

This feature is config-generation; the "entities" are the option object that drives generation and the shape of the generated settings.

## Entity: `WorkspaceOptions`

Location: `src/types/index.ts`. The choices made at `init` time that influence generated files.

| Field | Type | Required | Default | Notes |
|-------|------|----------|---------|-------|
| `allowGhCli` | `boolean` | optional | `false` | When true, generated settings gain read-only `gh` rules + `excludedCommands`. |

```ts
export interface WorkspaceOptions {
  allowGhCli?: boolean;
}

export const DEFAULT_WORKSPACE_OPTIONS: Required<WorkspaceOptions> = {
  allowGhCli: false,
};
```

- The type cannot carry a runtime default; `DEFAULT_WORKSPACE_OPTIONS` colocates the `false` default in `src/types`. Consumers apply it via destructuring default (`settingsJson({ allowGhCli = false } = {})`) or by spreading the const.
- Designed to grow: future per-`init` choices add fields here without changing the threading.

**Threading**: `cli.ts` (parse argv) → `runInit(argv)` builds `WorkspaceOptions` → `workspaceFiles(opts)` → `settingsJson(opts)`.

## Entity: Generated `.claude/settings.json`

> **Authoritative source:** `contracts/generated-settings.md` is the single source of truth for the exact JSON shape and the assertable invariants. The description below is a **summary** for modeling — if the two ever differ, the contract wins; make shape changes in the contract first.

Produced by `settingsJson(opts)`. Two variants.

### Common (both variants)

- `permissions.defaultMode`: `"default"`.
- `permissions.allow`: `Edit/Write/MultiEdit(mentor_notes/**)`, `Edit/Write(profile.md)`, `Edit/Write(goals.md)` — unchanged (FR-006).
- `permissions.deny`: `Edit/Write/MultiEdit(notes/**)`, `Edit/Write/MultiEdit(projects/**)`, `Read(~/.ssh/**)`, `Read(~/.aws/**)`, `Read(~/.gnupg/**)`, `Read(**/.env)`. **`Read(../**)` removed** (FR-001).
- `sandbox`:
  - `enabled: true`
  - `allowUnsandboxedCommands: false` (FR-003, strict)
  - `filesystem.allowRead: ["."]`, `filesystem.denyRead: ["/"]` (FR-004)
  - `filesystem.denyWrite: ["."]` + `filesystem.allowWrite: ["./mentor_notes", "./profile.md", "./goals.md", "/tmp"]` (FR-005, per research R3 — `denyWrite` is absolute: ALL shell writes denied; `allowWrite` inert for shell; the mentor writes those files via its Edit/Write tools, FR-013)

### Default variant (`allowGhCli: false`)

- No `Bash(gh …)` rules in `permissions.allow`.
- No `sandbox.excludedCommands` key → `gh` blocked entirely (FR-007).

### `--allow-gh-cli` variant (`allowGhCli: true`)

- `permissions.allow` additionally contains the 11-rule closed read-only set (FR-009, R5):
  `Bash(gh pr view:*)`, `Bash(gh pr list:*)`, `Bash(gh pr diff:*)`, `Bash(gh pr checks:*)`, `Bash(gh issue view:*)`, `Bash(gh issue list:*)`, `Bash(gh repo view:*)`, `Bash(gh run view:*)`, `Bash(gh run list:*)`, `Bash(gh search:*)`, `Bash(gh status:*)`.
  (No `gh auth` rule — clarification.)
- `sandbox.excludedCommands: ["gh", "gh *"]` (FR-010, R6) — both entries pending the R4 redundancy sub-test (`"gh *"` expected to cover `gh <subcommand>`, `"gh"` the bare invocation; drop one if proven redundant).

**Key-order note**: `JSON.stringify(obj, null, 2)` preserves insertion order; declare keys in the emit order shown so output is stable and reviewable.

## FR → Test matrix (TDD, Constitution IX)

| FR | Test (written first) |
|----|----------------------|
| FR-001 | `settingsJson()` deny list does NOT contain `Read(../**)`. |
| FR-002/003/004 | default `settingsJson()` has `sandbox.enabled===true`, `allowUnsandboxedCommands===false`, `filesystem.denyRead===["/"]`, `allowRead===["."]`. |
| FR-005 | default `settingsJson()` `filesystem.denyWrite===["."]` and `allowWrite===["./mentor_notes","./profile.md","./goals.md","/tmp"]`. (Spike confirmed: shell writes denied throughout; mentor writes via Edit/Write tools.) |
| FR-006 | deny contains notes/projects rules; allow contains mentor_notes/profile/goals. |
| FR-007 | default `settingsJson()` has no `Bash(gh` allow rule and no `sandbox.excludedCommands`. |
| FR-008 | `runInit` parses `--allow-gh-cli` before/after dir; flag not treated as dir; absent → default. |
| FR-009 | `settingsJson({allowGhCli:true})` allow contains all 11 read-only rules and NOT `Bash(gh auth status:*)`. |
| FR-010 | `settingsJson({allowGhCli:true})` `sandbox.excludedCommands===["gh","gh *"]`. + **manual spike (R4)** for matching semantics. |
| FR-011 | In `src/__tests__/readme.test.ts`: `readFileSync` the repo-root `README.md` and assert it contains `sandbox` and `--allow-gh-cli`, and does NOT describe `Read(../**)`/parent-directory traversal as an isolation mechanism (also covers SC-006). |
| FR-012 | other `workspaceFiles()` entries (besides settings.json + CLAUDE.md) unchanged. |
| FR-013 | In `templates.test.ts` (folded with the existing `rootClaudeMd()` tests — no separate `claude.test.ts`): assert `rootClaudeMd()` output contains (a) the instruction to use Edit/Write tools for `mentor_notes/`/`profile.md`/`goals.md`, and (b) the instruction to hand write-needing shell commands to the learner. |
