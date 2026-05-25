import path from 'node:path';
import fs from 'fs-extra';
import {
  describe,
  it,
  expect,
  beforeEach,
  afterEach,
} from '@jest/globals';
import { runInit } from '../commands/init.js';
import {
  makeTempDir,
  removeTempDir,
  captureConsole,
  type ConsoleCapture,
} from './helpers.js';

describe('runInit — never clobber existing work (US2)', () => {
  let tmp: string;
  let con: ConsoleCapture;

  beforeEach(async () => {
    tmp = await makeTempDir();
    con = captureConsole();
    process.exitCode = undefined;
  });

  afterEach(async () => {
    con.restore();
    process.exitCode = undefined;
    await removeTempDir(tmp);
  });

  it('aborts on a non-empty directory, writes nothing, exits non-zero (FR-004)', async () => {
    const ws = path.join(tmp, 'ws');
    await fs.ensureDir(ws);
    await fs.writeFile(path.join(ws, 'existing.txt'), 'keep me', 'utf8');

    await runInit([ws]);

    expect(await fs.pathExists(path.join(ws, 'CLAUDE.md'))).toBe(false);
    expect(await fs.readFile(path.join(ws, 'existing.txt'), 'utf8')).toBe(
      'keep me',
    );
    expect(process.exitCode).toBeTruthy();
  });

  it('treats a directory containing only a hidden file as non-empty (FR-004, clarified)', async () => {
    const ws = path.join(tmp, 'ws');
    await fs.ensureDir(ws);
    await fs.writeFile(path.join(ws, '.DS_Store'), '', 'utf8');

    await runInit([ws]);

    expect(await fs.pathExists(path.join(ws, 'CLAUDE.md'))).toBe(false);
    expect(process.exitCode).toBeTruthy();
  });

  it('aborts when the target exists but is not a directory (FR-013)', async () => {
    const filePath = path.join(tmp, 'afile');
    await fs.writeFile(filePath, 'i am a file', 'utf8');

    // Should NOT throw — it should be a clean, handled abort.
    await expect(runInit([filePath])).resolves.toBeUndefined();

    // The existing file is untouched and nothing was scaffolded.
    expect(await fs.readFile(filePath, 'utf8')).toBe('i am a file');
    // Clear, actionable message on stderr + non-zero exit.
    expect(con.errors.join('\n').toLowerCase()).toContain('not a directory');
    expect(process.exitCode).toBeTruthy();
  });
});
