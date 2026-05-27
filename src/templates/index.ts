/**
 * The codojo workspace manifest: the single source of truth for which files
 * `init` writes and what goes in them. `init` derives the directory structure
 * from these paths, so adding a file here is all it takes to scaffold it.
 */
import { settingsJson } from './settings.js';
import { profileMd, goalsMd } from './profile.js';
import type { WorkspaceOptions } from '../types/index.js';
import { quizHistoryMd, conceptMapMd } from './mentorNotes.js';
import {
  rootClaudeMd,
  notesClaudeMd,
  projectsClaudeMd,
  sessionsClaudeMd,
  topicsClaudeMd,
} from './claude.js';

/** A single file to write into the workspace, relative to its root. */
export interface WorkspaceFile {
  /** Path relative to the workspace root, using POSIX separators. */
  path: string;
  /** Full file contents. */
  content: string;
}

/** Every file `init` writes into a fresh workspace. */
export function workspaceFiles(
  options: WorkspaceOptions = {},
): WorkspaceFile[] {
  return [
    { path: 'CLAUDE.md', content: rootClaudeMd() },
    { path: '.claude/settings.json', content: settingsJson(options) },
    { path: 'profile.md', content: profileMd() },
    { path: 'goals.md', content: goalsMd() },
    { path: 'notes/CLAUDE.md', content: notesClaudeMd() },
    { path: 'projects/CLAUDE.md', content: projectsClaudeMd() },
    { path: 'mentor_notes/sessions/CLAUDE.md', content: sessionsClaudeMd() },
    { path: 'mentor_notes/topics/CLAUDE.md', content: topicsClaudeMd() },
    { path: 'mentor_notes/quiz_history.md', content: quizHistoryMd() },
    { path: 'mentor_notes/concept_map.md', content: conceptMapMd() },
  ];
}
