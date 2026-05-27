import { describe, it, expect } from '@jest/globals';
import { readFileSync } from 'node:fs';

// Resolve the repo-root README relative to this test file (ESM-safe).
const readme = readFileSync(
  new URL('../../README.md', import.meta.url),
  'utf8',
);

describe('README "Permission model" — accurate sandbox docs (FR-011/SC-006)', () => {
  it('describes the sandbox as the isolation mechanism', () => {
    expect(readme).toMatch(/sandbox/i);
  });

  it('documents the --allow-gh-cli flag', () => {
    expect(readme).toContain('--allow-gh-cli');
  });

  it('no longer presents the parent-traversal rule as isolation', () => {
    expect(readme).not.toContain('Read(../**)');
  });
});
