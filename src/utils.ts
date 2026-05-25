import os from 'node:os';
import path from 'node:path';

/**
 * Expand a leading `~` (or `~/...`) to the user's home directory and return an
 * absolute, normalized path. Anything else is resolved against the cwd.
 */
export function expandHome(input: string): string {
  const trimmed = input.trim();
  if (trimmed === '~') return os.homedir();
  if (trimmed.startsWith('~/')) {
    return path.join(os.homedir(), trimmed.slice(2));
  }
  return path.resolve(trimmed);
}
