import {
  jest,
  describe,
  it,
  expect,
  beforeEach,
  afterEach,
} from '@jest/globals';
import path from 'node:path';
import fs from 'fs-extra';
import {
  makeTempDir,
  removeTempDir,
  captureConsole,
  type ConsoleCapture,
} from './helpers.js';

// Mock the interactive prompt BEFORE importing the module under test (ESM).
const input =
  jest.fn<(opts: { message: string; default?: string }) => Promise<string>>();
jest.unstable_mockModule('@inquirer/prompts', () => ({ input }));

const { runInit } = await import('../commands/init.js');

describe('runInit — flexible, interruptible invocation (US3)', () => {
  let tmp: string;
  let con: ConsoleCapture;

  beforeEach(async () => {
    tmp = await makeTempDir();
    con = captureConsole();
    process.exitCode = undefined;
    input.mockReset();
  });

  afterEach(async () => {
    con.restore();
    process.exitCode = undefined;
    await removeTempDir(tmp);
  });

  it('uses the path argument and does not prompt (FR-001)', async () => {
    const ws = path.join(tmp, 'ws');
    await runInit([ws]);
    expect(input).not.toHaveBeenCalled();
    expect(await fs.pathExists(path.join(ws, 'CLAUDE.md'))).toBe(true);
  });

  it('prompts with the default workspace when no arg is given (FR-002)', async () => {
    const ws = path.join(tmp, 'prompted');
    input.mockResolvedValueOnce(ws);

    await runInit([]);

    expect(input).toHaveBeenCalledTimes(1);
    expect(input.mock.calls[0]?.[0]?.default).toBe('~/workspace/codojo');
    expect(await fs.pathExists(path.join(ws, 'CLAUDE.md'))).toBe(true);
  });

  it('writes nothing when the prompt is cancelled with Ctrl-C (FR-011)', async () => {
    const err = new Error('User force closed the prompt');
    err.name = 'ExitPromptError';
    input.mockRejectedValueOnce(err);

    await expect(runInit([])).rejects.toMatchObject({
      name: 'ExitPromptError',
    });
    // Nothing scaffolded anywhere in the temp area.
    expect(await fs.readdir(tmp)).toHaveLength(0);
  });

  it('surfaces the OS error when the target cannot be created (FR-012)', async () => {
    const ro = path.join(tmp, 'ro');
    await fs.ensureDir(ro);
    await fs.chmod(ro, 0o500); // read+execute, no write
    const ws = path.join(ro, 'ws');

    try {
      await expect(runInit([ws])).rejects.toThrow();
    } finally {
      await fs.chmod(ro, 0o700); // restore so cleanup can remove it
    }
  });
});

describe('runInit — --allow-gh-cli opt-in flag (US2 / FR-007, FR-008)', () => {
  let tmp: string;
  let con: ConsoleCapture;

  beforeEach(async () => {
    tmp = await makeTempDir();
    con = captureConsole();
    process.exitCode = undefined;
    input.mockReset();
  });

  afterEach(async () => {
    con.restore();
    process.exitCode = undefined;
    await removeTempDir(tmp);
  });

  const settingsOf = (ws: string): Promise<string> =>
    fs.readFile(path.join(ws, '.claude', 'settings.json'), 'utf8');

  it('enables read-only gh when the flag precedes the dir, not treating it as the path (FR-008)', async () => {
    const ws = path.join(tmp, 'a');
    await runInit(['--allow-gh-cli', ws]);
    expect(await fs.pathExists(path.join(ws, 'CLAUDE.md'))).toBe(true);
    const s = await settingsOf(ws);
    expect(s).toContain('Bash(gh pr view:*)');
    expect(s).toContain('"excludedCommands"');
  });

  it('enables gh when the flag follows the dir (FR-008)', async () => {
    const ws = path.join(tmp, 'b');
    await runInit([ws, '--allow-gh-cli']);
    expect(await settingsOf(ws)).toContain('Bash(gh pr view:*)');
  });

  it('blocks gh by default when the flag is absent (FR-007)', async () => {
    const ws = path.join(tmp, 'c');
    await runInit([ws]);
    const s = await settingsOf(ws);
    expect(s).not.toContain('Bash(gh');
    expect(s).not.toContain('excludedCommands');
  });

  it('still prompts for the dir when only the flag is given (FR-008)', async () => {
    const ws = path.join(tmp, 'prompted');
    input.mockResolvedValueOnce(ws);
    await runInit(['--allow-gh-cli']);
    expect(input).toHaveBeenCalledTimes(1);
    expect(await fs.pathExists(path.join(ws, 'CLAUDE.md'))).toBe(true);
  });
});
