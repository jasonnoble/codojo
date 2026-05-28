<!-- SPECKIT START -->
For additional context about technologies to be used, project structure,
shell commands, and other important information, read the current plan:
`specs/20260525-192407-onboarding-background-options/plan.md`

Active feature: **Onboarding Background — Sharing Options**
(branch `20260525-192407-onboarding-background-options`). Replaces the LinkedIn
onboarding step with a multi-select background checklist (resume / GitHub /
website / something else); edits live in `src/templates/claude.ts`,
`src/templates/profile.ts`, `src/types/index.ts`, tested via
`src/__tests__/templates.test.ts`. Stack: TypeScript (strict), ESM, Node ≥ 20,
@inquirer/prompts, chalk, fs-extra; tests with Jest + ts-jest (ESM). Build:
`npm run build` (tsc). Test: `npm test`. Governed by
`.specify/memory/constitution.md` (v1.1.1) — note Principle IX (TDD): tests
before implementation.
<!-- SPECKIT END -->
