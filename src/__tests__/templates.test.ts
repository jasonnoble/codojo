import { describe, it, expect } from '@jest/globals';
import { settingsJson } from '../templates/settings.js';
import { rootClaudeMd } from '../templates/claude.js';
import { profileMd, goalsMd } from '../templates/profile.js';
import { workspaceFiles } from '../templates/index.js';

const parsed = JSON.parse(settingsJson()) as {
  permissions: { allow: string[]; deny: string[] };
  sandbox?: {
    enabled?: boolean;
    allowUnsandboxedCommands?: boolean;
    excludedCommands?: string[];
    filesystem?: {
      allowRead?: string[];
      denyRead?: string[];
      denyWrite?: string[];
      allowWrite?: string[];
    };
  };
};

describe('settingsJson — permission boundaries (FR-007)', () => {

  it('is valid JSON with a permissions block', () => {
    expect(parsed.permissions).toBeDefined();
    expect(Array.isArray(parsed.permissions.allow)).toBe(true);
    expect(Array.isArray(parsed.permissions.deny)).toBe(true);
  });

  it('denies writes to notes/ and projects/ (read-only to the mentor)', () => {
    for (const rule of [
      'Edit(notes/**)',
      'Write(notes/**)',
      'Edit(projects/**)',
      'Write(projects/**)',
    ]) {
      expect(parsed.permissions.deny).toContain(rule);
    }
  });

  it('allows writes to mentor_notes/, profile.md, goals.md', () => {
    for (const rule of [
      'Write(mentor_notes/**)',
      'Write(profile.md)',
      'Write(goals.md)',
    ]) {
      expect(parsed.permissions.allow).toContain(rule);
    }
  });

  it('denies sensitive paths but NOT the dead parent-traversal rule (FR-001)', () => {
    for (const rule of [
      'Read(~/.ssh/**)',
      'Read(~/.aws/**)',
      'Read(~/.gnupg/**)',
      'Read(**/.env)',
    ]) {
      expect(parsed.permissions.deny).toContain(rule);
    }
    expect(parsed.permissions.deny).not.toContain('Read(../**)');
  });
});

describe('settingsJson — OS-level sandbox, default workspace (FR-002..FR-005, FR-007)', () => {
  const s = parsed.sandbox;

  it('enables a strict sandbox (FR-002/FR-003)', () => {
    expect(s?.enabled).toBe(true);
    expect(s?.allowUnsandboxedCommands).toBe(false);
  });

  it('confines reads to the workspace (FR-004)', () => {
    expect(s?.filesystem?.allowRead).toEqual(['.']);
    expect(s?.filesystem?.denyRead).toEqual(['/']);
  });

  it('denies shell writes workspace-wide via denyWrite (FR-005)', () => {
    expect(s?.filesystem?.denyWrite).toEqual(['.']);
    expect(s?.filesystem?.allowWrite).toEqual([
      './mentor_notes',
      './profile.md',
      './goals.md',
      '/tmp',
    ]);
  });

  it('blocks gh by default — no gh allow rules, no excludedCommands (FR-007)', () => {
    expect(parsed.permissions.allow.some((r) => r.startsWith('Bash(gh'))).toBe(
      false,
    );
    expect(s?.excludedCommands).toBeUndefined();
  });
});

describe('settingsJson({ allowGhCli: true }) — opt-in gh CLI (FR-009/FR-010)', () => {
  const gh = JSON.parse(settingsJson({ allowGhCli: true })) as typeof parsed;

  it('adds exactly the 11 read-only gh rules and NOT gh auth status (FR-009)', () => {
    const ghRules = gh.permissions.allow.filter((r) => r.startsWith('Bash(gh'));
    expect(ghRules).toEqual([
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
    ]);
    expect(gh.permissions.allow).not.toContain('Bash(gh auth status:*)');
  });

  it('excludes gh from the sandbox so it runs outside (FR-010)', () => {
    expect(gh.sandbox?.excludedCommands).toEqual(['gh *']);
  });
});

describe('rootClaudeMd — confirm-before-edit behavioral rule (FR-007)', () => {
  const md = rootClaudeMd();

  it('names profile.md and goals.md and requires confirmation before editing', () => {
    expect(md).toContain('profile.md');
    expect(md).toContain('goals.md');
    expect(md).toMatch(
      /confirm before changing|edit only with explicit confirmation/i,
    );
  });

  it('tells the mentor to use Edit/Write tools and hand shell writes to the learner (FR-013)', () => {
    expect(md).toContain('Edit/Write tools');
    expect(md).toContain('give the learner');
  });
});

describe('profileMd / goalsMd — onboarding state and no baked-in identity (FR-008, FR-010)', () => {
  it('ships profile.md as not-yet-onboarded (FR-008)', () => {
    expect(profileMd()).toContain('onboarded: false');
  });

  // FR-010 (testable half): the scaffold must carry no learner identity. The
  // "no network access" property remains a manual review (see tasks T020).
  it('ships profile.md with a blank name field and placeholders, no identity', () => {
    const md = profileMd();
    // front-matter `name:` present but empty (nothing after the colon)
    expect(md).toMatch(/^name:\s*$/m);
    // placeholder, not a collected value
    expect(md).toContain('_Not yet collected._');
  });

  it('ships goals.md with no collected goals', () => {
    expect(goalsMd()).toContain('_Not yet collected.');
  });
});

describe('workspaceFiles — unrelated files unchanged by this feature (FR-012)', () => {
  const files = Object.fromEntries(
    workspaceFiles().map((f) => [f.path, f.content]),
  );

  it('still emits every non-settings/non-CLAUDE workspace file', () => {
    for (const p of [
      'profile.md',
      'goals.md',
      'notes/CLAUDE.md',
      'projects/CLAUDE.md',
      'mentor_notes/sessions/CLAUDE.md',
      'mentor_notes/topics/CLAUDE.md',
      'mentor_notes/quiz_history.md',
      'mentor_notes/concept_map.md',
    ]) {
      expect(files[p]).toBeDefined();
    }
  });

  it('leaves profile.md and goals.md content untouched', () => {
    expect(files['profile.md']).toBe(profileMd());
    expect(files['goals.md']).toBe(goalsMd());
  });
});
