<!-- SPECKIT START -->
For additional context about technologies to be used, project structure,
shell commands, and other important information, read the current plan:
`specs/20260527-105013-sandbox-isolation/plan.md`

Active feature: **Sandbox-Based Workspace Isolation & Opt-In GitHub CLI Access**
(branch `20260527-105013-sandbox-isolation`). Replaces the no-op `Read(../**)`
deny rule with an OS-level Claude Code `sandbox` block, and adds an opt-in
`--allow-gh-cli` flag (closed read-only `gh` allow-list + `excludedCommands`).
Stack: TypeScript (strict), ESM, Node ≥ 20, @inquirer/prompts, chalk, fs-extra;
tests with Jest + ts-jest (ESM). Build: `npm run build` (tsc). Test: `npm test`.
Governed by `.specify/memory/constitution.md` (v1.1.1) — note Principle IX
(TDD): tests before implementation. Open spike: `excludedCommands` matching
semantics are undocumented — see plan research R4 before relying on the gh
exception.
<!-- SPECKIT END -->
