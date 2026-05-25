import os from 'node:os';
import path from 'node:path';
import { describe, it, expect } from '@jest/globals';
import { workspaceFiles } from '../templates/index.js';
import { expandHome } from '../utils.js';

describe('workspaceFiles', () => {
  const files = workspaceFiles();
  const paths = files.map((f) => f.path);

  it('scaffolds the expected core files', () => {
    expect(paths).toEqual(
      expect.arrayContaining([
        'CLAUDE.md',
        '.claude/settings.json',
        'profile.md',
        'goals.md',
        'notes/CLAUDE.md',
        'projects/CLAUDE.md',
        'mentor_notes/sessions/CLAUDE.md',
        'mentor_notes/topics/CLAUDE.md',
        'mentor_notes/quiz_history.md',
        'mentor_notes/concept_map.md',
      ]),
    );
  });

  it('gives every file non-empty content', () => {
    for (const file of files) {
      expect(file.content.length).toBeGreaterThan(0);
    }
  });

  it('ships profile.md as not-yet-onboarded', () => {
    const profile = files.find((f) => f.path === 'profile.md');
    expect(profile?.content).toContain('onboarded: false');
  });

  it('writes valid JSON for .claude/settings.json', () => {
    const settings = files.find((f) => f.path === '.claude/settings.json');
    expect(() => JSON.parse(settings!.content)).not.toThrow();
    const parsed = JSON.parse(settings!.content);
    expect(parsed.permissions.deny).toContain('Write(notes/**)');
    expect(parsed.permissions.allow).toContain('Write(mentor_notes/**)');
  });
});

describe('expandHome', () => {
  it('expands a bare tilde to the home directory', () => {
    expect(expandHome('~')).toBe(os.homedir());
  });

  it('expands ~/ prefixes', () => {
    expect(expandHome('~/workspace/codojo')).toBe(
      path.join(os.homedir(), 'workspace/codojo'),
    );
  });

  it('resolves a relative path against the cwd', () => {
    expect(expandHome('foo')).toBe(path.resolve('foo'));
  });
});
