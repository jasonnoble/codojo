import { describe, it, expect } from '@jest/globals';
import { settingsJson } from '../templates/settings.js';
import { rootClaudeMd } from '../templates/claude.js';
import { profileMd, goalsMd } from '../templates/profile.js';

describe('settingsJson — permission boundaries (FR-007)', () => {
  const parsed = JSON.parse(settingsJson()) as {
    permissions: { allow: string[]; deny: string[] };
  };

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

  it('denies sensitive paths and parent-directory traversal', () => {
    for (const rule of ['Read(../**)', 'Read(~/.ssh/**)', 'Read(**/.env)']) {
      expect(parsed.permissions.deny).toContain(rule);
    }
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
