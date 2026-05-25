/**
 * Map a thrown error to the process exit code codojo should terminate with.
 *
 * `@inquirer/prompts` throws an `ExitPromptError` when the user cancels a prompt
 * with Ctrl-C; that is a clean cancellation, which by convention exits `130`.
 * Every other error is a genuine failure and exits `1`.
 */
export function exitCodeForError(err: unknown): number {
  if (err instanceof Error && err.name === 'ExitPromptError') {
    return 130;
  }
  return 1;
}
