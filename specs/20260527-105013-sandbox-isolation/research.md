# Phase 0 Research: Sandbox-Based Workspace Isolation & Opt-In GitHub CLI Access

Source: Claude Code docs — `sandboxing` and `settings` (sandbox settings) — fetched 2026-05-27, plus empirical results from the `codojo-training` validation workspace.

## R1 — Cross-platform sandbox abstraction (FR-002)

**Decision**: codojo emits a single *declarative* Claude Code `sandbox` block in `settings.json`. It does NOT author Seatbelt profiles or bubblewrap arguments.

**Rationale**: Claude Code translates the declarative block into OS-level enforcement — Seatbelt on macOS, bubblewrap on Linux/WSL2. So "the same generated configuration works cross-platform" is true *because* the abstraction lives in Claude Code, not codojo. Verification is macOS-only; Linux/WSL2 enforcement is out of scope.

**Alternatives considered**: Emitting per-platform config — rejected: codojo has no access to the host at generation time and would duplicate Claude Code's job. **Residual risk**: depends on Claude Code's cross-platform abstraction remaining stable (documented in spec Assumptions).

## R2 — Read confinement pattern (FR-004)

**Decision**: `filesystem.denyRead: ["/"]` + `filesystem.allowRead: ["."]`.

**Rationale**: Docs confirm `allowRead` **takes precedence over** `denyRead`, and show this exact "deny root, re-allow project" pattern. `.` resolves to the workspace root for project-scope settings. Empirically verified in `codojo-training`: the mentor's Bash tool got `Operation not permitted` reading `~/workspace/job_hunt_2026/...`, and could read inside the workspace.

**Consequence (accepted)**: denying read of the entire filesystem also denies reading language-runtime files (e.g. under `~/.local/share/mise`), so runtimes can't execute *inside the sandbox*. Accepted per the "notes-only mentor" assumption.

## R3 — Write boundary (FR-005) — fine-grained via `denyWrite`

**Original target — the fine-grained re-allow interpretation, disproven by the 2026-05-27 spike (final decision below)**: enforce the fine-grained write boundary at the shell level so it matches FR-005 literally:
`filesystem.denyWrite: ["."]` + `filesystem.allowWrite: ["./mentor_notes", "./profile.md", "./goals.md", "/tmp"]`.
This makes the *only* shell-writable paths the mentor's notes area, profile, goals, and `/tmp` — so `notes/` and `projects/` are read-only to shell commands too, aligning the sandbox boundary with the tool-level deny rules (strengthens Constitution III/VIII at the shell level). `/tmp` is outside `.`, allowed regardless; the three workspace entries are re-allows *within* the `denyWrite:["."]` region.

**Why this over the simpler `allowWrite:["/tmp"]`**: by default the *entire* workspace (cwd) is shell-writable, so without a `denyWrite` the mentor could `echo > notes/x` via Bash even though its Edit tool cannot. `denyWrite:["."]` closes that gap and makes FR-005's wording accurate (no spec weakening needed).

**⚠ Unverified precedence — must spike (see Quickstart)**: the docs explicitly state `allowRead` re-allows within a `denyRead` region, but describe `allowWrite` only as "additional paths" and do **not** state allowWrite-over-denyWrite precedence. So it is plausible (symmetric to reads) but **unconfirmed** that `allowWrite` carves back inside `denyWrite:["."]`. If `denyWrite` wins, `mentor_notes/`/`profile.md`/`goals.md` become **unwritable** and the mentor breaks.

**Spike (≈2 min, in a generated workspace)**: set this filesystem block, restart `claude`, ask the mentor (not `!`) to run `touch mentor_notes/x` (want: success), `touch notes/x` and `touch ./root-x` (want: `Operation not permitted`), `touch /tmp/x` (want: success).

**Spike result (2026-05-27 — re-allow disproven)**: the mentor's shell `touch mentor_notes/x` was **blocked** despite `mentor_notes` being in `allowWrite`; `notes/x`, `./root-x`, `/tmp/x`, and `$TMPDIR/...` were all blocked too. So `allowWrite` does **NOT** re-allow within a `denyWrite` region — `denyWrite` is absolute; the read-pattern symmetry does not hold for writes. (`/tmp` likely also fails via the macOS `/tmp`→`/private/tmp` symlink.) The mentor's **Write/Edit tools still wrote `mentor_notes/`/`profile.md`/`goals.md`** (permission system, not sandbox), so note-taking is unaffected by shell-write denial.

**Final decision — Option B (chosen 2026-05-27)**: keep `denyWrite:["."]` + `allowWrite:["./mentor_notes","./profile.md","./goals.md","/tmp"]`. Net effect: **all shell writes in the workspace are denied** (the `allowWrite` entries are inert for shell under the absolute `denyWrite`; retained to document intent and possibly apply on Linux). The mentor mutates `mentor_notes/`/`profile.md`/`goals.md` via its **Edit/Write tools** (permission allow rules — verified working), and surfaces any write-needing shell command to the learner to run. This requires a generated-`CLAUDE.md` instruction (new **FR-013**) telling the mentor to do exactly that.

## R4 — `excludedCommands` matching semantics (FR-010) — **SPIKE, undocumented**

**Finding**: The matching semantics of `sandbox.excludedCommands` are **NOT SPECIFIED IN DOCS**. The reference gives only the example `["docker *"]` ("commands that should run outside of the sandbox"). Undocumented: literal-token vs glob vs resolved-binary matching; compound/chained command handling (`gh x && curl y`); whether `PATH` resolution affects matching.

**Decision**: Treat this as a required empirical spike **before** the `--allow-gh-cli` exception is relied upon. Until the spike passes, the gh exception is provisional.

