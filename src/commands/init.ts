import path from 'node:path';
import { input } from '@inquirer/prompts';
import chalk from 'chalk';
import fs from 'fs-extra';
import { expandHome } from '../utils.js';
import { workspaceFiles } from '../templates/index.js';

const DEFAULT_WORKSPACE = '~/workspace/codojo';

/** Returns true if `dir` exists and contains at least one entry. */
async function isNonEmptyDir(dir: string): Promise<boolean> {
  if (!(await fs.pathExists(dir))) return false;
  const entries = await fs.readdir(dir);
  return entries.length > 0;
}

/**
 * `codojo init [dir]` — scaffold a fresh learning workspace.
 *
 * Sets up the directory structure only; the actual onboarding interview runs
 * later, inside the mentor-mode Claude Code session (driven by the generated
 * `CLAUDE.md`). Aborts if the target workspace already exists and is non-empty.
 *
 * @param argv extra CLI args after the `init` subcommand: the first non-flag arg
 *             is the workspace directory; `--allow-gh-cli` opts into read-only
 *             GitHub CLI access (recognized in any position).
 */
export async function runInit(argv: string[] = []): Promise<void> {
  const allowGhCli = argv.includes('--allow-gh-cli');
  const provided = argv.find((arg) => !arg.startsWith('--'));
  const raw =
    provided ??
    (await input({
      message: 'Where should your codojo workspace live?',
      default: DEFAULT_WORKSPACE,
    }));

  const workspace = expandHome(raw);

  if (await fs.pathExists(workspace)) {
    const stats = await fs.stat(workspace);
    if (!stats.isDirectory()) {
      console.error(
        chalk.red(`\n✗ ${workspace} already exists and is not a directory.`),
      );
      console.error(
        chalk.dim('  Pick a different path for your codojo workspace.'),
      );
      process.exitCode = 1;
      return;
    }
  }

  if (await isNonEmptyDir(workspace)) {
    console.error(
      chalk.red(`\n✗ ${workspace} already exists and is not empty.`),
    );
    console.error(
      chalk.dim(
        '  codojo will not touch an existing workspace. Pick a new path, or\n' +
          '  remove the directory first. (An `update` command is coming later.)',
      ),
    );
    process.exitCode = 1;
    return;
  }

  console.log(chalk.dim(`\nScaffolding workspace at ${workspace} …`));

  for (const file of workspaceFiles({ allowGhCli })) {
    const dest = path.join(workspace, file.path);
    await fs.ensureDir(path.dirname(dest));
    await fs.writeFile(dest, file.content, 'utf8');
    console.log(chalk.green('  +') + ` ${file.path}`);
  }

  console.log(chalk.bold.green('\n✓ Your codojo is ready.\n'));
  console.log(
    `Change into the ${chalk.cyan(workspace)} directory and run ${chalk.cyan(
      'claude',
    )} to start learning something new.`,
  );
}
