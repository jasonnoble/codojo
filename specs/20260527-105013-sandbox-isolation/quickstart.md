# Quickstart: verifying sandbox isolation & opt-in gh CLI

## Build & unit tests (what CI guards)

```bash
npm run build      # tsc strict, zero errors
npm test           # Jest; settingsJson() default + {allowGhCli:true} cases, flag parsing
```

Unit tests assert the *generated configuration* (deterministic). They do NOT assert OS enforcement — that is Claude Code's behavior (SC-007), verified manually below.

## Generate workspaces

```bash
node dist/cli.js init /tmp/cdj-default          # default (gh blocked)
node dist/cli.js init /tmp/cdj-gh --allow-gh-cli # gh enabled
node dist/cli.js init --allow-gh-cli /tmp/cdj-gh2 # flag-before-dir also works
```

Confirm each `.claude/settings.json` matches `contracts/generated-settings.md`.

## Manual enforcement check (macOS, once) — SC-001/SC-002/SC-003

In a `claude` session started **inside** `/tmp/cdj-default` (banner: "your bash commands will be sandboxed"), ask the *mentor* (not `!`):

- "Run `cat ~/.ssh/known_hosts`" → expect `Operation not permitted` (read blocked outside workspace).
- "Run `touch ~/escape`" → expect `Operation not permitted` (write blocked outside workspace).
- "Run `touch mentor_notes/x`" / `touch notes/x` / `touch ./root-x` / `touch /tmp/x` (shell) → all expect `Operation not permitted` (`denyWrite:["."]` is absolute; shell writes denied workspace-wide — confirmed 2026-05-27).
- Ask the mentor to create a note in `mentor_notes/` **via its Write tool** → expect success (permission rules, not the sandbox); FR-013 requires it to use the tool, not shell.
- "Run `gh pr list`" → expect blocked / not auto-run (gh disabled in default).

## FR-010 spike (gh exception) — run in `/tmp/cdj-gh`, REQUIRED before relying on the exception

Ask the mentor to run each (see research.md R4 for full detail):

1. `gh pr list` → runs (reaches GitHub) → confirms gh runs outside the sandbox.
2. PATH-shim: create `./gh` printing a marker + `cat /etc/hosts`; run `PATH="$PWD:$PATH" gh`. Record: unsandboxed? auto-approved or prompted?
3. Compound: `gh pr view 1 && cat /etc/hosts`. Record: whole line unsandboxed? leading `gh` auto-approves the compound?
4. `gh secret list` / `gh api /user` → expect a permission prompt (not auto-approved).
5. **`excludedCommands` redundancy** (feeds research R6): with only `excludedCommands:["gh"]`, run bare `gh` and `gh pr list`; then with only `["gh *"]`, run both again. Record which invocations each entry takes outside the sandbox — i.e. whether `"gh"` alone covers `gh <subcommand>`, or `"gh *"` is required for subcommands (and whether `"gh *"` matches bare `gh`).

**Exit criteria (classify every case explicitly — no implicit passes):**
- **PASS** — the case is *blocked outright*, OR it runs only after a **human-visible permission prompt that shows the actual command** being executed.
- **REDESIGN** — the case runs **outside the sandbox with no prompt** (i.e. auto-approved). This includes the compound case if a leading `gh pr view` causes the *entire* `gh … && <other>` to be auto-approved and run unsandboxed.

**Is a prompt a sufficient backstop?** For the **PATH-shim** (step 2) and **compound-command** (step 3) cases, a human-visible prompt that surfaces the real command **is** accepted as sufficient — `--allow-gh-cli` is opt-in, so the user has accepted this residual surface and the prompt lets them refuse a suspicious `gh`. We do **not** require these cases to be blocked outright. But a *silent* (auto-approved) unsandboxed run is a **REDESIGN**, not a pass. Record every case's classification; any REDESIGN result means FR-010 / US2 are revisited before shipping.
