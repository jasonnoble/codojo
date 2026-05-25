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
import { workspaceFiles } from '../templates/index.js';
import {
  makeTempDir,
  removeTempDir,
  captureConsole,
  type ConsoleCapture,
} from './helpers.js';

describe('runInit — scaffolding a fresh workspace (US1)', () => {
  let tmp: string;
  let ws: string;
  let con: ConsoleCapture;

  beforeEach(async () => {
    tmp = await makeTempDir();
    ws = path.join(tmp, 'ws'); // a fresh, non-existent target
    con = captureConsole();
    process.exitCode = undefined;
  });

  afterEach(async () => {
    con.restore();
    process.exitCode = undefined;
    await removeTempDir(tmp);
  });

  it('creates the full tree and writes all manifest files (FR-005)', async () => {
    await runInit([ws]);
    for (const f of workspaceFiles()) {
      expect(await fs.pathExists(path.join(ws, f.path))).toBe(true);
    }
    expect(process.exitCode).toBeFalsy();
  });

  it('writes non-empty content to every file (FR-006)', async () => {
    await runInit([ws]);
    for (const f of workspaceFiles()) {
      const content = await fs.readFile(path.join(ws, f.path), 'utf8');
      expect(content.length).toBeGreaterThan(0);
    }
  });

  it('prints the success output in the documented order (FR-009)', async () => {
    await runInit([ws]);
    const logs = con.logs;
    const manifest = workspaceFiles().map((f) => f.path);

    // 1) scaffolding header naming the path
    expect(logs[0]).toContain('Scaffolding workspace at');
    expect(logs[0]).toContain(ws);

    // 2) one "+ <file>" line per manifest entry, in manifest order
    manifest.forEach((p, i) => {
      expect(logs[1 + i]).toContain(`+ ${p}`);
    });

    // 3) readiness line, then 4) the cd/run-claude instruction — last, in order
    const ready = logs[1 + manifest.length];
    const instruction = logs[2 + manifest.length];
    expect(ready).toContain('✓ Your codojo is ready.');
    expect(instruction).toContain(ws);
    expect(instruction).toContain('claude');
  });
});
