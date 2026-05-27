/**
 * Contents of `<workspace>/.claude/settings.json`.
 *
 * Two layers of confinement:
 *   - Permission rules govern Claude's own file tools: `notes/` and `projects/`
 *     are read-only; `mentor_notes/`, `profile.md`, `goals.md` are writable;
 *     secret locations are denied.
 *   - An OS-level `sandbox` block confines Bash subprocesses to the workspace —
 *     reads denied outside it (`denyRead: ["/"]` + `allowRead: ["."]`) and ALL
 *     shell writes denied (`denyWrite: ["."]`; `allowWrite` cannot re-permit
 *     within it). Claude Code maps this single declarative block to Seatbelt
 *     (macOS) / bubblewrap (Linux/WSL2).
 *
 * With `allowGhCli`, the GitHub CLI is allowed to run OUTSIDE the sandbox
 * (`excludedCommands`, because `gh` fails TLS under Seatbelt) and a closed set of
 * read-only `gh` subcommands is auto-approved. `gh auth` is deliberately excluded
 * to avoid `--show-token` leaking the token. By default `gh` is blocked entirely.
 *
 * The sandbox is the real boundary; permission rules only bind the agent's own
 * tools, not the shell subprocesses it spawns. See README "Permission model".
 */
import type { WorkspaceOptions } from '../types/index.js';

/** Read-only `gh` subcommands auto-approved when `--allow-gh-cli` is set (FR-009). */
const GH_READONLY_RULES = [
  'Bash(gh pr view:*)',
  'Bash(gh pr list:*)',
  'Bash(gh pr diff:*)',
  'Bash(gh pr checks:*)',
  'Bash(gh issue view:*)',
  'Bash(gh issue list:*)',
  'Bash(gh repo view:*)',
  'Bash(gh run view:*)',
  'Bash(gh run list:*)',
  'Bash(gh search:*)',
  'Bash(gh status:*)',
];

export function settingsJson({
  allowGhCli = false,
}: WorkspaceOptions = {}): string {
  const settings = {
    permissions: {
      defaultMode: 'default',
      allow: [
        'Edit(mentor_notes/**)',
        'Write(mentor_notes/**)',
        'MultiEdit(mentor_notes/**)',
        'Edit(profile.md)',
        'Write(profile.md)',
        'Edit(goals.md)',
        'Write(goals.md)',
        ...(allowGhCli ? GH_READONLY_RULES : []),
      ],
      deny: [
        'Edit(notes/**)',
        'Write(notes/**)',
        'MultiEdit(notes/**)',
        'Edit(projects/**)',
        'Write(projects/**)',
        'MultiEdit(projects/**)',
        'Read(~/.ssh/**)',
        'Read(~/.aws/**)',
        'Read(~/.gnupg/**)',
        'Read(**/.env)',
      ],
    },
    sandbox: {
      enabled: true,
      allowUnsandboxedCommands: false,
      // Only present when gh is opted in; keeps the key after allowUnsandboxedCommands.
      ...(allowGhCli ? { excludedCommands: ['gh *'] } : {}),
      filesystem: {
        allowRead: ['.'],
        denyRead: ['/'],
        denyWrite: ['.'],
        allowWrite: ['./mentor_notes', './profile.md', './goals.md', '/tmp'],
      },
    },
  };

  return JSON.stringify(settings, null, 2) + '\n';
}
