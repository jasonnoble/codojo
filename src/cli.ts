#!/usr/bin/env node
import chalk from 'chalk';
import { runInit } from './commands/init.js';
import { exitCodeForError } from './exitCode.js';

const USAGE = `${chalk.bold('codojo')} — an AI-powered coding dojo for learning new languages

${chalk.bold('Usage')}
  codojo <command> [options]

${chalk.bold('Commands')}
  init [dir]    Scaffold a new learning workspace (default: ~/workspace/codojo)
  help          Show this help

After ${chalk.cyan('codojo init')}, change into the workspace and run ${chalk.cyan('claude')} to begin.`;

async function main(): Promise<void> {
  const [command, ...rest] = process.argv.slice(2);

  switch (command) {
    case 'init':
      await runInit(rest);
      break;
    case undefined:
    case 'help':
    case '--help':
    case '-h':
      console.log(USAGE);
      break;
    default:
      console.error(chalk.red(`Unknown command: ${command}\n`));
      console.log(USAGE);
      process.exitCode = 1;
  }
}

main().catch((err: unknown) => {
  const code = exitCodeForError(err);
  if (code === 130) {
    // @inquirer throws ExitPromptError when the user hits Ctrl-C at a prompt.
    console.log(chalk.dim('\nCancelled.'));
  } else {
    console.error(chalk.red(err instanceof Error ? err.message : String(err)));
  }
  process.exit(code);
});
