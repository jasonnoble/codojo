import { describe, it, expect } from '@jest/globals';
import { exitCodeForError } from '../exitCode.js';

describe('exitCodeForError (US3, FR-011 / FR-012)', () => {
  it('returns 130 for an ExitPromptError (Ctrl-C at the prompt)', () => {
    const err = new Error('User force closed the prompt');
    err.name = 'ExitPromptError';
    expect(exitCodeForError(err)).toBe(130);
  });

  it('returns 1 for any other error or non-error value', () => {
    expect(exitCodeForError(new Error('boom'))).toBe(1);
    expect(exitCodeForError('a string')).toBe(1);
    expect(exitCodeForError(undefined)).toBe(1);
  });
});
