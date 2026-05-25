/**
 * Contents of `<workspace>/.claude/settings.json`.
 *
 * Enforces the codojo permission boundaries:
 *   - `notes/`   and `projects/` are READ-ONLY for the mentor (deny edits).
 *   - `mentor_notes/`, `profile.md`, `goals.md` are READ/WRITE.
 *   - Common secret locations and parent-directory traversal are denied.
 *
 * Caveat: the workspace usually lives inside the user's home directory, so we
 * cannot blanket-deny `~/**` without locking the workspace out of itself. These
 * rules constrain Claude's own file tools; for OS-level isolation of arbitrary
 * Bash subprocesses, enable `sandbox.filesystem`. See README "Permission model".
 */
export function settingsJson(): string {
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
      ],
      deny: [
        'Edit(notes/**)',
        'Write(notes/**)',
        'MultiEdit(notes/**)',
        'Edit(projects/**)',
        'Write(projects/**)',
        'MultiEdit(projects/**)',
        'Read(../**)',
        'Read(~/.ssh/**)',
        'Read(~/.aws/**)',
        'Read(~/.gnupg/**)',
        'Read(**/.env)',
      ],
    },
  };

  return JSON.stringify(settings, null, 2) + '\n';
}
