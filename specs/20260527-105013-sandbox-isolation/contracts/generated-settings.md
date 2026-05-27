# Contract: generated `.claude/settings.json`

The artifact emitted by `settingsJson(opts)`. JSON; keys emitted in the order below (stable under `JSON.stringify(_, null, 2)`).

## Default (`allowGhCli` false)

```json
{
  "permissions": {
    "defaultMode": "default",
    "allow": [
      "Edit(mentor_notes/**)",
      "Write(mentor_notes/**)",
      "MultiEdit(mentor_notes/**)",
      "Edit(profile.md)",
      "Write(profile.md)",
      "Edit(goals.md)",
      "Write(goals.md)"
    ],
    "deny": [
      "Edit(notes/**)",
      "Write(notes/**)",
      "MultiEdit(notes/**)",
      "Edit(projects/**)",
      "Write(projects/**)",
      "MultiEdit(projects/**)",
      "Read(~/.ssh/**)",
      "Read(~/.aws/**)",
      "Read(~/.gnupg/**)",
      "Read(**/.env)"
    ]
  },
  "sandbox": {
    "enabled": true,
    "allowUnsandboxedCommands": false,
    "filesystem": {
      "allowRead": ["."],
      "denyRead": ["/"],
      "denyWrite": ["."],
      "allowWrite": ["./mentor_notes", "./profile.md", "./goals.md", "/tmp"]
    }
  }
}
```

## `--allow-gh-cli` (`allowGhCli` true)

Same as above, with two additions:

- `permissions.allow` gains, after `Write(goals.md)`:

```json
"Bash(gh pr view:*)",
"Bash(gh pr list:*)",
"Bash(gh pr diff:*)",
"Bash(gh pr checks:*)",
"Bash(gh issue view:*)",
"Bash(gh issue list:*)",
"Bash(gh repo view:*)",
"Bash(gh run view:*)",
"Bash(gh run list:*)",
"Bash(gh search:*)",
"Bash(gh status:*)"
```

- `sandbox` gains, after `allowUnsandboxedCommands`:

```json
"excludedCommands": ["gh", "gh *"]
```

## Invariants (assertable)

1. Valid JSON, ends with a trailing newline.
2. `deny` never contains `Read(../**)`.
3. `sandbox.enabled === true` && `allowUnsandboxedCommands === false`.
4. `sandbox.filesystem` = `{ allowRead:["."], denyRead:["/"], denyWrite:["."], allowWrite:["./mentor_notes","./profile.md","./goals.md","/tmp"] }`. `denyWrite` is absolute (research R3), so the `allowWrite` entries are inert for shell writes; the mentor writes those files via its Edit/Write tools.
5. Default: no `Bash(gh` rule; no `sandbox.excludedCommands` key.
6. gh variant: exactly the 11 read-only rules above (no `gh auth` rule); `excludedCommands === ["gh","gh *"]`. Both entries are retained **pending research R4 sub-test 5**: `"gh *"` (glob) is expected to match `gh <subcommand>` but not bare `gh`, while `"gh"` covers the bare invocation — so both are needed. If the spike proves `"gh"` alone matches subcommands, drop `"gh *"` here and in `data-model.md`.
7. `notes/`+`projects/` Edit/Write/MultiEdit denied; `mentor_notes/`+`profile.md`+`goals.md` allowed (unchanged).

## Divergence from the manually-edited `codojo-training` file

- Adds `denyWrite: ["."]` (now also in the live `codojo-training` file). Per the R3 spike, `denyWrite` is absolute and `allowWrite` does NOT re-permit within it, so **all shell writes in the workspace are denied**; the `allowWrite` entries are retained to document intent (and may apply on Linux). The mentor writes `mentor_notes/`/`profile.md`/`goals.md` via its Edit/Write tools, and hands write-needing shell commands to the learner (FR-013).
- `Bash(gh auth status:*)` is omitted — see Session 2026-05-27 clarification.
