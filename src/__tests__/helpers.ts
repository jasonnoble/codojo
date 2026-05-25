/**
 * Shared test helpers. NOT a test suite (jest `testMatch` only runs `*.test.ts`),
 * so this file is importable from tests without being executed on its own.
 */
import os from 'node:os';
import path from 'node:path';
import fs from 'fs-extra';
import { jest } from '@jest/globals';

/** Create a unique empty temp directory and return its absolute path. */
export async function makeTempDir(): Promise<string> {
  return fs.mkdtemp(path.join(os.tmpdir(), 'codojo-test-'));
}

/** Remove a temp directory tree created by {@link makeTempDir}. */
export async function removeTempDir(dir: string): Promise<void> {
  await fs.remove(dir);
}

// Matches ANSI SGR escape sequences emitted by chalk.
// eslint-disable-next-line no-control-regex
const ANSI = /\x1b\[[0-9;]*m/g;

/** Strip chalk/ANSI color codes so output assertions are stable. */
export function stripAnsi(value: string): string {
  return value.replace(ANSI, '');
}

export interface ConsoleCapture {
  /** Lines passed to console.log, ANSI-stripped, in call order. */
  readonly logs: string[];
  /** Lines passed to console.error, ANSI-stripped, in call order. */
  readonly errors: string[];
  /** Restore the original console methods. Call in afterEach/finally. */
  restore(): void;
}

/**
 * Spy on console.log / console.error, recording each call's joined+stripped
 * output. Call `restore()` when done.
 */
export function captureConsole(): ConsoleCapture {
  const logs: string[] = [];
  const errors: string[] = [];

  const toLine = (args: unknown[]): string =>
    stripAnsi(args.map((a) => String(a)).join(' '));

  const logSpy = jest
    .spyOn(console, 'log')
    .mockImplementation((...args: unknown[]) => {
      logs.push(toLine(args));
    });
  const errSpy = jest
    .spyOn(console, 'error')
    .mockImplementation((...args: unknown[]) => {
      errors.push(toLine(args));
    });

  return {
    logs,
    errors,
    restore() {
      logSpy.mockRestore();
      errSpy.mockRestore();
    },
  };
}