**Spike procedure** (run in a `--allow-gh-cli` workspace, asking the *mentor* to run each — not via `!`):
1. **Happy path**: `gh pr list` → runs (network reaches GitHub), confirming `gh` truly runs outside the sandbox.
2. **PATH-shim escape**: create `<workspace>/gh` containing `echo PWNED; cat /etc/hosts`, then have the mentor run `PATH="$PWD:$PATH" gh` (and plain `gh`). Observe: does the shim run *unsandboxed*? Is it auto-approved or does it prompt?
3. **Compound command**: `gh pr view 1 && cat /etc/hosts` — does the whole command run outside the sandbox? Does the leading `gh pr view` satisfy the auto-approve rule for the whole compound?
4. **arg0 vs resolved**: `/opt/homebrew/bin/gh pr list` (absolute path) — still matched by `excludedCommands:["gh","gh *"]`?
5. **`gh` vs `gh *` redundancy**: with only `excludedCommands:["gh"]`, run bare `gh` and `gh pr list`; then with only `["gh *"]`, run both. Determine which entry is needed for `gh <subcommand>` vs bare `gh`. (Feeds R6.)

**Expected mitigation (to confirm, not assume)**: with `allowUnsandboxedCommands:false` (strict) and a *closed* allow-list (no bare `gh` rule), a shimmed/bare `gh` runs unsandboxed only if matched, but is **not auto-approved**, so it still hits a permission prompt — the human is the backstop.

**Exit criteria**: if the spike shows a path to unattended arbitrary code execution outside the sandbox that the permission prompt does not catch, the `--allow-gh-cli` exception is redesigned or dropped (FR-010 / US2 revisited). Otherwise, document the confirmed behavior + residual risk and proceed.

**Spike results (2026-05-27 — PASS, no redesign)**:
1. **Happy path**: `gh status` ran as the real authenticated CLI (exit 0) → `gh` executes outside the sandbox. ✓
2. **PATH-shim** (`PATH=/tmp/ghshim:$PATH gh`): **prompted** (classifier flagged the `$PATH` expansion) and did not escape (exit 127 / `Operation not permitted`; no `~/SANDBOX_ESCAPED`). PASS.
3. **Compound** (`gh pr view 1 && cat /etc/hosts`): **prompted**, and after approval the whole line ran outside the sandbox (`cat /etc/hosts` succeeded). PASS by the exit criteria (it prompted, not auto-approved). **Residual risk**: `gh *` matches the *entire* `gh … && …` line, so a gh-led compound runs fully unsandboxed once approved; the `&&` keeps it from matching the read-only allow rules, so it always prompts — the prompt is the only backstop.
4. **arg0 vs resolved**: `$(which gh) pr list` (absolute path) was **not** matched by `excludedCommands` → ran sandboxed → failed (127). Matching is on the **literal leading token**, not the resolved binary; absolute-path invocations cannot escape.

**Conclusion**: every escape vector is gated by a permission prompt; nothing ran unsandboxed unprompted. Acceptable as an opt-in with the documented compound residual risk. No REDESIGN.

## R5 — Read-only `gh` allow-list (FR-009)

**Decision**: Closed allow-list of 11 prefix rules (`gh auth` excluded per the Session 2026-05-27 clarification):
`Bash(gh pr view:*)`, `Bash(gh pr list:*)`, `Bash(gh pr diff:*)`, `Bash(gh pr checks:*)`, `Bash(gh issue view:*)`, `Bash(gh issue list:*)`, `Bash(gh repo view:*)`, `Bash(gh run view:*)`, `Bash(gh run list:*)`, `Bash(gh search:*)`, `Bash(gh status:*)`.

**Rationale**: Closed list fails safe — any unlisted/new `gh` subcommand prompts rather than being silently allowed. `gh auth` omitted to avoid `--show-token` exposure.

**Maintenance story**: new `gh` subcommands require an explicit addition; default is "prompt." Owned here (no runtime registry).

## R6 — gh exception runs outside the sandbox (FR-010 mechanism)

**Decision**: `excludedCommands: ["gh *"]`, included **only** when `--allow-gh-cli` is set.

**Rationale**: `gh` is Go-based and fails TLS verification under Seatbelt (documented), so it cannot complete requests inside the sandbox; the docs prescribe `excludedCommands` for exactly this class (`gh`, `gcloud`, `terraform`). Works under strict mode. When the flag is absent, the key is omitted entirely → `gh` is simply blocked by the sandbox.

**`gh` vs `gh *` redundancy (resolved 2026-05-27, R4 sub-test 5)**: `["gh *"]` alone matches **both** `gh <subcommand>` and bare `gh` (Round B allowed both); `["gh"]` matched only the bare word and failed `gh <subcommand>` (Round A). So `"gh"` is **redundant** — the generated config uses `excludedCommands: ["gh *"]` only.

## R7 — Flag parsing (FR-008)

**Decision**: In `runInit(argv)`, compute `allowGhCli = argv.includes('--allow-gh-cli')`; the workspace dir is the first arg **not** starting with `--`. Pass `{ allowGhCli }` (a `WorkspaceOptions`) down.

**Rationale**: Current `runInit` uses `argv[0]` blindly, which would mistake a leading `--allow-gh-cli` for the directory. No arg-parser dependency needed for one boolean flag + one positional.

**Alternatives considered**: Adding `commander`/`yargs` — rejected (Constitution: minimal deps).

## R8 — TDD ordering (Constitution IX)

**Decision**: Update `templates.test.ts` and `invocation.test.ts` first (red), then implement. The existing `templates.test.ts:39` assertion for `Read(../**)` must be rewritten (it will otherwise fail). Tests assert the *generated configuration* (deterministic) — the OS *enforcement* is Claude Code's behavior, verified manually (SC-007), not in CI.
