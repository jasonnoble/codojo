/**
 * Shared types for codojo.
 *
 * These describe the shape of the learner data that lives in the workspace
 * (`profile.md` / `goals.md`). The `init` command does not populate them — the
 * mentor-mode Claude Code session does, during onboarding — but they document
 * the contract and will back a future `update` command.
 */

/** A programming language the learner already knows, with rough experience. */
export interface KnownLanguage {
  /** Language or stack name, e.g. "Ruby", "TypeScript". */
  name: string;
  /** Approximate years of professional/serious experience. */
  yearsOfExperience: number;
}

/** Everything codojo knows about the learner. Mirrors `profile.md`. */
export interface LearnerProfile {
  name: string;
  /** Languages/stacks the learner is already comfortable in. */
  knownLanguages: KnownLanguage[];
  /** What they are here to learn, e.g. "Go", "Next.js (App Router)". */
  targetLanguage: string;
  /** Free-form description of what success looks like for them. */
  learningGoals: string;
  /** Optional public LinkedIn profile URL, used as background. */
  linkedInUrl?: string;
  /** Optional path (inside the workspace) to a resume the mentor may read. */
  resumePath?: string;
  /** Optional GitHub username, used to analyze existing repos. */
  githubUsername?: string;
  /** Whether the in-session onboarding interview has been completed. */
  onboarded: boolean;
}

/** Resolved configuration for a single codojo workspace. */
export interface WorkspaceConfig {
  /** Absolute path to the workspace root. */
  workspacePath: string;
  profile: LearnerProfile;
  /** Free-form learning goals (mirrors `goals.md`). */
  goals: string;
}

/** Options chosen at `init` time that influence the generated workspace. */
export interface WorkspaceOptions {
  /** Opt in to read-only GitHub CLI (`gh`) access for the mentor. Default false. */
  allowGhCli?: boolean;
}

/** Default {@link WorkspaceOptions}: every opt-in capability off. */
export const DEFAULT_WORKSPACE_OPTIONS: Required<WorkspaceOptions> = {
  allowGhCli: false,
};
