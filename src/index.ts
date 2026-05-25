/**
 * Public module entry point for codojo.
 *
 * The primary interface is the `codojo` CLI (see `cli.ts`); this module exposes
 * the pieces programmatic consumers may want.
 */
export { runInit } from './commands/init.js';
export { workspaceFiles, type WorkspaceFile } from './templates/index.js';
export { expandHome } from './utils.js';
export type {
  LearnerProfile,
  KnownLanguage,
  WorkspaceConfig,
} from './types/index.js';
